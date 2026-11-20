"""Builds the model (floors, scanners, rooms, persons) from the configuration, and reads Bermuda dumps."""

from __future__ import annotations

from dataclasses import dataclass

from .engine import Floor, Obs, Room, Scanner, Settings, point_in_polygon


@dataclass
class Person:
    id: str
    name: str
    bermuda: str


@dataclass
class Model:
    floors: dict[str, Floor]
    scanners: dict[str, Scanner]  # key = lower-case MAC
    rooms: list[Room]
    persons: list[Person]
    settings: Settings
    update_interval: float
    away_after: float


def build_model(conf: dict) -> Model:
    floors = {
        fid: Floor(fid, str(f.get("name", fid)), float(f.get("level", 0)))
        for fid, f in (conf.get("floors") or {}).items()
    }
    scanners = {}
    for s in conf.get("scanners") or []:
        fl = floors[s["floor"]]
        addr = s["address"].lower()
        scanners[addr] = Scanner(addr, s.get("name", addr), fl.id, float(s["x"]), float(s["y"]),
                                 fl.level + float(s.get("z", 2.4)), s.get("room"), bool(s.get("room")))
    rooms = []
    for r in conf.get("rooms") or []:
        room = Room(r["id"], r.get("name", r["id"]), r["floor"],
                    [(float(p[0]), float(p[1])) for p in r["polygon"]], r.get("area"))
        floors[room.floor].rooms.append(room)
        rooms.append(room)
    persons = [Person(p["id"], p.get("name", p["id"]), p["bermuda"].lower()) for p in conf.get("persons") or []]
    st = Settings()
    for k in ("phone_height", "max_distance", "other_floor_weight", "smoothing", "snap_distance", "snap_margin"):
        if k in conf:
            setattr(st, k, float(conf[k]))
    for k in ("floor_confirm", "room_confirm"):
        if k in conf:
            setattr(st, k, int(conf[k]))
    for sc in scanners.values():
        if sc.room is None:
            for r in floors[sc.floor].rooms:
                if point_in_polygon(sc.x, sc.y, r.polygon):
                    sc.room = r.id
                    break
    return Model(floors, scanners, rooms, persons, st,
                 float(conf.get("update_interval", 5)), float(conf.get("away_after", 120)))


def observations(dev: dict, scanners: dict[str, Scanner], now: float, max_age: float = 15.0) -> tuple[list[Obs], float | None]:
    """Freshest distance per scanner for one device in bermuda.dump_devices.

    Returns (observations, age of the freshest reading in seconds or None).
    """
    best: dict[str, tuple[float, float]] = {}
    newest = None
    for adv in (dev.get("adverts") or {}).values():
        addr = str(adv.get("scanner_address", "")).lower()
        d = adv.get("rssi_distance")
        stamp = adv.get("stamp")
        if addr not in scanners or d in (None, "None") or not isinstance(stamp, (int, float)):
            continue
        age = now - stamp
        if newest is None or age < newest:
            newest = age
        if age > max_age:
            continue
        if addr not in best or stamp > best[addr][1]:
            best[addr] = (float(d), stamp)
    return [Obs(scanners[a], d) for a, (d, _) in best.items()], newest


def raw_by_scanner(dev: dict, scanners: dict[str, Scanner], now: float, window: float = 8.0,
                   max_age: float = 15.0) -> dict[str, dict]:
    """Per scanner: median RSSI over the last `window` s, Bermuda distance and age (s). Fresh scanners only."""
    out: dict[str, dict] = {}
    for adv in (dev.get("adverts") or {}).values():
        addr = str(adv.get("scanner_address", "")).lower()
        stamp = adv.get("stamp")
        if addr not in scanners or not isinstance(stamp, (int, float)):
            continue
        age = now - stamp
        if age > max_age:
            continue
        rs = [r for st, r in zip(adv.get("hist_stamp") or [], adv.get("hist_rssi") or [])
              if isinstance(st, (int, float)) and isinstance(r, (int, float)) and now - st <= window]
        if not rs and isinstance(adv.get("rssi"), (int, float)):
            rs = [adv["rssi"]]
        d = adv.get("rssi_distance")
        cur = out.get(addr)
        if cur is None or age < cur["age"]:
            out[addr] = {"rssi": sorted(rs)[len(rs) // 2] if rs else None,
                         "bermuda": float(d) if isinstance(d, (int, float)) else None,
                         "age": round(age, 1)}
    return out
