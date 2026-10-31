"""Gera as folhas de sprite do Charizard HD (hi-bit) no formato do jogo.

Entrada: tools/hd_src/charizard/dir0..dir7.png (344x384, RGBA; ordem S, SE, E, NE, N, NW, W, SW,
igual às linhas do jogo: 0 Down .. 7 DownLeft).
Saída:   assets/pokemon/6/{Idle,Walk,Attack,Shoot,Charge,Hurt,Faint}.png
         js/data/sprites-hd-override.js (geometria que sobrescreve G.SPRITE_META[6])

Uso: python tools/make_hd_sprites.py
O original (PMD) continua no histórico do git: git checkout -- assets/pokemon/6 js/data
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'hd_src', 'charizard')
OUT = os.path.join(ROOT, 'assets', 'pokemon', '6')
DEX = 6
K = 0.15            # fator de redução: 344x384 -> ~52x58 px de arte (o jogo desenha a 2x)
W, H = 60, 66       # fotograma comum a todas as animações
AX, AY = 29.5, 56.5 # âncora dos pés dentro do fotograma

def load_dir(i):
    im = Image.open(os.path.join(SRC, f'dir{i}.png')).convert('RGBA')
    im = im.resize((round(im.width * K), round(im.height * K)), Image.LANCZOS)
    a = im.split()[-1].point(lambda v: 255 if v >= 128 else 0)   # bordas nítidas, sem franja
    im.putalpha(a)
    bb = im.getbbox()
    return im.crop(bb)  # recorta o conteúdo; alinhamos pelos pés/centro depois

bases = [load_dir(i) for i in range(8)]

def place(sprite, dx=0, dy=0, sy=1.0, sx=1.0, alpha=1.0):
    """Coloca o sprite no fotograma: centro horizontal em AX, pés em AY."""
    s = sprite
    if sx != 1.0 or sy != 1.0:
        s = s.resize((max(1, round(s.width * sx)), max(1, round(s.height * sy))), Image.NEAREST)
    if alpha < 1.0:
        s = s.copy(); s.putalpha(s.split()[-1].point(lambda v: int(v * alpha)))
    fr = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    x = round(AX - s.width / 2 + dx)
    y = round(AY - s.height + dy)
    fr.alpha_composite(s, (max(0, x), max(0, y))) if x >= 0 and y >= 0 else fr.paste(s, (x, y), s)
    return fr

# animação -> (duração de cada fotograma em 1/60 s, parâmetros por fotograma)
ANIMS = {
    'Idle':   ([15, 15, 15, 15], [dict(), dict(dy=-1), dict(dy=-1, sy=1.02), dict()]),
    'Walk':   ([8, 10, 8, 10],   [dict(), dict(dy=-2), dict(), dict(dy=-2)]),
    'Attack': ([2, 2, 3, 3, 2, 2], [dict(), dict(sy=0.94, sx=1.04), dict(sy=1.08, dy=-2), dict(sy=1.08, dy=-2), dict(sy=1.02), dict()]),
    'Shoot':  ([4, 4, 2, 2, 2, 2], [dict(), dict(sy=0.95, sx=1.04), dict(sy=1.06, dy=-1), dict(sy=1.06, dy=-1), dict(sy=1.02), dict()]),
    'Charge': ([3, 3, 3, 3, 3, 3], [dict(), dict(sy=0.97), dict(sy=0.94, sx=1.03), dict(sy=0.94, sx=1.03), dict(sy=0.97), dict()]),
    'Hurt':   ([2, 8],           [dict(dx=-2, dy=1), dict(dx=1)]),
    'Faint':  ([8, 12, 4, 10],   [dict(), dict(sy=0.85, dy=2), dict(sy=0.65, dy=3), dict(sy=0.5, dy=3, alpha=0.8)]),
}

os.makedirs(OUT, exist_ok=True)
meta = {'s': 2, 'a': {}, 'sh': 0}
for name, (durs, frames) in ANIMS.items():
    n = len(frames)
    sheet = Image.new('RGBA', (W * n, H * 8), (0, 0, 0, 0))
    for d in range(8):
        for f, p in enumerate(frames):
            sheet.alpha_composite(place(bases[d], **p), (f * W, d * H))
    sheet.save(os.path.join(OUT, name + '.png'), optimize=True)
    meta['a'][name] = {'w': W, 'h': H, 'n': n, 'r': 8, 'd': durs, 'ax': AX, 'ay': AY}

# sem versão shiny HD: o sh=0 evita misturar a geometria nova com a folha shiny antiga
shiny_dir = os.path.join(OUT, 's')
js = ('/* GERADO por tools/make_hd_sprites.py — sobrescreve a geometria do Charizard (HD hi-bit).\n'
      ' * Carregar DEPOIS de sprites-meta.js. Para voltar ao PMD: apagar este arquivo e o <script> do dev.html\n'
      ' * e restaurar assets/pokemon/6 do git. */\n'
      f'G.SPRITE_META[{DEX}] = {json.dumps(meta, separators=(",", ":"))};\n')
open(os.path.join(ROOT, 'js', 'data', 'sprites-hd-override.js'), 'w', encoding='utf-8').write(js)
print('ok', {k: (v['n'], v['w'], v['h']) for k, v in meta['a'].items()})
