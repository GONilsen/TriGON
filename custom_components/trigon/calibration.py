"""Calibration: measurement points with known position, per-scanner RSSI→distance fit and per-room quality.

Model per scanner:  rssi = A - 10·n·log10(d) + offset(person)
A = signal at 1 m, n = path loss exponent. The reference phone (most points) has offset 0.
"""

from __future__ import annotations

import math
import statistics
import time
import uuid
from dataclasses import dataclass, field

from .engine import Fingerprint, Obs, Settings, Tracker, point_in_polygon
from .model import Model

N_DEFAULT = 3.0
N_MIN, N_MAX = 1.5, 5.0
A_MIN, A_MAX = -95.0, -25.0
MIN_SAMPLES = 3  # per scanner per point
F_MIN, F_MAX = 0.0, 15.0  # extra loss (dB) through a floor slab
F_MIN_POINTS = 3  # points on each side (same floor / other floor) needed to fit F


def _median(v):
    return statistics.median(v) if v else None


def _lstsq(X: list[list[float]], y: list[float]) -> list[float] | None:
    """Least squares via the normal equations (2–3 unknowns)."""
    k = len(X[0])
    M = [[sum(r[i] * r[j] for r in X) for j in range(k)] + [sum(r[i] * t for r, t in zip(X, y))] for i in range(k)]
    for i in range(k):
        piv = max(range(i, k), key=lambda r: abs(M[r][i]))
        M[i], M[piv] = M[piv], M[i]
        if abs(M[i][i]) < 1e-9:
            return None
        for r in range(k):
            if r != i:
                f = M[r][i] / M[i][i]
                M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    return [M[i][k] / M[i][i] for i in range(k)]


@dataclass
class Session:
    person: str
    floor: str
    x: float
    y: float
    start: float  # monotonic
    end: float
    samples: dict[str, list[float]] = field(default_factory=dict)
    seen: dict[str, float] = field(default_factory=dict)


class Calibration:
    def __init__(self, store) -> None:
        self.store = store
        self.data: dict = {"points": [], "scanners": {}, "persons": {}, "enabled": True, "fit": None}
        self.session: Session | None = None
        self.last_point: dict | None = None
        self._fps: list[Fingerprint] | None = None

    async def async_load(self) -> None:
        d = await self.store.async_load()
        if d:
            self.data.update(d)

    def save(self) -> None:
        self.store.async_delay_save(lambda: self.data, 2)

    # ---------- measuring ----------
    def start(self, person: str, floor: str, x: float, y: float, duration: float, now: float) -> None:
        self.session = Session(person, floor, x, y, now, now + duration)
        self.last_point = None

    def cancel(self) -> None:
        self.session = None

    def ingest(self, person: str, dev: dict, scanners: dict, now: float) -> dict | None:
        """Collect new RSSI samples for the person being calibrated. Returns the point when the measurement is done."""
        s = self.session
        if s is None or s.person != person:
            return None
        for key, adv in (dev.get("adverts") or {}).items():
            addr = str(adv.get("scanner_address", "")).lower()
            if addr not in scanners:
                continue
            stamps = adv.get("hist_stamp") or []
            rssis = adv.get("hist_rssi") or []
            last = s.seen.get(key, s.start)
            newest = last
            for st, r in zip(stamps, rssis):
                if isinstance(st, (int, float)) and isinstance(r, (int, float)) and last < st <= s.end:
                    s.samples.setdefault(addr, []).append(float(r))
                    newest = max(newest, st)
            s.seen[key] = newest
        if now < s.end:
            return None
        point = {
            "id": uuid.uuid4().hex[:10],
            "person": s.person,
            "floor": s.floor,
            "x": round(s.x, 2),
            "y": round(s.y, 2),
            "ts": time.time(),
            "rssi": {a: round(_median(v), 1) for a, v in s.samples.items() if len(v) >= MIN_SAMPLES},
            "count": {a: len(v) for a, v in s.samples.items()},
        }
        self.session = None
        self.last_point = point
        if point["rssi"]:
            self.data["points"].append(point)
            self._fps = None
            self.save()
        return point

    def status(self, now: float) -> dict | None:
        s = self.session
        if s is None:
            return None
        return {"person": s.person, "floor": s.floor, "x": s.x, "y": s.y,
                "remaining": max(0.0, round(s.end - now, 1)), "duration": round(s.end - s.start, 1),
                "counts": {a: len(v) for a, v in s.samples.items()}}

    def delete(self, pid: str) -> None:
        self.data["points"] = [p for p in self.data["points"] if p["id"] != pid]
        self._fps = None
        self.save()

    def set_enabled(self, on: bool) -> None:
        self.data["enabled"] = bool(on)
        self.save()

    # ---------- usage ----------
    @property
    def active(self) -> bool:
        return bool(self.data.get("enabled")) and bool(self.data.get("scanners"))

    def offset(self, person: str) -> float:
        return self.data["persons"].get(person, {}).get("offset", 0.0)

    def _fp(self, model: Model, p: dict) -> Fingerprint:
        rooms = model.floors[p["floor"]].rooms
        room = next((r.id for r in rooms if point_in_polygon(p["x"], p["y"], r.polygon)), None)
        off = self.offset(p["person"])
        return Fingerprint(p["floor"], p["x"], p["y"], room,
                           {a: r - off for a, r in p["rssi"].items() if a in model.scanners}, p["person"])

    def fingerprints(self, model: Model) -> list[Fingerprint]:
        if not self.active:
            return []
        if self._fps is None:
            self._fps = [self._fp(model, p) for p in self.data["points"] if p["floor"] in model.floors]
        return self._fps

    def distance(self, addr: str, person: str, rssi: float, other_floor: bool = False) -> float | None:
        """Distance from RSSI. other_floor=True removes the scanner's floor attenuation (phone on another floor)."""
        p = self.data["scanners"].get(addr)
        if not p:
            return None
        off = self.data["persons"].get(person, {}).get("offset", 0.0)
        f = p.get("F", 0.0) if other_floor else 0.0
        return 10 ** ((p["A"] + off - f - rssi) / (10 * p["n"]))

    def obs(self, scanner, person: str, rssi: float):
        """Observation with distances for both hypotheses (phone on the scanner's floor or not)."""
        d = self.distance(scanner.address.lower(), person, rssi)
        if d is None:
            return None
        p = self.data["scanners"].get(scanner.address.lower(), {})
        d2 = self.distance(scanner.address.lower(), person, rssi, other_floor=True) if p.get("F") else None
        return Obs(scanner, d, d2)

    # ---------- fitting ----------
    def fit(self, model: Model) -> dict:
        pts = [p for p in self.data["points"] if p["floor"] in model.floors]
        if not pts:
            return {"ok": False, "melding": "No measurement points"}
        st = model.settings
        cnt: dict[str, int] = {}
        for p in pts:
            cnt[p["person"]] = cnt.get(p["person"], 0) + 1
        ref = max(cnt, key=cnt.get)

        def true_d(p, sc):
            z = model.floors[p["floor"]].level + st.phone_height
            return max(0.3, math.sqrt((p["x"] - sc.x) ** 2 + (p["y"] - sc.y) ** 2 + (z - sc.z) ** 2))

        scanners: dict[str, dict] = {}
        for addr, sc in model.scanners.items():
            rows = [(math.log10(true_d(p, sc)), p["rssi"][addr], 1.0 if p["floor"] != sc.floor else 0.0)
                    for p in pts if p["person"] == ref and addr in p["rssi"]]
            if not rows:
                continue
            n_other = sum(1 for r in rows if r[2])
            use_f = n_other >= F_MIN_POINTS and len(rows) - n_other >= F_MIN_POINTS
            xs = [a for a, _, _ in rows]
            n, F = N_DEFAULT, 0.0
            if len(rows) >= 3 and statistics.pstdev(xs) > 0.12:
                sol = _lstsq([[1.0, -10 * x, -f] if use_f else [1.0, -10 * x] for x, _, f in rows], [y for _, y, _ in rows])
                if sol:
                    n = min(N_MAX, max(N_MIN, sol[1]))
                    if use_f:
                        F = min(F_MAX, max(F_MIN, sol[2]))
            A = statistics.fmean(y + 10 * n * x + F * f for x, y, f in rows)
            A = min(A_MAX, max(A_MIN, A))
            res = [y - (A - 10 * n * x - F * f) for x, y, f in rows]
            scanners[addr] = {"A": round(A, 2), "n": round(n, 2), "F": round(F, 1), "punkter": len(rows),
                              "rms_db": round(math.sqrt(statistics.fmean(r * r for r in res)), 1),
                              "navn": sc.name}

        persons = {ref: {"offset": 0.0, "punkter": cnt[ref], "referanse": True}}
        for pid in cnt:
            if pid == ref:
                continue
            res = []
            for p in pts:
                if p["person"] != pid:
                    continue
                for addr, r in p["rssi"].items():
                    if addr in scanners and addr in model.scanners:
                        sp, sc = scanners[addr], model.scanners[addr]
                        f = sp.get("F", 0.0) if p["floor"] != sc.floor else 0.0
                        res.append(r - (sp["A"] - f - 10 * sp["n"] * math.log10(true_d(p, sc))))
            if res:
                persons[pid] = {"offset": round(statistics.median(res), 2), "punkter": cnt[pid], "referanse": False}

        self.data["scanners"] = scanners
        self.data["persons"] = persons
        self._fps = None
        quality = self.evaluate(model)
        self.data["fit"] = {"ts": time.time(), "referanse": ref, "kvalitet": quality}
        self.save()
        return {"ok": True, "referanse": ref, "proxyer": scanners, "personer": persons, "kvalitet": quality}

    def evaluate(self, model: Model) -> dict:
        """Test positioning on the measurement points. Each point is tested against fingerprints from the other points (leave-one-out)."""
        rooms_by_floor = {f: model.floors[f].rooms for f in model.floors}
        per_room: dict[str, dict] = {}
        total = hits = 0
        errs = []
        st = Settings(**{**model.settings.__dict__, "floor_confirm": 1, "room_confirm": 1})
        for p in self.data["points"]:
            if p["floor"] not in model.floors:
                continue
            obs = []
            for addr, r in p["rssi"].items():
                sc = model.scanners.get(addr)
                o = self.obs(sc, p["person"], r) if sc else None
                if o is not None:
                    obs.append(o)
            true_room = next((r for r in rooms_by_floor[p["floor"]] if point_in_polygon(p["x"], p["y"], r.polygon)), None)
            rid = true_room.id if true_room else "?"
            pr = per_room.setdefault(rid, {"navn": true_room.name if true_room else "?", "punkter": 0, "treff": 0, "feil_m": []})
            pr["punkter"] += 1
            total += 1
            others = [self._fp(model, q) for q in self.data["points"] if q is not p and q["floor"] in model.floors]
            live = {a: r - self.offset(p["person"]) for a, r in p["rssi"].items() if a in model.scanners}
            res = Tracker().update(obs, model.floors, st, None, live, others) if obs else None
            if res is None:
                continue
            ok = res.room is not None and res.room.id == rid
            e = math.hypot(res.x - p["x"], res.y - p["y"]) if res.floor == p["floor"] else None
            if ok:
                pr["treff"] += 1
                hits += 1
            if e is not None:
                pr["feil_m"].append(e)
                errs.append(e)
        for pr in per_room.values():
            fe = pr.pop("feil_m")
            pr["snitt_feil_m"] = round(statistics.fmean(fe), 2) if fe else None
            pr["treff_pct"] = round(100 * pr["treff"] / pr["punkter"]) if pr["punkter"] else None
        return {"punkter": total, "treff_pct": round(100 * hits / total) if total else None,
                "snitt_feil_m": round(statistics.fmean(errs), 2) if errs else None, "rom": per_room}

    def summary(self) -> dict:
        return {
            "enabled": bool(self.data.get("enabled")),
            "aktiv": self.active,
            "points": [{k: p[k] for k in ("id", "person", "floor", "x", "y", "ts")} | {"proxyer": len(p["rssi"])}
                       for p in self.data["points"]],
            "proxyer": self.data.get("scanners", {}),
            "personer": self.data.get("persons", {}),
            "fit": self.data.get("fit"),
        }
