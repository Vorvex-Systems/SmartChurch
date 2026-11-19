"""SmartChurch by Vorvex: ChurchTools bookings meet Home Assistant devices."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .churchtools.client import (
    ChurchToolsAuthError,
    ChurchToolsClient,
    ChurchToolsError,
)
from .const import (
    CONF_TOKEN,
    CONF_URL,
    DOMAIN,
    PANEL_ELEMENT,
    PANEL_URL_PATH,
    STATIC_URL,
    VERSION,
)
from .websocket_api import async_register_commands

_LOGGER = logging.getLogger(__name__)
_STATIC_KEY = f"{DOMAIN}_static_registered"
_PANEL_KEY = f"{DOMAIN}_panel_registered"


@dataclass
class SmartChurchRuntime:
    """Runtime objects of one config entry."""

    client: ChurchToolsClient


type SmartChurchConfigEntry = ConfigEntry[SmartChurchRuntime]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    async_register_commands(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: SmartChurchConfigEntry) -> bool:
    client = ChurchToolsClient(
        async_get_clientsession(hass), entry.data[CONF_URL], entry.data[CONF_TOKEN]
    )
    try:
        await client.whoami()
    except ChurchToolsAuthError as err:
        raise ConfigEntryAuthFailed("ChurchTools token rejected") from err
    except ChurchToolsError as err:
        raise ConfigEntryNotReady("ChurchTools not reachable") from err

    entry.runtime_data = SmartChurchRuntime(client=client)
    await _async_register_panel(hass)
    entry.async_on_unload(entry.add_update_listener(_async_reload_on_change))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: SmartChurchConfigEntry) -> bool:
    others = [
        e
        for e in hass.config_entries.async_loaded_entries(DOMAIN)
        if e.entry_id != entry.entry_id
    ]
    if not others and hass.data.get(_PANEL_KEY):
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
        hass.data[_PANEL_KEY] = False
    return True


async def _async_reload_on_change(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def _async_register_panel(hass: HomeAssistant) -> None:
    if not hass.data.get(_STATIC_KEY):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    STATIC_URL, str(Path(__file__).parent / "frontend"), False
                )
            ]
        )
        hass.data[_STATIC_KEY] = True
    if hass.data.get(_PANEL_KEY):
        return
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_ELEMENT,
        frontend_url_path=PANEL_URL_PATH,
        module_url=f"{STATIC_URL}/smartchurch-panel.js?v={VERSION}",
        sidebar_title="SmartChurch",
        sidebar_icon="mdi:church",
        require_admin=False,
        config={},
    )
    hass.data[_PANEL_KEY] = True
