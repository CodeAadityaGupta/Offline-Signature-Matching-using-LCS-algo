"""Extension: Levenshtein Distance & Edit Alignment Comparator (Phase 10 Stretch)

Computes the minimum edit distance (insertions, deletions, substitutions) between
two biometric fingerprint strings, extracts the optimal edit script, and calculates
an alternative similarity metric to compare with LCS.
"""
from typing import Dict, List, Any


class LevenshteinComparator:
    """Computes Levenshtein edit distance, operations traceback, and similarity score."""

    def __init__(self, match_threshold_pct: float = 60.0):
        """Initialize LevenshteinComparator.

        Args:
            match_threshold_pct: Minimum similarity percentage (0..100) to classify as match.
        """
        self.match_threshold_pct = float(match_threshold_pct)

    def compare(self, s1: str, s2: str) -> Dict[str, Any]:
        """Perform Dynamic Programming Levenshtein alignment between s1 and s2.

        Args:
            s1: First biometric fingerprint string (e.g. 16 chars).
            s2: Second biometric fingerprint string (e.g. 16 chars).

        Returns:
            Dictionary containing:
                - distance: Minimum edit distance (integer >= 0)
                - similarity_percent: max(0, (1 - distance / max(len(s1), len(s2)))) * 100
                - dp_table: 2D integer matrix of size (len(s1)+1) x (len(s2)+1)
                - operations: List of edit operation tuples ('match'/'substitute'/'insert'/'delete')
                - verdict: 'likely match' or 'likely different'
        """
        m, n = len(s1), len(s2)

        # 1. Build (M+1) x (N+1) Levenshtein DP Table
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                cost = 0 if s1[i - 1] == s2[j - 1] else 1
                dp[i][j] = min(
                    dp[i - 1][j] + 1,        # Deletion
                    dp[i][j - 1] + 1,        # Insertion
                    dp[i - 1][j - 1] + cost  # Substitution / Match
                )

        # 2. Backtrack to reconstruct operations
        i, j = m, n
        ops_reversed = []

        while i > 0 or j > 0:
            if i > 0 and j > 0 and s1[i - 1] == s2[j - 1] and dp[i][j] == dp[i - 1][j - 1]:
                ops_reversed.append({"op": "match", "char_a": s1[i - 1], "char_b": s2[j - 1], "pos": [i, j]})
                i -= 1
                j -= 1
            elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
                ops_reversed.append({"op": "substitute", "char_a": s1[i - 1], "char_b": s2[j - 1], "pos": [i, j]})
                i -= 1
                j -= 1
            elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
                ops_reversed.append({"op": "delete", "char_a": s1[i - 1], "char_b": None, "pos": [i, j]})
                i -= 1
            else:
                ops_reversed.append({"op": "insert", "char_a": None, "char_b": s2[j - 1], "pos": [i, j]})
                j -= 1

        operations = ops_reversed[::-1]
        distance = dp[m][n]
        max_len = max(m, n, 1)
        similarity_percent = round(max(0.0, (1.0 - (distance / max_len)) * 100.0), 2)
        verdict = (
            "likely match"
            if similarity_percent >= self.match_threshold_pct
            else "likely different"
        )

        return {
            "distance": distance,
            "similarity_percent": similarity_percent,
            "dp_table": dp,
            "operations": operations,
            "verdict": verdict,
        }
