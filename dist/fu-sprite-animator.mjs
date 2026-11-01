// Fabula Ultima Sprite Animator — built from src/ (TypeScript). Do not edit; run `npm run build`.

// src/foundry/constants.ts
var MODULE_ID = "fu-sprite-animator";
var SOCKET = `module.${MODULE_ID}`;
var STUDIO_TITLE = "Fabula Ultima \u2014 Sprite Animation Studio";
function setting(key) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return void 0;
  }
}
function log(...args) {
  console.log(`${MODULE_ID} |`, ...args);
}

// src/presets/humanoid.ts
var k = (t, v, e) => e ? { t, v, e } : { t, v };
var k2 = (t, x, y, e) => e ? { t, x, y, e } : { t, x, y };
var SNAP = [0.55, 0, 0.9, 0.35];
var SETTLE = "inOutQuad";
var BREATH = "inOutSine";
var base = (c) => ({ format: "fusa-clip", version: 1, templates: ["humanoid"], ...c });
var IDLE_BREATHING = base({
  id: "idle-breathing",
  name: "Idle breathing",
  category: "idle",
  description: "Calm breathing: the chest rises, the head follows a beat later, arms sway a little.",
  duration: 2.4,
  loop: true,
  tracks: {
    pelvis: { translate: [k2(0, 0, 0, BREATH), k2(1.2, 0, -8e-3, BREATH), k2(2.4, 0, 0)] },
    torso: { rotate: [k(0, 0, BREATH), k(1.2, -1.5, BREATH), k(2.4, 0)], scale: [k2(0, 1, 1, BREATH), k2(1.2, 1.01, 1.025, BREATH), k2(2.4, 1, 1)] },
    head: { rotate: [k(0, 0.5, BREATH), k(1.4, -1, BREATH), k(2.4, 0.5)] },
    "arm.upper.front": { rotate: [k(0, 0, BREATH), k(1.2, -2, BREATH), k(2.4, 0)] },
    "arm.upper.back": { rotate: [k(0, 0, BREATH), k(1.2, 2, BREATH), k(2.4, 0)] }
  },
  defaults: { mixIn: 0.3 }
});
var COMBAT_STANCE = base({
  id: "combat-stance",
  name: "Combat stance",
  category: "idle",
  description: "Ready to fight: knees bent, weight bouncing, weapon arm raised and leaning in.",
  duration: 1.2,
  loop: true,
  tracks: {
    pelvis: { translate: [k2(0, 0, 0.015, BREATH), k2(0.6, 0, 0.03, BREATH), k2(1.2, 0, 0.015)] },
    torso: { rotate: [k(0, 6, BREATH), k(0.6, 8, BREATH), k(1.2, 6)] },
    head: { rotate: [k(0, -4, BREATH), k(0.7, -5, BREATH), k(1.2, -4)] },
    "arm.upper.front": { rotate: [k(0, -18, BREATH), k(0.6, -14, BREATH), k(1.2, -18)] },
    "arm.lower.front": { rotate: [k(0, -28, BREATH), k(0.65, -24, BREATH), k(1.2, -28)] },
    "arm.upper.back": { rotate: [k(0, -12, BREATH), k(0.6, -9, BREATH), k(1.2, -12)] },
    "arm.lower.back": { rotate: [k(0, -20, BREATH), k(1.2, -20)] },
    "leg.upper.front": { rotate: [k(0, -8, BREATH), k(0.6, -11, BREATH), k(1.2, -8)] },
    "leg.lower.front": { rotate: [k(0, 8, BREATH), k(0.6, 13, BREATH), k(1.2, 8)] },
    "leg.upper.back": { rotate: [k(0, 8, BREATH), k(0.6, 10, BREATH), k(1.2, 8)] },
    "leg.lower.back": { rotate: [k(0, 5, BREATH), k(0.6, 9, BREATH), k(1.2, 5)] },
    "foot.front": { rotate: [k(0, 0, BREATH), k(0.6, -2, BREATH), k(1.2, 0)] }
  },
  defaults: { mixIn: 0.25 }
});
var SWORD_SLASH = base({
  id: "sword-slash",
  name: "Sword slash",
  category: "attack",
  description: "Raise the blade behind the head, step in and cut down across the front, follow through and recover.",
  duration: 0.9,
  loop: false,
  phases: { anticipation: [0, 0.32], action: [0.32, 0.44], impact: 0.44, recovery: [0.5, 0.9] },
  events: [
    { t: 0, name: "windup" },
    { t: 0.32, name: "release" },
    { t: 0.42, name: "contact" },
    { t: 0.6, name: "recover" },
    { t: 0.9, name: "end" }
  ],
  requires: ["arm.upper.front", "arm.lower.front", "weapon", "torso"],
  tracks: {
    root: { translate: [k2(0, 0, 0, "outCubic"), k2(0.3, -0.035, 0), k2(0.32, -0.035, 0, SNAP), k2(0.44, 0.07, 0, "outQuad"), k2(0.6, 0.075, 0, SETTLE), k2(0.9, 0, 0)] },
    pelvis: { translate: [k2(0, 0, 0, "outCubic"), k2(0.3, 0, 0.025), k2(0.44, 0, 0.035, "outQuad"), k2(0.6, 0, 0.03, SETTLE), k2(0.9, 0, 0)] },
    torso: {
      rotate: [k(0, 0, "outCubic"), k(0.3, -11), k(0.32, -11, SNAP), k(0.44, 17, "outBack"), k(0.6, 13, SETTLE), k(0.9, 0)],
      scale: [k2(0, 1, 1, "outCubic"), k2(0.3, 1.02, 0.97), k2(0.32, 1.02, 0.97, SNAP), k2(0.44, 0.98, 1.03, "outQuad"), k2(0.7, 1, 1)]
    },
    head: { rotate: [k(0, 0, "outCubic"), k(0.34, -7), k(0.48, 8, "outQuad"), k(0.66, 5, SETTLE), k(0.9, 0)] },
    "arm.upper.front": {
      space: "world",
      rotate: [k(0, 100, "outCubic"), k(0.28, 168), k(0.32, 174, SNAP), k(0.44, 40, "outBack"), k(0.52, 46, SETTLE), k(0.9, 82)]
    },
    "arm.lower.front": {
      space: "world",
      rotate: [k(0, 70, "outCubic"), k(0.3, -112), k(0.33, -116, SNAP), k(0.45, 38, "outBack"), k(0.53, 44, SETTLE), k(0.9, 50)]
    },
    "hand.front": { rotate: [k(0, 0, "outCubic"), k(0.3, 10), k(0.34, 10, SNAP), k(0.45, -8, "outQuad"), k(0.9, 0, SETTLE)] },
    weapon: {
      space: "world",
      rotate: [k(0, -60, "outCubic"), k(0.3, -196), k(0.33, -200, SNAP), k(0.45, 42, "outBack"), k(0.54, 50, SETTLE), k(0.9, -50)]
    },
    "arm.upper.back": { rotate: [k(0, 0, "outCubic"), k(0.3, -22), k(0.34, -22, SNAP), k(0.46, 34, "outQuad"), k(0.64, 24, SETTLE), k(0.9, 0)] },
    "arm.lower.back": { rotate: [k(0, 0, "outCubic"), k(0.3, -25), k(0.46, 10, "outQuad"), k(0.9, 0, SETTLE)] },
    "leg.upper.front": { rotate: [k(0, 0, "outCubic"), k(0.3, 6), k(0.32, 6, SNAP), k(0.44, -20, "outQuad"), k(0.62, -16, SETTLE), k(0.9, 0)] },
    "leg.lower.front": { rotate: [k(0, 0, "outCubic"), k(0.3, 4), k(0.44, 18, "outQuad"), k(0.62, 14, SETTLE), k(0.9, 0)] },
    "foot.front": { rotate: [k(0, 0), k(0.44, 4, "outQuad"), k(0.9, 0, SETTLE)] },
    "leg.upper.back": { rotate: [k(0, 0, "outCubic"), k(0.3, -6), k(0.32, -6, SNAP), k(0.44, 14, "outQuad"), k(0.62, 11, SETTLE), k(0.9, 0)] },
    "leg.lower.back": { rotate: [k(0, 0, "outCubic"), k(0.3, 8), k(0.44, 4, "outQuad"), k(0.9, 0, SETTLE)] }
  },
  defaults: { mixIn: 0.08, mixOut: 0.25 }
});
var HEAVY_SLASH = base({
  id: "heavy-slash",
  name: "Heavy slash",
  category: "attack",
  description: "A slow, heavy overhead chop: long wind-up, a short hold, a crushing blow and a weighty recovery.",
  duration: 1.35,
  loop: false,
  phases: { anticipation: [0, 0.55], action: [0.62, 0.74], impact: 0.74, recovery: [0.84, 1.35] },
  events: [
    { t: 0, name: "windup" },
    { t: 0.62, name: "release" },
    { t: 0.72, name: "contact" },
    { t: 0.95, name: "recover" },
    { t: 1.35, name: "end" }
  ],
  requires: ["arm.upper.front", "arm.lower.front", "torso"],
  tracks: {
    root: { translate: [k2(0, 0, 0, "outCubic"), k2(0.55, -0.05, 0), k2(0.62, -0.05, 0, SNAP), k2(0.74, 0.09, 0, "outQuad"), k2(0.95, 0.09, 0, SETTLE), k2(1.35, 0, 0)] },
    pelvis: { translate: [k2(0, 0, 0, "outCubic"), k2(0.55, 0, 0.01), k2(0.62, 0, 0.01, SNAP), k2(0.74, 0, 0.06, "outQuad"), k2(0.95, 0, 0.05, SETTLE), k2(1.35, 0, 0)] },
    torso: {
      rotate: [k(0, 0, "outCubic"), k(0.55, -15), k(0.62, -16, SNAP), k(0.74, 24, "outBack"), k(0.95, 20, SETTLE), k(1.35, 0)],
      scale: [k2(0, 1, 1, "outCubic"), k2(0.55, 0.98, 1.04), k2(0.62, 0.98, 1.04, SNAP), k2(0.74, 1.03, 0.95, "outQuad"), k2(1, 1, 1)]
    },
    head: { rotate: [k(0, 0, "outCubic"), k(0.58, -10), k(0.78, 10, "outQuad"), k(1, 7, SETTLE), k(1.35, 0)] },
    "arm.upper.front": {
      space: "world",
      rotate: [k(0, 100, "outCubic"), k(0.5, -78), k(0.62, -84, SNAP), k(0.74, 62, "outBack"), k(0.86, 66, SETTLE), k(1.35, 85)]
    },
    "arm.lower.front": {
      space: "world",
      rotate: [k(0, 70, "outCubic"), k(0.5, -150), k(0.62, -156, SNAP), k(0.75, 62, "outBack"), k(0.86, 64, SETTLE), k(1.35, 55)]
    },
    "hand.front": { rotate: [k(0, 0, "outCubic"), k(0.55, 8), k(0.62, 8, SNAP), k(0.75, -6, "outQuad"), k(1.35, 0, SETTLE)] },
    weapon: {
      space: "world",
      rotate: [k(0, -60, "outCubic"), k(0.5, -175), k(0.62, -182, SNAP), k(0.75, 70, "outBack"), k(0.88, 74, SETTLE), k(1.35, -45)]
    },
    "arm.upper.back": {
      space: "world",
      rotate: [k(0, 100, "outCubic"), k(0.5, -95), k(0.62, -100, SNAP), k(0.75, 58, "outBack"), k(0.9, 62, SETTLE), k(1.35, 90)]
    },
    "arm.lower.back": { rotate: [k(0, 0, "outCubic"), k(0.55, -30), k(0.75, -10, "outQuad"), k(1.35, 0, SETTLE)] },
    "leg.upper.front": { rotate: [k(0, 0, "outCubic"), k(0.55, 8), k(0.62, 8, SNAP), k(0.74, -24, "outQuad"), k(0.95, -20, SETTLE), k(1.35, 0)] },
    "leg.lower.front": { rotate: [k(0, 0, "outCubic"), k(0.55, 4), k(0.74, 26, "outQuad"), k(0.95, 22, SETTLE), k(1.35, 0)] },
    "leg.upper.back": { rotate: [k(0, 0, "outCubic"), k(0.55, -8), k(0.62, -8, SNAP), k(0.74, 18, "outQuad"), k(0.95, 15, SETTLE), k(1.35, 0)] },
    "leg.lower.back": { rotate: [k(0, 0, "outCubic"), k(0.55, 10), k(0.74, 12, "outQuad"), k(1.35, 0, SETTLE)] }
  },
  defaults: { mixIn: 0.1, mixOut: 0.3 }
});
var MAGIC_CAST = base({
  id: "magic-cast",
  name: "Magic cast",
  category: "magic",
  description: "Draw power in close to the body, then thrust the casting hand forward and up, hold while the spell flies, and settle.",
  duration: 1.4,
  loop: false,
  phases: { anticipation: [0, 0.5], action: [0.5, 0.62], impact: 0.62, recovery: [1, 1.4] },
  events: [
    { t: 0, name: "windup" },
    { t: 0.6, name: "release" },
    { t: 1, name: "recover" },
    { t: 1.4, name: "end" }
  ],
  requires: ["arm.upper.front", "arm.lower.front", "torso"],
  tracks: {
    pelvis: { translate: [k2(0, 0, 0, "outCubic"), k2(0.5, 0, 0.025), k2(0.62, 0, -0.01, "outBack"), k2(1, 0, -5e-3, SETTLE), k2(1.4, 0, 0)] },
    torso: {
      rotate: [k(0, 0, "outCubic"), k(0.5, -7), k(0.62, 9, "outBack"), k(0.8, 8), k(1, 7, SETTLE), k(1.4, 0)],
      scale: [k2(0, 1, 1, "outCubic"), k2(0.5, 1.02, 0.97), k2(0.62, 0.99, 1.03, "outQuad"), k2(1, 1, 1.02, SETTLE), k2(1.4, 1, 1)]
    },
    head: { rotate: [k(0, 0, "outCubic"), k(0.5, 5), k(0.65, -6, "outQuad"), k(1, -5, SETTLE), k(1.4, 0)] },
    "arm.upper.front": { space: "world", rotate: [k(0, 95, "outCubic"), k(0.5, 135), k(0.62, -25, "outBack"), k(0.8, -22), k(0.9, -26), k(1, -24, SETTLE), k(1.4, 80)] },
    "arm.lower.front": { space: "world", rotate: [k(0, 70, "outCubic"), k(0.5, -95), k(0.62, -20, "outBack"), k(0.8, -16), k(0.9, -21), k(1, -18, SETTLE), k(1.4, 50)] },
    "hand.front": { rotate: [k(0, 0, "outCubic"), k(0.5, 20), k(0.62, -20, "outQuad"), k(1, -18, SETTLE), k(1.4, 0)] },
    "arm.upper.back": { rotate: [k(0, 0, "outCubic"), k(0.5, -28), k(0.62, -45, "outBack"), k(1, -40, SETTLE), k(1.4, 0)] },
    "arm.lower.back": { rotate: [k(0, 0, "outCubic"), k(0.5, -40), k(0.62, -30, "outQuad"), k(1.4, 0, SETTLE)] },
    "leg.upper.front": { rotate: [k(0, 0, "outCubic"), k(0.5, -4), k(0.62, -10, "outQuad"), k(1, -8, SETTLE), k(1.4, 0)] },
    "leg.lower.front": { rotate: [k(0, 0, "outCubic"), k(0.5, 8), k(0.62, 6, "outQuad"), k(1.4, 0, SETTLE)] },
    "leg.upper.back": { rotate: [k(0, 0, "outCubic"), k(0.5, 4), k(0.62, 9, "outQuad"), k(1, 7, SETTLE), k(1.4, 0)] }
  },
  defaults: { mixIn: 0.12, mixOut: 0.3 }
});
var LIGHT_HIT = base({
  id: "light-hit",
  name: "Light hit",
  category: "reaction",
  description: "A flinch: the body snaps back from the blow, the head whips a moment later, then everything settles.",
  duration: 0.5,
  loop: false,
  phases: { impact: 0, action: [0, 0.08], recovery: [0.08, 0.5] },
  events: [
    { t: 0, name: "contact" },
    { t: 0.5, name: "end" }
  ],
  requires: ["torso"],
  tracks: {
    root: { translate: [k2(0, 0, 0, "outQuad"), k2(0.07, -0.035, 0), k2(0.18, -0.03, 0, SETTLE), k2(0.5, 0, 0)] },
    torso: { rotate: [k(0, 0, "outQuad"), k(0.07, -12), k(0.2, -8, "outBack"), k(0.5, 0)] },
    head: { rotate: [k(0, 0), k(0.05, 0, "outQuad"), k(0.12, -12), k(0.26, -6, SETTLE), k(0.5, 0)] },
    "arm.upper.front": { rotate: [k(0, 0, "outQuad"), k(0.08, 12), k(0.5, 0, SETTLE)] },
    "arm.upper.back": { rotate: [k(0, 0, "outQuad"), k(0.08, 14), k(0.5, 0, SETTLE)] },
    "leg.upper.front": { rotate: [k(0, 0, "outQuad"), k(0.08, 5), k(0.5, 0, SETTLE)] }
  },
  defaults: { mixIn: 0.03, mixOut: 0.2 }
});
var HEAVY_HIT = base({
  id: "heavy-hit",
  name: "Heavy hit",
  category: "reaction",
  description: "Knocked off balance: thrown back, knees buckle, arms fly out, a wobble, then a heavy recovery.",
  duration: 0.9,
  loop: false,
  phases: { impact: 0, action: [0, 0.1], recovery: [0.1, 0.9] },
  events: [
    { t: 0, name: "contact" },
    { t: 0.9, name: "end" }
  ],
  requires: ["torso"],
  tracks: {
    root: { translate: [k2(0, 0, 0, "outQuad"), k2(0.1, -0.08, 0), k2(0.3, -0.07, 0, SETTLE), k2(0.9, 0, 0)] },
    pelvis: { translate: [k2(0, 0, 0, "outQuad"), k2(0.12, 0, 0.04), k2(0.4, 0, 0.03, SETTLE), k2(0.9, 0, 0)] },
    torso: { rotate: [k(0, 0, "outQuad"), k(0.1, -22), k(0.25, -14, BREATH), k(0.4, -19, BREATH), k(0.9, 0, SETTLE)] },
    head: { rotate: [k(0, 0), k(0.06, 0, "outQuad"), k(0.16, -18), k(0.32, -8, BREATH), k(0.48, -12, BREATH), k(0.9, 0, SETTLE)] },
    "arm.upper.front": { rotate: [k(0, 0, "outQuad"), k(0.1, -35), k(0.4, -20, SETTLE), k(0.9, 0)] },
    "arm.lower.front": { rotate: [k(0, 0, "outQuad"), k(0.12, -25), k(0.9, 0, SETTLE)] },
    "arm.upper.back": { rotate: [k(0, 0, "outQuad"), k(0.1, 30), k(0.4, 18, SETTLE), k(0.9, 0)] },
    "leg.upper.front": { rotate: [k(0, 0, "outQuad"), k(0.12, -10), k(0.4, -8, SETTLE), k(0.9, 0)] },
    "leg.lower.front": { rotate: [k(0, 0, "outQuad"), k(0.12, 18), k(0.4, 14, SETTLE), k(0.9, 0)] },
    "leg.upper.back": { rotate: [k(0, 0, "outQuad"), k(0.12, 10), k(0.9, 0, SETTLE)] },
    "leg.lower.back": { rotate: [k(0, 0, "outQuad"), k(0.12, 12), k(0.9, 0, SETTLE)] }
  },
  defaults: { mixIn: 0.03, mixOut: 0.25 }
});
var HUMANOID_CLIPS = [IDLE_BREATHING, COMBAT_STANCE, SWORD_SLASH, HEAVY_SLASH, MAGIC_CAST, LIGHT_HIT, HEAVY_HIT];

// src/presets/index.ts
var builtIn = new Map(HUMANOID_CLIPS.map((c) => [c.id, c]));
var registered = /* @__PURE__ */ new Map();
var CATEGORY_LABELS = {
  idle: "Idle",
  movement: "Movement",
  attack: "Physical attacks",
  magic: "Magic",
  defence: "Defence",
  reaction: "Reactions",
  other: "Other"
};
function getClip(id) {
  return registered.get(id) ?? builtIn.get(id);
}
function listClips() {
  const all = new Map(builtIn);
  for (const [id, c] of registered) all.set(id, c);
  return [...all.values()];
}
function registerClip(clip) {
  if (!clip || clip.format !== "fusa-clip") throw new Error('Not a clip (format must be "fusa-clip").');
  if (!clip.id || typeof clip.id !== "string") throw new Error("A clip needs an id.");
  if (!(clip.duration > 0)) throw new Error(`Clip "${clip.id}" needs a positive duration.`);
  for (const [role, track] of Object.entries(clip.tracks ?? {})) {
    for (const keys of [track.rotate, track.translate, track.scale]) {
      if (!keys) continue;
      for (let i = 1; i < keys.length; i++) {
        if (!(keys[i].t >= keys[i - 1].t)) throw new Error(`Clip "${clip.id}", role "${role}": keys must be in time order.`);
      }
    }
  }
  registered.set(clip.id, clip);
}

// src/sprite/image.ts
function opaqueBounds(img, alphaMin = 1) {
  const { width: w, height: h2, data } = img;
  let x0 = w;
  let y0 = h2;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h2; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] >= alphaMin) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
function countOpaque(img, alphaMin = 1) {
  let n = 0;
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] >= alphaMin) n++;
  return n;
}
function looksLikePixelArt(img) {
  const { data } = img;
  const colours = /* @__PURE__ */ new Set();
  let opaque = 0;
  let partial = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    opaque++;
    if (a < 250) partial++;
    if (colours.size <= 512) colours.add(data[i] << 16 | data[i + 1] << 8 | data[i + 2]);
  }
  if (!opaque) return false;
  return colours.size <= 256 && partial / opaque < 0.02 && Math.max(img.width, img.height) <= 512;
}
function bodyBounds(img, alphaMin = 1) {
  const all = opaqueBounds(img, alphaMin);
  if (!all) return null;
  const { width: w, data } = img;
  const runs = [];
  let maxRun = 0;
  for (let y = all.y; y < all.y + all.height; y++) {
    let best = null;
    let start = -1;
    for (let x = all.x; x <= all.x + all.width; x++) {
      const on = x < all.x + all.width && data[(y * w + x) * 4 + 3] >= alphaMin;
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        if (!best || x - 1 - start > best.x1 - best.x0) best = { x0: start, x1: x - 1 };
        start = -1;
      }
    }
    if (best) {
      runs.push({ y, ...best });
      maxRun = Math.max(maxRun, best.x1 - best.x0 + 1);
    }
  }
  const body = runs.filter((r) => r.x1 - r.x0 + 1 >= maxRun * 0.25);
  if (body.length < 3) return all;
  const pct = (vals, p) => {
    const s = vals.slice().sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))];
  };
  const x0 = pct(body.map((r) => r.x0), 0.1);
  const x1 = pct(body.map((r) => r.x1), 0.9);
  const top = body[0].y;
  const bottom = all.y + all.height - 1;
  return { x: x0, y: top, width: Math.max(1, x1 - x0 + 1), height: Math.max(1, bottom - top + 1) };
}

// src/core/math.ts
var DEG = Math.PI / 180;
var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
var smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
function wrapDeg(a) {
  let r = a % 360;
  if (r <= -180) r += 360;
  else if (r > 180) r -= 360;
  return r;
}
var Affine = class _Affine {
  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
  }
  static identity() {
    return new _Affine();
  }
  /** Translate · Rotate(deg) · Scale */
  static fromTRS(x, y, rotDeg, sx, sy) {
    return new _Affine().setTRS(x, y, rotDeg, sx, sy);
  }
  setTRS(x, y, rotDeg, sx, sy) {
    const r = rotDeg * DEG;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    this.a = cos * sx;
    this.b = sin * sx;
    this.c = -sin * sy;
    this.d = cos * sy;
    this.tx = x;
    this.ty = y;
    return this;
  }
  copyFrom(m) {
    this.a = m.a;
    this.b = m.b;
    this.c = m.c;
    this.d = m.d;
    this.tx = m.tx;
    this.ty = m.ty;
    return this;
  }
  clone() {
    return new _Affine(this.a, this.b, this.c, this.d, this.tx, this.ty);
  }
  /** this = l · r (r applied first). Safe when this is l or r. */
  setMultiply(l, r) {
    const a = l.a * r.a + l.c * r.b;
    const b = l.b * r.a + l.d * r.b;
    const c = l.a * r.c + l.c * r.d;
    const d = l.b * r.c + l.d * r.d;
    const tx = l.a * r.tx + l.c * r.ty + l.tx;
    const ty = l.b * r.tx + l.d * r.ty + l.ty;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }
  multiply(r) {
    return new _Affine().setMultiply(this, r);
  }
  determinant() {
    return this.a * this.d - this.b * this.c;
  }
  invert() {
    const det = this.determinant();
    if (Math.abs(det) < 1e-12) return new _Affine(1, 0, 0, 1, -this.tx, -this.ty);
    const id = 1 / det;
    const a = this.d * id;
    const b = -this.b * id;
    const c = -this.c * id;
    const d = this.a * id;
    return new _Affine(a, b, c, d, -(a * this.tx + c * this.ty), -(b * this.tx + d * this.ty));
  }
  apply(x, y) {
    return [this.a * x + this.c * y + this.tx, this.b * x + this.d * y + this.ty];
  }
  /** World angle of the local +x axis, degrees. */
  angle() {
    return Math.atan2(this.b, this.a) / DEG;
  }
  isTranslationOnly(eps = 1e-6) {
    return Math.abs(this.a - 1) < eps && Math.abs(this.b) < eps && Math.abs(this.c) < eps && Math.abs(this.d - 1) < eps;
  }
};
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = s + 1831565813 >>> 0;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashString(str2) {
  let h2 = 2166136261;
  for (let i = 0; i < str2.length; i++) h2 = Math.imul(h2 ^ str2.charCodeAt(i), 16777619) >>> 0;
  return h2;
}

// src/sprite/ownership.ts
function components(labels, w, h2, label, seen) {
  const out = [];
  const stack = [];
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] !== label || seen[start]) continue;
    const comp = [];
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop();
      comp.push(i);
      const x = i % w;
      const y = (i - x) / w;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h2 - 1 ? i + w : -1];
      for (const j of nb) {
        if (j >= 0 && !seen[j] && labels[j] === label) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    out.push(comp);
  }
  return out;
}
function cleanIslands(labels, w, h2, ratio) {
  const present = /* @__PURE__ */ new Set();
  for (const v of labels) if (v) present.add(v);
  let moved = 0;
  for (const label of present) {
    const seen = new Uint8Array(labels.length);
    const comps = components(labels, w, h2, label, seen);
    if (comps.length < 2) continue;
    comps.sort((a, b) => b.length - a.length);
    const main = comps[0].length;
    for (const comp of comps.slice(1)) {
      if (comp.length >= main * ratio) continue;
      const votes = /* @__PURE__ */ new Map();
      for (const i of comp) {
        const x = i % w;
        const y = (i - x) / w;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h2 - 1 ? i + w : -1]) {
          if (j < 0) continue;
          const v = labels[j];
          if (v && v !== label) votes.set(v, (votes.get(v) ?? 0) + 1);
        }
      }
      let best = 0;
      let bestN = 0;
      for (const [v, n] of votes) {
        if (n > bestN) {
          best = v;
          bestN = n;
        }
      }
      if (!best) continue;
      for (const i of comp) labels[i] = best;
      moved += comp.length;
    }
  }
  return moved;
}
function paintCircle(labels, img, cx, cy, r, label, alphaMin = 1) {
  const { width: w, height: h2, data } = img;
  let changed = 0;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(h2 - 1, Math.ceil(cy + r));
  const r2 = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > r2) continue;
      const i = y * w + x;
      if (data[i * 4 + 3] < alphaMin || labels[i] === label) continue;
      labels[i] = label;
      changed++;
    }
  }
  return changed;
}
function floodAssign(labels, w, h2, x, y, label) {
  if (x < 0 || y < 0 || x >= w || y >= h2) return 0;
  const start = y * w + x;
  const from = labels[start];
  if (from === label || from === 0) return 0;
  const stack = [start];
  labels[start] = label;
  let n = 0;
  while (stack.length) {
    const i = stack.pop();
    n++;
    const px = i % w;
    const py = (i - px) / w;
    for (const j of [px > 0 ? i - 1 : -1, px < w - 1 ? i + 1 : -1, py > 0 ? i - w : -1, py < h2 - 1 ? i + w : -1]) {
      if (j >= 0 && labels[j] === from) {
        labels[j] = label;
        stack.push(j);
      }
    }
  }
  return n;
}
function labelCounts(labels) {
  const out = /* @__PURE__ */ new Map();
  for (const v of labels) if (v) out.set(v, (out.get(v) ?? 0) + 1);
  return out;
}

// src/sprite/geodesic.ts
var Heap = class {
  cost;
  idx;
  size = 0;
  constructor(capacity) {
    this.cost = new Float64Array(capacity);
    this.idx = new Int32Array(capacity);
  }
  push(c, i) {
    if (this.size === this.cost.length) {
      const nc = new Float64Array(this.cost.length * 2);
      nc.set(this.cost);
      const ni = new Int32Array(this.idx.length * 2);
      ni.set(this.idx);
      this.cost = nc;
      this.idx = ni;
    }
    let k3 = this.size++;
    while (k3 > 0) {
      const p = k3 - 1 >> 1;
      if (this.cost[p] <= c) break;
      this.cost[k3] = this.cost[p];
      this.idx[k3] = this.idx[p];
      k3 = p;
    }
    this.cost[k3] = c;
    this.idx[k3] = i;
  }
  /** Pop the smallest; returns the index and leaves its cost in `lastCost`. */
  lastCost = 0;
  pop() {
    const top = this.idx[0];
    this.lastCost = this.cost[0];
    const c = this.cost[--this.size];
    const i = this.idx[this.size];
    let k3 = 0;
    for (; ; ) {
      let m = 2 * k3 + 1;
      if (m >= this.size) break;
      if (m + 1 < this.size && this.cost[m + 1] < this.cost[m]) m++;
      if (this.cost[m] >= c) break;
      this.cost[k3] = this.cost[m];
      this.idx[k3] = this.idx[m];
      k3 = m;
    }
    this.cost[k3] = c;
    this.idx[k3] = i;
    return top;
  }
};
function geodesicAssign(img, segments, o = {}) {
  const { width: w, height: h2, data } = img;
  const n = w * h2;
  const alphaMin = o.alphaMin ?? 1;
  const lambda = o.edgeWeight ?? 6;
  const core = o.seedCore ?? 0.7;
  const labels = new Uint8Array(n);
  if (!segments.length) return labels;
  const inMask = (i) => data[i * 4 + 3] >= alphaMin;
  const dist = new Float64Array(n).fill(Infinity);
  const heap = new Heap(Math.max(64, n >> 2));
  for (const s of segments) {
    const len = Math.hypot(s.bx - s.ax, s.by - s.ay);
    const t0 = len > 4 ? (1 - core) / 2 : 0;
    const t1 = len > 4 ? 1 - t0 : 1;
    const steps = Math.max(1, Math.ceil(len * 2));
    let seeded = false;
    for (let k3 = 0; k3 <= steps; k3++) {
      const t = t0 + (t1 - t0) * k3 / steps;
      const x = Math.floor(s.ax + (s.bx - s.ax) * t);
      const y = Math.floor(s.ay + (s.by - s.ay) * t);
      if (x < 0 || y < 0 || x >= w || y >= h2) continue;
      const i = y * w + x;
      if (!inMask(i)) continue;
      const c = -s.bias;
      if (c < dist[i]) {
        dist[i] = c;
        labels[i] = s.label;
        heap.push(c, i);
      }
      seeded = true;
    }
    if (!seeded) {
      let best = -1;
      let bestD = Infinity;
      const mx = (s.ax + s.bx) / 2;
      const my = (s.ay + s.by) / 2;
      for (let i = 0; i < n; i++) {
        if (!inMask(i)) continue;
        const d = (i % w + 0.5 - mx) ** 2 + (Math.floor(i / w) + 0.5 - my) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0 && Math.sqrt(bestD) - s.bias < dist[best]) {
        dist[best] = Math.sqrt(bestD) - s.bias;
        labels[best] = s.label;
        heap.push(dist[best], best);
      }
    }
  }
  const diff = (a, b) => {
    const pa = a * 4;
    const pb = b * 4;
    return Math.max(Math.abs(data[pa] - data[pb]), Math.abs(data[pa + 1] - data[pb + 1]), Math.abs(data[pa + 2] - data[pb + 2]), Math.abs(data[pa + 3] - data[pb + 3])) / 255;
  };
  while (heap.size) {
    const i = heap.pop();
    const c = heap.lastCost;
    if (c > dist[i]) continue;
    const x = i % w;
    const y = (i - x) / w;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= h2) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        if (nx < 0 || nx >= w) continue;
        const j = ny * w + nx;
        if (!inMask(j)) continue;
        const step = (dx && dy ? Math.SQRT2 : 1) * (1 + lambda * diff(i, j));
        const nc = c + step;
        if (nc < dist[j]) {
          dist[j] = nc;
          labels[j] = labels[i];
          heap.push(nc, j);
        }
      }
    }
  }
  cleanIslands(labels, w, h2, o.islandRatio ?? 0.25);
  adoptStrays(labels, img, alphaMin);
  return labels;
}
function adoptStrays(labels, img, alphaMin = 1) {
  const { width: w, height: h2, data } = img;
  let strays = 0;
  for (let i = 0; i < labels.length; i++) if (!labels[i] && data[i * 4 + 3] >= alphaMin) strays++;
  if (!strays) return 0;
  const from = new Uint8Array(labels.length);
  let queue = [];
  for (let i = 0; i < labels.length; i++) {
    if (labels[i]) {
      from[i] = labels[i];
      queue.push(i);
    }
  }
  if (!queue.length) return 0;
  while (queue.length) {
    const next = [];
    for (const i of queue) {
      const x = i % w;
      const y = (i - x) / w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h2 - 1 ? i + w : -1]) {
        if (j < 0 || from[j]) continue;
        from[j] = from[i];
        next.push(j);
      }
    }
    queue = next;
  }
  let adopted = 0;
  for (let i = 0; i < labels.length; i++) {
    if (!labels[i] && data[i * 4 + 3] >= alphaMin && from[i]) {
      labels[i] = from[i];
      adopted++;
    }
  }
  return adopted;
}

// src/sprite/morph.ts
function alphaMask(img, alphaMin = 128) {
  const m = new Uint8Array(img.width * img.height);
  for (let i = 0; i < m.length; i++) m[i] = img.data[i * 4 + 3] >= alphaMin ? 1 : 0;
  return m;
}
function distanceTransform(mask, w, h2) {
  const INF = 1e9;
  const d = new Float32Array(w * h2);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? INF : 0;
  const at = (x, y) => x < 0 || y < 0 || x >= w || y >= h2 ? 0 : d[y * w + x];
  for (let y = 0; y < h2; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
    }
  }
  for (let y = h2 - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
    }
  }
  for (let i = 0; i < d.length; i++) d[i] = d[i] / 3;
  return d;
}
function components2(mask, w, h2) {
  const seen = new Uint8Array(mask.length);
  const out = [];
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || seen[s]) continue;
    const comp = [];
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop();
      comp.push(i);
      const x = i % w;
      const y = (i - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h2) continue;
          const j = yy * w + xx;
          if (mask[j] && !seen[j]) {
            seen[j] = 1;
            stack.push(j);
          }
        }
      }
    }
    out.push(comp);
  }
  return out;
}
function skeletonize(mask, w, h2) {
  const m = mask.slice();
  const get = (x, y) => x < 0 || y < 0 || x >= w || y >= h2 ? 0 : m[y * w + x];
  let changed = true;
  const del = [];
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      del.length = 0;
      for (let y = 0; y < h2; y++) {
        for (let x = 0; x < w; x++) {
          if (!m[y * w + x]) continue;
          const p2 = get(x, y - 1);
          const p3 = get(x + 1, y - 1);
          const p4 = get(x + 1, y);
          const p5 = get(x + 1, y + 1);
          const p6 = get(x, y + 1);
          const p7 = get(x - 1, y + 1);
          const p8 = get(x - 1, y);
          const p9 = get(x - 1, y - 1);
          const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (b < 2 || b > 6) continue;
          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let a = 0;
          for (let k3 = 0; k3 < 8; k3++) if (!seq[k3] && seq[k3 + 1]) a++;
          if (a !== 1) continue;
          if (step === 0 ? p2 * p4 * p6 || p4 * p6 * p8 : p2 * p4 * p8 || p2 * p6 * p8) continue;
          del.push(y * w + x);
        }
      }
      for (const i of del) m[i] = 0;
      if (del.length) changed = true;
    }
  }
  return m;
}

// src/sprite/landmarks.ts
var clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
var lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
var median = (v) => {
  if (!v.length) return 0;
  const s = v.slice().sort((a, b) => a - b);
  return s[s.length >> 1];
};
function rowRuns(mask, w, y, minLen = 1) {
  const out = [];
  let s = -1;
  for (let x = 0; x <= w; x++) {
    const on = x < w && mask[y * w + x] === 1;
    if (on && s < 0) s = x;
    if (!on && s >= 0) {
      if (x - s >= minLen) out.push({ x0: s, x1: x - 1 });
      s = -1;
    }
  }
  return out;
}
function skeletonBranches(skel, w, h2) {
  const at = (x, y) => x < 0 || y < 0 || x >= w || y >= h2 ? 0 : skel[y * w + x];
  const ring = (i) => {
    const x = i % w;
    const y = (i - x) / w;
    return [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
  };
  const crossings = (i) => {
    const r = ring(i);
    let a = 0;
    for (let k3 = 0; k3 < 8; k3++) if (!r[k3] && r[(k3 + 1) % 8]) a++;
    return a;
  };
  const nb = (i) => {
    const x = i % w;
    const y = (i - x) / w;
    const out2 = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        if (at(x + dx, y + dy)) out2.push((y + dy) * w + x + dx);
      }
    }
    return out2;
  };
  const px = (i) => i % w;
  const py = (i) => Math.floor(i / w);
  const out = [];
  for (let i = 0; i < skel.length; i++) {
    if (!skel[i] || crossings(i) !== 1) continue;
    const path = [i];
    const seen = /* @__PURE__ */ new Set([i]);
    let cur = i;
    for (; ; ) {
      const next = nb(cur).filter((j) => !seen.has(j));
      if (!next.length) break;
      const back = path[Math.max(0, path.length - 3)];
      next.sort((a2, b2) => Math.hypot(px(b2) - px(back), py(b2) - py(back)) - Math.hypot(px(a2) - px(back), py(a2) - py(back)));
      for (const j of next) seen.add(j);
      cur = next[0];
      path.push(cur);
      if (crossings(cur) >= 3) break;
    }
    const a = path[0];
    const b = path[path.length - 1];
    const chord = Math.hypot(px(a) - px(b), py(a) - py(b));
    let len = 0;
    for (let k3 = 1; k3 < path.length; k3++) len += Math.hypot(px(path[k3 - 1]) - px(path[k3]), py(path[k3 - 1]) - py(path[k3]));
    out.push({ path, length: len, straightness: len > 0 ? chord / len : 0 });
  }
  return out;
}
function detectWeapon(mask, w, h2, height) {
  const skel = skeletonize(mask, w, h2);
  const dt = distanceTransform(mask, w, h2);
  let best = null;
  let bestScore = 0;
  let medianThick = 0;
  {
    const all = [];
    for (let i = 0; i < skel.length; i++) if (skel[i]) all.push(dt[i]);
    medianThick = median(all);
  }
  let bottom = 0;
  let bodyCx = 0;
  let bodyCy = 0;
  let bodyN = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const y = Math.floor(i / w);
    bottom = Math.max(bottom, y);
    if (dt[i] >= medianThick) {
      bodyCx += i % w + 0.5;
      bodyCy += y + 0.5;
      bodyN++;
    }
  }
  bodyCx /= bodyN || 1;
  bodyCy /= bodyN || 1;
  const straightPrefix = (b) => {
    const px = (i) => i % w + 0.5;
    const py = (i) => Math.floor(i / w) + 0.5;
    const p0 = b.path[0];
    let keep = 1;
    for (let k3 = 2; k3 < b.path.length; k3++) {
      const pk = b.path[k3];
      const L = Math.hypot(px(pk) - px(p0), py(pk) - py(p0)) || 1;
      const tol = Math.max(1.25, L * 0.04);
      let ok = true;
      for (let j = 1; j < k3 && ok; j++) {
        const q = b.path[j];
        const dev = Math.abs((px(pk) - px(p0)) * (py(p0) - py(q)) - (px(p0) - px(q)) * (py(pk) - py(p0))) / L;
        if (dev > tol) ok = false;
      }
      if (!ok) break;
      keep = k3 + 1;
    }
    const path = b.path.slice(0, keep);
    const last = path[path.length - 1];
    const len = Math.hypot(px(last) - px(p0), py(last) - py(p0));
    return { path, length: len, straightness: 1 };
  };
  for (const whole of skeletonBranches(skel, w, h2)) {
    const b = straightPrefix(whole);
    if (b.length < height * 0.3) continue;
    const tip = b.path[0];
    const tipY = Math.floor(tip / w);
    const baseY = Math.floor(b.path[b.path.length - 1] / w);
    if (tipY >= bottom - height * 0.04 && tipY > baseY) continue;
    {
      const tx0 = tip % w;
      let solid = 0;
      for (let y = tipY; y <= bottom; y++) if (mask[y * w + tx0]) solid++;
      if (tipY > baseY && solid >= (bottom - tipY + 1) * 0.8) continue;
    }
    const thick2 = median(b.path.map((i) => dt[i]));
    const tx = tip % w + 0.5;
    const far = Math.hypot(tx - bodyCx, tipY + 0.5 - bodyCy) >= height * 0.4;
    if (!far) continue;
    if (thick2 > Math.max(1.6, medianThick * 1.15) && b.length < height * 0.35) continue;
    const score = b.length * b.straightness;
    if (score > bestScore) {
      bestScore = score;
      best = b;
    }
  }
  if (!best) return null;
  const thick = Math.max(1, median(best.path.map((i) => dt[i])));
  const pixels = /* @__PURE__ */ new Set();
  const r = Math.ceil(thick + 1);
  for (const i of best.path.slice(0, Math.max(2, best.path.length - Math.ceil(thick)))) {
    const x = i % w;
    const y = (i - x) / w;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h2) continue;
        const j = yy * w + xx;
        if (mask[j] && Math.hypot(dx, dy) <= thick + 0.75) pixels.add(j);
      }
    }
  }
  const tipI = best.path[0];
  const hiltI = best.path[best.path.length - 1];
  return { pixels: [...pixels], tip: [tipI % w + 0.5, Math.floor(tipI / w) + 0.5], hilt: [hiltI % w + 0.5, Math.floor(hiltI / w) + 0.5], length: best.length };
}
function detectHumanoid(img, facingIn = "auto") {
  const { width: w, height: h2 } = img;
  const full = alphaMask(img, 128);
  {
    const comps = components2(full, w, h2).sort((a, b) => b.length - a.length);
    const keep = new Uint8Array(full.length);
    const main = comps[0]?.length ?? 0;
    for (const c of comps) if (c.length >= main * 0.15) for (const i of c) keep[i] = 1;
    full.set(keep);
  }
  let anyPx = false;
  let fTop = h2;
  let fBottom = -1;
  for (let i = 0; i < full.length; i++) {
    if (!full[i]) continue;
    anyPx = true;
    const y = Math.floor(i / w);
    fTop = Math.min(fTop, y);
    fBottom = Math.max(fBottom, y);
  }
  if (!anyPx) return null;
  const notes = [];
  const weaponFound = detectWeapon(full, w, h2, fBottom - fTop + 1);
  let facing = facingIn === "auto" ? "right" : facingIn;
  if (facingIn === "auto" && weaponFound) {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < full.length; i++) {
      if (!full[i]) continue;
      sum += i % w;
      n++;
    }
    const centre = sum / (n || 1);
    const mid = (weaponFound.tip[0] + weaponFound.hilt[0]) / 2;
    const side = mid - centre;
    const dir = weaponFound.tip[0] - weaponFound.hilt[0];
    const lean = Math.abs(side) > (fBottom - fTop) * 0.05 ? side : dir;
    facing = lean >= 0 ? "right" : "left";
    notes.push(`Facing ${facing}: the weapon is on that side.`);
  }
  const s = facing === "right" ? 1 : -1;
  const mask = full.slice();
  if (weaponFound) for (const i of weaponFound.pixels) mask[i] = 0;
  let top = h2;
  let bottom = -1;
  let left = w;
  let right = -1;
  const xs = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const x = i % w;
    const y = (i - x) / w;
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    left = Math.min(left, x);
    right = Math.max(right, x);
    xs.push(x);
  }
  const H = bottom - top + 1;
  const cx = median(xs) + 0.5;
  const mainRun = (y) => {
    const runs = rowRuns(mask, w, y);
    if (!runs.length) return null;
    let best = runs[0];
    let bestD = Infinity;
    for (const r of runs) {
      const d = cx >= r.x0 && cx <= r.x1 + 1 ? 0 : Math.min(Math.abs(cx - r.x0), Math.abs(cx - r.x1 - 1));
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    return best;
  };
  const widthAt = (y) => {
    const r = mainRun(y);
    return r ? r.x1 - r.x0 + 1 : 0;
  };
  const centreAt = (y) => {
    const r = mainRun(Math.round(y));
    return r ? (r.x0 + r.x1 + 1) / 2 : cx;
  };
  let neckY = Math.round(top + H * 0.33);
  let headConf = 0.2;
  {
    const y0 = Math.round(top + H * 0.12);
    const y1 = Math.round(top + H * 0.5);
    const widths = [];
    for (let y = top; y <= y1 + 3; y++) widths.push(widthAt(y));
    const W = (y) => widths[y - top] ?? 0;
    let peak = top;
    let run = 0;
    for (let y = top; y <= y1; y++) {
      const wy = W(y);
      if (wy > run) {
        run = wy;
        peak = y;
      } else if (wy < run - Math.max(2, run * 0.1)) break;
    }
    let minW = Infinity;
    let minY = neckY;
    for (let y = Math.max(peak + 1, y0); y <= y1; y++) {
      const wy = W(y);
      if (wy > 0 && wy < minW) {
        minW = wy;
        minY = y;
      }
    }
    let jump = 0;
    let jumpY = -1;
    for (let y = y0; y <= y1; y++) {
      const wy = W(y);
      const below = Math.max(W(y + 2), W(y + 3));
      if (wy > 0 && below / wy > jump) {
        jump = below / wy;
        jumpY = y;
      }
    }
    const headW = W(peak);
    const dip = headW > 0 && minW < Infinity ? (headW - minW) / headW : 0;
    if (dip >= 0.08 && minY > peak) {
      neckY = minY;
      headConf = clamp01(dip * 3);
    } else if (jump >= 1.35 && jumpY > 0) {
      neckY = jumpY;
      headConf = clamp01((jump - 1) * 1.5);
    } else notes.push("No clear neck: head size guessed from proportions.");
  }
  const neck = [centreAt(neckY), neckY + 0.5];
  const topPt = [neck[0], top];
  const minRun = Math.max(1, Math.round(H * 0.03));
  let torsoHalf = 0;
  {
    const ws = [];
    for (let y = Math.round(neckY + H * 0.08); y <= Math.round(top + H * 0.6); y++) ws.push(widthAt(y) / 2);
    ws.sort((a, b) => a - b);
    torsoHalf = Math.max(2, ws[Math.floor(ws.length * 0.2)] ?? 2);
  }
  const underTorso = (r) => Math.abs((r.x0 + r.x1 + 1) / 2 - cx) <= torsoHalf * 1.3;
  const legRuns = (y) => rowRuns(mask, w, y, minRun).filter(underTorso);
  let span = null;
  {
    let start = -1;
    let gap = 0;
    for (let y = Math.round(top + H * 0.5); y <= bottom; y++) {
      const n = legRuns(y).length;
      if (n >= 2) {
        if (start < 0) start = y;
        gap = 0;
        if (!span || y - start > span[1] - span[0]) span = [start, y];
      } else if (start >= 0 && ++gap > 1) {
        start = -1;
        gap = 0;
      }
    }
    if (span && span[1] - span[0] + 1 < H * 0.08) span = null;
  }
  const legRows = (y0, y1) => {
    const back2 = [];
    const front2 = [];
    for (let y = Math.round(y0); y <= Math.round(y1); y++) {
      const runs = legRuns(y).sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0)).slice(0, 2);
      if (runs.length < 2) continue;
      runs.sort((a, b) => (a.x0 - b.x0) * s);
      back2.push((runs[0].x0 + runs[0].x1 + 1) / 2);
      front2.push((runs[1].x0 + runs[1].x1 + 1) / 2);
    }
    return { back: median(back2), front: median(front2), n: back2.length };
  };
  let hipY;
  let hipF;
  let hipB;
  let kneeF;
  let kneeB;
  let ankleF;
  let ankleB;
  let legConf;
  const ankleY = bottom - H * 0.06;
  if (span) {
    const [c0, c12] = span;
    const len = c12 - c0;
    const hi = legRows(c0, c0 + len * 0.25);
    const mid = legRows(c0 + len * 0.35, c0 + len * 0.65);
    const lo = legRows(c0 + len * 0.75, c12);
    hipY = c0 - H * 0.03;
    const kneeY = (c0 + ankleY) / 2;
    hipF = [hi.front, hipY];
    hipB = [hi.back, hipY];
    kneeF = [mid.n ? mid.front : hi.front, kneeY];
    kneeB = [mid.n ? mid.back : hi.back, kneeY];
    ankleF = [lo.n ? lo.front : kneeF[0], ankleY];
    ankleB = [lo.n ? lo.back : kneeB[0], ankleY];
    legConf = clamp01(len / (H * 0.25));
  } else {
    notes.push("Legs not separated (robe or long coat): legs placed from proportions.");
    const bw = right - left + 1;
    hipY = top + H * 0.62;
    hipF = [cx + s * bw * 0.08, hipY];
    hipB = [cx - s * bw * 0.06, hipY];
    kneeF = [hipF[0] + s * bw * 0.04, (hipY + ankleY) / 2];
    kneeB = [hipB[0] - s * bw * 0.04, (hipY + ankleY) / 2];
    ankleF = [kneeF[0], ankleY];
    ankleB = [kneeB[0], ankleY];
    legConf = 0.2;
  }
  const toe = (ankle) => {
    let best = [ankle[0] + s * H * 0.06, bottom];
    let bestX = -Infinity;
    for (let y = Math.round(bottom - H * 0.06); y <= bottom; y++) {
      for (const r of rowRuns(mask, w, y)) {
        const c = (r.x0 + r.x1 + 1) / 2;
        if (Math.abs(c - ankle[0]) > H * 0.12) continue;
        const ex = s > 0 ? r.x1 + 1 : r.x0;
        if (ex * s > bestX) {
          bestX = ex * s;
          best = [ex - s * 0.5, y + 0.5];
        }
      }
    }
    return best;
  };
  const toeF = toe(ankleF);
  const toeB = toe(ankleB);
  const pelvis = [(hipF[0] + hipB[0]) / 2, hipY - H * 0.02];
  const bandTop = Math.round(neckY + H * 0.06);
  const bandBottom = Math.round(hipY + H * 0.12);
  const halfWidths = [];
  for (let y = bandTop; y <= bandBottom; y++) halfWidths.push(widthAt(y) / 2);
  const wc = Math.max(1, median(halfWidths));
  let back = null;
  let front = null;
  for (let y = bandTop; y <= bandBottom; y++) {
    for (const r of rowRuns(mask, w, y)) {
      for (const ex of [r.x0 + 0.5, r.x1 + 0.5]) {
        if (!back || ex * s < back[0] * s) back = [ex, y + 0.5];
        if (!front || ex * s > front[0] * s) front = [ex, y + 0.5];
      }
    }
  }
  const midC = centreAt((bandTop + bandBottom) / 2);
  const protrudeB = back ? Math.abs(back[0] - midC) - wc : 0;
  const protrudeF = front ? Math.abs(front[0] - midC) - wc : 0;
  let armConf = clamp01(Math.min(protrudeB, protrudeF) / (H * 0.06));
  const shoulderY = neckY + H * 0.09;
  const sC = centreAt(shoulderY);
  const shoulderF = [sC + s * wc * 0.55, shoulderY];
  const shoulderB = [sC - s * wc * 0.55, shoulderY];
  let handF = front ?? [shoulderF[0] + s * wc, shoulderY + H * 0.2];
  let handB = back ?? [shoulderB[0] - s * wc, shoulderY + H * 0.2];
  if (weaponFound) {
    handF = weaponFound.hilt;
    armConf = Math.max(armConf, 0.5);
  }
  const plausible = (hand, shoulder) => {
    const d = Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1]);
    return d <= H * 0.48 && hand[1] >= shoulder[1] - H * 0.04;
  };
  if (protrudeB < 1 || !plausible(handB, shoulderB)) {
    if (protrudeB >= 1) notes.push("Back hand unclear: placed from proportions.");
    handB = [shoulderB[0] - s * wc * 0.4, hipY];
  }
  if (!weaponFound && (protrudeF < 1 || !plausible(handF, shoulderF))) {
    if (protrudeF >= 1) notes.push("Front hand unclear: placed from proportions.");
    handF = [shoulderF[0] + s * wc * 0.4, hipY];
  }
  const handLen = H * 0.07;
  const wrist = (shoulder, hand) => {
    const d = Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1]) || 1;
    return lerp(hand, shoulder, Math.min(0.4, handLen / d));
  };
  const wristF = wrist(shoulderF, handF);
  const wristB = wrist(shoulderB, handB);
  const elbow = (shoulder, wr) => {
    const m = lerp(shoulder, wr, 0.5);
    return [m[0], m[1] + H * 0.015];
  };
  return {
    facing,
    body: { x: left, y: top, width: right - left + 1, height: H },
    top: topPt,
    neck,
    pelvis,
    ground: [pelvis[0], bottom + 1],
    shoulderFront: shoulderF,
    shoulderBack: shoulderB,
    elbowFront: elbow(shoulderF, wristF),
    elbowBack: elbow(shoulderB, wristB),
    wristFront: wristF,
    wristBack: wristB,
    handFront: handF,
    handBack: handB,
    hipFront: hipF,
    hipBack: hipB,
    kneeFront: kneeF,
    kneeBack: kneeB,
    ankleFront: ankleF,
    ankleBack: ankleB,
    toeFront: toeF,
    toeBack: toeB,
    weapon: weaponFound ? { hilt: weaponFound.hilt, tip: weaponFound.tip } : null,
    confidence: { head: headConf, legs: legConf, arms: armConf, weapon: weaponFound ? 0.8 : 0 },
    notes
  };
}

// src/core/skeleton.ts
function orderBones(bones) {
  const byId = new Map(bones.map((b) => [b.id, b]));
  if (byId.size !== bones.length) throw new Error("Two bones share an id.");
  const out = [];
  const state = /* @__PURE__ */ new Map();
  const visit = (b, path) => {
    const s = state.get(b.id);
    if (s === 2) return;
    if (s === 1) throw new Error(`Bone hierarchy has a cycle: ${[...path, b.name].join(" \u2192 ")}`);
    state.set(b.id, 1);
    if (b.parent !== null) {
      const p = byId.get(b.parent);
      if (!p) throw new Error(`Bone "${b.name}" has a missing parent.`);
      visit(p, [...path, b.name]);
    }
    state.set(b.id, 2);
    out.push(b);
  };
  for (const b of bones) visit(b, []);
  return out;
}
var Skeleton = class {
  bones;
  index = /* @__PURE__ */ new Map();
  parent;
  children;
  setup;
  local;
  world;
  setupWorld;
  setupWorldInv;
  skin;
  /** Continuous setup world angle per bone: the sum of local rotations down the chain (degrees). */
  setupAngle;
  /** role → bone index (first bone with that role). */
  roles = /* @__PURE__ */ new Map();
  scratch = new Affine();
  constructor(bones) {
    this.bones = orderBones(bones);
    const n = this.bones.length;
    this.parent = new Int32Array(n);
    this.children = Array.from({ length: n }, () => []);
    this.bones.forEach((b, i) => this.index.set(b.id, i));
    this.bones.forEach((b, i) => {
      const p = b.parent === null ? -1 : this.index.get(b.parent) ?? -1;
      this.parent[i] = p;
      if (p >= 0) this.children[p].push(i);
      if (b.role && !this.roles.has(b.role)) this.roles.set(b.role, i);
    });
    this.setup = this.bones.map((b) => ({ rot: b.rotation, x: b.x, y: b.y, sx: b.scaleX, sy: b.scaleY }));
    this.local = this.setup.map((p) => ({ ...p }));
    this.world = this.bones.map(() => new Affine());
    this.skin = this.bones.map(() => new Affine());
    this.updateWorld(this.setup, this.world);
    this.setupWorld = this.world.map((m) => m.clone());
    this.setupWorldInv = this.setupWorld.map((m) => m.invert());
    this.setupAngle = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const p = this.parent[i];
      const inherits = p >= 0 && this.bones[i].inheritRotation !== false;
      this.setupAngle[i] = (inherits ? this.setupAngle[p] : 0) + this.setup[i].rot;
    }
    this.updateSkin();
  }
  get size() {
    return this.bones.length;
  }
  resetPose() {
    for (let i = 0; i < this.setup.length; i++) Object.assign(this.local[i], this.setup[i]);
  }
  /** Compute world matrices from a local pose (defaults to the current pose). */
  updateWorld(local = this.local, out = this.world) {
    for (let i = 0; i < this.bones.length; i++) {
      const l = local[i];
      const p = this.parent[i];
      const m = out[i];
      if (p < 0) {
        m.setTRS(l.x, l.y, l.rot, l.sx, l.sy);
        continue;
      }
      const pw = out[p];
      if (this.bones[i].inheritRotation === false) {
        const [wx, wy] = pw.apply(l.x, l.y);
        m.setTRS(wx, wy, l.rot, l.sx, l.sy);
      } else {
        this.scratch.setTRS(l.x, l.y, l.rot, l.sx, l.sy);
        m.setMultiply(pw, this.scratch);
      }
    }
  }
  updateSkin() {
    for (let i = 0; i < this.bones.length; i++) this.skin[i].setMultiply(this.world[i], this.setupWorldInv[i]);
  }
  /** Recompute world and skin matrices from the current local pose. */
  update() {
    this.updateWorld();
    this.updateSkin();
  }
  /** World position of a bone's origin and tip in the current pose. */
  segment(i, matrices = this.world) {
    const m = matrices[i];
    const [bx, by] = m.apply(this.bones[i].length, 0);
    return { ax: m.tx, ay: m.ty, bx, by };
  }
  /** World angle (degrees) of a bone's parent in the given matrices; 0 for roots. */
  parentWorldAngle(i, matrices = this.world) {
    const p = this.parent[i];
    return p < 0 ? 0 : matrices[p].angle();
  }
};

// src/rig/frames.ts
function tipOf(f) {
  return [f.x + Math.cos(f.angle * DEG) * f.length, f.y + Math.sin(f.angle * DEG) * f.length];
}
function frameFromPoints(ax, ay, bx, by) {
  return { x: ax, y: ay, angle: Math.atan2(by - ay, bx - ax) / DEG, length: Math.hypot(bx - ax, by - ay) };
}
function bonesToFrames(bones) {
  const frames = /* @__PURE__ */ new Map();
  for (const b of orderBones(bones)) {
    const p = b.parent ? frames.get(b.parent) : void 0;
    if (!p) {
      frames.set(b.id, { x: b.x, y: b.y, angle: b.rotation, length: b.length });
      continue;
    }
    const r = p.angle * DEG;
    const inherits = b.inheritRotation !== false;
    frames.set(b.id, {
      x: p.x + Math.cos(r) * b.x - Math.sin(r) * b.y,
      y: p.y + Math.sin(r) * b.x + Math.cos(r) * b.y,
      angle: inherits ? p.angle + b.rotation : b.rotation,
      length: b.length
    });
  }
  return frames;
}
function applyFrames(bones, frames) {
  for (const b of bones) {
    const f = frames.get(b.id);
    if (!f) continue;
    const p = b.parent ? frames.get(b.parent) : void 0;
    b.scaleX = 1;
    b.scaleY = 1;
    b.length = Math.max(0, f.length);
    if (!p) {
      b.x = f.x;
      b.y = f.y;
      b.rotation = wrapDeg(f.angle);
      continue;
    }
    const r = -p.angle * DEG;
    const dx = f.x - p.x;
    const dy = f.y - p.y;
    b.x = Math.cos(r) * dx - Math.sin(r) * dy;
    b.y = Math.sin(r) * dx + Math.cos(r) * dy;
    b.rotation = b.inheritRotation === false ? wrapDeg(f.angle) : wrapDeg(f.angle - p.angle);
  }
}
function isConnected(frames, bone2, eps = 0.75) {
  if (!bone2.parent) return false;
  const p = frames.get(bone2.parent);
  const f = frames.get(bone2.id);
  if (!p || !f) return false;
  const [tx, ty] = tipOf(p);
  return Math.hypot(tx - f.x, ty - f.y) <= eps;
}

// src/rig/templates.ts
var C = { body: "#f2c45a", head: "#ffd98a", armF: "#5aa9ff", armB: "#3f6fb5", legF: "#7ad08f", legB: "#4f9163", weapon: "#ff6b6b", root: "#9aa4b8" };
var HUMANOID = {
  id: "humanoid",
  name: "Humanoid",
  description: "Two arms, two legs, a head and a held weapon. Side or three-quarter battle sprites.",
  bones: [
    { id: "root", name: "Root", role: "root", parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
    { id: "pelvis", name: "Pelvis", role: "pelvis", parent: "root", from: [0.5, 0.66], to: [0.5, 0.59], color: C.body, part: { deform: "mesh", softness: 0.03, reach: 0.03 } },
    { id: "torso", name: "Torso", role: "torso", parent: "pelvis", from: [0.5, 0.59], to: [0.5, 0.36], color: C.body, part: { deform: "mesh", softness: 0.04, reach: 0.05 } },
    { id: "head", name: "Head", role: "head", parent: "torso", from: [0.5, 0.36], to: [0.5, 0.04], color: C.head, part: { deform: "rigid", softness: 0, reach: 0.08 } },
    { id: "arm_upper_back", name: "Back upper arm", role: "arm.upper.back", parent: "torso", from: [0.4, 0.39], to: [0.33, 0.5], color: C.armB, part: { deform: "mesh", softness: 0.03 } },
    { id: "arm_lower_back", name: "Back forearm", role: "arm.lower.back", parent: "arm_upper_back", from: [0.33, 0.5], to: [0.29, 0.58], color: C.armB, part: { deform: "mesh", softness: 0.03 } },
    { id: "hand_back", name: "Back hand", role: "hand.back", parent: "arm_lower_back", from: [0.29, 0.58], to: [0.27, 0.64], color: C.armB, part: { deform: "rigid", reach: -5e-3 } },
    { id: "leg_upper_back", name: "Back thigh", role: "leg.upper.back", parent: "pelvis", from: [0.46, 0.66], to: [0.43, 0.8], color: C.legB, part: { deform: "mesh", softness: 0.03, reach: 0.01 } },
    { id: "leg_lower_back", name: "Back shin", role: "leg.lower.back", parent: "leg_upper_back", from: [0.43, 0.8], to: [0.43, 0.95], color: C.legB, part: { deform: "mesh", softness: 0.03, reach: 0.01 } },
    { id: "foot_back", name: "Back foot", role: "foot.back", parent: "leg_lower_back", from: [0.43, 0.95], to: [0.5, 0.99], color: C.legB, part: { deform: "rigid" } },
    { id: "leg_upper_front", name: "Front thigh", role: "leg.upper.front", parent: "pelvis", from: [0.55, 0.66], to: [0.58, 0.8], color: C.legF, part: { deform: "mesh", softness: 0.03, reach: 0.01 } },
    { id: "leg_lower_front", name: "Front shin", role: "leg.lower.front", parent: "leg_upper_front", from: [0.58, 0.8], to: [0.58, 0.95], color: C.legF, part: { deform: "mesh", softness: 0.03, reach: 0.01 } },
    { id: "foot_front", name: "Front foot", role: "foot.front", parent: "leg_lower_front", from: [0.58, 0.95], to: [0.66, 0.99], color: C.legF, part: { deform: "rigid" } },
    { id: "arm_upper_front", name: "Front upper arm", role: "arm.upper.front", parent: "torso", from: [0.6, 0.39], to: [0.68, 0.5], color: C.armF, part: { deform: "mesh", softness: 0.03 } },
    { id: "arm_lower_front", name: "Front forearm", role: "arm.lower.front", parent: "arm_upper_front", from: [0.68, 0.5], to: [0.76, 0.57], color: C.armF, part: { deform: "mesh", softness: 0.03 } },
    { id: "hand_front", name: "Front hand", role: "hand.front", parent: "arm_lower_front", from: [0.76, 0.57], to: [0.81, 0.62], color: C.armF, part: { deform: "rigid", reach: -5e-3 } },
    { id: "weapon", name: "Weapon", role: "weapon", parent: "hand_front", from: [0.81, 0.62], to: [1.05, 0.3], color: C.weapon, part: { deform: "rigid", fill: false, reach: -0.01 } }
  ],
  drawOrder: [
    "arm_upper_back",
    "arm_lower_back",
    "hand_back",
    "leg_upper_back",
    "leg_lower_back",
    "foot_back",
    "leg_upper_front",
    "leg_lower_front",
    "foot_front",
    "pelvis",
    "torso",
    "head",
    "arm_upper_front",
    "arm_lower_front",
    "weapon",
    "hand_front"
  ]
};
var CUSTOM = {
  id: "custom",
  name: "Custom",
  description: "A root and one body bone. Build any creature by adding bones.",
  bones: [
    { id: "root", name: "Root", role: "root", parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
    { id: "body", name: "Body", role: "torso", parent: "root", from: [0.5, 0.95], to: [0.5, 0.2], color: C.body, part: { deform: "mesh", softness: 0.04 } }
  ],
  drawOrder: ["body"]
};
var TEMPLATES = { humanoid: HUMANOID, custom: CUSTOM };
var KNOWN_ROLES = [.../* @__PURE__ */ new Set([...HUMANOID.bones.map((b) => b.role), "neck", "hair", "cape", "tail", "offhand", "accessory"])];
function defaultPart(id, name, bone2, label, deform = "mesh") {
  return { id, name, bone: bone2, label, deform, softness: deform === "mesh" ? 0.03 : 0, stiffness: 0, cell: 0, fill: true };
}
function buildFromTemplate(t, place) {
  const frames = /* @__PURE__ */ new Map();
  const bones = t.bones.map((tb) => {
    const { from, to } = place(tb);
    frames.set(tb.id, frameFromPoints(from[0], from[1], to[0], to[1]));
    return { id: tb.id, name: tb.name, parent: tb.parent, role: tb.role, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, length: 0, color: tb.color };
  });
  applyFrames(bones, frames);
  const parts = t.drawOrder.map((boneId, i) => {
    const tb = t.bones.find((b) => b.id === boneId);
    const spec = tb.part;
    const p = defaultPart(`part_${boneId}`, tb.name, boneId, i + 1, spec.deform);
    if (spec.softness !== void 0) p.softness = spec.softness;
    if (spec.stiffness !== void 0) p.stiffness = spec.stiffness;
    if (spec.fill !== void 0) p.fill = spec.fill;
    if (spec.reach !== void 0) p.reach = spec.reach;
    return p;
  });
  return { bones, parts };
}
function fitTemplate(t, bounds, facing) {
  const map = ([u, v]) => [bounds.x + (facing === "left" ? 1 - u : u) * bounds.width, bounds.y + v * bounds.height];
  return buildFromTemplate(t, (tb) => ({ from: map(tb.from), to: map(tb.to) }));
}

// src/rig/autorig.ts
function humanoidFromLandmarks(L) {
  const H = L.body.height;
  const s = L.facing === "right" ? 1 : -1;
  const pelvisLow = [L.pelvis[0], L.pelvis[1] + H * 0.035];
  const pelvisTop = [L.pelvis[0], L.pelvis[1] - H * 0.04];
  const weapon = L.weapon ? [L.weapon.hilt, L.weapon.tip] : [L.handFront, [L.handFront[0] + s * H * 0.22, L.handFront[1] - H * 0.32]];
  const place = {
    root: [L.ground, [L.ground[0] + s * H * 0.12, L.ground[1]]],
    pelvis: [pelvisLow, pelvisTop],
    torso: [pelvisTop, L.neck],
    head: [L.neck, L.top],
    arm_upper_back: [L.shoulderBack, L.elbowBack],
    arm_lower_back: [L.elbowBack, L.wristBack],
    hand_back: [L.wristBack, L.handBack],
    leg_upper_back: [L.hipBack, L.kneeBack],
    leg_lower_back: [L.kneeBack, L.ankleBack],
    foot_back: [L.ankleBack, L.toeBack],
    leg_upper_front: [L.hipFront, L.kneeFront],
    leg_lower_front: [L.kneeFront, L.ankleFront],
    foot_front: [L.ankleFront, L.toeFront],
    arm_upper_front: [L.shoulderFront, L.elbowFront],
    arm_lower_front: [L.elbowFront, L.wristFront],
    hand_front: [L.wristFront, L.handFront],
    weapon
  };
  return buildFromTemplate(HUMANOID, (tb) => {
    const p = place[tb.id];
    if (!p) throw new Error(`No placement for ${tb.id}`);
    return { from: p[0], to: p[1] };
  });
}

// src/sprite/rle.ts
function toBase64(bytes) {
  let bin = "";
  const CHUNK = 32768;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}
function fromBase64(str2) {
  const bin = atob(str2);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function encodeRle(data) {
  const out = [];
  let i = 0;
  while (i < data.length) {
    const v = data[i];
    let run = 1;
    while (i + run < data.length && data[i + run] === v) run++;
    out.push(v);
    let r = run;
    while (r >= 128) {
      out.push(r & 127 | 128);
      r >>>= 7;
    }
    out.push(r);
    i += run;
  }
  return toBase64(Uint8Array.from(out));
}
function decodeRle(str2, length) {
  const bytes = fromBase64(str2);
  const out = new Uint8Array(length);
  let p = 0;
  let o = 0;
  while (p < bytes.length) {
    const v = bytes[p++];
    let run = 0;
    let shift = 0;
    for (; ; ) {
      if (p >= bytes.length) throw new Error("Ownership map is truncated.");
      const b = bytes[p++];
      run |= (b & 127) << shift;
      if (!(b & 128)) break;
      shift += 7;
    }
    if (o + run > length) throw new Error("Ownership map is larger than the image.");
    out.fill(v, o, o + run);
    o += run;
  }
  if (o !== length) throw new Error(`Ownership map covers ${o} of ${length} pixels.`);
  return out;
}

// src/rig/document.ts
var RIG_FORMAT = "fusa-rig";
var RIG_VERSION = 1;
var counter = 0;
function newId(prefix = "") {
  const f = globalThis.foundry?.utils?.randomID;
  if (f) return prefix + f(12);
  counter = (counter + 1) % 1e6;
  return prefix + Date.now().toString(36) + counter.toString(36) + Math.random().toString(36).slice(2, 6);
}
function defaultRender(img) {
  const pixel = img ? looksLikePixelArt(img) : true;
  return { mode: pixel ? "pixel" : "smooth", padding: 0.35, snap: pixel, idleFps: pixel ? 12 : 0, resolution: 1 };
}
var lastReport = /* @__PURE__ */ new WeakMap();
function createRig(o) {
  const full = { x: 0, y: 0, width: o.image.width, height: o.image.height };
  const bounds = opaqueBounds(o.image) ?? full;
  const body = bodyBounds(o.image) ?? full;
  const template = TEMPLATES[o.template ?? "humanoid"] ?? TEMPLATES.humanoid;
  let facing = o.facing ?? "right";
  let landmarks = null;
  if (template.id === "humanoid" && o.detect !== false) {
    landmarks = detectHumanoid(o.image, o.facing ?? "auto");
    if (landmarks) facing = landmarks.facing;
  }
  const { bones, parts } = landmarks ? humanoidFromLandmarks(landmarks) : fitTemplate(template, body, facing);
  const now = Date.now();
  const rig = {
    format: RIG_FORMAT,
    version: RIG_VERSION,
    id: newId("rig"),
    name: o.name,
    template: template.id,
    facing,
    image: { src: o.src, width: o.image.width, height: o.image.height },
    metrics: { bodyHeight: body.height, bounds },
    bones,
    parts,
    ownership: null,
    render: defaultRender(o.image),
    created: now,
    updated: now,
    revision: 1
  };
  if (landmarks) rig.metrics.bodyHeight = landmarks.body.height;
  if (o.assign !== false) rig.ownership = encodeRle(assignPixels(rig, o.image));
  lastReport.set(rig, landmarks ? { method: "landmarks", confidence: landmarks.confidence, notes: landmarks.notes } : { method: "proportions", confidence: {}, notes: [] });
  return rig;
}
function rigLabels(rig) {
  const n = rig.image.width * rig.image.height;
  return rig.ownership ? decodeRle(rig.ownership, n) : new Uint8Array(n);
}
function rigHints(rig) {
  return rig.fillHints ? decodeRle(rig.fillHints, rig.image.width * rig.image.height) : null;
}
function proposeRig(image, template, facing, detect = true) {
  const fresh = createRig({ name: "proposal", src: "", image, template, facing: facing === "auto" ? void 0 : facing, detect });
  return { bones: fresh.bones, parts: fresh.parts, ownership: fresh.ownership, metrics: fresh.metrics, facing: fresh.facing, template: fresh.template, report: lastReport.get(fresh) };
}
function segmentsFor(rig) {
  const frames = bonesToFrames(rig.bones);
  const H = rig.metrics.bodyHeight;
  const out = [];
  for (const p of rig.parts) {
    const f = frames.get(p.bone);
    if (!f || p.hidden) continue;
    const [bx, by] = tipOf(f);
    out.push({ label: p.label, ax: f.x, ay: f.y, bx, by, bias: (p.reach ?? 0) * H });
  }
  return out;
}
function assignPixels(rig, image) {
  return geodesicAssign(image, segmentsFor(rig), { edgeWeight: 8 });
}
function nextLabel(parts) {
  const used = new Set(parts.map((p) => p.label));
  for (let l = 1; l < 255; l++) if (!used.has(l)) return l;
  throw new Error("A rig can have at most 254 parts.");
}
var num = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
var str = (v, d) => typeof v === "string" ? v : d;
function parseRig(input) {
  if (!input || typeof input !== "object") throw new Error("Not a rig file.");
  const o = input;
  if (o.format !== RIG_FORMAT) throw new Error('Not a rig file (format is not "fusa-rig").');
  if (num(o.version, 0) > RIG_VERSION) throw new Error(`This rig was saved by a newer version (format ${o.version}).`);
  const image = o.image ?? {};
  const width = Math.round(num(image.width, 0));
  const height = Math.round(num(image.height, 0));
  if (width <= 0 || height <= 0) throw new Error("The rig has no image size.");
  const bones = (Array.isArray(o.bones) ? o.bones : []).map((b2, i) => ({
    id: str(b2.id, `bone${i}`),
    name: str(b2.name, `Bone ${i + 1}`),
    parent: typeof b2.parent === "string" ? b2.parent : null,
    role: typeof b2.role === "string" && b2.role ? b2.role : void 0,
    x: num(b2.x, 0),
    y: num(b2.y, 0),
    rotation: num(b2.rotation, 0),
    scaleX: num(b2.scaleX, 1),
    scaleY: num(b2.scaleY, 1),
    length: Math.max(0, num(b2.length, 0)),
    inheritRotation: b2.inheritRotation === false ? false : void 0,
    color: typeof b2.color === "string" ? b2.color : void 0
  }));
  if (!bones.length) throw new Error("The rig has no bones.");
  const parts = (Array.isArray(o.parts) ? o.parts : []).map((p, i) => ({
    id: str(p.id, `part${i}`),
    name: str(p.name, `Part ${i + 1}`),
    bone: str(p.bone, ""),
    label: Math.round(num(p.label, i + 1)),
    deform: p.deform === "rigid" ? "rigid" : "mesh",
    softness: Math.max(0, num(p.softness, 0.03)),
    stiffness: Math.min(1, Math.max(0, num(p.stiffness, 0))),
    cell: Math.max(0, Math.round(num(p.cell, 0))),
    fill: p.fill !== false,
    reach: typeof p.reach === "number" ? p.reach : void 0,
    hidden: p.hidden === true ? true : void 0
  }));
  const render = o.render ?? {};
  const metrics = o.metrics ?? {};
  const b = metrics.bounds ?? {};
  const rig = {
    format: RIG_FORMAT,
    version: RIG_VERSION,
    id: str(o.id, newId("rig")),
    name: str(o.name, "Unnamed rig"),
    template: ["humanoid", "quadruped", "winged", "serpentine", "custom"].includes(o.template) ? o.template : "custom",
    facing: o.facing === "left" ? "left" : "right",
    image: { src: str(image.src, ""), width, height },
    metrics: {
      bodyHeight: Math.max(1, num(metrics.bodyHeight, height)),
      bounds: { x: num(b.x, 0), y: num(b.y, 0), width: num(b.width, width), height: num(b.height, height) }
    },
    bones,
    parts,
    ownership: typeof o.ownership === "string" ? o.ownership : null,
    render: {
      mode: render.mode === "smooth" ? "smooth" : "pixel",
      padding: Math.min(2, Math.max(0, num(render.padding, 0.35))),
      snap: render.snap !== false,
      idleFps: Math.max(0, Math.min(60, num(render.idleFps, 12))),
      resolution: Math.min(4, Math.max(0.25, num(render.resolution, 1)))
    },
    created: num(o.created, Date.now()),
    updated: num(o.updated, Date.now()),
    revision: Math.max(1, Math.round(num(o.revision, 1)))
  };
  if (typeof o.fillHints === "string") rig.fillHints = o.fillHints;
  if (o.roleScale && typeof o.roleScale === "object") rig.roleScale = o.roleScale;
  if (rig.ownership) rigLabels(rig);
  if (rig.fillHints) rigHints(rig);
  return rig;
}
function cloneRig(rig) {
  return JSON.parse(JSON.stringify(rig));
}

// src/core/skin.ts
var MAX_INFLUENCES = 4;
function autoCell(bodyHeight) {
  return Math.max(2, Math.min(32, Math.round(bodyHeight / 12)));
}
function spannedBones(sk, b, withParts) {
  const out = [b];
  const stack = [...sk.children[b]];
  while (stack.length) {
    const c = stack.pop();
    if (withParts.has(c)) continue;
    out.push(c);
    stack.push(...sk.children[c]);
  }
  return out;
}
function segmentDistance(px, py, m, length) {
  const ax = m.tx;
  const ay = m.ty;
  const [bx, by] = m.apply(length, 0);
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
  return Math.hypot(ax + dx * t - px, ay + dy * t - py);
}
function vertexWeights(sk, part, b, span, vx, vy, bodyHeight) {
  let list;
  if (span.length === 1) list = [[b, 1]];
  else {
    const raw = span.map((j) => [j, 1 / Math.pow(segmentDistance(vx, vy, sk.setupWorld[j], sk.bones[j].length) + 1, 4)]);
    const total = raw.reduce((s, [, w]) => s + w, 0);
    list = raw.map(([j, w]) => [j, w / total]);
  }
  const p = sk.parent[b];
  const band = Math.max(1, part.softness * bodyHeight);
  if (p >= 0 && part.softness > 0) {
    const m = sk.setupWorld[b];
    const len = Math.hypot(m.a, m.b) || 1;
    const ux = m.a / len;
    const uy = m.b / len;
    const s = (vx - m.tx) * ux + (vy - m.ty) * uy;
    const r = Math.hypot(vx - m.tx, vy - m.ty);
    const axial = smoothstep(0.5 - s / (2 * band));
    const radial = 1 - smoothstep((r - band) / band);
    const wp = axial * radial;
    if (wp > 1e-4) {
      list = list.map(([j, w]) => [j, w * (1 - wp)]);
      list.push([p, wp]);
    }
  }
  list.sort((a, b2) => b2[1] - a[1]);
  list = list.slice(0, MAX_INFLUENCES).filter(([, w]) => w > 1e-4);
  const sum = list.reduce((s, [, w]) => s + w, 0) || 1;
  return list.map(([j, w]) => [j, w / sum]);
}
function buildPartGeometry(part, rect, coverage, sk, opts) {
  const b = sk.index.get(part.bone);
  if (b === void 0) throw new Error(`Part "${part.name}" follows a missing bone.`);
  const xs = [];
  const ys = [];
  if (part.deform === "rigid") {
    xs.push(0, rect.w);
    ys.push(0, rect.h);
  } else {
    const cell = part.cell > 0 ? Math.round(part.cell) : autoCell(opts.bodyHeight);
    for (let x = 0; x < rect.w; x += cell) xs.push(x);
    xs.push(rect.w);
    for (let y = 0; y < rect.h; y += cell) ys.push(y);
    ys.push(rect.h);
  }
  const keep = [];
  for (let cy = 0; cy < ys.length - 1; cy++) {
    for (let cx = 0; cx < xs.length - 1; cx++) {
      let any = false;
      for (let y = ys[cy]; y < ys[cy + 1] && !any; y++) {
        for (let x = xs[cx]; x < xs[cx + 1]; x++) {
          if (coverage[y * rect.w + x]) {
            any = true;
            break;
          }
        }
      }
      if (any) keep.push([cx, cy]);
    }
  }
  const vertexOf = /* @__PURE__ */ new Map();
  const pos = [];
  const indices = [];
  const vid = (gx, gy) => {
    const key = gy * xs.length + gx;
    let v = vertexOf.get(key);
    if (v === void 0) {
      v = pos.length / 2;
      vertexOf.set(key, v);
      pos.push(xs[gx], ys[gy]);
    }
    return v;
  };
  for (const [cx, cy] of keep) {
    const a = vid(cx, cy);
    const bb = vid(cx + 1, cy);
    const c = vid(cx + 1, cy + 1);
    const d = vid(cx, cy + 1);
    indices.push(a, bb, c, a, c, d);
  }
  const n = pos.length / 2;
  if (n > 65535) throw new Error(`Part "${part.name}" has too many vertices; use a larger grid cell.`);
  const rest = new Float32Array(n * 2);
  const uvs = new Float32Array(n * 2);
  const bones = new Int16Array(n * MAX_INFLUENCES).fill(-1);
  const weights = new Float32Array(n * MAX_INFLUENCES);
  const span = part.deform === "mesh" ? spannedBones(sk, b, opts.bonesWithParts) : [b];
  for (let v = 0; v < n; v++) {
    const lx = pos[v * 2];
    const ly = pos[v * 2 + 1];
    const sx = rect.srcX + lx;
    const sy = rect.srcY + ly;
    rest[v * 2] = sx;
    rest[v * 2 + 1] = sy;
    uvs[v * 2] = (rect.x + lx) / opts.atlasWidth;
    uvs[v * 2 + 1] = (rect.y + ly) / opts.atlasHeight;
    const ws = part.deform === "mesh" ? vertexWeights(sk, part, b, span, sx, sy, opts.bodyHeight) : [[b, 1]];
    ws.forEach(([j, w], k3) => {
      bones[v * MAX_INFLUENCES + k3] = j;
      weights[v * MAX_INFLUENCES + k3] = w;
    });
  }
  return { part, boneIndex: b, rest, out: new Float32Array(n * 2), uvs, indices: Uint16Array.from(indices), bones, weights };
}
function snapSkins(src, out) {
  for (let i = 0; i < src.length; i++) {
    const m = (out[i] ??= new Affine()).copyFrom(src[i]);
    if (m.isTranslationOnly(1e-4)) {
      m.a = 1;
      m.b = 0;
      m.c = 0;
      m.d = 1;
      m.tx = Math.round(m.tx);
      m.ty = Math.round(m.ty);
    }
  }
  return out;
}
function deformPart(g, skins, offsetX = 0, offsetY = 0) {
  const { rest, out, bones, weights } = g;
  const n = rest.length / 2;
  const own = skins[g.boneIndex];
  const k3 = g.part.deform === "mesh" ? Math.max(0, Math.min(1, g.part.stiffness)) : 1;
  for (let v = 0; v < n; v++) {
    const x = rest[v * 2];
    const y = rest[v * 2 + 1];
    let ox = 0;
    let oy = 0;
    if (k3 < 1) {
      for (let i = 0; i < MAX_INFLUENCES; i++) {
        const j = bones[v * MAX_INFLUENCES + i];
        if (j < 0) break;
        const w = weights[v * MAX_INFLUENCES + i];
        const m = skins[j];
        ox += (m.a * x + m.c * y + m.tx) * w;
        oy += (m.b * x + m.d * y + m.ty) * w;
      }
    }
    if (k3 > 0) {
      const rx = own.a * x + own.c * y + own.tx;
      const ry = own.b * x + own.d * y + own.ty;
      ox = ox * (1 - k3) + rx * k3;
      oy = oy * (1 - k3) + ry * k3;
    }
    out[v * 2] = ox + offsetX;
    out[v * 2 + 1] = oy + offsetY;
  }
}

// src/sprite/atlas.ts
var GUTTER = 2;
function buildAtlas(img, labels, fills, partLabels, maxSize = 8192) {
  const { width: w, data } = img;
  const bounds = /* @__PURE__ */ new Map();
  const grow = (l, i) => {
    const x2 = i % w;
    const y2 = (i - x2) / w;
    const b = bounds.get(l);
    if (!b) bounds.set(l, { x0: x2, y0: y2, x1: x2, y1: y2 });
    else {
      if (x2 < b.x0) b.x0 = x2;
      if (x2 > b.x1) b.x1 = x2;
      if (y2 < b.y0) b.y0 = y2;
      if (y2 > b.y1) b.y1 = y2;
    }
  };
  const wanted = new Set(partLabels);
  for (let i = 0; i < labels.length; i++) if (labels[i] && wanted.has(labels[i])) grow(labels[i], i);
  for (const [l, f] of fills) if (wanted.has(l)) for (const i of f.indices) grow(l, i);
  const items = [...bounds.entries()].map(([label, b]) => ({ label, b, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 }));
  items.sort((a, b) => b.h - a.h || b.w - a.w);
  const area = items.reduce((s, it) => s + (it.w + GUTTER) * (it.h + GUTTER), 0);
  const widest = items.reduce((m, it) => Math.max(m, it.w + GUTTER * 2), 0);
  const atlasW = Math.min(maxSize, Math.max(widest, Math.ceil(Math.sqrt(area) * 1.15) + GUTTER));
  const rects = /* @__PURE__ */ new Map();
  let x = GUTTER;
  let y = GUTTER;
  let shelf = 0;
  for (const it of items) {
    if (x + it.w + GUTTER > atlasW) {
      x = GUTTER;
      y += shelf + GUTTER;
      shelf = 0;
    }
    rects.set(it.label, { x, y, w: it.w, h: it.h, srcX: it.b.x0, srcY: it.b.y0 });
    x += it.w + GUTTER;
    shelf = Math.max(shelf, it.h);
  }
  const atlasH = Math.max(1, y + shelf + GUTTER);
  if (atlasH > maxSize) throw new Error(`The parts do not fit in a ${maxSize}px texture. Use a smaller sprite.`);
  const out = new Uint8ClampedArray(atlasW * atlasH * 4);
  const coverage = /* @__PURE__ */ new Map();
  for (const [l, r] of rects) coverage.set(l, new Uint8Array(r.w * r.h));
  const put = (l, i, rgba, o) => {
    const r = rects.get(l);
    const sx = i % w;
    const sy = (i - sx) / w;
    const lx = sx - r.srcX;
    const ly = sy - r.srcY;
    const d = ((r.y + ly) * atlasW + (r.x + lx)) * 4;
    out[d] = rgba[o];
    out[d + 1] = rgba[o + 1];
    out[d + 2] = rgba[o + 2];
    out[d + 3] = rgba[o + 3];
    coverage.get(l)[ly * r.w + lx] = 1;
  };
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i];
    if (l && rects.has(l)) put(l, i, data, i * 4);
  }
  for (const [l, f] of fills) {
    if (!rects.has(l)) continue;
    for (let k3 = 0; k3 < f.indices.length; k3++) put(l, f.indices[k3], f.rgba, k3 * 4);
  }
  return { width: atlasW, height: atlasH, data: out, rects, coverage };
}

// src/sprite/fill.ts
function convexHull(points) {
  if (points.length < 3) return points.slice();
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}
function insideHull(hull, x, y) {
  if (hull.length < 3) return false;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < -1e-9) return false;
  }
  return true;
}
function computeFills(img, labels, order, opts) {
  const { width: w, height: h2, data } = img;
  const out = /* @__PURE__ */ new Map();
  const rank = /* @__PURE__ */ new Map();
  order.forEach((l, i) => rank.set(l, i));
  const pixels = /* @__PURE__ */ new Map();
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i];
    if (!l) continue;
    let list = pixels.get(l);
    if (!list) pixels.set(l, list = []);
    list.push(i);
  }
  const reach = Math.max(1, Math.round(opts.radius));
  const dist = new Int32Array(w * h2);
  const src = new Int32Array(w * h2);
  for (const label of order) {
    if (opts.enabled && !opts.enabled.has(label)) continue;
    const own = pixels.get(label);
    if (!own || !own.length) continue;
    const myRank = rank.get(label);
    const rows = /* @__PURE__ */ new Map();
    for (const i of own) {
      const x = i % w;
      const y = (i - x) / w;
      const r = rows.get(y);
      if (!r) rows.set(y, [x, x]);
      else {
        if (x < r[0]) r[0] = x;
        if (x > r[1]) r[1] = x;
      }
    }
    const corners = [];
    for (const [y, [x0, x1]] of rows) corners.push([x0, y], [x1 + 1, y], [x0, y + 1], [x1 + 1, y + 1]);
    const hull = convexHull(corners);
    const hints = opts.hints;
    const hinted = (j) => !!hints && hints[j] === label;
    const covered = (j) => {
      const l = labels[j];
      if (!l || l === label) return false;
      const r = rank.get(l);
      if (r === void 0 || r <= myRank) return false;
      return data[j * 4 + 3] === 255;
    };
    const eligible = (j, step) => {
      if (!covered(j)) return false;
      if (hinted(j)) return true;
      if (step > reach) return false;
      const x = j % w;
      return insideHull(hull, x + 0.5, (j - x) / w + 0.5);
    };
    dist.fill(-1);
    let queue = [];
    for (const i of own) {
      dist[i] = 0;
      src[i] = i;
      queue.push(i);
    }
    const filled = [];
    const maxSteps = hints ? w + h2 : reach;
    for (let step = 1; step <= maxSteps && queue.length; step++) {
      const next = [];
      for (const i of queue) {
        const x = i % w;
        const y = (i - x) / w;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h2) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            const j = ny * w + nx;
            if (dist[j] !== -1 || !eligible(j, step)) continue;
            dist[j] = step;
            src[j] = src[i];
            next.push(j);
            filled.push(j);
          }
        }
      }
      queue = next;
    }
    if (!filled.length) continue;
    filled.sort((a, b) => a - b);
    const indices = Int32Array.from(filled);
    const rgba = new Uint8Array(indices.length * 4);
    for (let k3 = 0; k3 < indices.length; k3++) {
      const s = src[indices[k3]] * 4;
      rgba[k3 * 4] = data[s];
      rgba[k3 * 4 + 1] = data[s + 1];
      rgba[k3 * 4 + 2] = data[s + 2];
      rgba[k3 * 4 + 3] = data[s + 3];
    }
    out.set(label, { indices, rgba });
  }
  return out;
}

// src/rig/build.ts
function paddingPx(rig) {
  return Math.round(rig.render.padding * Math.max(rig.image.width, rig.image.height));
}
function buildRig(rig, image, labels = rigLabels(rig)) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (image.width !== rig.image.width || image.height !== rig.image.height) {
    throw new Error(`The image is ${image.width}\xD7${image.height} but the rig was made for ${rig.image.width}\xD7${rig.image.height}.`);
  }
  const skeleton = new Skeleton(rig.bones);
  const parts = rig.parts.filter((p) => !p.hidden && skeleton.index.has(p.bone));
  const order = parts.map((p) => p.label);
  const fills = computeFills(image, labels, order, {
    radius: Math.max(2, rig.metrics.bodyHeight * 0.15),
    enabled: new Set(parts.filter((p) => p.fill).map((p) => p.label)),
    hints: rigHints(rig)
  });
  const atlas = buildAtlas(image, labels, fills, order);
  const bonesWithParts = new Set(parts.map((p) => skeleton.index.get(p.bone)));
  const geometries = [];
  for (const p of parts) {
    const rect = atlas.rects.get(p.label);
    const coverage = atlas.coverage.get(p.label);
    if (!rect || !coverage) continue;
    geometries.push(buildPartGeometry(p, rect, coverage, skeleton, { bodyHeight: rig.metrics.bodyHeight, atlasWidth: atlas.width, atlasHeight: atlas.height, bonesWithParts }));
  }
  const pad = paddingPx(rig);
  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  return { rig, labels, fills, atlas, geometries, pad, outWidth: rig.image.width + pad * 2, outHeight: rig.image.height + pad * 2, ms: t1 - t0 };
}

// src/core/easing.ts
var c1 = 1.70158;
var c2 = c1 * 1.525;
var c3 = c1 + 1;
var EASINGS = {
  linear: (t) => t,
  step: (t) => t >= 1 ? 1 : 0,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inExpo: (t) => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  outExpo: (t) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inBack: (t) => c3 * t * t * t - c1 * t * t,
  outBack: (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  inOutBack: (t) => t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2,
  outElastic: (t) => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2
};
var EASE_NAMES = Object.keys(EASINGS);
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}
var bezierCache = /* @__PURE__ */ new Map();
function easeFn(e) {
  if (!e) return EASINGS.linear;
  if (typeof e === "string") return EASINGS[e] ?? EASINGS.linear;
  const key = e.join(",");
  let fn = bezierCache.get(key);
  if (!fn) {
    fn = bezier(e[0], e[1], e[2], e[3]);
    bezierCache.set(key, fn);
  }
  return fn;
}

// src/core/clip.ts
var STRIDE = 5;
function segmentIndex(keys, t) {
  let lo = 0;
  let hi = keys.length - 1;
  while (lo < hi) {
    const mid = lo + hi + 1 >> 1;
    if (keys[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
function sampleKeys(keys, t, fallback = 0) {
  if (!keys || keys.length === 0) return fallback;
  const first = keys[0];
  if (keys.length === 1 || t <= first.t) return first.v;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.v;
  const i = segmentIndex(keys, t);
  const a = keys[i];
  const b = keys[i + 1];
  const span = b.t - a.t;
  const k3 = span > 0 ? easeFn(a.e)((t - a.t) / span) : 1;
  return a.v + (b.v - a.v) * k3;
}
function sampleKeys2(keys, t, fx = 0, fy = 0) {
  if (!keys || keys.length === 0) return [fx, fy];
  const first = keys[0];
  if (keys.length === 1 || t <= first.t) return [first.x, first.y];
  const last = keys[keys.length - 1];
  if (t >= last.t) return [last.x, last.y];
  const i = segmentIndex(keys, t);
  const a = keys[i];
  const b = keys[i + 1];
  const span = b.t - a.t;
  const k3 = span > 0 ? easeFn(a.e)((t - a.t) / span) : 1;
  return [a.x + (b.x - a.x) * k3, a.y + (b.y - a.y) * k3];
}
var TimeWarp = class {
  segs = [];
  duration;
  constructor(clip, timing = {}, actionJitter = 1) {
    const ph = clip.phases ?? {};
    const ranges = [];
    const add = (r, m) => {
      if (!r) return;
      const lo = Math.max(0, Math.min(r[0], r[1]));
      const hi = Math.min(clip.duration, Math.max(r[0], r[1]));
      if (hi > lo) ranges.push({ r: [lo, hi], m: Math.max(0.05, m ?? 1) });
    };
    add(ph.anticipation, timing.anticipation);
    add(ph.action, (timing.action ?? 1) * actionJitter);
    add(ph.recovery, timing.recovery);
    const cuts = /* @__PURE__ */ new Set([0, clip.duration]);
    for (const { r } of ranges) {
      cuts.add(r[0]);
      cuts.add(r[1]);
    }
    const points = [...cuts].sort((a, b) => a - b);
    let p = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const c0 = points[i];
      const c12 = points[i + 1];
      const mid = (c0 + c12) / 2;
      const m = ranges.find(({ r }) => mid > r[0] && mid < r[1])?.m ?? 1;
      const len = (c12 - c0) * m;
      this.segs.push({ c0, c1: c12, p0: p, p1: p + len });
      p += len;
    }
    this.duration = p;
  }
  toClip(p) {
    if (!this.segs.length) return 0;
    if (p <= 0) return 0;
    for (const s of this.segs) {
      if (p <= s.p1) return s.p1 > s.p0 ? s.c0 + (p - s.p0) / (s.p1 - s.p0) * (s.c1 - s.c0) : s.c1;
    }
    return this.segs[this.segs.length - 1].c1;
  }
  toPlay(c) {
    if (!this.segs.length || c <= 0) return 0;
    for (const s of this.segs) {
      if (c <= s.c1) return s.c1 > s.c0 ? s.p0 + (c - s.c0) / (s.c1 - s.c0) * (s.p1 - s.p0) : s.p1;
    }
    return this.duration;
  }
};
function evaluateClip(clip, t, ctx, out, mask, angles) {
  const sk = ctx.skeleton;
  const n = sk.size;
  out.fill(0);
  mask.fill(0);
  const H = ctx.bodyHeight;
  const sign = ctx.mirror ? -1 : 1;
  const mirrorAngle = (a) => ctx.mirror ? 180 - a : a;
  for (let i = 0; i < n; i++) {
    const bone2 = sk.bones[i];
    const role = bone2.role;
    const track = role ? clip.tracks[role] : void 0;
    const s = sk.setup[i];
    const o = i * STRIDE;
    const p = sk.parent[i];
    const inherits = p >= 0 && bone2.inheritRotation !== false;
    const parentAngle = inherits ? angles[p] : 0;
    if (track && sk.roles.get(role) === i) {
      const k3 = ctx.intensity * (ctx.amp ? ctx.amp(role) : 1);
      mask[i] = 1;
      if (track.translate) {
        const [x, y] = sampleKeys2(track.translate, t);
        out[o + 1] = x * H * k3 * sign;
        out[o + 2] = y * H * k3;
      }
      if (track.scale) {
        const [x, y] = sampleKeys2(track.scale, t, 1, 1);
        out[o + 3] = (x - 1) * k3;
        out[o + 4] = (y - 1) * k3;
      }
      if (track.rotate && track.rotate.length) {
        if (track.space === "world") {
          const parentSetup = inherits ? sk.setupAngle[p] : 0;
          const first = mirrorAngle(track.rotate[0].v) - parentSetup - s.rot;
          const turns = wrapDeg(first) - first;
          const d = mirrorAngle(sampleKeys(track.rotate, t)) - parentAngle - s.rot + turns;
          out[o] = d * k3;
        } else {
          out[o] = sampleKeys(track.rotate, t) * k3 * sign;
        }
      }
    }
    angles[i] = parentAngle + s.rot + out[o];
  }
}

// src/core/player.ts
function nearestTurn(a, ref) {
  return a - 360 * Math.round((a - ref) / 360);
}
var AnimationPlayer = class {
  skeleton;
  tracks = [];
  result;
  resultMask;
  angles;
  opts;
  playCount = 0;
  constructor(skeleton, opts) {
    this.skeleton = skeleton;
    this.opts = opts;
    this.result = new Float64Array(skeleton.size * STRIDE);
    this.resultMask = new Uint8Array(skeleton.size);
    this.angles = new Float64Array(skeleton.size);
  }
  setOptions(opts) {
    this.opts = { ...this.opts, ...opts };
  }
  play(clip, o = {}) {
    const track = o.track ?? (clip.loop ? 0 : 1);
    const prev = this.tracks[track] ?? null;
    const variation = o.variation ?? 0;
    const seed = o.seed ?? hashString(clip.id) + this.playCount++;
    const rand = rng(seed);
    const amp = /* @__PURE__ */ new Map();
    const roleScale = this.opts.roleScale ?? {};
    for (const role of Object.keys(clip.tracks)) {
      const jitter = variation > 0 ? 1 + (rand() * 2 - 1) * 0.12 * variation : 1;
      amp.set(role, (roleScale[role] ?? 1) * jitter);
    }
    const actionJitter = variation > 0 ? 1 + (rand() * 2 - 1) * 0.1 * variation : 1;
    const n = this.skeleton.size;
    const state = {
      clip,
      warp: new TimeWarp(clip, o.timing, actionJitter),
      time: 0,
      loop: o.loop ?? clip.loop,
      speed: o.speed ?? 1,
      intensity: o.intensity ?? 1,
      amp,
      mixIn: o.mixIn ?? clip.defaults?.mixIn ?? (track === 0 ? 0.25 : 0.08),
      mixOut: o.mixOut ?? clip.defaults?.mixOut ?? 0.2,
      startWeight: 0,
      snapshot: null,
      elapsed: 0,
      ended: false,
      endElapsed: 0,
      weight: 0,
      delta: new Float64Array(n * STRIDE),
      mask: new Uint8Array(n),
      onEvent: o.onEvent,
      onComplete: o.onComplete
    };
    if (prev) {
      state.snapshot = { delta: prev.delta.slice(), mask: prev.mask.slice() };
      state.startWeight = prev.weight;
    } else if (track === 0 && !this.tracks.some(Boolean)) {
      state.startWeight = 1;
      state.mixIn = 0;
    }
    this.tracks[track] = state;
  }
  /** Fade a track out. */
  stop(track, mixOut) {
    const s = this.tracks[track];
    if (!s) return;
    if (mixOut !== void 0) s.mixOut = mixOut;
    if (s.mixOut <= 0) {
      this.tracks[track] = null;
      return;
    }
    s.ended = true;
    s.endElapsed = 0;
  }
  clear() {
    this.tracks.length = 0;
  }
  /** True while any action (track > 0) is playing. */
  get busy() {
    return this.tracks.some((t, i) => i > 0 && !!t);
  }
  trackInfo(track) {
    const s = this.tracks[track];
    if (!s) return null;
    return { clip: s.clip, time: s.time, duration: s.warp.duration, clipTime: s.warp.toClip(s.time) };
  }
  /** Jump a track to a play time (Studio scrubbing). Events are not fired. */
  seek(track, time) {
    const s = this.tracks[track];
    if (!s) return;
    s.time = Math.max(0, Math.min(time, s.warp.duration));
    s.elapsed = Math.max(s.elapsed, s.mixIn);
    s.ended = false;
  }
  /** Advance time, fire events, and write the blended pose into the skeleton. */
  update(dt) {
    for (let i = 0; i < this.tracks.length; i++) {
      const s = this.tracks[i];
      if (!s) continue;
      this.advance(s, i, Math.max(0, dt));
    }
    this.apply();
  }
  advance(s, index2, dt) {
    s.elapsed += dt;
    if (s.ended) {
      s.endElapsed += dt;
      if (s.endElapsed >= s.mixOut) this.tracks[index2] = null;
      return;
    }
    const dur = s.warp.duration;
    const before = s.warp.toClip(s.time);
    let next = s.time + dt * s.speed;
    if (s.loop && dur > 0) {
      if (next >= dur) {
        this.fire(s, before, s.clip.duration + 1e-9);
        next %= dur;
        this.fire(s, -1e-9, s.warp.toClip(next));
      } else this.fire(s, before, s.warp.toClip(next));
      s.time = next;
      return;
    }
    if (next >= dur) {
      s.time = dur;
      this.fire(s, before, s.clip.duration + 1e-9);
      s.onComplete?.(s.clip);
      if (index2 > 0) {
        s.ended = true;
        s.endElapsed = 0;
      }
      return;
    }
    this.fire(s, before, s.warp.toClip(next));
    s.time = next;
  }
  /** Fire events with time in (from, to]. */
  fire(s, from, to) {
    const evs = s.clip.events;
    if (!evs || !s.onEvent) return;
    for (const e of evs) if (e.t > from && e.t <= to) s.onEvent(e.name, s.clip);
  }
  /** Blend all tracks into the skeleton's local pose without advancing time. */
  apply() {
    const sk = this.skeleton;
    const n = sk.size;
    const res = this.result;
    const resMask = this.resultMask;
    res.fill(0);
    resMask.fill(0);
    for (const s of this.tracks) {
      if (!s) continue;
      evaluateClip(
        s.clip,
        s.warp.toClip(s.time),
        {
          skeleton: sk,
          bodyHeight: this.opts.bodyHeight,
          mirror: this.opts.facing === "left",
          intensity: s.intensity,
          amp: (role) => s.amp.get(role) ?? 1
        },
        s.delta,
        s.mask,
        this.angles
      );
      const fadeK = s.mixIn > 0 ? smoothstep(s.elapsed / s.mixIn) : 1;
      if (s.snapshot && fadeK < 1) {
        const { delta: sd, mask: sm } = s.snapshot;
        for (let b = 0; b < n; b++) {
          if (!sm[b] && !s.mask[b]) continue;
          s.mask[b] = 1;
          for (let c = 0; c < STRIDE; c++) {
            const j = b * STRIDE + c;
            const to = c === 0 ? nearestTurn(s.delta[j], sd[j]) : s.delta[j];
            s.delta[j] = sd[j] + (to - sd[j]) * fadeK;
          }
        }
      }
      let w = s.startWeight + (1 - s.startWeight) * fadeK;
      if (s.ended) w *= 1 - smoothstep(s.mixOut > 0 ? s.endElapsed / s.mixOut : 1);
      s.weight = w;
      if (w <= 0) continue;
      for (let b = 0; b < n; b++) {
        if (!s.mask[b]) continue;
        resMask[b] = 1;
        for (let c = 0; c < STRIDE; c++) {
          const j = b * STRIDE + c;
          if (s.clip.additive) res[j] = res[j] + s.delta[j] * w;
          else {
            const to = c === 0 ? nearestTurn(s.delta[j], res[j]) : s.delta[j];
            res[j] = res[j] + (to - res[j]) * w;
          }
        }
      }
    }
    for (let b = 0; b < n; b++) {
      const setup = sk.setup[b];
      const l = sk.local[b];
      const o = b * STRIDE;
      l.rot = setup.rot + res[o];
      l.x = setup.x + res[o + 1];
      l.y = setup.y + res[o + 2];
      l.sx = setup.sx * (1 + res[o + 3]);
      l.sy = setup.sy * (1 + res[o + 4]);
    }
    sk.update();
  }
};

// src/render/pixi.ts
function pixi() {
  const p = globalThis.PIXI;
  if (!p) throw new Error("PixiJS is not loaded.");
  return p;
}
function pixiMajor() {
  return Number(String(pixi().VERSION ?? "0").split(".")[0]) || 0;
}
var RigAsset = class {
  build;
  baseTexture;
  texture;
  refs = 0;
  onFree;
  constructor(build, onFree = null) {
    const P = pixi();
    this.build = build;
    this.onFree = onFree;
    const pixel = build.rig.render.mode === "pixel";
    this.baseTexture = P.BaseTexture.fromBuffer(new Uint8Array(build.atlas.data.buffer, build.atlas.data.byteOffset, build.atlas.data.byteLength), build.atlas.width, build.atlas.height, {
      scaleMode: pixel ? P.SCALE_MODES.NEAREST : P.SCALE_MODES.LINEAR,
      mipmap: P.MIPMAP_MODES.OFF,
      alphaMode: P.ALPHA_MODES.UNPACK
    });
    this.texture = new P.Texture(this.baseTexture);
  }
  acquire() {
    this.refs++;
    return this;
  }
  release() {
    this.refs = Math.max(0, this.refs - 1);
    if (this.refs === 0) this.destroy();
  }
  get users() {
    return this.refs;
  }
  get destroyed() {
    return !this.texture.baseTexture;
  }
  destroy() {
    if (this.destroyed) return;
    this.texture.destroy(true);
    this.onFree?.();
    this.onFree = null;
  }
};
var RigView = class {
  asset;
  skeleton;
  player;
  container;
  renderTexture;
  resolution;
  meshes = [];
  skins = [];
  destroyed = false;
  /** Set when the pose changed since the last render. */
  dirty = true;
  constructor(asset, o = {}) {
    const P = pixi();
    this.asset = asset.acquire();
    const build = asset.build;
    const rig = build.rig;
    this.skeleton = new Skeleton(rig.bones);
    this.player = new AnimationPlayer(this.skeleton, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing, roleScale: rig.roleScale });
    const pixel = rig.render.mode === "pixel";
    this.resolution = pixel ? 1 : Math.max(0.25, Math.min(4, o.resolution ?? rig.render.resolution ?? 1));
    this.container = new P.Container();
    this.container.scale.set(this.resolution);
    for (const g of build.geometries) {
      deformPart(g, this.skeleton.skin, build.pad, build.pad);
      const vertices = g.out.slice();
      const mesh = new P.SimpleMesh(asset.texture, vertices, g.uvs, g.indices);
      this.meshes.push(mesh);
      this.container.addChild(mesh);
    }
    this.renderTexture = P.RenderTexture.create({
      width: Math.ceil(build.outWidth * this.resolution),
      height: Math.ceil(build.outHeight * this.resolution),
      scaleMode: pixel ? P.SCALE_MODES.NEAREST : P.SCALE_MODES.LINEAR,
      resolution: 1
    });
  }
  get build() {
    return this.asset.build;
  }
  /** Advance animation time (seconds). */
  update(dt) {
    this.player.update(dt);
    this.dirty = true;
  }
  /** Write the current skeleton pose into the part meshes. */
  syncMeshes() {
    const build = this.asset.build;
    const skins = build.rig.render.mode === "pixel" && build.rig.render.snap ? snapSkins(this.skeleton.skin, this.skins) : this.skeleton.skin;
    build.geometries.forEach((g, i) => {
      deformPart(g, skins, build.pad, build.pad);
      const mesh = this.meshes[i];
      const v = mesh.vertices;
      v.set(g.out);
      mesh.geometry.getBuffer("aVertexPosition").update();
    });
  }
  /** Render the current pose into the render texture. */
  render(renderer) {
    if (this.destroyed) return;
    this.syncMeshes();
    renderer.render(this.container, { renderTexture: this.renderTexture, clear: true });
    this.dirty = false;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const m of this.meshes) m.destroy({ children: true, texture: false, baseTexture: false });
    this.meshes.length = 0;
    this.container.destroy({ children: true });
    this.renderTexture.destroy(true);
    this.asset.release();
  }
};
function trimmedTexture(view, scale = 1) {
  const P = pixi();
  const b = view.build;
  const frame = new P.Rectangle(0, 0, view.renderTexture.width, view.renderTexture.height);
  const orig = new P.Rectangle(0, 0, b.rig.image.width * scale, b.rig.image.height * scale);
  const trim = new P.Rectangle(-b.pad * scale, -b.pad * scale, b.outWidth * scale, b.outHeight * scale);
  return new P.Texture(view.renderTexture.baseTexture, frame, orig, trim);
}
function clippedTexture(view, scale = 1) {
  const P = pixi();
  const b = view.build;
  const r = view.resolution;
  const frame = new P.Rectangle(b.pad * r, b.pad * r, b.rig.image.width * r, b.rig.image.height * r);
  const orig = new P.Rectangle(0, 0, b.rig.image.width * scale, b.rig.image.height * scale);
  return new P.Texture(view.renderTexture.baseTexture, frame, orig);
}
async function loadImageData(src) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load the image ${src}`));
    image.src = src;
  });
  const canvas2 = document.createElement("canvas");
  canvas2.width = image.naturalWidth;
  canvas2.height = image.naturalHeight;
  const ctx = canvas2.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas available.");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  return { image, data: ctx.getImageData(0, 0, canvas2.width, canvas2.height) };
}

// src/rig/validate.ts
function validateRig(rig, o = {}) {
  const issues = [];
  const err = (code, message, extra = {}) => issues.push({ level: "error", code, message, ...extra });
  const warn = (code, message, extra = {}) => issues.push({ level: "warning", code, message, ...extra });
  const info = (code, message, extra = {}) => issues.push({ level: "info", code, message, ...extra });
  try {
    orderBones(rig.bones);
  } catch (e) {
    err("hierarchy", e.message);
    return issues;
  }
  const boneIds = new Set(rig.bones.map((b) => b.id));
  const roles = /* @__PURE__ */ new Map();
  for (const b of rig.bones) if (b.role) roles.set(b.role, [...roles.get(b.role) ?? [], b.name]);
  for (const [role, names] of roles) if (names.length > 1) warn("role-duplicate", `Role "${role}" is on ${names.join(", ")}; only the first one is animated.`);
  const labels = /* @__PURE__ */ new Set();
  for (const p of rig.parts) {
    if (!boneIds.has(p.bone)) err("part-bone", `Part "${p.name}" follows a bone that no longer exists.`, { partId: p.id });
    if (p.label < 1 || p.label > 254) err("part-label", `Part "${p.name}" has an invalid label.`, { partId: p.id });
    if (labels.has(p.label)) err("part-label-dup", `Two parts share label ${p.label}.`, { partId: p.id });
    labels.add(p.label);
  }
  let map = o.labels ?? null;
  if (!map) {
    try {
      map = rig.ownership ? rigLabels(rig) : null;
    } catch (e) {
      err("ownership", e.message);
    }
  }
  if (!map) warn("ownership-missing", 'No pixels are assigned to bones yet: use "Assign pixels".');
  else {
    const counts = labelCounts(map);
    for (const p of rig.parts) if (!counts.get(p.label)) warn("part-empty", `Part "${p.name}" has no pixels.`, { partId: p.id });
    if (o.image) {
      let lost = 0;
      for (let i = 0; i < map.length; i++) {
        if (o.image.data[i * 4 + 3] > 0 && !labels.has(map[i])) lost++;
      }
      const visible = countOpaque(o.image);
      if (lost > 0) {
        const pct = lost / Math.max(1, visible) * 100;
        const text = `${lost} visible pixel${lost === 1 ? "" : "s"} (${pct < 0.1 ? "<0.1" : pct.toFixed(1)}%) belong to no part and would disappear. Paint them onto a bone.`;
        if (pct > 0.5) err("pixels-lost", text);
        else warn("pixels-lost", text);
      }
    }
  }
  if (!rig.bones.some((b) => b.parent === null && b.role === "root")) info("no-root", 'No bone has the "root" role; whole-body motion (lunges, recoil) will not play.');
  const max = Math.max(rig.image.width, rig.image.height);
  if (max > 2048) warn("large", `The sprite is ${max}px; animating many tokens this size is slow. 1024px or less is recommended.`);
  if (rig.metrics.bodyHeight < 8) warn("tiny", "The character is under 8px tall; motion will be very coarse.");
  for (const clip of o.clips ?? []) {
    const need = clip.requires ?? [];
    const missing = need.filter((r) => !roles.has(r));
    if (missing.length) info("clip-roles", `"${clip.name}" uses ${missing.join(", ")}, which this rig does not have; those parts stay still.`);
  }
  return issues;
}
var isUsable = (issues) => !issues.some((i) => i.level === "error");

// src/foundry/storage.ts
var cache = /* @__PURE__ */ new Map();
var FilePickerImpl = () => foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
function worldDir(sub) {
  return `worlds/${game.world.id}/${MODULE_ID}/${sub}`;
}
function index() {
  return setting("rigs") ?? {};
}
async function ensureDir(path) {
  const FP = FilePickerImpl();
  const parts = path.split("/");
  for (let i = 1; i <= parts.length; i++) {
    const p = parts.slice(0, i).join("/");
    try {
      await FP.createDirectory("data", p, {});
    } catch (e) {
      void e;
    }
  }
}
async function upload(dir, file) {
  const FP = FilePickerImpl();
  await ensureDir(dir);
  const res = await FP.upload("data", dir, file, {}, { notify: false });
  const path = res?.path ?? `${dir}/${file.name}`;
  if (res && res.status && res.status !== "success") throw new Error(res.message ?? "Upload failed.");
  return path;
}
function canSave() {
  return !!game.user?.isGM || !!game.user?.can?.("FILES_UPLOAD");
}
async function saveRig(rig) {
  if (!canSave()) throw new Error("Only users who may upload files (normally the GM) can save rigs.");
  const file = new File([JSON.stringify(rig)], `${rig.id}.json`, { type: "application/json" });
  const path = await upload(worldDir("rigs"), file);
  const next = { ...index(), [rig.id]: { name: rig.name, file: path, image: rig.image.src, updated: rig.updated, revision: rig.revision } };
  await game.settings.set(MODULE_ID, "rigs", next);
  cache.set(rig.id, { revision: rig.revision, rig: Promise.resolve(rig) });
}
async function loadRig(id) {
  const entry = index()[id];
  if (!entry) throw new Error("This rig is not in the world library.");
  const hit = cache.get(id);
  if (hit && hit.revision === entry.revision) return hit.rig;
  const rig = (async () => {
    const res = await fetch(`${entry.file}?r=${entry.revision}`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Could not read ${entry.file} (${res.status}).`);
    return parseRig(await res.json());
  })();
  cache.set(id, { revision: entry.revision, rig });
  rig.catch(() => cache.delete(id));
  return rig;
}
async function deleteRig(id) {
  const next = { ...index() };
  delete next[id];
  await game.settings.set(MODULE_ID, "rigs", next);
  cache.delete(id);
}
function listRigs() {
  return Object.entries(index()).map(([id, e]) => ({ id, name: e.name, image: e.image, updated: e.updated }));
}
function revisionOf(id) {
  return index()[id]?.revision ?? 0;
}
async function storeImage(name, dataUrl) {
  const [head, b64] = dataUrl.split(",", 2);
  const type = /data:([^;]+)/.exec(head ?? "")?.[1] ?? "image/png";
  const bin = atob(b64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return upload(worldDir("images"), new File([bytes], name.replace(/[^a-z0-9._-]+/gi, "_"), { type }));
}
function pickImage(current = "") {
  return new Promise((resolve) => {
    const FP = FilePickerImpl();
    let done = false;
    const fp = new FP({
      type: "image",
      current,
      callback: (path) => {
        done = true;
        resolve(path);
      }
    });
    const hook = Hooks.on("closeFilePicker", (app) => {
      if (app !== fp) return;
      Hooks.off("closeFilePicker", hook);
      setTimeout(() => !done && resolve(null), 50);
    });
    fp.render(true);
  });
}
function pickTextFile(accept) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", async () => {
      const f = input.files?.[0];
      resolve(f ? await f.text() : null);
    });
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}
function download(filename, text) {
  const save = foundry.utils?.saveDataToFile ?? globalThis.saveDataToFile;
  if (save) return save(text, "application/json", filename);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
}

// src/foundry/tokens.ts
function profileOf(token) {
  const own = token?.document?.getFlag?.(MODULE_ID, "profile");
  const actor = token?.actor?.getFlag?.(MODULE_ID, "profile");
  const p = own?.rig ? own : actor;
  return p?.rig && p.enabled !== false ? p : null;
}
var assets = /* @__PURE__ */ new Map();
async function assetFor(rigId) {
  const key = `${rigId}@${revisionOf(rigId)}`;
  let p = assets.get(key);
  if (!p) {
    p = (async () => {
      const rig = await loadRig(rigId);
      const { data } = await loadImageData(rig.image.src);
      const build = buildRig(rig, data);
      if (!isUsable(validateRig(rig, { image: data, labels: build.labels }))) throw new Error(`Rig "${rig.name}" has problems; open it in the Studio.`);
      return new RigAsset(build, () => assets.delete(key));
    })();
    assets.set(key, p);
    p.catch(() => assets.delete(key));
  }
  return p;
}
var TokenAnimator = class {
  token;
  view;
  profile;
  rigKey;
  texture = null;
  idleAcc = 0;
  destroyed = false;
  mode;
  constructor(token, asset, profile, mode) {
    this.token = token;
    this.profile = profile;
    this.rigKey = `${profile.rig}@${revisionOf(profile.rig)}`;
    this.view = new RigView(asset);
    this.mode = mode;
    this.startIdle();
  }
  startIdle() {
    const id = this.profile.idle ?? "idle-breathing";
    const clip = id ? getClip(id) : void 0;
    if (clip) this.view.player.play(clip, { track: 0, mixIn: 0, intensity: this.profile.intensity ?? 1 });
    this.view.player.update(Math.random() * 2);
  }
  /** Give the token our texture. Returns false (and leaves the token alone) when it cannot. */
  attach() {
    const mesh = this.token.mesh;
    const own = this.token.texture;
    if (!mesh || mesh.destroyed || !own?.baseTexture) return false;
    const rig = this.view.build.rig;
    const ow = own.orig?.width ?? own.width;
    const oh = own.orig?.height ?? own.height;
    if (Math.abs(ow / oh - rig.image.width / rig.image.height) > 0.02) {
      log(`token "${this.token.name}" uses an image with a different shape than rig "${rig.name}"; not animated.`);
      return false;
    }
    const scale = ow / rig.image.width;
    this.texture = this.mode === "clipped" ? clippedTexture(this.view, scale) : trimmedTexture(this.view, scale);
    this.render(true);
    mesh.texture = this.texture;
    return true;
  }
  /** Foundry can put the token's own texture back on refresh; take it again. */
  enforce() {
    const mesh = this.token.mesh;
    if (this.texture && mesh && !mesh.destroyed && mesh.texture !== this.texture) mesh.texture = this.texture;
  }
  play(clipId, o = {}) {
    const clip = getClip(clipId);
    if (!clip) return false;
    this.view.player.play(clip, {
      track: clip.loop ? 0 : 1,
      intensity: (o.intensity ?? 1) * (this.profile.intensity ?? 1),
      ...o,
      onEvent: (name, c) => {
        o.onEvent?.(name, c);
        Hooks.callAll(`${MODULE_ID}.event`, { token: this.token, clip: c.id, event: name });
      }
    });
    this.idleAcc = Infinity;
    return true;
  }
  stop() {
    this.view.player.stop(1, 0.15);
  }
  visible() {
    const t = this.token;
    return !!t && !t.destroyed && t.visible !== false && !!t.mesh && t.mesh.visible !== false && (t.mesh.worldAlpha ?? 1) > 0.01;
  }
  render(force = false) {
    if (this.destroyed) return;
    if (force || this.visible()) this.view.render(canvas.app.renderer);
  }
  update(dt) {
    if (this.destroyed) return;
    const fps = this.view.build.rig.render.idleFps;
    if (!this.view.player.busy && fps > 0) {
      this.idleAcc += dt;
      if (this.idleAcc < 1 / fps) return;
      dt = Math.min(this.idleAcc, 0.25);
      this.idleAcc = 0;
    }
    this.view.update(dt);
    this.render();
    this.enforce();
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    const mesh = this.token?.mesh;
    const own = this.token?.texture;
    if (mesh && !mesh.destroyed && mesh.texture === this.texture && own?.baseTexture) mesh.texture = own;
    this.texture?.destroy(false);
    this.texture = null;
    this.view.destroy();
  }
};
var TokenAnimators = class {
  animators = /* @__PURE__ */ new Map();
  pending = /* @__PURE__ */ new Map();
  ticking = false;
  warned = /* @__PURE__ */ new Set();
  get count() {
    return this.animators.size;
  }
  get(tokenId) {
    return this.animators.get(tokenId);
  }
  enabled() {
    return setting("animateTokens") !== false && !!canvas?.ready;
  }
  tick = () => {
    const dt = Math.min(0.1, (canvas?.app?.ticker?.deltaMS ?? 16) / 1e3);
    for (const a of this.animators.values()) {
      try {
        a.update(dt);
      } catch (e) {
        console.error(`${MODULE_ID} | animation failed on a token; it goes back to its still image`, e);
        this.dispose(a.token.id);
      }
    }
  };
  ensureTicker() {
    if (this.ticking || !canvas?.app) return;
    canvas.app.ticker.add(this.tick);
    this.ticking = true;
  }
  /** Start, refresh or stop the animator of one token. */
  async refresh(token) {
    if (!token?.id) return;
    const profile = this.enabled() ? profileOf(token) : null;
    const current = this.animators.get(token.id);
    if (!profile) return this.dispose(token.id);
    const key = `${profile.rig}@${revisionOf(profile.rig)}`;
    if (current && current.rigKey === key && current.profile.idle === profile.idle && current.profile.intensity === profile.intensity) return current.enforce();
    if (this.pending.has(token.id)) return this.pending.get(token.id);
    const max = setting("maxAnimated") ?? 40;
    if (!current && this.animators.size >= max) return;
    const job = (async () => {
      try {
        const asset = await assetFor(profile.rig);
        if (token.destroyed || !canvas?.ready) return;
        this.dispose(token.id);
        const mode = setting("textureMode") ?? "padded";
        const a = new TokenAnimator(token, asset, profile, mode);
        if (!a.attach()) {
          a.destroy();
          return;
        }
        this.animators.set(token.id, a);
        this.ensureTicker();
      } catch (e) {
        const msg = e.message;
        if (!this.warned.has(msg)) {
          this.warned.add(msg);
          if (game.user?.isGM) ui.notifications?.warn(`Sprite Animator: ${msg}`);
          console.warn(`${MODULE_ID} |`, e);
        }
      } finally {
        this.pending.delete(token.id);
      }
    })();
    this.pending.set(token.id, job);
    return job;
  }
  refreshAll() {
    for (const t of canvas?.tokens?.placeables ?? []) void this.refresh(t);
  }
  refreshActor(actor) {
    for (const t of canvas?.tokens?.placeables ?? []) if (t.actor === actor || t.actor?.id === actor?.id) void this.refresh(t);
  }
  dispose(tokenId) {
    const a = this.animators.get(tokenId);
    if (!a) return;
    this.animators.delete(tokenId);
    a.destroy();
  }
  disposeAll() {
    for (const id of [...this.animators.keys()]) this.dispose(id);
    if (this.ticking) canvas?.app?.ticker?.remove(this.tick);
    this.ticking = false;
  }
  /** Restart everything (after a setting or rig change). */
  reset() {
    this.disposeAll();
    this.refreshAll();
  }
};
var tokenAnimators = new TokenAnimators();
function registerTokenHooks() {
  Hooks.on("canvasReady", () => tokenAnimators.refreshAll());
  Hooks.on("canvasTearDown", () => tokenAnimators.disposeAll());
  Hooks.on("drawToken", (token) => setTimeout(() => void tokenAnimators.refresh(token), 0));
  Hooks.on("refreshToken", (token) => tokenAnimators.get(token.id)?.enforce());
  Hooks.on("destroyToken", (token) => tokenAnimators.dispose(token.id));
  Hooks.on("updateActor", (actor, changes) => {
    if (changes?.flags?.[MODULE_ID] !== void 0) tokenAnimators.refreshActor(actor);
  });
  Hooks.on("updateToken", (doc, changes) => {
    if (changes?.flags?.[MODULE_ID] !== void 0 || changes?.texture !== void 0) setTimeout(() => doc.object && void tokenAnimators.refresh(doc.object), 0);
  });
  Hooks.on("updateSetting", (s) => {
    if (s?.key === `${MODULE_ID}.rigs`) tokenAnimators.refreshAll();
  });
}

// src/foundry/selftest.ts
function testSprite() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 40;
  const g = c.getContext("2d");
  const rect = (x, y, w, h2, col) => (g.fillStyle = col, g.fillRect(x, y, w, h2));
  rect(10, 2, 12, 11, "#f0c4a0");
  rect(9, 13, 14, 12, "#c43434");
  rect(6, 14, 3, 10, "#a02a2a");
  rect(23, 14, 3, 10, "#c43434");
  rect(26, 4, 2, 18, "#c4cede");
  rect(10, 25, 5, 13, "#6e4a30");
  rect(17, 25, 5, 13, "#6e4a30");
  return g.getImageData(0, 0, 32, 40);
}
async function selfTest() {
  const out = [];
  const add = (name, ok, detail) => out.push({ name, ok, detail });
  const P = pixi();
  add("PixiJS 7", pixiMajor() === 7, `PIXI ${P.VERSION}`);
  const renderer = canvas?.app?.renderer;
  add("Canvas renderer", !!renderer && renderer.type === P.RENDERER_TYPE.WEBGL, renderer ? `type ${renderer.type}` : "no canvas");
  if (!renderer) return report(out);
  const img = testSprite();
  const rig = createRig({ name: "self-test", src: "self-test", image: img, template: "humanoid" });
  const build = buildRig(rig, img);
  const asset = new RigAsset(build);
  const view = new RigView(asset);
  view.render(renderer);
  const px = renderer.extract.pixels(view.renderTexture);
  let diff = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const a = (y * img.width + x) * 4;
      const b = ((y + build.pad) * build.outWidth + x + build.pad) * 4;
      if ([0, 1, 2, 3].some((c) => img.data[a + c] !== px[b + c])) diff++;
    }
  }
  add("Pixel-exact rest pose", diff === 0, `${diff} of ${img.width * img.height} pixels differ`);
  try {
    view.player.play(getClip("sword-slash"), { variation: 0 });
    for (let i = 0; i < 30; i++) {
      view.update(1 / 30);
      view.render(renderer);
    }
    add("Sword slash renders", true, "30 frames");
  } catch (e) {
    add("Sword slash renders", false, String(e));
  }
  try {
    const PSM = foundry.canvas?.primary?.PrimarySpriteMesh;
    const tex = P.Texture.fromBuffer(new Uint8Array(img.data.buffer.slice(0)), img.width, img.height);
    const mesh = PSM ? new PSM(tex) : new P.Sprite(tex);
    mesh.width = 100;
    mesh.height = 125;
    const w0 = mesh.width;
    const h0 = mesh.height;
    mesh.texture = trimmedTexture(view);
    mesh.width = w0;
    mesh.height = h0;
    mesh.getBounds();
    mesh.calculateVertices?.();
    const v = mesh.vertexData ?? [];
    const xs = [v[0], v[2], v[4], v[6]].filter((n) => typeof n === "number");
    const span = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
    const expected = w0 * build.outWidth / img.width;
    const sizeKept = Math.abs(mesh.width - w0) < 0.01 && Math.abs(mesh.height - h0) < 0.01;
    const padded = Math.abs(span - expected) < 0.5;
    add("Token keeps its size", sizeKept, `${mesh.width.toFixed(1)}\xD7${mesh.height.toFixed(1)} (was ${w0}\xD7${h0}), ${PSM ? "PrimarySpriteMesh" : "PIXI.Sprite"}`);
    add("Room for weapons past the edge", padded, padded ? 'padded texture works: use "Padded" (default)' : `drawn width ${span.toFixed(1)}, expected ${expected.toFixed(1)}: set "Token texture" to "Clipped" in the module settings`);
    mesh.destroy?.();
    tex.destroy(true);
  } catch (e) {
    add("Token texture check", false, String(e));
  }
  view.destroy();
  add("Resources released", asset.destroyed && asset.users === 0, `atlas users ${asset.users}`);
  const rigged = (canvas.tokens?.placeables ?? []).filter((t) => tokenAnimators.get(t.id));
  const attached = rigged.filter((t) => t.mesh?.texture && t.mesh.texture !== t.texture);
  add("Animated tokens on this scene", attached.length === rigged.length, `${rigged.length} animated, ${attached.length} showing their animation`);
  return report(out);
}
function report(out) {
  console.table(out);
  const bad = out.filter((r) => !r.ok);
  const msg = bad.length ? `Sprite Animator self-test: ${bad.length} problem(s): ${bad.map((b) => b.name).join(", ")}. See the console (F12).` : `Sprite Animator self-test: all ${out.length} checks passed.`;
  ui.notifications?.[bad.length ? "warn" : "info"](msg);
  globalThis[`${MODULE_ID}-selftest`] = out;
  return out;
}

// src/rig/edit.ts
var bone = (rig, id) => {
  const b = rig.bones.find((x) => x.id === id);
  if (!b) throw new Error(`No bone ${id}`);
  return b;
};
function childrenOf(rig, id) {
  return rig.bones.filter((b) => b.parent === id);
}
function descendants(rig, id) {
  const out = /* @__PURE__ */ new Set();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    for (const c of childrenOf(rig, cur)) {
      if (!out.has(c.id)) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return out;
}
function reaim(f, tx, ty, ox = f.x, oy = f.y) {
  if (Math.hypot(tx - ox, ty - oy) < 1e-6) return { x: ox, y: oy, angle: f.angle, length: 0 };
  return frameFromPoints(ox, oy, tx, ty);
}
function moveJoint(rig, id, x, y) {
  const frames = bonesToFrames(rig.bones);
  const b = bone(rig, id);
  const f = frames.get(id);
  if (isConnected(frames, b) && b.parent) {
    const pf = frames.get(b.parent);
    for (const s of childrenOf(rig, b.parent)) {
      if (s.id === id || !isConnected(frames, s)) continue;
      const sf = frames.get(s.id);
      const [stx, sty] = tipOf(sf);
      frames.set(s.id, reaim(sf, stx, sty, x, y));
    }
    frames.set(b.parent, reaim(pf, x, y));
  }
  const [tx, ty] = tipOf(f);
  frames.set(id, f.length > 0 ? reaim(f, tx, ty, x, y) : { ...f, x, y });
  applyFrames(rig.bones, frames);
}
function moveTip(rig, id, x, y) {
  const frames = bonesToFrames(rig.bones);
  const f = frames.get(id);
  for (const c of childrenOf(rig, id)) {
    if (!isConnected(frames, c)) continue;
    const cf = frames.get(c.id);
    const [ctx, cty] = tipOf(cf);
    frames.set(c.id, cf.length > 0 ? reaim(cf, ctx, cty, x, y) : { ...cf, x, y });
  }
  frames.set(id, reaim(f, x, y));
  applyFrames(rig.bones, frames);
}
function moveSubtree(rig, id, dx, dy) {
  const frames = bonesToFrames(rig.bones);
  for (const bid of [id, ...descendants(rig, id)]) {
    const f = frames.get(bid);
    frames.set(bid, { ...f, x: f.x + dx, y: f.y + dy });
  }
  applyFrames(rig.bones, frames);
}
function addBone(rig, parent, ax, ay, bx, by, o = {}) {
  const frames = bonesToFrames(rig.bones);
  const id = `bone_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const b = { id, name: o.name ?? `Bone ${rig.bones.length + 1}`, parent, role: o.role, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, length: 0, color: o.color ?? "#c9a7ff" };
  rig.bones.push(b);
  frames.set(id, frameFromPoints(ax, ay, bx, by));
  applyFrames(rig.bones, frames);
  if (o.part !== false) ensurePart(rig, id, o.deform ?? "mesh");
  return b;
}
function deleteBone(rig, id, labels) {
  const b = bone(rig, id);
  const frames = bonesToFrames(rig.bones);
  for (const c of childrenOf(rig, id)) c.parent = b.parent;
  rig.bones = rig.bones.filter((x) => x.id !== id);
  frames.delete(id);
  applyFrames(rig.bones, frames);
  const part = rig.parts.find((p) => p.bone === id);
  if (part) {
    let heir;
    for (let a = b.parent; a && !heir; a = rig.bones.find((x) => x.id === a)?.parent ?? null) heir = rig.parts.find((p) => p.bone === a);
    removePart(rig, part.id, labels, heir?.label ?? 0);
  }
}
function reparent(rig, id, parent) {
  if (parent === id || parent && descendants(rig, id).has(parent)) throw new Error("A bone cannot be placed under itself or its own children.");
  const frames = bonesToFrames(rig.bones);
  bone(rig, id).parent = parent;
  const moved = rig.bones.filter((b) => b.id === id || descendants(rig, id).has(b.id));
  const rest = rig.bones.filter((b) => !moved.includes(b));
  rig.bones = [...rest, ...moved];
  applyFrames(rig.bones, frames);
}
function updateBone(rig, id, patch) {
  const b = bone(rig, id);
  if (patch.inheritRotation !== void 0 && patch.inheritRotation !== (b.inheritRotation !== false)) {
    const frames = bonesToFrames(rig.bones);
    b.inheritRotation = patch.inheritRotation ? void 0 : false;
    applyFrames(rig.bones, frames);
  }
  if (patch.name !== void 0) b.name = patch.name.trim() || b.name;
  if (patch.role !== void 0) b.role = patch.role || void 0;
  if (patch.color !== void 0) b.color = patch.color;
}
function ensurePart(rig, boneId, deform = "mesh") {
  const existing = rig.parts.find((p2) => p2.bone === boneId);
  if (existing) return existing;
  const b = bone(rig, boneId);
  const p = defaultPart(`part_${boneId}`, b.name, boneId, nextLabel(rig.parts), deform);
  const parentIndex = rig.parts.findIndex((x) => x.bone === b.parent);
  if (parentIndex >= 0) rig.parts.splice(parentIndex + 1, 0, p);
  else rig.parts.push(p);
  return p;
}
function removePart(rig, partId, labels, heir = 0) {
  const p = rig.parts.find((x) => x.id === partId);
  if (!p) return;
  rig.parts = rig.parts.filter((x) => x.id !== partId);
  if (labels) {
    for (let i = 0; i < labels.length; i++) if (labels[i] === p.label) labels[i] = heir;
  }
}
function updatePart(rig, partId, patch) {
  const p = rig.parts.find((x) => x.id === partId);
  if (p) Object.assign(p, patch);
}
function movePart(rig, partId, to) {
  const i = rig.parts.findIndex((x) => x.id === partId);
  if (i < 0) return;
  const [p] = rig.parts.splice(i, 1);
  let j = to === "back" ? 0 : to === "front" ? rig.parts.length : i + to;
  j = Math.max(0, Math.min(rig.parts.length, j));
  rig.parts.splice(j, 0, p);
}

// src/rig/history.ts
var History = class {
  constructor(max = 100) {
    this.max = max;
  }
  stack = [];
  index = -1;
  depth = 0;
  reset(snapshot) {
    this.stack = [snapshot];
    this.index = 0;
    this.depth = 0;
  }
  get canUndo() {
    return this.index > 0 && this.depth === 0;
  }
  get canRedo() {
    return this.index < this.stack.length - 1 && this.depth === 0;
  }
  get inTransaction() {
    return this.depth > 0;
  }
  begin() {
    this.depth++;
  }
  /** End a transaction and record the result (only when the outermost one ends). */
  end(snapshot) {
    this.depth = Math.max(0, this.depth - 1);
    if (this.depth === 0) this.record(snapshot);
  }
  /** Record a committed change. Ignored inside a transaction and when nothing changed. */
  record(snapshot) {
    if (this.depth > 0) return;
    if (this.stack[this.index] === snapshot) return;
    this.stack.splice(this.index + 1);
    this.stack.push(snapshot);
    if (this.stack.length > this.max) this.stack.shift();
    this.index = this.stack.length - 1;
  }
  undo() {
    if (!this.canUndo) return null;
    return this.stack[--this.index];
  }
  redo() {
    if (!this.canRedo) return null;
    return this.stack[++this.index];
  }
};

// src/sprite/background.ts
function detectBackground(img, tolerance = 24) {
  const { width: w, height: h2, data } = img;
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h2 - 1) * w + x);
  for (let y = 1; y < h2 - 1; y++) border.push(y * w, y * w + w - 1);
  let transparent = 0;
  const counts = /* @__PURE__ */ new Map();
  for (const i of border) {
    if (data[i * 4 + 3] < 250) {
      transparent++;
      continue;
    }
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const key = r >> 4 << 8 | g >> 4 << 4 | b >> 4;
    const c = counts.get(key);
    if (c) c.n++;
    else counts.set(key, { n: 1, rgb: [r, g, b] });
  }
  if (transparent > border.length * 0.2) return null;
  let best = null;
  for (const c of counts.values()) if (!best || c.n > best.n) best = c;
  if (!best) return null;
  let near = 0;
  for (const i of border) {
    if (data[i * 4 + 3] < 250) continue;
    if (Math.max(Math.abs(data[i * 4] - best.rgb[0]), Math.abs(data[i * 4 + 1] - best.rgb[1]), Math.abs(data[i * 4 + 2] - best.rgb[2])) <= tolerance) near++;
  }
  const coverage = near / border.length;
  return coverage >= 0.8 ? { color: best.rgb, coverage } : null;
}
function removeBackground(img, bg, tolerance = 24) {
  const { width: w, height: h2, data } = img;
  const out = new Uint8ClampedArray(data);
  const near = (i) => out[i * 4 + 3] > 0 && Math.max(Math.abs(out[i * 4] - bg.color[0]), Math.abs(out[i * 4 + 1] - bg.color[1]), Math.abs(out[i * 4 + 2] - bg.color[2])) <= tolerance;
  const seen = new Uint8Array(w * h2);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h2 - 1) * w + x);
  for (let y = 0; y < h2; y++) stack.push(y * w, y * w + w - 1);
  let cleared = 0;
  while (stack.length) {
    const i = stack.pop();
    if (seen[i]) continue;
    seen[i] = 1;
    if (!near(i)) continue;
    out[i * 4 + 3] = 0;
    cleared++;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h2 - 1) stack.push(i + w);
  }
  return { image: { width: w, height: h2, data: out }, cleared };
}

// src/ui/dom.ts
function h(tag, props = null, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k3, v] of Object.entries(props)) {
      if (v === void 0 || v === null || v === false) continue;
      if (k3 === "class") el.className = String(v);
      else if (k3 === "style") el.setAttribute("style", String(v));
      else if (k3 === "dataset") Object.assign(el.dataset, v);
      else if (k3.startsWith("on") && typeof v === "function") el.addEventListener(k3.slice(2).toLowerCase(), v);
      else if (k3 === "html") el.innerHTML = String(v);
      else if (k3 in el && typeof v !== "string") el[k3] = v;
      else el.setAttribute(k3, v === true ? "" : String(v));
    }
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children) {
    if (c === null || c === void 0 || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}
function clear(el) {
  while (el.firstChild) el.firstChild.remove();
}
var PATHS = {
  bone: "M4 12 12 4M3 11a2 2 0 1 0 2 2M11 3a2 2 0 1 0 2 2",
  add: "M8 3v10M3 8h10",
  trash: "M3 4h10M6 4V2.5h4V4M4.5 4l.7 9h5.6l.7-9",
  undo: "M5 3 2 6l3 3M2 6h7a4 4 0 0 1 0 8H6",
  redo: "M11 3l3 3-3 3M14 6H7a4 4 0 0 0 0 8h3",
  play: "M5 3v10l8-5z",
  pause: "M5 3v10M11 3v10",
  stop: "M4 4h8v8H4z",
  loop: "M3 7a4 4 0 0 1 4-4h5l-2-2M13 9a4 4 0 0 1-4 4H4l2 2",
  save: "M3 3h8l2 2v8H3zM5 3v3h5V3M5 13V9h6v4",
  open: "M2 4h5l1 2h6v7H2z",
  import: "M8 2v8M5 7l3 3 3-3M3 12v2h10v-2",
  export: "M8 10V2M5 5l3-3 3 3M3 12v2h10v-2",
  image: "M2 3h12v10H2zM2 11l4-4 3 3 2-2 3 3M10.5 6.5h.01",
  fit: "M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4",
  eye: "M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  brush: "M10 2l4 4-6 6-4-4zM4 8l-2 6 6-2",
  bucket: "M3 7l5-5 5 5-5 5zM13 9s1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3",
  wand: "M2 14 10 6M9 2v2M13 6h-2M12 3l-1.5 1.5M6 3l1 1",
  reset: "M3 8a5 5 0 1 0 1.5-3.5M3 2v3h3",
  dice: "M3 3h10v10H3zM6 6h.01M10 10h.01M8 8h.01",
  user: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 14c0-3 3-4 6-4s6 1 6 4",
  up: "M8 13V3M4 7l4-4 4 4",
  down: "M8 3v10M4 9l4 4 4-4",
  warn: "M8 2 1 14h14zM8 6v4M8 12h.01"
};
function icon(name, title) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("class", "fusa-icon");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", PATHS[name] ?? PATHS.bone);
  svg.append(p);
  if (title) {
    const t = document.createElementNS("http://www.w3.org/2000/svg", "title");
    t.textContent = title;
    svg.append(t);
  }
  return svg;
}
function ibtn(name, title, onClick, extra = {}) {
  return h("button", { type: "button", title, "aria-label": title, onclick: onClick, ...extra, class: `fusa-ibtn ${extra.class ?? ""}`.trim() }, icon(name));
}
function slider(label, value, min, max, step, onInput, fmt = (v) => String(v)) {
  const out = h("output", null, fmt(value));
  const input = h("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value) });
  input.addEventListener("input", () => {
    const v = Number(input.value);
    out.textContent = fmt(v);
    onInput(v);
  });
  return h("label", { class: "fusa-slider" }, h("span", null, label), input, out);
}

// src/ui/timeline.ts
var PHASE_COLOURS = { anticipation: "rgba(90,169,255,0.28)", action: "rgba(242,196,90,0.38)", recovery: "rgba(122,208,143,0.24)" };
var Timeline = class {
  constructor(onSeek) {
    this.onSeek = onSeek;
    this.el = document.createElement("div");
    this.el.className = "fusa-timeline";
    this.canvas = document.createElement("canvas");
    this.el.append(this.canvas);
    this.canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.canvas.setPointerCapture(e.pointerId);
      this.seekAt(e);
    });
    this.canvas.addEventListener("pointermove", (e) => this.dragging && this.seekAt(e));
    this.canvas.addEventListener("pointerup", () => this.dragging = false);
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(this.el);
  }
  el;
  canvas;
  clip = null;
  warp = null;
  time = 0;
  dragging = false;
  ro;
  get duration() {
    return this.warp?.duration ?? this.clip?.duration ?? 1;
  }
  set(clip, warp, time) {
    const changed = clip !== this.clip || warp !== this.warp || Math.abs(time - this.time) > 1e-4;
    this.clip = clip;
    this.warp = warp;
    this.time = time;
    if (changed) this.draw();
  }
  seekAt(e) {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left - 12) / Math.max(1, r.width - 24)));
    this.onSeek(x * this.duration);
  }
  draw() {
    const r = this.el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(10, Math.floor(r.width));
    const H = Math.max(10, Math.floor(r.height));
    if (this.canvas.width !== W * dpr || this.canvas.height !== H * dpr) {
      this.canvas.width = W * dpr;
      this.canvas.height = H * dpr;
      this.canvas.style.width = `${W}px`;
      this.canvas.style.height = `${H}px`;
    }
    const g = this.canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const x0 = 12;
    const x1 = W - 12;
    const dur = this.duration;
    const X = (t) => x0 + t / dur * (x1 - x0);
    const toPlay = (c) => this.warp ? this.warp.toPlay(c) : c;
    g.fillStyle = "rgba(255,255,255,0.03)";
    g.fillRect(x0, 18, x1 - x0, H - 26);
    const ph = this.clip?.phases;
    if (ph) {
      for (const [name, range] of [["anticipation", ph.anticipation], ["action", ph.action], ["recovery", ph.recovery]]) {
        if (!range) continue;
        g.fillStyle = PHASE_COLOURS[name];
        const a = X(toPlay(range[0]));
        const b = X(toPlay(range[1]));
        g.fillRect(a, 18, Math.max(1, b - a), H - 26);
        if (b - a > 60) {
          g.fillStyle = "rgba(238,243,255,0.7)";
          g.font = "600 10px sans-serif";
          g.fillText(name === "anticipation" ? "WIND-UP" : name === "action" ? "STRIKE" : "RECOVERY", a + 5, H - 12);
        }
      }
      if (ph.impact !== void 0) {
        g.strokeStyle = "#ff6b6b";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(X(toPlay(ph.impact)), 18);
        g.lineTo(X(toPlay(ph.impact)), H - 8);
        g.stroke();
      }
    }
    g.strokeStyle = "rgba(159,208,255,0.35)";
    g.fillStyle = "rgba(238,243,255,0.55)";
    g.font = "10px sans-serif";
    g.lineWidth = 1;
    const step = dur > 3 ? 0.5 : 0.1;
    for (let t = 0; t <= dur + 1e-6; t += step) {
      const x = Math.round(X(t)) + 0.5;
      const major = Math.abs(t / (step * 5) - Math.round(t / (step * 5))) < 1e-6;
      g.beginPath();
      g.moveTo(x, 18);
      g.lineTo(x, major ? 8 : 13);
      g.stroke();
      if (major) g.fillText(`${t.toFixed(1)}s`, x + 3, 10);
    }
    for (const ev of this.clip?.events ?? []) {
      const x = X(toPlay(ev.t));
      g.fillStyle = ev.name === "contact" ? "#ff6b6b" : "#f2c45a";
      g.beginPath();
      g.moveTo(x, 20);
      g.lineTo(x + 4, 24);
      g.lineTo(x, 28);
      g.lineTo(x - 4, 24);
      g.closePath();
      g.fill();
    }
    const px = X(Math.min(this.time, dur));
    g.strokeStyle = "#ffffff";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(px, 4);
    g.lineTo(px, H - 4);
    g.stroke();
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(px - 5, 2);
    g.lineTo(px + 5, 2);
    g.lineTo(px, 8);
    g.closePath();
    g.fill();
  }
  destroy() {
    this.ro.disconnect();
    this.el.remove();
  }
};

// src/ui/viewport.ts
var css = (hex) => parseInt(hex.replace("#", ""), 16) || 16777215;
var Viewport = class {
  constructor(parent, events) {
    this.events = events;
    const P = pixi();
    this.el = document.createElement("div");
    this.el.className = "fusa-viewport";
    parent.append(this.el);
    const canvas2 = document.createElement("canvas");
    this.el.append(canvas2);
    this.app = new P.Application({ view: canvas2, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: window.devicePixelRatio || 1, width: 400, height: 300 });
    this.world = new P.Container();
    this.output = new P.Sprite(P.Texture.EMPTY);
    this.regions = new P.Sprite(P.Texture.EMPTY);
    this.regions.alpha = 0.45;
    this.frameGfx = new P.Graphics();
    this.overlay = new P.Graphics();
    this.world.addChild(this.output, this.regions);
    this.app.stage.addChild(this.frameGfx, this.world, this.overlay);
    this.app.ticker.add(() => {
      if (!this.destroyed) this.events.frame(this.app.ticker.deltaMS / 1e3);
    });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    canvas2.addEventListener("pointerdown", this.onDown);
    canvas2.addEventListener("pointermove", this.onMove);
    canvas2.addEventListener("pointerup", this.onUp);
    canvas2.addEventListener("pointercancel", this.onUp);
    canvas2.addEventListener("wheel", this.onWheel, { passive: false });
    canvas2.addEventListener("contextmenu", (e) => e.preventDefault());
    this.resize();
  }
  el;
  app;
  world;
  output;
  regions;
  overlay;
  frameGfx;
  regionCanvas = null;
  regionTexture = null;
  view = null;
  zoom = 4;
  panX = 0;
  panY = 0;
  pixelMode = true;
  imageSize = { width: 64, height: 64 };
  panning = null;
  ro;
  destroyed = false;
  resize() {
    const r = this.el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    this.app.renderer.resize(Math.floor(r.width), Math.floor(r.height));
    this.applyCamera();
  }
  setView(view, pixelMode) {
    this.view = view;
    this.pixelMode = pixelMode;
    if (!view) {
      this.output.texture = pixi().Texture.EMPTY;
      return;
    }
    this.imageSize = { width: view.build.rig.image.width, height: view.build.rig.image.height };
    const old = this.output.texture;
    this.output.texture = new (pixi()).Texture(view.renderTexture.baseTexture);
    if (old && old !== pixi().Texture.EMPTY) old.destroy(false);
    this.output.scale.set(1 / view.resolution);
    this.output.position.set(-view.build.pad, -view.build.pad);
    this.applyCamera();
  }
  /** Colour each part's pixels (labels → RGBA) for the region overlay. */
  setRegions(labels, width, height, colourOf, visible) {
    const P = pixi();
    this.regions.visible = visible && !!labels;
    if (!labels || !visible) return;
    if (!this.regionCanvas || this.regionCanvas.width !== width || this.regionCanvas.height !== height) {
      this.regionCanvas = document.createElement("canvas");
      this.regionCanvas.width = width;
      this.regionCanvas.height = height;
      this.regionTexture?.destroy(true);
      this.regionTexture = P.Texture.from(this.regionCanvas, { scaleMode: P.SCALE_MODES.NEAREST });
      this.regions.texture = this.regionTexture;
    }
    const ctx = this.regionCanvas.getContext("2d");
    const img = ctx.createImageData(width, height);
    const cache2 = /* @__PURE__ */ new Map();
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      if (!l) continue;
      let c = cache2.get(l);
      if (c === void 0) {
        const hex = colourOf(l);
        c = hex ? [css(hex) >> 16 & 255, css(hex) >> 8 & 255, css(hex) & 255] : null;
        cache2.set(l, c);
      }
      if (!c) continue;
      img.data[i * 4] = c[0];
      img.data[i * 4 + 1] = c[1];
      img.data[i * 4 + 2] = c[2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    this.regionTexture.baseTexture.update();
  }
  setRegionAlpha(a) {
    this.regions.alpha = a;
  }
  /** Fit the sprite (with padding) in the view. */
  fit() {
    const pad = this.view?.build.pad ?? 0;
    const w = this.imageSize.width + pad * 2;
    const h2 = this.imageSize.height + pad * 2;
    const sw = this.app.renderer.width / this.app.renderer.resolution;
    const sh = this.app.renderer.height / this.app.renderer.resolution;
    let z = Math.min(sw / w, sh / h2) * 0.92;
    if (this.pixelMode) z = z >= 1 ? Math.floor(z) : 1 / Math.ceil(1 / z);
    this.zoom = Math.max(0.1, z);
    this.panX = Math.round(sw / 2 - this.imageSize.width / 2 * this.zoom);
    this.panY = Math.round(sh / 2 - this.imageSize.height / 2 * this.zoom);
    this.applyCamera();
  }
  applyCamera() {
    this.world.position.set(Math.round(this.panX), Math.round(this.panY));
    this.world.scale.set(this.zoom);
    this.frameGfx.clear();
    const [x0, y0] = this.toScreen(0, 0);
    const [x1, y1] = this.toScreen(this.imageSize.width, this.imageSize.height);
    this.frameGfx.lineStyle(1, 10473727, 0.25).drawRect(x0 - 0.5, y0 - 0.5, x1 - x0 + 1, y1 - y0 + 1);
  }
  toImage(sx, sy) {
    return [(sx - this.panX) / this.zoom, (sy - this.panY) / this.zoom];
  }
  toScreen(ix, iy) {
    return [ix * this.zoom + this.panX, iy * this.zoom + this.panY];
  }
  /** Draw bones as tapered wedges with joint circles (screen space, constant line widths). */
  drawBones(bones, visible, brush = null) {
    const g = this.overlay;
    g.clear();
    if (brush) {
      const [bx, by] = this.toScreen(brush.x, brush.y);
      g.lineStyle(1.5, 16777215, 0.9).drawCircle(bx, by, brush.r * this.zoom);
      g.lineStyle(1, 0, 0.6).drawCircle(bx, by, brush.r * this.zoom + 1.5);
    }
    if (!visible) return;
    for (const b of bones) {
      if (!b.link) continue;
      const [lx, ly] = this.toScreen(b.link[0], b.link[1]);
      const [ax, ay] = this.toScreen(b.ax, b.ay);
      const len = Math.hypot(ax - lx, ay - ly);
      const n = Math.max(1, Math.floor(len / 6));
      g.lineStyle(1, 16777215, 0.35);
      for (let i = 0; i < n; i += 2) {
        g.moveTo(lx + (ax - lx) * i / n, ly + (ay - ly) * i / n);
        g.lineTo(lx + (ax - lx) * (i + 1) / n, ly + (ay - ly) * (i + 1) / n);
      }
    }
    const order = [...bones.filter((b) => !b.selected), ...bones.filter((b) => b.selected)];
    for (const b of order) {
      const [ax, ay] = this.toScreen(b.ax, b.ay);
      const [bx, by] = this.toScreen(b.bx, b.by);
      const len = Math.hypot(bx - ax, by - ay);
      const col = css(b.color);
      const line = b.selected ? 16777215 : b.hover ? 15909978 : 725536;
      if (len > 3) {
        const ux = (bx - ax) / len;
        const uy = (by - ay) / len;
        const w = Math.max(3, Math.min(10, len * 0.14));
        const mx = ax + ux * Math.min(len * 0.25, w * 1.6);
        const my = ay + uy * Math.min(len * 0.25, w * 1.6);
        g.lineStyle(b.selected ? 2 : 1.25, line, 0.95);
        g.beginFill(col, b.selected ? 0.85 : 0.6);
        g.drawPolygon([ax, ay, mx - uy * w, my + ux * w, bx, by, mx + uy * w, my - ux * w]);
        g.endFill();
      }
      g.lineStyle(b.selected ? 2 : 1.25, line, 1).beginFill(col, 1).drawCircle(ax, ay, b.selected ? 4.5 : 3.5).endFill();
      if (b.selected && len > 3) g.lineStyle(1.5, 16777215, 1).beginFill(725536, 1).drawCircle(bx, by, 3.5).endFill();
    }
  }
  /** Which bone handle is under an image point (screen-space tolerance). */
  pick(bones, ix, iy, selectedId) {
    const [sx, sy] = this.toScreen(ix, iy);
    const near = (x, y, r) => {
      const [px, py] = this.toScreen(x, y);
      return Math.hypot(px - sx, py - sy) <= r;
    };
    const sel = bones.find((b) => b.id === selectedId);
    if (sel && near(sel.bx, sel.by, 8)) return { kind: "tip", id: sel.id };
    for (const b of [...bones].reverse()) if (near(b.ax, b.ay, 7)) return { kind: "origin", id: b.id };
    for (const b of [...bones].reverse()) if (near(b.bx, b.by, 6)) return { kind: "tip", id: b.id };
    let best = null;
    let bestD = 7;
    for (const b of bones) {
      const [ax, ay] = this.toScreen(b.ax, b.ay);
      const [bx, by] = this.toScreen(b.bx, b.by);
      const dx = bx - ax;
      const dy = by - ay;
      const l2 = dx * dx + dy * dy;
      if (l2 < 1) continue;
      const t = Math.max(0, Math.min(1, ((sx - ax) * dx + (sy - ay) * dy) / l2));
      const d = Math.hypot(ax + dx * t - sx, ay + dy * t - sy);
      if (d < bestD) {
        bestD = d;
        best = { kind: "body", id: b.id };
      }
    }
    return best;
  }
  local(e) {
    const r = this.app.view.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  onDown = (e) => {
    const [sx, sy] = this.local(e);
    e.target.setPointerCapture?.(e.pointerId);
    if (e.button === 1 || e.button === 2 || e.button === 0 && e.altKey && e.shiftKey) {
      this.panning = { x: sx, y: sy, px: this.panX, py: this.panY };
      return;
    }
    const [ix, iy] = this.toImage(sx, sy);
    this.events.down(ix, iy, e);
  };
  onMove = (e) => {
    const [sx, sy] = this.local(e);
    if (this.panning) {
      this.panX = this.panning.px + sx - this.panning.x;
      this.panY = this.panning.py + sy - this.panning.y;
      this.applyCamera();
      return;
    }
    const [ix, iy] = this.toImage(sx, sy);
    if (e.buttons & 1) this.events.move(ix, iy, e);
    else this.events.hover(ix, iy, e);
  };
  onUp = (e) => {
    if (this.panning) {
      this.panning = null;
      return;
    }
    const [sx, sy] = this.local(e);
    const [ix, iy] = this.toImage(sx, sy);
    this.events.up(ix, iy, e);
  };
  onWheel = (e) => {
    e.preventDefault();
    const [sx, sy] = this.local(e);
    const [ix, iy] = this.toImage(sx, sy);
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    let z = this.zoom * factor;
    if (this.pixelMode) z = z >= 1 ? Math.max(1, Math.round(z)) : 1 / Math.round(1 / z);
    if (this.pixelMode && z === this.zoom) z = e.deltaY < 0 ? this.zoom >= 1 ? this.zoom + 1 : 1 / (Math.round(1 / this.zoom) - 1) : this.zoom > 1 ? this.zoom - 1 : 1 / (Math.round(1 / this.zoom) + 1);
    this.zoom = Math.max(0.1, Math.min(64, z));
    this.panX = sx - ix * this.zoom;
    this.panY = sy - iy * this.zoom;
    this.applyCamera();
  };
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.ro.disconnect();
    this.regionTexture?.destroy(true);
    this.output.texture?.destroy(false);
    this.app.destroy(true, { children: true, texture: false, baseTexture: false });
    this.el.remove();
  }
};

// src/ui/studio.ts
var MODES = [
  { id: "rig", label: "Rig", hint: 'Drag a joint to move it, a bone tip to aim and lengthen it. Shift-drag moves a bone with its children. "Add bone": drag from the joint to the tip.' },
  { id: "paint", label: "Paint", hint: "Paint pixels onto the selected bone. Right-click paints them back to its parent. Bucket: fill a whole connected region." },
  { id: "pose", label: "Pose", hint: "Drag any bone to rotate it and see the art move. Shift-drag the root to move the whole body. Nothing here is saved." },
  { id: "animate", label: "Animate", hint: "Pick an animation below. Space plays and pauses. Adjust speed, intensity and phase timing." }
];
var IDLE_IDS = ["idle-breathing", "combat-stance"];
var Studio = class {
  root;
  host;
  viewport;
  timeline;
  history = new History();
  rig = null;
  image = null;
  labels = null;
  asset = null;
  view = null;
  needsBuild = false;
  issues = [];
  savedSnapshot = "";
  mode = "rig";
  tool = "select";
  hints = null;
  /** An automatic rig waiting for the GM's verdict. */
  proposal = null;
  elBanner;
  selected = null;
  hover = null;
  drag = null;
  addPreview = null;
  brushSize = 2;
  cursor = null;
  showBones = true;
  showRegions = true;
  /** Pose mode: per bone index, rotation offset (deg) and translation (px). */
  pose = /* @__PURE__ */ new Map();
  poseDirty = true;
  clipId = "sword-slash";
  baseId = "idle-breathing";
  playing = false;
  loop = false;
  speed = 1;
  intensity = 1;
  timing = { anticipation: 1, action: 1, recovery: 1 };
  variation = 0;
  seed = 1;
  warp = null;
  actionTime = 0;
  destroyed = false;
  lastEvent = "";
  // DOM parts
  elHeader;
  elTree;
  elInspector;
  elIssues;
  elLibrary;
  elTransport;
  elStatus;
  elToolbar;
  elEmpty;
  elName;
  constructor(parent, host) {
    this.host = host;
    this.root = h("div", { class: "fusa-studio", tabindex: "0", dataset: { mode: this.mode } });
    parent.append(this.root);
    this.layout();
    this.root.addEventListener("keydown", this.onKey);
    this.renderAll();
  }
  /* ------------------------------------------------------------------ */
  /*  Layout                                                             */
  /* ------------------------------------------------------------------ */
  layout() {
    this.elName = h("input", { class: "fusa-name", type: "text", placeholder: "Untitled rig", spellcheck: false });
    this.elName.addEventListener("change", () => {
      if (!this.rig) return;
      this.rig.name = this.elName.value.trim() || this.rig.name;
      this.commit();
    });
    this.elHeader = h("header", { class: "fusa-head" });
    const left = h("aside", { class: "fusa-left" });
    const right = h("aside", { class: "fusa-right" });
    const center = h("section", { class: "fusa-center" });
    const bottom = h("section", { class: "fusa-bottom" });
    this.elTree = h("div", { class: "fusa-tree", role: "tree" });
    left.append(h("div", { class: "fusa-panel-title" }, "Skeleton"), this.toolRow(), this.elTree);
    this.elInspector = h("div", { class: "fusa-inspector" });
    this.elIssues = h("div", { class: "fusa-issues" });
    right.append(h("div", { class: "fusa-panel-title" }, "Inspector"), this.elInspector, h("div", { class: "fusa-panel-title" }, "Rig check"), this.elIssues);
    this.elToolbar = h("div", { class: "fusa-viewbar" });
    this.elStatus = h("div", { class: "fusa-status" });
    this.elEmpty = h(
      "div",
      { class: "fusa-empty" },
      h("div", { class: "fusa-empty-card" }, icon("image"), h("b", null, "Import a character sprite"), h("p", null, "PNG or WebP with a transparent background. Pixel art and illustrations both work. The file is used exactly as it is: nothing is resized, recoloured or repainted."), h("button", { type: "button", class: "fusa-btn primary", onclick: () => this.importImage() }, icon("image"), "Choose sprite"), h("button", { type: "button", class: "fusa-btn", onclick: () => this.openDialog() }, icon("open"), "Open a saved rig"))
    );
    this.elBanner = h("div", { class: "fusa-banner" });
    center.append(this.elToolbar, this.elEmpty, this.elBanner, this.elStatus);
    this.viewport = new Viewport(center, {
      down: (x, y, e) => this.onDown(x, y, e),
      move: (x, y, e) => this.onMove(x, y, e),
      up: (x, y, e) => this.onUp(x, y, e),
      hover: (x, y, e) => this.onHover(x, y, e),
      frame: (dt) => this.frame(dt)
    });
    center.insertBefore(this.viewport.el, this.elStatus);
    this.elLibrary = h("div", { class: "fusa-library" });
    this.elTransport = h("div", { class: "fusa-transport" });
    this.timeline = new Timeline((t) => this.seek(t));
    bottom.append(h("div", { class: "fusa-bottom-left" }, h("div", { class: "fusa-panel-title" }, "Animation library"), this.elLibrary), h("div", { class: "fusa-bottom-right" }, this.elTransport, this.timeline.el));
    this.root.append(this.elHeader, left, center, right, bottom);
  }
  toolRow() {
    return h(
      "div",
      { class: "fusa-toolrow" },
      ibtn("add", "Add a bone (drag in the view from joint to tip)", () => this.setTool(this.tool === "add" ? "select" : "add"), { class: "tool-add" }),
      ibtn("trash", "Delete the selected bone (Del)", () => this.deleteSelected()),
      ibtn("bone", "Auto-rig: find the joints in the sprite again (you can keep or discard the result)", () => void this.autoRig(), { class: "tool-auto" }),
      ibtn("wand", "Assign every pixel to its nearest bone (replaces painted regions)", () => this.reassign()),
      h(
        "select",
        { class: "fusa-template", title: "Start over from a template", onchange: (e) => this.resetTemplate(e.target.value) },
        h("option", { value: "" }, "Template\u2026"),
        h("option", { value: "humanoid" }, "Humanoid"),
        h("option", { value: "custom" }, "Custom (one bone)")
      )
    );
  }
  /* ------------------------------------------------------------------ */
  /*  Rendering the panels                                               */
  /* ------------------------------------------------------------------ */
  renderAll() {
    this.root.dataset.mode = this.mode;
    this.root.classList.toggle("has-rig", !!this.rig);
    this.renderHeader();
    this.renderTree();
    this.renderInspector();
    this.renderIssues();
    this.renderLibrary();
    this.renderTransport();
    this.renderToolbar();
    this.renderStatus();
    this.renderBanner();
  }
  renderBanner() {
    const e = this.elBanner;
    clear(e);
    const p = this.proposal;
    e.classList.toggle("show", !!p && !!this.rig);
    if (!p || !this.rig) return;
    const dots = (v) => "\u25CF".repeat(Math.max(1, Math.round(v * 3))) + "\u25CB".repeat(3 - Math.max(1, Math.round(v * 3)));
    const groups = Object.entries(p.report.confidence).map(([k3, v]) => h("span", { class: "conf", title: `${Math.round(v * 100)}%` }, `${k3} ${v > 0 ? dots(v) : "\u2014"}`));
    e.append(
      h("div", { class: "fusa-banner-text" }, h("b", null, p.report.method === "landmarks" ? "Automatic rig" : "Rig from proportions"), h("span", null, `Faces ${this.rig.facing}.`), ...groups, ...p.report.notes.map((n) => h("small", null, n))),
      h(
        "div",
        { class: "fusa-banner-actions" },
        h("button", { type: "button", class: "fusa-btn primary small", onclick: () => (this.proposal = null, this.renderBanner()) }, "Keep"),
        p.report.method === "landmarks" ? h("button", { type: "button", class: "fusa-btn small", onclick: () => void this.autoRig(false) }, "Use proportions instead") : null,
        p.previous ? h("button", { type: "button", class: "fusa-btn subtle small", onclick: () => this.discardProposal() }, "Discard") : null
      )
    );
  }
  /** Find the joints again (or fit by proportions) and offer the result. */
  async autoRig(detect = true) {
    if (!this.rig || !this.image) return;
    const previous = this.proposal?.previous ?? this.snapshot();
    const p = proposeRig(this.image, this.rig.template === "custom" ? "custom" : "humanoid", "auto", detect);
    Object.assign(this.rig, { bones: p.bones, parts: p.parts, ownership: p.ownership, metrics: p.metrics, facing: p.facing });
    this.labels = rigLabels(this.rig);
    this.selected = null;
    this.proposal = { report: p.report, previous };
    this.commit();
  }
  discardProposal() {
    const prev = this.proposal?.previous ?? null;
    this.proposal = null;
    if (prev) {
      this.restore(prev);
      this.history.record(prev);
    }
    this.renderBanner();
  }
  renderHeader() {
    const e = this.elHeader;
    clear(e);
    this.elName.value = this.rig?.name ?? "";
    this.elName.disabled = !this.rig;
    const dirty = !!this.rig && this.snapshot() !== this.savedSnapshot;
    e.append(
      h("div", { class: "fusa-brand" }, h("small", null, "Fabula Ultima"), h("b", null, "Sprite Animation Studio")),
      h("div", { class: "fusa-file" }, this.elName, dirty ? h("span", { class: "fusa-dirty", title: "Unsaved changes" }, "\u25CF") : null),
      h(
        "div",
        { class: "fusa-actions" },
        ibtn("image", "New rig from a sprite", () => this.importImage()),
        ibtn("open", "Open a saved rig", () => this.openDialog()),
        ibtn("save", "Save (Ctrl+S)", () => this.save(), { disabled: !this.rig }),
        h("span", { class: "sep" }),
        ibtn("import", "Import a rig file (.json)", () => this.importBundle()),
        ibtn("export", "Export this rig with its image (.json)", () => this.exportBundle(), { disabled: !this.rig }),
        this.host.assignToActor ? ibtn("user", "Use this rig for an actor", () => this.assign(), { disabled: !this.rig }) : null,
        h("span", { class: "sep" }),
        ibtn("undo", "Undo (Ctrl+Z)", () => this.undo(), { disabled: !this.history.canUndo }),
        ibtn("redo", "Redo (Ctrl+Shift+Z)", () => this.redo(), { disabled: !this.history.canRedo })
      ),
      h(
        "nav",
        { class: "fusa-modes", role: "tablist" },
        ...MODES.map((m, i) => h("button", { type: "button", role: "tab", class: m.id === this.mode ? "active" : "", "aria-selected": String(m.id === this.mode), title: `${m.label} (${i + 1})`, disabled: !this.rig, onclick: () => this.setMode(m.id) }, h("span", { class: "num" }, String(i + 1)), m.label))
      )
    );
  }
  boneOf(id) {
    return id ? this.rig?.bones.find((b) => b.id === id) : void 0;
  }
  partOf(boneId) {
    return boneId ? this.rig?.parts.find((p) => p.bone === boneId) : void 0;
  }
  renderTree() {
    const e = this.elTree;
    clear(e);
    if (!this.rig) return;
    const counts = /* @__PURE__ */ new Map();
    if (this.labels) {
      for (const v of this.labels) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const row = (b, depth) => {
      const part = this.partOf(b.id);
      const n = part ? counts.get(part.label) ?? 0 : 0;
      const el = h(
        "div",
        { class: `fusa-node ${b.id === this.selected ? "selected" : ""}`, role: "treeitem", style: `--depth:${depth}`, title: b.role ? `Role: ${b.role}` : "No role", dataset: { id: b.id }, onclick: () => this.select(b.id), ondblclick: () => this.renameInline(b) },
        h("span", { class: "swatch", style: `background:${b.color ?? "#c9a7ff"}` }),
        h("span", { class: "label" }, b.name),
        part ? h("span", { class: "px", title: `${n} pixels, ${part.deform}` }, n ? String(n) : "\u2014") : h("span", { class: "px none", title: "No pixels of its own" }, "\xB7")
      );
      e.append(el);
      for (const c of childrenOf(this.rig, b.id)) row(c, depth + 1);
    };
    for (const r of childrenOf(this.rig, null)) row(r, 0);
  }
  renameInline(b) {
    const el = [...this.elTree.querySelectorAll(".fusa-node")].find((n) => n.dataset.id === b.id);
    const label = el?.querySelector(".label");
    if (!label) return;
    const input = h("input", { class: "fusa-rename", value: b.name });
    label.replaceWith(input);
    input.focus();
    input.select();
    let finished = false;
    const done = (ok) => {
      if (finished) return;
      finished = true;
      if (ok && input.value.trim() && input.value.trim() !== b.name) {
        updateBone(this.rig, b.id, { name: input.value });
        const part = this.partOf(b.id);
        if (part) part.name = b.name;
        this.commit();
      } else this.renderTree();
    };
    input.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter") done(true);
      if (ev.key === "Escape") done(false);
    });
    input.addEventListener("blur", () => done(true));
  }
  field(label, control, hint) {
    return h("label", { class: "fusa-field", title: hint ?? "" }, h("span", null, label), control);
  }
  renderInspector() {
    const e = this.elInspector;
    clear(e);
    const rig = this.rig;
    if (!rig) {
      e.append(h("p", { class: "fusa-muted" }, "No rig yet."));
      return;
    }
    const b = this.boneOf(this.selected);
    if (!b) {
      this.renderRigSettings(e, rig);
      return;
    }
    const name = h("input", { type: "text", value: b.name });
    name.addEventListener("change", () => {
      updateBone(rig, b.id, { name: name.value });
      this.commit();
    });
    const roles = h("select", null, h("option", { value: "" }, "\u2014 none \u2014"), ...[.../* @__PURE__ */ new Set([...KNOWN_ROLES, ...b.role ? [b.role] : []])].map((r) => h("option", { value: r, selected: r === b.role }, r)));
    roles.addEventListener("change", () => {
      updateBone(rig, b.id, { role: roles.value });
      this.commit();
    });
    const below = descendants(rig, b.id);
    const parent = h("select", null, h("option", { value: "" }, "\u2014 root \u2014"), ...rig.bones.filter((x) => x.id !== b.id && !below.has(x.id)).map((x) => h("option", { value: x.id, selected: x.id === b.parent }, x.name)));
    parent.addEventListener("change", () => {
      try {
        reparent(rig, b.id, parent.value || null);
        this.commit();
      } catch (err) {
        this.host.notify(err.message, "warn");
        this.renderInspector();
      }
    });
    const colour = h("input", { type: "color", value: b.color ?? "#c9a7ff" });
    colour.addEventListener("change", () => {
      updateBone(rig, b.id, { color: colour.value });
      this.commit();
    });
    const f = bonesToFrames(rig.bones).get(b.id);
    e.append(
      h("div", { class: "fusa-insp-title" }, h("span", { class: "swatch", style: `background:${b.color}` }), "Bone"),
      this.field("Name", name),
      this.field("Role", roles, "What this bone is. Animations move bones by role, so any rig with the role plays them."),
      this.field("Parent", parent),
      this.field("Colour", colour),
      h("div", { class: "fusa-readout" }, `Joint ${f.x.toFixed(1)}, ${f.y.toFixed(1)} \xB7 angle ${wrapDeg(f.angle).toFixed(0)}\xB0 \xB7 length ${f.length.toFixed(1)}px`)
    );
    const part = this.partOf(b.id);
    e.append(h("div", { class: "fusa-insp-title" }, "Art"));
    if (!part) {
      e.append(h("p", { class: "fusa-muted" }, "This bone moves no pixels of its own."), h("button", { type: "button", class: "fusa-btn", onclick: () => (ensurePart(rig, b.id), this.commit(), this.setMode("paint")) }, icon("brush"), "Give it pixels"));
      return;
    }
    const deform = h("div", { class: "fusa-seg" }, ...["rigid", "mesh"].map((d) => h("button", { type: "button", class: part.deform === d ? "active" : "", title: d === "rigid" ? "Moves as one piece: crisp, best for heads, hands and weapons." : "Bends at its joints: smooth elbows, knees and waists.", onclick: () => (updatePart(rig, part.id, { deform: d }), this.commit()) }, d === "rigid" ? "Rigid" : "Bend")));
    e.append(this.field("Deformation", deform));
    if (part.deform === "mesh") {
      e.append(
        slider("Joint softness", part.softness, 0, 0.12, 5e-3, (v) => updatePart(rig, part.id, { softness: v }), (v) => `${Math.round(v * 100)}%`),
        slider("Stiffness", part.stiffness, 0, 1, 0.05, (v) => updatePart(rig, part.id, { stiffness: v }), (v) => `${Math.round(v * 100)}%`)
      );
      e.querySelectorAll(".fusa-slider input").forEach((i) => i.addEventListener("change", () => this.commit()));
    }
    const fill = h("input", { type: "checkbox", checked: part.fill });
    fill.addEventListener("change", () => (updatePart(rig, part.id, { fill: fill.checked }), this.commit()));
    e.append(
      h("label", { class: "fusa-check", title: "When parts in front of this one move away, show copies of this part\u2019s own nearest pixels instead of a hole. The visible art is never changed." }, fill, "Fill what is hidden behind other parts"),
      this.field(
        "Draw order",
        h(
          "div",
          { class: "fusa-seg" },
          h("button", { type: "button", title: "To the back", onclick: () => (movePart(rig, part.id, "back"), this.commit()) }, "\u21E4"),
          h("button", { type: "button", title: "One step back", onclick: () => (movePart(rig, part.id, -1), this.commit()) }, icon("down")),
          h("button", { type: "button", title: "One step forward", onclick: () => (movePart(rig, part.id, 1), this.commit()) }, icon("up")),
          h("button", { type: "button", title: "To the front", onclick: () => (movePart(rig, part.id, "front"), this.commit()) }, "\u21E5")
        )
      ),
      h("div", { class: "fusa-readout" }, `Layer ${rig.parts.indexOf(part) + 1} of ${rig.parts.length}`),
      h("button", { type: "button", class: "fusa-btn subtle", onclick: () => (removePart(rig, part.id, this.labels, this.partOf(b.parent)?.label ?? 0), this.commit()) }, "Give its pixels to the parent")
    );
  }
  renderRigSettings(e, rig) {
    const r = rig.render;
    const mode = h("div", { class: "fusa-seg" }, ...["pixel", "smooth"].map((m) => h("button", { type: "button", class: r.mode === m ? "active" : "", title: m === "pixel" ? "Nearest-neighbour: every original pixel stays a crisp square of its own colour." : "Smooth sampling for painted, high-resolution sprites.", onclick: () => (r.mode = m, r.snap = m === "pixel", this.commit()) }, m === "pixel" ? "Pixel art" : "Illustration")));
    const facing = h("div", { class: "fusa-seg" }, ...["left", "right"].map((f) => h("button", { type: "button", class: rig.facing === f ? "active" : "", onclick: () => (rig.facing = f, this.commit()) }, f === "left" ? "\u2190 Left" : "Right \u2192")));
    e.append(
      h("div", { class: "fusa-insp-title" }, "Rig"),
      h("p", { class: "fusa-muted" }, `${rig.image.width}\xD7${rig.image.height}px sprite, body ${rig.metrics.bodyHeight}px tall, ${rig.bones.length} bones, ${rig.parts.length} parts. Select a bone to edit it.`),
      this.field("Rendering", mode),
      this.field("Character faces", facing, "Animations are written for a right-facing character and mirrored for left-facing ones."),
      slider("Room around the sprite", r.padding, 0, 1, 0.05, (v) => r.padding = v, (v) => `${Math.round(v * 100)}%`),
      slider("Idle frame rate", r.idleFps, 0, 30, 1, (v) => r.idleFps = v, (v) => v ? `${v} fps` : "every frame")
    );
    e.querySelectorAll(".fusa-slider input").forEach((i) => i.addEventListener("change", () => this.commit()));
  }
  renderIssues() {
    const e = this.elIssues;
    clear(e);
    if (!this.rig) return;
    if (!this.issues.length) {
      e.append(h("div", { class: "fusa-issue ok" }, "\u2713 Ready to animate"));
      return;
    }
    for (const i of this.issues) e.append(h("div", { class: `fusa-issue ${i.level}`, onclick: () => i.partId && this.select(this.rig.parts.find((p) => p.id === i.partId)?.bone ?? null) }, i.level === "info" ? "\u2139 " : icon("warn"), i.message));
  }
  renderLibrary() {
    const e = this.elLibrary;
    clear(e);
    const groups = /* @__PURE__ */ new Map();
    for (const c of listClips()) groups.set(c.category, [...groups.get(c.category) ?? [], c]);
    for (const [cat, clips] of groups) {
      e.append(
        h(
          "div",
          { class: "fusa-group" },
          h("div", { class: "fusa-cat" }, CATEGORY_LABELS[cat] ?? cat),
          h(
            "div",
            { class: "fusa-cards" },
            ...clips.map((c) => {
              const isBase = IDLE_IDS.includes(c.id) && c.loop;
              const active = isBase ? this.baseId === c.id : this.clipId === c.id;
              return h("button", { type: "button", class: `fusa-card ${active ? "active" : ""} ${isBase ? "base" : ""}`, title: c.description ?? c.name, disabled: !this.rig, onclick: () => this.chooseClip(c) }, h("b", null, c.name), h("small", null, isBase ? "Idle loop" : `${c.duration.toFixed(2)}s`));
            })
          )
        )
      );
    }
  }
  renderTransport() {
    const e = this.elTransport;
    clear(e);
    const disabled = !this.rig;
    e.append(
      ibtn(this.playing ? "pause" : "play", this.playing ? "Pause (Space)" : "Play (Space)", () => this.togglePlay(), { class: "big", disabled }),
      ibtn("stop", "Back to the start", () => this.restart(), { disabled }),
      ibtn("loop", "Loop the animation", () => (this.loop = !this.loop, this.renderTransport()), { class: this.loop ? "on" : "", disabled }),
      h("div", { class: "fusa-clipname" }, h("small", null, `Over ${getClip(this.baseId)?.name ?? "nothing"}`), h("b", null, getClip(this.clipId)?.name ?? "")),
      slider("Speed", this.speed, 0.25, 2, 0.05, (v) => this.speed = v, (v) => `${v.toFixed(2)}\xD7`),
      slider("Intensity", this.intensity, 0, 1.5, 0.05, (v) => (this.intensity = v, this.replayIfPaused()), (v) => `${Math.round(v * 100)}%`),
      slider("Wind-up", this.timing.anticipation, 0.5, 2, 0.05, (v) => (this.timing.anticipation = v, this.retime()), (v) => `${v.toFixed(2)}\xD7`),
      slider("Strike", this.timing.action, 0.5, 2, 0.05, (v) => (this.timing.action = v, this.retime()), (v) => `${v.toFixed(2)}\xD7`),
      slider("Recovery", this.timing.recovery, 0.5, 2, 0.05, (v) => (this.timing.recovery = v, this.retime()), (v) => `${v.toFixed(2)}\xD7`),
      h("label", { class: "fusa-check", title: "Each play varies a little (amplitude and speed), so repeated attacks do not look identical." }, h("input", { type: "checkbox", checked: this.variation > 0, onchange: (ev) => (this.variation = ev.target.checked ? 1 : 0, this.restart()) }), "Vary"),
      ibtn("dice", "Another variation", () => (this.seed++, this.variation ||= 1, this.restart()), { disabled })
    );
  }
  renderToolbar() {
    const e = this.elToolbar;
    clear(e);
    if (!this.rig) return;
    const toggles = h(
      "div",
      { class: "fusa-seg small" },
      h("button", { type: "button", class: this.showBones ? "active" : "", title: "Show bones", onclick: () => (this.showBones = !this.showBones, this.renderToolbar()) }, icon("bone"), "Bones"),
      h("button", { type: "button", class: this.showRegions ? "active" : "", title: "Show which pixels belong to which bone", onclick: () => (this.showRegions = !this.showRegions, this.refreshRegions(), this.renderToolbar()) }, icon("brush"), "Regions")
    );
    const tools = [];
    if (this.mode === "rig") tools.push(h("div", { class: "fusa-seg small" }, h("button", { type: "button", class: this.tool !== "add" ? "active" : "", onclick: () => this.setTool("select") }, "Move"), h("button", { type: "button", class: this.tool === "add" ? "active" : "", onclick: () => this.setTool("add") }, icon("add"), "Add bone")));
    if (this.mode === "paint") {
      tools.push(
        h(
          "div",
          { class: "fusa-seg small" },
          h("button", { type: "button", class: this.tool === "brush" ? "active" : "", onclick: () => this.setTool("brush") }, icon("brush"), "Brush"),
          h("button", { type: "button", class: this.tool === "bucket" ? "active" : "", onclick: () => this.setTool("bucket") }, icon("bucket"), "Bucket"),
          h("button", { type: "button", class: this.tool === "hidden" ? "active" : "", title: "Extend the selected part under the parts in front of it (what shows when they move away). Cyan: the automatic fill; gold: your additions. Right-click removes.", onclick: () => this.setTool("hidden") }, icon("eye"), "Hidden")
        ),
        slider("Size", this.brushSize, 0.5, 12, 0.5, (v) => this.brushSize = v, (v) => `${v}px`)
      );
    }
    if (this.mode === "pose") tools.push(h("button", { type: "button", class: "fusa-btn small", onclick: () => (this.pose.clear(), this.poseDirty = true) }, icon("reset"), "Reset pose"));
    e.append(...tools, h("span", { class: "grow" }), toggles, ibtn("fit", "Fit to view (F)", () => this.viewport.fit()));
  }
  renderStatus() {
    const e = this.elStatus;
    clear(e);
    if (!this.rig) return;
    const m = MODES.find((x) => x.id === this.mode);
    const z = this.viewport.zoom;
    const parts = [h("span", { class: "hint" }, this.tool === "add" && this.mode === "rig" ? "Drag from where the new bone starts to where it ends. It joins the selected bone." : m.hint), h("span", { class: "grow" }), this.cursor ? h("span", null, `${Math.floor(this.cursor.x)}, ${Math.floor(this.cursor.y)}`) : null, h("span", null, `${Math.round(z * 100)}%`), this.lastEvent && this.mode === "animate" ? h("span", { class: "event" }, this.lastEvent) : null];
    for (const p of parts) if (p) e.append(p);
  }
  /* ------------------------------------------------------------------ */
  /*  Document lifecycle                                                 */
  /* ------------------------------------------------------------------ */
  snapshot() {
    return this.rig ? JSON.stringify(this.rig) : "";
  }
  /** Load an image URL and start a new rig on it. */
  async newFromImage(src, name) {
    let { data } = await loadImageData(src);
    if (data.width * data.height > 4096 * 4096) throw new Error("This image is too large (over 4096\xD74096).");
    const base2 = name ?? decodeURIComponent(src.split("/").pop() ?? "Sprite").replace(/\.[a-z0-9]+(\?.*)?$/i, "");
    const bg = detectBackground(data);
    if (bg) {
      const [r, g, b] = bg.color;
      const ok = await this.host.confirm("Solid background", `This sprite has a solid background (rgb ${r}, ${g}, ${b}) instead of transparency, so it would show as a box on the map. Save a transparent copy and use that? Your original file is not changed.`);
      if (ok) {
        const { image } = removeBackground(data, bg);
        const canvas2 = document.createElement("canvas");
        canvas2.width = image.width;
        canvas2.height = image.height;
        canvas2.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
        src = await this.host.storeImage(`${base2.replace(/[^a-z0-9_-]+/gi, "_")}-transparent.png`, canvas2.toDataURL("image/png"));
        data = (await loadImageData(src)).data;
      }
    }
    const rig = createRig({ name: base2, src, image: data, template: "humanoid" });
    this.setRig(rig, data, false);
  }
  /** Show a rig (and its image). */
  setRig(rig, image, saved) {
    this.rig = rig;
    this.image = image;
    this.labels = rigLabels(rig);
    this.hints = rigHints(rig);
    this.selected = null;
    this.pose.clear();
    const report2 = lastReport.get(rig);
    this.proposal = report2 && !saved ? { report: report2, previous: null } : null;
    this.history.reset(this.snapshot());
    this.savedSnapshot = saved ? this.snapshot() : "";
    this.rebuild();
    this.viewport.fit();
    this.validate();
    this.renderAll();
    this.restart();
  }
  async loadRigDocument(rig) {
    const { data } = await loadImageData(rig.image.src);
    if (data.width !== rig.image.width || data.height !== rig.image.height) throw new Error(`The image is now ${data.width}\xD7${data.height}, but the rig was made for ${rig.image.width}\xD7${rig.image.height}.`);
    this.setRig(rig, data, true);
  }
  /** Record the current rig as an undo step and refresh everything. */
  commit() {
    if (!this.rig || !this.labels) return;
    this.rig.ownership = encodeRle(this.labels);
    this.rig.fillHints = this.hints && this.hints.some((v) => v) ? encodeRle(this.hints) : null;
    this.rig.updated = Date.now();
    this.history.record(this.snapshot());
    this.needsBuild = true;
    this.validate();
    this.renderAll();
    this.refreshRegions();
  }
  restore(snap) {
    if (!snap || !this.image) return;
    this.rig = JSON.parse(snap);
    this.labels = rigLabels(this.rig);
    this.hints = rigHints(this.rig);
    if (this.selected && !this.boneOf(this.selected)) this.selected = null;
    this.needsBuild = true;
    this.validate();
    this.renderAll();
    this.refreshRegions();
  }
  undo() {
    this.restore(this.history.undo());
  }
  redo() {
    this.restore(this.history.redo());
  }
  validate() {
    if (!this.rig) return;
    this.issues = validateRig(this.rig, { image: this.image ?? void 0, labels: this.labels ?? void 0, clips: listClips().filter((c) => c.templates?.includes(this.rig.template)) });
  }
  /** Rebuild meshes and textures from the rig (after edits that change geometry). */
  rebuild() {
    this.needsBuild = false;
    if (!this.rig || !this.image || !this.labels) return;
    const old = this.view;
    try {
      const build = buildRig(this.rig, this.image, this.labels);
      this.asset = new RigAsset(build);
      this.view = new RigView(this.asset);
    } catch (e) {
      this.host.notify(`Could not build the rig: ${e.message}`, "error");
      return;
    }
    old?.destroy();
    this.viewport.setView(this.view, this.rig.render.mode === "pixel");
    this.refreshRegions();
    this.poseDirty = true;
    if (this.mode === "animate") this.startClips(this.actionTime);
  }
  refreshRegions() {
    if (!this.rig) return;
    if (this.mode === "paint" && this.tool === "hidden") {
      const part = this.partOf(this.selected);
      const W = this.rig.image.width;
      const H = this.rig.image.height;
      const show2 = new Uint8Array(W * H);
      if (part && this.labels) {
        for (let i = 0; i < show2.length; i++) if (this.labels[i] === part.label) show2[i] = 1;
        for (const i of this.view?.build.fills.get(part.label)?.indices ?? []) show2[i] = 2;
        if (this.hints) {
          for (let i = 0; i < show2.length; i++) if (this.hints[i] === part.label) show2[i] = 3;
        }
      }
      const own = this.boneOf(this.selected)?.color ?? "#c9a7ff";
      this.viewport.setRegions(show2, W, H, (l) => l === 1 ? own : l === 2 ? "#5ee6ff" : "#f2c45a", true);
      this.viewport.setRegionAlpha(0.6);
      return;
    }
    const colour = new Map(this.rig.parts.map((p) => [p.label, this.boneOf(p.bone)?.color ?? "#c9a7ff"]));
    const show = this.showRegions && (this.mode === "rig" || this.mode === "paint");
    this.viewport.setRegions(this.labels, this.rig.image.width, this.rig.image.height, (l) => colour.get(l) ?? "#ff00ff", show);
    this.viewport.setRegionAlpha(this.mode === "paint" ? 0.55 : 0.3);
  }
  /* ------------------------------------------------------------------ */
  /*  Modes, tools, selection                                            */
  /* ------------------------------------------------------------------ */
  setMode(mode) {
    if (!this.rig) return;
    this.mode = mode;
    this.tool = mode === "paint" ? "brush" : "select";
    this.playing = mode === "animate";
    if (mode === "animate") this.startClips(0);
    this.poseDirty = true;
    this.renderAll();
    this.refreshRegions();
    this.root.focus({ preventScroll: true });
  }
  setTool(tool) {
    this.tool = tool;
    this.renderToolbar();
    this.renderStatus();
    this.refreshRegions();
  }
  select(id) {
    if (id === this.selected) return;
    this.selected = id;
    for (const n of this.elTree.querySelectorAll(".fusa-node")) n.classList.toggle("selected", n.dataset.id === id);
    this.renderInspector();
  }
  deleteSelected() {
    if (!this.rig || !this.selected) return;
    if (this.rig.bones.length <= 1) return this.host.notify("A rig needs at least one bone.", "warn");
    deleteBone(this.rig, this.selected, this.labels);
    this.selected = null;
    this.commit();
  }
  async reassign() {
    if (!this.rig || !this.image) return;
    if (!await this.host.confirm("Assign pixels", "Give every pixel to its nearest bone again? Regions you painted by hand will be replaced. You can undo this.")) return;
    this.labels = assignPixels(this.rig, this.image);
    this.commit();
  }
  async resetTemplate(t) {
    this.elTree.parentElement?.querySelector(".fusa-template")?.blur();
    if (!t || !this.rig || !this.image) return this.renderAll();
    if (!await this.host.confirm("Start over", `Replace the skeleton with the ${t} template and reassign every pixel? You can undo this.`)) return this.renderAll();
    const fresh = createRig({ name: this.rig.name, src: this.rig.image.src, image: this.image, template: t, facing: this.rig.facing });
    Object.assign(this.rig, { template: fresh.template, bones: fresh.bones, parts: fresh.parts, ownership: fresh.ownership, metrics: fresh.metrics });
    this.labels = rigLabels(this.rig);
    this.selected = null;
    this.commit();
  }
  /* ------------------------------------------------------------------ */
  /*  Pointer input                                                      */
  /* ------------------------------------------------------------------ */
  gizmos() {
    if (!this.rig) return [];
    const posed = (this.mode === "pose" || this.mode === "animate") && this.view;
    const out = [];
    if (posed) {
      const sk = this.view.skeleton;
      sk.bones.forEach((b, i) => {
        const s = sk.segment(i);
        out.push({ id: b.id, ax: s.ax, ay: s.ay, bx: s.bx, by: s.by, color: b.color ?? "#c9a7ff", selected: b.id === this.selected, hover: this.hover?.id === b.id });
      });
      return out;
    }
    const frames = bonesToFrames(this.rig.bones);
    for (const b of this.rig.bones) {
      const f = frames.get(b.id);
      const [bx, by] = tipOf(f);
      let link = null;
      if (b.parent) {
        const [px, py] = tipOf(frames.get(b.parent));
        if (Math.hypot(px - f.x, py - f.y) > 0.75) link = [px, py];
      }
      out.push({ id: b.id, ax: f.x, ay: f.y, bx, by, color: b.color ?? "#c9a7ff", selected: b.id === this.selected, hover: this.hover?.id === b.id, link });
    }
    if (this.addPreview) out.push({ id: "__new", ...this.addPreview, color: "#ffffff", selected: true, hover: false });
    return out;
  }
  snap(v) {
    return this.rig?.render.mode === "pixel" ? Math.round(v * 2) / 2 : Math.round(v * 10) / 10;
  }
  onDown(x, y, e) {
    if (!this.rig) return;
    this.root.focus({ preventScroll: true });
    const right = e.button === 2;
    if (this.mode === "rig") {
      if (this.tool === "add") {
        this.addPreview = { ax: this.snap(x), ay: this.snap(y), bx: this.snap(x), by: this.snap(y) };
        return;
      }
      const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
      if (!hit) return this.select(null);
      if (hit.id !== this.selected) this.select(hit.id);
      this.history.begin();
      const kind = hit.kind === "origin" && e.shiftKey ? "body" : hit.kind;
      this.drag = { kind, id: hit.id, lastX: x, lastY: y };
      return;
    }
    if (this.mode === "paint" && this.tool === "hidden") {
      const part = this.partOf(this.selected);
      if (!part) return this.host.notify("Select the bone whose part should extend under its neighbours.", "info");
      this.hints ??= new Uint8Array(this.rig.image.width * this.rig.image.height);
      this.drag = { kind: "hint", id: String(right ? -part.label : part.label), lastX: x, lastY: y };
      this.hintAt(x, y, right ? -part.label : part.label);
      return;
    }
    if (this.mode === "paint") {
      const target = this.paintLabel(right);
      if (target === null) return;
      if (this.tool === "bucket") {
        const n = floodAssign(this.labels, this.rig.image.width, this.rig.image.height, Math.floor(x), Math.floor(y), target);
        if (n) this.commit();
        return;
      }
      this.drag = { kind: "paint", id: String(target), lastX: x, lastY: y };
      this.paintAt(x, y, target);
      return;
    }
    if (this.mode === "pose" && this.view) {
      const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
      if (!hit) return this.select(null);
      this.select(hit.id);
      const sk = this.view.skeleton;
      const i = sk.index.get(hit.id);
      const p = this.pose.get(i) ?? { rot: 0, x: 0, y: 0 };
      const w = sk.world[i];
      if (e.shiftKey && sk.parent[i] === -1) this.drag = { kind: "translate", id: hit.id, lastX: x, lastY: y, startX: p.x - x, startY: p.y - y };
      else this.drag = { kind: "rotate", id: hit.id, lastX: x, lastY: y, startAngle: Math.atan2(y - w.ty, x - w.tx), startRot: p.rot };
    }
  }
  onMove(x, y, e) {
    this.cursor = { x, y };
    if (!this.rig) return;
    if (this.addPreview) {
      this.addPreview.bx = this.snap(x);
      this.addPreview.by = this.snap(y);
      return;
    }
    const d = this.drag;
    if (!d) return this.onHover(x, y, e);
    if (this.mode === "rig") {
      if (d.kind === "origin") moveJoint(this.rig, d.id, this.snap(x), this.snap(y));
      else if (d.kind === "tip") moveTip(this.rig, d.id, this.snap(x), this.snap(y));
      else moveSubtree(this.rig, d.id, x - d.lastX, y - d.lastY);
      d.lastX = x;
      d.lastY = y;
      this.renderInspector();
      return;
    }
    if (this.mode === "paint" && d.kind === "hint") {
      const steps = Math.max(1, Math.ceil(Math.hypot(x - d.lastX, y - d.lastY) / Math.max(0.5, this.brushSize / 2)));
      for (let k3 = 1; k3 <= steps; k3++) this.hintAt(d.lastX + (x - d.lastX) * k3 / steps, d.lastY + (y - d.lastY) * k3 / steps, Number(d.id));
      d.lastX = x;
      d.lastY = y;
      return;
    }
    if (this.mode === "paint" && d.kind === "paint") {
      const steps = Math.max(1, Math.ceil(Math.hypot(x - d.lastX, y - d.lastY) / Math.max(0.5, this.brushSize / 2)));
      for (let s = 1; s <= steps; s++) this.paintAt(d.lastX + (x - d.lastX) * s / steps, d.lastY + (y - d.lastY) * s / steps, Number(d.id));
      d.lastX = x;
      d.lastY = y;
      return;
    }
    if (this.mode === "pose" && this.view) {
      const sk = this.view.skeleton;
      const i = sk.index.get(d.id);
      const p = this.pose.get(i) ?? { rot: 0, x: 0, y: 0 };
      if (d.kind === "rotate") {
        const w = sk.world[i];
        const a = Math.atan2(y - w.ty, x - w.tx);
        let delta = (a - d.startAngle) * 180 / Math.PI;
        delta = wrapDeg(delta);
        const flip = Math.sign(w.a * w.d - w.b * w.c) || 1;
        p.rot = d.startRot + delta * flip;
        d.startAngle = a;
        d.startRot = p.rot;
      } else {
        p.x = this.snap(d.startX + x);
        p.y = this.snap(d.startY + y);
      }
      this.pose.set(i, p);
      this.poseDirty = true;
    }
  }
  onUp(x, y, _e) {
    if (!this.rig) return;
    if (this.addPreview) {
      const a = this.addPreview;
      this.addPreview = null;
      if (Math.hypot(a.bx - a.ax, a.by - a.ay) < 1) return this.host.notify("Drag to give the new bone a length.", "info");
      const parent = this.selected ?? this.rig.bones.find((b2) => b2.role === "root")?.id ?? null;
      const b = addBone(this.rig, parent, a.ax, a.ay, a.bx, a.by, { name: `Bone ${this.rig.bones.length + 1}` });
      this.selected = b.id;
      this.tool = "select";
      this.commit();
      return;
    }
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    if (this.mode === "rig") {
      this.history.end(this.snapshot());
      this.needsBuild = true;
      this.validate();
      this.renderAll();
    }
    if (this.mode === "paint") this.commit();
    void x;
    void y;
  }
  onHover(x, y, _e) {
    this.cursor = { x, y };
    if (!this.rig) return;
    if (this.mode === "rig" || this.mode === "pose") {
      const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
      if (hit?.id !== this.hover?.id || hit?.kind !== this.hover?.kind) this.hover = hit;
      this.viewport.el.style.cursor = hit ? hit.kind === "body" ? "move" : "crosshair" : this.tool === "add" ? "copy" : "default";
    } else this.viewport.el.style.cursor = this.mode === "paint" ? "none" : "default";
    this.renderStatusSoon();
  }
  statusTimer = 0;
  renderStatusSoon() {
    if (this.statusTimer) return;
    this.statusTimer = window.setTimeout(() => {
      this.statusTimer = 0;
      if (!this.destroyed) this.renderStatus();
    }, 80);
  }
  /** The label painted by the brush: the selected bone's part (created if needed), or its parent's on right-click. */
  paintLabel(toParent) {
    if (!this.rig) return null;
    const b = this.boneOf(this.selected);
    if (!b) {
      this.host.notify("Select the bone whose pixels you want to paint.", "info");
      return null;
    }
    if (toParent) {
      for (let a = b.parent; a; a = this.boneOf(a)?.parent ?? null) {
        const p = this.partOf(a);
        if (p) return p.label;
      }
      return 0;
    }
    const part = this.partOf(b.id) ?? ensurePart(this.rig, b.id);
    return part.label;
  }
  /** Mark (label > 0) or unmark (label < 0) hidden-region hints under the brush. */
  hintAt(x, y, label) {
    if (!this.hints || !this.image || !this.rig) return;
    const W = this.rig.image.width;
    const r = this.brushSize;
    let changed = false;
    for (let py = Math.max(0, Math.floor(y - r)); py <= Math.min(this.rig.image.height - 1, Math.ceil(y + r)); py++) {
      for (let px = Math.max(0, Math.floor(x - r)); px <= Math.min(W - 1, Math.ceil(x + r)); px++) {
        if ((px + 0.5 - x) ** 2 + (py + 0.5 - y) ** 2 > r * r) continue;
        const i = py * W + px;
        if (this.image.data[i * 4 + 3] !== 255) continue;
        const v = label > 0 ? label : this.hints[i] === -label ? 0 : this.hints[i];
        if (this.hints[i] !== v) {
          this.hints[i] = v;
          changed = true;
        }
      }
    }
    if (changed) this.refreshRegions();
  }
  paintAt(x, y, label) {
    if (!this.labels || !this.image) return;
    if (paintCircle(this.labels, this.image, x, y, this.brushSize, label)) this.refreshRegions();
  }
  /* ------------------------------------------------------------------ */
  /*  Playback                                                           */
  /* ------------------------------------------------------------------ */
  chooseClip(c) {
    if (IDLE_IDS.includes(c.id) && c.loop) this.baseId = c.id;
    else this.clipId = c.id;
    if (this.mode !== "animate") this.setMode("animate");
    else {
      this.playing = true;
      this.startClips(0);
      this.renderAll();
    }
  }
  startClips(at) {
    const v = this.view;
    if (!v) return;
    v.player.clear();
    v.skeleton.resetPose();
    const base2 = getClip(this.baseId);
    const clip = getClip(this.clipId);
    if (base2) v.player.play(base2, { track: 0, mixIn: 0 });
    if (clip) {
      v.player.play(clip, {
        track: 1,
        mixIn: clip.loop ? 0.2 : 0.08,
        speed: this.speed,
        intensity: this.intensity,
        timing: this.timing,
        variation: this.variation,
        seed: this.seed,
        loop: clip.loop,
        onEvent: (name) => {
          this.lastEvent = `\u25CF ${name}`;
          this.renderStatusSoon();
        }
      });
      this.warp = new TimeWarp(clip, this.timing);
    }
    this.actionTime = 0;
    if (at > 0) this.seek(at);
    v.player.update(0);
    v.dirty = true;
  }
  seek(t) {
    const v = this.view;
    if (!v) return;
    this.actionTime = t;
    v.player.seek(1, t);
    v.player.update(0);
    v.dirty = true;
    this.timeline.set(getClip(this.clipId) ?? null, this.warp, t);
  }
  togglePlay() {
    if (!this.rig) return;
    if (this.mode !== "animate") return this.setMode("animate");
    this.playing = !this.playing;
    if (this.playing && !this.view?.player.trackInfo(1)) this.startClips(0);
    this.renderTransport();
  }
  restart() {
    if (this.mode !== "animate") return;
    this.playing = true;
    this.startClips(0);
    this.renderTransport();
  }
  retime() {
    const clip = getClip(this.clipId);
    if (clip) this.warp = new TimeWarp(clip, this.timing);
    this.restart();
  }
  replayIfPaused() {
    if (!this.playing) this.startClips(this.actionTime);
  }
  /* ------------------------------------------------------------------ */
  /*  Frame loop                                                         */
  /* ------------------------------------------------------------------ */
  frame(dt) {
    if (this.destroyed || !this.rig) return;
    if (this.needsBuild && !this.drag) this.rebuild();
    const v = this.view;
    if (!v) return;
    if (this.mode === "animate") {
      if (this.playing) {
        v.update(dt * this.speed);
        const info = v.player.trackInfo(1);
        if (info) this.actionTime = info.time;
        else if (this.loop) this.startClips(0);
        else {
          this.actionTime = this.timeline.duration;
        }
      }
      this.timeline.set(getClip(this.clipId) ?? null, this.warp, this.actionTime);
    } else if (this.mode === "pose") {
      if (this.poseDirty) {
        v.player.clear();
        const sk = v.skeleton;
        sk.resetPose();
        for (const [i, p] of this.pose) {
          sk.local[i].rot += p.rot;
          sk.local[i].x += p.x;
          sk.local[i].y += p.y;
        }
        sk.update();
        v.dirty = true;
        this.poseDirty = false;
      }
    } else if (this.poseDirty) {
      v.player.clear();
      v.skeleton.resetPose();
      v.skeleton.update();
      v.dirty = true;
      this.poseDirty = false;
    }
    if (v.dirty) v.render(this.viewport.app.renderer);
    const brush = this.mode === "paint" && this.cursor && (this.tool === "brush" || this.tool === "hidden") ? { x: this.cursor.x, y: this.cursor.y, r: this.brushSize } : null;
    this.viewport.drawBones(this.gizmos(), this.showBones || this.mode === "rig" || this.mode === "pose", brush);
  }
  /* ------------------------------------------------------------------ */
  /*  Files                                                              */
  /* ------------------------------------------------------------------ */
  async importImage() {
    if (this.rig && this.snapshot() !== this.savedSnapshot && !await this.host.confirm("Unsaved changes", "Start a new rig? Unsaved changes to this one will be lost.")) return;
    const src = await this.host.pickImage();
    if (!src) return;
    try {
      await this.newFromImage(src);
    } catch (e) {
      this.host.notify(e.message, "error");
    }
  }
  async save() {
    if (!this.rig) return false;
    if (!isUsable(this.issues) && !await this.host.confirm("Save with problems?", "The rig check found problems that would make the character look wrong on tokens. Save anyway?")) return false;
    this.rig.ownership = encodeRle(this.labels);
    this.rig.revision++;
    this.rig.updated = Date.now();
    try {
      await this.host.saveRig(cloneRig(this.rig));
      this.savedSnapshot = this.snapshot();
      this.history.record(this.savedSnapshot);
      this.host.notify(`Saved "${this.rig.name}".`);
      this.renderHeader();
      return true;
    } catch (e) {
      this.host.notify(`Could not save: ${e.message}`, "error");
      return false;
    }
  }
  async openDialog() {
    let rigs = [];
    try {
      rigs = await this.host.listRigs();
    } catch (e) {
      return this.host.notify(e.message, "error");
    }
    const close = () => overlay.remove();
    const overlay = h(
      "div",
      { class: "fusa-overlay", onclick: (e) => e.target === overlay && close() },
      h(
        "div",
        { class: "fusa-dialog" },
        h("div", { class: "fusa-panel-title" }, "Saved rigs"),
        rigs.length ? h(
          "div",
          { class: "fusa-rig-list" },
          ...rigs.sort((a, b) => b.updated - a.updated).map(
            (r) => h(
              "button",
              {
                type: "button",
                class: "fusa-rig-item",
                onclick: async () => {
                  close();
                  if (this.hasUnsavedChanges && !await this.host.confirm("Unsaved changes", `Open "${r.name}"? Unsaved changes to this rig will be lost.`)) return;
                  try {
                    await this.loadRigDocument(await this.host.loadRig(r.id));
                  } catch (e) {
                    this.host.notify(`Could not open "${r.name}": ${e.message}`, "error");
                  }
                }
              },
              h("img", { src: r.image, alt: "" }),
              h("b", null, r.name),
              h("small", null, new Date(r.updated).toLocaleString())
            )
          )
        ) : h("p", { class: "fusa-muted" }, "No saved rigs yet."),
        h("div", { class: "fusa-dialog-actions" }, h("button", { type: "button", class: "fusa-btn", onclick: close }, "Close"))
      )
    );
    this.root.append(overlay);
  }
  async exportBundle() {
    if (!this.rig) return;
    const res = await fetch(this.rig.image.src);
    const blob = await res.blob();
    const image = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
    this.rig.ownership = encodeRle(this.labels);
    const bundle = { format: "fusa-bundle", version: 1, rig: cloneRig(this.rig), image };
    this.host.download(`${this.rig.name.replace(/[^a-z0-9-_]+/gi, "_") || "rig"}.fusa.json`, JSON.stringify(bundle));
  }
  async importBundle() {
    const text = await this.host.pickTextFile(".json,application/json");
    if (!text) return;
    try {
      const data = JSON.parse(text);
      const rig = parseRig(data.format === "fusa-bundle" ? data.rig : data);
      if (data.format === "fusa-bundle" && typeof data.image === "string" && data.image.startsWith("data:image/")) {
        const ext = data.image.slice(11, data.image.indexOf(";")) || "png";
        rig.image.src = await this.host.storeImage(`${rig.name.replace(/[^a-z0-9-_]+/gi, "_")}.${ext === "webp" ? "webp" : "png"}`, data.image);
      }
      await this.loadRigDocument(rig);
      this.savedSnapshot = "";
      this.renderHeader();
      this.host.notify(`Imported "${rig.name}". Save it to keep it in this world.`);
    } catch (e) {
      this.host.notify(`Could not import: ${e.message}`, "error");
    }
  }
  async assign() {
    if (!this.rig || !this.host.assignToActor) return;
    if (this.snapshot() !== this.savedSnapshot && !await this.save()) return;
    await this.host.assignToActor(this.rig);
  }
  /* ------------------------------------------------------------------ */
  /*  Keyboard                                                           */
  /* ------------------------------------------------------------------ */
  onKey = (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    const mod = e.ctrlKey || e.metaKey;
    let handled = true;
    if (mod && e.key.toLowerCase() === "z") e.shiftKey ? this.redo() : this.undo();
    else if (mod && e.key.toLowerCase() === "y") this.redo();
    else if (mod && e.key.toLowerCase() === "s") void this.save();
    else if (e.key === "Delete" || e.key === "Backspace") this.mode === "rig" ? this.deleteSelected() : handled = false;
    else if (e.key === " ") this.togglePlay();
    else if (e.key === "f" || e.key === "F") this.viewport.fit();
    else if (["1", "2", "3", "4"].includes(e.key) && !mod) this.setMode(MODES[Number(e.key) - 1].id);
    else if (e.key === "[") this.brushSize = Math.max(0.5, this.brushSize - 0.5);
    else if (e.key === "]") this.brushSize = Math.min(12, this.brushSize + 0.5);
    else if (e.key === "Escape") this.tool = "select", this.addPreview = null, this.renderToolbar();
    else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  get hasUnsavedChanges() {
    return !!this.rig && this.snapshot() !== this.savedSnapshot;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    clearTimeout(this.statusTimer);
    this.view?.destroy();
    this.view = null;
    this.timeline.destroy();
    this.viewport.destroy();
    this.root.remove();
  }
};

// src/foundry/studio-app.ts
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
async function confirmDialog(title, text) {
  return !!await foundry.applications.api.DialogV2.confirm({ window: { title }, content: `<p>${esc(text)}</p>`, rejectClose: false });
}
async function assignRigToActor(rig, preselect) {
  const actors = [...game.actors ?? []].filter((a) => a.isOwner).sort((a, b) => a.name.localeCompare(b.name));
  if (!actors.length) return ui.notifications.warn("There are no actors to give this animation to.");
  const options = actors.map((a) => `<option value="${a.id}" ${a.id === preselect ? "selected" : ""}>${esc(a.name)}</option>`).join("");
  const content = `<div class="fusa-assign">
		<p>Tokens of this actor will show <b>${esc(rig.name)}</b> animated: idling on the map and playing attacks, spells and reactions.</p>
		<div class="form-group"><label>Actor</label><select name="actor">${options}</select></div>
		<div class="form-group"><label>Idle</label><select name="idle"><option value="idle-breathing">Breathing</option><option value="combat-stance">Combat stance</option><option value="">None (still until an action)</option></select></div>
		<div class="form-group"><label><input type="checkbox" name="token" checked> Use this sprite as the actor's token image</label></div>
		<p class="hint">The animation replaces the token image only while it plays; turning it off shows the token's own image again.</p>
	</div>`;
  const result = await foundry.applications.api.DialogV2.prompt({
    window: { title: "Use this rig for an actor" },
    content,
    ok: { label: "Assign", callback: (_e, button) => new FormData(button.form) },
    rejectClose: false
  });
  if (!result) return;
  const form = result;
  const actor = game.actors.get(String(form.get("actor")));
  if (!actor) return;
  const profile = { rig: rig.id, enabled: true, idle: String(form.get("idle") ?? "idle-breathing") };
  await actor.setFlag(MODULE_ID, "profile", profile);
  if (form.get("token")) {
    await actor.update({ "prototypeToken.texture.src": rig.image.src });
    for (const t of actor.getActiveTokens?.(false, true) ?? []) if (t.texture?.src !== rig.image.src) await t.update({ "texture.src": rig.image.src });
  }
  ui.notifications.info(`${actor.name} now uses "${rig.name}".`);
}
function makeHost(app) {
  return {
    pickImage: () => pickImage(),
    saveRig: (rig) => saveRig(rig),
    listRigs: async () => listRigs(),
    loadRig: (id) => loadRig(id),
    deleteRig: (id) => deleteRig(id),
    download: (name, text) => download(name, text),
    pickTextFile: (accept) => pickTextFile(accept),
    storeImage: (name, data) => storeImage(name, data),
    notify: (m, t = "info") => ui.notifications?.[t === "warn" ? "warn" : t === "error" ? "error" : "info"](m),
    confirm: confirmDialog,
    assignToActor: (rig) => assignRigToActor(rig, app.actorId ?? void 0)
  };
}
var { ApplicationV2 } = foundry.applications.api;
var StudioApp = class _StudioApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "fusa-studio",
    classes: ["fusa-app"],
    window: { title: STUDIO_TITLE, icon: "fa-solid fa-person-running", resizable: true },
    position: { width: Math.min(1440, window.innerWidth - 80), height: Math.min(900, window.innerHeight - 60) }
  };
  studio = null;
  actorId = null;
  pendingRig = null;
  /** Open (or focus) the Studio, optionally on a rig or for an actor. */
  static async open(o = {}) {
    if (!game.user?.isGM && !canSave()) ui.notifications.warn("Only the GM can save rigs; you can still try things out.");
    const existing = foundry.applications.instances.get("fusa-studio");
    const app = existing ?? new _StudioApp();
    app.actorId = o.actor?.id ?? app.actorId;
    app.pendingRig = o.rigId ?? o.actor?.getFlag?.(MODULE_ID, "profile")?.rig ?? null;
    await app.render({ force: true });
    await app.loadPending();
    return app;
  }
  async loadPending() {
    const id = this.pendingRig;
    this.pendingRig = null;
    if (!id || !this.studio || this.studio.rig?.id === id) return;
    try {
      await this.studio.loadRigDocument(await loadRig(id));
    } catch (e) {
      ui.notifications.error(`Could not open the rig: ${e.message}`);
    }
  }
  async _renderHTML() {
    const div = document.createElement("div");
    div.className = "fusa-host";
    div.style.cssText = "position:absolute;inset:0;";
    return div;
  }
  _replaceHTML(result, content) {
    if (this.studio) return;
    content.style.position = "relative";
    content.replaceChildren(result);
    this.studio = new Studio(result, makeHost(this));
  }
  async close(options) {
    if (this.studio?.hasUnsavedChanges && !await confirmDialog("Close the Studio?", "This rig has unsaved changes. Close anyway?")) return this;
    return super.close(options);
  }
  _onClose(options) {
    this.studio?.destroy();
    this.studio = null;
    super._onClose?.(options);
  }
};

// src/foundry/api.ts
function tokensFor(target) {
  if (!canvas?.ready || !target) return [];
  const t = target;
  if (t.mesh) return [t];
  if (t.documentName === "Token") return t.object ? [t.object] : [];
  if (t.documentName === "Actor") return t.getActiveTokens?.(false, false) ?? [];
  if (typeof target === "string") {
    const byId = canvas.tokens.get(target);
    if (byId) return [byId];
    try {
      const doc = foundry.utils.fromUuidSync?.(target) ?? globalThis.fromUuidSync?.(target);
      if (doc) return tokensFor(doc);
    } catch {
    }
    const actor = game.actors?.get(target) ?? game.actors?.getName?.(target);
    if (actor) return tokensFor(actor);
  }
  return [];
}
function playLocal(tokenIds, clipId, o) {
  let n = 0;
  for (const id of tokenIds) {
    const a = tokenAnimators.get(id);
    const opts = { intensity: o.intensity, speed: o.speed, timing: o.timing, variation: o.variation ?? 1, seed: o.seed };
    if (a?.play(clipId, opts)) n++;
  }
  return n;
}
function onSocket(msg) {
  if (msg?.type !== "play" || !msg.clip || msg.scene !== canvas?.scene?.id) return;
  playLocal(msg.tokens ?? [], msg.clip, msg.opts ?? {});
}
function createApi() {
  return {
    /** API version (semver of this object's shape). */
    version: "0.1.0",
    /** Play a clip on every token of an actor/token on this scene. Resolves to how many tokens played it locally. */
    async play(target, clipId, options = {}) {
      if (!getClip(clipId)) throw new Error(`Unknown animation "${clipId}". See SpriteAnimator.clips().`);
      const tokens = tokensFor(target);
      for (const t of tokens) await tokenAnimators.refresh(t);
      const ids = tokens.map((t) => t.id);
      const seed = options.seed ?? Math.floor(Math.random() * 1e9);
      const opts = { ...options, seed };
      if (options.broadcast !== false && ids.length) game.socket?.emit(SOCKET, { type: "play", scene: canvas.scene?.id, tokens: ids, clip: clipId, opts: { ...opts, broadcast: false } });
      return playLocal(ids, clipId, opts);
    },
    /** Stop the current action on those tokens (they ease back to their idle). */
    stop(target) {
      for (const t of tokensFor(target)) tokenAnimators.get(t.id)?.stop();
    },
    /** Is this token/actor animated right now? */
    isAnimated(target) {
      return tokensFor(target).some((t) => !!tokenAnimators.get(t.id));
    },
    /** Every available clip: id, name, category, duration, loop. */
    clips() {
      return listClips().map((c) => ({ id: c.id, name: c.name, category: c.category, duration: c.duration, loop: c.loop }));
    },
    getClip(id) {
      const c = getClip(id);
      return c ? JSON.parse(JSON.stringify(c)) : void 0;
    },
    /** Add (or override) a clip at runtime, e.g. from another module. Same format as ANIMATION_FORMAT.md. */
    registerClip(clip) {
      registerClip(clip);
    },
    getProfile(actor) {
      return actor.mesh ? profileOf(actor) : actor.getFlag?.(MODULE_ID, "profile") ?? null;
    },
    async setProfile(actor, profile) {
      if (!profile) await actor.unsetFlag(MODULE_ID, "profile");
      else await actor.setFlag(MODULE_ID, "profile", profile);
    },
    /** Saved rigs in this world. */
    rigs() {
      return listRigs();
    },
    openStudio(o = {}) {
      return StudioApp.open(o);
    },
    async assign(rigId, actorId) {
      await assignRigToActor(await loadRig(rigId), actorId);
    },
    /** Checks that need a real Foundry: PixiJS version, token texture strategy, rendering, cleanup. */
    selfTest
  };
}

// src/foundry/main.ts
Hooks.once("init", () => {
  const reg = (key, data) => game.settings.register(MODULE_ID, key, { config: true, ...data });
  game.settings.register(MODULE_ID, "rigs", { scope: "world", config: false, type: Object, default: {} });
  reg("animateTokens", {
    name: "Animate tokens",
    hint: "Tokens of actors with a sprite animation idle and act on the map. Turn off to see their still images (for you only).",
    scope: "client",
    type: Boolean,
    default: true,
    onChange: () => tokenAnimators.reset()
  });
  reg("maxAnimated", {
    name: "Most animated tokens",
    hint: "Above this many on one scene, extra tokens keep their still image (for you only). Lower it on slow computers.",
    scope: "client",
    type: Number,
    range: { min: 1, max: 100, step: 1 },
    default: 40,
    onChange: () => tokenAnimators.reset()
  });
  reg("textureMode", {
    name: "Token texture",
    hint: "Padded: weapons and limbs can swing past the edge of the sprite. Clipped: everything stays inside the sprite\u2019s own rectangle. Use Clipped only if the self-test says so.",
    scope: "world",
    type: String,
    choices: { padded: "Padded (recommended)", clipped: "Clipped" },
    default: "padded",
    onChange: () => tokenAnimators.reset()
  });
  game.settings.registerMenu(MODULE_ID, "studio", {
    name: "Sprite Animation Studio",
    label: "Open the Studio",
    hint: "Rig character sprites, preview animations and assign them to actors.",
    icon: "fa-solid fa-person-running",
    type: StudioApp,
    restricted: true
  });
  const api = createApi();
  const mod = game.modules.get(MODULE_ID);
  if (mod) mod.api = api;
  if (!("SpriteAnimator" in globalThis)) globalThis.SpriteAnimator = api;
  registerTokenHooks();
});
Hooks.once("ready", () => {
  game.socket?.on(SOCKET, onSocket);
  Hooks.callAll(`${MODULE_ID}.ready`, game.modules.get(MODULE_ID)?.api);
});
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM) return;
  const tool = { name: "fusaStudio", title: STUDIO_TITLE, icon: "fa-solid fa-person-running", button: true, order: 99, visible: true, onChange: () => void StudioApp.open() };
  if (Array.isArray(controls)) {
    const tokens2 = controls.find((c) => c.name === "token");
    tokens2?.tools?.push({ ...tool, onClick: tool.onChange });
    return;
  }
  const tokens = controls.tokens ?? controls.token;
  if (tokens?.tools) tokens.tools.fusaStudio = tool;
});
Hooks.on("getHeaderControlsDocumentSheetV2", (app, controls) => {
  const doc = app.document;
  if (doc?.documentName !== "Actor" || !game.user?.isGM) return;
  app.options.actions ??= {};
  app.options.actions.fusaStudio ??= () => void StudioApp.open({ actor: doc });
  if (controls.some((c) => c.action === "fusaStudio")) return;
  controls.push({ action: "fusaStudio", icon: "fa-solid fa-person-running", label: "Sprite animation", ownership: "OWNER" });
});
for (const hook of ["getActorContextOptions", "getActorDirectoryEntryContext"]) {
  Hooks.on(hook, (_app, options) => {
    if (!game.user?.isGM || options.some((o) => o.name === "Sprite animation")) return;
    const actorOf = (li) => {
      const el = Array.isArray(li) ? li[0] : li;
      return game.actors?.get(el?.dataset?.entryId ?? el?.dataset?.documentId);
    };
    options.push({
      name: "Sprite animation",
      icon: '<i class="fa-solid fa-person-running"></i>',
      condition: () => game.user.isGM,
      callback: (li) => {
        const actor = actorOf(li);
        if (actor) void StudioApp.open({ actor });
      }
    });
  });
}
//# sourceMappingURL=fu-sprite-animator.mjs.map
