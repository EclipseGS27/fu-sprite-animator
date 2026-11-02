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
      rotate: [k(0, 100, "outCubic"), k(0.28, 168), k(0.32, 174, SNAP), k(0.44, 40, "outBack"), k(0.52, 46, SETTLE), k(0.9, 82)],
      layer: [{ t: 0.05, behind: "head" }, { t: 0.37 }]
    },
    "arm.lower.front": {
      space: "world",
      rotate: [k(0, 70, "outCubic"), k(0.3, -112), k(0.33, -116, SNAP), k(0.45, 38, "outBack"), k(0.53, 44, SETTLE), k(0.9, 50)],
      layer: [{ t: 0.05, behind: "head" }, { t: 0.37 }]
    },
    "hand.front": { rotate: [k(0, 0, "outCubic"), k(0.3, 10), k(0.34, 10, SNAP), k(0.45, -8, "outQuad"), k(0.9, 0, SETTLE)], layer: [{ t: 0.05, behind: "head" }, { t: 0.37 }] },
    weapon: {
      space: "world",
      rotate: [k(0, -60, "outCubic"), k(0.3, -196), k(0.33, -200, SNAP), k(0.45, 42, "outBack"), k(0.54, 50, SETTLE), k(0.9, -50)],
      layer: [{ t: 0.05, behind: "head" }, { t: 0.37 }]
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
      rotate: [k(0, 100, "outCubic"), k(0.5, -78), k(0.62, -84, SNAP), k(0.74, 62, "outBack"), k(0.86, 66, SETTLE), k(1.35, 85)],
      layer: [{ t: 0.12, behind: "head" }, { t: 0.68 }]
    },
    "arm.lower.front": {
      space: "world",
      rotate: [k(0, 70, "outCubic"), k(0.5, -150), k(0.62, -156, SNAP), k(0.75, 62, "outBack"), k(0.86, 64, SETTLE), k(1.35, 55)],
      layer: [{ t: 0.12, behind: "head" }, { t: 0.68 }]
    },
    "hand.front": { rotate: [k(0, 0, "outCubic"), k(0.55, 8), k(0.62, 8, SNAP), k(0.75, -6, "outQuad"), k(1.35, 0, SETTLE)], layer: [{ t: 0.12, behind: "head" }, { t: 0.68 }] },
    weapon: {
      space: "world",
      rotate: [k(0, -60, "outCubic"), k(0.5, -175), k(0.62, -182, SNAP), k(0.75, 70, "outBack"), k(0.88, 74, SETTLE), k(1.35, -45)],
      layer: [{ t: 0.12, behind: "head" }, { t: 0.68 }]
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

// src/presets/kit.ts
var k3 = (t, v, e) => e ? { t, v, e } : { t, v };
var k22 = (t, x, y, e) => e ? { t, x, y, e } : { t, x, y };
var R = (t, v, e) => ({ ...k3(t, v, e), rest: true });
var SNAP2 = [0.55, 0, 0.9, 0.35];
var OUT = "outCubic";
var SET = "inOutQuad";
var SINE = "inOutSine";
var BACK = "outBack";
var FRONT_CHAIN = ["arm.upper.front", "arm.lower.front", "hand.front", "weapon"];
function withOverHead(tracks, span) {
  if (!span) return tracks;
  const out = { ...tracks };
  for (const role of FRONT_CHAIN) out[role] = { ...out[role], layer: [{ t: span[0], behind: "head" }, { t: span[1] }] };
  return out;
}
var clip = (s) => ({
  format: "fusa-clip",
  version: 1,
  id: s.id,
  name: s.name,
  category: s.category,
  description: s.description,
  duration: s.duration,
  loop: !!s.loop,
  tracks: withOverHead(s.tracks, s.overHead),
  ...s.phases ? { phases: s.phases } : {},
  ...s.events ? { events: s.events } : {},
  requires: s.requires ?? ["torso"],
  templates: s.templates ?? ["humanoid"],
  defaults: { mixIn: s.mixIn ?? (s.loop ? 0.25 : 0.08), mixOut: s.mixOut ?? 0.25 }
});
var ev = (t, name) => ({ t, name });
var cycle = (dur, values, e = SINE) => [...values, values[0]].map((v, i) => k3(dur * i / values.length, v, e));
var cycle2 = (dur, values, e = SINE) => [...values, values[0]].map(([x, y], i) => k22(dur * i / values.length, x, y, e));
var tremble = (t0, t1, amp, base2 = 0) => {
  const keys = [];
  const n = Math.max(2, Math.round((t1 - t0) / 0.05));
  for (let i = 0; i <= n; i++) keys.push(k3(t0 + (t1 - t0) * i / n, base2 + (i % 2 ? amp : -amp) * (0.6 + 0.4 * Math.sin(i))));
  return keys;
};

// src/presets/library.ts
var MAGICAL_IDLE = clip({
  id: "magical-idle",
  name: "Magical idle",
  category: "idle",
  description: "Floating slightly, hands held out with gathered power, a slow sway.",
  duration: 2.4,
  loop: true,
  tracks: {
    root: { translate: cycle2(2.4, [[0, 0], [0, -0.025]]) },
    torso: { rotate: cycle(2.4, [-2, 1]) },
    head: { rotate: cycle(2.4, [1.5, -1]) },
    "arm.upper.front": { rotate: cycle(2.4, [-22, -27]) },
    "arm.lower.front": { rotate: cycle(2.4, [-30, -36]) },
    "arm.upper.back": { rotate: cycle(2.4, [-14, -19]) },
    "arm.lower.back": { rotate: cycle(2.4, [-24, -30]) },
    "leg.lower.front": { rotate: cycle(2.4, [6, 9]) },
    "leg.lower.back": { rotate: cycle(2.4, [8, 11]) }
  }
});
var HEAVY_IDLE = clip({
  id: "heavy-weapon-idle",
  name: "Heavy weapon idle",
  category: "idle",
  description: "Slow, heavy breathing with the weight on the legs and the weapon resting low.",
  duration: 3,
  loop: true,
  tracks: {
    pelvis: { translate: cycle2(3, [[0, 0.012], [0, 0.026]]) },
    torso: { rotate: cycle(3, [5, 7]), scale: cycle2(3, [[1, 1], [1.01, 1.02]]) },
    head: { rotate: cycle(3, [-3, -1.5]) },
    "arm.upper.front": { rotate: cycle(3, [8, 10]) },
    "arm.lower.front": { rotate: cycle(3, [-6, -4]) },
    weapon: { rotate: cycle(3, [12, 14]) },
    "leg.upper.front": { rotate: cycle(3, [-7, -9]) },
    "leg.lower.front": { rotate: cycle(3, [9, 13]) },
    "leg.upper.back": { rotate: cycle(3, [7, 8]) },
    "leg.lower.back": { rotate: cycle(3, [5, 8]) }
  }
});
var WALK = clip({
  id: "walk",
  name: "Walk",
  category: "movement",
  description: "An in-place walk cycle: legs stride, arms counter-swing, the body bobs on each step.",
  duration: 0.9,
  loop: true,
  events: [ev(0, "step"), ev(0.45, "step")],
  tracks: {
    pelvis: { translate: cycle2(0.9, [[0, 0], [0, -0.018], [0, 0], [0, -0.018]]) },
    torso: { rotate: cycle(0.9, [4, 3, 4, 3]) },
    head: { rotate: cycle(0.9, [-2, -1, -2, -1]) },
    "leg.upper.front": { rotate: cycle(0.9, [-22, 0, 18, 0]) },
    "leg.lower.front": { rotate: cycle(0.9, [4, 6, 10, 32]) },
    "foot.front": { rotate: cycle(0.9, [-8, 0, 8, 0]) },
    "leg.upper.back": { rotate: cycle(0.9, [18, 0, -22, 0]) },
    "leg.lower.back": { rotate: cycle(0.9, [10, 32, 4, 6]) },
    "foot.back": { rotate: cycle(0.9, [8, 0, -8, 0]) },
    "arm.upper.front": { rotate: cycle(0.9, [16, 0, -16, 0]) },
    "arm.upper.back": { rotate: cycle(0.9, [-16, 0, 16, 0]) },
    "arm.lower.front": { rotate: cycle(0.9, [-10, -14, -18, -14]) },
    "arm.lower.back": { rotate: cycle(0.9, [-18, -14, -10, -14]) }
  }
});
var RUN = clip({
  id: "run",
  name: "Run",
  category: "movement",
  description: "An in-place run: a strong forward lean, long strides, bent arms pumping.",
  duration: 0.56,
  loop: true,
  events: [ev(0, "step"), ev(0.28, "step")],
  tracks: {
    pelvis: { translate: cycle2(0.56, [[0, 0.01], [0, -0.035], [0, 0.01], [0, -0.035]]) },
    torso: { rotate: cycle(0.56, [13, 11, 13, 11]) },
    head: { rotate: cycle(0.56, [-9, -8, -9, -8]) },
    "leg.upper.front": { rotate: cycle(0.56, [-38, -8, 30, 4]) },
    "leg.lower.front": { rotate: cycle(0.56, [10, 20, 18, 70]) },
    "leg.upper.back": { rotate: cycle(0.56, [30, 4, -38, -8]) },
    "leg.lower.back": { rotate: cycle(0.56, [18, 70, 10, 20]) },
    // The front arm usually holds the weapon: a smaller swing and bend keep the blade off the face.
    "arm.upper.front": { rotate: cycle(0.56, [22, 0, -26, 0]) },
    "arm.upper.back": { rotate: cycle(0.56, [-36, 0, 32, 0]) },
    "arm.lower.front": { rotate: cycle(0.56, [-28, -32, -40, -32]) },
    // Counter-turn a held weapon so a staff or blade stays roughly upright while the arm pumps.
    weapon: { rotate: cycle(0.56, [-4, 18, 46, 18]) },
    "arm.lower.back": { rotate: cycle(0.56, [-70, -60, -55, -60]) }
  }
});
var JUMP = clip({
  id: "jump",
  name: "Jump",
  category: "movement",
  description: "Crouch, spring up with the legs tucked, land and absorb the weight.",
  duration: 1.05,
  phases: { anticipation: [0, 0.24], action: [0.24, 0.34], impact: 0.82, recovery: [0.82, 1.05] },
  events: [ev(0.28, "release"), ev(0.82, "land"), ev(1.05, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0), k22(0.24, 0, 0, "outQuad"), k22(0.52, 0, -0.32, "inQuad"), k22(0.82, 0, 0), k22(1.05, 0, 0)], scale: [k22(0, 1, 1, OUT), k22(0.22, 1.04, 0.94, SNAP2), k22(0.34, 0.96, 1.06, OUT), k22(0.52, 1, 1), k22(0.82, 1.05, 0.93, OUT), k22(1.05, 1, 1)] },
    pelvis: { translate: [k22(0, 0, 0, OUT), k22(0.22, 0, 0.06, SNAP2), k22(0.34, 0, 0), k22(0.82, 0, 0.05, OUT), k22(1.05, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.22, 12, SNAP2), k3(0.34, -4), k3(0.55, 4), k3(0.82, 14, OUT), k3(1.05, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0, OUT), k3(0.22, -25, SNAP2), k3(0.34, 5), k3(0.5, -50, OUT), k3(0.82, -22, OUT), k3(1.05, 0, SET)] },
    "leg.lower.front": { rotate: [k3(0, 0, OUT), k3(0.22, 45, SNAP2), k3(0.34, 0), k3(0.5, 70, OUT), k3(0.82, 40, OUT), k3(1.05, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0, OUT), k3(0.22, -20, SNAP2), k3(0.34, 10), k3(0.5, -35, OUT), k3(0.82, -18, OUT), k3(1.05, 0, SET)] },
    "leg.lower.back": { rotate: [k3(0, 0, OUT), k3(0.22, 40, SNAP2), k3(0.34, 0), k3(0.5, 60, OUT), k3(0.82, 36, OUT), k3(1.05, 0, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0, OUT), k3(0.22, 30, SNAP2), k3(0.34, -60, OUT), k3(0.6, -40), k3(0.82, 10, OUT), k3(1.05, 0, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.22, 30, SNAP2), k3(0.34, -50, OUT), k3(0.6, -35), k3(0.82, 10, OUT), k3(1.05, 0, SET)] }
  }
});
var DASH = clip({
  id: "dash",
  name: "Dash",
  category: "movement",
  description: "A burst forward: low lean, arms trailing, a long stride, then settle.",
  duration: 0.65,
  phases: { anticipation: [0, 0.12], action: [0.12, 0.26], recovery: [0.4, 0.65] },
  events: [ev(0.12, "release"), ev(0.65, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.12, -0.03, 0, SNAP2), k22(0.26, 0.12, 0, OUT), k22(0.42, 0.12, 0, SET), k22(0.65, 0, 0)] },
    pelvis: { translate: [k22(0, 0, 0), k22(0.12, 0, 0.03, SNAP2), k22(0.26, 0, 0.04), k22(0.65, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.12, 8, SNAP2), k3(0.26, 26, OUT), k3(0.42, 22, SET), k3(0.65, 0)] },
    head: { rotate: [k3(0, 0), k3(0.26, -18, OUT), k3(0.65, 0, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0), k3(0.26, 45, OUT), k3(0.65, 0, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0), k3(0.26, 55, OUT), k3(0.65, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0), k3(0.26, -34, OUT), k3(0.65, 0, SET)] },
    "leg.lower.front": { rotate: [k3(0, 0), k3(0.26, 20, OUT), k3(0.65, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0), k3(0.26, 36, OUT), k3(0.65, 0, SET)] },
    "leg.lower.back": { rotate: [k3(0, 0), k3(0.26, 18, OUT), k3(0.65, 0, SET)] }
  }
});
var TELEPORT = clip({
  id: "teleport",
  name: "Teleport",
  category: "movement",
  description: "Squash, stretch into a thin line and snap back: pair it with a flash effect.",
  duration: 0.8,
  phases: { anticipation: [0, 0.2], action: [0.2, 0.36], recovery: [0.46, 0.8] },
  events: [ev(0.36, "vanish"), ev(0.46, "appear"), ev(0.8, "end")],
  tracks: {
    root: { scale: [k22(0, 1, 1, OUT), k22(0.2, 1.12, 0.86, SNAP2), k22(0.36, 0.12, 1.45, "linear"), k22(0.46, 0.12, 1.45, BACK), k22(0.62, 1.06, 0.96, OUT), k22(0.8, 1, 1)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.2, 6), k3(0.36, 0), k3(0.8, 0)] },
    "arm.upper.front": { rotate: [k3(0, 0, OUT), k3(0.2, -40, SNAP2), k3(0.36, -140), k3(0.46, -140, OUT), k3(0.8, 0, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.2, -30, SNAP2), k3(0.36, -140), k3(0.46, -140, OUT), k3(0.8, 0, SET)] }
  }
});
var lunge = (a, i, r, depth = 1) => ({
  root: { translate: [k22(0, 0, 0, OUT), k22(a, -0.03 * depth, 0, SNAP2), k22(i, 0.08 * depth, 0, "outQuad"), k22(r, 0.08 * depth, 0, SET), k22(r + 0.3, 0, 0)] },
  pelvis: { translate: [k22(0, 0, 0, OUT), k22(a, 0, 0.02 * depth, SNAP2), k22(i, 0, 0.035 * depth, "outQuad"), k22(r + 0.3, 0, 0, SET)] },
  "leg.upper.front": { rotate: [k3(0, 0, OUT), k3(a, 6, SNAP2), k3(i, -24 * depth, "outQuad"), k3(r, -20 * depth, SET), k3(r + 0.3, 0)] },
  "leg.lower.front": { rotate: [k3(0, 0, OUT), k3(a, 4, SNAP2), k3(i, 20 * depth, "outQuad"), k3(r, 16 * depth, SET), k3(r + 0.3, 0)] },
  "leg.upper.back": { rotate: [k3(0, 0, OUT), k3(a, -6, SNAP2), k3(i, 16 * depth, "outQuad"), k3(r, 12 * depth, SET), k3(r + 0.3, 0)] },
  "leg.lower.back": { rotate: [k3(0, 0, OUT), k3(a, 8, SNAP2), k3(i, 6, "outQuad"), k3(r + 0.3, 0, SET)] }
});
var THRUST = clip({
  id: "thrust",
  name: "Thrust",
  category: "attack",
  description: "Draw the blade back at the hip, then drive it straight forward with a lunge.",
  duration: 0.85,
  phases: { anticipation: [0, 0.3], action: [0.3, 0.4], impact: 0.4, recovery: [0.5, 0.85] },
  events: [ev(0, "windup"), ev(0.3, "release"), ev(0.4, "contact"), ev(0.6, "recover"), ev(0.85, "end")],
  requires: ["arm.upper.front", "arm.lower.front", "torso"],
  tracks: {
    ...lunge(0.3, 0.4, 0.55, 1.2),
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, -9, SNAP2), k3(0.4, 16, BACK), k3(0.55, 13, SET), k3(0.85, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, -4), k3(0.42, 6, "outQuad"), k3(0.85, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.28, 150), k3(0.3, 152, SNAP2), k3(0.4, 8, BACK), k3(0.55, 10, SET), R(0.85, 70)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.28, 20), k3(0.3, 18, SNAP2), k3(0.4, 0, BACK), k3(0.55, 2, SET), R(0.85, 40)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.28, -2), k3(0.3, 0, SNAP2), k3(0.4, 0), k3(0.55, 0, SET), R(0.85, -50)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, -15), k3(0.4, 30, "outQuad"), k3(0.85, 0, SET)] }
  }
});
var SPEAR = clip({
  id: "spear-attack",
  name: "Spear attack",
  category: "attack",
  description: "Both hands on the shaft: pull back low, then a long two-handed thrust with a deep lunge.",
  duration: 1,
  phases: { anticipation: [0, 0.36], action: [0.36, 0.48], impact: 0.48, recovery: [0.6, 1] },
  events: [ev(0, "windup"), ev(0.36, "release"), ev(0.47, "contact"), ev(0.7, "recover"), ev(1, "end")],
  requires: ["arm.upper.front", "arm.lower.front", "weapon", "torso"],
  tracks: {
    ...lunge(0.36, 0.48, 0.65, 1.5),
    torso: { rotate: [k3(0, 0, OUT), k3(0.36, -12, SNAP2), k3(0.48, 20, BACK), k3(0.65, 16, SET), k3(1, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.36, -6), k3(0.5, 8, "outQuad"), k3(1, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.34, 140), k3(0.36, 142, SNAP2), k3(0.48, 10, BACK), k3(0.65, 12, SET), R(1, 75)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.34, 10), k3(0.36, 8, SNAP2), k3(0.48, -2, BACK), k3(0.65, 0, SET), R(1, 40)] },
    "arm.upper.back": { space: "world", rotate: [R(0, 100, OUT), k3(0.34, 160), k3(0.36, 162, SNAP2), k3(0.48, 30, BACK), k3(0.65, 32, SET), R(1, 95)] },
    "arm.lower.back": { space: "world", rotate: [R(0, 80, OUT), k3(0.34, 20), k3(0.36, 18, SNAP2), k3(0.48, 0, BACK), k3(0.65, 2, SET), R(1, 70)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.34, 8), k3(0.36, 8, SNAP2), k3(0.48, -3), k3(0.65, -2, SET), R(1, -50)] }
  }
});
var DUAL = clip({
  id: "dual-wield-attack",
  name: "Dual-wield attack",
  category: "attack",
  description: "Two quick cuts: the front blade slashes down, then the back blade follows across.",
  duration: 1.1,
  phases: { anticipation: [0, 0.2], action: [0.2, 0.3], impact: 0.3, recovery: [0.75, 1.1] },
  events: [ev(0, "windup"), ev(0.2, "release"), ev(0.29, "contact"), ev(0.62, "contact"), ev(0.8, "recover"), ev(1.1, "end")],
  requires: ["arm.upper.front", "arm.lower.front", "arm.upper.back", "torso"],
  overHead: [0.04, 0.26],
  tracks: {
    ...lunge(0.2, 0.3, 0.7, 0.9),
    torso: { rotate: [k3(0, 0, OUT), k3(0.2, -8, SNAP2), k3(0.3, 12, "outQuad"), k3(0.45, -4, SNAP2), k3(0.62, 16, "outQuad"), k3(0.8, 10, SET), k3(1.1, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, 5), k3(0.62, 7, "outQuad"), k3(1.1, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.18, 168), k3(0.2, 172, SNAP2), k3(0.3, 40, BACK), k3(0.62, 60, SET), R(1.1, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.18, -110), k3(0.2, -114, SNAP2), k3(0.3, 38, BACK), k3(0.62, 50, SET), R(1.1, 55)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.18, -190), k3(0.2, -196, SNAP2), k3(0.3, 40, BACK), k3(0.62, 50, SET), R(1.1, -50)] },
    "arm.upper.back": { space: "world", rotate: [R(0, 100, OUT), k3(0.3, 110), k3(0.45, 200, SNAP2), k3(0.62, 20, BACK), k3(0.8, 30, SET), R(1.1, 95)] },
    "arm.lower.back": { space: "world", rotate: [R(0, 80, OUT), k3(0.3, 90), k3(0.45, -100, SNAP2), k3(0.62, 20, BACK), k3(0.8, 30, SET), R(1.1, 75)] },
    "hand.back": { rotate: [k3(0, 0), k3(0.45, 15, SNAP2), k3(0.62, -10, "outQuad"), k3(1.1, 0, SET)] }
  }
});
var BOW = clip({
  id: "bow-attack",
  name: "Bow attack",
  category: "attack",
  description: "Raise the bow, draw the string to the cheek, hold, loose, and let the arms recoil.",
  duration: 1.25,
  phases: { anticipation: [0, 0.65], action: [0.72, 0.8], impact: 0.95, recovery: [0.95, 1.25] },
  events: [ev(0, "windup"), ev(0.72, "release"), ev(0.95, "contact"), ev(1.25, "end")],
  requires: ["arm.upper.front", "arm.lower.front", "arm.upper.back", "arm.lower.back"],
  tracks: {
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, -5), k3(0.7, -7, SNAP2), k3(0.8, -2, "outQuad"), k3(1.25, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, 3), k3(1.25, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.3, 2), k3(0.7, 0, SNAP2), k3(0.8, -6, "outQuad"), k3(0.95, -3, SET), R(1.25, 90)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.3, 0), k3(0.7, -1, SNAP2), k3(0.8, -8, "outQuad"), k3(0.95, -4, SET), R(1.25, 60)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.3, -90), R(1.25, -60, SET)] },
    "arm.upper.back": { space: "world", rotate: [R(0, 100, OUT), k3(0.3, 10), k3(0.65, 185, OUT), k3(0.72, 186, SNAP2), k3(0.8, 200, "outQuad"), R(1.25, 95, SET)] },
    "arm.lower.back": { space: "world", rotate: [R(0, 80, OUT), k3(0.3, 6), k3(0.65, -2, OUT), k3(0.72, -2, SNAP2), k3(0.8, 200, "outQuad"), R(1.25, 80, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0), k3(0.3, -12, OUT), k3(1.25, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0), k3(0.3, 10, OUT), k3(1.25, 0, SET)] }
  }
});
var STAFF = clip({
  id: "staff-attack",
  name: "Staff attack",
  category: "attack",
  description: "A quick two-handed overhead swing of a staff or rod.",
  duration: 0.95,
  phases: { anticipation: [0, 0.3], action: [0.3, 0.42], impact: 0.42, recovery: [0.55, 0.95] },
  events: [ev(0, "windup"), ev(0.3, "release"), ev(0.41, "contact"), ev(0.6, "recover"), ev(0.95, "end")],
  requires: ["arm.upper.front", "arm.lower.front", "torso"],
  overHead: [0.08, 0.38],
  tracks: {
    ...lunge(0.3, 0.42, 0.6, 0.8),
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, -10, SNAP2), k3(0.42, 15, BACK), k3(0.6, 11, SET), k3(0.95, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, -6), k3(0.45, 7, "outQuad"), k3(0.95, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.28, -80), k3(0.3, -84, SNAP2), k3(0.42, 45, BACK), k3(0.6, 50, SET), R(0.95, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.28, -120), k3(0.3, -124, SNAP2), k3(0.42, 40, BACK), k3(0.6, 44, SET), R(0.95, 55)] },
    "arm.upper.back": { space: "world", rotate: [R(0, 100, OUT), k3(0.28, -70), k3(0.3, -74, SNAP2), k3(0.42, 55, BACK), k3(0.6, 60, SET), R(0.95, 95)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.28, -150), k3(0.3, -156, SNAP2), k3(0.42, 30, BACK), k3(0.6, 34, SET), R(0.95, -50)] }
  }
});
var UNARMED = clip({
  id: "unarmed-attack",
  name: "Unarmed attack",
  category: "attack",
  description: "Twist back with the fist cocked at the shoulder, then a straight punch with the weight behind it.",
  duration: 0.75,
  phases: { anticipation: [0, 0.22], action: [0.22, 0.3], impact: 0.3, recovery: [0.42, 0.75] },
  events: [ev(0, "windup"), ev(0.22, "release"), ev(0.3, "contact"), ev(0.45, "recover"), ev(0.75, "end")],
  requires: ["arm.upper.front", "arm.lower.front", "torso"],
  overHead: [0.06, 0.28],
  tracks: {
    ...lunge(0.22, 0.3, 0.42, 0.8),
    torso: { rotate: [k3(0, 0, OUT), k3(0.22, -10, SNAP2), k3(0.3, 14, BACK), k3(0.42, 10, SET), k3(0.7, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.22, -3), k3(0.32, 5), k3(0.7, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.2, 160), k3(0.22, 162, SNAP2), k3(0.3, 2, BACK), k3(0.42, 4, SET), R(0.7, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.2, -45), k3(0.22, -48, SNAP2), k3(0.3, 0, BACK), k3(0.42, 2, SET), R(0.7, 55)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.22, -30), k3(0.3, 28, "outQuad"), k3(0.7, 0, SET)] },
    "arm.lower.back": { rotate: [k3(0, 0, OUT), k3(0.22, -50), k3(0.3, -40), k3(0.7, 0, SET)] }
  }
});
var FIREARM = clip({
  id: "firearm-shot",
  name: "Firearm shot",
  category: "attack",
  description: "Bring the weapon up to aim, fire with a sharp recoil, lower it.",
  duration: 0.9,
  phases: { anticipation: [0, 0.32], action: [0.4, 0.46], impact: 0.48, recovery: [0.55, 0.9] },
  events: [ev(0, "windup"), ev(0.4, "release"), ev(0.48, "contact"), ev(0.9, "end")],
  requires: ["arm.upper.front", "arm.lower.front"],
  tracks: {
    torso: { rotate: [k3(0, 0, OUT), k3(0.32, -3), k3(0.4, -3, SNAP2), k3(0.46, -8, "outQuad"), k3(0.9, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.3, 4), k3(0.4, 2, SNAP2), k3(0.46, -10, "outQuad"), k3(0.6, 0, SET), R(0.9, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.3, 0), k3(0.4, -1, SNAP2), k3(0.46, -22, "outQuad"), k3(0.6, -2, SET), R(0.9, 55)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.3, 0), k3(0.4, 0, SNAP2), k3(0.46, -18, "outQuad"), k3(0.6, -2, SET), R(0.9, -50)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, -20), k3(0.9, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0), k3(0.3, -10, OUT), k3(0.9, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0), k3(0.3, 8, OUT), k3(0.9, 0, SET)] }
  }
});
var THROW = clip({
  id: "throw",
  name: "Throw",
  category: "attack",
  description: "An overhand throw: reach back and up, step in and whip the arm through.",
  duration: 0.85,
  phases: { anticipation: [0, 0.3], action: [0.3, 0.4], impact: 0.55, recovery: [0.45, 0.85] },
  events: [ev(0, "windup"), ev(0.38, "release"), ev(0.55, "contact"), ev(0.85, "end")],
  requires: ["arm.upper.front", "arm.lower.front", "torso"],
  overHead: [0.08, 0.4],
  tracks: {
    ...lunge(0.3, 0.4, 0.5, 0.7),
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, -14, SNAP2), k3(0.4, 18, BACK), k3(0.5, 14, SET), k3(0.85, 0)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.28, 200), k3(0.3, 202, SNAP2), k3(0.4, 30, BACK), k3(0.5, 40, SET), R(0.85, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.28, -110), k3(0.3, -112, SNAP2), k3(0.4, 20, BACK), k3(0.5, 40, SET), R(0.85, 55)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, -35), k3(0.4, 30, "outQuad"), k3(0.85, 0, SET)] }
  }
});
var CHANNEL = clip({
  id: "channel",
  name: "Channel",
  category: "magic",
  description: "Both hands raised forward, holding the spell with a faint tremble, then lowered.",
  duration: 1.5,
  phases: { anticipation: [0, 0.3], action: [0.3, 1.1], recovery: [1.1, 1.5] },
  events: [ev(0.3, "release"), ev(1.5, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.3, 0, -0.015), k22(1.1, 0, -0.02, SET), k22(1.5, 0, 0)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, -4), k3(0.5, -3), k3(0.7, -4.5), k3(0.9, -3), k3(1.1, -4, SET), k3(1.5, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, -4), k3(1.1, -4, SET), k3(1.5, 0)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.3, -20), k3(0.5, -22), k3(0.7, -19), k3(0.9, -22), k3(1.1, -20, SET), R(1.5, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.3, -30), k3(0.5, -27), k3(0.7, -31), k3(0.9, -28), k3(1.1, -30, SET), R(1.5, 55)] },
    // A held staff or sword stays upright, clear of the face.
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.3, -78), k3(1.1, -76, SET), R(1.5, -60)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, -60), k3(1.1, -58, SET), k3(1.5, 0)] },
    "arm.lower.back": { rotate: [k3(0, 0, OUT), k3(0.3, -40), k3(1.1, -40, SET), k3(1.5, 0)] }
  }
});
var CHARGE = clip({
  id: "charge",
  name: "Charge",
  category: "magic",
  description: "Crouch and pull the power in with clenched fists, trembling, then burst open.",
  duration: 1.5,
  phases: { anticipation: [0, 1.1], action: [1.1, 1.22], impact: 1.22, recovery: [1.22, 1.5] },
  events: [ev(0, "windup"), ev(1.15, "release"), ev(1.5, "end")],
  tracks: {
    pelvis: { translate: [k22(0, 0, 0, OUT), k22(0.3, 0, 0.04), k22(1.1, 0, 0.05, SNAP2), k22(1.22, 0, -0.02, BACK), k22(1.5, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, OUT), ...tremble(0.3, 1.1, 1.2, 9), k3(1.22, -10, BACK), k3(1.5, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, 8), k3(1.1, 10, SNAP2), k3(1.22, -12, BACK), k3(1.5, 0, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0, OUT), k3(0.3, 20), k3(1.1, 22, SNAP2), k3(1.22, -80, BACK), k3(1.5, 0, SET)] },
    "arm.lower.front": { rotate: [k3(0, 0, OUT), k3(0.3, -70), k3(1.1, -75, SNAP2), k3(1.22, -10, BACK), k3(1.5, 0, SET)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.3, -35), k3(1.1, -38, SNAP2), k3(1.22, -72, BACK), R(1.5, -60, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, 15), k3(1.1, 18, SNAP2), k3(1.22, 70, BACK), k3(1.5, 0, SET)] },
    "arm.lower.back": { rotate: [k3(0, 0, OUT), k3(0.3, -70), k3(1.1, -75, SNAP2), k3(1.22, -10, BACK), k3(1.5, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0, OUT), k3(0.3, -14), k3(1.1, -16), k3(1.5, 0, SET)] },
    "leg.lower.front": { rotate: [k3(0, 0, OUT), k3(0.3, 24), k3(1.1, 26), k3(1.5, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, 12), k3(1.1, 14), k3(1.5, 0, SET)] },
    "leg.lower.back": { rotate: [k3(0, 0, OUT), k3(0.3, 18), k3(1.1, 20), k3(1.5, 0, SET)] }
  }
});
var PROJECTILE = clip({
  id: "projectile-cast",
  name: "Projectile cast",
  category: "magic",
  description: "Pull the hand back by the shoulder, then thrust it straight at the target to launch the spell.",
  duration: 1,
  phases: { anticipation: [0, 0.32], action: [0.32, 0.4], impact: 0.6, recovery: [0.5, 1] },
  events: [ev(0, "windup"), ev(0.38, "release"), ev(0.6, "contact"), ev(1, "end")],
  requires: ["arm.upper.front", "arm.lower.front"],
  overHead: [0.05, 0.38],
  tracks: {
    ...lunge(0.32, 0.4, 0.55, 0.6),
    torso: { rotate: [k3(0, 0, OUT), k3(0.32, -10, SNAP2), k3(0.4, 10, BACK), k3(0.55, 8, SET), k3(1, 0)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.3, 165), k3(0.32, 166, SNAP2), k3(0.4, -4, BACK), k3(0.6, -2, SET), R(1, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.3, -60), k3(0.32, -62, SNAP2), k3(0.4, -6, BACK), k3(0.6, -4, SET), R(1, 55)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.3, -105), k3(0.32, -106, SNAP2), k3(0.4, -18, BACK), k3(0.6, -22, SET), R(1, -60)] },
    "hand.front": { rotate: [k3(0, 0), k3(0.32, 10, SNAP2), k3(0.4, -25, "outQuad"), k3(1, 0, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.32, -25), k3(0.4, 25, "outQuad"), k3(1, 0, SET)] }
  }
});
var AREA = clip({
  id: "area-cast",
  name: "Area spell cast",
  category: "magic",
  description: "Raise both hands high, then sweep them down and out as the spell spreads over the field.",
  duration: 1.4,
  phases: { anticipation: [0, 0.6], action: [0.6, 0.74], impact: 0.8, recovery: [0.9, 1.4] },
  events: [ev(0, "windup"), ev(0.7, "release"), ev(0.8, "contact"), ev(1.4, "end")],
  overHead: [0.15, 0.7],
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.6, 0, -0.03, SNAP2), k22(0.74, 0, 0.01, BACK), k22(1.4, 0, 0, SET)] },
    pelvis: { translate: [k22(0, 0, 0), k22(0.74, 0, 0.04, "outQuad"), k22(1.4, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.6, -12, SNAP2), k3(0.74, 12, BACK), k3(0.9, 9, SET), k3(1.4, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.6, -12), k3(0.76, 8, "outQuad"), k3(1.4, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.55, -92), k3(0.6, -95, SNAP2), k3(0.74, 50, BACK), k3(0.9, 48, SET), R(1.4, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.55, -95), k3(0.6, -96, SNAP2), k3(0.74, 35, BACK), k3(0.9, 35, SET), R(1.4, 55)] },
    "arm.upper.back": { space: "world", rotate: [R(0, 100, OUT), k3(0.55, -88), k3(0.6, -90, SNAP2), k3(0.74, 140, BACK), k3(0.9, 138, SET), R(1.4, 95)] },
    "arm.lower.back": { space: "world", rotate: [R(0, 80, OUT), k3(0.55, -90), k3(0.6, -92, SNAP2), k3(0.74, 150, BACK), k3(0.9, 150, SET), R(1.4, 80)] },
    "leg.upper.front": { rotate: [k3(0, 0), k3(0.74, -12, "outQuad"), k3(1.4, 0, SET)] },
    "leg.lower.front": { rotate: [k3(0, 0), k3(0.74, 18, "outQuad"), k3(1.4, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0), k3(0.74, 10, "outQuad"), k3(1.4, 0, SET)] }
  }
});
var HEALING = clip({
  id: "healing",
  name: "Healing",
  category: "magic",
  description: "A gentle lift: hands open upward and forward, the head rises, light pours out, then a calm return.",
  duration: 1.5,
  phases: { anticipation: [0, 0.5], action: [0.5, 0.65], recovery: [1.05, 1.5] },
  events: [ev(0.6, "release"), ev(0.8, "contact"), ev(1.5, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0, SINE), k22(0.6, 0, -0.03, SINE), k22(1.05, 0, -0.03, SINE), k22(1.5, 0, 0)] },
    torso: { rotate: [k3(0, 0, SINE), k3(0.6, -7, SINE), k3(1.05, -6, SINE), k3(1.5, 0)] },
    head: { rotate: [k3(0, 0, SINE), k3(0.6, -10, SINE), k3(1.05, -8, SINE), k3(1.5, 0)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, SINE), k3(0.6, -40, SINE), k3(1.05, -38, SINE), R(1.5, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, SINE), k3(0.6, -55, SINE), k3(1.05, -52, SINE), R(1.5, 55)] },
    weapon: { space: "world", rotate: [R(0, -60, SINE), k3(0.6, -82, SINE), k3(1.05, -80, SINE), R(1.5, -60)] },
    "hand.front": { rotate: [k3(0, 0, SINE), k3(0.6, -20, SINE), k3(1.5, 0)] },
    "arm.upper.back": { rotate: [k3(0, 0, SINE), k3(0.6, -70, SINE), k3(1.05, -68, SINE), k3(1.5, 0)] },
    "arm.lower.back": { rotate: [k3(0, 0, SINE), k3(0.6, -40, SINE), k3(1.5, 0)] }
  }
});
var SUMMON = clip({
  id: "summoning",
  name: "Summoning",
  category: "magic",
  description: "Arms raised high and leaning back as the call goes out, then a sweeping gesture forward to bring the summon in.",
  duration: 1.7,
  phases: { anticipation: [0, 0.9], action: [0.9, 1.05], impact: 1.1, recovery: [1.2, 1.7] },
  events: [ev(0, "windup"), ev(1, "release"), ev(1.1, "contact"), ev(1.7, "end")],
  overHead: [0.2, 0.98],
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.9, 0, -0.04, SNAP2), k22(1.05, 0, 0, BACK), k22(1.7, 0, 0)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.9, -14, SNAP2), k3(1.05, 12, BACK), k3(1.2, 9, SET), k3(1.7, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.9, -15), k3(1.1, 6, "outQuad"), k3(1.7, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.85, -100), k3(0.9, -102, SNAP2), k3(1.05, 25, BACK), k3(1.2, 25, SET), R(1.7, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.85, -100), k3(0.9, -102, SNAP2), k3(1.05, 10, BACK), k3(1.2, 12, SET), R(1.7, 55)] },
    "arm.upper.back": { space: "world", rotate: [R(0, 100, OUT), k3(0.85, -80), k3(0.9, -82, SNAP2), k3(1.05, 160, BACK), R(1.7, 95, SET)] },
    "arm.lower.back": { space: "world", rotate: [R(0, 80, OUT), k3(0.85, -85), k3(0.9, -86, SNAP2), k3(1.05, 170, BACK), R(1.7, 80, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0), k3(1.05, -14, "outQuad"), k3(1.7, 0, SET)] },
    "leg.lower.front": { rotate: [k3(0, 0), k3(1.05, 16, "outQuad"), k3(1.7, 0, SET)] }
  }
});
var BLOCK = clip({
  id: "block",
  name: "Block",
  category: "defence",
  description: "Brace: the forearm (or shield) comes up in front of the body and takes the blow.",
  duration: 0.75,
  phases: { anticipation: [0, 0.12], action: [0.12, 0.2], impact: 0.24, recovery: [0.4, 0.75] },
  events: [ev(0.24, "contact"), ev(0.75, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.2, 0, 0), k22(0.24, -0.025, 0, "outQuad"), k22(0.4, -0.02, 0, SET), k22(0.75, 0, 0)] },
    pelvis: { translate: [k22(0, 0, 0, OUT), k22(0.2, 0, 0.03), k22(0.75, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.2, -4), k3(0.26, -9, "outQuad"), k3(0.75, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.2, 6), k3(0.75, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.18, 30), k3(0.26, 36, "outQuad"), k3(0.45, 32, SET), R(0.75, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.18, -45), k3(0.26, -40, "outQuad"), k3(0.45, -42, SET), R(0.75, 55)] },
    // The blade (if any) slants up and forward in front of the body, not across the face.
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.18, -64), k3(0.26, -58, "outQuad"), k3(0.45, -61, SET), R(0.75, -60)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.18, -25), k3(0.75, 0, SET)] },
    "arm.lower.back": { rotate: [k3(0, 0, OUT), k3(0.18, -45), k3(0.75, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0), k3(0.2, -10, OUT), k3(0.75, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0), k3(0.2, 12, OUT), k3(0.75, 0, SET)] },
    "leg.lower.back": { rotate: [k3(0, 0), k3(0.2, 10, OUT), k3(0.75, 0, SET)] }
  }
});
var DODGE = clip({
  id: "dodge",
  name: "Dodge",
  category: "defence",
  description: "A quick hop back out of reach, leaning away, then a light return.",
  duration: 0.6,
  phases: { action: [0, 0.14], recovery: [0.3, 0.6] },
  events: [ev(0.08, "evade"), ev(0.6, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0, "outQuad"), k22(0.14, -0.13, -0.03, "inQuad"), k22(0.24, -0.15, 0, SET), k22(0.6, 0, 0)] },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.14, -16), k3(0.3, -10, SET), k3(0.6, 0)] },
    head: { rotate: [k3(0, 0), k3(0.1, 0, "outQuad"), k3(0.2, -10), k3(0.6, 0, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.14, -25), k3(0.6, 0, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.14, 25), k3(0.6, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.14, -22), k3(0.3, -12, SET), k3(0.6, 0)] },
    "leg.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.14, 14), k3(0.6, 0, SET)] },
    "leg.lower.back": { rotate: [k3(0, 0, "outQuad"), k3(0.14, 20), k3(0.6, 0, SET)] }
  }
});
var PARRY = clip({
  id: "parry",
  name: "Parry",
  category: "defence",
  description: "The blade sweeps up and across to knock the attack aside.",
  duration: 0.65,
  phases: { anticipation: [0, 0.1], action: [0.1, 0.2], impact: 0.2, recovery: [0.3, 0.65] },
  events: [ev(0.2, "contact"), ev(0.65, "end")],
  requires: ["arm.upper.front", "arm.lower.front"],
  tracks: {
    torso: { rotate: [k3(0, 0, OUT), k3(0.1, 4, SNAP2), k3(0.2, -8, "outQuad"), k3(0.65, 0, SET)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.1, 60, SNAP2), k3(0.2, -10, BACK), k3(0.35, -6, SET), R(0.65, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.1, 20, SNAP2), k3(0.2, -60, BACK), k3(0.35, -55, SET), R(0.65, 55)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.1, -10, SNAP2), k3(0.2, -110, BACK), k3(0.35, -100, SET), R(0.65, -50)] },
    "leg.upper.front": { rotate: [k3(0, 0), k3(0.2, -8, "outQuad"), k3(0.65, 0, SET)] }
  }
});
var COUNTER = clip({
  id: "counterattack",
  name: "Counterattack",
  category: "defence",
  description: "Parry the blow, then answer at once with a fast cut.",
  duration: 1.05,
  phases: { anticipation: [0.2, 0.36], action: [0.36, 0.46], impact: 0.46, recovery: [0.6, 1.05] },
  events: [ev(0.18, "parry"), ev(0.46, "contact"), ev(1.05, "end")],
  requires: ["arm.upper.front", "arm.lower.front"],
  overHead: [0.3, 0.42],
  tracks: {
    ...lunge(0.36, 0.46, 0.65, 0.9),
    torso: { rotate: [k3(0, 0, OUT), k3(0.18, -8, "outQuad"), k3(0.36, -10, SNAP2), k3(0.46, 16, BACK), k3(0.65, 11, SET), k3(1.05, 0)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.18, -10, BACK), k3(0.36, -40, SNAP2), k3(0.46, 45, BACK), k3(0.65, 50, SET), R(1.05, 85)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.18, -60, BACK), k3(0.36, -100, SNAP2), k3(0.46, 40, BACK), k3(0.65, 44, SET), R(1.05, 55)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.18, -110, BACK), k3(0.36, -150, SNAP2), k3(0.46, 42, BACK), k3(0.65, 48, SET), R(1.05, -50)] }
  }
});
var GUARD = clip({
  id: "guard",
  name: "Guard",
  category: "defence",
  description: "Settle into a low defensive stance with the arms up, and hold it.",
  duration: 1.2,
  phases: { action: [0, 0.3] },
  events: [ev(0.3, "contact"), ev(1.2, "end")],
  mixOut: 0.45,
  tracks: {
    pelvis: { translate: [k22(0, 0, 0, OUT), k22(0.3, 0, 0.035), k22(1.2, 0, 0.03, SINE)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, 4), k3(1.2, 3, SINE)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, 5), k3(1.2, 5)] },
    "arm.upper.front": { space: "world", rotate: [R(0, 100, OUT), k3(0.3, 30), k3(1.2, 32, SINE)] },
    "arm.lower.front": { space: "world", rotate: [R(0, 70, OUT), k3(0.3, -40), k3(1.2, -38, SINE)] },
    weapon: { space: "world", rotate: [R(0, -60, OUT), k3(0.3, -52), k3(1.2, -54, SINE)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, -40), k3(1.2, -38, SINE)] },
    "arm.lower.back": { rotate: [k3(0, 0, OUT), k3(0.3, -60), k3(1.2, -60)] },
    "leg.upper.front": { rotate: [k3(0, 0, OUT), k3(0.3, -14), k3(1.2, -14)] },
    "leg.lower.front": { rotate: [k3(0, 0, OUT), k3(0.3, 20), k3(1.2, 20)] },
    "leg.upper.back": { rotate: [k3(0, 0, OUT), k3(0.3, 14), k3(1.2, 14)] },
    "leg.lower.back": { rotate: [k3(0, 0, OUT), k3(0.3, 16), k3(1.2, 16)] }
  }
});
var STAGGER = clip({
  id: "stagger",
  name: "Stagger",
  category: "reaction",
  description: "Rocked off balance: the body wobbles back and forth on unsteady knees, then steadies.",
  duration: 1,
  phases: { impact: 0, recovery: [0.15, 1] },
  events: [ev(0, "contact"), ev(1, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0, "outQuad"), k22(0.12, -0.04, 0), k22(0.35, 0.015, 0, SINE), k22(0.55, -0.015, 0, SINE), k22(0.75, 5e-3, 0, SINE), k22(1, 0, 0)] },
    pelvis: { translate: [k22(0, 0, 0), k22(0.15, 0, 0.04, "outQuad"), k22(0.6, 0, 0.03, SINE), k22(1, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.12, -14), k3(0.35, 9, SINE), k3(0.55, -6, SINE), k3(0.75, 3, SINE), k3(1, 0)] },
    head: { rotate: [k3(0, 0), k3(0.08, 0, "outQuad"), k3(0.2, -14), k3(0.42, 10, SINE), k3(0.62, -5, SINE), k3(1, 0, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.15, -30), k3(0.4, 10, SINE), k3(1, 0, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.15, 25), k3(0.4, -8, SINE), k3(1, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.15, -12), k3(0.5, -6, SINE), k3(1, 0, SET)] },
    "leg.lower.front": { rotate: [k3(0, 0, "outQuad"), k3(0.15, 22), k3(0.5, 12, SINE), k3(1, 0, SET)] },
    "leg.lower.back": { rotate: [k3(0, 0, "outQuad"), k3(0.15, 16), k3(1, 0, SET)] }
  }
});
var KNOCKBACK = clip({
  id: "knockback",
  name: "Knockback",
  category: "reaction",
  description: "Hurled backward: the feet leave the ground, a skid on landing, then a stumbling recovery.",
  duration: 1.1,
  phases: { impact: 0, action: [0, 0.18], recovery: [0.45, 1.1] },
  events: [ev(0, "contact"), ev(0.32, "land"), ev(1.1, "end")],
  tracks: {
    root: { translate: [k22(0, 0, 0, "outQuad"), k22(0.16, -0.12, -0.06, "inQuad"), k22(0.32, -0.17, 0, "outQuad"), k22(0.48, -0.19, 0, SET), k22(1.1, 0, 0)] },
    pelvis: { translate: [k22(0, 0, 0), k22(0.32, 0, 0), k22(0.36, 0, 0.05, "outQuad"), k22(0.6, 0, 0.03, SET), k22(1.1, 0, 0)] },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.16, -28), k3(0.36, 10, "outQuad"), k3(0.6, 6, SET), k3(1.1, 0)] },
    head: { rotate: [k3(0, 0), k3(0.06, 0, "outQuad"), k3(0.2, -20), k3(0.4, 12, SINE), k3(1.1, 0, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.16, -60), k3(0.36, -10, SINE), k3(1.1, 0, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.16, -50), k3(0.36, 10, SINE), k3(1.1, 0, SET)] },
    "leg.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.16, -35), k3(0.36, -14, "outQuad"), k3(1.1, 0, SET)] },
    "leg.lower.front": { rotate: [k3(0, 0, "outQuad"), k3(0.16, 30), k3(0.36, 24, "outQuad"), k3(1.1, 0, SET)] },
    "leg.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.16, -10), k3(0.36, 14, "outQuad"), k3(1.1, 0, SET)] },
    "leg.lower.back": { rotate: [k3(0, 0, "outQuad"), k3(0.16, 40), k3(0.36, 20, "outQuad"), k3(1.1, 0, SET)] }
  }
});
var KNOCKDOWN = clip({
  id: "knockdown",
  name: "Knockdown",
  category: "reaction",
  description: "Swept off the feet and falling flat on the back, a moment on the ground, then back up.",
  duration: 2,
  phases: { impact: 0, action: [0, 0.35], recovery: [1.1, 2] },
  events: [ev(0, "contact"), ev(0.38, "land"), ev(1.1, "rise"), ev(2, "end")],
  tracks: {
    root: { rotate: [k3(0, 0, "inQuad"), k3(0.35, -82, "outBack"), k3(0.5, -78), k3(1.1, -80, "inOutCubic"), k3(1.7, -6, "outQuad"), k3(2, 0)], translate: [k22(0, 0, 0, "outQuad"), k22(0.35, -0.12, 0, SET), k22(1.1, -0.12, 0, "inOutCubic"), k22(2, 0, 0)] },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.2, -15), k3(0.4, 6, SET), k3(1.1, 4), k3(1.4, 20, SET), k3(2, 0)] },
    head: { rotate: [k3(0, 0), k3(0.1, -20, "outQuad"), k3(0.42, 18, "outQuad"), k3(1.1, 10), k3(2, 0, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.2, -70), k3(0.42, -20, "outQuad"), k3(1.1, -15), k3(1.5, 30, SET), k3(2, 0)] },
    "arm.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.2, -60), k3(0.42, -10, "outQuad"), k3(1.1, -10), k3(1.5, 25, SET), k3(2, 0)] },
    "leg.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.25, -40), k3(0.45, -10, "outQuad"), k3(1.1, -15), k3(1.5, -50, SET), k3(2, 0)] },
    "leg.lower.front": { rotate: [k3(0, 0, "outQuad"), k3(0.25, 30), k3(0.45, 8, "outQuad"), k3(1.1, 10), k3(1.5, 70, SET), k3(2, 0)] },
    "leg.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.25, -25), k3(0.45, 0, "outQuad"), k3(1.1, 0), k3(1.5, -30, SET), k3(2, 0)] },
    "leg.lower.back": { rotate: [k3(0, 0, "outQuad"), k3(0.25, 15), k3(0.45, 0), k3(1.1, 0), k3(1.5, 50, SET), k3(2, 0)] }
  }
});
var DEFEAT = clip({
  id: "defeat",
  name: "Defeat",
  category: "reaction",
  description: "The knees give way, the body slumps forward and topples to the ground, and stays down.",
  duration: 1.6,
  phases: { action: [0, 0.6], recovery: [0.6, 1.3] },
  events: [ev(0.55, "kneel"), ev(1.25, "fall"), ev(1.6, "end")],
  mixIn: 0.15,
  tracks: {
    pelvis: { translate: [k22(0, 0, 0, OUT), k22(0.55, 0, 0.14, "outQuad"), k22(1.6, 0, 0.14)] },
    root: { rotate: [k3(0, 0), k3(0.65, 0, "inQuad"), k3(1.25, 82, "outBack"), k3(1.6, 80)], translate: [k22(0, 0, 0), k22(0.65, 0, 0, "inQuad"), k22(1.25, 0.06, 0, OUT), k22(1.6, 0.06, 0)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.55, 30, "outQuad"), k3(0.8, 26, SINE), k3(1.25, 10, OUT), k3(1.6, 8)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.6, 26, "outQuad"), k3(1.25, 10, OUT), k3(1.6, 12)] },
    "arm.upper.front": { rotate: [k3(0, 0, OUT), k3(0.55, 12, SINE), k3(1.25, -50, OUT), k3(1.6, -45)] },
    "arm.upper.back": { rotate: [k3(0, 0, OUT), k3(0.55, 10, SINE), k3(1.25, -40, OUT), k3(1.6, -38)] },
    "leg.upper.front": { rotate: [k3(0, 0, OUT), k3(0.55, -45, "outQuad"), k3(1.25, -10, OUT), k3(1.6, -8)] },
    "leg.lower.front": { rotate: [k3(0, 0, OUT), k3(0.55, 80, "outQuad"), k3(1.25, 15, OUT), k3(1.6, 12)] },
    "leg.upper.back": { rotate: [k3(0, 0, OUT), k3(0.55, -30, "outQuad"), k3(1.25, -5, OUT), k3(1.6, -5)] },
    "leg.lower.back": { rotate: [k3(0, 0, OUT), k3(0.55, 70, "outQuad"), k3(1.25, 10, OUT), k3(1.6, 10)] }
  }
});
var LIBRARY_CLIPS = [
  MAGICAL_IDLE,
  HEAVY_IDLE,
  WALK,
  RUN,
  JUMP,
  DASH,
  TELEPORT,
  THRUST,
  SPEAR,
  DUAL,
  BOW,
  STAFF,
  UNARMED,
  FIREARM,
  THROW,
  CHANNEL,
  CHARGE,
  PROJECTILE,
  AREA,
  HEALING,
  SUMMON,
  BLOCK,
  DODGE,
  PARRY,
  COUNTER,
  GUARD,
  STAGGER,
  KNOCKBACK,
  KNOCKDOWN,
  DEFEAT
];

// src/presets/creatures.ts
var BEASTS = ["quadruped", "winged", "serpentine"];
var BEAST_IDLE = clip({
  id: "beast-idle",
  name: "Beast idle",
  category: "idle",
  description: "Slow breathing through the body, the head and neck shifting, the tail swaying.",
  duration: 2.4,
  loop: true,
  templates: BEASTS,
  tracks: {
    root: { translate: cycle2(2.4, [[0, 0], [0, 6e-3]]) },
    torso: { scale: cycle2(2.4, [[1, 1], [1, 1.03]]) },
    neck: { rotate: cycle(2.4, [0, 2, 3, 1]) },
    head: { rotate: cycle(2.4, [0, -1.5, -2.5, -1]) },
    tail: { rotate: cycle(2.4, [-4, 2, 6, 0]) },
    "tail.tip": { rotate: cycle(2.4, [0, -8, 0, 10]) },
    "wing.near": { rotate: cycle(2.4, [0, -3]) },
    "wing.far": { rotate: cycle(2.4, [0, 3]) }
  }
});
var BITE = clip({
  id: "bite",
  name: "Bite",
  category: "attack",
  description: "Rear the head back with the jaws open, then lunge and snap down on the target.",
  duration: 0.85,
  phases: { anticipation: [0, 0.3], action: [0.3, 0.4], impact: 0.4, recovery: [0.5, 0.85] },
  events: [ev(0, "windup"), ev(0.3, "release"), ev(0.4, "contact"), ev(0.5, "recover"), ev(0.85, "end")],
  requires: ["neck", "head"],
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.3, -0.04, 0, SNAP2), k22(0.4, 0.1, 0, "outQuad"), k22(0.55, 0.09, 0, SET), k22(0.85, 0, 0)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, -6, SNAP2), k3(0.4, 7, BACK), k3(0.55, 5, SET), k3(0.85, 0)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.3, -22, SNAP2), k3(0.4, 18, BACK), k3(0.55, 14, SET), k3(0.85, 0)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, -16, SNAP2), k3(0.4, 14, "outQuad"), k3(0.5, 8, SET), k3(0.85, 0)] },
    "leg.hind.near": { rotate: [k3(0, 0, OUT), k3(0.3, -8, SNAP2), k3(0.4, 18, "outQuad"), k3(0.85, 0, SET)] },
    "leg.hind.far": { rotate: [k3(0, 0, OUT), k3(0.3, -6, SNAP2), k3(0.42, 15, "outQuad"), k3(0.85, 0, SET)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.3, 6, SNAP2), k3(0.4, -20, "outQuad"), k3(0.85, 0, SET)] },
    "leg.front.far": { rotate: [k3(0, 0, OUT), k3(0.3, 5, SNAP2), k3(0.42, -16, "outQuad"), k3(0.85, 0, SET)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.3, 10, SNAP2), k3(0.42, -14, "outQuad"), k3(0.85, 0, SET)] },
    "tail.tip": { rotate: [k3(0, 0, OUT), k3(0.34, 14, SNAP2), k3(0.48, -16, "outQuad"), k3(0.85, 0, SET)] },
    "wing.near": { rotate: [k3(0, 0, OUT), k3(0.3, 10, SNAP2), k3(0.42, -12, "outQuad"), k3(0.85, 0, SET)] },
    "wing.far": { rotate: [k3(0, 0, OUT), k3(0.3, -8, SNAP2), k3(0.42, 10, "outQuad"), k3(0.85, 0, SET)] }
  }
});
var CLAW = clip({
  id: "claw",
  name: "Claw",
  category: "attack",
  description: "Rear up on the hind legs, raise a foreleg high and rake it down.",
  duration: 0.9,
  phases: { anticipation: [0, 0.32], action: [0.32, 0.42], impact: 0.42, recovery: [0.5, 0.9] },
  events: [ev(0, "windup"), ev(0.32, "release"), ev(0.42, "contact"), ev(0.5, "recover"), ev(0.9, "end")],
  requires: ["torso", "leg.front.near"],
  templates: ["quadruped", "winged"],
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.32, -0.02, 0, SNAP2), k22(0.42, 0.07, 0, "outQuad"), k22(0.9, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.32, -22, SNAP2), k3(0.42, 4, BACK), k3(0.6, 2, SET), k3(0.9, 0)] },
    // the hind legs turn against the body so the feet stay planted while it rears
    "leg.hind.near": { rotate: [k3(0, 0, OUT), k3(0.32, 22, SNAP2), k3(0.42, -4, BACK), k3(0.6, -2, SET), k3(0.9, 0)] },
    "leg.hind.far": { rotate: [k3(0, 0, OUT), k3(0.32, 22, SNAP2), k3(0.42, -4, BACK), k3(0.6, -2, SET), k3(0.9, 0)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.32, -78, SNAP2), k3(0.42, 18, BACK), k3(0.6, 8, SET), k3(0.9, 0)] },
    "leg.front.far": { rotate: [k3(0, 0, OUT), k3(0.32, -14, SNAP2), k3(0.44, 4, "outQuad"), k3(0.9, 0, SET)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.32, -10, SNAP2), k3(0.42, 15, "outQuad"), k3(0.9, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.32, -10, SNAP2), k3(0.44, 10, "outQuad"), k3(0.9, 0, SET)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.32, -15, SNAP2), k3(0.42, 10, "outQuad"), k3(0.9, 0, SET)] },
    "tail.tip": { rotate: [k3(0, 0, OUT), k3(0.36, -12, SNAP2), k3(0.48, 12, "outQuad"), k3(0.9, 0, SET)] },
    "wing.near": { rotate: [k3(0, 0, OUT), k3(0.32, 18, SNAP2), k3(0.44, -10, "outQuad"), k3(0.9, 0, SET)] },
    "wing.far": { rotate: [k3(0, 0, OUT), k3(0.32, -14, SNAP2), k3(0.44, 8, "outQuad"), k3(0.9, 0, SET)] }
  }
});
var POUNCE = clip({
  id: "pounce",
  name: "Pounce",
  category: "attack",
  description: "Crouch low, spring forward with the forelegs reaching, land on the target and push back.",
  duration: 1.05,
  phases: { anticipation: [0, 0.35], action: [0.35, 0.6], impact: 0.6, recovery: [0.68, 1.05] },
  events: [ev(0, "windup"), ev(0.36, "release"), ev(0.6, "contact"), ev(0.68, "recover"), ev(1.05, "end")],
  requires: ["torso"],
  templates: BEASTS,
  tracks: {
    root: {
      translate: [k22(0, 0, 0, OUT), k22(0.35, -0.03, 0.03, SNAP2), k22(0.48, 0.1, -0.16, "outQuad"), k22(0.6, 0.15, 0, "inQuad"), k22(0.72, 0.14, 0.01, SET), k22(1.05, 0, 0)],
      scale: [k22(0, 1, 1, OUT), k22(0.35, 1.05, 0.92, SNAP2), k22(0.45, 0.97, 1.04, OUT), k22(0.6, 1.05, 0.94, OUT), k22(0.75, 1, 1, SET)]
    },
    torso: { rotate: [k3(0, 0, OUT), k3(0.35, 6, SNAP2), k3(0.47, -12, "outQuad"), k3(0.6, 10, OUT), k3(0.75, 4, SET), k3(1.05, 0)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.35, 12, SNAP2), k3(0.48, -10), k3(0.6, 14, OUT), k3(1.05, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.35, -6, SNAP2), k3(0.5, -10), k3(0.62, 10, OUT), k3(1.05, 0, SET)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.35, -20, SNAP2), k3(0.48, -45, "outQuad"), k3(0.6, -10, OUT), k3(1.05, 0, SET)] },
    "leg.front.far": { rotate: [k3(0, 0, OUT), k3(0.35, -18, SNAP2), k3(0.5, -40, "outQuad"), k3(0.62, -8, OUT), k3(1.05, 0, SET)] },
    "leg.hind.near": { rotate: [k3(0, 0, OUT), k3(0.35, 20, SNAP2), k3(0.48, 45, "outQuad"), k3(0.6, 15, OUT), k3(1.05, 0, SET)] },
    "leg.hind.far": { rotate: [k3(0, 0, OUT), k3(0.35, 18, SNAP2), k3(0.5, 40, "outQuad"), k3(0.62, 12, OUT), k3(1.05, 0, SET)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.35, -10, SNAP2), k3(0.5, 18, "outQuad"), k3(0.65, -6, OUT), k3(1.05, 0, SET)] },
    "tail.tip": { rotate: [k3(0, 0, OUT), k3(0.4, -12, SNAP2), k3(0.55, 20, "outQuad"), k3(0.7, -8, OUT), k3(1.05, 0, SET)] },
    "wing.near": { rotate: [k3(0, 0, OUT), k3(0.35, 20, SNAP2), k3(0.5, -30, "outQuad"), k3(1.05, 0, SET)] },
    "wing.far": { rotate: [k3(0, 0, OUT), k3(0.35, -16, SNAP2), k3(0.5, 26, "outQuad"), k3(1.05, 0, SET)] }
  }
});
var TAIL_SWIPE = clip({
  id: "tail-swipe",
  name: "Tail swipe",
  category: "attack",
  description: "Lift the tail high, then whip it down across the target, the tip lashing a moment later.",
  duration: 0.95,
  phases: { anticipation: [0, 0.35], action: [0.35, 0.47], impact: 0.45, recovery: [0.55, 0.95] },
  events: [ev(0, "windup"), ev(0.35, "release"), ev(0.45, "contact"), ev(0.55, "recover"), ev(0.95, "end")],
  requires: ["tail"],
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.35, 0.03, 0, SNAP2), k22(0.47, -0.04, 0, "outQuad"), k22(0.95, 0, 0, SET)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.35, 5, SNAP2), k3(0.47, -6, "outQuad"), k3(0.95, 0, SET)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.35, 8, SNAP2), k3(0.5, -6, "outQuad"), k3(0.95, 0, SET)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.35, 35, SNAP2), k3(0.47, -50, "outQuad"), k3(0.6, -40, SET), k3(0.95, 0)] },
    "tail.tip": { rotate: [k3(0, 0, OUT), k3(0.38, 25, SNAP2), k3(0.52, -45, "outQuad"), k3(0.65, -30, SET), k3(0.95, 0)] },
    "leg.hind.near": { rotate: [k3(0, 0, OUT), k3(0.35, -6, SNAP2), k3(0.47, 8, "outQuad"), k3(0.95, 0, SET)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.35, -6, SNAP2), k3(0.47, 6, "outQuad"), k3(0.95, 0, SET)] }
  }
});
var ROAR = clip({
  id: "roar",
  name: "Roar",
  category: "magic",
  description: "Gather with the head low, then throw it up and roar, the body shaking; wings spread.",
  duration: 1.3,
  phases: { anticipation: [0, 0.35], action: [0.35, 0.45], impact: 0.6, recovery: [1, 1.3] },
  events: [ev(0, "windup"), ev(0.42, "release"), ev(0.6, "contact"), ev(1, "recover"), ev(1.3, "end")],
  requires: ["head"],
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.35, 0.02, 0, SNAP2), k22(0.45, -0.025, 0, "outQuad"), k22(1, -0.02, 0, SET), k22(1.3, 0, 0)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.35, 4, SNAP2), k3(0.45, -8, "outQuad"), ...tremble(0.5, 1, 1, -8), k3(1.3, 0, SET)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.35, 12, SNAP2), k3(0.45, -30, BACK), ...tremble(0.5, 1, 1.5, -28), k3(1.3, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.35, 8, SNAP2), k3(0.45, -28, BACK), k3(1, -24, SET), k3(1.3, 0)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.45, -8, "outQuad"), k3(1, -6), k3(1.3, 0, SET)] },
    "leg.front.far": { rotate: [k3(0, 0, OUT), k3(0.45, -6, "outQuad"), k3(1, -5), k3(1.3, 0, SET)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.35, -6, SNAP2), k3(0.5, 16, "outQuad"), k3(1, 12), k3(1.3, 0, SET)] },
    "wing.near": { rotate: [k3(0, 0, OUT), k3(0.35, -6, SNAP2), k3(0.5, 25, "outQuad"), k3(1, 22), k3(1.3, 0, SET)] },
    "wing.far": { rotate: [k3(0, 0, OUT), k3(0.35, 6, SNAP2), k3(0.5, -20, "outQuad"), k3(1, -18), k3(1.3, 0, SET)] }
  }
});
var BREATH2 = clip({
  id: "breath",
  name: "Breath attack",
  category: "magic",
  description: "Rear the head back and fill up, then thrust it forward and hold the breath on the target.",
  duration: 1.4,
  phases: { anticipation: [0, 0.45], action: [0.45, 0.6], impact: 0.62, recovery: [1.05, 1.4] },
  events: [ev(0, "windup"), ev(0.5, "release"), ev(0.62, "contact"), ev(1.05, "recover"), ev(1.4, "end")],
  requires: ["neck", "head"],
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.45, -0.03, 0, SNAP2), k22(0.6, 0.04, 0, "outQuad"), k22(1.05, 0.03, 0, SET), k22(1.4, 0, 0)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.45, -8, SNAP2), k3(0.6, 6, "outQuad"), k3(1.05, 4, SET), k3(1.4, 0)], scale: [k22(0, 1, 1, OUT), k22(0.45, 1, 1.05, SNAP2), k22(0.6, 1, 0.98), k22(1.4, 1, 1, SET)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.45, -30, SNAP2), k3(0.6, 20, BACK), ...tremble(0.65, 1.05, 1.2, 18), k3(1.4, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.45, -20, SNAP2), k3(0.6, 12, "outQuad"), ...tremble(0.65, 1.05, 1, 10), k3(1.4, 0, SET)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.45, 6, SNAP2), k3(0.6, -10, "outQuad"), k3(1.05, -8), k3(1.4, 0, SET)] },
    "leg.hind.near": { rotate: [k3(0, 0, OUT), k3(0.45, -4, SNAP2), k3(0.6, 8, "outQuad"), k3(1.05, 6), k3(1.4, 0, SET)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.45, 12, SNAP2), k3(0.6, -8, "outQuad"), k3(1.4, 0, SET)] },
    "wing.near": { rotate: [k3(0, 0, OUT), k3(0.45, 15, SNAP2), k3(0.6, -10, "outQuad"), k3(1.4, 0, SET)] },
    "wing.far": { rotate: [k3(0, 0, OUT), k3(0.45, -12, SNAP2), k3(0.6, 8, "outQuad"), k3(1.4, 0, SET)] }
  }
});
var CROUCH = clip({
  id: "crouch",
  name: "Crouch",
  category: "defence",
  description: "Sink low with the head down and the legs braced, and hold it (a beast\u2019s guard).",
  duration: 1,
  phases: { action: [0, 0.3] },
  events: [ev(0.3, "contact"), ev(1, "end")],
  mixOut: 0.45,
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.3, -0.015, 0.035), k22(1, -0.015, 0.03, SINE)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.3, 4), k3(1, 3, SINE)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.3, 16), k3(1, 15, SINE)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.3, -10), k3(1, -9, SINE)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.3, -12), k3(1, -12)] },
    "leg.front.far": { rotate: [k3(0, 0, OUT), k3(0.3, -10), k3(1, -10)] },
    "leg.hind.near": { rotate: [k3(0, 0, OUT), k3(0.3, 12), k3(1, 12)] },
    "leg.hind.far": { rotate: [k3(0, 0, OUT), k3(0.3, 10), k3(1, 10)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.3, -12), k3(1, -10, SINE)] },
    "wing.near": { rotate: [k3(0, 0, OUT), k3(0.3, -15), k3(1, -14, SINE)] },
    "wing.far": { rotate: [k3(0, 0, OUT), k3(0.3, 12), k3(1, 11, SINE)] }
  }
});
var BEAST_DODGE = clip({
  id: "beast-dodge",
  name: "Beast dodge",
  category: "defence",
  description: "A quick hop back with the legs tucked, landing ready.",
  duration: 0.65,
  phases: { action: [0, 0.18], recovery: [0.3, 0.65] },
  events: [ev(0, "contact"), ev(0.65, "end")],
  mixIn: 0.03,
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, "outQuad"), k22(0.16, -0.1, -0.06), k22(0.3, -0.12, 0, "inQuad"), k22(0.4, -0.11, 5e-3, SET), k22(0.65, 0, 0)] },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.16, -10), k3(0.3, 4, OUT), k3(0.65, 0, SET)] },
    neck: { rotate: [k3(0, 0, "outQuad"), k3(0.18, -12), k3(0.32, 4, OUT), k3(0.65, 0, SET)] },
    "leg.front.near": { rotate: [k3(0, 0, "outQuad"), k3(0.16, -20), k3(0.3, 0, OUT), k3(0.65, 0)] },
    "leg.front.far": { rotate: [k3(0, 0, "outQuad"), k3(0.16, -18), k3(0.3, 0, OUT), k3(0.65, 0)] },
    "leg.hind.near": { rotate: [k3(0, 0, "outQuad"), k3(0.16, 20), k3(0.3, 0, OUT), k3(0.65, 0)] },
    "leg.hind.far": { rotate: [k3(0, 0, "outQuad"), k3(0.16, 18), k3(0.3, 0, OUT), k3(0.65, 0)] },
    tail: { rotate: [k3(0, 0, "outQuad"), k3(0.18, 14), k3(0.35, -4, OUT), k3(0.65, 0, SET)] }
  }
});
var BEAST_HIT = clip({
  id: "beast-hit",
  name: "Beast hit",
  category: "reaction",
  description: "The body jolts back and the front lifts, the head whips up, the tail flicks.",
  duration: 0.55,
  phases: { impact: 0, action: [0, 0.08], recovery: [0.08, 0.55] },
  events: [ev(0, "contact"), ev(0.55, "end")],
  mixIn: 0.03,
  mixOut: 0.2,
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, "outQuad"), k22(0.07, -0.04, 0), k22(0.18, -0.03, 0, SET), k22(0.55, 0, 0)] },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.07, -10), k3(0.2, -6, BACK), k3(0.55, 0, SET)] },
    neck: { rotate: [k3(0, 0), k3(0.04, 0, "outQuad"), k3(0.11, -14), k3(0.26, -6, SET), k3(0.55, 0)] },
    head: { rotate: [k3(0, 0), k3(0.06, 0, "outQuad"), k3(0.13, -10), k3(0.3, -4, SET), k3(0.55, 0)] },
    tail: { rotate: [k3(0, 0, "outQuad"), k3(0.1, 15), k3(0.3, -4, SET), k3(0.55, 0)] },
    "tail.tip": { rotate: [k3(0, 0), k3(0.04, 0, "outQuad"), k3(0.14, 20), k3(0.34, -6, SET), k3(0.55, 0)] },
    "leg.front.near": { rotate: [k3(0, 0, "outQuad"), k3(0.08, -8), k3(0.55, 0, SET)] },
    "leg.front.far": { rotate: [k3(0, 0, "outQuad"), k3(0.08, -6), k3(0.55, 0, SET)] },
    "wing.near": { rotate: [k3(0, 0, "outQuad"), k3(0.08, 12), k3(0.3, -4, SET), k3(0.55, 0)] },
    "wing.far": { rotate: [k3(0, 0, "outQuad"), k3(0.08, -10), k3(0.3, 3, SET), k3(0.55, 0)] }
  }
});
var BEAST_DEFEAT = clip({
  id: "beast-defeat",
  name: "Beast defeat",
  category: "reaction",
  description: "The legs give way and the body sinks to the ground, the head drops last. Stays down.",
  duration: 1.5,
  phases: { impact: 0, action: [0, 0.5], recovery: [0.5, 1.5] },
  events: [ev(0, "contact"), ev(1.5, "end")],
  mixIn: 0.05,
  templates: BEASTS,
  tracks: {
    root: { translate: [k22(0, 0, 0, "outQuad"), k22(0.12, -0.03, 0), k22(0.55, -0.02, 0.17, "inQuad"), k22(0.62, -0.02, 0.15, OUT), k22(0.75, -0.02, 0.17, SET)] },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.12, -8), k3(0.55, 5, "inQuad"), k3(0.7, 3, SET)] },
    neck: { rotate: [k3(0, 0, "outQuad"), k3(0.15, -12), k3(0.7, 45, "inQuad"), k3(0.78, 40, OUT), k3(0.9, 44, SET)] },
    head: { rotate: [k3(0, 0, "outQuad"), k3(0.2, -8), k3(0.8, 35, "inQuad"), k3(0.88, 30, OUT), k3(1, 33, SET)] },
    "leg.front.near": { rotate: [k3(0, 0, "outQuad"), k3(0.12, -6), k3(0.55, -55, "inQuad"), k3(0.7, -50, SET)] },
    "leg.front.far": { rotate: [k3(0, 0, "outQuad"), k3(0.12, -5), k3(0.58, -48, "inQuad"), k3(0.72, -45, SET)] },
    "leg.hind.near": { rotate: [k3(0, 0, "outQuad"), k3(0.12, 6), k3(0.55, 58, "inQuad"), k3(0.7, 52, SET)] },
    "leg.hind.far": { rotate: [k3(0, 0, "outQuad"), k3(0.12, 5), k3(0.58, 50, "inQuad"), k3(0.72, 46, SET)] },
    tail: { rotate: [k3(0, 0, "outQuad"), k3(0.15, 10), k3(0.8, -22, "inQuad"), k3(1, -20, SET)] },
    "tail.tip": { rotate: [k3(0, 0, "outQuad"), k3(0.2, 12), k3(0.9, -20, "inQuad"), k3(1.1, -18, SET)] },
    "wing.near": { rotate: [k3(0, 0, "outQuad"), k3(0.15, 15), k3(0.8, -35, "inQuad"), k3(1, -32, SET)] },
    "wing.far": { rotate: [k3(0, 0, "outQuad"), k3(0.15, -12), k3(0.8, 30, "inQuad"), k3(1, 28, SET)] }
  }
});
var WING_IDLE = clip({
  id: "wing-idle",
  name: "Hover",
  category: "idle",
  description: "Slow wing beats that keep the body bobbing in the air.",
  duration: 1.1,
  loop: true,
  requires: ["wing.near"],
  templates: ["winged"],
  tracks: {
    root: { translate: cycle2(1.1, [[0, -0.022], [0, 8e-3]]) },
    torso: { rotate: cycle(1.1, [-1.5, 1]) },
    neck: { rotate: cycle(1.1, [1.5, -1]) },
    "wing.near": { rotate: cycle(1.1, [10, -26]), scale: cycle2(1.1, [[1, 1], [0.9, 1]]) },
    "wing.far": { rotate: cycle(1.1, [-9, 24]), scale: cycle2(1.1, [[1, 1], [0.9, 1]]) },
    tail: { rotate: cycle(1.1, [3, -3]) },
    "tail.tip": { rotate: cycle(1.1, [0, 5, 0, -5]) }
  }
});
var WING_BEAT = clip({
  id: "wing-beat",
  name: "Wing beat",
  category: "attack",
  description: "Raise both wings high, then drive them down in one great beat that blasts the field.",
  duration: 1.15,
  phases: { anticipation: [0, 0.42], action: [0.42, 0.54], impact: 0.54, recovery: [0.62, 1.15] },
  events: [ev(0, "windup"), ev(0.44, "release"), ev(0.54, "contact"), ev(0.62, "recover"), ev(1.15, "end")],
  requires: ["wing.near"],
  templates: ["winged"],
  tracks: {
    root: { translate: [k22(0, 0, 0, OUT), k22(0.42, 0, 0.02, SNAP2), k22(0.54, 0.03, -0.08, "outQuad"), k22(0.75, 0.02, -0.06, SET), k22(1.15, 0, 0)] },
    torso: { rotate: [k3(0, 0, OUT), k3(0.42, -6, SNAP2), k3(0.54, 4, "outQuad"), k3(1.15, 0, SET)] },
    neck: { rotate: [k3(0, 0, OUT), k3(0.42, -10, SNAP2), k3(0.56, 8, "outQuad"), k3(1.15, 0, SET)] },
    head: { rotate: [k3(0, 0, OUT), k3(0.42, -6, SNAP2), k3(0.58, 6, "outQuad"), k3(1.15, 0, SET)] },
    "wing.near": { rotate: [k3(0, 0, OUT), k3(0.42, 30, SNAP2), k3(0.54, -45, "outQuad"), k3(0.75, -35, SET), k3(1.15, 0)], scale: [k22(0, 1, 1), k22(0.42, 1.04, 1, SNAP2), k22(0.54, 0.82, 1, "outQuad"), k22(1.15, 1, 1, SET)] },
    "wing.far": { rotate: [k3(0, 0, OUT), k3(0.42, -25, SNAP2), k3(0.54, 40, "outQuad"), k3(0.75, 32, SET), k3(1.15, 0)], scale: [k22(0, 1, 1), k22(0.42, 1.04, 1, SNAP2), k22(0.54, 0.82, 1, "outQuad"), k22(1.15, 1, 1, SET)] },
    "leg.front.near": { rotate: [k3(0, 0, OUT), k3(0.54, -15, "outQuad"), k3(1.15, 0, SET)] },
    "leg.hind.near": { rotate: [k3(0, 0, OUT), k3(0.54, 15, "outQuad"), k3(1.15, 0, SET)] },
    tail: { rotate: [k3(0, 0, OUT), k3(0.42, -8, SNAP2), k3(0.58, 12, "outQuad"), k3(1.15, 0, SET)] }
  }
});
var SERPENT_IDLE = clip({
  id: "serpent-idle",
  name: "Serpent idle",
  category: "idle",
  description: "A slow sway passing down the raised neck and along the body to the tail tip.",
  duration: 2,
  loop: true,
  requires: ["neck"],
  templates: ["serpentine"],
  tracks: {
    root: { translate: cycle2(2, [[0, 0], [0, 4e-3]]) },
    torso: { rotate: cycle(2, [0, 2.5, 0, -2.5]) },
    neck: { rotate: cycle(2, [-5, 0, 5, 0]) },
    head: { rotate: cycle(2, [4, 0, -4, 0]) },
    tail: { rotate: cycle(2, [0, -6, 0, 6]) },
    "tail.tip": { rotate: cycle(2, [10, 0, -10, 0]) }
  }
});
var BLOB_IDLE = clip({
  id: "blob-idle",
  name: "Blob idle",
  category: "idle",
  description: "A soft squash and stretch, the top wobbling a beat behind.",
  duration: 1.6,
  loop: true,
  requires: ["root"],
  templates: ["blob"],
  tracks: {
    root: { scale: cycle2(1.6, [[1.03, 0.97], [0.98, 1.025]]) },
    crest: { rotate: cycle(1.6, [0, -4, 0, 4]) }
  }
});
var BLOB_ATTACK = clip({
  id: "blob-attack",
  name: "Blob attack",
  category: "attack",
  description: "Squash flat, then spring forward stretched tall and splat onto the target.",
  duration: 0.95,
  phases: { anticipation: [0, 0.3], action: [0.3, 0.45], impact: 0.45, recovery: [0.52, 0.95] },
  events: [ev(0, "windup"), ev(0.3, "release"), ev(0.45, "contact"), ev(0.52, "recover"), ev(0.95, "end")],
  requires: ["root"],
  templates: ["blob"],
  tracks: {
    root: {
      translate: [k22(0, 0, 0, OUT), k22(0.3, -0.03, 0, SNAP2), k22(0.38, 0.08, -0.12, "outQuad"), k22(0.45, 0.15, 0, "inQuad"), k22(0.6, 0.14, 0, SET), k22(0.95, 0, 0)],
      scale: [k22(0, 1, 1, OUT), k22(0.3, 1.2, 0.78, SNAP2), k22(0.38, 0.86, 1.18, "outQuad"), k22(0.45, 1.18, 0.84, OUT), k22(0.58, 0.96, 1.05, SET), k22(0.72, 1.02, 0.98, SET), k22(0.95, 1, 1)]
    },
    crest: { rotate: [k3(0, 0, OUT), k3(0.3, 10, SNAP2), k3(0.4, -14, "outQuad"), k3(0.5, 12, OUT), k3(0.95, 0, SET)] }
  }
});
var BLOB_HIT = clip({
  id: "blob-hit",
  name: "Blob hit",
  category: "reaction",
  description: "The whole body jiggles from the blow and settles.",
  duration: 0.6,
  phases: { impact: 0, action: [0, 0.05], recovery: [0.05, 0.6] },
  events: [ev(0, "contact"), ev(0.6, "end")],
  mixIn: 0.02,
  requires: ["root"],
  templates: ["blob"],
  tracks: {
    root: {
      translate: [k22(0, 0, 0, "outQuad"), k22(0.05, -0.04, 0), k22(0.25, -0.02, 0, SET), k22(0.6, 0, 0)],
      scale: [k22(0, 1, 1, "outQuad"), k22(0.05, 0.88, 1.1, SINE), k22(0.15, 1.08, 0.92, SINE), k22(0.27, 0.96, 1.04, SINE), k22(0.4, 1.02, 0.98, SINE), k22(0.6, 1, 1)]
    },
    crest: { rotate: [k3(0, 0), k3(0.04, 0, "outQuad"), k3(0.12, -14, SINE), k3(0.26, 9, SINE), k3(0.4, -4, SINE), k3(0.6, 0)] }
  }
});
var BLOB_DEFEAT = clip({
  id: "blob-defeat",
  name: "Blob defeat",
  category: "reaction",
  description: "A last wobble, then the body melts into a puddle. Stays down.",
  duration: 1.3,
  phases: { impact: 0, recovery: [0.1, 1.3] },
  events: [ev(0, "contact"), ev(1.3, "end")],
  requires: ["root"],
  templates: ["blob"],
  tracks: {
    root: { scale: [k22(0, 1, 1, "outQuad"), k22(0.1, 1.1, 0.9, SINE), k22(0.25, 0.92, 1.08, SINE), k22(1, 1.4, 0.32, "inOutCubic"), k22(1.15, 1.35, 0.36, SET)] },
    crest: { rotate: [k3(0, 0, "outQuad"), k3(0.25, -10, SINE), k3(0.95, 60, "inQuad"), k3(1.1, 55, SET)] }
  }
});
var FLOAT_IDLE = clip({
  id: "float-idle",
  name: "Float",
  category: "idle",
  description: "Drifting up and down, the arms swaying and the trailing body rippling.",
  duration: 2.6,
  loop: true,
  templates: ["floating"],
  tracks: {
    root: { translate: cycle2(2.6, [[0, 0], [0, -0.03]]) },
    torso: { rotate: cycle(2.6, [-2, 2]) },
    head: { rotate: cycle(2.6, [2, -2]) },
    "arm.upper.front": { rotate: cycle(2.6, [-6, -2, 2, -2]) },
    "arm.lower.front": { rotate: cycle(2.6, [-4, -10, -4, 2]) },
    "arm.upper.back": { rotate: cycle(2.6, [4, 0, -4, 0]) },
    "arm.lower.back": { rotate: cycle(2.6, [8, 2, -4, 2]) },
    tail: { rotate: cycle(2.6, [-6, 0, 6, 0]) },
    "tail.tip": { rotate: cycle(2.6, [0, -10, 0, 10]) }
  }
});
var ANY = ["custom", "humanoid", "quadruped", "winged", "serpentine", "floating", "blob"];
var GENERIC_IDLE = clip({
  id: "generic-idle",
  name: "Breathe (any rig)",
  category: "idle",
  description: "A gentle swell and settle of the whole sprite. Works on any rig.",
  duration: 2.2,
  loop: true,
  requires: ["root"],
  templates: ANY,
  tracks: { root: { scale: cycle2(2.2, [[1, 1], [1, 1.02]]), translate: cycle2(2.2, [[0, 0], [0, -4e-3]]) } }
});
var GENERIC_ATTACK = clip({
  id: "generic-attack",
  name: "Lunge (any rig)",
  category: "attack",
  description: "Lean back, then lunge forward at the target and return. Works on any rig.",
  duration: 0.75,
  phases: { anticipation: [0, 0.25], action: [0.25, 0.33], impact: 0.33, recovery: [0.45, 0.75] },
  events: [ev(0, "windup"), ev(0.25, "release"), ev(0.33, "contact"), ev(0.45, "recover"), ev(0.75, "end")],
  requires: ["root"],
  templates: ANY,
  tracks: {
    root: {
      translate: [k22(0, 0, 0, OUT), k22(0.25, -0.04, 0, SNAP2), k22(0.33, 0.1, 0, "outQuad"), k22(0.45, 0.09, 0, SET), k22(0.75, 0, 0)],
      rotate: [k3(0, 0, OUT), k3(0.25, -5, SNAP2), k3(0.33, 6, "outQuad"), k3(0.45, 4, SET), k3(0.75, 0)],
      scale: [k22(0, 1, 1, OUT), k22(0.25, 0.96, 1.03, SNAP2), k22(0.33, 1.06, 0.96, "outQuad"), k22(0.5, 1, 1, SET)]
    }
  }
});
var GENERIC_CAST = clip({
  id: "generic-cast",
  name: "Gather power (any rig)",
  category: "magic",
  description: "Rise and swell while trembling, then release. Works on any rig.",
  duration: 1.1,
  phases: { anticipation: [0, 0.42], action: [0.42, 0.5], impact: 0.6, recovery: [0.6, 1.1] },
  events: [ev(0, "windup"), ev(0.45, "release"), ev(0.6, "contact"), ev(1.1, "end")],
  requires: ["root"],
  templates: ANY,
  tracks: {
    root: {
      translate: [k22(0, 0, 0, OUT), k22(0.42, 0, -0.03, SET), k22(0.5, 0.02, -0.02, "outQuad"), k22(1.1, 0, 0, SET)],
      scale: [k22(0, 1, 1, OUT), k22(0.42, 1.04, 1.04, SET), k22(0.5, 0.98, 1.02, "outQuad"), k22(0.7, 1, 1, SET)],
      rotate: [k3(0, 0), ...tremble(0.1, 0.42, 1.2), k3(0.5, 2, "outQuad"), k3(1.1, 0, SET)]
    }
  }
});
var GENERIC_HIT = clip({
  id: "generic-hit",
  name: "Recoil (any rig)",
  category: "reaction",
  description: "Knocked back a little, rocking, then settling. Works on any rig.",
  duration: 0.5,
  phases: { impact: 0, action: [0, 0.06], recovery: [0.06, 0.5] },
  events: [ev(0, "contact"), ev(0.5, "end")],
  mixIn: 0.02,
  requires: ["root"],
  templates: ANY,
  tracks: {
    root: {
      translate: [k22(0, 0, 0, "outQuad"), k22(0.06, -0.05, 0), k22(0.2, -0.03, 0, SET), k22(0.5, 0, 0)],
      rotate: [k3(0, 0, "outQuad"), k3(0.06, -7), k3(0.16, 3, SINE), k3(0.28, -1.5, SINE), k3(0.5, 0)]
    }
  }
});
var GENERIC_DODGE = clip({
  id: "generic-dodge",
  name: "Hop back (any rig)",
  category: "defence",
  description: "A quick hop away from the attack. Works on any rig.",
  duration: 0.55,
  phases: { action: [0, 0.18], recovery: [0.3, 0.55] },
  events: [ev(0, "contact"), ev(0.55, "end")],
  mixIn: 0.03,
  requires: ["root"],
  templates: ANY,
  tracks: { root: { translate: [k22(0, 0, 0, "outQuad"), k22(0.16, -0.12, -0.05), k22(0.3, -0.12, 0, "inQuad"), k22(0.55, 0, 0, SET)] } }
});
var GENERIC_DEFEAT = clip({
  id: "generic-defeat",
  name: "Collapse (any rig)",
  category: "reaction",
  description: "Reel, then slump down and stay down. Works on any rig; stays inside the sprite\u2019s frame.",
  duration: 1.2,
  phases: { impact: 0, recovery: [0.2, 1.2] },
  events: [ev(0, "contact"), ev(1.2, "end")],
  requires: ["root"],
  templates: ANY,
  tracks: {
    root: {
      rotate: [k3(0, 0, "outQuad"), k3(0.2, -8, SINE), k3(0.8, 16, "inQuad"), k3(0.9, 13, OUT), k3(1, 14, SET)],
      scale: [k22(0, 1, 1), k22(0.2, 0.98, 1.02, SINE), k22(0.8, 1.08, 0.7, "inQuad"), k22(0.9, 1.05, 0.74, OUT), k22(1, 1.06, 0.72, SET)],
      translate: [k22(0, 0, 0), k22(0.2, -0.03, 0, SINE), k22(0.8, 0.02, 0, "inQuad")]
    }
  }
});
var FLOAT_DEFEAT = clip({
  id: "float-defeat",
  name: "Spirit defeat",
  category: "reaction",
  description: "The spirit shudders, sinks and folds in on itself, arms hanging. Stays down.",
  duration: 1.4,
  phases: { impact: 0, recovery: [0.15, 1.4] },
  events: [ev(0, "contact"), ev(1.4, "end")],
  templates: ["floating"],
  tracks: {
    root: {
      translate: [k22(0, 0, 0, "outQuad"), k22(0.15, -0.03, -0.02), k22(1.1, 0, 0.12, "inOutCubic"), k22(1.25, 0, 0.11, SET)],
      scale: [k22(0, 1, 1), k22(0.15, 0.96, 1.04, SINE), k22(1.1, 1.08, 0.72, "inOutCubic"), k22(1.25, 1.06, 0.74, SET)],
      rotate: [k3(0, 0), ...tremble(0.05, 0.4, 2), k3(1.1, 4, SET)]
    },
    torso: { rotate: [k3(0, 0, "outQuad"), k3(0.15, -6), k3(1.1, 14, "inQuad"), k3(1.25, 12, SET)] },
    head: { rotate: [k3(0, 0, "outQuad"), k3(0.2, -8), k3(1.2, 25, "inQuad"), k3(1.3, 22, SET)] },
    "arm.upper.front": { rotate: [k3(0, 0, "outQuad"), k3(0.15, -15), k3(1.1, 30, "inQuad"), k3(1.25, 26, SET)] },
    "arm.lower.front": { rotate: [k3(0, 0, "outQuad"), k3(0.2, -10), k3(1.15, 25, "inQuad"), k3(1.3, 22, SET)] },
    "arm.upper.back": { rotate: [k3(0, 0, "outQuad"), k3(0.15, 15), k3(1.1, -30, "inQuad"), k3(1.25, -26, SET)] },
    "arm.lower.back": { rotate: [k3(0, 0, "outQuad"), k3(0.2, 10), k3(1.15, -25, "inQuad"), k3(1.3, -22, SET)] },
    tail: { rotate: [k3(0, 0, "outQuad"), k3(0.3, 10), k3(1.2, -8, SINE)] },
    "tail.tip": { rotate: [k3(0, 0, "outQuad"), k3(0.35, -14), k3(1.25, 10, SINE)] }
  }
});
var CREATURE_CLIPS = [
  BEAST_IDLE,
  BITE,
  CLAW,
  POUNCE,
  TAIL_SWIPE,
  ROAR,
  BREATH2,
  CROUCH,
  BEAST_DODGE,
  BEAST_HIT,
  BEAST_DEFEAT,
  WING_IDLE,
  WING_BEAT,
  SERPENT_IDLE,
  BLOB_IDLE,
  BLOB_ATTACK,
  BLOB_HIT,
  BLOB_DEFEAT,
  FLOAT_IDLE,
  GENERIC_IDLE,
  GENERIC_ATTACK,
  GENERIC_CAST,
  GENERIC_HIT,
  GENERIC_DODGE,
  GENERIC_DEFEAT,
  FLOAT_DEFEAT
];
var DEFAULT_IDLE = {
  humanoid: "idle-breathing",
  quadruped: "beast-idle",
  winged: "wing-idle",
  serpentine: "serpent-idle",
  floating: "float-idle",
  blob: "blob-idle",
  custom: "generic-idle"
};
var DEFAULT_ACTION = {
  humanoid: "sword-slash",
  quadruped: "bite",
  winged: "wing-beat",
  serpentine: "bite",
  floating: "magic-cast",
  blob: "blob-attack",
  custom: "generic-attack"
};

// src/presets/index.ts
var builtIn = new Map([...HUMANOID_CLIPS, ...LIBRARY_CLIPS, ...CREATURE_CLIPS].map((c) => [c.id, c]));
function defaultActionFor(template) {
  return DEFAULT_ACTION[template ?? "humanoid"] ?? "generic-attack";
}
function defaultIdleFor(template) {
  return DEFAULT_IDLE[template ?? "humanoid"] ?? "generic-idle";
}
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
function isBuiltIn(id) {
  return builtIn.has(id) && !registered.has(id);
}
function registerClip(clip2) {
  if (!clip2 || clip2.format !== "fusa-clip") throw new Error('Not a clip (format must be "fusa-clip").');
  if (!clip2.id || typeof clip2.id !== "string") throw new Error("A clip needs an id.");
  if (!(clip2.duration > 0)) throw new Error(`Clip "${clip2.id}" needs a positive duration.`);
  for (const [role, track2] of Object.entries(clip2.tracks ?? {})) {
    for (const keys of [track2.rotate, track2.translate, track2.scale]) {
      if (!keys) continue;
      for (let i = 1; i < keys.length; i++) {
        if (!(keys[i].t >= keys[i - 1].t)) throw new Error(`Clip "${clip2.id}", role "${role}": keys must be in time order.`);
      }
    }
  }
  registered.set(clip2.id, clip2);
}
function unregisterClip(id) {
  return registered.delete(id);
}

// src/mapping/index.ts
var NONE = "none";
var RULE_GROUPS = [
  {
    title: "Weapons (by Project FU category)",
    keys: [
      ["weapon:sword", "Sword"],
      ["weapon:dagger", "Dagger"],
      ["weapon:flail", "Flail"],
      ["weapon:heavy", "Heavy"],
      ["weapon:spear", "Spear"],
      ["weapon:brawling", "Brawling"],
      ["weapon:arcane", "Arcane"],
      ["weapon:bow", "Bow"],
      ["weapon:firearm", "Firearm"],
      ["weapon:thrown", "Thrown"],
      ["weapon:shield", "Shield"],
      ["weapon:melee", "Other melee weapon"],
      ["weapon:ranged", "Other ranged weapon"]
    ]
  },
  {
    title: "NPC attacks",
    keys: [
      ["basic:melee", "Melee attack"],
      ["basic:ranged", "Ranged attack"],
      ["basic:ranged:arrow", "Ranged attack with arrows"],
      ["basic:ranged:bullet", "Ranged attack with shots"]
    ]
  },
  {
    title: "Spells",
    keys: [
      ["spell:offensive", "Offensive spell"],
      ["spell:projectile", "Offensive spell with a projectile"],
      ["spell:area", "Offensive spell on several targets"],
      ["spell:healing", "Healing spell"],
      ["spell:summon", "Summoning spell"],
      ["spell:support", "Other spell"]
    ]
  },
  {
    title: "Skills, features and items",
    keys: [
      ["style:melee", "Skill used like a melee attack"],
      ["style:ranged", "Skill used like a ranged attack"],
      ["style:spell", "Skill used like a spell"],
      ["style:support", "Skill that helps others"],
      ["style:self", "Skill on oneself"],
      ["heroic", "Heroic skill"],
      ["zeroPower", "Zero Power"],
      ["consumable", "Item (potion, elixir\u2026)"],
      ["consumable:offensive", "Item thrown at enemies"],
      ["ritual", "Ritual"]
    ]
  },
  {
    title: "Basic actions",
    keys: [
      ["act:guard", "Guard"],
      ["act:study", "Study"],
      ["act:hinder", "Hinder"]
    ]
  },
  {
    title: "Reactions of the target",
    keys: [
      ["react:hit", "Hit"],
      ["react:heavy", "Critical or big hit"],
      ["react:guarding", "Hit while guarding"],
      ["react:miss", "Missed"],
      ["react:defeat", "Reduced to 0 HP"]
    ]
  }
];
var DEFAULT_RULES = {
  "weapon:sword": "sword-slash",
  "weapon:dagger": "thrust",
  "weapon:flail": "sword-slash",
  "weapon:heavy": "heavy-slash",
  "weapon:spear": "spear-attack",
  "weapon:brawling": "unarmed-attack",
  "weapon:arcane": "staff-attack",
  "weapon:bow": "bow-attack",
  "weapon:firearm": "firearm-shot",
  "weapon:thrown": "throw",
  "weapon:shield": "unarmed-attack",
  "weapon:melee": "sword-slash",
  "weapon:ranged": "throw",
  "basic:melee": "sword-slash",
  "basic:ranged": "projectile-cast",
  "basic:ranged:arrow": "bow-attack",
  "basic:ranged:bullet": "firearm-shot",
  "spell:offensive": "magic-cast",
  "spell:projectile": "projectile-cast",
  "spell:area": "area-cast",
  "spell:healing": "healing",
  "spell:summon": "summoning",
  "spell:support": "channel",
  "style:melee": "sword-slash",
  "style:ranged": "projectile-cast",
  "style:spell": "magic-cast",
  "style:support": "channel",
  "style:self": "charge",
  heroic: "heavy-slash",
  "heroic:spell": "area-cast",
  zeroPower: "charge",
  consumable: "healing",
  "consumable:offensive": "throw",
  ritual: "channel",
  "act:guard": "guard",
  "act:study": NONE,
  "act:hinder": "projectile-cast",
  "react:hit": "light-hit",
  "react:heavy": "heavy-hit",
  "react:guarding": "block",
  "react:miss": "dodge",
  "react:defeat": "defeat",
  // last resorts by family, when nothing more specific matches or the rig lacks the roles
  attack: "sword-slash",
  magic: "magic-cast",
  support: "channel",
  ...creatureRules()
};
function creatureRules() {
  const out = {};
  const beast = (tpl, o) => {
    Object.assign(out, {
      [`attack@${tpl}`]: "bite",
      [`basic:ranged@${tpl}`]: o.ranged,
      [`magic@${tpl}`]: o.magic,
      [`support@${tpl}`]: "roar",
      [`style:self@${tpl}`]: "roar",
      [`heroic@${tpl}`]: o.big,
      [`zeroPower@${tpl}`]: o.big,
      [`act:guard@${tpl}`]: o.guard,
      [`act:hinder@${tpl}`]: "roar",
      [`react:hit@${tpl}`]: "beast-hit",
      [`react:heavy@${tpl}`]: "beast-hit",
      [`react:guarding@${tpl}`]: "beast-hit",
      [`react:miss@${tpl}`]: "beast-dodge",
      [`react:defeat@${tpl}`]: "beast-defeat"
    });
  };
  beast("quadruped", { magic: "roar", ranged: "roar", big: "pounce", guard: "crouch" });
  beast("winged", { magic: "breath", ranged: "breath", big: "wing-beat", guard: "crouch" });
  beast("serpentine", { magic: "breath", ranged: "breath", big: "tail-swipe", guard: "crouch" });
  out["spell:area@winged"] = "wing-beat";
  Object.assign(out, {
    "attack@blob": "blob-attack",
    "magic@blob": "generic-cast",
    "support@blob": "generic-cast",
    "react:hit@blob": "blob-hit",
    "react:heavy@blob": "blob-hit",
    "react:guarding@blob": "blob-hit",
    "react:miss@blob": "generic-dodge",
    "react:defeat@blob": "blob-defeat",
    "react:defeat@floating": "float-defeat"
  });
  return out;
}
var GENERIC = {
  attack: "generic-attack",
  magic: "generic-cast",
  support: "generic-cast",
  "react:hit": "generic-hit",
  "react:heavy": "generic-hit",
  "react:guarding": "generic-hit",
  "react:miss": "generic-dodge",
  "react:defeat": "generic-defeat"
};
var CLIP_FALLBACKS = {
  "bow-attack": ["projectile-cast", "magic-cast"],
  "firearm-shot": ["projectile-cast", "magic-cast"],
  throw: ["projectile-cast", "magic-cast"],
  "spear-attack": ["thrust", "sword-slash"],
  thrust: ["sword-slash"],
  "dual-wield-attack": ["sword-slash"],
  "staff-attack": ["sword-slash"],
  "unarmed-attack": ["thrust", "sword-slash"],
  "heavy-slash": ["sword-slash"],
  "projectile-cast": ["magic-cast"],
  "area-cast": ["magic-cast"],
  summoning: ["area-cast", "magic-cast"],
  healing: ["channel", "magic-cast"],
  channel: ["magic-cast"],
  charge: ["magic-cast"],
  block: ["guard", "light-hit"],
  guard: ["block"],
  dodge: ["light-hit"],
  "heavy-hit": ["light-hit"],
  stagger: ["heavy-hit", "light-hit"],
  knockback: ["heavy-hit", "light-hit"],
  knockdown: ["heavy-hit", "light-hit"],
  defeat: ["knockdown", "heavy-hit"],
  bite: ["generic-attack"],
  claw: ["bite", "generic-attack"],
  pounce: ["bite", "generic-attack"],
  "tail-swipe": ["bite", "generic-attack"],
  "wing-beat": ["roar", "generic-cast"],
  breath: ["roar", "generic-cast"],
  roar: ["generic-cast"],
  crouch: ["generic-hit"],
  "beast-hit": ["light-hit", "generic-hit"],
  "beast-dodge": ["dodge", "generic-dodge"],
  "beast-defeat": ["defeat", "generic-defeat"],
  "blob-attack": ["generic-attack"],
  "blob-hit": ["generic-hit"],
  "blob-defeat": ["generic-defeat"],
  "float-defeat": ["defeat", "generic-defeat"]
};
function emptyTable() {
  return { rules: {}, abilities: {} };
}
function parseTable(raw) {
  const out = emptyTable();
  const r = raw;
  for (const k4 of ["rules", "abilities"]) {
    const src = r?.[k4];
    if (!src || typeof src !== "object") continue;
    for (const [key, clip2] of Object.entries(src)) if (typeof key === "string" && typeof clip2 === "string" && clip2) out[k4][key] = clip2;
  }
  return out;
}
var HEAL_WORDS = /\b(heal|healing|cure|recover|recovery|regen|regenerat|restor|revive|resurrect|life|mend|remedy|aid)/i;
var SUMMON_WORDS = /\b(summon|conjur|familiar|invoc|invok|call forth)/i;
var ARROWS = /arrow|bolt/i;
var BULLETS = /bullet|shot|gun/i;
var RANGED_CATS = /* @__PURE__ */ new Set(["bow", "firearm", "thrown"]);
function ruleKeys(a) {
  const keys = [];
  const cat = a.weaponCategory ?? null;
  const style = a.fuaStyle && a.fuaStyle !== "none" ? a.fuaStyle : null;
  switch (a.kind) {
    case "weapon":
    case "shield": {
      if (a.kind === "shield") keys.push("weapon:shield");
      else if (cat) keys.push(`weapon:${cat}`);
      keys.push(a.ranged || RANGED_CATS.has(cat ?? "") ? "weapon:ranged" : "weapon:melee", "attack");
      break;
    }
    case "basic": {
      if (a.ranged) {
        if (a.projectile && ARROWS.test(a.projectile)) keys.push("basic:ranged:arrow");
        else if (a.projectile && BULLETS.test(a.projectile)) keys.push("basic:ranged:bullet");
        keys.push("basic:ranged");
      } else keys.push("basic:melee");
      keys.push("attack");
      break;
    }
    case "spell": {
      if (a.summon) keys.push("spell:summon");
      if (a.offensive) {
        if (a.area) keys.push("spell:area");
        if (a.projectile) keys.push("spell:projectile");
        keys.push("spell:offensive", "magic");
      } else {
        if (a.healing) keys.push("spell:healing");
        keys.push("spell:support", "support");
      }
      break;
    }
    case "heroic": {
      if (style === "spell" || style === "support") keys.push("heroic:spell");
      keys.push("heroic");
      keys.push(...styleKeys(a, style));
      break;
    }
    case "zeroPower":
      keys.push("zeroPower", ...styleKeys(a, style));
      break;
    case "consumable":
      if (a.offensive) keys.push("consumable:offensive");
      keys.push("consumable", "support");
      break;
    case "ritual":
      keys.push("ritual", "support");
      break;
    case "action":
      if (a.action) keys.push(`act:${a.action}`);
      break;
    default:
      keys.push(...styleKeys(a, style));
  }
  return [...new Set(keys)];
}
function styleKeys(a, style) {
  const s = style ?? (a.offensive ? a.weaponCategory ? RANGED_CATS.has(a.weaponCategory) ? "ranged" : "melee" : "spell" : a.healing ? "support" : "self");
  const keys = [];
  if (s === "melee" || s === "ranged") {
    if (a.weaponCategory) keys.push(`weapon:${a.weaponCategory}`);
    keys.push(`style:${s}`, "attack");
  } else if (s === "spell") keys.push("style:spell", "magic");
  else if (s === "support") keys.push(...a.healing ? ["spell:healing"] : [], "style:support", "support");
  else if (s === "self") keys.push("style:self", "support");
  return keys;
}
function reactionKeys(r) {
  if (r.defeated) return ["react:defeat", "react:heavy", "react:hit"];
  if (r.result === "miss") return ["react:miss"];
  if (r.result !== "hit") return [];
  if (r.guarding) return ["react:guarding", "react:hit"];
  if (r.critical || (r.damageFraction ?? 0) >= 0.3) return ["react:heavy", "react:hit"];
  return ["react:hit"];
}
function resolveClip(a, layers = {}) {
  return resolveKeys(a.key, ruleKeys(a), layers);
}
function resolveReaction(r, layers = {}) {
  const keys = reactionKeys(r);
  if (!keys.length) return { clip: null, source: null, key: null, candidates: [] };
  return resolveKeys(null, keys, { ...layers, item: null });
}
function resolveKeys(abilityKey, rules, layers) {
  const tpl = layers.template ?? null;
  const chosen = [];
  const look = (table, keys, source) => {
    if (!table) return;
    const order = tpl ? [...keys.map((k4) => `${k4}@${tpl}`), ...keys] : keys;
    for (const kv of order) if (table[kv]) chosen.push({ clip: table[kv], source, key: kv });
  };
  const allKeys = [...abilityKey ? [abilityKey] : [], ...rules];
  if (layers.item) look(layers.item, ["*", ...allKeys], "item");
  look(layers.actor, allKeys, "actor");
  if (abilityKey) look(layers.world?.abilities, [abilityKey], "ability");
  look(layers.world?.rules, rules, "rule");
  look(DEFAULT_RULES, rules, "default");
  const first = chosen[0];
  if (!first || first.clip === NONE) return { clip: null, source: first?.source ?? null, key: first?.key ?? null, candidates: [] };
  const candidates = [];
  const add = (c) => {
    if (c && c !== NONE && !candidates.includes(c)) candidates.push(c);
  };
  add(first.clip);
  for (const c of CLIP_FALLBACKS[first.clip] ?? []) add(c);
  for (const c of chosen.slice(1)) {
    if (c.clip === NONE) break;
    add(c.clip);
    for (const f of CLIP_FALLBACKS[c.clip] ?? []) add(f);
  }
  for (const k4 of rules) if (GENERIC[k4]) add(GENERIC[k4]);
  return { clip: first.clip, source: first.source, key: first.key, candidates };
}
function normName(s) {
  return String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function ruleLabel(key) {
  const [base2, tpl] = key.split("@");
  for (const g of RULE_GROUPS) for (const [k4, label] of g.keys) if (k4 === base2) return tpl ? `${label} (${tpl})` : label;
  return key;
}

// src/mapping/projectfu.ts
var val = (x) => x && typeof x === "object" && "value" in x ? x.value : x;
function isZeroPower(item) {
  return item?.type === "optionalFeature" && item?.system?.optionalType === "projectfu.zeroPower";
}
function kindOf(item) {
  if (!item) return "other";
  if (isZeroPower(item)) return "zeroPower";
  switch (item.type) {
    case "weapon":
    case "customWeapon":
      return "weapon";
    case "shield":
      return "shield";
    case "basic":
      return "basic";
    case "spell":
      return "spell";
    case "skill":
    case "miscAbility":
      return "skill";
    case "heroic":
      return "heroic";
    case "consumable":
      return "consumable";
    case "ritual":
      return "ritual";
    case "classFeature":
    case "optionalFeature":
      return "feature";
    default:
      return "other";
  }
}
function abilityKeyOf(item) {
  if (!item) return null;
  const fuid = item.system?.fuid ?? item.flags?.projectfu?.fuid;
  if (typeof fuid === "string" && fuid) return fuid;
  const n = normName(item.name);
  return n ? `${item.type}:${n}` : null;
}
function mainHandCategory(actor) {
  const items = actor?.items;
  if (!items) return null;
  const get = (id) => typeof id === "string" ? items.get?.(id) ?? [...items].find((i) => i.id === id) : null;
  const eq = actor.system?.equipped ?? {};
  for (const slot of ["mainHand", "offHand"]) {
    const it = get(eq[slot]);
    if (it && (it.type === "weapon" || it.type === "customWeapon")) return val(it.system?.category) ?? null;
  }
  return null;
}
function damageTypeOf(item, check) {
  const fromCheck = check?.additionalData?.damage?.type;
  if (fromCheck) return fromCheck;
  const d = item?.system?.damageType ?? item?.system?.damage?.type;
  const v = val(d);
  return typeof v === "string" && v ? v : null;
}
function describeItem(item, ctx = {}) {
  const check = ctx.check ?? null;
  const action = check?.additionalData?.ruleDefinedAction ?? null;
  if (!item && action) return { kind: "action", name: action, key: `act:${action}`, action };
  const kind = kindOf(item);
  const sys = item?.system ?? {};
  const name = String(item?.name ?? "");
  const damageType = damageTypeOf(item, check);
  const targets = ctx.targets ?? check?.additionalData?.targets?.length ?? 0;
  let weaponCategory = null;
  let ranged = false;
  if (kind === "weapon" || kind === "shield") {
    weaponCategory = kind === "shield" ? "shield" : val(sys.category) ?? null;
    ranged = val(sys.type) === "ranged";
  } else if (kind === "basic") {
    ranged = val(sys.type) === "ranged";
  } else {
    weaponCategory = mainHandCategory(ctx.actor);
  }
  const isOffSpell = kind === "spell" ? !!val(sys.isOffensive) : false;
  const offensive = isOffSpell || ["accuracy", "magic"].includes(check?.type ?? "") || !!damageType || kind === "weapon" || kind === "basic";
  const text = `${name} ${typeof sys.description === "string" ? sys.description.replace(/<[^>]+>/g, " ").slice(0, 400) : ""}`;
  const healing = !offensive && HEAL_WORDS.test(text);
  const summon = SUMMON_WORDS.test(name);
  const rule = val(sys.targeting?.rule);
  const area = offensive && (rule === "multiple" || targets >= 2);
  const fuaStyle = ctx.fua?.style ?? null;
  const projectile = ctx.fua?.projectile ?? null;
  return {
    kind,
    name,
    key: abilityKeyOf(item),
    weaponCategory,
    ranged,
    offensive,
    damageType,
    healing,
    summon,
    area,
    fuaStyle,
    projectile: typeof projectile === "string" ? projectile : null,
    action: null
  };
}

// src/mapping/sync.ts
function contactTime(clip2) {
  const ev2 = clip2.events?.find((e) => e.name === "contact");
  if (ev2) return ev2.t;
  return clip2.phases?.impact ?? null;
}
function timingForContact(clip2, target) {
  const c = contactTime(clip2);
  const a = clip2.phases?.anticipation;
  if (c === null || !a) return void 0;
  const len = a[1] - a[0];
  if (!(len > 0) || c < a[1] - 1e-6) return void 0;
  const m = Math.min(2.5, Math.max(0.6, 1 + (target - c) / len));
  return Math.abs(m - 1) < 0.02 ? void 0 : { anticipation: m };
}
function estimateFuaContact(style, o = {}) {
  switch (style) {
    case "melee":
      return o.dash === false ? 0.15 : o.heavy ? 0.58 : 0.45;
    case "ranged":
      return o.projectile === false ? 0.45 : 0.62;
    case "spell":
      return o.projectile ? 0.62 : o.heavy ? 0.95 : 0.55;
    case "support":
      return 0.55;
    default:
      return 0.45;
  }
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

// src/core/clip.ts
var STRIDE = 5;
function segmentIndex(keys, t) {
  let lo = 0;
  let hi = keys.length - 1;
  while (lo < hi) {
    const mid2 = lo + hi + 1 >> 1;
    if (keys[mid2].t <= t) lo = mid2;
    else hi = mid2 - 1;
  }
  return lo;
}
function sampleKeys(keys, t, fallback = 0, rest) {
  if (!keys || keys.length === 0) return fallback;
  const val2 = (key) => key.rest && rest !== void 0 ? rest : key.v;
  const first = keys[0];
  if (keys.length === 1 || t <= first.t) return val2(first);
  const last = keys[keys.length - 1];
  if (t >= last.t) return val2(last);
  const i = segmentIndex(keys, t);
  const a = keys[i];
  const b = keys[i + 1];
  const span = b.t - a.t;
  const k4 = span > 0 ? easeFn(a.e)((t - a.t) / span) : 1;
  return val2(a) + (val2(b) - val2(a)) * k4;
}
function restAngle(keys, setupWorld, mirror) {
  const a = mirror ? 180 - setupWorld : setupWorld;
  const ref = keys.find((key) => !key.rest);
  return ref ? ref.v + wrapDeg(a - ref.v) : a;
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
  const k4 = span > 0 ? easeFn(a.e)((t - a.t) / span) : 1;
  return [a.x + (b.x - a.x) * k4, a.y + (b.y - a.y) * k4];
}
var TimeWarp = class {
  segs = [];
  duration;
  constructor(clip2, timing = {}, actionJitter = 1) {
    const ph = clip2.phases ?? {};
    const ranges = [];
    const add = (r, m) => {
      if (!r) return;
      const lo = Math.max(0, Math.min(r[0], r[1]));
      const hi = Math.min(clip2.duration, Math.max(r[0], r[1]));
      if (hi > lo) ranges.push({ r: [lo, hi], m: Math.max(0.05, m ?? 1) });
    };
    add(ph.anticipation, timing.anticipation);
    add(ph.action, (timing.action ?? 1) * actionJitter);
    add(ph.recovery, timing.recovery);
    const cuts = /* @__PURE__ */ new Set([0, clip2.duration]);
    for (const { r } of ranges) {
      cuts.add(r[0]);
      cuts.add(r[1]);
    }
    const points = [...cuts].sort((a, b) => a - b);
    let p = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const c0 = points[i];
      const c12 = points[i + 1];
      const mid2 = (c0 + c12) / 2;
      const m = ranges.find(({ r }) => mid2 > r[0] && mid2 < r[1])?.m ?? 1;
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
function evaluateClip(clip2, t, ctx, out, mask, angles) {
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
    const track2 = role ? clip2.tracks[role] : void 0;
    const s = sk.setup[i];
    const o = i * STRIDE;
    const p = sk.parent[i];
    const inherits = p >= 0 && bone2.inheritRotation !== false;
    const parentAngle = inherits ? angles[p] : 0;
    if (track2 && sk.roles.get(role) === i) {
      const k4 = ctx.intensity * (ctx.amp ? ctx.amp(role) : 1);
      mask[i] = 1;
      if (track2.translate) {
        const [x, y] = sampleKeys2(track2.translate, t);
        out[o + 1] = x * H * k4 * sign;
        out[o + 2] = y * H * k4;
      }
      if (track2.scale) {
        const [x, y] = sampleKeys2(track2.scale, t, 1, 1);
        out[o + 3] = (x - 1) * k4;
        out[o + 4] = (y - 1) * k4;
      }
      if (track2.rotate && track2.rotate.length) {
        if (track2.space === "world") {
          const parentSetup = inherits ? sk.setupAngle[p] : 0;
          const rest = restAngle(track2.rotate, parentSetup + s.rot, ctx.mirror);
          const first = mirrorAngle(sampleKeys(track2.rotate, -1, 0, rest)) - parentSetup - s.rot;
          const turns = wrapDeg(first) - first;
          const d = mirrorAngle(sampleKeys(track2.rotate, t, 0, rest)) - parentAngle - s.rot + turns;
          out[o] = d * k4;
        } else {
          out[o] = sampleKeys(track2.rotate, t, 0, 0) * k4 * sign;
        }
      }
    }
    angles[i] = parentAngle + s.rot + out[o];
  }
}
function missingRoles(clip2, skeleton) {
  const need = clip2.requires ?? Object.keys(clip2.tracks);
  return need.filter((r) => !skeleton.roles.has(r));
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
    ws.forEach(([j, w], k4) => {
      bones[v * MAX_INFLUENCES + k4] = j;
      weights[v * MAX_INFLUENCES + k4] = w;
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
  const k4 = g.part.deform === "mesh" ? Math.max(0, Math.min(1, g.part.stiffness)) : 1;
  for (let v = 0; v < n; v++) {
    const x = rest[v * 2];
    const y = rest[v * 2 + 1];
    let ox = 0;
    let oy = 0;
    if (k4 < 1) {
      for (let i = 0; i < MAX_INFLUENCES; i++) {
        const j = bones[v * MAX_INFLUENCES + i];
        if (j < 0) break;
        const w = weights[v * MAX_INFLUENCES + i];
        const m = skins[j];
        ox += (m.a * x + m.c * y + m.tx) * w;
        oy += (m.b * x + m.d * y + m.ty) * w;
      }
    }
    if (k4 > 0) {
      const rx = own.a * x + own.c * y + own.tx;
      const ry = own.b * x + own.d * y + own.ty;
      ox = ox * (1 - k4) + rx * k4;
      oy = oy * (1 - k4) + ry * k4;
    }
    out[v * 2] = ox + offsetX;
    out[v * 2 + 1] = oy + offsetY;
  }
}
function drawOrder(geoms, overrides) {
  let order = geoms.map((_, i) => i);
  if (!overrides.size) return order;
  const firstOf = (bone2) => geoms.findIndex((g) => g.boneIndex === bone2);
  const moves = [...overrides.entries()].filter(([b]) => firstOf(b) >= 0).sort((a, b) => firstOf(a[0]) - firstOf(b[0]));
  for (const [bone2, o] of moves) {
    const movers = order.filter((i) => geoms[i].boneIndex === bone2);
    const rest = order.filter((i) => geoms[i].boneIndex !== bone2);
    let at;
    if (o.behind !== void 0) at = rest.findIndex((i) => geoms[i].boneIndex === o.behind);
    else {
      const last = rest.map((i) => geoms[i].boneIndex).lastIndexOf(o.front);
      at = last < 0 ? -1 : last + 1;
    }
    if (at < 0) continue;
    rest.splice(at, 0, ...movers);
    order = rest;
  }
  return order;
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
    for (let k4 = 0; k4 < f.indices.length; k4++) put(l, f.indices[k4], f.rgba, k4 * 4);
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
    for (let k4 = 0; k4 < indices.length; k4++) {
      const s = src[indices[k4]] * 4;
      rgba[k4 * 4] = data[s];
      rgba[k4 * 4 + 1] = data[s + 1];
      rgba[k4 * 4 + 2] = data[s + 2];
      rgba[k4 * 4 + 3] = data[s + 3];
    }
    out.set(label, { indices, rgba });
  }
  return out;
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
    let k4 = this.size++;
    while (k4 > 0) {
      const p = k4 - 1 >> 1;
      if (this.cost[p] <= c) break;
      this.cost[k4] = this.cost[p];
      this.idx[k4] = this.idx[p];
      k4 = p;
    }
    this.cost[k4] = c;
    this.idx[k4] = i;
  }
  /** Pop the smallest; returns the index and leaves its cost in `lastCost`. */
  lastCost = 0;
  pop() {
    const top = this.idx[0];
    this.lastCost = this.cost[0];
    const c = this.cost[--this.size];
    const i = this.idx[this.size];
    let k4 = 0;
    for (; ; ) {
      let m = 2 * k4 + 1;
      if (m >= this.size) break;
      if (m + 1 < this.size && this.cost[m + 1] < this.cost[m]) m++;
      if (this.cost[m] >= c) break;
      this.cost[k4] = this.cost[m];
      this.idx[k4] = this.idx[m];
      k4 = m;
    }
    this.cost[k4] = c;
    this.idx[k4] = i;
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
    for (let k4 = 0; k4 <= steps; k4++) {
      const t = t0 + (t1 - t0) * k4 / steps;
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
          for (let k4 = 0; k4 < 8; k4++) if (!seq[k4] && seq[k4 + 1]) a++;
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
function mainBounds(img, alphaMin = 1) {
  const { width: w, height: h2, data } = img;
  const mask = new Uint8Array(w * h2);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] >= alphaMin ? 1 : 0;
  const comps = components2(mask, w, h2);
  if (!comps.length) return null;
  const total = comps.reduce((s, c) => s + c.length, 0);
  const biggest = comps.reduce((a, b) => b.length > a.length ? b : a);
  let x0 = w, y0 = h2, x1 = -1, y1 = -1;
  for (const c of comps) {
    if (c !== biggest && c.length < total * 0.04) continue;
    for (const i of c) {
      const x = i % w, y = (i - x) / w;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
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
    for (let k4 = 0; k4 < 8; k4++) if (!r[k4] && r[(k4 + 1) % 8]) a++;
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
    for (let k4 = 1; k4 < path.length; k4++) len += Math.hypot(px(path[k4 - 1]) - px(path[k4]), py(path[k4 - 1]) - py(path[k4]));
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
    for (let k4 = 2; k4 < b.path.length; k4++) {
      const pk = b.path[k4];
      const L = Math.hypot(px(pk) - px(p0), py(pk) - py(p0)) || 1;
      const tol = Math.max(1.25, L * 0.04);
      let ok = true;
      for (let j = 1; j < k4 && ok; j++) {
        const q = b.path[j];
        const dev = Math.abs((px(pk) - px(p0)) * (py(p0) - py(q)) - (px(p0) - px(q)) * (py(pk) - py(p0))) / L;
        if (dev > tol) ok = false;
      }
      if (!ok) break;
      keep = k4 + 1;
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
    const mid2 = (weaponFound.tip[0] + weaponFound.hilt[0]) / 2;
    const side = mid2 - centre;
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
    const mid2 = legRows(c0 + len * 0.35, c0 + len * 0.65);
    const lo = legRows(c0 + len * 0.75, c12);
    hipY = c0 - H * 0.03;
    const kneeY = (c0 + ankleY) / 2;
    hipF = [hi.front, hipY];
    hipB = [hi.back, hipY];
    kneeF = [mid2.n ? mid2.front : hi.front, kneeY];
    kneeB = [mid2.n ? mid2.back : hi.back, kneeY];
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
var Q = { body: "#c9a36b", head: "#f2c45a", near: "#7ad08f", far: "#4f9163", tail: "#d98a5a", wing: "#9a8cf2", wingFar: "#6a5cb5" };
var QUADRUPED = {
  id: "quadruped",
  name: "Four-legged beast",
  description: "Body, head on a neck, tail, four legs. Wolves, cats, horses, boars, side view.",
  bones: [
    { id: "root", name: "Root", role: "root", parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
    { id: "body", name: "Body", role: "torso", parent: "root", from: [0.24, 0.5], to: [0.74, 0.46], color: Q.body, part: { deform: "mesh", softness: 0.05, reach: 0.04 } },
    { id: "neck", name: "Neck", role: "neck", parent: "body", from: [0.74, 0.46], to: [0.82, 0.3], color: Q.head },
    { id: "head", name: "Head", role: "head", parent: "neck", from: [0.82, 0.3], to: [1, 0.24], color: Q.head, part: { deform: "rigid", reach: 0.06 } },
    { id: "tail", name: "Tail", role: "tail", parent: "body", from: [0.22, 0.44], to: [0.09, 0.3], color: Q.tail, part: { deform: "mesh", softness: 0.04 } },
    { id: "tail_tip", name: "Tail tip", role: "tail.tip", parent: "tail", from: [0.09, 0.3], to: [0, 0.16], color: Q.tail, part: { deform: "mesh", softness: 0.04 } },
    { id: "leg_hind_far", name: "Far hind leg", role: "leg.hind.far", parent: "body", from: [0.3, 0.6], to: [0.3, 0.99], color: Q.far, part: { deform: "mesh", softness: 0.04 } },
    { id: "leg_front_far", name: "Far foreleg", role: "leg.front.far", parent: "body", from: [0.7, 0.6], to: [0.7, 0.99], color: Q.far, part: { deform: "mesh", softness: 0.04 } },
    { id: "leg_hind_near", name: "Near hind leg", role: "leg.hind.near", parent: "body", from: [0.24, 0.6], to: [0.24, 0.99], color: Q.near, part: { deform: "mesh", softness: 0.04 } },
    { id: "leg_front_near", name: "Near foreleg", role: "leg.front.near", parent: "body", from: [0.64, 0.6], to: [0.64, 0.99], color: Q.near, part: { deform: "mesh", softness: 0.04 } }
  ],
  drawOrder: ["leg_hind_far", "leg_front_far", "tail", "tail_tip", "body", "leg_hind_near", "leg_front_near", "head"]
};
var WINGED = {
  id: "winged",
  name: "Winged creature",
  description: "A beast with wings: body, long neck, head, two wings, tail, four legs. Dragons, griffins, side view.",
  bones: [
    { id: "root", name: "Root", role: "root", parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
    { id: "body", name: "Body", role: "torso", parent: "root", from: [0.3, 0.6], to: [0.7, 0.54], color: Q.body, part: { deform: "mesh", softness: 0.05, reach: 0.04 } },
    { id: "neck", name: "Neck", role: "neck", parent: "body", from: [0.7, 0.54], to: [0.8, 0.27], color: Q.head, part: { deform: "mesh", softness: 0.05 } },
    { id: "head", name: "Head", role: "head", parent: "neck", from: [0.8, 0.27], to: [1, 0.24], color: Q.head, part: { deform: "rigid", reach: 0.04 } },
    { id: "wing_far", name: "Far wing", role: "wing.far", parent: "body", from: [0.58, 0.46], to: [0.64, 0.04], color: Q.wingFar, part: { deform: "mesh", softness: 0.06, fill: false } },
    { id: "wing_near", name: "Near wing", role: "wing.near", parent: "body", from: [0.46, 0.46], to: [0.14, 0.12], color: Q.wing, part: { deform: "mesh", softness: 0.06, fill: false } },
    { id: "tail", name: "Tail", role: "tail", parent: "body", from: [0.28, 0.62], to: [0.06, 0.8], color: Q.tail, part: { deform: "mesh", softness: 0.05 } },
    { id: "tail_tip", name: "Tail tip", role: "tail.tip", parent: "tail", from: [0.06, 0.8], to: [0.2, 0.98], color: Q.tail, part: { deform: "mesh", softness: 0.05 } },
    { id: "leg_hind_far", name: "Far hind leg", role: "leg.hind.far", parent: "body", from: [0.38, 0.66], to: [0.38, 0.99], color: Q.far, part: { deform: "mesh", softness: 0.04 } },
    { id: "leg_front_far", name: "Far foreleg", role: "leg.front.far", parent: "body", from: [0.72, 0.64], to: [0.72, 0.99], color: Q.far, part: { deform: "mesh", softness: 0.04 } },
    { id: "leg_hind_near", name: "Near hind leg", role: "leg.hind.near", parent: "body", from: [0.33, 0.66], to: [0.33, 0.99], color: Q.near, part: { deform: "mesh", softness: 0.04 } },
    { id: "leg_front_near", name: "Near foreleg", role: "leg.front.near", parent: "body", from: [0.66, 0.64], to: [0.66, 0.99], color: Q.near, part: { deform: "mesh", softness: 0.04 } }
  ],
  drawOrder: ["wing_far", "leg_hind_far", "leg_front_far", "tail", "tail_tip", "body", "neck", "head", "leg_hind_near", "leg_front_near", "wing_near"]
};
var SERPENTINE = {
  id: "serpentine",
  name: "Serpent",
  description: "A long body raised at the front: tail, body, neck, head. Snakes, eels, worms, nagas\u2019 lower body.",
  bones: [
    { id: "root", name: "Root", role: "root", parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
    { id: "body", name: "Body", role: "torso", parent: "root", from: [0.42, 0.86], to: [0.66, 0.72], color: Q.body, part: { deform: "mesh", softness: 0.06 } },
    { id: "neck", name: "Neck", role: "neck", parent: "body", from: [0.66, 0.72], to: [0.78, 0.3], color: Q.head, part: { deform: "mesh", softness: 0.06 } },
    { id: "head", name: "Head", role: "head", parent: "neck", from: [0.78, 0.3], to: [1, 0.22], color: Q.head, part: { deform: "rigid", reach: 0.04 } },
    { id: "tail", name: "Tail", role: "tail", parent: "body", from: [0.42, 0.86], to: [0.18, 0.9], color: Q.tail, part: { deform: "mesh", softness: 0.06 } },
    { id: "tail_tip", name: "Tail tip", role: "tail.tip", parent: "tail", from: [0.18, 0.9], to: [0, 0.8], color: Q.tail, part: { deform: "mesh", softness: 0.06 } }
  ],
  drawOrder: ["tail_tip", "tail", "body", "neck", "head"]
};
var FLOATING = {
  id: "floating",
  name: "Floating spirit",
  description: "No legs: head, body, two arms and a trailing lower body. Ghosts, wraiths, elementals, front or side view.",
  bones: [
    { id: "root", name: "Root", role: "root", parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
    { id: "torso", name: "Body", role: "torso", parent: "root", from: [0.5, 0.74], to: [0.5, 0.3], color: C.body, part: { deform: "mesh", softness: 0.05, reach: 0.04 } },
    { id: "head", name: "Head", role: "head", parent: "torso", from: [0.5, 0.3], to: [0.5, 0], color: C.head, part: { deform: "rigid", reach: 0.06 } },
    { id: "arm_upper_back", name: "Back arm", role: "arm.upper.back", parent: "torso", from: [0.34, 0.34], to: [0.2, 0.46], color: C.armB, part: { deform: "mesh", softness: 0.04 } },
    { id: "arm_lower_back", name: "Back forearm", role: "arm.lower.back", parent: "arm_upper_back", from: [0.2, 0.46], to: [0.04, 0.56], color: C.armB, part: { deform: "mesh", softness: 0.04 } },
    { id: "arm_upper_front", name: "Front arm", role: "arm.upper.front", parent: "torso", from: [0.66, 0.34], to: [0.8, 0.46], color: C.armF, part: { deform: "mesh", softness: 0.04 } },
    { id: "arm_lower_front", name: "Front forearm", role: "arm.lower.front", parent: "arm_upper_front", from: [0.8, 0.46], to: [0.96, 0.56], color: C.armF, part: { deform: "mesh", softness: 0.04 } },
    { id: "tail", name: "Trail", role: "tail", parent: "torso", from: [0.5, 0.74], to: [0.5, 0.88], color: Q.tail, part: { deform: "mesh", softness: 0.06 } },
    { id: "tail_tip", name: "Trail tip", role: "tail.tip", parent: "tail", from: [0.5, 0.88], to: [0.5, 1], color: Q.tail, part: { deform: "mesh", softness: 0.06 } }
  ],
  drawOrder: ["arm_upper_back", "arm_lower_back", "tail_tip", "tail", "torso", "head", "arm_upper_front", "arm_lower_front"]
};
var BLOB = {
  id: "blob",
  name: "Blob",
  description: "A soft body that squashes and stretches, with whatever sits on top (eye stalk, crown, flame). Slimes, puddings, flans.",
  bones: [
    { id: "root", name: "Root", role: "root", parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
    { id: "body", name: "Body", role: "torso", parent: "root", from: [0.5, 0.98], to: [0.5, 0.42], color: Q.body, part: { deform: "mesh", softness: 0.2, reach: 0.06 } },
    { id: "crest", name: "Top", role: "crest", parent: "body", from: [0.5, 0.42], to: [0.5, 0], color: Q.head, part: { deform: "mesh", softness: 0.06 } }
  ],
  drawOrder: ["body", "crest"]
};
var TEMPLATES = { humanoid: HUMANOID, quadruped: QUADRUPED, winged: WINGED, serpentine: SERPENTINE, floating: FLOATING, blob: BLOB, custom: CUSTOM };
var TEMPLATE_LIST = [HUMANOID, QUADRUPED, WINGED, SERPENTINE, FLOATING, BLOB, CUSTOM];
var KNOWN_ROLES = [.../* @__PURE__ */ new Set([...TEMPLATE_LIST.flatMap((t) => t.bones.map((b) => b.role)), "hair", "cape", "offhand", "accessory", "jaw"])];
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
function beastFromLandmarks(L, t) {
  const { box } = L;
  const s = L.facing === "right" ? 1 : -1;
  const prop = ([u, v]) => [box.x + (s > 0 ? u : 1 - u) * box.width, box.y + v * box.height];
  const legTop = (l) => [l.top[0], L.belly - L.thickness * 0.25];
  const ground = box.y + box.height - 1;
  const place = {
    root: [[box.x + box.width / 2, ground + 1], [box.x + box.width / 2 + s * box.height * 0.12, ground + 1]],
    body: [L.hip, L.shoulder],
    neck: [L.shoulder, L.head.base],
    head: [L.head.base, L.head.tip],
    leg_hind_near: [legTop(L.legs.hindNear), L.legs.hindNear.foot],
    leg_hind_far: [legTop(L.legs.hindFar), L.legs.hindFar.foot],
    leg_front_near: [legTop(L.legs.frontNear), L.legs.frontNear.foot],
    leg_front_far: [legTop(L.legs.frontFar), L.legs.frontFar.foot]
  };
  if (L.tail) {
    place.tail = [L.tail.base, L.tail.mid];
    place.tail_tip = [L.tail.mid, L.tail.tip];
  }
  if (L.wings) {
    place.wing_near = [L.wings.near.base, L.wings.near.tip];
    place.wing_far = [L.wings.far.base, L.wings.far.tip];
  }
  return buildFromTemplate(t, (tb) => {
    const p = place[tb.id];
    return p ? { from: p[0], to: p[1] } : { from: prop(tb.from), to: prop(tb.to) };
  });
}

// src/sprite/creatures.ts
function runsOf(mask, w, y) {
  const out = [];
  let s = -1;
  for (let x = 0; x <= w; x++) {
    const on = x < w && mask[y * w + x] === 1;
    if (on && s < 0) s = x;
    if (!on && s >= 0) {
      out.push({ x0: s, x1: x - 1 });
      s = -1;
    }
  }
  return out;
}
var mid = (r) => (r.x0 + r.x1) / 2;
var width = (r) => r.x1 - r.x0 + 1;
function detectBeast(img, facingIn = "auto", o = {}) {
  const { width: w, height: h2 } = img;
  const mask = alphaMask(img, 128);
  {
    const comps = components2(mask, w, h2).sort((a, b) => b.length - a.length);
    const keep = new Uint8Array(mask.length);
    const main = comps[0]?.length ?? 0;
    for (const c of comps) if (c.length >= main * 0.15) for (const i of c) keep[i] = 1;
    mask.set(keep);
  }
  let top = h2, bottom = -1, left = w, right = -1;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const x = i % w, y = (i - x) / w;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
    if (x < left) left = x;
    if (x > right) right = x;
  }
  if (bottom < 0) return null;
  const H = bottom - top + 1;
  const W = right - left + 1;
  const notes = [];
  let belly = -1;
  for (let y = bottom; y >= top; y--) {
    const widest = runsOf(mask, w, y).reduce((m, r) => Math.max(m, width(r)), 0);
    if (widest >= W * 0.5) {
      belly = y + 1;
      break;
    }
  }
  if (belly < 0 || bottom - belly < H * 0.1) return null;
  const footRow = bottom - Math.max(1, Math.round(H * 0.03));
  const legs = [];
  for (const r of runsOf(mask, w, footRow)) {
    let pixels = 0;
    let solid = true;
    for (let y = footRow; y >= belly; y--) {
      let n = 0;
      for (let x = r.x0; x <= r.x1; x++) n += mask[y * w + x];
      if (n < width(r) * 0.6) {
        solid = false;
        break;
      }
      pixels += n;
    }
    if (solid && width(r) <= W * 0.3) legs.push({ top: [mid(r), belly], foot: [mid(r), bottom], pixels });
  }
  if (legs.length < 2) return null;
  const xs = legs.map((l) => l.top[0]);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const thick = [];
  for (let x = Math.round(lo); x <= Math.round(hi); x++) {
    let n = 0;
    for (let y = belly - 1; y >= top && mask[y * w + x]; y--) n++;
    if (n > 0) thick.push(n);
  }
  thick.sort((a, b) => a - b);
  const thickness = Math.max(2, thick.length ? thick[thick.length >> 1] : H * 0.25);
  const cy = belly - thickness / 2;
  const backY = belly - thickness;
  const dist = distanceTransform(mask, w, h2);
  const skel = skeletonize(mask, w, h2);
  const P = (i) => [i % w, Math.floor(i / w)];
  const near = (a, b, r) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= r;
  const free = skeletonBranches(skel, w, h2).map((b) => {
    const k4 = Math.max(2, Math.ceil(b.path.length * 0.4));
    const d = b.path.slice(0, k4).map((i) => dist[i]).sort((x, y) => x - y);
    return { end: P(b.path[0]), half: P(b.path[Math.floor(b.path.length / 2)]), length: b.length, girth: d[d.length >> 1] };
  }).filter((e) => !legs.some((l) => near(e.end, l.foot, Math.max(4, thickness * 0.6))) && e.length >= Math.max(3, H * 0.05));
  const used = /* @__PURE__ */ new Set();
  let wingEnds = [];
  if (o.wings) {
    const high = free.filter((e) => e.end[1] < backY - thickness * 0.3).sort((a, b) => a.end[1] - b.end[1]);
    if (high.length) {
      const first = high[0];
      const second = high.find((e) => Math.abs(e.end[0] - first.end[0]) >= W * 0.25);
      wingEnds = second ? [first, second] : [first];
    }
    for (const e of high) used.add(e);
  }
  const rest = free.filter((e) => !used.has(e));
  const headEnd = rest.slice().sort((a, b) => b.girth - a.girth)[0] ?? null;
  let facing = facingIn === "auto" ? "right" : facingIn;
  if (facingIn === "auto" && headEnd) {
    facing = headEnd.end[0] >= (left + right) / 2 ? "right" : "left";
    notes.push(`Facing ${facing}: the head is the thickest end of the silhouette.`);
  }
  const s = facing === "right" ? 1 : -1;
  const front = (x) => x * s;
  const centre = (left + right) / 2;
  legs.sort((a, b) => front(a.foot[0]) - front(b.foot[0]));
  let hind = legs.filter((l) => front(l.foot[0]) < front(centre));
  let fore = legs.filter((l) => front(l.foot[0]) >= front(centre));
  if (!hind.length || !fore.length) {
    hind = legs.slice(0, Math.ceil(legs.length / 2));
    fore = legs.slice(Math.ceil(legs.length / 2));
  }
  const pair = (list) => {
    const sorted = list.slice().sort((a, b) => b.pixels - a.pixels);
    const n = sorted[0];
    const f = sorted[1] ?? { top: [n.top[0] + s, n.top[1]], foot: [n.foot[0] + s, n.foot[1]], pixels: 0 };
    return { near: n, far: f };
  };
  const hp = pair(hind);
  const fp = pair(fore);
  if (legs.length < 4) notes.push(`${legs.length} legs visible; the hidden ones share their place.`);
  const hipX = (hp.near.top[0] + hp.far.top[0]) / 2;
  const shX = (fp.near.top[0] + fp.far.top[0]) / 2;
  const hip = [hipX, cy];
  const shoulder = [shX, cy];
  let tip = null;
  for (let y = top; y < belly; y++) {
    for (let x = left; x <= right; x++) {
      if (!mask[y * w + x]) continue;
      if (!tip || front(x) > front(tip[0])) tip = [x, y];
    }
  }
  if (!tip) return null;
  const neckBase = [shX + s * thickness * 0.15, backY + thickness * 0.25];
  const reach = Math.hypot(tip[0] - neckBase[0], tip[1] - neckBase[1]) || 1;
  const headLen = Math.min(reach * 0.7, thickness * 1.25 + 2);
  const headBase = [tip[0] - (tip[0] - neckBase[0]) / reach * headLen, tip[1] - (tip[1] - neckBase[1]) / reach * headLen];
  let wings = null;
  if (o.wings) {
    const lerpX = (t) => hipX + (shX - hipX) * t;
    if (wingEnds.length) {
      const [back, fwd] = wingEnds.slice().sort((a, b) => front(a.end[0]) - front(b.end[0]));
      wings = { near: { base: [lerpX(0.4), backY + 1], tip: back.end }, far: { base: [lerpX(0.65), backY + 1], tip: fwd ? fwd.end : [back.end[0] + s * W * 0.15, back.end[1]] } };
      notes.push(`Wings found: ${fwd ? "two tips" : "one tip (the other wing is hidden)"}.`);
    } else notes.push("No wing tips found above the back; wings placed by proportion.");
  }
  let tail = null;
  const behindHip = rest.filter((e) => e !== headEnd && front(e.end[0]) < front(hipX) - W * 0.04);
  const low = behindHip.filter((e) => e.end[1] >= backY);
  const tails = (low.length || o.wings ? low : behindHip).sort((a, b) => Math.hypot(b.end[0] - hipX, b.end[1] - cy) - Math.hypot(a.end[0] - hipX, a.end[1] - cy));
  if (tails.length) {
    const t = tails[0];
    tail = { base: [hipX - s * thickness * 0.3, cy - thickness * 0.15], mid: t.half, tip: t.end };
  } else notes.push("No tail found.");
  const conf = (v) => Math.max(0, Math.min(1, v));
  return {
    facing,
    box: { x: left, y: top, width: W, height: H },
    belly,
    thickness,
    hip,
    shoulder,
    legs: { hindNear: hp.near, hindFar: hp.far, frontNear: fp.near, frontFar: fp.far },
    head: { base: headBase, tip },
    neckBase,
    tail,
    wings,
    confidence: { legs: conf(legs.length / 4), head: headEnd ? 0.7 : 0.4, tail: tail ? 0.6 : 0, ...o.wings ? { wings: wings ? 0.6 : 0 } : {} },
    notes
  };
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
  const creature = template.id !== "humanoid" && template.id !== "custom";
  const fitBox = creature ? mainBounds(o.image) ?? bounds : body;
  let beast = null;
  if ((template.id === "quadruped" || template.id === "winged") && o.detect !== false) {
    beast = detectBeast(o.image, o.facing ?? "auto", { wings: template.id === "winged" });
    if (beast) facing = beast.facing;
  }
  const { bones, parts } = landmarks ? humanoidFromLandmarks(landmarks) : beast ? beastFromLandmarks(beast, template) : fitTemplate(template, fitBox, facing);
  const now = Date.now();
  const rig = {
    format: RIG_FORMAT,
    version: RIG_VERSION,
    id: newId("rig"),
    name: o.name,
    template: template.id,
    facing,
    image: { src: o.src, width: o.image.width, height: o.image.height },
    metrics: { bodyHeight: fitBox.height, bounds },
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
  const found = landmarks ?? beast;
  lastReport.set(rig, found ? { method: "landmarks", confidence: found.confidence, notes: found.notes } : { method: "proportions", confidence: {}, notes: [] });
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
  const width2 = Math.round(num(image.width, 0));
  const height = Math.round(num(image.height, 0));
  if (width2 <= 0 || height <= 0) throw new Error("The rig has no image size.");
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
    template: ["humanoid", "quadruped", "winged", "serpentine", "floating", "blob", "custom"].includes(o.template) ? o.template : "custom",
    facing: o.facing === "left" ? "left" : "right",
    image: { src: str(image.src, ""), width: width2, height },
    metrics: {
      bodyHeight: Math.max(1, num(metrics.bodyHeight, height)),
      bounds: { x: num(b.x, 0), y: num(b.y, 0), width: num(b.width, width2), height: num(b.height, height) }
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
  for (const clip2 of o.clips ?? []) {
    const need = clip2.requires ?? [];
    const missing = need.filter((r) => !roles.has(r));
    if (missing.length) info("clip-roles", `"${clip2.name}" uses ${missing.join(", ")}, which this rig does not have; those parts stay still.`);
  }
  return issues;
}
var isUsable = (issues) => !issues.some((i) => i.level === "error");

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
  /** Bone index → draw this bone's parts behind/in front of another bone's (from layer keys). */
  layerOverrides = /* @__PURE__ */ new Map();
  /** Changes whenever layerOverrides changes. */
  layerKey = "";
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
  play(clip2, o = {}) {
    const track2 = o.track ?? (clip2.loop ? 0 : 1);
    const prev = this.tracks[track2] ?? null;
    const variation = o.variation ?? 0;
    const seed = o.seed ?? hashString(clip2.id) + this.playCount++;
    const rand = rng(seed);
    const amp = /* @__PURE__ */ new Map();
    const roleScale = this.opts.roleScale ?? {};
    for (const role of Object.keys(clip2.tracks)) {
      const jitter = variation > 0 ? 1 + (rand() * 2 - 1) * 0.12 * variation : 1;
      amp.set(role, (roleScale[role] ?? 1) * jitter);
    }
    const actionJitter = variation > 0 ? 1 + (rand() * 2 - 1) * 0.1 * variation : 1;
    const n = this.skeleton.size;
    const state = {
      clip: clip2,
      warp: new TimeWarp(clip2, o.timing, actionJitter),
      time: 0,
      loop: o.loop ?? clip2.loop,
      speed: o.speed ?? 1,
      intensity: o.intensity ?? 1,
      amp,
      mixIn: o.mixIn ?? clip2.defaults?.mixIn ?? (track2 === 0 ? 0.25 : 0.08),
      mixOut: o.mixOut ?? clip2.defaults?.mixOut ?? 0.2,
      startWeight: 0,
      snapshot: null,
      elapsed: 0,
      ended: false,
      fresh: true,
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
    } else if (track2 === 0 && !this.tracks.some(Boolean)) {
      state.startWeight = 1;
      state.mixIn = 0;
    }
    this.tracks[track2] = state;
  }
  /** Fade a track out. */
  stop(track2, mixOut) {
    const s = this.tracks[track2];
    if (!s) return;
    if (mixOut !== void 0) s.mixOut = mixOut;
    if (s.mixOut <= 0) {
      this.tracks[track2] = null;
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
  trackInfo(track2) {
    const s = this.tracks[track2];
    if (!s) return null;
    return { clip: s.clip, time: s.time, duration: s.warp.duration, clipTime: s.warp.toClip(s.time) };
  }
  /** Jump a track to a play time (Studio scrubbing). Events are not fired. */
  seek(track2, time) {
    const s = this.tracks[track2];
    if (!s) return;
    s.time = Math.max(0, Math.min(time, s.warp.duration));
    s.elapsed = Math.max(s.elapsed, s.mixIn);
    s.ended = false;
    s.fresh = false;
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
    const before = s.fresh ? -1e-9 : s.warp.toClip(s.time);
    s.fresh = false;
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
    this.updateLayers();
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
  /** Draw-order overrides from the layer keys of the playing tracks (higher tracks win). */
  updateLayers() {
    const sk = this.skeleton;
    const ov = this.layerOverrides;
    ov.clear();
    for (const s of this.tracks) {
      if (!s || s.weight < 0.5) continue;
      const t = s.warp.toClip(s.time);
      for (const [role, track2] of Object.entries(s.clip.tracks)) {
        if (!track2.layer?.length) continue;
        const bone2 = sk.roles.get(role);
        if (bone2 === void 0) continue;
        let key;
        for (const k5 of track2.layer) if (k5.t <= t + 1e-9) key = k5;
        const target = key?.behind ?? key?.front;
        const ti = target ? sk.roles.get(target) : void 0;
        if (key && ti !== void 0) ov.set(bone2, key.behind ? { behind: ti } : { front: ti });
        else ov.delete(bone2);
      }
    }
    let k4 = "";
    for (const [b, o] of ov) k4 += `${b}:${o.behind ?? ""}/${o.front ?? ""};`;
    this.layerKey = k4;
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
  orderKey = "";
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
    if (this.player.layerKey !== this.orderKey) {
      this.orderKey = this.player.layerKey;
      const order = drawOrder(this.asset.build.geometries, this.player.layerOverrides);
      order.forEach((gi, z) => this.container.setChildIndex(this.meshes[gi], z));
    }
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
function worldClips() {
  return setting("clips") ?? {};
}
async function saveClip(clip2) {
  if (!canSave()) throw new Error("Only the GM can save animations.");
  await game.settings.set(MODULE_ID, "clips", { ...worldClips(), [clip2.id]: clip2 });
}
async function deleteClip(id) {
  const next = { ...worldClips() };
  delete next[id];
  await game.settings.set(MODULE_ID, "clips", next);
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
  /** The clip holding a defeated pose on the base track, or null. */
  defeatedBy = null;
  mode;
  constructor(token, asset, profile, mode) {
    this.token = token;
    this.profile = profile;
    this.rigKey = `${profile.rig}@${revisionOf(profile.rig)}`;
    this.view = new RigView(asset);
    this.mode = mode;
    this.startIdle();
  }
  /** The base loop: the profile's choice if this rig can play it, else the template's own idle. '' = none. */
  idleId() {
    const want = this.profile.idle;
    if (want === "") return null;
    const tpl = this.view.build.rig.template;
    for (const id of [want, defaultIdleFor(tpl), "generic-idle"]) if (id && this.canPlay(id)) return id;
    return null;
  }
  startIdle() {
    const id = this.idleId();
    const clip2 = id ? getClip(id) : void 0;
    if (clip2) this.view.player.play(clip2, { track: 0, mixIn: 0, intensity: this.profile.intensity ?? 1 });
    this.view.player.update(Math.random() * 2);
  }
  /** What the token is showing: its base loop (or held pose) and the action on top, as clip ids. */
  current() {
    const p = this.view.player;
    return { base: p.trackInfo(0)?.clip.id ?? null, action: p.trackInfo(1)?.clip.id ?? null };
  }
  /** The rig's template (humanoid, quadruped, …), for template-specific mappings. */
  get template() {
    return this.view.build.rig.template;
  }
  /** The clip exists and this rig has every role it needs. */
  canPlay(clipId) {
    const clip2 = getClip(clipId);
    return !!clip2 && missingRoles(clip2, this.view.skeleton).length === 0;
  }
  /** Play the first clip of the list this rig can play. Returns its id, or null. */
  playFirst(clipIds, o = {}) {
    for (const id of clipIds) if (this.canPlay(id) && this.play(id, o)) return id;
    return null;
  }
  /**
   * Hold a defeated pose (the clip plays once on the base track and stays on its last frame), or
   * get back up into the idle. `instant` skips straight to the held pose (token drawn while down).
   */
  setDefeated(clipIds, instant = false) {
    const p = this.view.player;
    if (!clipIds) {
      if (!this.defeatedBy) return;
      this.defeatedBy = null;
      const id2 = this.idleId();
      const clip2 = id2 ? getClip(id2) : void 0;
      if (clip2) p.play(clip2, { track: 0, mixIn: 0.5, intensity: this.profile.intensity ?? 1 });
      else p.stop(0, 0.5);
      this.idleAcc = Infinity;
      return;
    }
    const id = clipIds.find((c) => this.canPlay(c));
    if (!id || this.defeatedBy === id) return;
    this.defeatedBy = id;
    p.stop(1, 0.1);
    p.play(getClip(id), { track: 0, loop: false, mixIn: instant ? 0 : 0.1, intensity: this.profile.intensity ?? 1 });
    if (instant) {
      p.seek(0, p.trackInfo(0)?.duration ?? 0);
      p.stop(1, 0);
    }
    this.idleAcc = Infinity;
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
    const clip2 = getClip(clipId);
    if (!clip2) return false;
    this.view.player.play(clip2, {
      track: clip2.loop ? 0 : 1,
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
  /** Called for every new animator (e.g. to put a token at 0 HP straight into its defeated pose). */
  created = [];
  all() {
    return this.animators.values();
  }
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
        for (const fn of this.created) {
          try {
            fn(a);
          } catch (e) {
            console.warn(`${MODULE_ID} |`, e);
          }
        }
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

// src/foundry/combat.ts
var ITEM_FLAG = "clip";
function mappingTable() {
  return parseTable(setting("mapping"));
}
async function setMappingTable(table) {
  await game.settings.set(MODULE_ID, "mapping", parseTable(table));
}
var actorOverrides = (actor) => actor?.getFlag?.(MODULE_ID, "profile")?.map ?? null;
function itemClipOf(item) {
  const c = item?.getFlag?.(MODULE_ID, ITEM_FLAG);
  return typeof c === "string" && c ? c : null;
}
function fuaPlaying() {
  const mod = game.modules?.get?.("fu-animations");
  if (!mod?.active) return false;
  try {
    return game.settings.get("fu-animations", "enabled") !== false;
  } catch {
    return true;
  }
}
function fuaSpec(item, ctx) {
  const api = game.modules?.get?.("fu-animations")?.active ? game.modules.get("fu-animations")?.api : null;
  if (!api?.resolve || !item) return null;
  try {
    return api.resolve(item, ctx)?.spec ?? null;
  } catch {
    return null;
  }
}
function fromUuid(uuid) {
  const fn = foundry.utils?.fromUuidSync ?? globalThis.fromUuidSync;
  return fn ? fn(uuid) : null;
}
function tokenFromUuid(uuid) {
  if (!uuid || !canvas?.ready) return null;
  let doc = null;
  try {
    doc = fromUuid(uuid);
  } catch {
    return null;
  }
  if (doc?.documentName === "Token") return canvas.tokens.get(doc.id) ?? null;
  const actor = doc?.documentName === "Actor" ? doc : doc?.actor;
  if (actor?.isToken && actor.token) return canvas.tokens.get(actor.token.id) ?? null;
  return actor?.getActiveTokens?.(false, false)?.[0] ?? null;
}
function sourceToken(msg, item) {
  const sp = msg.speaker ?? {};
  if (sp.token && (!sp.scene || sp.scene === canvas.scene?.id)) {
    const t = canvas.tokens.get(sp.token);
    if (t) return t;
  }
  const actor = item?.actor ?? (sp.actor ? game.actors.get(sp.actor) : null);
  return actor?.getActiveTokens?.(false, false)?.[0] ?? null;
}
function planFromMessage(msg) {
  if (!canvas?.ready) return null;
  const check = msg.getFlag?.("projectfu", "Check") ?? null;
  const itemUuid = check?.itemUuid ?? msg.getFlag?.("projectfu", "Item");
  const action = check?.additionalData?.ruleDefinedAction ?? null;
  let item = null;
  if (itemUuid) {
    try {
      item = fromUuid(itemUuid);
    } catch {
      item = null;
    }
  }
  if (!item && !action) return null;
  const src = sourceToken(msg, item);
  const listed = Array.isArray(check?.additionalData?.targets) ? check.additionalData.targets : null;
  const targets = listed?.length ? listed.map((t) => ({ token: tokenFromUuid(t.uuid), result: t.result === "hit" || t.result === "miss" ? t.result : "none" })).filter((t) => t.token) : [...game.user?.targets ?? []].map((t) => ({ token: t, result: "none" }));
  const damageType = check?.additionalData?.damage?.type ?? null;
  const offensive = ["accuracy", "magic"].includes(check?.type ?? "") || !!damageType;
  const spec = item ? fuaSpec(item, { offensive, hasTargets: targets.length > 0, damageType }) : null;
  const info = describeItem(item, { actor: item?.actor ?? src?.actor, check, targets: targets.length, fua: spec ? { style: spec.style, projectile: spec.projectile ?? null } : null });
  if (!src && !targets.length) return null;
  return {
    scene: canvas.scene.id,
    source: src?.id ?? null,
    info,
    itemClip: itemClipOf(item),
    critical: !!check?.critical,
    fumble: !!check?.fumble,
    seed: Math.floor(Math.random() * 1e9),
    targets: targets.filter((t) => t.token !== src).map((t) => ({ id: t.token.id, result: t.result })),
    fua: spec ? { style: spec.style ?? null, projectile: !!spec.projectile, heavy: spec.impact?.power === "heavy" || info.kind === "heroic" || info.kind === "zeroPower" } : null
  };
}
function guarding(actor) {
  return !!actor?.statuses?.has?.("guard");
}
async function animatorFor(tokenId) {
  if (!tokenId) return null;
  const token = canvas.tokens?.get(tokenId);
  if (!token) return null;
  if (!tokenAnimators.get(tokenId)) await tokenAnimators.refresh(token);
  return tokenAnimators.get(tokenId) ?? null;
}
function clipsFor(a, info, itemClip) {
  const res = resolveClip(info, { item: itemClip ? { "*": itemClip } : null, actor: actorOverrides(a?.token?.actor), world: mappingTable(), template: a?.template ?? null });
  return res.candidates;
}
async function react(tokenId, o) {
  const a = await animatorFor(tokenId);
  if (!a || a.defeatedBy) return null;
  const actor = a.token?.actor;
  const res = resolveReaction({ result: o.result, critical: o.critical, guarding: guarding(actor) }, { actor: actorOverrides(actor), world: mappingTable(), template: a.template });
  return res.candidates.length ? a.playFirst(res.candidates, { seed: o.seed, variation: 1 }) : null;
}
async function runPlan(plan) {
  if (plan.scene !== canvas?.scene?.id || !tokenAnimators.enabled()) return;
  const src = await animatorFor(plan.source);
  const reactionsOn = setting("reactions") !== false;
  const fua = fuaPlaying() && plan.fua && plan.fua.style !== "none";
  let played = null;
  let reacted = false;
  const reactAll = () => {
    if (reacted || !reactionsOn) return;
    reacted = true;
    plan.targets.forEach((t, i) => {
      if (t.result === "none") return;
      setTimeout(() => void react(t.id, { result: t.result, critical: plan.critical, seed: plan.seed + i + 1 }), i * 90);
    });
  };
  if (src && !src.defeatedBy) {
    const candidates = clipsFor(src, plan.info, plan.itemClip);
    const firstPlayable = candidates.find((c) => src.canPlay(c)) ?? null;
    const clip2 = firstPlayable ? getClip(firstPlayable) : null;
    if (clip2) {
      const target = fua ? estimateFuaContact(plan.fua.style, { projectile: plan.fua.projectile, heavy: plan.fua.heavy, dash: dashes() }) : null;
      const timing = target !== null ? timingForContact(clip2, target) : void 0;
      played = src.playFirst([clip2.id], {
        seed: plan.seed,
        variation: 1,
        timing,
        intensity: plan.critical ? 1.15 : 1,
        onEvent: (name) => {
          if (name === "contact" && !fua) reactAll();
        }
      });
    }
  }
  if (!plan.targets.length) return;
  const own = played ? getClip(played) : null;
  if (fua || !own || contactTime(own) === null) {
    const delay = fua ? estimateFuaContact(plan.fua.style, { projectile: plan.fua.projectile, heavy: plan.fua.heavy, dash: dashes() }) : 0.35;
    setTimeout(reactAll, delay * 1e3);
  }
}
function dashes() {
  try {
    return game.settings.get("fu-animations", "moveMelee") !== false;
  } catch {
    return true;
  }
}
function defeatClips(a) {
  return resolveReaction({ result: "hit", defeated: true }, { actor: actorOverrides(a.token?.actor), world: mappingTable(), template: a.template }).candidates;
}
function isDown(actor) {
  const v = Number(val(actor?.system?.resources?.hp));
  return Number.isFinite(v) && v <= 0;
}
function syncDefeat(a, instant = false) {
  if (setting("defeat") === false) return a.setDefeated(null);
  const down = isDown(a.token?.actor);
  if (down && !a.defeatedBy) a.setDefeated(defeatClips(a), instant);
  else if (!down && a.defeatedBy) a.setDefeated(null);
}
function onCombatSocket(msg) {
  if (msg?.type === "action" && msg.plan) {
    void runPlan(msg.plan);
    return true;
  }
  if (msg?.type === "react") {
    if (msg.scene === canvas?.scene?.id) for (const id of msg.tokens ?? []) void react(id, { result: msg.result ?? "hit", critical: msg.critical, seed: msg.seed });
    return true;
  }
  return false;
}
function registerCombatHooks() {
  Hooks.on("createChatMessage", (msg) => {
    if (setting("combat") === false) return;
    const authorId = msg.author?.id ?? msg.user?.id ?? msg.author;
    if (authorId !== game.user?.id) return;
    let plan = null;
    try {
      plan = planFromMessage(msg);
    } catch (e) {
      console.warn(`${MODULE_ID} | could not read the chat card`, e);
    }
    if (!plan) return;
    game.socket?.emit(SOCKET, { type: "action", plan });
    void runPlan(plan);
  });
  Hooks.on("updateActor", (actor, changes) => {
    if (foundry.utils.getProperty?.(changes, "system.resources.hp") === void 0) return;
    for (const a of tokenAnimators.all()) if (a.token?.actor === actor || a.token?.actor?.id === actor?.id) syncDefeat(a);
  });
  tokenAnimators.created.push((a) => syncDefeat(a, true));
}

// src/ui/dom.ts
function h(tag, props = null, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k4, v] of Object.entries(props)) {
      if (v === void 0 || v === null || v === false) continue;
      if (k4 === "class") el.className = String(v);
      else if (k4 === "style") el.setAttribute("style", String(v));
      else if (k4 === "dataset") Object.assign(el.dataset, v);
      else if (k4.startsWith("on") && typeof v === "function") el.addEventListener(k4.slice(2).toLowerCase(), v);
      else if (k4 === "html") el.innerHTML = String(v);
      else if (k4 in el && typeof v !== "string") el[k4] = v;
      else el.setAttribute(k4, v === true ? "" : String(v));
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

// src/ui/mapping-view.ts
var MappingView = class {
  root;
  host;
  table;
  filter = "";
  saving = Promise.resolve();
  constructor(root, host) {
    this.root = root;
    this.host = host;
    this.table = parseTable(host.load());
    root.classList.add("fusa-studio", "fusa-mapping");
    this.render();
  }
  /** Reload from the host (the setting changed elsewhere). */
  refresh() {
    this.table = parseTable(this.host.load());
    this.render();
  }
  clipName(id) {
    if (id === NONE) return "No animation";
    return this.host.clips().find((c) => c.id === id)?.name ?? `${id} (missing)`;
  }
  fallback(kind, key) {
    return this.host.inherited?.(kind, key) ?? { prefix: "Built-in", clip: kind === "rules" ? DEFAULT_RULES[key] : void 0 };
  }
  select(current, inherited, onChange) {
    const sel = h("select", { class: "fusa-map-select", onchange: () => onChange(sel.value) });
    sel.append(h("option", { value: "" }, inherited.clip ? `${inherited.prefix}: ${this.clipName(inherited.clip)}` : "Automatic"));
    sel.append(h("option", { value: NONE }, "No animation"));
    const byCat = /* @__PURE__ */ new Map();
    for (const c of this.host.clips()) {
      const list = byCat.get(c.category) ?? [];
      list.push(c);
      byCat.set(c.category, list);
    }
    for (const [cat, list] of byCat) {
      const g = h("optgroup", { label: CATEGORY_LABELS[cat] ?? cat });
      for (const c of list.sort((a, b) => a.name.localeCompare(b.name))) g.append(h("option", { value: c.id }, c.name));
      sel.append(g);
    }
    sel.value = current ?? "";
    if (current && sel.value !== current) {
      sel.append(h("option", { value: current }, `${current} (missing)`));
      sel.value = current;
    }
    return sel;
  }
  set(kind, key, clip2) {
    if (clip2) this.table[kind][key] = clip2;
    else delete this.table[kind][key];
    this.persist();
    this.render();
  }
  persist() {
    const snapshot = parseTable(this.table);
    this.saving = this.saving.then(() => this.host.save(snapshot)).catch((e) => console.warn("fu-sprite-animator | could not save the mapping", e));
  }
  /** Resolves when every change so far is saved (tests). */
  flush() {
    return this.saving;
  }
  render() {
    const root = this.root;
    clear(root);
    const changed = Object.keys(this.table.rules).length + Object.keys(this.table.abilities).length;
    const search = h("input", {
      type: "search",
      class: "fusa-map-search",
      placeholder: "Filter\u2026",
      value: this.filter,
      oninput: () => {
        this.filter = search.value;
        this.renderBody(body);
      }
    });
    const reset = h(
      "button",
      {
        class: "fusa-btn subtle small",
        disabled: changed === 0,
        onclick: async () => {
          if (!await this.host.confirm("Reset ability animations", "Go back to the built-in choices for every action and remove the per-ability entries?")) return;
          this.table = { rules: {}, abilities: {} };
          this.persist();
          this.render();
        }
      },
      "Reset all"
    );
    const body = h("div", { class: "fusa-map-body" });
    root.append(
      h(
        "div",
        { class: "fusa-map-head" },
        h("p", { class: "fusa-map-hint" }, this.host.hint ?? "Which animation a character plays for each kind of action. Per character: the actor sheet\u2019s header menu \u2192 Sprite animation choices. Per item: the item sheet\u2019s header menu \u2192 Sprite animation. A character whose rig cannot play a choice (for example a wolf and a bow shot) plays the closest one it can."),
        h("div", { class: "fusa-map-tools" }, search, reset)
      ),
      body
    );
    this.renderBody(body);
  }
  renderBody(body) {
    clear(body);
    const f = this.filter.trim().toLowerCase();
    const match = (...s) => !f || s.some((x) => x.toLowerCase().includes(f));
    for (const g of RULE_GROUPS) {
      const rows = g.keys.filter(([k4, label]) => match(k4, label, this.clipName(this.table.rules[k4] ?? this.fallback("rules", k4).clip ?? "")));
      if (!rows.length) continue;
      const sec2 = h("section", { class: "fusa-map-group" }, h("h3", null, g.title));
      for (const [key, label] of rows) {
        const own = this.table.rules[key];
        sec2.append(h("label", { class: `fusa-map-row${own ? " changed" : ""}`, dataset: { key } }, h("span", null, label), this.select(own, this.fallback("rules", key), (v) => this.set("rules", key, v))));
      }
      body.append(sec2);
    }
    const known = new Set(RULE_GROUPS.flatMap((g) => g.keys.map(([k4]) => k4)));
    const extra = Object.keys(this.table.rules).filter((k4) => !known.has(k4) && match(k4));
    if (extra.length) {
      const sec2 = h("section", { class: "fusa-map-group" }, h("h3", null, "Other rules"));
      for (const key of extra.sort()) sec2.append(this.entryRow("rules", key, key));
      body.append(sec2);
    }
    const abilities = Object.keys(this.table.abilities).filter((k4) => match(k4, this.host.abilityLabel?.(k4) ?? ""));
    const sec = h("section", { class: "fusa-map-group" }, h("h3", null, "Single abilities"));
    if (!abilities.length) sec.append(h("p", { class: "fusa-map-hint" }, "None yet. To give one ability its own animation in the whole world, open the item\u2019s sheet \u2192 header menu \u2192 Sprite animation \u2192 \u201Cevery character\u201D."));
    for (const key of abilities.sort()) sec.append(this.entryRow("abilities", key, this.host.abilityLabel?.(key) ?? key));
    body.append(sec);
  }
  entryRow(kind, key, label) {
    return h(
      "div",
      { class: "fusa-map-row changed", dataset: { key } },
      h("span", { title: key }, label),
      this.select(this.table[kind][key], this.fallback(kind, key), (v) => this.set(kind, key, v)),
      h("button", { class: "fusa-btn subtle small", title: "Remove", onclick: () => this.set(kind, key, "") }, "\u2715")
    );
  }
};

// src/foundry/mapping-app.ts
var esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
async function confirmDialog(title, text) {
  return !!await foundry.applications.api.DialogV2.confirm({ window: { title }, content: `<p>${esc(text)}</p>`, rejectClose: false });
}
function abilityLabel(key) {
  const items = [...game.items ?? []];
  const hit = items.find((i) => abilityKeyOf(i) === key);
  if (hit) return `${hit.name} (${hit.type})`;
  const m = /^([a-zA-Z]+):(.+)$/.exec(key);
  return m ? `${m[2]} (${m[1]})` : null;
}
var { ApplicationV2 } = foundry.applications.api;
var MappingApp = class _MappingApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "fusa-mapping",
    classes: ["fusa-app"],
    window: { title: "Sprite animations for abilities", icon: "fa-solid fa-person-running", resizable: true },
    position: { width: 620, height: 720 }
  };
  view = null;
  static open() {
    const existing = foundry.applications.instances.get("fusa-mapping");
    const app = existing ?? new _MappingApp();
    void app.render({ force: true });
    return app;
  }
  async _renderHTML() {
    const div = document.createElement("div");
    div.style.cssText = "position:absolute;inset:0;";
    return div;
  }
  _replaceHTML(result, content) {
    if (this.view) return;
    content.style.position = "relative";
    content.replaceChildren(result);
    this.view = new MappingView(result, {
      load: () => mappingTable(),
      save: (t) => setMappingTable(t),
      clips: () => listClips().filter((c) => !c.loop || c.category !== "idle"),
      confirm: confirmDialog,
      abilityLabel
    });
  }
  _onClose(options) {
    this.view = null;
    super._onClose?.(options);
  }
};
var ActorMappingApp = class _ActorMappingApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: ["fusa-app"],
    window: { title: "Sprite animation choices", icon: "fa-solid fa-person-running", resizable: true },
    position: { width: 620, height: 720 }
  };
  view = null;
  actor = null;
  constructor(options) {
    super(options);
  }
  static open(actor) {
    const profile = actor?.getFlag?.(MODULE_ID, "profile");
    if (!profile?.rig) {
      ui.notifications.warn(`${actor?.name ?? "This actor"} has no sprite rig yet: open the Studio and use \u201CUse this rig for an actor\u201D first.`);
      return null;
    }
    const id = `fusa-actor-mapping-${actor.id}`;
    const existing = foundry.applications.instances.get(id);
    const app = existing ?? new _ActorMappingApp({ id, window: { title: `Sprite animation choices: ${actor.name}`, icon: "fa-solid fa-person-running", resizable: true } });
    app.actor = actor;
    void app.render({ force: true });
    return app;
  }
  async _renderHTML() {
    const div = document.createElement("div");
    div.style.cssText = "position:absolute;inset:0;";
    return div;
  }
  _replaceHTML(result, content) {
    if (this.view) return;
    content.style.position = "relative";
    content.replaceChildren(result);
    const actor = this.actor;
    const known = new Set(Object.keys(DEFAULT_RULES));
    const isRule = (k4) => known.has(k4.split("@")[0]);
    this.view = new MappingView(result, {
      hint: `Choices for ${actor.name} only. \u201CWorld\u201D follows Settings \u2192 Sprite animations for abilities. A choice the rig cannot play falls back to the closest animation it can.`,
      load: () => {
        const map = actor.getFlag(MODULE_ID, "profile")?.map ?? {};
        const t = { rules: {}, abilities: {} };
        for (const [k4, v] of Object.entries(map)) t[isRule(k4) ? "rules" : "abilities"][k4] = v;
        return t;
      },
      save: async (t) => {
        const profile = actor.getFlag(MODULE_ID, "profile");
        if (!profile) return;
        const map = { ...t.rules, ...t.abilities };
        await actor.setFlag(MODULE_ID, "profile", { ...profile, map });
      },
      inherited: (kind, key) => {
        const w = mappingTable();
        return { prefix: "World", clip: kind === "rules" ? w.rules[key] ?? DEFAULT_RULES[key] : w.abilities[key] };
      },
      clips: () => listClips().filter((c) => !c.loop || c.category !== "idle"),
      confirm: confirmDialog,
      abilityLabel
    });
  }
  _onClose(options) {
    this.view = null;
    super._onClose?.(options);
  }
};
function refreshMappingApp() {
  foundry.applications.instances.get("fusa-mapping")?.view?.refresh();
}
async function itemDialog(item) {
  const info = describeItem(item, { actor: item.actor });
  const world = mappingTable();
  const key = abilityKeyOf(item);
  const auto = resolveClip(info, { world: { ...world, abilities: {} } });
  const autoName = auto.clip ? getClip(auto.clip)?.name ?? auto.clip : "No animation";
  const own = item.getFlag(MODULE_ID, ITEM_FLAG);
  const worldOwn = key ? world.abilities[key] : void 0;
  const current = own ?? worldOwn ?? "";
  const opts = [`<option value="">Automatic: ${esc(autoName)}${auto.key ? ` (${esc(ruleLabel(auto.key))})` : ""}</option>`, `<option value="${NONE}" ${current === NONE ? "selected" : ""}>No animation</option>`];
  const groups = /* @__PURE__ */ new Map();
  for (const c of listClips()) {
    if (c.loop && c.category === "idle") continue;
    const list = groups.get(c.category) ?? [];
    list.push(`<option value="${esc(c.id)}" ${current === c.id ? "selected" : ""}>${esc(c.name)}</option>`);
    groups.set(c.category, list);
  }
  for (const [cat, list] of groups) opts.push(`<optgroup label="${esc(cat)}">${list.join("")}</optgroup>`);
  const content = `<div class="fusa-assign">
		<p>Which animation characters with a sprite rig play when <b>${esc(item.name)}</b> is used.</p>
		<div class="form-group"><label>Animation</label><select name="clip">${opts.join("")}</select></div>
		<div class="form-group"><label>Applies to</label><select name="scope">
			<option value="item" ${worldOwn && !own ? "" : "selected"}>This item only</option>
			<option value="world" ${worldOwn && !own ? "selected" : ""} ${key ? "" : "disabled"}>Every \u201C${esc(item.name)}\u201D in the world</option>
		</select></div>
		<p class="hint">Automatic follows the world list (Settings \u2192 Sprite animations for abilities). A rig that cannot play the choice plays the closest animation it can.</p>
	</div>`;
  const result = await foundry.applications.api.DialogV2.prompt({
    window: { title: `Sprite animation: ${item.name}` },
    content,
    ok: { label: "Save", callback: (_e, button) => new FormData(button.form) },
    rejectClose: false
  });
  if (!result) return;
  const form = result;
  const clip2 = String(form.get("clip") ?? "");
  const scope = String(form.get("scope") ?? "item");
  if (scope === "world" && key) {
    const t = mappingTable();
    if (clip2) t.abilities[key] = clip2;
    else delete t.abilities[key];
    await setMappingTable(t);
    if (own) await item.unsetFlag(MODULE_ID, ITEM_FLAG);
  } else if (clip2) await item.setFlag(MODULE_ID, ITEM_FLAG, clip2);
  else if (own) await item.unsetFlag(MODULE_ID, ITEM_FLAG);
  ui.notifications.info(`${item.name}: ${clip2 ? clip2 === NONE ? "no animation" : getClip(clip2)?.name ?? clip2 : "automatic animation"}.`);
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
  add("Project FU system", game.system?.id === "projectfu", `${game.system?.id ?? "none"} ${game.system?.version ?? ""}`.trim());
  try {
    const weapon = [...game.items ?? []].find((i) => i.type === "weapon") ?? [...game.actors ?? []].flatMap((a) => [...a.items ?? []]).find((i) => i.type === "weapon");
    if (weapon) {
      const info = describeItem(weapon);
      add("Project FU weapon data read", !!info.weaponCategory, `"${weapon.name}": category ${info.weaponCategory ?? "not found"}, ${info.ranged ? "ranged" : "melee"}`);
    } else add("Project FU weapon data read", true, "no weapon in this world to check (skipped)");
  } catch (e) {
    add("Project FU weapon data read", false, String(e));
  }
  const fua = game.modules?.get?.("fu-animations");
  add("fu-animations", !fua?.active || typeof fua.api?.resolve === "function", fua?.active ? typeof fua.api?.resolve === "function" ? "active; its classification and timing are used" : "active but api.resolve is missing: update it" : "not active (fine: our own rules are used)");
  const table = mappingTable();
  const missing = [...Object.values(table.rules), ...Object.values(table.abilities)].filter((c) => c !== NONE && !getClip(c));
  add("Ability animations list", missing.length === 0, missing.length ? `chooses animations that no longer exist: ${[...new Set(missing)].join(", ")}` : `${Object.keys(table.rules).length + Object.keys(table.abilities).length} world choices, all valid`);
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

// src/presets/edit.ts
var CHANNELS = ["rotate", "translate", "scale", "layer"];
var EPS = 1e-3;
function cloneClip(clip2, id, name) {
  const c = JSON.parse(JSON.stringify(clip2));
  c.id = id;
  c.name = name;
  return c;
}
function track(clip2, role) {
  return clip2.tracks[role] ??= {};
}
function upsert(keys, key) {
  const i = keys.findIndex((k4) => Math.abs(k4.t - key.t) < EPS);
  if (i >= 0) {
    keys[i] = { ...keys[i], ...key };
    return i;
  }
  keys.push(key);
  keys.sort((a, b) => a.t - b.t);
  return keys.indexOf(key);
}
var clampT = (clip2, t) => Math.max(0, Math.min(clip2.duration, Math.round(t * 1e3) / 1e3));
function setRotateKey(clip2, role, t, v, ease) {
  const tr = track(clip2, role);
  tr.rotate ??= [];
  const k4 = { t: clampT(clip2, t), v: Math.round(v * 100) / 100 };
  if (ease) k4.e = ease;
  return upsert(tr.rotate, k4);
}
function setVectorKey(clip2, role, channel, t, x, y, ease) {
  const tr = track(clip2, role);
  const keys = tr[channel] ??= [];
  const k4 = { t: clampT(clip2, t), x: Math.round(x * 1e4) / 1e4, y: Math.round(y * 1e4) / 1e4 };
  if (ease) k4.e = ease;
  return upsert(keys, k4);
}
function setLayerKey(clip2, role, t, behind, front) {
  const tr = track(clip2, role);
  tr.layer ??= [];
  const k4 = { t: clampT(clip2, t) };
  if (behind) k4.behind = behind;
  else if (front) k4.front = front;
  const i = tr.layer.findIndex((x) => Math.abs(x.t - k4.t) < EPS);
  if (i >= 0) {
    tr.layer[i] = k4;
    return i;
  }
  tr.layer.push(k4);
  tr.layer.sort((a, b) => a.t - b.t);
  return tr.layer.indexOf(k4);
}
function keysOf(clip2, role, channel) {
  return clip2.tracks[role]?.[channel];
}
function removeKey(clip2, role, channel, index2) {
  const keys = keysOf(clip2, role, channel);
  if (!keys || index2 < 0 || index2 >= keys.length) return;
  keys.splice(index2, 1);
  const tr = clip2.tracks[role];
  if (!keys.length) delete tr[channel];
  if (!tr.rotate && !tr.translate && !tr.scale && !tr.layer) delete clip2.tracks[role];
}
function moveKey(clip2, role, channel, index2, t) {
  const keys = keysOf(clip2, role, channel);
  if (!keys?.[index2]) return index2;
  const k4 = keys[index2];
  k4.t = clampT(clip2, t);
  keys.sort((a, b) => a.t - b.t);
  return keys.indexOf(k4);
}
function setKeyEase(clip2, role, channel, index2, ease) {
  const k4 = keysOf(clip2, role, channel)?.[index2];
  if (!k4) return;
  if (ease && ease !== "linear") k4.e = ease;
  else delete k4.e;
}
function addEvent(clip2, t, name) {
  clip2.events ??= [];
  clip2.events.push({ t: clampT(clip2, t), name: name.trim() || "event" });
  clip2.events.sort((a, b) => a.t - b.t);
}
function removeEvent(clip2, index2) {
  clip2.events?.splice(index2, 1);
}
function setDuration(clip2, duration) {
  clip2.duration = Math.max(0.05, Math.round(duration * 1e3) / 1e3);
  for (const tr of Object.values(clip2.tracks)) for (const ch of CHANNELS) for (const k4 of tr[ch] ?? []) k4.t = Math.min(k4.t, clip2.duration);
  for (const e of clip2.events ?? []) e.t = Math.min(e.t, clip2.duration);
  const ph = clip2.phases;
  if (ph) {
    for (const key of ["anticipation", "action", "recovery"]) {
      const r = ph[key];
      if (r) ph[key] = [Math.min(r[0], clip2.duration), Math.min(r[1], clip2.duration)];
    }
    if (ph.impact !== void 0) ph.impact = Math.min(ph.impact, clip2.duration);
  }
}
function keyFromPose(clip2, role, sk, t, facing, bodyHeight) {
  const i = sk.roles.get(role);
  if (i === void 0) return null;
  const mirror = facing === "left";
  const local = sk.local[i];
  const setup = sk.setup[i];
  const tr = clip2.tracks[role];
  let rotate;
  if (tr?.space === "world") {
    let angle = 0;
    const chain = [];
    for (let b = i; b >= 0; b = sk.parent[b]) {
      chain.push(b);
      if (sk.bones[b].inheritRotation === false) break;
    }
    for (const b of chain) angle += sk.local[b].rot;
    let v = mirror ? 180 - angle : angle;
    const current = tr.rotate?.length ? sampleKeys(tr.rotate, t) : v;
    v = nearestTurn(v, current);
    rotate = v;
  } else rotate = (local.rot - setup.rot) * (mirror ? -1 : 1);
  const sign = mirror ? -1 : 1;
  const translate = [(local.x - setup.x) / bodyHeight * sign, (local.y - setup.y) / bodyHeight];
  const scale = [setup.sx ? local.sx / setup.sx : 1, setup.sy ? local.sy / setup.sy : 1];
  return { rotate, translate, scale };
}
function uniqueClipId(base2, taken) {
  const stem = base2.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clip";
  if (!taken(stem)) return stem;
  for (let n = 2; ; n++) if (!taken(`${stem}-${n}`)) return `${stem}-${n}`;
}

// src/core/ik.ts
function solveTwoBone(sk, child, tx, ty) {
  const parent = sk.parent[child];
  if (parent < 0) return false;
  sk.update();
  const seg = (i) => sk.segment(i);
  const a = seg(parent);
  const b = seg(child);
  const A = [a.ax, a.ay];
  const B = [b.ax, b.ay];
  const C2 = [b.bx, b.by];
  const l1 = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const l2 = Math.hypot(C2[0] - B[0], C2[1] - B[1]);
  if (l1 < 1e-6 || l2 < 1e-6) return false;
  const dx = tx - A[0];
  const dy = ty - A[1];
  const d = Math.max(Math.abs(l1 - l2) + 1e-4, Math.min(l1 + l2 - 1e-4, Math.hypot(dx, dy)));
  const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const alpha = Math.acos(cosA);
  const bend = Math.sign((B[0] - A[0]) * (C2[1] - B[1]) - (B[1] - A[1]) * (C2[0] - B[0])) || 1;
  const toT = Math.atan2(dy, dx);
  const newAB = toT - bend * alpha;
  const oldAB = Math.atan2(B[1] - A[1], B[0] - A[0]);
  sk.local[parent].rot += (newAB - oldAB) / DEG;
  sk.update();
  const b2 = seg(child);
  const oldBC = Math.atan2(b2.by - b2.ay, b2.bx - b2.ax);
  const newBC = Math.atan2(ty - b2.ay, tx - b2.ax);
  let delta = (newBC - oldBC) / DEG;
  delta -= 360 * Math.round(delta / 360);
  sk.local[child].rot += delta;
  sk.update();
  return true;
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

// src/ui/timeline.ts
var PHASE_COLOURS = { anticipation: "rgba(90,169,255,0.28)", action: "rgba(242,196,90,0.38)", recovery: "rgba(122,208,143,0.24)" };
var RULER = 18;
var BAND = 12;
var ROW = 15;
var PAD_L = 66;
var PAD_R = 12;
var Timeline = class {
  constructor(on) {
    this.on = on;
    this.el = document.createElement("div");
    this.el.className = "fusa-timeline";
    this.canvas = document.createElement("canvas");
    this.el.append(this.canvas);
    this.canvas.addEventListener("pointerdown", (e) => this.down(e));
    this.canvas.addEventListener("pointermove", (e) => this.move(e));
    this.canvas.addEventListener("pointerup", (e) => this.up(e));
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(this.el);
  }
  el;
  canvas;
  clip = null;
  warp = null;
  time = 0;
  rows = [];
  drag = null;
  ro;
  get duration() {
    return this.warp?.duration ?? this.clip?.duration ?? 1;
  }
  set(clip2, warp, time, rows = this.rows) {
    const rowsKey = JSON.stringify(rows);
    const changed = clip2 !== this.clip || warp !== this.warp || Math.abs(time - this.time) > 1e-4 || rowsKey !== JSON.stringify(this.rows);
    this.clip = clip2;
    this.warp = warp;
    this.time = time;
    this.rows = rows;
    if (changed) this.draw();
  }
  geom() {
    const r = this.canvas.getBoundingClientRect();
    const x0 = this.rows.length ? PAD_L : 12;
    return { r, x0, x1: r.width - PAD_R };
  }
  timeAt(e) {
    const { r, x0, x1 } = this.geom();
    return Math.max(0, Math.min(1, (e.clientX - r.left - x0) / Math.max(1, x1 - x0))) * this.duration;
  }
  toPlay(c) {
    return this.warp ? this.warp.toPlay(c) : c;
  }
  toClip(p) {
    return this.warp ? this.warp.toClip(p) : p;
  }
  hitKey(e) {
    const { r, x0, x1 } = this.geom();
    const y = e.clientY - r.top;
    const row = Math.floor((y - RULER - BAND - 4) / ROW);
    if (row < 0 || row >= this.rows.length) return null;
    const keys = this.rows[row].keys;
    let best = -1;
    let bestD = 7;
    keys.forEach((t, i) => {
      const x = x0 + this.toPlay(t) / this.duration * (x1 - x0);
      const d = Math.abs(e.clientX - r.left - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best >= 0 ? { row, index: best } : null;
  }
  down(e) {
    this.canvas.setPointerCapture(e.pointerId);
    const hit = this.hitKey(e);
    if (hit && this.on.selectKey) {
      this.on.selectKey(hit.row, hit.index);
      this.drag = { kind: "key", ...hit, moved: false };
      return;
    }
    this.drag = { kind: "scrub" };
    this.on.seek(this.timeAt(e));
  }
  move(e) {
    const d = this.drag;
    if (!d) return;
    if (d.kind === "scrub") this.on.seek(this.timeAt(e));
    else {
      d.moved = true;
      this.on.moveKey?.(d.row, d.index, this.toClip(this.timeAt(e)), false);
    }
  }
  up(e) {
    const d = this.drag;
    this.drag = null;
    if (d?.kind === "key" && d.moved) this.on.moveKey?.(d.row, d.index, this.toClip(this.timeAt(e)), true);
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
    const x0 = this.rows.length ? PAD_L : 12;
    const x1 = W - PAD_R;
    const dur = this.duration;
    const X = (t) => x0 + t / dur * (x1 - x0);
    const editing = this.rows.length > 0;
    const bandBottom = editing ? RULER + BAND : H - 8;
    g.fillStyle = "rgba(255,255,255,0.03)";
    g.fillRect(x0, RULER, x1 - x0, bandBottom - RULER);
    const ph = this.clip?.phases;
    if (ph) {
      for (const [name, range] of [["anticipation", ph.anticipation], ["action", ph.action], ["recovery", ph.recovery]]) {
        if (!range) continue;
        g.fillStyle = PHASE_COLOURS[name];
        const a = X(this.toPlay(range[0]));
        const b = X(this.toPlay(range[1]));
        g.fillRect(a, RULER, Math.max(1, b - a), bandBottom - RULER);
        if (b - a > 60 && !editing) {
          g.fillStyle = "rgba(238,243,255,0.7)";
          g.font = "600 10px sans-serif";
          g.fillText(name === "anticipation" ? "WIND-UP" : name === "action" ? "STRIKE" : "RECOVERY", a + 5, H - 12);
        }
      }
      if (ph.impact !== void 0) {
        g.strokeStyle = "#ff6b6b";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(X(this.toPlay(ph.impact)), RULER);
        g.lineTo(X(this.toPlay(ph.impact)), editing ? H - 2 : H - 8);
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
      g.moveTo(x, RULER);
      g.lineTo(x, major ? 8 : 13);
      g.stroke();
      if (major) g.fillText(`${t.toFixed(1)}s`, x + 3, 10);
    }
    for (const ev2 of this.clip?.events ?? []) {
      const x = X(this.toPlay(ev2.t));
      g.fillStyle = ev2.name === "contact" ? "#ff6b6b" : "#f2c45a";
      g.beginPath();
      g.moveTo(x, RULER + 1);
      g.lineTo(x + 4, RULER + 5);
      g.lineTo(x, RULER + 9);
      g.lineTo(x - 4, RULER + 5);
      g.closePath();
      g.fill();
    }
    this.rows.forEach((row, ri) => {
      const y = RULER + BAND + 4 + ri * ROW;
      g.fillStyle = ri % 2 ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.05)";
      g.fillRect(0, y, W, ROW);
      g.fillStyle = "rgba(238,243,255,0.65)";
      g.font = "10px sans-serif";
      g.fillText(row.label, 6, y + 11);
      row.keys.forEach((t, i) => {
        const x = X(this.toPlay(t));
        const sel = row.selected === i;
        g.fillStyle = sel ? "#ffffff" : row.colour ?? "#5aa9ff";
        g.strokeStyle = sel ? "#f2c45a" : "#0b1220";
        g.lineWidth = sel ? 2 : 1;
        g.beginPath();
        g.moveTo(x, y + 2);
        g.lineTo(x + 5, y + 7.5);
        g.lineTo(x, y + 13);
        g.lineTo(x - 5, y + 7.5);
        g.closePath();
        g.fill();
        g.stroke();
      });
    });
    const px = X(Math.min(this.time, dur));
    g.strokeStyle = "#ffffff";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(px, 4);
    g.lineTo(px, H - 2);
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
  ghostSprites = [];
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
  setRegions(labels, width2, height, colourOf, visible) {
    const P = pixi();
    this.regions.visible = visible && !!labels;
    if (!labels || !visible) return;
    if (!this.regionCanvas || this.regionCanvas.width !== width2 || this.regionCanvas.height !== height) {
      this.regionCanvas = document.createElement("canvas");
      this.regionCanvas.width = width2;
      this.regionCanvas.height = height;
      this.regionTexture?.destroy(true);
      this.regionTexture = P.Texture.from(this.regionCanvas, { scaleMode: P.SCALE_MODES.NEAREST });
      this.regions.texture = this.regionTexture;
    }
    const ctx = this.regionCanvas.getContext("2d");
    const img = ctx.createImageData(width2, height);
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
  /** Onion-skin frames drawn faintly behind the main output. */
  setGhosts(list) {
    const P = pixi();
    while (this.ghostSprites.length > list.length) {
      const g = this.ghostSprites.pop();
      g.texture.destroy(false);
      g.destroy();
    }
    list.forEach((item, i) => {
      let g = this.ghostSprites[i];
      if (!g) {
        g = new P.Sprite(P.Texture.EMPTY);
        this.ghostSprites.push(g);
        this.world.addChildAt(g, 0);
      }
      if (g.texture.baseTexture !== item.view.renderTexture.baseTexture) {
        const old = g.texture;
        g.texture = new P.Texture(item.view.renderTexture.baseTexture);
        if (old !== P.Texture.EMPTY) old.destroy(false);
      }
      g.tint = item.tint;
      g.alpha = item.alpha;
      g.scale.set(1 / item.view.resolution);
      g.position.set(-item.view.build.pad, -item.view.build.pad);
    });
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
var CHANNEL_LABEL = { rotate: "Turn", translate: "Move", scale: "Scale", layer: "Layer" };
var MODES = [
  { id: "rig", label: "Rig", hint: 'Drag a joint to move it, a bone tip to aim and lengthen it. Shift-drag moves a bone with its children. "Add bone": drag from the joint to the tip.' },
  { id: "paint", label: "Paint", hint: "Paint pixels onto the selected bone. Right-click paints them back to its parent. Bucket: fill a whole connected region." },
  { id: "pose", label: "Pose", hint: "Drag any bone to rotate it and see the art move. Shift-drag the root to move the whole body. Nothing here is saved." },
  { id: "animate", label: "Animate", hint: "Pick an animation below. Space plays and pauses. Adjust speed, intensity and phase timing." }
];
var isBaseLoop = (c) => c.loop && (c.category === "idle" || c.category === "movement");
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
  /** Animate mode: editing the keys of the current clip. */
  editing = false;
  selectedKey = null;
  clipHistory = new History();
  clipSaveTimer = 0;
  /** Onion skin: faint frames just before and after the play head. */
  onion = false;
  ghosts = [];
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
    void this.loadWorldClips();
  }
  async loadWorldClips() {
    try {
      for (const c of await this.host.listClips?.() ?? []) {
        try {
          registerClip(c);
        } catch (e) {
          console.warn("fu-sprite-animator | a saved clip could not be loaded", c?.id, e);
        }
      }
      if (!this.destroyed) this.renderLibrary();
    } catch (e) {
      console.warn("fu-sprite-animator | could not list world clips", e);
    }
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
    this.elBanner = h("div", { class: "fusa-banner", role: "status", "aria-live": "polite" });
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
    this.timeline = new Timeline({ seek: (t) => this.seek(t), selectKey: (r, i) => this.selectKeyAt(r, i), moveKey: (r, i, t, done) => this.moveKeyAt(r, i, t, done) });
    const libActions = h(
      "div",
      { class: "fusa-lib-actions" },
      ibtn("add", "Duplicate the selected animation (to edit your own version)", () => void this.duplicateClip()),
      ibtn("trash", "Delete the selected animation (your own animations only)", () => void this.deleteClip()),
      ibtn("import", "Import an animation (.json)", () => void this.importClip()),
      ibtn("export", "Export the selected animation (.json)", () => this.exportClip())
    );
    bottom.append(h("div", { class: "fusa-bottom-left" }, h("div", { class: "fusa-panel-title fusa-lib-head" }, h("span", null, "Animation library"), libActions), this.elLibrary), h("div", { class: "fusa-bottom-right" }, this.elTransport, this.timeline.el));
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
        ...TEMPLATE_LIST.map((t) => h("option", { value: t.id, title: t.description }, t.id === "custom" ? "Custom (one bone)" : t.name))
      )
    );
  }
  /* ------------------------------------------------------------------ */
  /*  Rendering the panels                                               */
  /* ------------------------------------------------------------------ */
  renderAll() {
    this.root.dataset.mode = this.mode;
    this.root.classList.toggle("has-rig", !!this.rig);
    this.root.classList.toggle("editing", this.editing && this.mode === "animate");
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
    const groups = Object.entries(p.report.confidence).map(([k4, v]) => h("span", { class: "conf", title: `${Math.round(v * 100)}%` }, `${k4} ${v > 0 ? dots(v) : "\u2014"}`));
    const kind = h(
      "select",
      { class: "fusa-kind", title: "What kind of character is it? Changing it builds a fresh skeleton for that body plan.", onchange: () => void this.resetTemplate(kind.value, false) },
      ...TEMPLATE_LIST.map((t) => h("option", { value: t.id, title: t.description }, t.name))
    );
    kind.value = this.rig.template;
    e.append(
      h("div", { class: "fusa-banner-text" }, h("b", null, p.report.method === "landmarks" ? "Automatic rig" : "Rig from proportions"), h("label", { class: "fusa-kind-label" }, "What is it? ", kind), h("span", null, `Faces ${this.rig.facing}.`), ...groups, ...p.report.notes.map((n) => h("small", null, n))),
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
    const p = proposeRig(this.image, this.rig.template, "auto", detect);
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
    input.addEventListener("keydown", (ev2) => {
      ev2.stopPropagation();
      if (ev2.key === "Enter") done(true);
      if (ev2.key === "Escape") done(false);
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
    if (this.mode === "animate" && this.editing) return this.renderClipInspector(e, rig);
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
    const rank = (c) => !this.rig ? 0 : !this.canPlay(c) ? 2 : c.templates?.includes(this.rig.template) ?? true ? 0 : 1;
    const all = listClips().sort((a, b) => rank(a) - rank(b));
    for (const c of all) groups.set(c.category, [...groups.get(c.category) ?? [], c]);
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
              const isBase = isBaseLoop(c);
              const active = isBase ? this.baseId === c.id : this.clipId === c.id;
              const fits = !this.rig || this.canPlay(c);
              const tip = fits ? c.description ?? c.name : `${c.description ?? c.name}
This rig lacks: ${(c.requires ?? []).filter((r) => !this.rig.bones.some((b) => b.role === r)).join(", ")}`;
              return h("button", { type: "button", class: `fusa-card ${active ? "active" : ""} ${isBase ? "base" : ""} ${fits ? "" : "unfit"}`, title: tip, "aria-pressed": String(active), disabled: !this.rig, dataset: { clip: c.id }, onclick: () => this.chooseClip(c) }, h("b", null, c.name), h("small", null, isBase ? "Idle loop" : `${c.duration.toFixed(2)}s${isBuiltIn(c.id) ? "" : " \xB7 yours"}`));
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
      h("div", { class: "fusa-clipname" }, h("small", null, this.editing ? "Editing (alone, at its own timing)" : `Over ${getClip(this.baseId)?.name ?? "nothing"}`), h("b", null, getClip(this.clipId)?.name ?? "")),
      slider("Speed", this.speed, 0.25, 2, 0.05, (v) => this.speed = v, (v) => `${v.toFixed(2)}\xD7`),
      slider("Intensity", this.intensity, 0, 1.5, 0.05, (v) => (this.intensity = v, this.replayIfPaused()), (v) => `${Math.round(v * 100)}%`),
      slider("Wind-up", this.timing.anticipation, 0.5, 2, 0.05, (v) => (this.timing.anticipation = v, this.retime()), (v) => `${v.toFixed(2)}\xD7`),
      slider("Strike", this.timing.action, 0.5, 2, 0.05, (v) => (this.timing.action = v, this.retime()), (v) => `${v.toFixed(2)}\xD7`),
      slider("Recovery", this.timing.recovery, 0.5, 2, 0.05, (v) => (this.timing.recovery = v, this.retime()), (v) => `${v.toFixed(2)}\xD7`),
      h("label", { class: "fusa-check", title: "Each play varies a little (amplitude and speed), so repeated attacks do not look identical." }, h("input", { type: "checkbox", checked: this.variation > 0, onchange: (ev2) => (this.variation = ev2.target.checked ? 1 : 0, this.restart()) }), "Vary"),
      ibtn("dice", "Another variation", () => (this.seed++, this.variation ||= 1, this.restart()), { disabled }),
      h("span", { class: "grow" }),
      h("button", { type: "button", class: `fusa-btn small ${this.onion ? "on" : ""}`, title: "Show faint frames just before and after the play head", disabled, onclick: () => this.setOnion(!this.onion) }, icon("eye"), "Ghosts"),
      h("button", { type: "button", class: `fusa-btn small ${this.editing ? "primary" : ""}`, title: "Edit the keys of this animation: pose bones at the play head (Ctrl-drag: IK), drag keys on the timeline", disabled, onclick: () => this.setEditing(!this.editing) }, icon("brush"), this.editing ? "Editing keys" : "Edit keys")
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
    const hint = this.tool === "add" && this.mode === "rig" ? "Drag from where the new bone starts to where it ends. It joins the selected bone." : this.mode === "animate" && this.editing ? "Drag a bone to key its turn, Shift-drag to key its position, Ctrl-drag a hand or foot for IK. K: key turn, \u2190/\u2192: step, Del: delete key, Ctrl+Z: undo." : m.hint;
    const parts = [h("span", { class: "hint" }, hint), h("span", { class: "grow" }), this.cursor ? h("span", null, `${Math.floor(this.cursor.x)}, ${Math.floor(this.cursor.y)}`) : null, h("span", null, `${Math.round(z * 100)}%`), this.lastEvent && this.mode === "animate" ? h("span", { class: "event" }, this.lastEvent) : null];
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
    this.fitBaseLoop();
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
    if (mode !== "animate" && this.editing) this.editing = false;
    if (mode !== "animate" && this.onion) this.setOnion(false);
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
  /** Start over from another template (from the tool row, or "What is it?" on the proposal banner). */
  async resetTemplate(t, ask = true) {
    this.elTree.parentElement?.querySelector(".fusa-template")?.blur();
    if (!t || !this.rig || !this.image) return this.renderAll();
    const name = TEMPLATES[t]?.name ?? t;
    if (ask && !await this.host.confirm("Start over", `Replace the skeleton with the ${name} template and reassign every pixel? You can undo this.`)) return this.renderAll();
    const previous = this.proposal?.previous ?? this.snapshot();
    const fresh = createRig({ name: this.rig.name, src: this.rig.image.src, image: this.image, template: t, facing: t === "humanoid" || t === "custom" ? this.rig.facing : void 0 });
    Object.assign(this.rig, { template: fresh.template, bones: fresh.bones, parts: fresh.parts, ownership: fresh.ownership, metrics: fresh.metrics, facing: fresh.facing });
    this.labels = rigLabels(this.rig);
    this.selected = null;
    const report2 = lastReport.get(fresh);
    this.proposal = report2 ? { report: report2, previous } : null;
    this.fitBaseLoop();
    this.commit();
  }
  /** The rig has every role the clip needs. */
  canPlay(c) {
    if (!this.rig) return false;
    const roles = new Set(this.rig.bones.map((b) => b.role).filter(Boolean));
    return (c.requires ?? []).every((r) => roles.has(r));
  }
  /** Keep the preview's idle and action suited to this rig (a wolf breathes and bites like a beast). */
  fitBaseLoop() {
    if (!this.rig) return;
    const tpl = this.rig.template;
    const suits = (c) => !!c && this.canPlay(c) && (c.templates?.includes(tpl) ?? true);
    if (!suits(getClip(this.baseId))) this.baseId = defaultIdleFor(tpl);
    if (!suits(getClip(this.clipId)) && getClip(defaultActionFor(tpl))) this.clipId = defaultActionFor(tpl);
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
    if (this.mode === "animate" && this.editing && this.view) {
      const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
      if (!hit) return;
      this.select(hit.id);
      const b = this.boneOf(hit.id);
      if (!b?.role) return this.host.notify("This bone has no role; set one in Rig mode to animate it.", "info");
      const sk = this.view.skeleton;
      const i = sk.index.get(hit.id);
      const w = sk.world[i];
      const kind = e.ctrlKey || e.metaKey ? "key-ik" : e.shiftKey ? "key-move" : "key-rotate";
      this.drag = { kind, id: hit.id, lastX: x, lastY: y, startAngle: Math.atan2(y - w.ty, x - w.tx), startRot: sk.local[i].rot, startX: sk.local[i].x - x, startY: sk.local[i].y - y };
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
  onMove(x, y, _e) {
    const e = _e;
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
      for (let k4 = 1; k4 <= steps; k4++) this.hintAt(d.lastX + (x - d.lastX) * k4 / steps, d.lastY + (y - d.lastY) * k4 / steps, Number(d.id));
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
    if (this.mode === "animate" && this.editing && this.view && d.kind.startsWith("key-")) {
      const c = this.editClip();
      const rig = this.rig;
      const sk = this.view.skeleton;
      const i = sk.index.get(d.id);
      const keyRole = (bi, channel) => {
        const role = sk.bones[bi].role;
        if (!c || !role) return;
        const k4 = keyFromPose(c, role, sk, this.actionTime, rig.facing, rig.metrics.bodyHeight);
        if (!k4) return;
        if (channel === "rotate") setRotateKey(c, role, this.actionTime, k4.rotate);
        else setVectorKey(c, role, "translate", this.actionTime, k4.translate[0], k4.translate[1]);
      };
      if (d.kind === "key-rotate") {
        const w = sk.world[i];
        const a = Math.atan2(y - w.ty, x - w.tx);
        const flip = Math.sign(w.a * w.d - w.b * w.c) || 1;
        sk.local[i].rot = d.startRot + wrapDeg((a - d.startAngle) * 180 / Math.PI) * flip;
        d.startRot = sk.local[i].rot;
        d.startAngle = a;
        sk.update();
        keyRole(i, "rotate");
      } else if (d.kind === "key-move") {
        sk.local[i].x = d.startX + x;
        sk.local[i].y = d.startY + y;
        sk.update();
        keyRole(i, "translate");
      } else if (solveTwoBone(sk, i, x, y)) {
        keyRole(sk.parent[i], "rotate");
        keyRole(i, "rotate");
      }
      this.startClips(this.actionTime);
      return;
    }
    if (this.mode === "pose" && this.view) {
      const sk = this.view.skeleton;
      const i = sk.index.get(d.id);
      const p = this.pose.get(i) ?? { rot: 0, x: 0, y: 0 };
      if (d.kind === "rotate" && (_e.ctrlKey || _e.metaKey) && sk.parent[i] >= 0) {
        if (solveTwoBone(sk, i, x, y)) {
          for (const bi of [sk.parent[i], i]) {
            const q = this.pose.get(bi) ?? { rot: 0, x: 0, y: 0 };
            q.rot = sk.local[bi].rot - sk.setup[bi].rot;
            this.pose.set(bi, q);
          }
          this.poseDirty = true;
        }
        return;
      }
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
    if (d.kind.startsWith("key-")) {
      this.clipChanged();
      return;
    }
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
    if (isBaseLoop(c)) this.baseId = c.id;
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
    const clip2 = getClip(this.clipId);
    const plain = this.editing;
    if (base2 && !plain) v.player.play(base2, { track: 0, mixIn: 0 });
    if (clip2) {
      v.player.play(clip2, {
        track: 1,
        mixIn: plain ? 0 : clip2.loop ? 0.2 : 0.08,
        speed: plain ? 1 : this.speed,
        intensity: plain ? 1 : this.intensity,
        timing: plain ? void 0 : this.timing,
        variation: plain ? 0 : this.variation,
        seed: this.seed,
        loop: clip2.loop,
        onEvent: (name) => {
          this.lastEvent = `\u25CF ${name}`;
          this.renderStatusSoon();
        }
      });
      this.warp = new TimeWarp(clip2, plain ? {} : this.timing);
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
    this.timeline.set(getClip(this.clipId) ?? null, this.warp, t, this.keyRows().rows);
    if (this.editing) this.renderInspectorSoon();
  }
  inspTimer = 0;
  renderInspectorSoon() {
    if (this.inspTimer) return;
    this.inspTimer = window.setTimeout(() => {
      this.inspTimer = 0;
      if (!this.destroyed) this.renderInspector();
    }, 120);
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
    const clip2 = getClip(this.clipId);
    if (clip2) this.warp = new TimeWarp(clip2, this.timing);
    this.restart();
  }
  replayIfPaused() {
    if (!this.playing) this.startClips(this.actionTime);
  }
  /* ------------------------------------------------------------------ */
  /*  Editing clips                                                      */
  /* ------------------------------------------------------------------ */
  editClip() {
    const c = getClip(this.clipId);
    return c && !isBuiltIn(c.id) ? c : null;
  }
  setEditing(on) {
    if (!this.rig) return;
    if (on) {
      let c = getClip(this.clipId);
      if (!c) return;
      if (isBuiltIn(c.id)) {
        const copy = cloneClip(c, uniqueClipId(`${c.id}-custom`, (id) => !!getClip(id)), `${c.name} (custom)`);
        registerClip(copy);
        this.clipId = copy.id;
        this.persistClip(copy, true);
        this.host.notify(`Editing your own copy: "${copy.name}".`);
        c = copy;
      }
      this.clipHistory.reset(JSON.stringify(c));
      if (this.mode !== "animate") this.mode = "animate";
    }
    this.editing = on;
    this.selectedKey = null;
    this.playing = !on;
    this.startClips(on ? this.actionTime : 0);
    this.renderAll();
  }
  persistClip(clip2, now = false) {
    clearTimeout(this.clipSaveTimer);
    const save = () => void this.host.saveClip?.(JSON.parse(JSON.stringify(clip2))).catch((err) => this.host.notify(`Could not save the animation: ${err.message}`, "error"));
    if (now) save();
    else this.clipSaveTimer = window.setTimeout(save, 1200);
  }
  /** After any change to the clip being edited: record undo, save, re-pose. */
  clipChanged(record = true) {
    const c = this.editClip();
    if (!c) return;
    if (record) this.clipHistory.record(JSON.stringify(c));
    this.persistClip(c);
    this.startClips(this.actionTime);
    this.renderInspector();
    this.renderLibrary();
  }
  restoreClip(snap) {
    if (!snap) return;
    const c = JSON.parse(snap);
    registerClip(c);
    this.clipId = c.id;
    this.persistClip(c);
    this.selectedKey = null;
    this.startClips(this.actionTime);
    this.renderAll();
  }
  keyRows() {
    const c = getClip(this.clipId);
    const role = this.boneOf(this.selected)?.role ?? null;
    if (!this.editing || !c || !role) return { role, rows: [] };
    const tr = c.tracks[role];
    const colours = { rotate: "#5aa9ff", translate: "#7ad08f", scale: "#c9a7ff", layer: "#f2c45a" };
    return {
      role,
      rows: CHANNELS.map((ch) => ({
        label: CHANNEL_LABEL[ch],
        keys: (tr?.[ch] ?? []).map((k4) => k4.t),
        selected: this.selectedKey && this.selectedKey.role === role && this.selectedKey.channel === ch ? this.selectedKey.index : void 0,
        colour: colours[ch]
      }))
    };
  }
  selectKeyAt(row, index2) {
    const { role } = this.keyRows();
    const c = getClip(this.clipId);
    if (!role || !c) return;
    const ch = CHANNELS[row];
    const key = c.tracks[role]?.[ch]?.[index2];
    if (!key) return;
    this.selectedKey = { role, channel: ch, index: index2 };
    this.seek(key.t);
    this.renderInspector();
  }
  moveKeyAt(row, index2, t, done) {
    const c = this.editClip();
    const { role } = this.keyRows();
    if (!c || !role) return;
    const ch = CHANNELS[row];
    const ni = moveKey(c, role, ch, this.selectedKey?.index ?? index2, t);
    this.selectedKey = { role, channel: ch, index: ni };
    this.actionTime = Math.max(0, Math.min(c.duration, t));
    if (done) this.clipChanged();
    else this.startClips(this.actionTime);
  }
  /** Key the selected bone's current value at the play head. */
  keyCurrent(channel) {
    const c = this.editClip();
    const b = this.boneOf(this.selected);
    if (!c || !b?.role || !this.view || !this.rig) return;
    const k4 = keyFromPose(c, b.role, this.view.skeleton, this.actionTime, this.rig.facing, this.rig.metrics.bodyHeight);
    if (!k4) return;
    if (channel === "rotate") setRotateKey(c, b.role, this.actionTime, k4.rotate);
    else setVectorKey(c, b.role, "translate", this.actionTime, k4.translate[0], k4.translate[1]);
    this.clipChanged();
  }
  deleteSelectedKey() {
    const c = this.editClip();
    const k4 = this.selectedKey;
    if (!c || !k4) return;
    removeKey(c, k4.role, k4.channel, k4.index);
    this.selectedKey = null;
    this.clipChanged();
  }
  renderClipInspector(e, rig) {
    const c = this.editClip();
    if (!c) {
      e.append(h("p", { class: "fusa-muted" }, "Pick an animation to edit."));
      return;
    }
    const name = h("input", { type: "text", value: c.name });
    name.addEventListener("change", () => (c.name = name.value.trim() || c.name, this.clipChanged()));
    const cats = h("select", null, ...Object.keys(CATEGORY_LABELS).map((k4) => h("option", { value: k4, selected: k4 === c.category }, CATEGORY_LABELS[k4])));
    cats.addEventListener("change", () => (c.category = cats.value, this.clipChanged()));
    const dur = h("input", { type: "number", min: "0.05", max: "10", step: "0.05", value: String(c.duration) });
    dur.addEventListener("change", () => (setDuration(c, Number(dur.value) || c.duration), this.clipChanged()));
    const loop = h("input", { type: "checkbox", checked: c.loop });
    loop.addEventListener("change", () => (c.loop = loop.checked, this.clipChanged()));
    e.append(h("div", { class: "fusa-insp-title" }, "Animation"), this.field("Name", name), this.field("Category", cats), this.field("Length (s)", dur), h("label", { class: "fusa-check" }, loop, "Loops"));
    const b = this.boneOf(this.selected);
    e.append(h("div", { class: "fusa-insp-title" }, "Bone at ", h("b", null, `${this.actionTime.toFixed(2)}s`)));
    if (!b) e.append(h("p", { class: "fusa-muted" }, "Select a bone (list or view). Drag it in the view to set a key; Ctrl-drag a hand or foot to bend the limb (IK). K keys it, Shift+K keys its position."));
    else if (!b.role) e.append(h("p", { class: "fusa-muted" }, `${b.name} has no role; animations move bones by role. Set one in Rig mode.`));
    else {
      const role = b.role;
      const tr = c.tracks[role];
      const space = h("div", { class: "fusa-seg" }, ...["offset", "world"].map((sp) => h("button", { type: "button", class: (tr?.space ?? "offset") === sp ? "active" : "", disabled: !!tr?.rotate?.length, title: sp === "offset" ? "Turn relative to the rig\u2019s own pose" : "Point at an on-screen direction, whatever the rig\u2019s pose (strikes). Only before the first turn key.", onclick: () => ((c.tracks[role] ??= {}).space = sp, this.clipChanged()) }, sp === "offset" ? "Relative" : "Screen angle")));
      const roles = [...new Set(rig.bones.map((x) => x.role).filter((r) => !!r && r !== role))];
      const curLayer = [...tr?.layer ?? []].filter((k4) => k4.t <= this.actionTime + 1e-6).pop();
      const layer = h("select", null, h("option", { value: "" }, "normal order"), ...roles.map((r) => h("option", { value: `behind:${r}`, selected: curLayer?.behind === r }, `behind ${r}`)), ...roles.map((r) => h("option", { value: `front:${r}`, selected: curLayer?.front === r }, `in front of ${r}`)));
      layer.addEventListener("change", () => {
        const [kind, target] = layer.value.split(":");
        setLayerKey(c, role, this.actionTime, kind === "behind" ? target : void 0, kind === "front" ? target : void 0);
        this.clipChanged();
      });
      e.append(
        h("div", { class: "fusa-readout" }, `${b.name} \xB7 ${role}`),
        this.field("Turn keys", space),
        h("div", { class: "fusa-row" }, h("button", { type: "button", class: "fusa-btn small", onclick: () => this.keyCurrent("rotate") }, "\u25C6 Key turn"), h("button", { type: "button", class: "fusa-btn small", onclick: () => this.keyCurrent("translate") }, "\u25C6 Key position")),
        this.field("Draw from here", layer)
      );
    }
    const sk = this.selectedKey;
    const key = sk ? c.tracks[sk.role]?.[sk.channel]?.[sk.index] : void 0;
    if (sk && key) {
      const t = h("input", { type: "number", min: "0", max: String(c.duration), step: "0.01", value: String(key.t) });
      t.addEventListener("change", () => {
        const ni = moveKey(c, sk.role, sk.channel, sk.index, Number(t.value));
        this.selectedKey = { ...sk, index: ni };
        this.actionTime = Math.min(c.duration, Number(t.value));
        this.clipChanged();
      });
      const ease = h("select", null, ...EASE_NAMES.map((n) => h("option", { value: n, selected: (typeof key.e === "string" ? key.e : key.e ? "" : "linear") === n }, n)), Array.isArray(key.e) ? h("option", { value: "", selected: true }, `curve ${key.e.join(", ")}`) : null);
      ease.addEventListener("change", () => (ease.value && setKeyEase(c, sk.role, sk.channel, sk.index, ease.value), this.clipChanged()));
      const value = "v" in key ? `${key.v.toFixed(1)}\xB0` : "x" in key ? `${key.x.toFixed(3)}, ${key.y.toFixed(3)}` : "behind" in key || "front" in key ? JSON.stringify(key) : "normal order";
      e.append(h("div", { class: "fusa-insp-title" }, `Key \xB7 ${CHANNEL_LABEL[sk.channel]} \xB7 ${sk.role}`), this.field("Time (s)", t), h("div", { class: "fusa-readout" }, `Value ${value}`));
      if (sk.channel !== "layer") e.append(this.field("Easing to next", ease));
      e.append(h("button", { type: "button", class: "fusa-btn subtle small", onclick: () => this.deleteSelectedKey() }, icon("trash"), "Delete key (Del)"));
    }
    const evName = h("input", { type: "text", placeholder: "contact", value: "" });
    e.append(
      h("div", { class: "fusa-insp-title" }, "Events"),
      ...(c.events ?? []).map((ev2, i) => h("div", { class: "fusa-event-row" }, h("span", null, `${ev2.t.toFixed(2)}s`), h("b", null, ev2.name), ibtn("trash", "Remove", () => (removeEvent(c, i), this.clipChanged())))),
      h("div", { class: "fusa-row" }, evName, h("button", { type: "button", class: "fusa-btn small", onclick: () => (addEvent(c, this.actionTime, evName.value || "contact"), this.clipChanged()) }, "Add at play head"))
    );
    const ph = c.phases ??= {};
    const num2 = (v, set) => {
      const i = h("input", { type: "number", min: "0", max: String(c.duration), step: "0.01", value: v === void 0 ? "" : String(v) });
      i.addEventListener("change", () => (set(Math.max(0, Math.min(c.duration, Number(i.value) || 0))), this.clipChanged()));
      return i;
    };
    const pair = (key2) => h("div", { class: "fusa-row" }, num2(ph[key2]?.[0], (n) => ph[key2] = [n, ph[key2]?.[1] ?? n]), num2(ph[key2]?.[1], (n) => ph[key2] = [ph[key2]?.[0] ?? 0, n]));
    e.append(h("div", { class: "fusa-insp-title" }, "Phases (s)"), this.field("Wind-up", pair("anticipation")), this.field("Strike", pair("action")), this.field("Impact", num2(ph.impact, (n) => ph.impact = n)), this.field("Recovery", pair("recovery")));
  }
  async duplicateClip() {
    const c = getClip(this.clipId);
    if (!c) return;
    const copy = cloneClip(c, uniqueClipId(`${c.id}-copy`, (id) => !!getClip(id)), `${c.name} (copy)`);
    registerClip(copy);
    this.clipId = copy.id;
    this.persistClip(copy, true);
    this.startClips(0);
    this.renderAll();
  }
  async deleteClip() {
    const c = getClip(this.clipId);
    if (!c) return;
    if (isBuiltIn(c.id)) return this.host.notify("Built-in animations cannot be deleted. Duplicate one to make your own.", "info");
    if (!await this.host.confirm("Delete animation", `Delete "${c.name}" from this world?`)) return;
    unregisterClip(c.id);
    await this.host.deleteClip?.(c.id);
    if (!getClip(this.clipId)) this.clipId = "sword-slash";
    this.editing = false;
    this.startClips(0);
    this.renderAll();
  }
  exportClip() {
    const c = getClip(this.clipId);
    if (c) this.host.download(`${c.id}.fusa-clip.json`, JSON.stringify(c, null, 1));
  }
  async importClip() {
    const text = await this.host.pickTextFile(".json,application/json");
    if (!text) return;
    try {
      const c = JSON.parse(text);
      if (getClip(c.id)) {
        c.id = uniqueClipId(c.id, (id) => !!getClip(id));
        c.name = `${c.name} (imported)`;
      }
      registerClip(c);
      this.persistClip(c, true);
      this.clipId = isBaseLoop(c) ? this.clipId : c.id;
      this.startClips(0);
      this.renderAll();
      this.host.notify(`Imported the animation "${c.name}".`);
    } catch (e) {
      this.host.notify(`Could not import: ${e.message}`, "error");
    }
  }
  setOnion(on) {
    this.onion = on;
    if (!on) {
      for (const g of this.ghosts) g.destroy();
      this.ghosts = [];
      this.viewport.setGhosts([]);
    }
    this.renderTransport();
  }
  renderGhosts() {
    const v = this.view;
    if (!v || !this.asset) return;
    if (this.ghosts.length !== 2 || this.ghosts[0].asset !== this.asset) {
      for (const g of this.ghosts) g.destroy();
      this.ghosts = [new RigView(this.asset), new RigView(this.asset)];
    }
    const clip2 = getClip(this.clipId);
    const base2 = getClip(this.baseId);
    const offsets = [-0.1, 0.1];
    this.ghosts.forEach((g, i) => {
      g.player.clear();
      g.skeleton.resetPose();
      if (base2 && !this.editing) g.player.play(base2, { track: 0, mixIn: 0 });
      if (clip2) g.player.play(clip2, { track: 1, mixIn: 0, intensity: this.editing ? 1 : this.intensity, timing: this.editing ? void 0 : this.timing, variation: 0 });
      g.player.seek(1, Math.max(0, this.actionTime + offsets[i]));
      g.player.update(0);
      g.render(this.viewport.app.renderer);
    });
    this.viewport.setGhosts(this.ghosts.map((g, i) => ({ view: g, tint: i ? 16747146 : 9094399, alpha: 0.35 })));
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
      if (this.playing && !this.editing) {
        v.update(dt * this.speed);
        const info = v.player.trackInfo(1);
        if (info) this.actionTime = info.time;
        else if (this.loop) this.startClips(0);
        else {
          this.actionTime = this.timeline.duration;
        }
      }
      this.timeline.set(getClip(this.clipId) ?? null, this.warp, this.actionTime, this.keyRows().rows);
      if (this.onion) this.renderGhosts();
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
    if (this.editing && this.mode === "animate" && mod && e.key.toLowerCase() === "z") this.restoreClip(e.shiftKey ? this.clipHistory.redo() : this.clipHistory.undo());
    else if (this.editing && this.mode === "animate" && mod && e.key.toLowerCase() === "y") this.restoreClip(this.clipHistory.redo());
    else if (this.editing && this.mode === "animate" && (e.key === "Delete" || e.key === "Backspace")) this.deleteSelectedKey();
    else if (this.editing && this.mode === "animate" && (e.key === "k" || e.key === "K")) this.keyCurrent(e.shiftKey ? "translate" : "rotate");
    else if (this.mode === "animate" && !this.playing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) this.seek(Math.max(0, Math.min(this.timeline.duration, this.actionTime + (e.key === "ArrowLeft" ? -1 : 1) / 30)));
    else if (mod && e.key.toLowerCase() === "z") e.shiftKey ? this.redo() : this.undo();
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
    clearTimeout(this.clipSaveTimer);
    clearTimeout(this.inspTimer);
    for (const g of this.ghosts) g.destroy();
    this.ghosts = [];
    this.view?.destroy();
    this.view = null;
    this.timeline.destroy();
    this.viewport.destroy();
    this.root.remove();
  }
};

// src/foundry/studio-app.ts
var esc2 = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
async function confirmDialog2(title, text) {
  return !!await foundry.applications.api.DialogV2.confirm({ window: { title }, content: `<p>${esc2(text)}</p>`, rejectClose: false });
}
function idleOptions(rig) {
  const roles = new Set(rig.bones.map((b) => b.role).filter(Boolean));
  const first = defaultIdleFor(rig.template);
  const loops = listClips().filter((c) => c.loop && c.category === "idle" && (c.requires ?? []).every((r) => roles.has(r))).sort((a, b) => Number(b.id === first) - Number(a.id === first) || Number(!!b.templates?.includes(rig.template)) - Number(!!a.templates?.includes(rig.template)));
  return [...loops.map((c) => `<option value="${esc2(c.id)}">${esc2(c.name)}</option>`), '<option value="">None (still until an action)</option>'].join("");
}
async function assignRigToActor(rig, preselect) {
  const actors = [...game.actors ?? []].filter((a) => a.isOwner).sort((a, b) => a.name.localeCompare(b.name));
  if (!actors.length) return ui.notifications.warn("There are no actors to give this animation to.");
  const options = actors.map((a) => `<option value="${a.id}" ${a.id === preselect ? "selected" : ""}>${esc2(a.name)}</option>`).join("");
  const content = `<div class="fusa-assign">
		<p>Tokens of this actor will show <b>${esc2(rig.name)}</b> animated: idling on the map and playing attacks, spells and reactions.</p>
		<div class="form-group"><label>Actor</label><select name="actor">${options}</select></div>
		<div class="form-group"><label>Idle</label><select name="idle">${idleOptions(rig)}</select></div>
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
  const profile = { rig: rig.id, enabled: true, idle: String(form.get("idle") ?? defaultIdleFor(rig.template)) };
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
    confirm: confirmDialog2,
    assignToActor: (rig) => assignRigToActor(rig, app.actorId ?? void 0),
    listClips: async () => Object.values(worldClips()),
    saveClip: (clip2) => saveClip(clip2),
    deleteClip: (id) => deleteClip(id)
  };
}
var { ApplicationV2: ApplicationV22 } = foundry.applications.api;
var StudioApp = class _StudioApp extends ApplicationV22 {
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
    if (this.studio?.hasUnsavedChanges && !await confirmDialog2("Close the Studio?", "This rig has unsaved changes. Close anyway?")) return this;
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
    version: "0.2.0",
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
    /** What the first animated token of this actor/token shows: base loop (or defeated pose) and current action. */
    current(target) {
      for (const t of tokensFor(target)) {
        const a = tokenAnimators.get(t.id);
        if (a) return a.current();
      }
      return null;
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
    registerClip(clip2) {
      registerClip(clip2);
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
    /**
     * Which clip an item would play for a character (no animation is played). `actor` defaults to
     * the item's owner; its rig's template and its own choices are taken into account.
     */
    resolveClip(item, o = {}) {
      const it = item;
      const actor = o.actor ?? it?.actor;
      const token = actor ? tokensFor(actor)[0] : null;
      const template = token ? tokenAnimators.get(token.id)?.template ?? null : null;
      const own = it?.getFlag?.(MODULE_ID, ITEM_FLAG);
      return resolveClip(describeItem(item, { actor, targets: o.targets }), {
        item: typeof own === "string" && own ? { "*": own } : null,
        actor: actor?.getFlag?.(MODULE_ID, "profile")?.map ?? null,
        world: mappingTable(),
        template
      });
    },
    /** How Project FU data is read for an item (for debugging a mapping). */
    describe(item, o = {}) {
      return describeItem(item, { actor: o.actor ?? item?.actor });
    },
    /** The world's ability → animation table. */
    mapping: {
      get: () => mappingTable(),
      set: (table) => setMappingTable(table),
      defaults: () => ({ ...DEFAULT_RULES }),
      open: () => MappingApp.open()
    },
    /**
     * Play an item's animation as if its card was posted: the user's tokens act, the targets react.
     * targets: tokens/actors with an optional result ('hit' | 'miss').
     */
    async playAction(item, o = {}) {
      const it = item;
      const src = tokensFor(o.source ?? it?.actor)[0] ?? null;
      const targets = (o.targets ?? []).flatMap((t) => tokensFor(t.target).slice(0, 1).map((tok) => ({ id: tok.id, result: t.result ?? "hit" })));
      const own = it?.getFlag?.(MODULE_ID, ITEM_FLAG);
      const plan = {
        scene: canvas.scene?.id,
        source: src?.id ?? null,
        info: describeItem(item, { actor: it?.actor ?? src?.actor, targets: targets.length }),
        itemClip: typeof own === "string" && own ? own : null,
        critical: !!o.critical,
        fumble: false,
        seed: Math.floor(Math.random() * 1e9),
        targets,
        fua: null
      };
      if (o.broadcast !== false) game.socket?.emit(SOCKET, { type: "action", plan });
      await runPlan(plan);
    },
    /** Play a reaction on a token or an actor's tokens: 'hit' (critical: true for a heavy one) or 'miss'. */
    async react(target, result = "hit", o = {}) {
      const ids = tokensFor(target).map((t) => t.id);
      const seed = Math.floor(Math.random() * 1e9);
      if (o.broadcast !== false && ids.length) game.socket?.emit(SOCKET, { type: "react", scene: canvas.scene?.id, tokens: ids, result, critical: !!o.critical, seed });
      let n = 0;
      for (const id of ids) if (await react(id, { result, critical: o.critical, seed })) n++;
      return n;
    },
    /** Checks that need a real Foundry: PixiJS version, token texture strategy, rendering, cleanup. */
    selfTest
  };
}

// src/foundry/main.ts
Hooks.once("init", () => {
  const reg = (key, data) => game.settings.register(MODULE_ID, key, { config: true, ...data });
  game.settings.register(MODULE_ID, "rigs", { scope: "world", config: false, type: Object, default: {} });
  game.settings.register(MODULE_ID, "clips", { scope: "world", config: false, type: Object, default: {}, onChange: () => syncWorldClips() });
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
  reg("combat", {
    name: "Animate actions from chat cards",
    hint: "When an attack, spell, skill or item card is posted, characters with a sprite animation play the matching animation (see \u201CSprite animations for abilities\u201D).",
    scope: "world",
    type: Boolean,
    default: true
  });
  reg("reactions", {
    name: "Targets react",
    hint: "Targets flinch when hit, recoil harder on critical hits, block while guarding and dodge when missed.",
    scope: "world",
    type: Boolean,
    default: true
  });
  reg("defeat", {
    name: "Defeated pose at 0 HP",
    hint: "Characters at 0 HP fall and stay down until they have HP again.",
    scope: "world",
    type: Boolean,
    default: true,
    onChange: () => tokenAnimators.reset()
  });
  game.settings.register(MODULE_ID, "mapping", { scope: "world", config: false, type: Object, default: { rules: {}, abilities: {} }, onChange: () => refreshMappingApp() });
  game.settings.registerMenu(MODULE_ID, "mapping", {
    name: "Sprite animations for abilities",
    label: "Open the list",
    hint: "Which animation plays for each weapon category, kind of spell, skill, item, basic action and reaction.",
    icon: "fa-solid fa-list",
    type: MappingApp,
    restricted: true
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
  registerCombatHooks();
});
var worldClipIds = /* @__PURE__ */ new Set();
function syncWorldClips() {
  const clips = worldClips();
  for (const id of worldClipIds) if (!clips[id]) unregisterClip(id);
  worldClipIds.clear();
  for (const [id, clip2] of Object.entries(clips)) {
    try {
      registerClip(clip2);
      worldClipIds.add(id);
    } catch (e) {
      console.warn(`${MODULE_ID} | world animation "${id}" is invalid`, e);
    }
  }
}
Hooks.once("ready", () => {
  syncWorldClips();
  game.socket?.on(SOCKET, (msg) => {
    if (!onCombatSocket(msg)) onSocket(msg);
  });
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
  app.options.actions.fusaActorMap ??= () => void ActorMappingApp.open(doc);
  if (controls.some((c) => c.action === "fusaStudio")) return;
  controls.push({ action: "fusaStudio", icon: "fa-solid fa-person-running", label: "Sprite animation", ownership: "OWNER" });
  controls.push({ action: "fusaActorMap", icon: "fa-solid fa-list", label: "Sprite animation choices", ownership: "OWNER" });
});
var ANIMATABLE_ITEMS = /* @__PURE__ */ new Set(["weapon", "customWeapon", "shield", "basic", "spell", "skill", "heroic", "miscAbility", "classFeature", "optionalFeature", "consumable", "ritual"]);
Hooks.on("getHeaderControlsDocumentSheetV2", (app, controls) => {
  const doc = app.document;
  if (doc?.documentName !== "Item" || !ANIMATABLE_ITEMS.has(doc.type ?? "") || !doc.isOwner) return;
  app.options.actions ??= {};
  app.options.actions.fusaItem ??= () => void itemDialog(app.document);
  if (controls.some((c) => c.action === "fusaItem")) return;
  controls.push({ action: "fusaItem", icon: "fa-solid fa-person-running", label: "Sprite animation", ownership: "OWNER" });
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
