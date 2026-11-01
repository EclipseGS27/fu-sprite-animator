import { STRIDE, TimeWarp, evaluateClip } from './clip';
import { hashString, rng, smoothstep } from './math';
import type { Skeleton } from './skeleton';
import type { ClipDocument, Facing, PhaseTiming } from './types';

/** The angle equivalent to a (± whole turns) closest to ref. */
export function nearestTurn(a: number, ref: number): number {
	return a - 360 * Math.round((a - ref) / 360);
}

export interface PlayOptions {
	/** 0 = base loop (idle), 1+ = actions layered on top. Default: 0 for looping clips, 1 otherwise. */
	track?: number;
	loop?: boolean;
	/** Play rate multiplier. */
	speed?: number;
	/** Amplitude multiplier: 0.5 = half the motion, 1.5 = exaggerated. */
	intensity?: number;
	/** Seconds to blend in from the current pose. */
	mixIn?: number;
	/** Seconds to blend out when a one-shot clip ends. */
	mixOut?: number;
	/** Phase duration multipliers. */
	timing?: PhaseTiming;
	/** Variation seed; the same seed always gives the same performance. */
	seed?: number;
	/** 0 = identical every time, 1 = default variation (±12 % amplitude, ±10 % action speed). */
	variation?: number;
	onEvent?: (name: string, clip: ClipDocument) => void;
	onComplete?: (clip: ClipDocument) => void;
}

interface TrackState {
	clip: ClipDocument;
	warp: TimeWarp;
	/** Play time in seconds (after phase warping). */
	time: number;
	loop: boolean;
	speed: number;
	intensity: number;
	amp: Map<string, number>;
	mixIn: number;
	mixOut: number;
	/** Weight when the clip started (crossfade from a previous clip on the same track). */
	startWeight: number;
	snapshot: { delta: Float64Array; mask: Uint8Array } | null;
	elapsed: number;
	ended: boolean;
	endElapsed: number;
	weight: number;
	delta: Float64Array;
	mask: Uint8Array;
	onEvent?: PlayOptions['onEvent'];
	onComplete?: PlayOptions['onComplete'];
}

export interface PlayerOptions {
	bodyHeight: number;
	facing: Facing;
	/** Per-role amplitude adjustments for this character. */
	roleScale?: Record<string, number>;
}

/**
 * Plays clips on a skeleton. Track 0 is the base loop; higher tracks override the roles they
 * animate (or add to them, for additive clips) with smooth blending in and out.
 */
export class AnimationPlayer {
	readonly skeleton: Skeleton;
	private readonly tracks: (TrackState | null)[] = [];
	private readonly result: Float64Array;
	private readonly resultMask: Uint8Array;
	private readonly angles: Float64Array;
	private opts: PlayerOptions;
	private playCount = 0;

	constructor(skeleton: Skeleton, opts: PlayerOptions) {
		this.skeleton = skeleton;
		this.opts = opts;
		this.result = new Float64Array(skeleton.size * STRIDE);
		this.resultMask = new Uint8Array(skeleton.size);
		this.angles = new Float64Array(skeleton.size);
	}

	setOptions(opts: Partial<PlayerOptions>): void {
		this.opts = { ...this.opts, ...opts };
	}

	play(clip: ClipDocument, o: PlayOptions = {}): void {
		const track = o.track ?? (clip.loop ? 0 : 1);
		const prev = this.tracks[track] ?? null;
		const variation = o.variation ?? 0;
		const seed = o.seed ?? hashString(clip.id) + this.playCount++;
		const rand = rng(seed);
		const amp = new Map<string, number>();
		const roleScale = this.opts.roleScale ?? {};
		for (const role of Object.keys(clip.tracks)) {
			const jitter = variation > 0 ? 1 + (rand() * 2 - 1) * 0.12 * variation : 1;
			amp.set(role, (roleScale[role] ?? 1) * jitter);
		}
		const actionJitter = variation > 0 ? 1 + (rand() * 2 - 1) * 0.1 * variation : 1;
		const n = this.skeleton.size;
		const state: TrackState = {
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
			onComplete: o.onComplete,
		};
		if (prev) {
			// Crossfade from what the track showed a moment ago.
			state.snapshot = { delta: prev.delta.slice(), mask: prev.mask.slice() };
			state.startWeight = prev.weight;
		} else if (track === 0 && !this.tracks.some(Boolean)) {
			// The very first clip starts at full weight: nothing to blend from.
			state.startWeight = 1;
			state.mixIn = 0;
		}
		this.tracks[track] = state;
	}

	/** Fade a track out. */
	stop(track: number, mixOut?: number): void {
		const s = this.tracks[track];
		if (!s) return;
		if (mixOut !== undefined) s.mixOut = mixOut;
		if (s.mixOut <= 0) {
			this.tracks[track] = null;
			return;
		}
		s.ended = true;
		s.endElapsed = 0;
	}

	clear(): void {
		this.tracks.length = 0;
	}

	/** True while any action (track > 0) is playing. */
	get busy(): boolean {
		return this.tracks.some((t, i) => i > 0 && !!t);
	}

	trackInfo(track: number): { clip: ClipDocument; time: number; duration: number; clipTime: number } | null {
		const s = this.tracks[track];
		if (!s) return null;
		return { clip: s.clip, time: s.time, duration: s.warp.duration, clipTime: s.warp.toClip(s.time) };
	}

	/** Jump a track to a play time (Studio scrubbing). Events are not fired. */
	seek(track: number, time: number): void {
		const s = this.tracks[track];
		if (!s) return;
		s.time = Math.max(0, Math.min(time, s.warp.duration));
		s.elapsed = Math.max(s.elapsed, s.mixIn);
		s.ended = false;
	}

	/** Advance time, fire events, and write the blended pose into the skeleton. */
	update(dt: number): void {
		for (let i = 0; i < this.tracks.length; i++) {
			const s = this.tracks[i];
			if (!s) continue;
			this.advance(s, i, Math.max(0, dt));
		}
		this.apply();
	}

	private advance(s: TrackState, index: number, dt: number): void {
		s.elapsed += dt;
		if (s.ended) {
			s.endElapsed += dt;
			if (s.endElapsed >= s.mixOut) this.tracks[index] = null;
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
			if (index > 0) {
				s.ended = true;
				s.endElapsed = 0;
			}
			return;
		}
		this.fire(s, before, s.warp.toClip(next));
		s.time = next;
	}

	/** Fire events with time in (from, to]. */
	private fire(s: TrackState, from: number, to: number): void {
		const evs = s.clip.events;
		if (!evs || !s.onEvent) return;
		for (const e of evs) if (e.t > from && e.t <= to) s.onEvent(e.name, s.clip);
	}

	/** Blend all tracks into the skeleton's local pose without advancing time. */
	apply(): void {
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
					mirror: this.opts.facing === 'left',
					intensity: s.intensity,
					amp: (role) => s.amp.get(role) ?? 1,
				},
				s.delta,
				s.mask,
				this.angles,
			);
			// crossfade from the snapshot of the clip this one replaced
			const fadeK = s.mixIn > 0 ? smoothstep(s.elapsed / s.mixIn) : 1;
			if (s.snapshot && fadeK < 1) {
				const { delta: sd, mask: sm } = s.snapshot;
				for (let b = 0; b < n; b++) {
					if (!sm[b] && !s.mask[b]) continue;
					s.mask[b] = 1;
					for (let c = 0; c < STRIDE; c++) {
						const j = b * STRIDE + c;
						// rotations blend the short way round (r and r ± 360 look the same)
						const to = c === 0 ? nearestTurn(s.delta[j]!, sd[j]!) : s.delta[j]!;
						s.delta[j] = sd[j]! + (to - sd[j]!) * fadeK;
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
					if (s.clip.additive) res[j] = res[j]! + s.delta[j]! * w;
					else {
						const to = c === 0 ? nearestTurn(s.delta[j]!, res[j]!) : s.delta[j]!;
						res[j] = res[j]! + (to - res[j]!) * w;
					}
				}
			}
		}
		for (let b = 0; b < n; b++) {
			const setup = sk.setup[b]!;
			const l = sk.local[b]!;
			const o = b * STRIDE;
			l.rot = setup.rot + res[o]!;
			l.x = setup.x + res[o + 1]!;
			l.y = setup.y + res[o + 2]!;
			l.sx = setup.sx * (1 + res[o + 3]!);
			l.sy = setup.sy * (1 + res[o + 4]!);
		}
		sk.update();
	}
}
