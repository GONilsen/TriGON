"""Position engine: trilateration of Bermuda distances plus fingerprinting (pure Python, no HA dependency)."""

from __future__ import annotations

import math
from dataclasses import dataclass, field


@dataclass
class Scanner:
    address: str
    name: str
    floor: str
    x: float
    y: float
    z: float  # absolute height (floor level + height above floor)
    room: str | None = None  # room the scanner is in
    room_explicit: bool = False  # True when the room is set explicitly


@dataclass
class Room:
    id: str
    name: str
    floor: str
    polygon: list[tuple[float, float]]
    area: str | None = None


@dataclass
class Floor:
    id: str
    name: str
    level: float  # floor level in metres
    rooms: list[Room] = field(default_factory=list)


@dataclass
class Obs:
    scanner: Scanner
    distance: float
    other_floor_distance: float | None = None  # distance if the phone is NOT on the scanner's floor (floor attenuation removed)

    def dist_for(self, floor_id: str) -> float:
        if self.other_floor_distance is not None and self.scanner.floor != floor_id:
            return self.other_floor_distance
        return self.distance


@dataclass
class Settings:
    phone_height: float = 1.0  # phone height above the floor
    max_distance: float = 15.0  # distances above this are ignored
    other_floor_weight: float = 0.5  # weight for scanners on other floors
    smoothing: float = 0.5  # 0 = no smoothing, close to 1 = heavy smoothing
    floor_confirm: int = 3  # rounds a new floor must persist before switching
    room_confirm: int = 4  # rounds a new room must persist before switching
    snap_distance: float = 3.0  # a nearest scanner closer than this may pull the room to itself
    snap_margin: float = 1.0  # ... when the point is this close to the scanner's room
    fp_k: int = 3  # number of fingerprint neighbours
    fp_good: float = 6.0  # dB: below this, full fingerprint weight
    fp_bad: float = 16.0  # dB: above this, fingerprints are ignored
    fp_blend: float = 0.7  # share of fingerprint position at full weight


@dataclass
class Fingerprint:
    floor: str
    x: float
    y: float
    room: str | None
    rssi: dict[str, float]  # normalised (phone offset subtracted)


FP_MISSING = -100.0


def fp_distance(a: dict[str, float], b: dict[str, float]) -> float:
    keys = set(a) | set(b)
    if not keys:
        return 99.0
    return math.sqrt(sum((a.get(k, FP_MISSING) - b.get(k, FP_MISSING)) ** 2 for k in keys) / len(keys))


def knn(live: dict[str, float], fps: list[Fingerprint], k: int = 3):
    """Return [(weight, fingerprint)] for the k nearest, and the best distance (dB)."""
    if not live or not fps:
        return [], 99.0
    nb = sorted(((fp_distance(live, f.rssi), f) for f in fps), key=lambda t: t[0])[:k]
    return [(1.0 / (d + 1.0), f) for d, f in nb], nb[0][0]


@dataclass
class Result:
    floor: str
    x: float
    y: float
    accuracy: float
    room: Room | None
    nearest: Scanner
    used: int
    fp_weight: float = 0.0  # 0 = trilateration only, 1 = full fingerprint weight


def point_in_polygon(x: float, y: float, poly: list[tuple[float, float]]) -> bool:
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def _closest_on_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    l2 = dx * dx + dy * dy
    t = 0.0 if l2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / l2))
    return ax + t * dx, ay + t * dy


def closest_point_in_polygon(x, y, poly):
    """Return (point, distance). The point is (x, y) itself if it is inside the polygon."""
    if point_in_polygon(x, y, poly):
        return (x, y), 0.0
    best, bd = None, math.inf
    n = len(poly)
    for i in range(n):
        cx, cy = _closest_on_segment(x, y, *poly[i], *poly[(i + 1) % n])
        d = math.hypot(cx - x, cy - y)
        if d < bd:
            best, bd = (cx, cy), d
    return best, bd


def solve(obs: list[Obs], z: float, floor_id: str, s: Settings) -> tuple[float, float, float]:
    """Weighted least squares (damped Gauss-Newton) in the plane z = constant.

    Returns x, y and the weighted RMS residual (metres).
    """
    pts = []
    for o in obs:
        d = o.dist_for(floor_id)
        w = 1.0 / max(d, 1.0) ** 2
        if o.scanner.floor != floor_id:
            w *= s.other_floor_weight
        pts.append((o.scanner.x, o.scanner.y, o.scanner.z, d, w))

    # Start at the weighted centroid of scanners on the same floor (otherwise all)
    same = [p for p, o in zip(pts, obs) if o.scanner.floor == floor_id] or pts
    sw = sum(p[4] for p in same)
    x = sum(p[0] * p[4] for p in same) / sw
    y = sum(p[1] * p[4] for p in same) / sw

    if len(pts) == 1:
        return x, y, max(pts[0][3], 1.0)

    lam = 0.1
    def cost(cx, cy):
        c = 0.0
        for sx, sy, sz, d, w in pts:
            r = math.sqrt((cx - sx) ** 2 + (cy - sy) ** 2 + (z - sz) ** 2) - d
            c += w * r * r
        return c

    c0 = cost(x, y)
    for _ in range(30):
        # J^T W J and J^T W r for 2 unknowns
        a11 = a12 = a22 = b1 = b2 = 0.0
        for sx, sy, sz, d, w in pts:
            dx, dy, dz = x - sx, y - sy, z - sz
            rng = math.sqrt(dx * dx + dy * dy + dz * dz) or 1e-6
            r = rng - d
            jx, jy = dx / rng, dy / rng
            a11 += w * jx * jx
            a12 += w * jx * jy
            a22 += w * jy * jy
            b1 += w * jx * r
            b2 += w * jy * r
        a11 *= 1 + lam
        a22 *= 1 + lam
        det = a11 * a22 - a12 * a12
        if abs(det) < 1e-12:
            break
        sx_ = -(a22 * b1 - a12 * b2) / det
        sy_ = -(-a12 * b1 + a11 * b2) / det
        nx, ny = x + sx_, y + sy_
        c1 = cost(nx, ny)
        if c1 < c0:
            x, y, c0 = nx, ny, c1
            lam = max(lam / 3, 1e-4)
            if math.hypot(sx_, sy_) < 0.01:
                break
        else:
            lam *= 4
            if lam > 1e4:
                break

    wsum = sum(p[4] for p in pts)
    rms = math.sqrt(c0 / wsum) if wsum else 99.0
    return x, y, rms


@dataclass
class Tracker:
    """Per-person state between rounds (smoothing and hysteresis)."""

    floor: str | None = None
    floor_cand: str | None = None
    floor_cnt: int = 0
    room: Room | None = None
    room_cand: str | None = None
    room_cnt: int = 0
    x: float | None = None
    y: float | None = None

    def update(self, obs: list[Obs], floors: dict[str, Floor], s: Settings,
               hint_floor: str | None = None, live_rssi: dict[str, float] | None = None,
               fingerprints: list[Fingerprint] | None = None) -> Result | None:
        obs = [o for o in obs if o.distance is not None and 0 < o.distance <= s.max_distance]
        if not obs:
            return None
        nearest = min(obs, key=lambda o: o.distance)

        # Fingerprints: neighbours and a weight based on how well the best neighbour matches
        nb, best = knn(live_rssi or {}, fingerprints or [], s.fp_k)
        wk = 0.0 if not nb else max(0.0, min(1.0, (s.fp_bad - best) / (s.fp_bad - s.fp_good)))
        fp_floor = None
        if wk > 0:
            fv: dict[str, float] = {}
            for w, f in nb:
                fv[f.floor] = fv.get(f.floor, 0.0) + w
            top = max(fv, key=fv.get)
            if fv[top] / sum(fv.values()) >= 0.6:
                fp_floor = top

        # Floor: try each floor with a scanner among the nearest and pick the best-fitting one
        # (lowest residual). The current floor and Bermuda's suggestion get a small bonus. Switching needs hysteresis.
        cands = {o.scanner.floor for o in obs if o.distance <= nearest.distance + 3.0}
        if self.floor:
            cands.add(self.floor)
        flat = Settings(**{**s.__dict__, "other_floor_weight": 1.0})
        scores = {}
        for fid in cands:
            if fid not in floors:
                continue
            _, _, rms = solve(obs, floors[fid].level + s.phone_height, fid, flat)
            if fid == self.floor:
                rms *= 0.85
            if fid == hint_floor:
                rms *= 0.95
            scores[fid] = rms
        cand = min(scores, key=scores.get) if scores else nearest.scanner.floor
        # Fingerprints may only choose the floor when the floor trilateration points to also has points;
        # otherwise points on one floor would pull everyone there.
        fp_floors = {f.floor for f in (fingerprints or [])}
        if fp_floor is not None and fp_floor != cand and (
                (cand in fp_floors and wk >= 0.5) or wk >= 0.9):
            cand = fp_floor
        if self.floor is None:
            self.floor = cand
        elif cand != self.floor:
            if cand == self.floor_cand:
                self.floor_cnt += 1
            else:
                self.floor_cand, self.floor_cnt = cand, 1
            if self.floor_cnt >= s.floor_confirm:
                self.floor, self.floor_cand, self.floor_cnt = cand, None, 0
                self.x = self.y = None
                self.room, self.room_cand, self.room_cnt = None, None, 0
        else:
            self.floor_cand, self.floor_cnt = None, 0

        fl = floors[self.floor]
        z = fl.level + s.phone_height
        x, y, rms = solve(obs, z, fl.id, s)
        same = [(w, f) for w, f in nb if f.floor == fl.id] if wk > 0 else []
        if same:
            sw = sum(w for w, _ in same)
            kx = sum(w * f.x for w, f in same) / sw
            ky = sum(w * f.y for w, f in same) / sw
            a = s.fp_blend * wk
            x, y = (1 - a) * x + a * kx, (1 - a) * y + a * ky

        # Keep the point within the rooms of the floor
        if fl.rooms:
            best, bd = None, math.inf
            for r in fl.rooms:
                p, d = closest_point_in_polygon(x, y, r.polygon)
                if d < bd:
                    best, bd = p, d
                if d == 0:
                    break
            x, y = best

        # Smoothing
        if self.x is not None:
            a = s.smoothing
            x = a * self.x + (1 - a) * x
            y = a * self.y + (1 - a) * y
        self.x, self.y = x, y

        # Room with hysteresis
        room = None
        for r in fl.rooms:
            if point_in_polygon(x, y, r.polygon):
                room = r
                break
        if room is None and fl.rooms:
            room = min(fl.rooms, key=lambda r: closest_point_in_polygon(x, y, r.polygon)[1])
        # The nearest scanner on the same floor pulls the room to itself when the point is close by
        near = min((o for o in obs if o.scanner.floor == fl.id), key=lambda o: o.distance, default=None)
        if near is not None and near.distance < s.snap_distance and near.scanner.room:
            sroom = next((r for r in fl.rooms if r.id == near.scanner.room), None)
            if sroom is not None and room is not sroom:
                if closest_point_in_polygon(x, y, sroom.polygon)[1] <= s.snap_margin:
                    room = sroom
        if same and room is not None:
            votes: dict[str, float] = {}
            for w, f in same:
                if f.room:
                    votes[f.room] = votes.get(f.room, 0.0) + w * wk
            votes[room.id] = votes.get(room.id, 0.0) + 0.5 * (sum(w for w, _ in same) / len(same))
            rid = max(votes, key=votes.get)
            room = next((r for r in fl.rooms if r.id == rid), room)
        if self.room is None or room is None or self.room.floor != fl.id:
            self.room, self.room_cand, self.room_cnt = room, None, 0
        elif room.id != self.room.id:
            if room.id == self.room_cand:
                self.room_cnt += 1
            else:
                self.room_cand, self.room_cnt = room.id, 1
            if self.room_cnt >= s.room_confirm:
                self.room, self.room_cand, self.room_cnt = room, None, 0
        else:
            self.room_cand, self.room_cnt = None, 0

        # The dot must lie in the room that is shown (fingerprint votes or hysteresis may pick another room
        # than the raw x/y). Pull it just inside that room's polygon.
        if self.room is not None and not point_in_polygon(x, y, self.room.polygon):
            (px, py), _ = closest_point_in_polygon(x, y, self.room.polygon)
            cx = sum(p[0] for p in self.room.polygon) / len(self.room.polygon)
            cy = sum(p[1] for p in self.room.polygon) / len(self.room.polygon)
            ix, iy = px + 0.08 * (cx - px), py + 0.08 * (cy - py)
            if point_in_polygon(ix, iy, self.room.polygon):
                px, py = ix, iy
            x, y = px, py

        return Result(fl.id, x, y, max(rms, 0.5), self.room, nearest.scanner, len(obs), round(wk, 2))

    def reset(self):
        self.__init__()
