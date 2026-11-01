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
            elif kind in ('ellipse', 'rect'):
                x0, y0, x1, y1 = [v * s for v in data]
                box = [min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)]
                (d.ellipse if kind == 'ellipse' else d.rectangle)(box, fill=255)
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


def save(name, sprite, smooth=False, background=None):
    os.makedirs(OUT, exist_ok=True)
    img, parts = sprite.render_smooth() if smooth else sprite.render_pixel()
    if background is not None:
        flat = Image.new('RGBA', img.size, background)
        flat.alpha_composite(img)
        img = flat
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


def humanoid_front(sp, ox, oy, k, coat, pants, sleeve, skin=SKIN, hair=HAIR, weapon=None, facing='left', robe=False, scarf=None):
    """A taller, more detailed front/three-quarter battle sprite (about 100*k px). The weapon hand is
    on the facing side; roles call that side 'front'."""
    f = -1 if facing == 'left' else 1
    X = lambda x: ox + (20 + f * x) * k  # x measured from the centre, toward the facing side
    P = lambda x, y: (X(x), oy + y * k)
    if scarf:
        sp.part('cape', scarf, [('poly', [P(-3, 22), P(-8, 20), P(-26, 24), P(-30, 30), P(-22, 29), P(-10, 27)])])
        sp.part('cape', scarf, [('poly', [P(-33, 30), P(-38, 31), P(-36, 34)])])  # a detached flutter
    if not robe:
        for side, nm in ((-1, 'back'), (1, 'front')):
            sp.part(f'leg.upper.{nm}', pants, [('poly', [P(side * 1, 52), P(side * 8, 52), P(side * 8, 70), P(side * 2, 70)])])
            sp.part(f'leg.lower.{nm}', pants, [('poly', [P(side * 2, 69), P(side * 8, 69), P(side * 8, 86), P(side * 3, 86)])])
            sp.part(f'foot.{nm}', BROWN, [('poly', [P(side * 2, 85), P(side * 9, 85), P(side * 10 + f * 2, 93), P(side * 1, 93)])])
    else:
        for side, nm in ((-1, 'back'), (1, 'front')):
            sp.part(f'foot.{nm}', GREY, [('poly', [P(side * 2, 88), P(side * 9, 88), P(side * 9, 94), P(side * 2, 94)])])
    sp.part('pelvis', coat, [('poly', [P(-10, 46), P(10, 46), P(15 if not robe else 17, 80 if not robe else 89), P(9, 82 if not robe else 90), P(0, 60 if not robe else 90), P(-9, 82 if not robe else 90), P(-15 if not robe else -17, 80 if not robe else 89)])])
    sp.part('torso', coat, [('poly', [P(-10, 24), P(10, 24), P(12, 34), P(10, 50), P(-10, 50), P(-12, 34)])])
    for side, nm in ((-1, 'back'), (1, 'front')):
        sp.part(f'arm.upper.{nm}', sleeve, [('poly', [P(side * 9, 24), P(side * 15, 25), P(side * 16, 38), P(side * 11, 38)])])
        sp.part(f'arm.lower.{nm}', sleeve, [('poly', [P(side * 11, 37), P(side * 16, 37), P(side * 17, 50), P(side * 12, 50)])])
        sp.part(f'hand.{nm}', skin, [('ellipse', (*P(side * 11.5 - 0.1, 49), *P(side * 17.5 + 0.1, 56)))] if side > 0 else [('ellipse', (*P(side * 17.5, 49), *P(side * 11.5, 56)))])
    sp.part('head', skin, [('ellipse', (*P(-7, 6), *P(7, 23)))] if f > 0 else [('ellipse', (*P(7, 6), *P(-7, 23)))])
    sp.part('eye', (40, 30, 50, 255), [('rect', (*P(2, 13), *P(4, 15)))] if f > 0 else [('rect', (*P(4, 13), *P(2, 15)))])
    sp.part('hair', hair, [('poly', [P(-9, 14), P(-8, 3), P(0, -1), P(8, 2), P(10, 12), P(6, 7), P(-2, 8), P(-5, 12)])] + ([('poly', [P(-9, 10), P(-12, 40), P(-6, 36), P(-6, 14)])] if robe else []))
    if weapon == 'blade':
        sp.part('weapon', STEEL, [('poly', [P(13, 53), P(17, 51), P(44, 82), P(41, 86), P(36, 84)]), ('rect', (*P(10, 50), *P(19, 53)))] if f > 0 else [('poly', [P(13, 53), P(17, 51), P(44, 82), P(41, 86), P(36, 84)]), ('rect', (*P(19, 50), *P(10, 53)))])
    elif weapon == 'staff':
        sp.part('weapon', WOOD, [('line', ([P(15, 92), P(18, 4)], 2 * k)), ('ellipse', (*P(14, -2), *P(22, 7)) if f > 0 else (*P(22, -2), *P(14, 7)))])


def main_extra():
    # 9. Front-view swordsman with a long coat and a heavy blade held low, on a WHITE background
    sp = Sprite(112, 112)
    humanoid_front(sp, 26, 8, 1, (150, 30, 40, 255), (40, 40, 52, 255), (150, 30, 40, 255), weapon='blade', facing='left', scarf=(30, 30, 36, 255))
    save('swordsman_white', sp, background=(255, 255, 255, 255))
    # 10. Robed mage with a staff and floating glyphs (islands)
    sp = Sprite(104, 112)
    humanoid_front(sp, 32, 10, 1, (50, 70, 160, 255), DBLUE, (230, 230, 245, 255), hair=(200, 205, 225, 255), weapon='staff', facing='right', robe=True)
    for gx, gy in ((10, 40), (8, 62), (16, 84), (86, 50), (90, 74), (84, 92)):
        sp.part('effect', (110, 170, 250, 255), [('ellipse', (gx, gy, gx + 5, gy + 6))])
    save('mage_front', sp)
    # 11. Golem: blocky body, one huge arm
    sp = Sprite(112, 104)
    STONE = (130, 124, 112, 255)
    sp.part('leg.upper.back', shade(STONE, 0.9), [('rect', (40, 62, 52, 80))])
    sp.part('leg.lower.back', shade(STONE, 0.9), [('rect', (38, 78, 54, 98))])
    sp.part('leg.upper.front', STONE, [('rect', (60, 62, 72, 80))])
    sp.part('leg.lower.front', STONE, [('rect', (58, 78, 74, 98))])
    sp.part('torso', STONE, [('poly', [(34, 24), (78, 24), (82, 44), (74, 66), (38, 66), (30, 44)])])
    sp.part('head', STONE, [('rect', (46, 8, 66, 26))])
    sp.part('hair', (90, 220, 210, 255), [('poly', [(48, 9), (51, 0), (55, 8), (58, 1), (61, 9)])])
    sp.part('arm.upper.back', STONE, [('rect', (18, 24, 34, 46))])
    sp.part('arm.lower.back', STONE, [('rect', (8, 44, 32, 72))])
    sp.part('hand.back', shade(STONE, 1.1), [('ellipse', (4, 68, 30, 92))])
    sp.part('arm.upper.front', STONE, [('rect', (78, 24, 90, 44))])
    sp.part('arm.lower.front', STONE, [('rect', (80, 42, 92, 62))])
    sp.part('hand.front', shade(STONE, 1.1), [('ellipse', (78, 60, 96, 76))])
    sp.part('effect', (90, 220, 210, 255), [('poly', [(52, 36), (56, 30), (60, 36), (56, 44)])])
    save('golem', sp)
    # 12. Ghost: hooded cloak, tendrils, no legs, floating crystals and a crescent
    sp = Sprite(104, 104)
    CL = (60, 72, 96, 255)
    sp.part('tail.1', shade(CL, 0.8), [('line', ([(40, 70), (30, 86), (36, 98)], 5)), ('line', ([(60, 72), (66, 90), (58, 100)], 5))])
    sp.part('torso', CL, [('poly', [(36, 26), (66, 26), (74, 60), (64, 80), (40, 80), (30, 60)])])
    sp.part('arm.upper.back', CL, [('poly', [(36, 30), (22, 44), (16, 54), (24, 56), (38, 40)])])
    sp.part('arm.upper.front', CL, [('poly', [(64, 30), (80, 42), (88, 52), (80, 56), (64, 40)])])
    sp.part('head', shade(CL, 0.7), [('ellipse', (40, 8, 62, 32))])
    sp.part('eye', (140, 240, 255, 255), [('rect', (46, 18, 49, 20)), ('rect', (53, 18, 56, 20))])
    sp.part('effect', (150, 230, 255, 255), [('ellipse', (40, 0, 62, 10))])
    for gx, gy in ((10, 30), (90, 24), (12, 70), (92, 66), (84, 88)):
        sp.part('effect', (150, 200, 230, 255), [('poly', [(gx, gy), (gx + 3, gy - 4), (gx + 6, gy), (gx + 3, gy + 5)])])
    save('ghost', sp)
    # 13. Dragon, side view facing right: wings (far one behind), neck, head, curled tail, four legs, smoke
    sp = Sprite(140, 104)
    G = (60, 140, 70, 255)
    sp.part('wing.far', shade(G, 0.7), [('poly', [(70, 40), (96, 6), (112, 14), (88, 44)])])
    sp.part('leg.hind.far', shade(G, 0.8), [('poly', [(46, 64), (54, 64), (52, 92), (44, 92)])])
    sp.part('leg.front.far', shade(G, 0.8), [('poly', [(88, 64), (96, 64), (96, 92), (88, 92)])])
    sp.part('tail', G, [('line', ([(40, 58), (20, 70), (14, 86), (30, 94), (44, 88)], 7))])
    sp.part('torso', G, [('ellipse', (36, 40, 104, 74))])
    sp.part('neck', G, [('poly', [(92, 46), (104, 26), (112, 30), (102, 54)])])
    sp.part('head', G, [('poly', [(102, 18), (124, 20), (130, 28), (112, 32), (100, 28)]), ('poly', [(104, 18), (100, 6), (108, 16)])])
    sp.part('leg.hind.near', G, [('poly', [(52, 62), (62, 62), (62, 96), (50, 96)])])
    sp.part('leg.front.near', G, [('poly', [(92, 62), (102, 62), (104, 96), (94, 96)])])
    sp.part('wing.near', (70, 160, 80, 255), [('poly', [(60, 44), (40, 4), (20, 10), (34, 24), (14, 30), (44, 48)])])
    for gx, gy in ((132, 14), (136, 6)):
        sp.part('effect', (120, 220, 140, 255), [('ellipse', (gx - 2, gy, gx + 2, gy + 5))])
    save('dragon', sp)


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
    main_extra()


if __name__ == '__main__':
    main()
