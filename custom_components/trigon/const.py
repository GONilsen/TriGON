"""Constants for TriGON."""

DOMAIN = "trigon"
SIGNAL_UPDATE = f"{DOMAIN}_update"
PLATFORMS = ("sensor", "binary_sensor")
STATIC_URL = f"/{DOMAIN}_static"
PANEL_URL = "trigon"
PANEL_COMPONENT = "trigon-panel"

CONF_SIDEBAR = "sidebar"
CONF_UPDATE_INTERVAL = "update_interval"
CONF_PHONE_HEIGHT = "phone_height"
CONF_MAX_DISTANCE = "max_distance"
CONF_AWAY_AFTER = "away_after"

DEFAULT_OPTIONS = {
    CONF_SIDEBAR: True,
    CONF_UPDATE_INTERVAL: 5,
    CONF_PHONE_HEIGHT: 1.0,
    CONF_MAX_DISTANCE: 15.0,
    CONF_AWAY_AFTER: 120,
}

EMPTY_CONFIG = {"floors": {}, "scanners": [], "rooms": [], "persons": []}


def is_norwegian(hass) -> bool:
    """Entity names follow the HA system language (Norwegian or English)."""
    lang = (getattr(hass.config, "language", None) or "en").lower()
    return lang.startswith(("nb", "nn", "no"))
