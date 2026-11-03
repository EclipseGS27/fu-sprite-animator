# Changelog

## 0.4.0 — Automatic rigging rework (2026-11-03)
- Shared bounded analysis for transparent margins, large images and translucent artwork.
- Improved head/neck proposals, branch-based hand candidates, curved wrist/elbow fitting,
  wide stances, broad blades and coloured floor shadows.
- Silhouette fitting for floating spirits, serpents, blobs and custom body plans.
- Undetected weapons stay excluded from automatic pixel assignment across save/load;
  manual painting and an Inspector override remain available.
- Geometric-support reporting flags uncertain proposals without presenting accuracy probabilities.
- 187 local unit tests, plus passing browser rendering/editor/mock-integration checks in CI.
  Generalization tests include 32 generated humanoid poses and eight curved serpents; existing
  labelled assignment accuracy floors remain unchanged. No real Foundry-world test is claimed.
- Existing saved rigs keep their manual edits. Re-run automatic rigging in the Studio to
  create a new proposal with the updated detector.

## 0.3.0 — Phases 6–7 (2026-11-02)
- **Creatures**: four-legged beast, winged, serpent, floating spirit and blob templates; automatic
  landmarks for beasts and dragons (legs, belly, snout, tail, wing tips, facing); "What is it?"
  on the rig proposal; 26 creature and any-rig clips (bite, claw, pounce, tail swipe, roar,
  breath, wing beat, hover, crouch, beast hit/dodge/defeat, blob idle/attack/hit/melt, spirit
  float/defeat, and root-only moves); creature defaults in combat; template-appropriate idles.
- **Polish**: extended self-test (Project FU data, fu-animations, ability list); accessibility
  labels; troubleshooting entries.
- **Tests**: 24/50-character mixed scenes with GPU texture-release checks, a 560×416 sprite,
  coexistence with other modules' token changes, CPU posing cost.

## 0.2.0 — Phase 5 (2026-11-02)
- **Fabula Ultima combat**: Project FU chat cards play the attacker's animation and the targets'
  reactions (hit, critical, blocked while guarding, dodged); characters at 0 HP fall and stay down
  until healed. Choices come from the system's own data through an editable table — world, per
  character, per item. Timing follows fu-animations when it is active.
- **Animations**: 30 more humanoid clips (idles, movement, every weapon kind, magic, defence,
  reactions). World tracks start and end on the sprite's own drawn angles ("rest" keys).
- **API 0.2.0**: `current`, `resolveClip`, `describe`, `mapping`, `playAction`, `react`.
- **Fix**: clip events at time 0 never fired.

## 0.1.0 — Phases 2–4
- Prototype: Studio, runtime, rest pose bit-identical, sword slash, token animation, API.
- Automatic rigging (landmarks, weapon detection, background removal).
- Animation editor (keys, two-bone IK, onion skin, draw-order keys, world clip library).
