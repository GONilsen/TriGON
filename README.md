<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="custom_components/trigon/brand/dark_logo.png">
    <img src="custom_components/trigon/brand/logo.png" alt="TriGON" height="110">
  </picture>
</p>

<p align="center"><b>Indoor positioning for Home Assistant</b><br>
Floor, room and x/y position for every person – built on <a href="https://github.com/agittins/bermuda">Bermuda</a> BLE data and your own floor plan.</p>

<p align="center">
  <a href="https://github.com/hacs/integration"><img src="https://img.shields.io/badge/HACS-Custom-41BDF5.svg" alt="HACS Custom"></a>
  <a href="https://github.com/GONilsen/TriGON/actions/workflows/validate.yml"><img src="https://github.com/GONilsen/TriGON/actions/workflows/validate.yml/badge.svg" alt="Validate"></a>
  <img src="https://img.shields.io/github/v/release/GONilsen/TriGON" alt="Release">
</p>

---

## What it does

Bermuda tells you which **area** a phone is closest to. TriGON goes a step further and works out **where** in the house the phone is:

- **Trilateration** – distances from every Bluetooth proxy that hears the phone are combined (weighted least squares in 3D, with proxy heights and floor levels), so the position is not just "nearest proxy".
- **Fingerprinting** – stand still for 20 seconds at a few known spots per room. TriGON learns what the signal looks like there and blends this with trilateration. In a real house this raised correct-room hits from 47 % to 79 % (leave-one-out test).
- **Floor detection** – the floor that best explains *all* distances wins, so a proxy in the ceiling right below you no longer moves you down a floor.
- **Per-scanner calibration** – each proxy gets its own RSSI→distance model, and other phones are adjusted to the reference phone with just 1–2 points.

Everything is set up in the **TriGON panel** in the sidebar – no YAML.

## Panel

| Tab | |
|---|---|
| **Live** | Floor plans with every person as a dot, an uncertainty halo and the occupied rooms highlighted. Tap a person to see RSSI and distance per proxy and distance circles on the map. |
| **Calibration** | Tap where you stand, measure for 15–45 s, repeat. Coverage per room, "Compute calibration", hit rate and mean error per room. |
| **Edit** | Floors, background floor plan (upload, scale from a known distance, place by a known point), origin, rooms (drag walls in parallel, drag corners with 45°/90° snapping, wall lengths, exact length input, area), proxies (drag, height, room), people (pick from Bermuda devices), YAML backup. |

The panel follows your Home Assistant language (English, Norwegian).

## Requirements

- Home Assistant **2024.12** or newer
- [Bermuda BLE Trilateration](https://github.com/agittins/bermuda) **0.8+**, set up and tracking your phones (e.g. via *Private BLE Device* for iPhones)
- At least 3 Bluetooth proxies (ESPHome `bluetooth_proxy` or similar) per floor for useful x/y positions; more is better

## Installation

### HACS (custom repository)

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/GONilsen/TriGON`, category **Integration**.
2. Install **TriGON** and restart Home Assistant.
3. **Settings → Devices & services → Add integration → TriGON**.

### Manual

Copy `custom_components/trigon` to `config/custom_components/trigon`, restart, and add the integration.

## Getting started

1. Open **TriGON** in the sidebar → **Edit**.
2. **Floors**: add your floors with floor level in metres (e.g. `0`, `2.75`, `-2.65`).
3. **Background plan**: upload a floor plan image per floor, measure a known distance (two taps + length) and place it with a known point. The red cross is the origin (0,0), shared by all floors.
4. **Rooms**: draw each room on top of the plan and link it to a Home Assistant area.
5. **Proxies**: add your Bluetooth proxies from the list and drag them to where they are mounted; set the height above the floor.
6. **People**: add the phones Bermuda tracks.
7. **Calibration**: walk around with your phone – 4 points in normal rooms, 2 in small ones – and press **Compute calibration**.

## Entities

| Entity | State | Attributes |
|---|---|---|
| `sensor.<person>_position` | Room name, or `away` | `home`, `room_id`, `area`, `floor`, `floor_name`, `x`, `y`, `error_m`, `nearest_scanner`, `scanners`, `fingerprint_weight`, `last_seen` |
| `sensor.<room>_people` | Number of people | `people` |
| `binary_sensor.<room>_occupancy` | Someone is in the room | `people` |
| `sensor.trigon_map` | People at home | Geometry for custom cards |

All entities belong to the **TriGON** service device. With Norwegian as the system language the entities are named in Norwegian.

Example automation:

```yaml
triggers:
  - trigger: state
    entity_id: binary_sensor.office_occupancy
    to: "on"
actions:
  - action: light.turn_on
    target:
      entity_id: light.office
```

## Options

*Settings → Devices & services → TriGON → Configure*

| Option | Default |
|---|---|
| Show TriGON in the sidebar | on |
| Update interval | 5 s |
| Phone height above floor | 1.0 m |
| Ignore proxies further away than | 15 m |
| Mark as away after no signal for | 120 s |

## How it works

Every update TriGON calls Bermuda's public `bermuda.dump_devices` service (no dependency on Bermuda internals) and takes the freshest RSSI per proxy. Distances come from your calibration (`rssi = A − 10·n·log10(d) + phone offset`, fitted per proxy) or, before calibration, from Bermuda. The position is solved per floor; the floor with the lowest residual wins (with hysteresis), then fingerprints (k-nearest neighbours in RSSI space) are blended in according to how well they match. Rooms switch only after two consistent rounds.

## Privacy

Floor plans, geometry and calibration are stored locally in `.storage/` and are only available to logged-in users (upload/delete: admins only). Nothing leaves your Home Assistant.

## Limitations

- Accuracy depends on proxy placement and calibration: expect 1–3 m and reliable room detection in calibrated rooms.
- Phones that are not tracked by Bermuda cannot be positioned.
- The integration icon in *Devices & services* shows a placeholder until it is added to the Home Assistant brands repository.

## Development

```bash
pip install pytest
pytest -q
```

## License

[MIT](LICENSE)
