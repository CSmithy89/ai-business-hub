"""
Example Long-Running Tasks

This module provides example implementations of long-running tasks that
demonstrate the TaskManager patterns for multi-step operations.

These examples show:
- Multi-step task definitions with TaskStep
- Per-step timeout configuration
- Retry logic for unreliable operations
- Integration with state emitter for progress updates
- Proper context handling between steps

Usage:
    from gateway import research_competitor_landscape, bulk_data_export

    # Research task with progress streaming
    result = await research_competitor_landscape(
        competitors=["Acme", "BigCorp"],
        state_emitter=emitter,  # Optional for UI updates
    )

    # Export task with retry support
    result = await bulk_data_export(
        export_type="contacts",
        filters={"workspace": "ws_123"},
        state_emitter=emitter,
    )

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.5
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from hitl.task_manager import (
    TaskStep,
    TaskState,
    get_task_manager_sync,
)

if TYPE_CHECKING:
    from gateway.state_emitter import DashboardStateEmitter

logger = logging.getLogger(__name__)


# =============================================================================
# COMPETITOR LANDSCAPE RESEARCH
# =============================================================================


async def research_competitor_landscape(
    competitors: List[str],
    state_emitter: Optional[DashboardStateEmitter] = None,
) -> Dict[str, Any]:
    """
    Long-running task: Research competitor landscape.

    This is an example of a multi-step task that might take several minutes.
    It demonstrates the pattern for:
    - Breaking complex work into discrete steps
    - Passing results between steps
    - Configuring per-step timeouts
    - Integrating with state emitter for UI updates

    Steps:
    1. Gather competitor data from various sources (30s timeout)
    2. Analyze competitive strengths (60s timeout)
    3. Analyze competitive weaknesses (60s timeout)
    4. Generate comprehensive report (30s timeout)

    Args:
        competitors: List of competitor company names to research
        state_emitter: Optional state emitter for progress updates

    Returns:
        Dict with task_id, state, result, error, and duration_ms
    """

    # Step handlers
    async def gather_data(
        prev_result: Any,
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 1: Gather competitor data from various sources."""
        competitor_list = context.get("competitors", []) if context else []
        logger.info(f"Gathering data for {len(competitor_list)} competitors")

        # Simulate API calls to gather data
        await asyncio.sleep(1.5)

        data = {}
        for competitor in competitor_list:
            data[competitor] = {
                "name": competitor,
                "website": f"https://{competitor.lower().replace(' ', '')}.com",
                "founded": 2010,
                "employees": 100,
                "revenue": "$10M-$50M",
            }

        return {"competitors": competitor_list, "data": data}

    async def analyze_strengths(
        prev_result: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 2: Analyze competitive strengths."""
        logger.info("Analyzing competitor strengths")

        # Simulate analysis processing
        await asyncio.sleep(2.0)

        strengths = {}
        for competitor in prev_result.get("competitors", []):
            strengths[competitor] = [
                "Strong brand recognition",
                "Established customer base",
                "Competitive pricing",
            ]

        prev_result["strengths"] = strengths
        return prev_result

    async def analyze_weaknesses(
        prev_result: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 3: Analyze competitive weaknesses."""
        logger.info("Analyzing competitor weaknesses")

        # Simulate analysis processing
        await asyncio.sleep(1.5)

        weaknesses = {}
        for competitor in prev_result.get("competitors", []):
            weaknesses[competitor] = [
                "Limited product range",
                "Slow innovation cycle",
            ]

        prev_result["weaknesses"] = weaknesses
        return prev_result

    async def generate_report(
        prev_result: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 4: Generate comprehensive report."""
        logger.info("Generating competitor landscape report")

        # Simulate report generation
        await asyncio.sleep(0.8)

        prev_result["report_generated"] = True
        prev_result["report_timestamp"] = datetime.utcnow().isoformat()
        prev_result["summary"] = (
            f"Analyzed {len(prev_result.get('competitors', []))} competitors. "
            "Identified key strengths and weaknesses for each."
        )

        return prev_result

    # Define task steps
    steps = [
        TaskStep(
            name="Gathering competitor data",
            handler=gather_data,
            timeout_seconds=30,
        ),
        TaskStep(
            name="Analyzing strengths",
            handler=analyze_strengths,
            timeout_seconds=60,
        ),
        TaskStep(
            name="Analyzing weaknesses",
            handler=analyze_weaknesses,
            timeout_seconds=60,
        ),
        TaskStep(
            name="Generating report",
            handler=generate_report,
            timeout_seconds=30,
        ),
    ]

    # Get task manager and submit task
    manager = get_task_manager_sync(state_emitter)
    task_id = await manager.submit_task(
        name="Competitor Landscape Research",
        steps=steps,
        context={"competitors": competitors},
        overall_timeout=300,  # 5 minute overall timeout
    )

    # Wait for completion
    result = await manager.wait_for_task(task_id)

    return {
        "task_id": task_id,
        "state": result.state.value,
        "result": result.result,
        "error": result.error,
        "duration_ms": result.duration_ms,
        "steps_completed": result.steps_completed,
        "total_steps": result.total_steps,
    }


# =============================================================================
# BULK DATA EXPORT
# =============================================================================


async def bulk_data_export(
    export_type: str,
    filters: Optional[Dict[str, Any]] = None,
    state_emitter: Optional[DashboardStateEmitter] = None,
) -> Dict[str, Any]:
    """
    Long-running task: Bulk data export.

    This example demonstrates a task with retry logic for unreliable
    operations (like database queries that might timeout).

    Steps:
    1. Prepare export job (30s timeout)
    2. Fetch records from database (120s timeout, 2 retries)
    3. Transform data to export format (60s timeout)
    4. Generate export file (60s timeout)

    Args:
        export_type: Type of data to export (contacts, projects, etc.)
        filters: Optional filters to apply to the export
        state_emitter: Optional state emitter for progress updates

    Returns:
        Dict with task_id, state, file_url, error, and duration_ms
    """

    # Step handlers
    async def prepare_export(
        prev_result: Any,
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 1: Prepare export job."""
        export_type = context.get("export_type", "unknown") if context else "unknown"
        filters = context.get("filters", {}) if context else {}
        logger.info(f"Preparing {export_type} export with filters: {filters}")

        # Simulate job preparation
        await asyncio.sleep(0.5)

        job_id = f"export_{uuid.uuid4().hex[:8]}"
        return {
            "job_id": job_id,
            "export_type": export_type,
            "filters": filters,
            "record_count": 0,
        }

    async def fetch_records(
        prev_result: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 2: Fetch records from database (with retry support)."""
        export_type = prev_result.get("export_type", "unknown")
        logger.info(f"Fetching {export_type} records from database")

        # Simulate database query with potential for failure
        await asyncio.sleep(1.5)

        # Simulate fetched records
        records = [
            {"id": f"rec_{i}", "name": f"Record {i}", "data": {"field": i}}
            for i in range(100)
        ]

        prev_result["records"] = records
        prev_result["record_count"] = len(records)
        return prev_result

    async def transform_data(
        prev_result: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 3: Transform data to export format."""
        record_count = prev_result.get("record_count", 0)
        logger.info(f"Transforming {record_count} records for export")

        # Simulate data transformation
        await asyncio.sleep(1.0)

        # Transform records to export format
        transformed = []
        for record in prev_result.get("records", []):
            transformed.append({
                "id": record["id"],
                "name": record["name"],
                "exported_at": datetime.utcnow().isoformat(),
            })

        prev_result["transformed_records"] = transformed
        # Clear raw records to save memory
        prev_result.pop("records", None)
        return prev_result

    async def generate_file(
        prev_result: Dict[str, Any],
        context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Step 4: Generate export file."""
        job_id = prev_result.get("job_id", "unknown")
        record_count = prev_result.get("record_count", 0)
        logger.info(f"Generating export file for job {job_id}")

        # Simulate file generation
        await asyncio.sleep(0.8)

        file_name = f"{job_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        file_url = f"/exports/{file_name}"

        prev_result["file_url"] = file_url
        prev_result["file_name"] = file_name
        prev_result["export_completed"] = True
        prev_result["completed_at"] = datetime.utcnow().isoformat()

        # Clear transformed records from result
        prev_result.pop("transformed_records", None)

        return prev_result

    # Define task steps with retries on fetch
    steps = [
        TaskStep(
            name="Preparing export job",
            handler=prepare_export,
            timeout_seconds=30,
        ),
        TaskStep(
            name="Fetching records from database",
            handler=fetch_records,
            timeout_seconds=120,
            retries=2,  # Retry twice on failure/timeout
        ),
        TaskStep(
            name="Transforming data",
            handler=transform_data,
            timeout_seconds=60,
        ),
        TaskStep(
            name="Generating export file",
            handler=generate_file,
            timeout_seconds=60,
        ),
    ]

    # Get task manager and submit task
    manager = get_task_manager_sync(state_emitter)
    task_id = await manager.submit_task(
        name="Data Export",
        steps=steps,
        context={"export_type": export_type, "filters": filters or {}},
        overall_timeout=600,  # 10 minute overall timeout
    )

    # Wait for completion
    result = await manager.wait_for_task(task_id)

    # Extract file_url from result if available
    file_url = None
    if result.result and isinstance(result.result, dict):
        file_url = result.result.get("file_url")

    return {
        "task_id": task_id,
        "state": result.state.value,
        "file_url": file_url,
        "result": result.result,
        "error": result.error,
        "duration_ms": result.duration_ms,
        "steps_completed": result.steps_completed,
        "total_steps": result.total_steps,
    }


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================


def get_long_task_examples() -> List[Dict[str, Any]]:
    """
    Get metadata about available long-running task examples.

    Returns:
        List of task metadata dictionaries
    """
    return [
        {
            "name": "research_competitor_landscape",
            "description": "Research and analyze competitor companies",
            "estimated_duration_ms": 90000,  # ~90 seconds
            "steps": [
                "Gathering competitor data",
                "Analyzing strengths",
                "Analyzing weaknesses",
                "Generating report",
            ],
            "parameters": {
                "competitors": "List of competitor company names",
            },
        },
        {
            "name": "bulk_data_export",
            "description": "Export data in bulk to a file",
            "estimated_duration_ms": 60000,  # ~60 seconds
            "steps": [
                "Preparing export job",
                "Fetching records from database",
                "Transforming data",
                "Generating export file",
            ],
            "parameters": {
                "export_type": "Type of data to export",
                "filters": "Optional filters to apply",
            },
        },
    ]
