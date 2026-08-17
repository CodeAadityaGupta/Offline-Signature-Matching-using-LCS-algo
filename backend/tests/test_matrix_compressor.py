"""Unit tests for Stage 3: MatrixCompressor"""
import pytest
from backend.pipeline.matrix_compressor import MatrixCompressor


def test_compress_dimensions():
    """Verify 64x64 input with 4x4 block size compresses to 16x16."""
    compressor = MatrixCompressor(block_size=4, ink_ratio=0.10)
    input_64x64 = ["0" * 64 for _ in range(64)]
    compressed = compressor.compress(input_64x64)

    assert len(compressed) == 16
    for row in compressed:
        assert len(row) == 16


def test_compress_all_zeros():
    """Verify all zeros input produces all zeros output."""
    compressor = MatrixCompressor(block_size=4, ink_ratio=0.10)
    input_64x64 = ["0" * 64 for _ in range(64)]
    compressed = compressor.compress(input_64x64)

    for row in compressed:
        assert row == "0" * 16


def test_compress_all_ones():
    """Verify all ones input produces all ones output."""
    compressor = MatrixCompressor(block_size=4, ink_ratio=0.10)
    input_64x64 = ["1" * 64 for _ in range(64)]
    compressed = compressor.compress(input_64x64)

    for row in compressed:
        assert row == "1" * 16


def test_compress_ink_ratio_threshold():
    """Verify block with >= 10% ink (>= 2 out of 16 pixels) becomes '1', else '0'."""
    compressor = MatrixCompressor(block_size=4, ink_ratio=0.10)

    # 4x4 grid: 1 ink pixel out of 16 = 6.25% (< 10%) -> should be '0'
    grid_1_ink = [
        "1000",
        "0000",
        "0000",
        "0000",
    ]
    out_1 = compressor.compress(grid_1_ink)
    assert out_1 == ["0"]

    # 4x4 grid: 2 ink pixels out of 16 = 12.5% (>= 10%) -> should be '1'
    grid_2_ink = [
        "1100",
        "0000",
        "0000",
        "0000",
    ]
    out_2 = compressor.compress(grid_2_ink)
    assert out_2 == ["1"]


def test_compress_to_2d_array():
    """Verify 2D integer list output."""
    compressor = MatrixCompressor(block_size=4)
    grid = ["1" * 8 for _ in range(8)]
    out_2d = compressor.compress_to_2d_array(grid)

    assert len(out_2d) == 2
    assert len(out_2d[0]) == 2
    assert out_2d == [[1, 1], [1, 1]]
