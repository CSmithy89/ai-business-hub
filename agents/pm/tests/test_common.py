"""
Tests for PM Agent common utilities
"""

import os
import pytest
from unittest.mock import patch, Mock
import httpx
from pydantic import BaseModel


# Import with patched environment
@pytest.fixture(autouse=True)
def patch_env():
    """Patch environment before imports"""
    with patch.dict(os.environ, {
        "API_BASE_URL": "http://test-api:3001",
        "AGENT_SERVICE_TOKEN": "test-token",
    }):
        yield


class TestGetAuthHeaders:
    """Tests for get_auth_headers function"""

    def test_includes_workspace_id(self):
        """Test that workspace ID is included in headers"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            # Re-import to get fresh module with patched env
            from agents.pm.tools.common import get_auth_headers

            headers = get_auth_headers("workspace_123")
            assert headers["x-workspace-id"] == "workspace_123"

    def test_includes_content_type(self):
        """Test that Content-Type is set to JSON"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            from agents.pm.tools.common import get_auth_headers

            headers = get_auth_headers("workspace_123")
            assert headers["Content-Type"] == "application/json"

    def test_includes_auth_token_when_set(self):
        """Test that Authorization header is included when token is set"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "my-secret-token",
        }):
            # Need to reload module to pick up new env
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)

            headers = common_module.get_auth_headers("workspace_123")
            assert "Authorization" in headers
            assert headers["Authorization"] == "Bearer my-secret-token"


class TestAgentToolError:
    """Tests for AgentToolError exception"""

    def test_error_creation(self):
        """Test AgentToolError is created correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
        }):
            from agents.pm.tools.common import AgentToolError

            error = AgentToolError(
                message="Test error",
                status_code=500,
                tool_name="test_tool",
            )

            assert error.message == "Test error"
            assert error.status_code == 500
            assert error.tool_name == "test_tool"

    def test_to_dict(self):
        """Test AgentToolError.to_dict() conversion"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
        }):
            from agents.pm.tools.common import AgentToolError

            error = AgentToolError(
                message="Test error",
                status_code=404,
                tool_name="find_task",
            )

            result = error.to_dict()
            assert result["error"] is True
            assert result["message"] == "Test error"
            assert result["status_code"] == 404
            assert result["tool_name"] == "find_task"

    def test_error_as_exception(self):
        """Test AgentToolError can be raised and caught"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
        }):
            from agents.pm.tools.common import AgentToolError

            with pytest.raises(AgentToolError) as exc_info:
                raise AgentToolError(message="Something failed")

            assert str(exc_info.value) == "Something failed"


class TestApiError:
    """Tests for ApiError class"""

    def test_api_error_creation(self):
        """Test ApiError is created correctly"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
        }):
            from agents.pm.tools.common import ApiError

            error = ApiError(
                status_code=500,
                message="Internal Server Error",
                fallback_data={"items": []},
            )

            assert error.status_code == 500
            assert error.message == "Internal Server Error"
            assert error.fallback_data == {"items": []}

    def test_to_dict_with_fallback(self):
        """Test ApiError.to_dict() includes fallback data"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
        }):
            from agents.pm.tools.common import ApiError

            error = ApiError(
                status_code=404,
                message="Not found",
                fallback_data={"tasks": [], "total": 0},
            )

            result = error.to_dict()
            assert result["error"] == "HTTP 404"
            assert result["message"] == "Not found"
            assert result["tasks"] == []
            assert result["total"] == 0

    def test_to_dict_without_status_code(self):
        """Test ApiError.to_dict() when no status code"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
        }):
            from agents.pm.tools.common import ApiError

            error = ApiError(
                status_code=None,
                message="Connection refused",
            )

            result = error.to_dict()
            assert result["error"] == "Request failed"


class TestApiRequest:
    """Tests for api_request function"""

    def test_successful_get_request(self):
        """Test successful GET request"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)

            mock_response = Mock()
            mock_response.json.return_value = {"status": "ok"}
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = common_module.api_request(
                    "GET",
                    "/api/test",
                    "workspace_123",
                )

                assert result == {"status": "ok"}

    def test_http_error_returns_error_dict(self):
        """Test HTTP error returns error dictionary with fallback"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)

            mock_response = Mock()
            mock_response.status_code = 500
            http_error = httpx.HTTPStatusError(
                "Server Error",
                request=Mock(),
                response=mock_response,
            )
            mock_response.raise_for_status.side_effect = http_error

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = common_module.api_request(
                    "GET",
                    "/api/test",
                    "workspace_123",
                    fallback_data={"items": []},
                )

                assert "error" in result
                assert result["items"] == []

    def test_network_error_returns_error_dict(self):
        """Test network error returns error dictionary"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.side_effect = httpx.RequestError(
                    "Connection refused"
                )
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = common_module.api_request(
                    "GET",
                    "/api/test",
                    "workspace_123",
                    fallback_data={"data": None},
                )

                assert "error" in result
                assert result["data"] is None


class TestApiRequestStrict:
    """Tests for api_request_strict function"""

    def test_successful_request_with_validation(self):
        """Test successful request validates response"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)

            class TestModel(BaseModel):
                status: str
                count: int

            mock_response = Mock()
            mock_response.json.return_value = {"status": "ok", "count": 5}
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                result = common_module.api_request_strict(
                    "GET",
                    "/api/test",
                    "workspace_123",
                    TestModel,
                )

                assert isinstance(result, TestModel)
                assert result.status == "ok"
                assert result.count == 5

    def test_validation_error_raises_agent_tool_error(self):
        """Test validation error raises AgentToolError"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)

            class StrictModel(BaseModel):
                required_field: str

            mock_response = Mock()
            mock_response.json.return_value = {"wrong_field": "value"}
            mock_response.raise_for_status = Mock()

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                with pytest.raises(common_module.AgentToolError) as exc_info:
                    common_module.api_request_strict(
                        "GET",
                        "/api/test",
                        "workspace_123",
                        StrictModel,
                    )

                assert "Invalid response format" in exc_info.value.message

    def test_http_error_raises_agent_tool_error(self):
        """Test HTTP error raises AgentToolError"""
        with patch.dict(os.environ, {
            "API_BASE_URL": "http://test-api:3001",
            "AGENT_SERVICE_TOKEN": "test-token",
        }):
            import importlib
            import agents.pm.tools.common as common_module
            importlib.reload(common_module)

            class TestModel(BaseModel):
                data: str

            mock_response = Mock()
            mock_response.status_code = 404
            http_error = httpx.HTTPStatusError(
                "Not Found",
                request=Mock(),
                response=mock_response,
            )
            mock_response.raise_for_status.side_effect = http_error

            with patch("httpx.Client") as mock_client:
                mock_client_instance = Mock()
                mock_client_instance.request.return_value = mock_response
                mock_client.return_value.__enter__ = Mock(
                    return_value=mock_client_instance
                )
                mock_client.return_value.__exit__ = Mock(return_value=False)

                with pytest.raises(common_module.AgentToolError) as exc_info:
                    common_module.api_request_strict(
                        "GET",
                        "/api/test",
                        "workspace_123",
                        TestModel,
                    )

                assert exc_info.value.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
