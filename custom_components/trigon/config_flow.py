"""Config flow and options for TriGON (single instance)."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback

from .const import (
    CONF_AWAY_AFTER,
    CONF_MAX_DISTANCE,
    CONF_PHONE_HEIGHT,
    CONF_SIDEBAR,
    CONF_UPDATE_INTERVAL,
    DEFAULT_OPTIONS,
    DOMAIN,
)


class TrigonConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="TriGON", data={},
                                           options={**DEFAULT_OPTIONS, CONF_SIDEBAR: user_input.get(CONF_SIDEBAR, True)})
        return self.async_show_form(step_id="user",
                                    data_schema=vol.Schema({vol.Optional(CONF_SIDEBAR, default=True): bool}))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return TrigonOptionsFlow()


class TrigonOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input=None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        o = {**DEFAULT_OPTIONS, **self.config_entry.options}
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Optional(CONF_SIDEBAR, default=o[CONF_SIDEBAR]): bool,
                vol.Optional(CONF_UPDATE_INTERVAL, default=o[CONF_UPDATE_INTERVAL]): vol.All(vol.Coerce(int), vol.Range(min=2, max=60)),
                vol.Optional(CONF_PHONE_HEIGHT, default=o[CONF_PHONE_HEIGHT]): vol.All(vol.Coerce(float), vol.Range(min=0, max=3)),
                vol.Optional(CONF_MAX_DISTANCE, default=o[CONF_MAX_DISTANCE]): vol.All(vol.Coerce(float), vol.Range(min=3, max=50)),
                vol.Optional(CONF_AWAY_AFTER, default=o[CONF_AWAY_AFTER]): vol.All(vol.Coerce(int), vol.Range(min=30, max=1800)),
            }),
        )
