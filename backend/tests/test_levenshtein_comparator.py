"""Unit tests for Phase 10 Extension: LevenshteinComparator"""
import pytest
from backend.pipeline.levenshtein_comparator import LevenshteinComparator


def test_levenshtein_classic_example():
    """Verify classic kitten -> sitting (3 edits: k->s, e->i, +g)."""
    comparator = LevenshteinComparator(match_threshold_pct=50.0)
    result = comparator.compare("kitten", "sitting")

    assert result["distance"] == 3
    # similarity: (1 - 3/7) * 100 = 57.14%
    assert result["similarity_percent"] == 57.14
    assert result["verdict"] == "likely match"
    assert len(result["dp_table"]) == 7
    assert len(result["dp_table"][0]) == 8


def test_levenshtein_identical_strings():
    """Verify distance is 0 and similarity is 100% for identical strings."""
    comparator = LevenshteinComparator()
    s = "015AF87025978753"
    result = comparator.compare(s, s)

    assert result["distance"] == 0
    assert result["similarity_percent"] == 100.0
    assert result["verdict"] == "likely match"
    assert all(op["op"] == "match" for op in result["operations"])


def test_levenshtein_completely_different_strings():
    """Verify distance equals length and similarity is 0%."""
    comparator = LevenshteinComparator(match_threshold_pct=60.0)
    s1 = "AAAAAAAAAAAAAAAA"
    s2 = "BBBBBBBBBBBBBBBB"
    result = comparator.compare(s1, s2)

    assert result["distance"] == 16
    assert result["similarity_percent"] == 0.0
    assert result["verdict"] == "likely different"
