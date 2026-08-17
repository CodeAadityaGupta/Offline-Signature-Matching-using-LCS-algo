"""Unit tests for Stage 6: LCSComparator"""
import pytest
from backend.pipeline.lcs_comparator import LCSComparator


def test_lcs_worked_example():
    """Verify classic case study LCS example: ABCBDAB vs BDCABA -> LCS BCBA (len 4)."""
    comparator = LCSComparator(match_threshold_pct=50.0)
    result = comparator.compare("ABCBDAB", "BDCABA")

    assert result["lcs_length"] == 4
    # Valid common subsequences of length 4 include BCBA, BCAB, BDAB
    assert len(result["lcs_string"]) == 4
    assert result["similarity_percent"] == round((4 / 7) * 100, 2)
    assert result["verdict"] == "likely match"


def test_lcs_identical_16_char_strings():
    """Verify identical 16-char strings return 100% match, length 16, and 17x17 table."""
    comparator = LCSComparator(match_threshold_pct=60.0)
    s = "015AF87025978753"
    result = comparator.compare(s, s)

    assert result["lcs_length"] == 16
    assert result["lcs_string"] == s
    assert result["similarity_percent"] == 100.0
    assert result["verdict"] == "likely match"

    # Verify DP Table dimensions (17 x 17)
    assert len(result["dp_table"]) == 17
    for row in result["dp_table"]:
        assert len(row) == 17

    # Verify Traceback Path
    path = result["traceback_path"]
    assert path[0] == [0, 0]
    assert path[-1] == [16, 16]


def test_lcs_near_identical_reference_case_study():
    """Verify case study comparison between reference and questioned signatures."""
    comparator = LCSComparator(match_threshold_pct=60.0)
    s1 = "015AF87025978753"
    s2 = "0158F87025979853"
    result = comparator.compare(s1, s2)

    assert result["lcs_length"] == 14
    assert result["similarity_percent"] == 87.5
    assert result["verdict"] == "likely match"


def test_lcs_disjoint_strings():
    """Verify completely dissimilar strings yield 0% score and 'likely different'."""
    comparator = LCSComparator(match_threshold_pct=60.0)
    s1 = "AAAAAAAAAAAAAAAA"
    s2 = "BBBBBBBBBBBBBBBB"
    result = comparator.compare(s1, s2)

    assert result["lcs_length"] == 0
    assert result["lcs_string"] == ""
    assert result["similarity_percent"] == 0.0
    assert result["verdict"] == "likely different"


def test_traceback_path_connectivity():
    """Verify traceback path is continuous from [0, 0] to [M, N]."""
    comparator = LCSComparator()
    s1 = "015AF870"
    s2 = "0158F870"
    result = comparator.compare(s1, s2)

    path = result["traceback_path"]
    assert path[0] == [0, 0]
    assert path[-1] == [len(s1), len(s2)]

    for k in range(1, len(path)):
        r_prev, c_prev = path[k - 1]
        r_curr, c_curr = path[k]
        # Coordinates must advance monotonically by <= 1
        assert 0 <= (r_curr - r_prev) <= 1
        assert 0 <= (c_curr - c_prev) <= 1
        assert (r_curr - r_prev) + (c_curr - c_prev) >= 1
