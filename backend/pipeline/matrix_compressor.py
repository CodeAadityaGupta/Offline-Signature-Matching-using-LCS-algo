"""Stage 3: Sub-Block Matrix Compressor

Downsamples the 64x64 binary matrix into a 16x16 spatial feature grid
using non-overlapping 4x4 sub-block pooling and ink density thresholding.
"""
from typing import List, Union


class MatrixCompressor:
    """Compresses 64x64 binary bit matrices into 16x16 feature matrices."""

    def __init__(self, block_size: int = 4, ink_ratio: float = 0.10):
        """Initialize MatrixCompressor.

        Args:
            block_size: Dimension of square pooling sub-block (default 4 for 4x4 blocks).
            ink_ratio: Minimum fraction of ink pixels required in a block to mark
                       the compressed cell as '1' (default 0.10, meaning >= 10% ink).
        """
        self.block_size = max(1, int(block_size))
        self.ink_ratio = max(0.0, min(1.0, float(ink_ratio)))

    def compress(self, binary_matrix: Union[List[str], List[List[Union[int, str]]]]) -> List[str]:
        """Compress binary matrix into downsampled grid.

        Args:
            binary_matrix: List of binary strings or 2D list of 0/1 bits.

        Returns:
            List of compressed binary strings (e.g., 16 strings of length 16).
        """
        if not binary_matrix:
            return []

        # Standardize rows into strings
        rows = [
            "".join(str(c) for c in r) if not isinstance(r, str) else r
            for r in binary_matrix
        ]

        height = len(rows)
        width = len(rows[0]) if height > 0 else 0

        out_rows = height // self.block_size
        out_cols = width // self.block_size
        block_area = self.block_size * self.block_size

        compressed_rows = []
        for br in range(out_rows):
            row_chars = []
            r_start = br * self.block_size
            r_end = r_start + self.block_size

            for bc in range(out_cols):
                c_start = bc * self.block_size
                c_end = c_start + self.block_size

                # Count ink bits ('1') in the block
                ink_count = sum(
                    rows[r][c] == "1"
                    for r in range(r_start, r_end)
                    for c in range(c_start, c_end)
                )

                # If ratio of ink in block >= ink_ratio, mark as '1', else '0'
                ratio = ink_count / block_area if block_area > 0 else 0.0
                row_chars.append("1" if ratio >= self.ink_ratio else "0")

            compressed_rows.append("".join(row_chars))

        return compressed_rows

    def compress_to_2d_array(
        self, binary_matrix: Union[List[str], List[List[Union[int, str]]]]
    ) -> List[List[int]]:
        """Compress binary matrix into 2D integer list [[0, 1, ...], ...]."""
        string_rows = self.compress(binary_matrix)
        return [[1 if ch == "1" else 0 for ch in row] for row in string_rows]
