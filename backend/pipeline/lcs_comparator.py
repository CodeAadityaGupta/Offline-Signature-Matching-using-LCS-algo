"""Stage 6: Longest Common Subsequence (LCS) Comparator

Aligns two hexadecimal biometric fingerprint strings using Dynamic Programming,
reconstructs the optimal traceback path, and computes the similarity verdict.
"""
from typing import Dict, List, Any


class LCSComparator:
    """Computes Longest Common Subsequence alignment and similarity percentage."""

    def __init__(self, match_threshold_pct: float = 60.0):
        """Initialize LCSComparator.

        Args:
            match_threshold_pct: Minimum similarity percentage (0..100) required
                                 to classify signatures as a 'likely match'.
        """
        self.match_threshold_pct = float(match_threshold_pct)

    def compare(self, s1: str, s2: str) -> Dict[str, Any]:
        """Perform Dynamic Programming LCS alignment between s1 and s2.

        Args:
            s1: First biometric fingerprint string (e.g. 16 chars).
            s2: Second biometric fingerprint string (e.g. 16 chars).

        Returns:
            Dictionary containing:
                - lcs_length: Length of longest common subsequence
                - lcs_string: Extracted common subsequence string
                - similarity_percent: (lcs_length / len(s1)) * 100
                - dp_table: 2D integer matrix of size (len(s1)+1) x (len(s2)+1)
                - traceback_path: List of [r, c] coordinates from [0,0] to [M,N]
                - verdict: 'likely match' or 'likely different'
        """
        m = len(s1)
        n = len(s2)

        # 1. Build (M+1) x (N+1) DP Table
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if s1[i - 1] == s2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

        # 2. Reconstruct LCS String and Traceback Path
        i, j = m, n
        path_reversed = [[i, j]]
        lcs_chars_reversed = []

        while i > 0 and j > 0:
            if s1[i - 1] == s2[j - 1]:
                lcs_chars_reversed.append(s1[i - 1])
                i -= 1
                j -= 1
                path_reversed.append([i, j])
            elif dp[i - 1][j] >= dp[i][j - 1]:
                i -= 1
                path_reversed.append([i, j])
            else:
                j -= 1
                path_reversed.append([i, j])

        while i > 0:
            i -= 1
            path_reversed.append([i, 0])
        while j > 0:
            j -= 1
            path_reversed.append([0, j])

        # Reverse path to flow from [0, 0] down to [m, n]
        traceback_path = path_reversed[::-1]
        lcs_string = "".join(lcs_chars_reversed[::-1])
        lcs_length = dp[m][n]

        # 3. Compute Similarity Score & Decision Verdict
        max_len = max(m, 1)
        similarity_percent = round((lcs_length / max_len) * 100.0, 2)
        verdict = (
            "likely match"
            if similarity_percent >= self.match_threshold_pct
            else "likely different"
        )

        return {
            "lcs_length": lcs_length,
            "lcs_string": lcs_string,
            "similarity_percent": similarity_percent,
            "dp_table": dp,
            "traceback_path": traceback_path,
            "verdict": verdict,
        }
