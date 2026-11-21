import math
import random

from trigon.calibration import Calibration
from trigon.model import build_model

CONF = {
    "floors": {"g": {"name": "Ground", "level": 0}},
    "scanners": [
        {"address": "AA:00:00:00:00:01", "name": "S1", "floor": "g", "x": 1, "y": 1, "z": 2.4},
        {"address": "AA:00:00:00:00:02", "name": "S2", "floor": "g", "x": 9, "y": 1, "z": 2.4},
        {"address": "AA:00:00:00:00:03", "name": "S3", "floor": "g", "x": 5, "y": 7, "z": 2.4},
    ],
    "rooms": [
        {"id": "a", "name": "A", "floor": "g", "polygon": [[0, 0], [5, 0], [5, 8], [0, 8]]},
        {"id": "b", "name": "B", "floor": "g", "polygon": [[5, 0], [10, 0], [10, 8], [5, 8]]},
    ],
    "persons": [{"id": "p", "name": "P", "bermuda": "irk1"}, {"id": "q", "name": "Q", "bermuda": "irk2"}],
}


class _Store:
    def async_delay_save(self, *a):
        pass


def test_fit_recovers_parameters_and_offset():
    random.seed(2)
    m = build_model(CONF)
    truth = {a: (-60.0 + i * 3, 2.5 + i * 0.3) for i, a in enumerate(m.scanners)}
    c = Calibration(_Store())

    def add(person, x, y, off=0.0):
        r = {}
        for a, s in m.scanners.items():
            d = math.dist((x, y, 1.0), (s.x, s.y, s.z))
            A, n = truth[a]
            r[a] = round(A - 10 * n * math.log10(d) + off + random.gauss(0, 0.5), 1)
        c.data["points"].append({"id": f"{len(c.data['points'])}", "person": person, "floor": "g",
                                 "x": x, "y": y, "ts": 0, "rssi": r, "count": {}})

    for x in (1.5, 3, 4.5, 6, 7.5, 9):
        for y in (1.5, 4, 6.5):
            add("p", x, y)
    add("q", 2, 2, off=5)
    add("q", 8, 6, off=5)
    res = c.fit(m)
    assert res["ok"]
    for a, (A, n) in truth.items():
        assert abs(res["proxyer"][a]["A"] - A) < 1.5
        assert abs(res["proxyer"][a]["n"] - n) < 0.3
    assert abs(res["personer"]["q"]["offset"] - 5) < 1.5
    assert res["kvalitet"]["treff_pct"] >= 80


def test_empty_config_builds():
    m = build_model({})
    assert m.floors == {} and m.persons == [] and m.rooms == []


def test_fit_floor_attenuation():
    """A scanner heard through a floor slab gets its extra loss (F) fitted and removed for other-floor distances."""
    random.seed(3)
    conf = {
        "floors": {"g": {"name": "Ground", "level": 0}, "u": {"name": "Upper", "level": 2.75}},
        "scanners": [
            {"address": "AA:00:00:00:00:01", "name": "S1", "floor": "g", "x": 1, "y": 1, "z": 2.4},
            {"address": "AA:00:00:00:00:02", "name": "S2", "floor": "g", "x": 9, "y": 7, "z": 2.4},
            {"address": "AA:00:00:00:00:03", "name": "S3", "floor": "u", "x": 5, "y": 4, "z": 2.4},
        ],
        "rooms": [
            {"id": "a", "name": "A", "floor": "g", "polygon": [[0, 0], [10, 0], [10, 8], [0, 8]]},
            {"id": "b", "name": "B", "floor": "u", "polygon": [[0, 0], [10, 0], [10, 8], [0, 8]]},
        ],
        "persons": [{"id": "p", "name": "P", "bermuda": "irk1"}],
    }
    m = build_model(conf)
    A, n, F = -55.0, 3.0, 8.0
    c = Calibration(_Store())
    for fl in ("g", "u"):
        z = m.floors[fl].level + 1.0
        for x in (1.5, 4, 6.5, 9):
            for y in (1.5, 4.5, 7):
                r = {}
                for a, s in m.scanners.items():
                    d = math.dist((x, y, z), (s.x, s.y, s.z))
                    r[a] = round(A - 10 * n * math.log10(d) - (F if s.floor != fl else 0) + random.gauss(0, 0.5), 1)
                c.data["points"].append({"id": f"{len(c.data['points'])}", "person": "p", "floor": fl,
                                         "x": x, "y": y, "ts": 0, "rssi": r, "count": {}})
    res = c.fit(m)
    for a in m.scanners:
        assert abs(res["proxyer"][a]["F"] - F) < 1.5
        assert abs(res["proxyer"][a]["n"] - n) < 0.4
    s1 = m.scanners["aa:00:00:00:00:01"]
    o = c.obs(s1, "p", -70.0)
    assert o.other_floor_distance < o.distance
    assert o.dist_for("u") == o.other_floor_distance and o.dist_for("g") == o.distance
