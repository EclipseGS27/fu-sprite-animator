/**
 * 2D math for the skeleton. Coordinates are sprite pixels with +y pointing down, so a positive
 * angle turns clockwise on screen. Angles in documents are degrees; matrices use radians.
 */

export const DEG = Math.PI / 180;

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (t: number): number => {
	const x = clamp(t, 0, 1);
	return x * x * (3 - 2 * x);
};

/** Wrap an angle in degrees into (-180, 180]. */
export function wrapDeg(a: number): number {
	let r = a % 360;
	if (r <= -180) r += 360;
	else if (r > 180) r -= 360;
	return r;
}

/**
 * Affine matrix [a c tx; b d ty; 0 0 1]: x' = a·x + c·y + tx, y' = b·x + d·y + ty.
 * Mutable for speed: the skeleton reuses one instance per bone.
 */
export class Affine {
	constructor(
		public a = 1,
		public b = 0,
		public c = 0,
		public d = 1,
		public tx = 0,
		public ty = 0,
	) {}

	static identity(): Affine {
		return new Affine();
	}

	/** Translate · Rotate(deg) · Scale */
	static fromTRS(x: number, y: number, rotDeg: number, sx: number, sy: number): Affine {
		return new Affine().setTRS(x, y, rotDeg, sx, sy);
	}

	setTRS(x: number, y: number, rotDeg: number, sx: number, sy: number): this {
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

	copyFrom(m: Affine): this {
		this.a = m.a;
		this.b = m.b;
		this.c = m.c;
		this.d = m.d;
		this.tx = m.tx;
		this.ty = m.ty;
		return this;
	}

	clone(): Affine {
		return new Affine(this.a, this.b, this.c, this.d, this.tx, this.ty);
	}

	/** this = l · r (r applied first). Safe when this is l or r. */
	setMultiply(l: Affine, r: Affine): this {
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

	multiply(r: Affine): Affine {
		return new Affine().setMultiply(this, r);
	}

	determinant(): number {
		return this.a * this.d - this.b * this.c;
	}

	invert(): Affine {
		const det = this.determinant();
		if (Math.abs(det) < 1e-12) return new Affine(1, 0, 0, 1, -this.tx, -this.ty);
		const id = 1 / det;
		const a = this.d * id;
		const b = -this.b * id;
		const c = -this.c * id;
		const d = this.a * id;
		return new Affine(a, b, c, d, -(a * this.tx + c * this.ty), -(b * this.tx + d * this.ty));
	}

	apply(x: number, y: number): [number, number] {
		return [this.a * x + this.c * y + this.tx, this.b * x + this.d * y + this.ty];
	}

	/** World angle of the local +x axis, degrees. */
	angle(): number {
		return Math.atan2(this.b, this.a) / DEG;
	}

	isTranslationOnly(eps = 1e-6): boolean {
		return Math.abs(this.a - 1) < eps && Math.abs(this.b) < eps && Math.abs(this.c) < eps && Math.abs(this.d - 1) < eps;
	}
}

/** Distance from p to segment ab. */
export function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	const len2 = dx * dx + dy * dy;
	let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
	t = clamp(t, 0, 1);
	const qx = ax + dx * t - px;
	const qy = ay + dy * t - py;
	return Math.sqrt(qx * qx + qy * qy);
}

/** Small deterministic PRNG (mulberry32) for animation variations. */
export function rng(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** FNV-1a hash of a string, for stable seeds. */
export function hashString(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
	return h;
}
