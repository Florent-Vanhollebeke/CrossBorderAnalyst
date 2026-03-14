# ============================================
# SwissRelocator — Tests TDD : agents IA
# backend/tests/test_agents.py
# Tous les appels Anthropic sont mockés (pas d'appel réseau en CI)
# ============================================

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))


# ============================================
# FIXTURES MOCK ANTHROPIC
# ============================================

def _make_mock_anthropic(content: str = "Réponse mock de Claude"):
    """Crée un mock du client Anthropic qui retourne un message texte."""
    mock_client = MagicMock()
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=content)]
    mock_client.messages.create.return_value = mock_message
    return mock_client


# ============================================
# TESTS — MarketScoutAgent
# ============================================

class TestMarketScoutAgent:
    @pytest.fixture
    def agent(self):
        from agents.market_scout import MarketScoutAgent
        return MarketScoutAgent()

    def test_agent_instantiation(self, agent):
        from agents.market_scout import MarketScoutAgent
        assert isinstance(agent, MarketScoutAgent)

    def test_analyze_returns_dict(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic("Analyse Zurich")):
            result = agent.analyze(city="Zurich", surface=200, sector="tech")
        assert isinstance(result, dict)

    def test_analyze_has_city_key(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic()):
            result = agent.analyze(city="Genève", surface=150, sector="finance")
        assert "city" in result

    def test_analyze_has_analysis_key(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic("Marché tendu")):
            result = agent.analyze(city="Lausanne", surface=100, sector="consulting")
        assert "analysis" in result

    def test_analyze_city_in_result(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic()):
            result = agent.analyze(city="Basel", surface=300, sector="pharma")
        assert result["city"] == "Basel"

    def test_analyze_handles_anthropic_error_gracefully(self, agent):
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception("API error")
        with patch.object(agent, "_client", mock_client):
            result = agent.analyze(city="Zurich", surface=100, sector="tech")
        assert "error" in result or "analysis" in result  # ne doit pas lever

    def test_analyze_supported_cities(self, agent):
        for city in ["Genève", "Lausanne", "Zürich", "Basel"]:
            with patch.object(agent, "_client", _make_mock_anthropic()):
                result = agent.analyze(city=city, surface=100, sector="tech")
            assert isinstance(result, dict)

    def test_analyze_calls_anthropic_once(self, agent):
        mock_client = _make_mock_anthropic()
        with patch.object(agent, "_client", mock_client):
            agent.analyze(city="Zurich", surface=200, sector="tech")
        mock_client.messages.create.assert_called_once()


# ============================================
# TESTS — LegalWatchdogAgent
# ============================================

class TestLegalWatchdogAgent:
    @pytest.fixture
    def agent(self):
        from agents.legal_watchdog import LegalWatchdogAgent
        return LegalWatchdogAgent()

    def test_agent_instantiation(self, agent):
        from agents.legal_watchdog import LegalWatchdogAgent
        assert isinstance(agent, LegalWatchdogAgent)

    def test_check_returns_dict(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic()):
            result = agent.check(country="CH", canton="ZH")
        assert isinstance(result, dict)

    def test_check_has_country_key(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic()):
            result = agent.check(country="CH", canton="GE")
        assert "country" in result

    def test_check_has_requirements_key(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic("Permis B requis")):
            result = agent.check(country="CH", canton="VD")
        assert "requirements" in result

    def test_check_country_in_result(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic()):
            result = agent.check(country="FR", canton=None)
        assert result["country"] == "FR"

    def test_check_handles_api_error(self, agent):
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception("timeout")
        with patch.object(agent, "_client", mock_client):
            result = agent.check(country="CH", canton="ZH")
        assert isinstance(result, dict)

    def test_check_swiss_cantons(self, agent):
        for canton in ["ZH", "GE", "VD", "BS"]:
            with patch.object(agent, "_client", _make_mock_anthropic()):
                result = agent.check(country="CH", canton=canton)
            assert isinstance(result, dict)

    def test_check_calls_anthropic_once(self, agent):
        mock_client = _make_mock_anthropic()
        with patch.object(agent, "_client", mock_client):
            agent.check(country="CH", canton="ZH")
        mock_client.messages.create.assert_called_once()


# ============================================
# TESTS — ChiefEditorAgent
# ============================================

class TestChiefEditorAgent:
    @pytest.fixture
    def agent(self):
        from agents.chief_editor import ChiefEditorAgent
        return ChiefEditorAgent()

    def test_agent_instantiation(self, agent):
        from agents.chief_editor import ChiefEditorAgent
        assert isinstance(agent, ChiefEditorAgent)

    def test_review_returns_dict(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic("Contenu validé")):
            result = agent.review("Le taux IS en Suisse est de 12%.")
        assert isinstance(result, dict)

    def test_review_has_approved_key(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic("APPROVED")):
            result = agent.review("Taux correct.")
        assert "approved" in result

    def test_review_has_feedback_key(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic("APPROVED: contenu exact")):
            result = agent.review("Réponse sur la fiscalité.")
        assert "feedback" in result

    def test_review_empty_content_returns_not_approved(self, agent):
        with patch.object(agent, "_client", _make_mock_anthropic()):
            result = agent.review("")
        assert result["approved"] is False

    def test_review_handles_api_error(self, agent):
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception("network error")
        with patch.object(agent, "_client", mock_client):
            result = agent.review("Contenu à vérifier")
        assert isinstance(result, dict)
        assert "approved" in result

    def test_review_calls_anthropic_once_for_nonempty_content(self, agent):
        mock_client = _make_mock_anthropic("APPROVED")
        with patch.object(agent, "_client", mock_client):
            agent.review("Un texte à vérifier")
        mock_client.messages.create.assert_called_once()
