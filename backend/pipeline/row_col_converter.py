"""Stage 4: Matrix to Row & Column Density Converter

Extracts 1D horizontal and vertical projection profiles from the
16x16 compressed binary matrix.
"""
from typing import List, Tuple, Union, Dict


class MatrixToRowColConverter:
    """Computes horizontal row density and vertical column density arrays."""

    def __init__(self, size: int = 16):
        """Initialize converter.

        Args:
            size: Expected grid dimension (default 16 for 16x16 compressed matrix).
        """
        self.size = size

    def convert(
        self, compressed_matrix: Union[List[str], List[List[Union[int, str]]]]
    ) -> Tuple[List[int], List[int]]:
        """Calculate row and column ink counts.

        Args:
            compressed_matrix: 16x16 binary matrix as list of strings or 2D list.

        Returns:
            Tuple of (row_density, col_density), each a list of 16 integers.
        """
        if not compressed_matrix:
            return ([0] * self.size, [0] * self.size)

        # Standardize rows into strings
        rows = [
            "".join(str(c) for c in r) if not isinstance(r, str) else r
            for r in compressed_matrix
        ]

        height = len(rows)
        width = len(rows[0]) if height > 0 else 0

        # Row density: count ink bits ('1') per horizontal row
        row_density = [
            sum(1 for ch in row if ch == "1")
            for row in rows
        ]

        # Column density: count ink bits ('1') per vertical column
        col_density = []
        for c in range(width):
            col_sum = sum(1 for r in range(height) if rows[r][c] == "1")
            col_density.append(col_sum)

        return (row_density, col_density)

    def to_dict(
        self, compressed_matrix: Union[List[str], List[List[Union[int, str]]]]
    ) -> Dict[str, List[int]]:
        """Return row and column density as a dictionary."""
        row_density, col_density = self.convert(compressed_matrix)
        return {
            "row_density": row_density,
            "col_density": col_density,
        }
