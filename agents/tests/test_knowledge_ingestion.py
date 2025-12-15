import pytest


@pytest.mark.asyncio
async def test_ingest_text_adds_workspace_metadata(monkeypatch):
    from agents.knowledge import ingestion

    captured = {"docs": None}

    class DummyDoc:
        def __init__(self, content, name, metadata):
            self.content = content
            self.name = name
            self.metadata = metadata

    class DummyKnowledge:
        async def add_documents_async(self, docs):
            captured["docs"] = docs

    async def fake_get_workspace_knowledge(*, workspace_id, jwt_token):
        assert workspace_id == "ws-1"
        assert jwt_token == "jwt"
        return DummyKnowledge()

    monkeypatch.setattr(ingestion, "get_workspace_knowledge", fake_get_workspace_knowledge)
    monkeypatch.setattr(ingestion, "Document", DummyDoc)

    result = await ingestion.ingest_text(
        workspace_id="ws-1",
        jwt_token="jwt",
        text="hello world",
        title="My Title",
    )

    assert result.success is True
    assert captured["docs"] is not None
    assert len(captured["docs"]) == 1

    doc = captured["docs"][0]
    assert doc.content == "hello world"
    assert doc.name == "My Title"
    assert doc.metadata["workspace_id"] == "ws-1"
    assert doc.metadata["content_type"] == "text"
    assert doc.metadata["title"] == "My Title"

