"""Constants for SmartChurch by Vorvex."""

from __future__ import annotations

DOMAIN = "smartchurch"
NAME = "SmartChurch by Vorvex"
VERSION = "0.1.0"  # keep in sync with manifest.json

CONF_URL = "url"
CONF_TOKEN = "token"
CONF_SCOPES = "scopes"

SCOPE_RESOURCES = "resources"
SCOPE_BOOKINGS = "bookings"
SCOPE_EVENTS = "events"
SCOPE_GROUPS = "groups"
SCOPE_PERSONS = "persons"

ALL_SCOPES = [SCOPE_RESOURCES, SCOPE_BOOKINGS, SCOPE_EVENTS, SCOPE_GROUPS, SCOPE_PERSONS]
# Privacy by default: personal data (persons, groups) is never enabled implicitly.
DEFAULT_SCOPES = [SCOPE_RESOURCES, SCOPE_BOOKINGS]

PANEL_URL_PATH = "smartchurch"
PANEL_ELEMENT = "smartchurch-panel"
STATIC_URL = "/smartchurch_static"
