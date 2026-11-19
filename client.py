"""Async ChurchTools REST client.

Deliberately free of Home Assistant imports so it can be tested and reused on
its own. The access token is only ever sent in the Authorization header and is
never included in exception messages or logs.

NOTE: Endpoint paths and response shapes for resources/bookings follow the
public ChurchTools API as far as known and must be verified against the
instance's own OpenAPI documentation in phase 3.
"""

from __future__ import annotations

import asyncio
from datetime import date
from typing import Any
from urllib.parse import urlparse

import aiohttp


class ChurchToolsError(Exception):
    """Base error."""


class ChurchToolsInvalidUrl(ChurchToolsError):
    """The configured URL is not usable."""


class ChurchToolsConnectionError(ChurchToolsError):
    """The server could not be reached or answered with an error."""


class ChurchToolsAuthError(ChurchToolsError):
    """The token was rejected or belongs to no user."""


def normalize_url(raw: str) -> str:
    """Return a clean base URL without trailing slash or /api suffix."""
    value = (raw or "").strip()
    if not value:
        raise ChurchToolsInvalidUrl("empty url")
    if "://" not in value:
        value = "https://" + value
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username:
        raise ChurchToolsInvalidUrl("unsupported url")
    path = parsed.path.rstrip("/")
    if path.endswith("/api"):
        path = path[: -len("/api")]
    return f"{parsed.scheme}://{parsed.netloc}{path}"


class ChurchToolsClient:
    """Minimal read-only ChurchTools client."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        base_url: str,
        token: str,
        timeout: float = 15,
    ) -> None:
        self._session = session
        self._base_url = normalize_url(base_url)
        self._token = token.strip()
        self._timeout = timeout

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        url = f"{self._base_url}/api{path}"
        headers = {"Authorization": f"Login {self._token}", "Accept": "application/json"}
        try:
            async with self._session.get(
                url,
                headers=headers,
                params=params,
                timeout=aiohttp.ClientTimeout(total=self._timeout),
            ) as resp:
                if resp.status in (401, 403):
                    raise ChurchToolsAuthError("token rejected")
                if resp.status >= 400:
                    raise ChurchToolsConnectionError(f"http {resp.status}")
                payload = await resp.json(content_type=None)
        except ChurchToolsError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError, OSError) as err:
            raise ChurchToolsConnectionError(type(err).__name__) from err
        except ValueError as err:
            raise ChurchToolsConnectionError("invalid json") from err
        if isinstance(payload, dict) and "data" in payload:
            return payload["data"]
        return payload

    async def whoami(self) -> dict[str, Any]:
        """Verify the token and return the id and name of the service user."""
        data = await self._get("/whoami")
        if not isinstance(data, dict) or data.get("id") in (None, -1):
            raise ChurchToolsAuthError("no user for token")
        name = f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
        return {"id": data["id"], "name": name}

    async def resources(self) -> list[dict[str, Any]]:
        """Return bookable resources (rooms etc.)."""
        data = await self._get("/resources")
        return data if isinstance(data, list) else []

    async def bookings(self, start: date, end: date) -> list[dict[str, Any]]:
        """Return bookings between two dates (inclusive)."""
        data = await self._get(
            "/bookings", {"from": start.isoformat(), "to": end.isoformat()}
        )
        return data if isinstance(data, list) else []
