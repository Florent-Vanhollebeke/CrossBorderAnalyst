import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

from main import app
from services.rag_fiscal import RAGService
from routers.rag_advisor import get_rag_service

client = TestClient(app)


@pytest.fixture
def mock_faiss_index():
    with patch('services.rag_fiscal.SentenceTransformer') as mock_model, \
         patch.object(RAGService, '_load_index'):
        mock_model.return_value.encode.return_value = [[0.1] * 384]
        yield mock_model


@pytest.fixture
def mock_anthropic():
    with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}), \
         patch('services.rag_fiscal.Anthropic') as mock_cls:
        mock_instance = mock_cls.return_value
        mock_message = MagicMock()
        mock_message.content = [MagicMock(text="D'apres le contexte, Geneve preleve a la source.")]
        mock_instance.messages.create.return_value = mock_message
        yield mock_instance


def setup_service_mock(service):
    mock_index = MagicMock()
    mock_index.search.return_value = ([[0.1, 0.2]], [[0, 1]])
    service.index = mock_index

    mock_chunk = MagicMock()
    mock_chunk.text = "Les impots a Geneve sont preleves a la source..."
    mock_chunk.metadata = {"canton": "GE", "source": "feuille_cantonale_ge.txt"}
    service.chunks = [mock_chunk, mock_chunk]


def test_rag_service_search(mock_faiss_index):
    """Test the vector search logic."""
    service = RAGService()
    setup_service_mock(service)
    results = service.search("impots geneve", top_k=2)

    assert len(results) == 2
    assert "impots a Geneve" in results[0]["text"]
    assert results[0]["canton"] == "GE"


def test_rag_service_ask(mock_faiss_index, mock_anthropic):
    """Test the answer generation using retrieved context."""
    service = RAGService()
    setup_service_mock(service)
    answer, sources = service.ask("Comment fonctionnent les impots a Geneve ?")

    assert "preleve a la source" in answer
    assert len(sources) > 0
    assert sources[0]["canton"] == "GE"


def test_rag_api_endpoint(mock_faiss_index, mock_anthropic):
    """Test the API endpoint for RAG assistant."""
    service = RAGService()
    setup_service_mock(service)
    app.dependency_overrides[get_rag_service] = lambda: service

    response = client.post(
        "/api/v1/ask",
        json={"question": "Comment fonctionnent les impots a Geneve ?", "filters": {"canton": "GE"}},
    )

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
    assert "preleve a la source" in data["answer"]
    assert len(data["sources"]) > 0

    app.dependency_overrides.clear()


def test_rag_empty_index(mock_faiss_index):
    """Test graceful handling when no FAISS data is loaded."""
    service = RAGService()
    # No setup_service_mock -> index=None, chunks=[]
    results = service.search("test query")
    assert results == []


def test_rag_ask_without_api_key(mock_faiss_index):
    """Test ask() returns sources but fallback message when API key missing."""
    with patch.dict(os.environ, {}, clear=True):
        os.environ.pop("ANTHROPIC_API_KEY", None)
        service = RAGService()
        setup_service_mock(service)
        answer, sources = service.ask("Test question")

    assert "pas configure" in answer.lower() or "sources" in answer.lower()
    assert len(sources) > 0


def test_rag_endpoint_error_no_stacktrace(mock_faiss_index):
    """Test that 500 errors don't expose stack traces."""
    service = RAGService()
    setup_service_mock(service)
    # Make ask() raise an unexpected error
    service.search = MagicMock(side_effect=RuntimeError("Secret internal error details"))
    app.dependency_overrides[get_rag_service] = lambda: service

    try:
        response = client.post(
            "/api/v1/ask",
            json={"question": "test"},
        )

        assert response.status_code == 500
        data = response.json()
        assert "Secret" not in data.get("detail", "")
        assert "interne" in data.get("detail", "").lower() or "rag" in data.get("detail", "").lower()
    finally:
        app.dependency_overrides.clear()


def test_rag_question_validation():
    """Test that empty question is rejected."""
    app.dependency_overrides.clear()
    response = client.post("/api/v1/ask", json={"question": ""})
    assert response.status_code == 422
