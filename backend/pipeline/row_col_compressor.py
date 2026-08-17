"""Stage 5: Row & Column Density Compressor (Hex Fingerprint Generator)

Quantizes 16 row density values and 16 column density values into an
immutable 16-character hexadecimal biometric fingerprint string.
"""
from typing import List


class RowColCompressor:
    """Averages pairwise projection buckets and quantizes them into hex characters."""

    HEX_DIGITS = "0123456789ABCDEF"

    def __init__(self, quantization_levels: int = 16):
        """Initialize compressor.

        Args:
            quantization_levels: Number of discrete bins (default 16 for hex 0..F).
        """
        self.quantization_levels = max(2, min(16, int(quantization_levels)))

    def compress(self, row_density: List[int], col_density: List[int]) -> str:
        """Generate 16-character hexadecimal fingerprint string.

        Args:
            row_density: 16 integer row projections.
            col_density: 16 integer column projections.

        Returns:
            16-character uppercase hex string (e.g. '015AF87025978753').
        """
        # Ensure exactly 16 elements per array (pad with 0 if necessary)
        rows = list(row_density) + [0] * max(0, 16 - len(row_density))
        cols = list(col_density) + [0] * max(0, 16 - len(col_density))

        # 1. Bucket row density into 8 adjacent pairs and average each pair
        row_avgs = [
            (rows[2 * k] + rows[2 * k + 1]) / 2.0
            for k in range(8)
        ]

        # 2. Bucket col density into 8 adjacent pairs and average each pair
        col_avgs = [
            (cols[2 * k] + cols[2 * k + 1]) / 2.0
            for k in range(8)
        ]

        # 3. Concatenate into 16 intermediate average values
        all_avgs = row_avgs + col_avgs

        # 4. Quantize relative to maximum observed average density
        max_val = max(all_avgs) if all_avgs else 0.0

        hex_chars = []
        for avg in all_avgs:
            if max_val <= 0:
                level = 0
            else:
                # Scale linearly to 0..(quantization_levels - 1)
                normalized = avg / max_val
                level = int(round(normalized * (self.quantization_levels - 1)))
                level = max(0, min(self.quantization_levels - 1, level))

            hex_chars.append(self.HEX_DIGITS[level])

        return "".join(hex_chars)
