"""Regenerate tizims.uz wordmark: transparent SVG + 4K PNG (no background)."""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"C:\Users\Xusniddin\iau-hr")
PUBLIC = ROOT / "public"
FONT_PATH = Path(r"C:\Windows\Fonts\segoeuib.ttf")

text = "tizims.uz"
font = TTFont(str(FONT_PATH))
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()
upem = font["head"].unitsPerEm

font_size = 220
scale = font_size / upem
pad = 12

adv = 0.0
bounds = None
x = 0.0
paths: list[str] = []
for ch in text:
    glyph = glyph_set[cmap[ord(ch)]]
    bpen = BoundsPen(glyph_set)
    tpen = TransformPen(bpen, Transform(scale, 0, 0, -scale, x, 0))
    glyph.draw(tpen)
    if bpen.bounds:
        gx0, gy0, gx1, gy1 = bpen.bounds
        if bounds is None:
            bounds = [gx0, gy0, gx1, gy1]
        else:
            bounds[0] = min(bounds[0], gx0)
            bounds[1] = min(bounds[1], gy0)
            bounds[2] = max(bounds[2], gx1)
            bounds[3] = max(bounds[3], gy1)
    x += glyph.width * scale
    adv = x

assert bounds is not None
minx, miny, maxx, maxy = bounds
# Shift glyphs so the tight box starts at (pad, pad)
dx = pad - minx
dy = pad - miny
vb_w = (maxx - minx) + pad * 2
vb_h = (maxy - miny) + pad * 2

x = 0.0
for ch in text:
    glyph = glyph_set[cmap[ord(ch)]]
    pen = SVGPathPen(glyph_set)
    tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, x + dx, dy))
    glyph.draw(tpen)
    d = pen.getCommands()
    if d:
        paths.append(d)
    x += glyph.width * scale

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w:.2f} {vb_h:.2f}" role="img" aria-label="tizims.uz">
  <g fill="#111111">
    {"".join(f'<path d="{d}"/>' for d in paths)}
  </g>
</svg>
'''

svg_out = PUBLIC / "logo.svg"
svg_out.write_text(svg, encoding="utf-8")
(PUBLIC / "favicon.svg").write_text(svg, encoding="utf-8")

FG = (17, 17, 17, 255)


def render_wordmark(png_w: int, png_h: int) -> Image.Image:
    """Black text on fully transparent background, supersampled for 4K edges."""
    ss = 4
    face = ImageFont.truetype(str(FONT_PATH), int(font_size * png_w / vb_w * ss))
    canvas = Image.new("RGBA", (png_w * ss, png_h * ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    bbox = draw.textbbox((0, 0), text, font=face)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (png_w * ss - tw) // 2 - bbox[0]
    ty = (png_h * ss - th) // 2 - bbox[1]
    draw.text((tx, ty), text, font=face, fill=FG)
    return canvas.resize((png_w, png_h), Image.Resampling.LANCZOS)


png_w = 3840
png_h = max(1, round(png_w * vb_h / vb_w))
logo = render_wordmark(png_w, png_h)
logo.save(PUBLIC / "logo.png", "PNG", optimize=True)

uhd = Image.new("RGBA", (3840, 2160), (0, 0, 0, 0))
# Large wordmark centered on 4K UHD canvas
fitted_h = min(900, png_h)
fitted_w = round(fitted_h * png_w / png_h)
fitted = render_wordmark(fitted_w, fitted_h)
ux = (3840 - fitted_w) // 2
uy = (2160 - fitted_h) // 2
uhd.paste(fitted, (ux, uy), fitted)
uhd.save(PUBLIC / "logo-4k.png", "PNG", optimize=True)

print("svg", svg_out, f"viewBox={vb_w:.1f}x{vb_h:.1f}")
print("png", PUBLIC / "logo.png", logo.size)
print("4k", PUBLIC / "logo-4k.png", uhd.size)
