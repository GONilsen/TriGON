"""TriGON: indoor position (floor, room and x/y) per person from Bermuda BLE data and a floor plan.

Trilateration of per-scanner distances, combined with fingerprinting from calibration points.
Everything is configured in the TriGON panel; settings are in the integration options.
"""

from __future__ import annotations

import hashlib
import logging
import time
from datetime import timedelta
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType
import homeassistant.util.dt as dt_util

from .calibration import Calibration
from .const import (
    CONF_AWAY_AFTER,
    CONF_MAX_DISTANCE,
    CONF_PHONE_HEIGHT,
    CONF_SIDEBAR,
    CONF_UPDATE_INTERVAL,
    DEFAULT_OPTIONS,
    DOMAIN,
    EMPTY_CONFIG,
    PANEL_COMPONENT,
    PANEL_URL,
    PLATFORMS,
    SIGNAL_UPDATE,
    STATIC_URL,
    is_norwegian,
)
from .engine import Obs, Result, Tracker
from .model import Model, build_model, raw_by_scanner
from .plans import Plans, PlanView

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


def _monotonic() -> float:
    try:
        from bluetooth_data_tools import monotonic_time_coarse

        return monotonic_time_coarse()
    except ImportError:  # pragma: no cover
        return time.monotonic()


def person_entity_id(hass: HomeAssistant, pid: str, options: dict | None = None) -> str:
    """Entity id of a person's position sensor (follows the entity registry if renamed)."""
    from homeassistant.helpers import entity_registry as er

    eid = er.async_get(hass).async_get_entity_id("sensor", DOMAIN, f"{DOMAIN}_{pid}_position")
    return eid or f"sensor.{pid}_{'posisjon' if is_norwegian(hass, options) else 'position'}"


class PersonState:
    def __init__(self) -> None:
        self.tracker = Tracker()
        self.result: Result | None = None
        self.home = False
        self.last_heard = None  # datetime (UTC)
        self.last_heard_mono: float | None = None
        self.raw: dict[str, dict] = {}


class Coordinator:
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, store: Store, config: dict,
                 calib: Calibration, plans: Plans) -> None:
        self.hass = hass
        self.entry = entry
        self.store = store
        self.config = config
        self.calib = calib
        self.plans = plans
        self.model: Model = build_model(self._full_conf(config))
        self.states: dict[str, PersonState] = {}
        self._unsub = None
        self._warned = False
        self._calib_active = calib.active
        self._platforms: dict[str, dict] = {}
        self._ensure_states()

    # ---------- configuration ----------
    def _full_conf(self, config: dict) -> dict:
        o = {**DEFAULT_OPTIONS, **self.entry.options}
        return {**EMPTY_CONFIG, **config,
                "phone_height": o[CONF_PHONE_HEIGHT], "max_distance": o[CONF_MAX_DISTANCE],
                "update_interval": o[CONF_UPDATE_INTERVAL], "away_after": o[CONF_AWAY_AFTER]}

    def _ensure_states(self) -> None:
        start = _monotonic()
        for p in self.model.persons:
            if p.id not in self.states:
                st = PersonState()
                st.last_heard_mono = start  # counts from now, so silent phones become "away"
                self.states[p.id] = st

    async def async_save_config(self, new: dict) -> None:
        """Validate, store and apply a new configuration (floors/scanners/rooms/persons)."""
        merged = {**EMPTY_CONFIG, **self.config, **new}
        model = build_model(self._full_conf(merged))  # raises on invalid input
        self.config = merged
        await self.store.async_save(merged)
        self.set_model(model)

    def set_model(self, model: Model) -> None:
        self.model = model
        self.calib._fps = None
        self._ensure_states()
        self._sync_entities()
        self.reset_trackers()

    # ---------- dynamic entities (new rooms/persons without restart) ----------
    @callback
    def register_platform(self, platform: str, add_rooms, add_persons=None) -> None:
        self._platforms[platform] = {"rooms": add_rooms, "persons": add_persons, "room_ids": set(), "person_ids": set()}
        self._sync_entities()

    @callback
    def _sync_entities(self) -> None:
        for pf in self._platforms.values():
            new_r = [r for r in self.model.rooms if r.id not in pf["room_ids"]]
            if new_r and pf["rooms"]:
                pf["room_ids"].update(r.id for r in new_r)
                pf["rooms"](new_r)
            new_p = [p for p in self.model.persons if p.id not in pf["person_ids"]]
            if new_p and pf["persons"]:
                pf["person_ids"].update(p.id for p in new_p)
                pf["persons"](new_p)

    def reset_trackers(self) -> None:
        for st in self.states.values():
            st.tracker.reset()
        async_dispatcher_send(self.hass, SIGNAL_UPDATE)

    # ---------- update loop ----------
    async def async_start(self) -> None:
        self._unsub = async_track_time_interval(
            self.hass, self._async_tick, timedelta(seconds=self.model.update_interval)
        )

    async def _async_tick(self, _now=None) -> None:
        if not self.model.persons:
            return
        if not self.hass.services.has_service("bermuda", "dump_devices"):
            if not self._warned:
                _LOGGER.warning("Bermuda is not loaded (service bermuda.dump_devices is missing)")
                self._warned = True
            return
        addresses = " ".join(p.bermuda for p in self.model.persons)
        try:
            resp = await self.hass.services.async_call(
                "bermuda", "dump_devices", {"addresses": addresses, "redact": False},
                blocking=True, return_response=True,
            )
        except Exception as err:  # noqa: BLE001
            if not self._warned:
                _LOGGER.warning("Could not read data from Bermuda: %s", err)
                self._warned = True
            return
        self._warned = False
        now_mono = _monotonic()
        now = dt_util.utcnow()
        resp = resp or {}
        if self.calib.active != self._calib_active:
            self._calib_active = self.calib.active
            for st in self.states.values():
                st.tracker.reset()
        use_cal = self.calib.active
        fps = self.calib.fingerprints(self.model) if use_cal else []
        for p in self.model.persons:
            st = self.states[p.id]
            dev = resp.get(p.bermuda) or {}
            self.calib.ingest(p.id, dev, self.model.scanners, now_mono)
            raw = raw_by_scanner(dev, self.model.scanners, now_mono)
            obs = []
            for addr, r in raw.items():
                d = self.calib.distance(addr, p.id, r["rssi"]) if use_cal and r["rssi"] is not None else None
                r["kalibrert"] = d is not None
                if d is None:
                    d = r["bermuda"]
                r["d"] = round(d, 2) if d is not None else None
                if d is not None:
                    obs.append(Obs(self.model.scanners[addr], d))
            st.raw = raw
            newest = min((r["age"] for r in raw.values()), default=None)
            off = self.calib.offset(p.id)
            live = {a: r["rssi"] - off for a, r in raw.items() if r["rssi"] is not None} if fps else None
            res = st.tracker.update(obs, self.model.floors, self.model.settings, dev.get("floor_id"), live, fps)
            if res is not None:
                st.result = res
                st.home = True
                st.last_heard = now if newest is None else now - timedelta(seconds=max(newest, 0))
                st.last_heard_mono = now_mono
            elif st.last_heard_mono is None or now_mono - st.last_heard_mono > self.model.away_after:
                if st.home or st.result is not None:
                    st.tracker.reset()
                st.home = False
                st.result = None
        async_dispatcher_send(self.hass, SIGNAL_UPDATE)

    # ---------- data for the panel (internal API) ----------
    def model_payload(self) -> dict:
        m = self.model
        return {
            "etasjer": [
                {"id": f.id, "navn": f.name, "niva": f.level,
                 "rom": [{"id": r.id, "navn": r.name, "omrade": r.area, "polygon": [list(p) for p in r.polygon]}
                         for r in f.rooms]}
                for f in sorted(m.floors.values(), key=lambda f: -f.level)
            ],
            "proxyer": [{"adresse": s.address, "navn": s.name, "etasje": s.floor, "x": s.x, "y": s.y,
                         "z": round(s.z - m.floors[s.floor].level, 2), "rom": s.room,
                         "rom_fast": s.room_explicit} for s in m.scanners.values()],
            "personer": [{"id": p.id, "navn": p.name, "bermuda": p.bermuda,
                          "entity": person_entity_id(self.hass, p.id, self.entry.options)} for p in m.persons],
            "telefonhoyde": m.settings.phone_height,
            "planer": self.plans.meta if self.plans else {},
            "kalibrering": self.calib.summary(),
        }

    def live_payload(self) -> dict:
        out = {}
        for p in self.model.persons:
            st = self.states[p.id]
            r = st.result
            out[p.id] = {
                "hjemme": st.home,
                "rom": r.room.name if (r and r.room) else None,
                "rom_id": r.room.id if (r and r.room) else None,
                "etasje": r.floor if r else None,
                "x": round(r.x, 2) if r else None,
                "y": round(r.y, 2) if r else None,
                "avvik": round(r.accuracy, 2) if r else None,
                "naermeste": r.nearest.name if r else None,
                "fingeravtrykk": r.fp_weight if r else None,
                "sist_hort": st.last_heard.isoformat() if st.last_heard else None,
                "raw": st.raw,
            }
        return {"personer": out, "kalibrering": self.calib.status(_monotonic()),
                "fingeravtrykk": len(self.calib.fingerprints(self.model)),
                "siste_punkt": self.calib.last_point, "kalibrert": self.calib.active}

    @callback
    def async_stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None


async def _async_register_panel(hass: HomeAssistant) -> None:
    from homeassistant.components import panel_custom

    panel = Path(__file__).parent / "frontend" / "panel.js"
    ver = hashlib.md5(await hass.async_add_executor_job(panel.read_bytes)).hexdigest()[:8]
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name=PANEL_COMPONENT,
        sidebar_title="TriGON",
        sidebar_icon="mdi:vector-triangle",
        module_url=f"{STATIC_URL}/panel.js?v={ver}",
        require_admin=True,
        config={},
    )


@callback
def _async_remove_panel(hass: HomeAssistant) -> None:
    from homeassistant.components.frontend import async_remove_panel

    try:
        async_remove_panel(hass, PANEL_URL)
    except Exception:  # noqa: BLE001
        pass


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """One-time setup: static files, plan image view and websocket API."""
    from homeassistant.components.http import StaticPathConfig

    from .websocket import async_register as ws_register

    fdir = Path(__file__).parent / "frontend"
    await hass.http.async_register_static_paths([StaticPathConfig(STATIC_URL, str(fdir), False)])
    hass.http.register_view(PlanView())
    ws_register(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = Store(hass, 1, f"{DOMAIN}.config")
    config = await store.async_load() or dict(EMPTY_CONFIG)
    calib = Calibration(Store(hass, 1, f"{DOMAIN}.calibration"))
    await calib.async_load()
    plans = Plans(hass)
    await plans.async_load()
    try:
        coord = Coordinator(hass, entry, store, config, calib, plans)
    except Exception as err:  # noqa: BLE001
        from homeassistant.exceptions import ConfigEntryError

        raise ConfigEntryError(f"Stored TriGON configuration is invalid: {err}") from err
    hass.data[DOMAIN] = coord
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await coord.async_start()
    if entry.options.get(CONF_SIDEBAR, True):
        try:
            await _async_register_panel(hass)
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Could not register the TriGON panel: %s", err)
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def async_remove_config_entry_device(hass: HomeAssistant, entry: ConfigEntry, device) -> bool:
    """TriGON has no devices of its own any more; allow removing leftovers from older versions."""
    return True


async def _async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    coord = hass.data.pop(DOMAIN, None)
    if coord:
        coord.async_stop()
    _async_remove_panel(hass)
    return ok
