import math

from trigon.engine import Floor, Obs, Room, Scanner, Settings, Tracker, point_in_polygon, solve


def house():
    f = Floor("ground", "Ground", 0.0)
    a = Room("a", "Room A", "ground", [(0, 0), (5, 0), (5, 5), (0, 5)])
    b = Room("b", "Room B", "ground", [(5, 0), (10, 0), (10, 5), (5, 5)])
    f.rooms = [a, b]
    sc = [Scanner("s1", "S1", "ground", 1, 1, 2.4, "a"), Scanner("s2", "S2", "ground", 9, 1, 2.4, "b"),
          Scanner("s3", "S3", "ground", 5, 4.5, 2.4, None)]
    return {"ground": f}, sc


def obs_for(sc, x, y, z=1.0):
    return [Obs(s, math.dist((x, y, z), (s.x, s.y, s.z))) for s in sc]


def test_point_in_polygon():
    sq = [(0, 0), (2, 0), (2, 2), (0, 2)]
    assert point_in_polygon(1, 1, sq)
    assert not point_in_polygon(3, 1, sq)


def test_solve_exact_distances():
    floors, sc = house()
    x, y, rms = solve(obs_for(sc, 3.0, 2.0), 1.0, "ground", Settings())
    assert abs(x - 3.0) < 0.05 and abs(y - 2.0) < 0.05
    assert rms < 0.05


def test_tracker_room_and_hysteresis():
    floors, sc = house()
    s = Settings(smoothing=0.0)
    t = Tracker()
    r = t.update(obs_for(sc, 2.0, 2.5), floors, s)
    assert r.room.id == "a"
    # One round in room B is not enough to switch (room_confirm = 2)
    r = t.update(obs_for(sc, 8.0, 2.5), floors, s)
    assert r.room.id == "a"
    r = t.update(obs_for(sc, 8.0, 2.5), floors, s)
    assert r.room.id == "b"


def test_no_observations_returns_none():
    floors, _ = house()
    assert Tracker().update([], floors, Settings()) is None
