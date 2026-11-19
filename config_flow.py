"""Config flow for SmartChurch."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .churchtools.client import (
    ChurchToolsAuthError,
    ChurchToolsClient,
    ChurchToolsConnectionError,
    ChurchToolsError,
    ChurchToolsInvalidUrl,
    normalize_url,
)
from .const import ALL_SCOPES, CONF_SCOPES, CONF_TOKEN, CONF_URL, DEFAULT_SCOPES, DOMAIN


class SmartChurchConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add ChurchTools as the first integration."""

    VERSION = 1

    async def _async_validate(self, url: str, token: str) -> str | None:
        """Return an error key or None if the connection works."""
        client = ChurchToolsClient(async_get_clientsession(self.hass), url, token)
        try:
            await client.whoami()
        except ChurchToolsAuthError:
            return "invalid_auth"
        except ChurchToolsConnectionError:
            return "cannot_connect"
        except ChurchToolsError:
            return "unknown"
        return None

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                url = normalize_url(user_input[CONF_URL])
            except ChurchToolsInvalidUrl:
                errors[CONF_URL] = "invalid_url"
            else:
                token = user_input[CONF_TOKEN].strip()
                if error := await self._async_validate(url, token):
                    errors["base"] = error
                else:
                    await self.async_set_unique_id(url)
                    self._abort_if_unique_id_configured()
                    return self.async_create_entry(
                        title=f"ChurchTools ({urlparse(url).hostname})",
                        data={CONF_URL: url, CONF_TOKEN: token},
                        options={CONF_SCOPES: DEFAULT_SCOPES},
                    )

        schema = vol.Schema(
            {
                vol.Required(CONF_URL): str,
                vol.Required(CONF_TOKEN): TextSelector(
                    TextSelectorConfig(type=TextSelectorType.PASSWORD)
                ),
            }
        )
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(
                schema, {CONF_URL: (user_input or {}).get(CONF_URL)}
            ),
            errors=errors,
        )

    async def async_step_reauth(self, entry_data: dict[str, Any]) -> ConfigFlowResult:
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            token = user_input[CONF_TOKEN].strip()
            if error := await self._async_validate(entry.data[CONF_URL], token):
                errors["base"] = error
            else:
                return self.async_update_reload_and_abort(
                    entry, data_updates={CONF_TOKEN: token}
                )
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_TOKEN): TextSelector(
                        TextSelectorConfig(type=TextSelectorType.PASSWORD)
                    )
                }
            ),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return SmartChurchOptionsFlow()


class SmartChurchOptionsFlow(OptionsFlow):
    """Choose which ChurchTools data SmartChurch may read."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        current = self.config_entry.options.get(CONF_SCOPES, DEFAULT_SCOPES)
        schema = vol.Schema(
            {
                vol.Required(CONF_SCOPES, default=current): SelectSelector(
                    SelectSelectorConfig(
                        options=ALL_SCOPES,
                        multiple=True,
                        translation_key="scopes",
                        mode=SelectSelectorMode.LIST,
                    )
                )
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
