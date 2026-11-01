#!/usr/bin/env python3
"""
Generate the test sprites in test/sprites/ (original procedural art, no third-party assets).

Each character is drawn as body parts in draw order (back to front). Every part gets pixel-art
shading (light top-left band, dark bottom-right band), a dark outer outline and darker inner
"selective" outlines where it overlaps a part behind it.

Outputs per sprite:
  <name>.png         the sprite (RGBA, transparent background)
  <name>.parts.png   ground-truth part map (grey value = part index + 1, 0 = background)
  <name>.parts.json  part names in index order
Usage: python3 tools/gen_test_sprites.py [out_dir]
"""
import json
import os
import sys

from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'test', 'sprites')
OUTLINE = (24, 18, 30, 255)


def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)


class Sprite:
    def __init__(self, w, h, scale=1):
        self.w, self.h, self.s = w, h, scale
        self.parts = []  # (name, mask Image 'L', colour)

    def part(self, name, colour, shapes):
        """shapes: list of ('poly', [(x,y)...]) | ('ellipse', (x0,y0,x1,y1)) | ('rect', (x0,y0,x1,y1))"""
        s = self.s
        m = Image.new('L', (self.w * s, self.h * s), 0)
        d = ImageDraw.Draw(m)
        for kind, data in shapes:
            if kind == 'poly':
                d.polygon([(x * s, y * s) for x, y in data], fill=255)
            elif kind == 'ellipse':
                d.ellipse([v * s for v in data], fill=255)
            elif kind == 'rect':
                d.rectangle([v * s for v in data], fill=255)
            elif kind == 'line':
                pts, width = data
                d.line([(x * s, y * s) for x, y in pts], fill=255, width=max(1, int(width * s)))
        self.parts.append((name, m, colour))

    def render_pixel(self):
        w, h = self.w, self.h
        owner = [[-1] * w for _ in range(h)]
        masks = []
        for idx, (_, m, _) in enumerate(self.parts):
            px = m.load()
            mk = [[px[x, y] > 127 for x in range(w)] for y in range(h)]
            masks.append(mk)
            for y in range(h):
                for x in range(w):
                    if mk[y][x]:
                        owner[y][x] = idx
        img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        out = img.load()

        def own(x, y):
            return owner[y][x] if 0 <= x < w and 0 <= y < h else -1

        for y in range(h):
            for x in range(w):
                o = owner[y][x]
                if o < 0:
                    continue
                c = self.parts[o][2]
                mk = masks[o]

                def inside(xx, yy):
                    return 0 <= xx < w and 0 <= yy < h and mk[yy][xx]

                col = c
                if not inside(x + 2, y + 1) or not inside(x + 1, y + 2):
                    col = shade(c, 0.72)
                elif not inside(x - 1, y - 1):
                    col = shade(c, 1.22)
                nb = [own(x + 1, y), own(x - 1, y), own(x, y + 1), own(x, y - 1)]
                if any(n < 0 for n in nb):
                    col = OUTLINE
                elif any(n >= 0 and n < o for n in nb):
                    col = shade(c, 0.5)
                out[x, y] = col
        parts = Image.new('L', (w, h), 0)
        pp = parts.load()
        for y in range(h):
            for x in range(w):
                pp[x, y] = owner[y][x] + 1
        return img, parts

    def render_smooth(self):
        """Anti-aliased illustration: draw at self.s× and downsample with a box filter."""
        s = self.s
        big = Image.new('RGBA', (self.w * s, self.h * s), (0, 0, 0, 0))
        owner = Image.new('L', (self.w * s, self.h * s), 0)
        for idx, (_, m, c) in enumerate(self.parts):
            # soft vertical gradient for an illustrated look
            layer = Image.new('RGBA', big.size, c)
            grad = Image.linear_gradient('L').resize(big.size)
            dark = Image.new('RGBA', big.size, shade(c, 0.7))
            layer = Image.composite(dark, layer, grad)
            edge = m.filter(__import__('PIL.ImageFilter', fromlist=['MaxFilter']).MaxFilter(5))
            outline = Image.new('RGBA', big.size, OUTLINE)
            big = Image.composite(outline, big, edge)
            big = Image.composite(layer, big, m)
            owner.paste(idx + 1, mask=edge)
        small = big.resize((self.w, self.h), Image.BOX)
        parts = owner.resize((self.w, self.h), Image.NEAREST)
        return small, parts


def save(name, sprite, smooth=False):
    os.makedirs(OUT, exist_ok=True)
    img, parts = sprite.render_smooth() if smooth else sprite.render_pixel()
    img.save(os.path.join(OUT, f'{name}.png'))
    parts.save(os.path.join(OUT, f'{name}.parts.png'))
    with open(os.path.join(OUT, f'{name}.parts.json'), 'w') as f:
        json.dump([n for n, _, _ in sprite.parts], f, indent=1)
    print(f'{name}: {img.size[0]}x{img.size[1]}')


# Palette
SKIN = (240, 196, 160, 255)
HAIR = (120, 70, 40, 255)
RED = (196, 52, 52, 255)
BROWN = (110, 74, 48, 255)
STEEL = (196, 206, 222, 255)
GOLD = (232, 188, 72, 255)
BLUE = (60, 92, 190, 255)
DBLUE = (40, 52, 120, 255)
PURPLE = (120, 70, 170, 255)
GREY = (120, 128, 140, 255)
WOOD = (150, 100, 60, 255)
GREEN = (80, 180, 90, 255)


def humanoid(sp, ox, oy, k, c_body, c_legs, c_arm, hair=HAIR, weapon=None, skirt=False, hat=None, helmet=False, shield=False):
    """A chibi battle sprite facing right. (ox, oy) top-left, k = scale (1 ≈ 52px tall)."""
    P = lambda x, y: (ox + x * k, oy + y * k)
    # back arm
    sp.part('arm.upper.back', c_arm, [('poly', [P(17, 22), P(22, 21), P(19, 31), P(15, 30)])])
    sp.part('arm.lower.back', c_arm, [('poly', [P(15, 29), P(19, 30), P(18, 37), P(14, 36)])])
    sp.part('hand.back', SKIN, [('ellipse', (*P(13, 35), *P(18, 40)))])
    if shield:
        sp.part('offhand', GREY, [('ellipse', (*P(6, 26), *P(20, 44)))])
    # legs
    if not skirt:
        sp.part('leg.upper.back', c_legs, [('poly', [P(20, 34), P(25, 34), P(23, 43), P(18, 43)])])
        sp.part('leg.lower.back', c_legs, [('poly', [P(18, 42), P(23, 42), P(22, 50), P(18, 50)])])
    sp.part('foot.back', BROWN, [('poly', [P(17, 49), P(23, 49), P(25, 53), P(17, 53)])])
    if not skirt:
        sp.part('leg.upper.front', c_legs, [('poly', [P(26, 34), P(31, 34), P(32, 43), P(27, 43)])])
        sp.part('leg.lower.front', c_legs, [('poly', [P(27, 42), P(32, 42), P(32, 50), P(28, 50)])])
    sp.part('foot.front', BROWN, [('poly', [P(27, 49), P(33, 49), P(36, 53), P(27, 53)])])
    # body
    if skirt:
        sp.part('pelvis', c_body, [('poly', [P(18, 33), P(32, 33), P(36, 50), P(15, 50)])])
    else:
        sp.part('pelvis', c_legs, [('rect', (*P(19, 31), *P(32, 36)))])
    sp.part('torso', c_body, [('poly', [P(18, 20), P(31, 20), P(33, 34), P(17, 34)])])
    # head
    if helmet:
        sp.part('head', GREY, [('ellipse', (*P(13, 1), *P(35, 22))), ('rect', (*P(14, 10), *P(34, 22)))])
    else:
        sp.part('head', SKIN, [('ellipse', (*P(14, 4), *P(34, 22)))])
        sp.part('eye', (40, 30, 50, 255), [('rect', (*P(28, 12), *P(29.6, 15.6)))])
        sp.part('hair', hair, [('poly', [P(13, 10), P(16, 2), P(26, 0), P(35, 6), P(35, 10), P(28, 7), P(20, 8), P(17, 14)])])
    if hat:
        sp.part('hat', hat, [('poly', [P(10, 9), P(38, 9), P(30, 5), P(24, -12), P(19, 5)])])
    # front arm and weapon
    sp.part('arm.upper.front', c_arm, [('poly', [P(28, 21), P(33, 22), P(35, 31), P(31, 32)])])
    sp.part('arm.lower.front', c_arm, [('poly', [P(31, 30), P(35, 29), P(39, 35), P(36, 37)])])
    if weapon == 'sword':
        sp.part('weapon', STEEL, [('poly', [P(37, 34), P(41, 35), P(54, 10), P(51, 7)]), ('rect', (*P(34, 32), *P(42, 36)))])
    elif weapon == 'staff':
        sp.part('weapon', WOOD, [('line', ([P(36, 52), P(45, 6)], 2 * k)), ('ellipse', (*P(42, 2), *P(49, 9)))])
    elif weapon == 'greatsword':
        sp.part('weapon', STEEL, [('poly', [P(36, 34), P(41, 36), P(66, -2), P(60, -6)]), ('rect', (*P(33, 33), *P(42, 37)))])
    sp.part('hand.front', SKIN, [('ellipse', (*P(35, 32), *P(40, 37)))])


def main():
    # 1. Conventional JRPG warrior with a sword
    sp = Sprite(64, 64)
    humanoid(sp, 4, 8, 1, RED, BROWN, RED, weapon='sword')
    save('warrior', sp)
    # 2. Mage: robe over the legs, pointed hat, staff
    sp = Sprite(64, 72)
    humanoid(sp, 6, 18, 1, PURPLE, DBLUE, PURPLE, weapon='staff', skirt=True, hat=BLUE)
    save('mage', sp)
    # 3. Large weapon: a greatsword longer than the character
    sp = Sprite(96, 80)
    humanoid(sp, 8, 22, 1, GREEN, BROWN, GREEN, weapon='greatsword')
    save('greatsword', sp)
    # 4. Heavily armoured knight with helmet and shield
    sp = Sprite(64, 64)
    humanoid(sp, 4, 8, 1, STEEL, GREY, STEEL, weapon='sword', helmet=True, shield=True)
    save('knight', sp)
    # 5. Small pixel-art character (about 26px tall)
    sp = Sprite(32, 32)
    humanoid(sp, 1, 3, 0.5, BLUE, BROWN, BLUE, weapon='sword')
    save('tiny', sp)
    # 6. Quadruped: a wolf facing right
    sp = Sprite(80, 48)
    W = (150, 150, 165, 255)
    sp.part('leg.hind.far', shade(W, 0.8), [('poly', [(18, 28), (24, 28), (22, 44), (17, 44)])])
    sp.part('leg.front.far', shade(W, 0.8), [('poly', [(50, 28), (56, 28), (55, 44), (50, 44)])])
    sp.part('tail', W, [('poly', [(14, 20), (4, 12), (2, 16), (12, 26)])])
    sp.part('body', W, [('ellipse', (10, 16, 62, 34))])
    sp.part('leg.hind.near', W, [('poly', [(22, 28), (29, 28), (27, 45), (21, 45)])])
    sp.part('leg.front.near', W, [('poly', [(54, 28), (60, 28), (60, 45), (54, 45)])])
    sp.part('head', W, [('poly', [(54, 10), (66, 6), (78, 18), (76, 22), (62, 26), (54, 22)]), ('poly', [(58, 9), (60, 0), (64, 8)])])
    save('wolf', sp)
    # 7. Unusual creature: a slime with an eye stalk and two tendrils
    sp = Sprite(64, 64)
    S = (90, 200, 170, 255)
    sp.part('tendril.back', shade(S, 0.8), [('line', ([(16, 50), (6, 36), (10, 26)], 4))])
    sp.part('body', S, [('ellipse', (10, 30, 54, 62))])
    sp.part('stalk', S, [('line', ([(32, 34), (34, 20), (38, 12)], 4))])
    sp.part('eye', (250, 250, 240, 255), [('ellipse', (32, 4, 46, 18))])
    sp.part('pupil', (30, 20, 40, 255), [('ellipse', (38, 8, 43, 14))])
    sp.part('tendril.front', S, [('line', ([(46, 52), (58, 40), (56, 30)], 4))])
    save('slime', sp)
    # 8. Illustrated (anti-aliased) hero for smooth mode, 4× supersampled
    sp = Sprite(160, 200, scale=4)
    humanoid(sp, 10, 30, 2.9, RED, BROWN, RED, weapon='sword')
    save('illustrated', sp, smooth=True)


if __name__ == '__main__':
    main()
