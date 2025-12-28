"""
Shared fixtures for PM Agent tests
"""

import os
import pytest
from unittest.mock import Mock, patch
from agno.memory import Memory


# Ensure required environment variables are set for tests
@pytest.fixture(autouse=True)
def set_test_environment():
    """Set required environment variables for testing"""
    with patch.dict(os.environ, {
        "API_BASE_URL": "http://test-api:3001",
        "AGENT_SERVICE_TOKEN": "test-service-token",
        "DATABASE_URL": "postgresql://test:test@localhost:5432/test",
    }):
        yield


@pytest.fixture
def mock_memory():
    """Create a mock memory object"""
    memory = Mock(spec=Memory)
    return memory


@pytest.fixture
def workspace_id():
    """Standard test workspace ID"""
    return "test_workspace_123"


@pytest.fixture
def project_id():
    """Standard test project ID"""
    return "test_project_456"


@pytest.fixture
def user_id():
    """Standard test user ID"""
    return "test_user_789"


@pytest.fixture
def mock_health_score_response():
    """Mock response for health score API"""
    return {
        "score": 75,
        "level": "GOOD",
        "trend": "STABLE",
        "factors": {
            "on_time_delivery": 0.80,
            "blocker_impact": 0.15,
            "team_capacity": 0.90,
            "velocity_trend": 0.85,
        },
        "explanation": "Project is performing well with good on-time delivery.",
        "suggestions": [
            "Consider addressing the blocking issues to improve score further."
        ],
    }


@pytest.fixture
def mock_risk_detection_response():
    """Mock response for risk detection API"""
    return {
        "risks": [
            {
                "type": "deadline_warning",
                "severity": "warning",
                "title": "Task due soon",
                "description": "3 tasks due within 48 hours",
                "affected_tasks": ["task_1", "task_2", "task_3"],
                "affected_users": ["user_1"],
            }
        ]
    }


@pytest.fixture
def mock_team_capacity_response():
    """Mock response for team capacity API"""
    return {
        "overloaded_members": [
            {
                "user_id": "user_1",
                "user_name": "John Doe",
                "assigned_hours": 45,
                "threshold": 40,
                "overload_percent": 12.5,
            }
        ],
        "team_health": "at_capacity",
    }


@pytest.fixture
def mock_velocity_response():
    """Mock response for velocity analysis API"""
    return {
        "current_velocity": 25,
        "baseline_velocity": 30,
        "change_percent": -16.67,
        "trend": "DOWN",
        "alert": False,
    }


@pytest.fixture
def mock_blocker_chains_response():
    """Mock response for blocker chains API"""
    return {
        "chains": [
            {
                "blocker_id": "task_blocker_1",
                "blocker_title": "API Integration",
                "blocked_tasks": ["task_1", "task_2", "task_3"],
                "severity": "critical",
            }
        ]
    }


@pytest.fixture
def mock_overdue_tasks_response():
    """Mock response for overdue tasks API"""
    return {
        "overdue": [
            {
                "id": "task_overdue_1",
                "title": "Overdue Task",
                "due_date": "2024-01-15T00:00:00Z",
                "days_overdue": 5,
                "assignee": "user_1",
            }
        ],
        "due_soon": [
            {
                "id": "task_due_soon_1",
                "title": "Task Due Soon",
                "due_date": "2024-01-21T00:00:00Z",
                "hours_remaining": 24,
                "assignee": "user_2",
            }
        ],
    }


@pytest.fixture
def mock_project_status_response():
    """Mock response for project status API"""
    return {
        "project_id": "test_project_456",
        "name": "Test Project",
        "status": "ACTIVE",
        "progress": 65,
        "task_count": 20,
        "completed_count": 13,
        "overdue_count": 2,
        "current_phase": {
            "id": "phase_1",
            "name": "Development",
            "status": "CURRENT",
        },
    }


@pytest.fixture
def mock_tasks_response():
    """Mock response for list tasks API"""
    return {
        "tasks": [
            {
                "id": "task_1",
                "title": "Implement feature",
                "status": "IN_PROGRESS",
                "priority": "HIGH",
                "assignee_id": "user_1",
                "due_date": "2024-01-25T00:00:00Z",
            },
            {
                "id": "task_2",
                "title": "Review code",
                "status": "TODO",
                "priority": "MEDIUM",
                "assignee_id": "user_2",
                "due_date": "2024-01-26T00:00:00Z",
            },
        ],
        "total": 2,
    }
