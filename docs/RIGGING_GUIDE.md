# Rigging guide

For GMs who have never used skeletal animation software. Ten minutes for a first character.

## What a rig is
- **Bones** are the skeleton: each has a joint (where it starts), a tip, and a parent. Moving a
  parent moves its children (the forearm follows the upper arm).
- **Parts** are the pixels each bone carries. Every visible pixel of your sprite belongs to
  exactly one part. Nothing is redrawn: parts are cut from your image as it is.
- **Roles** say what a bone is (`arm.upper.front`, `head`…). Animations move bones by role, so
  one "Sword slash" works on every character that has those roles.

## 1. Import the sprite
Open the Studio (token controls → running-figure button, or Settings → Sprite Animation Studio,
or an actor sheet's header menu → *Sprite animation*). Click **Choose sprite** and pick a PNG or
WebP with a transparent background. The file is used exactly as it is.

- **Solid background?** If the file has a white (or other single-colour) background instead of
  transparency, the Studio offers to save a transparent copy next to it and use that. Only the
  background connected to the image edges is cleared; your original file is untouched.
- Side, three-quarter and front views all work. The character's facing is guessed from the side
  its weapon is on (you can change *Character faces* in the Inspector — click empty space).
- Pixel art: keep *Rendering: Pixel art*. Painted, high-resolution sprites: *Illustration*.

## 2. Check the automatic rig, then fit it (Rig mode, key 1)
The Studio looks at the silhouette and proposes a skeleton: it finds the head and neck, where
the legs separate, the feet, the hands (or the hilt of a weapon) and a blade, staff or spear.
Floating pieces (sparks, glyphs, smoke) are ignored for the skeleton and later follow the
nearest part. A banner shows what it found and how sure it is (●●● sure, ●○○ guessed):
- **Keep** — accept it and fix details by hand.
- **Use proportions instead** — a plain template stretched over the character, if the
  detection went wrong (for unusual poses it can be the better start).
- **Discard** — go back to the rig you had (after a re-run).
The **bone** button in the Skeleton panel runs the automatic rig again at any time.

Then fix it by dragging:
- **a joint** (round handle) — moves where the bone starts. The bone keeps its tip; if the
  parent ends at that joint, the parent follows. Perfect for "put the elbow on the elbow".
- **a tip** (selected bone's end) — aims and lengthens the bone.
- **Shift + drag** a joint, or drag a bone's body — moves the bone with all its children.
- Pan: right or middle mouse drag. Zoom: mouse wheel (whole-pixel steps for pixel art).
  **F** fits the view.

Place joints at the pivot points of the art: shoulder, elbow, wrist, hip, knee, ankle, neck.
Put the **weapon** bone along the blade, starting at the hand.

Add bones with **Add bone** (drag from the joint to the tip; the new bone joins the selected
bone), delete with **Del**, rename with a double click, change parent or role in the Inspector.
Not a humanoid? Choose *Template → Custom (one bone)* and build the creature bone by bone.

## 3. Assign pixels (wand button, then Paint mode, key 2)
Press the **wand** to give every pixel to its nearest bone again with the fitted skeleton.
Then switch to **Paint** to fix what it got wrong:
- Select a bone in the list, paint with the **Brush** (left button). Right button paints pixels
  back to the bone's parent. **[** and **]** change the brush size.
- **Bucket**: click a region to give the whole connected region to the selected bone.
- The coloured overlay shows which bone owns which pixels.

The wand grows every bone's region from the bone itself through the art and stops at outlines
and colour edges, so once the joints are right most pixels land on the right bone. Typical fixes:
sleeve pixels that went to the torso, hair that went to the arm, a scarf or cape that went to an
arm, the sword's hilt that went to the hand (the blade must belong to *Weapon*).

**Hidden** (Paint mode): shows, for the selected bone, its own pixels, the automatic fill
behind the parts in front of it (cyan) and your additions (gold). Paint to extend the part
further under its neighbours — for example the torso under a big arm that will swing far away.
Right-click removes additions. This never changes what you see at rest.

## 4. Choose how each part moves (Inspector)
- **Rigid**: moves as one piece. Crisp — best for the head, hands, feet and weapons.
- **Bend**: bends near its joints so elbows, knees and the waist do not open gaps.
  *Joint softness* widens the bending zone; *Stiffness* pulls it back toward rigid.
- **Draw order**: which parts are in front. The back arm and leg are behind the body, the front
  arm in front of it, the weapon between the front forearm and the front hand.
- **Fill what is hidden**: when a part in front moves away (the arm lifts off the torso), the
  part behind shows copies of its own nearest pixels instead of a hole. Your visible art is never
  changed: the fill only exists where it was covered.

## 5. Try it (Pose mode, key 3)
Drag any bone to rotate it and watch the art follow. Shift-drag the root to move the whole body.
This is a preview only; **Reset pose** returns to the exact original image.

## 6. Animate (key 4)
Pick an idle loop (blue) and an action (gold) in the library. Space plays/pauses; drag on the
timeline to scrub. Adjust **Speed**, **Intensity** (how big the motion is), **Wind-up / Strike /
Recovery** timing, and **Vary** (each play differs slightly). The timeline shows the phases, the
impact line and events.

## 7. Save and use it
- **Save** (Ctrl+S) keeps the rig in this world. The rig check (right panel) must show no red
  problems for tokens to use it.
- **Use this rig for an actor** (person button): pick the actor and its idle; optionally make
  the sprite its token image. Its tokens animate on the map.
- **Export** writes one `.fusa.json` file with the rig and the image; **Import** brings it into
  another world.

## Pixel-art tips
- Rotations of a few degrees move pixels in steps, like hand-made pixel art. That is intended.
- Keep animations modest (Intensity 70–100 %) for small sprites (under 40 px).
- Bending parts are drawn at the sprite's own resolution, so pixels never blur or shrink.

## When something looks wrong
| You see | Do |
| --- | --- |
| A hole opens at a joint | Make the part *Bend*, raise *Joint softness*, or check the joint position. |
| Torso pixels move with the arm | Paint them back onto the torso. |
| A limb's pixels stay behind | Paint them onto the limb's bone. |
| The weapon bends | Make *Weapon* rigid and make sure all blade pixels belong to it. |
| An animation leaves a part still | The bone lacks the role the animation uses — set the role. |
| Red "pixels would disappear" | Some visible pixels belong to no part: paint them or press the wand. |
