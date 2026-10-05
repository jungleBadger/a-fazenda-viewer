"""Generate the original extension icon and Chrome Web Store promo tile (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BACKGROUND = '#171a17'
ACCENT = '#e3c879'
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'

def font(size):
    return ImageFont.truetype(FONT, size)

def icon(size):
    image = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((16, 16, 496, 496), radius=104, fill=BACKGROUND)
    for row in range(2):
        for col in range(3):
            x, y = 83 + 120 * col, 145 + 120 * row
            draw.rounded_rectangle((x, y, x + 106, y + 106), radius=20,
                                   fill=ACCENT if (row, col) == (0, 0) else '#39432f')
    return image.resize((size, size), Image.Resampling.LANCZOS)

for size in [16, 32, 48, 128]:
    icon(size).save(ROOT / 'icons' / f'icon-{size}.png')
image = Image.new('RGB', (440, 280), BACKGROUND)
draw = ImageDraw.Draw(image)
image.paste(icon(48), (24, 24), icon(48))
draw.text((86, 30), 'Fazenda viewer', font=font(23), fill='#f1f2ed')
draw.rounded_rectangle((358, 28, 412, 55), radius=6, fill=ACCENT)
draw.text((368, 33), 'F18', font=font(17), fill='#25271e')
draw.text((28, 108), 'Seu sinal.', font=font(34), fill='#f1f2ed')
draw.text((28, 150), 'Seu jeito de assistir.', font=font(34), fill='#f1f2ed')
draw.text((28, 222), 'Atalhos + mosaico no RecordPlus', font=font(18), fill='#c1c7bb')
draw.text((28, 251), 'Ferramenta independente', font=font(12), fill='#a9b39c')
image.save(ROOT / 'store' / 'promo-440x280.png')
