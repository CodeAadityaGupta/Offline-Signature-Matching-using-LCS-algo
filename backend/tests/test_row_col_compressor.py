"""Unit tests for Stage 5: RowColCompressor (Hex Fingerprint Generator)"""
import pytest
from backend.pipeline.row_col_compressor import RowColCompressor


def test_row_col_compressor_length_and_hex_chars():
    """Verify generated string has length 16 and contains uppercase hexadecimal digits."""
    compressor = RowColCompressor(quantization_levels=16)
    row_density = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    col_density = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

    fp_string = compressor.compress(row_density, col_density)

    assert len(fp_string) == 16
    for ch in fp_string:
        assert ch in "0123456789ABCDEF", f"Invalid hex character: {ch}"


def test_row_col_compressor_all_zeros():
    """Verify all zeros input produces '0' * 16."""
    compressor = RowColCompressor(quantization_levels=16)
    row_density = [0] * 16
    col_density = [0] * 16

    fp_string = compressor.compress(row_density, col_density)
    assert fp_string == "0" * 16


def test_row_col_compressor_peak_symbol_f():
    """Verify maximum density bucket yields symbol 'F'."""
    compressor = RowColCompressor(quantization_levels=16)
    # Peak in second bucket (indices 2, 3)
    row_density = [0, 0, 100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    col_density = [0] * 16

    fp_string = compressor.compress(row_density, col_density)
    # Character index 1 (second pair) should be 'F'
    assert fp_string[1] == "F"
    # All others should be '0'
    assert fp_string[0] == "0"
    assert fp_string[2:] == "0" * 14
