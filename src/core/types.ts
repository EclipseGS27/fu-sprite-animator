/**
 * Document types shared by the runtime, the rig editor and storage.
 * The full specification with examples is in docs/ANIMATION_FORMAT.md — keep both in sync.
 */

/** A body role such as "arm.upper.front". Clips address roles, never bone names or ids. */
export type RoleId = string;

export type TemplateId = 'humanoid' | 'quadruped' | 'winged' | 'serpentine' | 'custom';

export type Facing = 'right' | 'left';

export interface BoneData {
	id: string;
	name: string;
	/** Parent bone id, or null for a root. */
	parent: string | null;
	/** What this bone is, for clips and retargeting (optional: custom bones may have none). */
	role?: RoleId;
	/** Setup pose, local to the parent (sprite pixels, degrees, multipliers). */
	x: number;
	y: number;
	rotation: number;
	scaleX: number;
	scaleY: number;
	/** Length along the bone's local +x axis, in pixels. */
	length: number;
	/** Inherit the parent's rotation and scale (default true). False keeps a world-aligned bone. */
	inheritRotation?: boolean;
	/** Editor colour, CSS hex. */
	color?: string;
}

export type DeformMode = 'rigid' | 'mesh';

export interface PartData {
	id: string;
	name: string;
	/** Bone this part follows. */
	bone: string;
	/** Value of this part's pixels in the ownership map (1–254). */
	label: number;
	/** rigid: moves with its bone only (crisp). mesh: a grid that blends with neighbouring bones at joints. */
	deform: DeformMode;
	/** Width of the blending band at joints, as a fraction of body height (mesh parts). */
	softness: number;
	/** 0 = full skinning, 1 = behaves like rigid (mesh parts). */
	stiffness: number;
	/** Grid cell size in sprite pixels for mesh parts; 0 = automatic. */
	cell: number;
	/** Extend this part under higher parts with copies of its own pixels (hidden-region fill). */
	fill: boolean;
	/** Extra reach when pixels are assigned automatically, as a fraction of body height (wide parts > 0). */
	reach?: number;
	hidden?: boolean;
}

export type RenderMode = 'pixel' | 'smooth';

export interface RenderSettings {
	/** pixel: nearest-neighbour sampling, snapped translations. smooth: linear sampling for illustrations. */
	mode: RenderMode;
	/** Empty space around the sprite for limbs and weapons that swing out, as a fraction of max(width, height). */
	padding: number;
	/** Snap pure translations to whole sprite pixels (pixel mode). */
	snap: boolean;
	/** Idle frame rate; 0 = every display frame. Actions always run at display rate. */
	idleFps: number;
	/** Render resolution multiplier (smooth mode only; pixel mode always renders at 1). */
	resolution: number;
}

export interface RigMetrics {
	/** Height of the character's opaque pixels; clip translations are fractions of it. */
	bodyHeight: number;
	/** Opaque bounds in sprite pixels. */
	bounds: { x: number; y: number; width: number; height: number };
}

export interface RigDocument {
	format: 'fusa-rig';
	version: 1;
	id: string;
	name: string;
	template: TemplateId;
	/** Which way the character looks in the source image. Clips are authored facing right. */
	facing: Facing;
	image: { src: string; width: number; height: number };
	metrics: RigMetrics;
	/** Parent before child. */
	bones: BoneData[];
	/** Draw order: first is furthest back. */
	parts: PartData[];
	/** Pixel → part label map, row-major, run-length encoded (see sprite/rle.ts). */
	ownership: string | null;
	/** Optional: where the GM extended a part under its neighbours (same encoding; label = part). */
	fillHints?: string | null;
	render: RenderSettings;
	/** Per-role amplitude multipliers applied to every clip on this rig (per-character adjustment). */
	roleScale?: Record<RoleId, number>;
	created: number;
	updated: number;
	revision: number;
}

/* ------------------------------------------------------------------ */
/*  Clips                                                              */
/* ------------------------------------------------------------------ */

export type EaseName =
	| 'linear'
	| 'step'
	| 'inQuad'
	| 'outQuad'
	| 'inOutQuad'
	| 'inCubic'
	| 'outCubic'
	| 'inOutCubic'
	| 'inQuart'
	| 'outQuart'
	| 'inExpo'
	| 'outExpo'
	| 'inBack'
	| 'outBack'
	| 'inOutBack'
	| 'outElastic'
	| 'inOutSine';

/** A named curve or a CSS-style cubic Bézier [x1, y1, x2, y2]. */
export type Ease = EaseName | [number, number, number, number];

/** A key: value v at time t (seconds). e is the easing from this key to the next. */
export interface Key {
	t: number;
	v: number;
	e?: Ease;
	/**
	 * Hold the bone's own drawn angle here instead of v (v is kept as a fallback for tools).
	 * Lets a world-space track start and end exactly on the sprite's pose, whatever it is.
	 */
	rest?: boolean;
}

export interface Key2 {
	t: number;
	x: number;
	y: number;
	e?: Ease;
}

/** Draw-order change from time t (held until the next key): draw this role's parts just behind or in front of another role's. A key with neither restores the normal order. */
export interface LayerKey {
	t: number;
	behind?: RoleId;
	front?: RoleId;
}

export interface RoleTrack {
	/**
	 * offset (default): degrees added to the setup rotation.
	 * world: absolute on-screen angle the bone should point at (authored facing right; mirrored for
	 * left-facing rigs). Use for limbs that must reach a pose whatever the sprite's rest pose is.
	 */
	space?: 'offset' | 'world';
	rotate?: Key[];
	/** Offset in body heights, in the parent's space (x mirrored for left-facing rigs). */
	translate?: Key2[];
	/** Multipliers of the setup scale. */
	scale?: Key2[];
	/** Draw-order changes (e.g. the sword arm passes behind the head during a wind-up). */
	layer?: LayerKey[];
}

export type ClipCategory = 'idle' | 'movement' | 'attack' | 'magic' | 'defence' | 'reaction' | 'other';

export interface ClipPhases {
	anticipation?: [number, number];
	action?: [number, number];
	/** The contact moment. */
	impact?: number;
	recovery?: [number, number];
}

export interface ClipEvent {
	t: number;
	/** Conventional names: windup, release, contact, recover, end. */
	name: string;
}

export interface ClipDocument {
	format: 'fusa-clip';
	version: 1;
	id: string;
	name: string;
	category: ClipCategory;
	description?: string;
	tags?: string[];
	/** Seconds. */
	duration: number;
	loop: boolean;
	tracks: Record<RoleId, RoleTrack>;
	events?: ClipEvent[];
	phases?: ClipPhases;
	/** Roles the clip needs to read well; the Studio warns when a rig lacks them. */
	requires?: RoleId[];
	/** Rig templates the clip is written for. */
	templates?: TemplateId[];
	/** Additive clips add their offsets on top of lower tracks (e.g. breathing). */
	additive?: boolean;
	defaults?: { mixIn?: number; mixOut?: number };
}

/** GM timing edits: multipliers of each phase's duration. */
export interface PhaseTiming {
	anticipation?: number;
	action?: number;
	recovery?: number;
}
