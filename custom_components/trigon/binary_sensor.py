"""Binary sensors: someone is present in the room."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import Coordinator
from .const import DOMAIN, SIGNAL_UPDATE, is_norwegian


class RoomPresence(BinarySensorEntity):
    _attr_should_poll = False
    _attr_has_entity_name = False
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(self, coord: Coordinator, rid: str, name: str) -> None:
        self.coord = coord
        self.rid = rid
        no = is_norwegian(coord.hass, coord.entry.options)
        self._attr_name = f"{name} - {'Tilstede' if no else 'Occupancy'}"
        self._attr_unique_id = f"{DOMAIN}_{rid}_occupancy"
        self.entity_id = f"binary_sensor.{rid}_{'tilstede' if no else 'occupancy'}"
        self._names: tuple = ()
        self._written = None

    @property
    def available(self) -> bool:
        return any(r.id == self.rid for r in self.coord.model.rooms)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_UPDATE, self._update))
        self._update()

    @callback
    def _update(self) -> None:
        self._names = tuple(sorted(
            p.name for p in self.coord.model.persons
            if (st := self.coord.states.get(p.id)) and st.home and st.result and st.result.room
            and st.result.room.id == self.rid
        ))
        snap = (self._names, self.available)
        if snap != self._written:
            self._written = snap
            self.async_write_ha_state()

    @property
    def is_on(self) -> bool:
        return bool(self._names)

    @property
    def extra_state_attributes(self):
        return {"people": list(self._names)}


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities: AddEntitiesCallback) -> None:
    coord: Coordinator = hass.data[DOMAIN]

    def add_rooms(rooms) -> None:
        async_add_entities([RoomPresence(coord, r.id, r.name) for r in rooms])

    coord.register_platform("binary_sensor", add_rooms)
