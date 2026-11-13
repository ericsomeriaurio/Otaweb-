"""Gera os ícones do app Android do OtaWeb (rodado automaticamente pelo GitHub ao montar o APK).
Uso: python make_android_icons.py PASTA_RES   (ex.: android/app/src/main/res)"""
import os, sys
from PIL import Image, ImageDraw

WINE = (122, 22, 51, 255); WHITE = (255, 255, 255, 255)

def mark(size, bg=True, scale=1.0, round_shape=False, rounded=True):
    """Desenha o símbolo (um olho de anime: anel branco com brilho) num quadrado size x size."""
    S = size * 4                                   # desenha em tamanho 4x e reduz, para ficar liso
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    if bg:
        if round_shape: d.ellipse((0, 0, S - 1, S - 1), fill=WINE)
        elif rounded: d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * .22), fill=WINE)
        else: d.rectangle((0, 0, S, S), fill=WINE)
    c = S / 2; R = S * .30 * scale; w = S * .085 * scale
    d.ellipse((c - R, c - R, c + R, c + R), outline=WHITE, width=int(w))
    r = S * .075 * scale; ox, oy = c - R * .35, c - R * .35
    d.ellipse((ox - r, oy - r, ox + r, oy + r), fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)

def save(img, path):
    d = os.path.dirname(path)
    if d: os.makedirs(d, exist_ok=True)
    img.save(path, optimize=True)

DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
if __name__ == '__main__':
    res = sys.argv[1] if len(sys.argv) > 1 else 'res'
    for name, k in DENS.items():
        base = os.path.join(res, 'mipmap-' + name)
        save(mark(round(48 * k)), os.path.join(base, 'ic_launcher.png'))
        save(mark(round(48 * k), round_shape=True), os.path.join(base, 'ic_launcher_round.png'))
        save(mark(round(108 * k), bg=False, scale=.66), os.path.join(base, 'ic_launcher_foreground.png'))   # ícone adaptivo (fundo vem da cor)
    print('ícones gerados em', res)
