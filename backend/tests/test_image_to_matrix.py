"""Unit tests for Stage 2: ImageToMatrixConverter"""
import io
import pytest
from PIL import Image, ImageDraw
from backend.pipeline.image_to_matrix import ImageToMatrixConverter


def create_test_image(mode="L", size=(128, 128), draw_func=None) -> bytes:
    """Helper to generate in-memory PNG images for testing."""
    img = Image.new(mode, size, color=255)
    if draw_func:
        draw = ImageDraw.Draw(img)
        draw_func(draw, size)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_matrix_dimensions_default_64():
    """Verify default output is 64 strings of length 64 (4,096 cells)."""
    converter = ImageToMatrixConverter(threshold=128, working_resolution=64)
    png_bytes = create_test_image()
    matrix = converter.convert(png_bytes)

    assert len(matrix) == 64
    for r, row in enumerate(matrix):
        assert len(row) == 64, f"Row {r} length is {len(row)}, expected 64"


def test_matrix_character_alphabet():
    """Verify matrix contains strictly '0' and '1' characters."""
    converter = ImageToMatrixConverter()
    png_bytes = create_test_image(
        draw_func=lambda draw, size: draw.line([(10, 10), (100, 100)], fill=0, width=5)
    )
    matrix = converter.convert(png_bytes)

    all_chars = set("".join(matrix))
    assert all_chars.issubset({"0", "1"})
    assert "1" in all_chars, "Expected at least one ink pixel from drawn line"


def test_blank_white_image_all_zeros():
    """Verify completely white image produces all '0's."""
    converter = ImageToMatrixConverter(threshold=128)
    png_bytes = create_test_image(size=(64, 64))
    matrix = converter.convert(png_bytes)

    total_ink = sum(row.count("1") for row in matrix)
    assert total_ink == 0, f"Expected 0 ink pixels on blank white image, got {total_ink}"


def test_solid_black_image_all_ones():
    """Verify completely black image produces all '1's."""
    converter = ImageToMatrixConverter(threshold=128)
    img = Image.new("L", (64, 64), color=0)
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    matrix = converter.convert(buf.getvalue())
    total_ink = sum(row.count("1") for row in matrix)
    assert total_ink == 64 * 64, f"Expected 4,096 ink pixels, got {total_ink}"


def test_threshold_sensitivity():
    """Higher threshold captures more gray pixels as ink."""
    # Gray image at luminance 100
    img = Image.new("L", (64, 64), color=100)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()

    # Threshold 50 (100 >= 50 -> background '0')
    conv_low = ImageToMatrixConverter(threshold=50)
    matrix_low = conv_low.convert(raw_bytes)
    ink_low = sum(r.count("1") for r in matrix_low)

    # Threshold 150 (100 < 150 -> ink '1')
    conv_high = ImageToMatrixConverter(threshold=150)
    matrix_high = conv_high.convert(raw_bytes)
    ink_high = sum(r.count("1") for r in matrix_high)

    assert ink_low == 0
    assert ink_high == 4096


def test_custom_resolution_32():
    """Verify custom working_resolution parameter."""
    converter = ImageToMatrixConverter(working_resolution=32)
    png_bytes = create_test_image()
    matrix = converter.convert(png_bytes)

    assert len(matrix) == 32
    assert len(matrix[0]) == 32


def test_svg_input_support():
    """Verify simple SVG stroke rasterization."""
    svg_sample = b"""<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 50 L 90 50" stroke="black" stroke-width="5" />
    </svg>"""
    converter = ImageToMatrixConverter()
    matrix = converter.convert(svg_sample)

    assert len(matrix) == 64
    assert len(matrix[0]) == 64
    total_ink = sum(r.count("1") for r in matrix)
    assert total_ink > 0, "Expected SVG line to produce ink bits"
