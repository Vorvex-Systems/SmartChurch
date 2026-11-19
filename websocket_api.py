"""WebSocket commands used by the SmartChurch panel. Never exposes secrets."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .churchtools.client import ChurchToolsAuthError, ChurchToolsError
from .const import CONF_SCOPES, CONF_URL, DEFAULT_SCOPES, DOMAIN, VERSION


def async_register_commands(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_status)
    websocket_api.async_register_command(hass, ws_test_churchtools)


@websocket_api.websocket_command({vol.Required("type"): "smartchurch/status"})
@websocket_api.async_response
async def ws_status(hass: HomeAssistant, connection: Any, msg: dict[str, Any]) -> None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    is_admin = connection.user.is_admin
    churchtools: dict[str, Any] = {"configured": bool(entries)}
    if entries:
        entry = entries[0]
        churchtools["scopes"] = entry.options.get(CONF_SCOPES, DEFAULT_SCOPES)
        if is_admin:
            churchtools["host"] = urlparse(entry.data[CONF_URL]).hostname
    connection.send_result(
        msg["id"],
        {"version": VERSION, "is_admin": is_admin, "churchtools": churchtools},
    )


@websocket_api.websocket_command({vol.Required("type"): "smartchurch/churchtools/test"})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_test_churchtools(
    hass: HomeAssistant, connection: Any, msg: dict[str, Any]
) -> None:
    entries = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entries:
        connection.send_result(msg["id"], {"ok": False, "error": "not_configured"})
        return
    client = entries[0].runtime_data.client
    try:
        user = await client.whoami()
    except ChurchToolsAuthError:
        connection.send_result(msg["id"], {"ok": False, "error": "invalid_auth"})
    except ChurchToolsError:
        connection.send_result(msg["id"], {"ok": False, "error": "cannot_connect"})
    else:
        connection.send_result(msg["id"], {"ok": True, "user": user["name"]})
