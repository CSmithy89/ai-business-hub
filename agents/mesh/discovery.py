"""
Agent Discovery Service

Service for discovering agents via A2A protocol. Discovers agents by querying
/.well-known/agent.json endpoints, parsing AgentCards, and registering
discovered agents in the mesh registry.

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx

from .models import AgentCapability, AgentHealth, MeshAgentCard
from .registry import get_registry

logger = logging.getLogger(__name__)

# Default discovery endpoint path per A2A protocol
WELL_KNOWN_PATH = "/.well-known/agent.json"

# Default HTTP timeout for discovery requests
DEFAULT_TIMEOUT = 30.0


class DiscoveryError(Exception):
    """Base exception for discovery errors."""

    pass


class AgentNotFoundError(DiscoveryError):
    """Raised when an agent cannot be found at the specified URL."""

    pass


class InvalidAgentCardError(DiscoveryError):
    """Raised when an AgentCard is invalid or cannot be parsed."""

    pass


class DiscoveryService:
    """
    Service for discovering agents via A2A protocol.

    Discovers agents by:
    1. Querying /.well-known/agent.json endpoints
    2. Parsing AgentCards from the response
    3. Registering discovered agents in the global registry

    Features:
    - Single agent discovery via URL
    - Batch scanning of multiple discovery URLs
    - Periodic background scanning
    - Automatic health monitoring
    - External agent registration

    Usage:
        service = DiscoveryService(
            discovery_urls=["http://external-agent:8000"],
            scan_interval=300,  # 5 minutes
        )

        await service.start()

        # Manual discovery
        agent = await service.discover_agent("http://external-agent:8000")

        # Stop when done
        await service.stop()
    """

    def __init__(
        self,
        discovery_urls: Optional[List[str]] = None,
        scan_interval: int = 300,
        timeout: float = DEFAULT_TIMEOUT,
        auto_register: bool = True,
    ) -> None:
        """
        Initialize the discovery service.

        Args:
            discovery_urls: Initial list of URLs to scan for agents
            scan_interval: Seconds between periodic scans (default: 300 = 5 minutes)
            timeout: HTTP request timeout in seconds (default: 30)
            auto_register: Whether to automatically register discovered agents
        """
        self.discovery_urls: List[str] = list(discovery_urls or [])
        self.scan_interval = scan_interval
        self.timeout = timeout
        self.auto_register = auto_register

        self._client: Optional[httpx.AsyncClient] = None
        self._running = False
        self._scan_task: Optional[asyncio.Task] = None

    @property
    def is_running(self) -> bool:
        """Check if the discovery service is currently running."""
        return self._running

    async def start(self) -> None:
        """
        Start the discovery service.

        Initializes the HTTP client, performs an initial scan,
        and starts periodic background scanning.
        """
        if self._running:
            logger.warning("Discovery service already running")
            return

        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout),
            follow_redirects=True,
        )
        self._running = True

        logger.info(
            f"Discovery service started "
            f"(urls={len(self.discovery_urls)}, interval={self.scan_interval}s)"
        )

        # Perform initial scan
        if self.discovery_urls:
            await self.scan()

        # Start periodic scanning if we have URLs
        if self.discovery_urls and self.scan_interval > 0:
            self._scan_task = asyncio.create_task(self._periodic_scan())

    async def stop(self) -> None:
        """
        Stop the discovery service.

        Cancels periodic scanning and closes the HTTP client.
        """
        self._running = False

        if self._scan_task:
            self._scan_task.cancel()
            try:
                await self._scan_task
            except asyncio.CancelledError:
                pass
            self._scan_task = None

        if self._client:
            await self._client.aclose()
            self._client = None

        logger.info("Discovery service stopped")

    async def scan(self) -> List[MeshAgentCard]:
        """
        Scan all discovery URLs for agents.

        Attempts to discover agents from all configured URLs.
        Failures for individual URLs are logged but don't stop
        the overall scan.

        Returns:
            List of successfully discovered agents
        """
        if not self._client:
            raise RuntimeError("Discovery service not started")

        discovered: List[MeshAgentCard] = []

        for url in self.discovery_urls:
            try:
                agent = await self.discover_agent(url)
                if agent:
                    discovered.append(agent)
            except DiscoveryError as e:
                logger.warning(f"Discovery failed for {url}: {e}")
            except Exception as e:
                logger.error(f"Unexpected error discovering {url}: {e}")

        logger.info(f"Scan complete: discovered {len(discovered)} agents")
        return discovered

    async def discover_agent(self, base_url: str) -> Optional[MeshAgentCard]:
        """
        Discover an agent at a specific URL.

        Fetches the AgentCard from the /.well-known/agent.json endpoint,
        parses it, and optionally registers it in the global registry.

        Args:
            base_url: Base URL of the agent to discover

        Returns:
            The discovered MeshAgentCard, or None if discovery failed

        Raises:
            AgentNotFoundError: If the agent endpoint returns 404
            InvalidAgentCardError: If the response cannot be parsed
            DiscoveryError: For other discovery errors
        """
        if not self._client:
            raise RuntimeError("Discovery service not started")

        # Build discovery URL
        discovery_url = f"{base_url.rstrip('/')}{WELL_KNOWN_PATH}"

        try:
            logger.debug(f"Discovering agent at {discovery_url}")

            response = await self._client.get(discovery_url)

            if response.status_code == 404:
                raise AgentNotFoundError(f"No agent found at {base_url}")

            response.raise_for_status()

            data = response.json()

            # Parse the AgentCard
            agent = self._parse_agent_card(data, base_url)

            # Mark as external since discovered via network
            agent.is_external = True

            # Register if auto_register is enabled
            if self.auto_register:
                registry = get_registry()
                registry.register(agent)
                logger.info(f"Discovered and registered external agent: {agent.name}")
            else:
                logger.info(f"Discovered external agent: {agent.name}")

            return agent

        except AgentNotFoundError:
            raise
        except httpx.HTTPStatusError as e:
            raise DiscoveryError(f"HTTP error discovering {base_url}: {e}")
        except httpx.ConnectError as e:
            raise DiscoveryError(f"Connection failed to {base_url}: {e}")
        except httpx.TimeoutException:
            raise DiscoveryError(f"Timeout discovering {base_url}")
        except InvalidAgentCardError:
            raise
        except Exception as e:
            raise DiscoveryError(f"Unexpected error: {e}")

    def _parse_agent_card(self, data: Dict[str, Any], base_url: str) -> MeshAgentCard:
        """
        Parse an AgentCard from JSON data.

        Handles both standard A2A AgentCard format and simplified formats.

        Args:
            data: JSON data from the discovery endpoint
            base_url: The URL the agent was discovered from

        Returns:
            Parsed MeshAgentCard

        Raises:
            InvalidAgentCardError: If required fields are missing
        """
        try:
            # Extract required fields
            name = data.get("name")
            if not name:
                raise InvalidAgentCardError("AgentCard missing 'name' field")

            description = data.get("description", f"Agent at {base_url}")
            url = data.get("url", base_url)

            # Parse skills/capabilities
            skills: List[AgentCapability] = []
            skills_data = data.get("skills", [])

            for skill_data in skills_data:
                if isinstance(skill_data, dict):
                    skill = AgentCapability(
                        id=skill_data.get("id", ""),
                        name=skill_data.get("name", ""),
                        description=skill_data.get("description", ""),
                        input_modes=skill_data.get("inputModes", ["text"]),
                        output_modes=skill_data.get("outputModes", ["text"]),
                        tags=skill_data.get("tags"),
                    )
                    skills.append(skill)

            # Build the agent card
            agent = MeshAgentCard(
                name=name,
                description=description,
                url=url,
                version=data.get("version", "1.0.0"),
                capabilities=data.get("capabilities", {}),
                skills=skills,
                default_input_modes=data.get("defaultInputModes", ["text"]),
                default_output_modes=data.get("defaultOutputModes", ["text"]),
                is_external=True,
                module=data.get("module"),
                health=AgentHealth.HEALTHY,
                metadata=data.get("metadata", {}),
            )

            return agent

        except InvalidAgentCardError:
            raise
        except Exception as e:
            raise InvalidAgentCardError(f"Failed to parse AgentCard: {e}")

    async def _periodic_scan(self) -> None:
        """
        Run periodic scans in the background.

        Continuously scans discovery URLs at the configured interval
        until the service is stopped.
        """
        while self._running:
            try:
                await asyncio.sleep(self.scan_interval)
                if self._running:
                    await self.scan()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error during periodic scan: {e}")

    def add_discovery_url(self, url: str) -> None:
        """
        Add a URL to the discovery list.

        Args:
            url: The base URL to add for agent discovery
        """
        if url not in self.discovery_urls:
            self.discovery_urls.append(url)
            logger.debug(f"Added discovery URL: {url}")

    def remove_discovery_url(self, url: str) -> bool:
        """
        Remove a URL from the discovery list.

        Args:
            url: The URL to remove

        Returns:
            True if URL was found and removed, False otherwise
        """
        try:
            self.discovery_urls.remove(url)
            logger.debug(f"Removed discovery URL: {url}")
            return True
        except ValueError:
            return False

    def get_discovery_urls(self) -> List[str]:
        """
        Get the list of discovery URLs.

        Returns:
            Copy of the current discovery URL list
        """
        return list(self.discovery_urls)

    async def check_agent_health(self, agent_name: str) -> AgentHealth:
        """
        Check the health of a registered agent.

        Attempts to connect to the agent's URL and update its health status.

        Args:
            agent_name: Name of the agent to check

        Returns:
            The updated health status
        """
        if not self._client:
            raise RuntimeError("Discovery service not started")

        registry = get_registry()
        agent = registry.get(agent_name)

        if not agent:
            return AgentHealth.UNKNOWN

        try:
            # Try to fetch the agent card
            discovery_url = f"{agent.url.rstrip('/')}{WELL_KNOWN_PATH}"
            response = await self._client.get(discovery_url)

            if response.status_code == 200:
                registry.update_health(agent_name, True)
                return AgentHealth.HEALTHY
            else:
                registry.set_health(agent_name, AgentHealth.DEGRADED)
                return AgentHealth.DEGRADED

        except Exception as e:
            logger.warning(f"Health check failed for {agent_name}: {e}")
            registry.update_health(agent_name, False)
            return AgentHealth.UNHEALTHY

    async def health_check_all(self) -> Dict[str, AgentHealth]:
        """
        Check health of all external agents.

        Returns:
            Dict mapping agent names to their health status
        """
        registry = get_registry()
        external_agents = registry.list_external()

        results: Dict[str, AgentHealth] = {}
        for agent in external_agents:
            health = await self.check_agent_health(agent.name)
            results[agent.name] = health

        return results


# =============================================================================
# GLOBAL SINGLETON
# =============================================================================

_discovery_service: Optional[DiscoveryService] = None


def get_discovery_service() -> DiscoveryService:
    """
    Get the global discovery service singleton.

    Creates a default DiscoveryService on first access.

    Returns:
        The global DiscoveryService instance
    """
    global _discovery_service

    if _discovery_service is None:
        _discovery_service = DiscoveryService()
        logger.info("Global discovery service initialized")

    return _discovery_service


def configure_discovery_service(
    discovery_urls: Optional[List[str]] = None,
    scan_interval: int = 300,
    timeout: float = DEFAULT_TIMEOUT,
    auto_register: bool = True,
) -> DiscoveryService:
    """
    Configure and return the global discovery service.

    Creates a new DiscoveryService with the specified configuration,
    replacing any existing singleton.

    Args:
        discovery_urls: List of URLs to scan for agents
        scan_interval: Seconds between scans
        timeout: HTTP timeout in seconds
        auto_register: Whether to auto-register discovered agents

    Returns:
        The configured DiscoveryService instance
    """
    global _discovery_service

    _discovery_service = DiscoveryService(
        discovery_urls=discovery_urls,
        scan_interval=scan_interval,
        timeout=timeout,
        auto_register=auto_register,
    )

    logger.info(
        f"Discovery service configured "
        f"(urls={len(discovery_urls or [])}, interval={scan_interval}s)"
    )

    return _discovery_service


async def shutdown_discovery_service() -> None:
    """
    Shutdown the global discovery service.

    Stops the service if running and clears the singleton.
    """
    global _discovery_service

    if _discovery_service:
        await _discovery_service.stop()
        _discovery_service = None
        logger.info("Global discovery service shutdown")
