"""Stage 2: Image to Binary Matrix Converter

Transforms raw handwritten signature images (PNG, JPG, BMP, WEBP, SVG)
into a normalized 64x64 binary bit matrix (1 for ink, 0 for background).
"""
import io
import re
from typing import Union, List
from PIL import Image, ImageDraw


class ImageToMatrixConverter:
    """Converts raw signature images to normalized 64x64 binary matrices."""

    def __init__(self, threshold: int = 128, working_resolution: int = 64):
        """Initialize converter.

        Args:
            threshold: Luminance cutoff (0..255). Pixels with brightness < threshold
                       are tagged as ink ('1'), otherwise background ('0').
            working_resolution: Dimension of square grid (default 64x64).
        """
        self.threshold = max(0, min(255, int(threshold)))
        self.working_resolution = max(8, int(working_resolution))

    def _render_svg_fallback(self, svg_bytes: bytes) -> Image.Image:
        """Rasterize simple SVG path/polyline data onto a blank canvas using PIL ImageDraw."""
        text = svg_bytes.decode("utf-8", errors="ignore")
        img = Image.new("L", (400, 200), color=255)
        draw = ImageDraw.Draw(img)

        # Match SVG path definitions
        path_matches = re.findall(r'd="([^"]+)"', text)
        for path_str in path_matches:
            # Parse simple coordinates from path commands
            coords = []
            tokens = re.findall(r'([MLCQSZ]|-?\d+(?:\.\d+)?)', path_str, re.IGNORECASE)
            i = 0
            while i < len(tokens):
                tok = tokens[i]
                if tok.upper() in ('M', 'L', 'C', 'Q', 'S'):
                    cmd = tok.upper()
                    i += 1
                    sub_coords = []
                    while i < len(tokens) and tokens[i].upper() not in ('M', 'L', 'C', 'Q', 'S', 'Z'):
                        try:
                            val = float(tokens[i])
                            sub_coords.append(val)
                            i += 1
                        except ValueError:
                            break
                    for p in range(0, len(sub_coords) - 1, 2):
                        coords.append((sub_coords[p], sub_coords[p + 1]))
                elif tok.upper() == 'Z':
                    i += 1
                else:
                    try:
                        val1 = float(tokens[i])
                        val2 = float(tokens[i + 1]) if i + 1 < len(tokens) else 0.0
                        coords.append((val1, val2))
                        i += 2
                    except (ValueError, IndexError):
                        i += 1

            if len(coords) >= 2:
                # Scale coordinates to fit the 400x200 canvas
                min_x = min(c[0] for c in coords)
                max_x = max(c[0] for c in coords)
                min_y = min(c[1] for c in coords)
                max_y = max(c[1] for c in coords)
                w = max(max_x - min_x, 1)
                h = max(max_y - min_y, 1)

                scaled = []
                for cx, cy in coords:
                    sx = 20 + ((cx - min_x) / w) * 360
                    sy = 20 + ((cy - min_y) / h) * 160
                    scaled.append((sx, sy))

                for j in range(len(scaled) - 1):
                    draw.line([scaled[j], scaled[j + 1]], fill=0, width=4)

        return img

    def load_image(self, source: Union[bytes, io.BytesIO, str, Image.Image]) -> Image.Image:
        """Load image into a normalized PIL Grayscale Image."""
        if isinstance(source, Image.Image):
            pil_img = source
        elif isinstance(source, str):
            with open(source, "rb") as f:
                raw_bytes = f.read()
            if raw_bytes.lstrip().startswith(b"<svg") or b"<svg" in raw_bytes[:100]:
                pil_img = self._render_svg_fallback(raw_bytes)
            else:
                pil_img = Image.open(io.BytesIO(raw_bytes))
        elif isinstance(source, bytes):
            if source.lstrip().startswith(b"<svg") or b"<svg" in source[:100]:
                pil_img = self._render_svg_fallback(source)
            else:
                pil_img = Image.open(io.BytesIO(source))
        elif isinstance(source, io.BytesIO):
            raw_bytes = source.getvalue()
            if raw_bytes.lstrip().startswith(b"<svg") or b"<svg" in raw_bytes[:100]:
                pil_img = self._render_svg_fallback(raw_bytes)
            else:
                source.seek(0)
                pil_img = Image.open(source)
        else:
            raise TypeError(f"Unsupported image source type: {type(source)}")

        # Handle alpha channel composite over solid white paper background
        if pil_img.mode in ("RGBA", "LA", "P"):
            pil_img = pil_img.convert("RGBA")
            background = Image.new("RGB", pil_img.size, (255, 255, 255))
            background.paste(pil_img, mask=pil_img.split()[3])
            pil_img = background

        # Convert to 8-bit Grayscale (0 = Black/Ink, 255 = White/Paper)
        grayscale = pil_img.convert("L")

        # Resize to working resolution using high-quality downsampling
        resample_filter = getattr(Image.Resampling, "LANCZOS", Image.LANCZOS)
        resized = grayscale.resize(
            (self.working_resolution, self.working_resolution),
            resample=resample_filter,
        )
        return resized

    def convert(self, source: Union[bytes, io.BytesIO, str, Image.Image]) -> List[str]:
        """Convert image to list of binary matrix string rows ('0' and '1').

        Args:
            source: Image bytes, path, or PIL Image.

        Returns:
            List of 64 strings, each containing 64 '0'/'1' characters.
        """
        img = self.load_image(source)
        width, height = img.size

        # In standard grayscale: 0 is dark (ink), 255 is light (background paper).
        # Pixel < threshold is Ink ('1'), Pixel >= threshold is Background ('0').
        pixels = list(img.getdata())
        rows = []
        for r in range(height):
            row_chars = []
            row_start = r * width
            for c in range(width):
                val = pixels[row_start + c]
                row_chars.append("1" if val < self.threshold else "0")
            rows.append("".join(row_chars))

        return rows

    def convert_to_2d_array(
        self, source: Union[bytes, io.BytesIO, str, Image.Image]
    ) -> List[List[int]]:
        """Convert image to 2D integer array [[0, 1, ...], ...]."""
        string_rows = self.convert(source)
        return [[1 if ch == "1" else 0 for ch in row] for row in string_rows]
