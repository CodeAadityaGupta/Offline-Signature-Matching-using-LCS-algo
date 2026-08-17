"""Unit tests for Stage 4: MatrixToRowColConverter"""
import pytest
from backend.pipeline.row_col_converter import MatrixToRowColConverter


def test_row_col_converter_basic():
    """Verify row sums and column sums on a known 4x4 matrix."""
    converter = MatrixToRowColConverter(size=4)
    matrix = [
        "1000",
        "1100",
        "1110",
        "1111",
    ]
    row_density, col_density = converter.convert(matrix)

    assert row_density == [1, 2, 3, 4]
    assert col_density == [4, 3, 2, 1]


def test_row_col_converter_16x16():
    """Verify 16-element output on 16x16 compressed grid."""
    converter = MatrixToRowColConverter(size=16)
    matrix = ["0" * 16 for _ in range(16)]
    # Set diagonal bits to 1
    matrix_with_diag = [
        "".join("1" if c == r else "0" for c in range(16))
        for r in range(16)
    ]
    row_density, col_density = converter.convert(matrix_with_diag)

    assert len(row_density) == 16
    assert len(col_density) == 16
    assert row_density == [1] * 16
    assert col_density == [1] * 16


def test_row_col_converter_to_dict():
    """Verify dictionary serialization."""
    converter = MatrixToRowColConverter(size=2)
    matrix = ["10", "01"]
    res = converter.to_dict(matrix)

    assert "row_density" in res
    assert "col_density" in res
    assert res["row_density"] == [1, 1]
    assert res["col_density"] == [1, 1]
