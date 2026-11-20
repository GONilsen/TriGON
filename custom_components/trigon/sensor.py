"""Sensors: position per person, people count per room and a map sensor for dashboard cards."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import Coordinator, person_entity_id
from .const import DOMAIN, SIGNAL_UPDATE, is_norwegian


def device_info():
    from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo

    return DeviceInfo(identifiers={(DOMAIN, "trigon")}, name="TriGON", manufacturer="TriGON",
                      model="BLE indoor positioning", entry_type=DeviceEntryType.SERVICE)


def _q(v: float, step: float = 0.25) -> float:
    return round(round(v / step) * step, 2)


class _Base(SensorEntity):
    _attr_should_poll = False
    _attr_has_entity_name = False

    def __init__(self, coord: Coordinator) -> None:
        self.coord = coord
        self._last = None
        self._attr_device_info = device_info()
        self._no = is_norwegian(coord.hass)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_UPDATE, self._update))
        self._update()

    def _snapshot(self):
        return None

    @callback
    def _update(self) -> None:
        snap = self._snapshot()
        if snap != self._last:
            self._last = snap
            self.async_write_ha_state()


class PersonSensor(_Base):
    """The room the person is in; floor, x/y and diagnostics as attributes."""

    _attr_icon = "mdi:map-marker-account"
    _unrecorded_attributes = frozenset({"x", "y", "error_m", "nearest_scanner", "scanners", "last_seen",
                                        "fingerprint_weight"})

    def __init__(self, coord: Coordinator, pid: str, name: str) -> None:
        super().__init__(coord)
        self.pid = pid
        self._attr_name = f"{name} - {'Posisjon' if self._no else 'Position'}"
        self._attr_unique_id = f"{DOMAIN}_{pid}_position"
        self.entity_id = person_entity_id(coord.hass, pid)
        self._attrs: dict = {}

    @property
    def available(self) -> bool:
        return any(p.id == self.pid for p in self.coord.model.persons)

    def _snapshot(self):
        st = self.coord.states.get(self.pid)
        away = "borte" if self._no else "away"
        if st is None or not st.home or st.result is None:
            self._attr_native_value = away if st and st.last_heard_mono is not None else None
            self._attrs = {"home": False, "room_id": None, "area": None, "floor": None,
                           "last_seen": st.last_heard.isoformat() if st and st.last_heard else None}
            return (self._attr_native_value,)
        r = st.result
        room = r.room
        fl = self.coord.model.floors[r.floor]
        x, y = _q(r.x), _q(r.y)
        # Avoid writes for tiny movements: keep previous x/y if it moved < 0.5 m within the same room
        if self._last and len(self._last) > 3 and self._last[0] == (room.name if room else None):
            px, py = self._last[2], self._last[3]
            if ((px - x) ** 2 + (py - y) ** 2) ** 0.5 < 0.5:
                x, y = px, py
        self._attr_native_value = room.name if room else ("ukjent" if self._no else "unknown")
        self._attrs = {
            "home": True,
            "room_id": room.id if room else None,
            "area": room.area if room else None,
            "floor": fl.id,
            "floor_name": fl.name,
            "x": x,
            "y": y,
            "error_m": round(r.accuracy, 1),
            "nearest_scanner": r.nearest.name,
            "scanners": r.used,
            "fingerprint_weight": r.fp_weight,
            "last_seen": st.last_heard.isoformat() if st.last_heard else None,
        }
        return (self._attr_native_value, fl.id, x, y, round(r.accuracy))

    @property
    def extra_state_attributes(self):
        return self._attrs


class RoomCountSensor(_Base):
    """Number of people in a room."""

    _attr_icon = "mdi:account-group"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coord: Coordinator, rid: str, name: str) -> None:
        super().__init__(coord)
        self.rid = rid
        word = "personer" if self._no else "people"
        self._attr_name = f"{name} - {'Personer' if self._no else 'People'}"
        self._attr_native_unit_of_measurement = word
        self._attr_unique_id = f"{DOMAIN}_{rid}_people"
        self.entity_id = f"sensor.{rid}_{word}"
        self._attrs: dict = {}

    @property
    def available(self) -> bool:
        return any(r.id == self.rid for r in self.coord.model.rooms)

    def _snapshot(self):
        names = sorted(
            p.name for p in self.coord.model.persons
            if (st := self.coord.states.get(p.id)) and st.home and st.result and st.result.room
            and st.result.room.id == self.rid
        )
        self._attr_native_value = len(names)
        self._attrs = {"people": names}
        return (tuple(names), self.available)

    @property
    def extra_state_attributes(self):
        return self._attrs


class MapSensor(_Base):
    """Geometry for dashboard cards (floors, rooms, scanners). State = number of people at home."""

    _attr_icon = "mdi:floor-plan"
    _unrecorded_attributes = frozenset({"floors", "scanners", "persons"})

    def __init__(self, coord: Coordinator) -> None:
        super().__init__(coord)
        self._attr_name = "TriGON - Kart" if self._no else "TriGON - Map"
        self._attr_unique_id = f"{DOMAIN}_map"
        self.entity_id = "sensor.trigon_kart" if self._no else "sensor.trigon_map"
        self._attrs: dict = {}

    def _snapshot(self):
        m = self.coord.model
        home = sum(1 for st in self.coord.states.values() if st.home)
        self._attr_native_value = home
        self._attrs = {
            "floors": [
                {"id": f.id, "name": f.name, "level": f.level,
                 "rooms": [{"id": r.id, "name": r.name, "polygon": [list(p) for p in r.polygon]} for r in f.rooms]}
                for f in sorted(m.floors.values(), key=lambda f: -f.level)
            ],
            "scanners": [{"name": s.name, "floor": s.floor, "x": s.x, "y": s.y} for s in m.scanners.values()],
            "persons": [{"id": p.id, "name": p.name, "entity": person_entity_id(self.hass, p.id)} for p in m.persons],
        }
        return (home, id(m))

    @property
    def extra_state_attributes(self):
        return self._attrs


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities: AddEntitiesCallback) -> None:
    coord: Coordinator = hass.data[DOMAIN]
    async_add_entities([MapSensor(coord)])

    def add_rooms(rooms) -> None:
        async_add_entities([RoomCountSensor(coord, r.id, r.name) for r in rooms])

    def add_persons(persons) -> None:
        async_add_entities([PersonSensor(coord, p.id, p.name) for p in persons])

    coord.register_platform("sensor", add_rooms, add_persons)
