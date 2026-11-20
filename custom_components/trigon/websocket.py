"""Websocket API for the TriGON panel (admin only)."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

import re

from .const import DOMAIN


def _coord(hass):
    return hass.data[DOMAIN]


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/model"})
@websocket_api.require_admin
@callback
def ws_model(hass: HomeAssistant, connection, msg) -> None:
    connection.send_result(msg["id"], _coord(hass).model_payload())


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/subscribe"})
@websocket_api.require_admin
@callback
def ws_subscribe(hass: HomeAssistant, connection, msg) -> None:
    from . import SIGNAL_UPDATE

    coord = _coord(hass)

    @callback
    def forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], coord.live_payload()))

    connection.subscriptions[msg["id"]] = async_dispatcher_connect(hass, SIGNAL_UPDATE, forward)
    connection.send_result(msg["id"])
    forward()


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/calibrate/start",
    vol.Required("person"): str,
    vol.Required("floor"): str,
    vol.Required("x"): vol.Coerce(float),
    vol.Required("y"): vol.Coerce(float),
    vol.Optional("duration", default=20): vol.All(vol.Coerce(float), vol.Range(min=5, max=120)),
})
@websocket_api.require_admin
@callback
def ws_cal_start(hass: HomeAssistant, connection, msg) -> None:
    from . import _monotonic

    coord = _coord(hass)
    if msg["person"] not in coord.states or msg["floor"] not in coord.model.floors:
        connection.send_error(msg["id"], "invalid", "Unknown person or floor")
        return
    coord.calib.start(msg["person"], msg["floor"], msg["x"], msg["y"], msg["duration"], _monotonic())
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/calibrate/cancel"})
@websocket_api.require_admin
@callback
def ws_cal_cancel(hass: HomeAssistant, connection, msg) -> None:
    _coord(hass).calib.cancel()
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/calibrate/delete", vol.Required("point"): str})
@websocket_api.require_admin
@callback
def ws_cal_delete(hass: HomeAssistant, connection, msg) -> None:
    coord = _coord(hass)
    coord.calib.delete(msg["point"])
    connection.send_result(msg["id"], coord.calib.summary())


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/calibrate/fit"})
@websocket_api.require_admin
@callback
def ws_cal_fit(hass: HomeAssistant, connection, msg) -> None:
    coord = _coord(hass)
    res = coord.calib.fit(coord.model)
    coord.reset_trackers()
    connection.send_result(msg["id"], {"resultat": res, "kalibrering": coord.calib.summary()})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/calibrate/enable", vol.Required("enabled"): bool})
@websocket_api.require_admin
@callback
def ws_cal_enable(hass: HomeAssistant, connection, msg) -> None:
    coord = _coord(hass)
    coord.calib.set_enabled(msg["enabled"])
    coord.reset_trackers()
    connection.send_result(msg["id"], coord.calib.summary())


def _clean_geometry(g: dict) -> dict:
    floors = {str(fid): {"name": str(f.get("name", fid)), "level": float(f.get("level", 0))}
              for fid, f in (g.get("floors") or {}).items()}
    scanners = []
    for s in g.get("scanners") or []:
        d = {"address": str(s["address"]).upper(), "name": str(s.get("name") or s["address"]), "floor": str(s["floor"]),
             "x": round(float(s["x"]), 2), "y": round(float(s["y"]), 2), "z": round(float(s.get("z", 2.4)), 2)}
        if s.get("room"):
            d["room"] = str(s["room"])
        scanners.append(d)
    rooms = []
    for r in g.get("rooms") or []:
        poly = [[round(float(p[0]), 2), round(float(p[1]), 2)] for p in r["polygon"]]
        if len(poly) < 3:
            raise ValueError(f"Room {r.get('name')} has fewer than 3 corners")
        d = {"id": str(r["id"]), "name": str(r.get("name") or r["id"]), "floor": str(r["floor"]), "polygon": poly}
        if r.get("area"):
            d["area"] = str(r["area"])
        rooms.append(d)
    ids = [r["id"] for r in rooms]
    if len(ids) != len(set(ids)):
        raise ValueError("Two rooms have the same id")
    return {"floors": floors, "scanners": scanners, "rooms": rooms}


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/geometry/save",
    vol.Required("geometry"): dict,
    vol.Optional("shift"): vol.All([vol.Coerce(float)], vol.Length(min=2, max=2)),
})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_geom_save(hass: HomeAssistant, connection, msg) -> None:
    from .model import build_model

    coord = _coord(hass)
    try:
        geom = _clean_geometry(msg["geometry"])
        await coord.async_save_config(geom)
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "invalid", str(err))
        return
    sx, sy = msg.get("shift") or (0.0, 0.0)
    if sx or sy:
        # New origin: move calibration points by the same amount as the geometry
        for p in coord.calib.data["points"]:
            p["x"] = round(p["x"] - sx, 2)
            p["y"] = round(p["y"] - sy, 2)
        coord.calib.save()
        # Background plans stay fixed under the rooms
        for m in coord.plans.meta.values():
            m["x"] = round(m["x"] - sx, 3)
            m["y"] = round(m["y"] - sy, 3)
        coord.plans.save()
        coord.calib._fps = None
    connection.send_result(msg["id"], coord.model_payload())


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/geometry/export"})
@websocket_api.require_admin
@callback
def ws_geom_export(hass: HomeAssistant, connection, msg) -> None:
    from homeassistant.util.yaml import dump

    c = _coord(hass).config
    connection.send_result(msg["id"], {"yaml": dump({k: c.get(k) for k in ("floors", "scanners", "rooms", "persons")})})


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/plan/transform",
    vol.Required("floor"): str,
    vol.Optional("scale"): vol.All(vol.Coerce(float), vol.Range(min=1e-5, max=10)),
    vol.Optional("x"): vol.Coerce(float),
    vol.Optional("y"): vol.Coerce(float),
    vol.Optional("opacity"): vol.All(vol.Coerce(float), vol.Range(min=0, max=1)),
})
@websocket_api.require_admin
@callback
def ws_plan_transform(hass: HomeAssistant, connection, msg) -> None:
    coord = _coord(hass)
    m = coord.plans.set_transform(msg["floor"], scale=msg.get("scale"), x=msg.get("x"), y=msg.get("y"),
                                  opacity=msg.get("opacity"))
    if m is None:
        connection.send_error(msg["id"], "not_found", "No background for this floor")
        return
    connection.send_result(msg["id"], coord.plans.meta)


def _slug(name: str) -> str:
    s = name.lower().replace("æ", "ae").replace("ø", "o").replace("å", "a")
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_") or "person"


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/persons/save",
    vol.Required("persons"): [vol.Schema({vol.Optional("id"): str, vol.Required("name"): str,
                                          vol.Required("bermuda"): str}, extra=vol.REMOVE_EXTRA)],
})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_persons_save(hass: HomeAssistant, connection, msg) -> None:
    coord = _coord(hass)
    out, used = [], set()
    for p in msg["persons"]:
        pid = p.get("id") or _slug(p["name"])
        base, k = pid, 2
        while pid in used:
            pid = f"{base}_{k}"
            k += 1
        used.add(pid)
        out.append({"id": pid, "name": p["name"].strip() or pid, "bermuda": p["bermuda"].strip().lower()})
    try:
        await coord.async_save_config({"persons": out})
    except Exception as err:  # noqa: BLE001
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], coord.model_payload())


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/bermuda/devices"})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_bermuda_devices(hass: HomeAssistant, connection, msg) -> None:
    """Devices Bermuda tracks (Private BLE Device, iBeacon, ...) that can be added as persons."""
    if not hass.services.has_service("bermuda", "dump_devices"):
        connection.send_error(msg["id"], "no_bermuda", "Bermuda is not loaded")
        return
    resp = await hass.services.async_call("bermuda", "dump_devices", {"redact": False},
                                          blocking=True, return_response=True) or {}
    out = []
    for addr, dev in resp.items():
        if not isinstance(dev, dict) or not dev.get("create_sensor"):
            continue
        name = dev.get("name_by_user") or dev.get("name_devreg") or dev.get("name") or addr
        out.append({"address": str(dev.get("address") or addr).lower(), "name": name})
    out.sort(key=lambda d: d["name"].lower())
    connection.send_result(msg["id"], out)


@callback
def async_register(hass: HomeAssistant) -> None:
    for h in (ws_model, ws_subscribe, ws_cal_start, ws_cal_cancel, ws_cal_delete, ws_cal_fit, ws_cal_enable,
              ws_geom_save, ws_geom_export, ws_plan_transform, ws_persons_save, ws_bermuda_devices):
        websocket_api.async_register_command(hass, h)
