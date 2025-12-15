import pytest


@pytest.mark.asyncio
async def test_search_knowledge_applies_workspace_isolation_and_merges_filters(monkeypatch):
    from agents.knowledge import ingestion

    captured = {}

    class Doc:
        def __init__(self, content, metadata, score):
            self.content = content
            self.metadata = metadata
            self.score = score

    class Knowledge:
        def search(self, *, query, num_documents, filters=None, **_kwargs):
            captured["query"] = query
            captured["num_documents"] = num_documents
            captured["filters"] = filters
            return [
                Doc("a", {"workspace_id": "ws-1", "tag": "x"}, 0.9),
                Doc("b", {"workspace_id": "ws-1", "tag": "x"}, 0.8),
            ]

    async def fake_get_workspace_knowledge(*, workspace_id, jwt_token):
        assert workspace_id == "ws-1"
        assert jwt_token == "jwt"
        return Knowledge()

    monkeypatch.setattr(ingestion, "get_workspace_knowledge", fake_get_workspace_knowledge)

    results = await ingestion.search_knowledge(
        workspace_id="ws-1",
        jwt_token="jwt",
        query="hello",
        limit=1,
        offset=0,
        filters={"tag": "x"},
    )

    assert captured["filters"]["workspace_id"] == "ws-1"
    assert captured["filters"]["tag"] == "x"
    assert results == [{"content": "a", "metadata": {"workspace_id": "ws-1", "tag": "x"}, "score": 0.9}]


@pytest.mark.asyncio
async def test_search_knowledge_falls_back_to_filter_kwarg(monkeypatch):
    from agents.knowledge import ingestion

    captured = {}

    class Knowledge:
        # Intentionally does not accept `filters=` to trigger the compatibility fallback.
        def search(self, *, query, num_documents, filter=None):  # noqa: A002
            captured["filter"] = filter
            return []

    async def fake_get_workspace_knowledge(*, workspace_id, jwt_token):
        return Knowledge()

    monkeypatch.setattr(ingestion, "get_workspace_knowledge", fake_get_workspace_knowledge)

    await ingestion.search_knowledge(
        workspace_id="ws-1",
        jwt_token="jwt",
        query="hello",
        limit=5,
        offset=0,
        filters={"kind": "doc"},
    )

    assert captured["filter"] == {"workspace_id": "ws-1", "kind": "doc"}

