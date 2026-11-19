"""Tests for the ChurchTools client (no Home Assistant needed)."""

import asyncio
import importlib.util
import pathlib

import aiohttp
import pytest

_path = pathlib.Path(__file__).parents[1] / "custom_components/smartchurch/churchtools/client.py"
_spec = importlib.util.spec_from_file_location("ct_client", _path)
ct = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ct)


class FakeResp:
    def __init__(self, status=200, payload=None):
        self.status, self._payload = status, payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def json(self, content_type=None):
        return self._payload


class FakeSession:
    def __init__(self, resp=None, exc=None):
        self.resp, self.exc, self.calls = resp, exc, []

    def get(self, url, **kw):
        self.calls.append((url, kw))
        if self.exc:
            raise self.exc
        return self.resp


def run(coro):
    return asyncio.run(coro)


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("demo.church.tools", "https://demo.church.tools"),
        ("https://demo.church.tools/", "https://demo.church.tools"),
        ("https://demo.church.tools/api", "https://demo.church.tools"),
        (" http://x.de/ct/api/ ", "http://x.de/ct"),
    ],
)
def test_normalize_url(raw, expected):
    assert ct.normalize_url(raw) == expected


@pytest.mark.parametrize("raw", ["", "   ", "ftp://x.de", "https://user:pw@x.de"])
def test_normalize_url_rejects(raw):
    with pytest.raises(ct.ChurchToolsInvalidUrl):
        ct.normalize_url(raw)


def test_whoami_ok_and_header():
    s = FakeSession(FakeResp(200, {"data": {"id": 7, "firstName": "Ada", "lastName": "K"}}))
    c = ct.ChurchToolsClient(s, "demo.church.tools", " secret ")
    assert run(c.whoami()) == {"id": 7, "name": "Ada K"}
    url, kw = s.calls[0]
    assert url == "https://demo.church.tools/api/whoami"
    assert kw["headers"]["Authorization"] == "Login secret"


@pytest.mark.parametrize("status", [401, 403])
def test_auth_rejected(status):
    c = ct.ChurchToolsClient(FakeSession(FakeResp(status)), "x.de", "t")
    with pytest.raises(ct.ChurchToolsAuthError):
        run(c.whoami())


def test_anonymous_user_is_auth_error():
    c = ct.ChurchToolsClient(FakeSession(FakeResp(200, {"data": {"id": -1}})), "x.de", "t")
    with pytest.raises(ct.ChurchToolsAuthError):
        run(c.whoami())


def test_server_error_and_network_error():
    c = ct.ChurchToolsClient(FakeSession(FakeResp(500)), "x.de", "t")
    with pytest.raises(ct.ChurchToolsConnectionError):
        run(c.whoami())
    c = ct.ChurchToolsClient(FakeSession(exc=aiohttp.ClientConnectionError()), "x.de", "t")
    with pytest.raises(ct.ChurchToolsConnectionError):
        run(c.whoami())
    c = ct.ChurchToolsClient(FakeSession(exc=asyncio.TimeoutError()), "x.de", "t")
    with pytest.raises(ct.ChurchToolsConnectionError):
        run(c.whoami())


def test_token_never_in_error_text():
    c = ct.ChurchToolsClient(FakeSession(FakeResp(401)), "x.de", "TOPSECRET")
    with pytest.raises(ct.ChurchToolsAuthError) as e:
        run(c.whoami())
    assert "TOPSECRET" not in str(e.value)


def test_resources_unwraps_data_list():
    c = ct.ChurchToolsClient(FakeSession(FakeResp(200, {"data": [{"id": 1}]})), "x.de", "t")
    assert run(c.resources()) == [{"id": 1}]
