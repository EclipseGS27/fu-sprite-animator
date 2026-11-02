import type { TimeWarp } from '../core/clip';
import type { ClipDocument } from '../core/types';

const PHASE_COLOURS: Record<string, string> = { anticipation: 'rgba(90,169,255,0.28)', action: 'rgba(242,196,90,0.38)', recovery: 'rgba(122,208,143,0.24)' };

export interface KeyRow {
	label: string;
	/** Key times (clip seconds). */
	keys: number[];
	selected?: number;
	colour?: string;
}

export interface TimelineEvents {
	seek(playTime: number): void;
	selectKey?(row: number, index: number): void;
	moveKey?(row: number, index: number, clipTime: number, done: boolean): void;
}

const RULER = 18;
const BAND = 12;
const ROW = 15;
const PAD_L = 66;
const PAD_R = 12;

/**
 * Timeline strip: time ruler, the clip's phases (as retimed), events, the play head and, while
 * editing, one row of keys per channel of the selected bone. Drag the ruler to scrub, click a key
 * to select it, drag it to move it in time.
 */
export class Timeline {
	readonly el: HTMLDivElement;
	private readonly canvas: HTMLCanvasElement;
	private clip: ClipDocument | null = null;
	private warp: TimeWarp | null = null;
	private time = 0;
	private rows: KeyRow[] = [];
	private drag: { kind: 'scrub' } | { kind: 'key'; row: number; index: number; moved: boolean } | null = null;
	private ro: ResizeObserver;

	constructor(private readonly on: TimelineEvents) {
		this.el = document.createElement('div');
		this.el.className = 'fusa-timeline';
		this.canvas = document.createElement('canvas');
		this.el.append(this.canvas);
		this.canvas.addEventListener('pointerdown', (e) => this.down(e));
		this.canvas.addEventListener('pointermove', (e) => this.move(e));
		this.canvas.addEventListener('pointerup', (e) => this.up(e));
		this.ro = new ResizeObserver(() => this.draw());
		this.ro.observe(this.el);
	}

	get duration(): number {
		return this.warp?.duration ?? this.clip?.duration ?? 1;
	}

	set(clip: ClipDocument | null, warp: TimeWarp | null, time: number, rows: KeyRow[] = this.rows): void {
		const rowsKey = JSON.stringify(rows);
		const changed = clip !== this.clip || warp !== this.warp || Math.abs(time - this.time) > 1e-4 || rowsKey !== JSON.stringify(this.rows);
		this.clip = clip;
		this.warp = warp;
		this.time = time;
		this.rows = rows;
		if (changed) this.draw();
	}

	private geom() {
		const r = this.canvas.getBoundingClientRect();
		const x0 = this.rows.length ? PAD_L : 12;
		return { r, x0, x1: r.width - PAD_R };
	}

	private timeAt(e: PointerEvent): number {
		const { r, x0, x1 } = this.geom();
		return Math.max(0, Math.min(1, (e.clientX - r.left - x0) / Math.max(1, x1 - x0))) * this.duration;
	}

	private toPlay(c: number): number {
		return this.warp ? this.warp.toPlay(c) : c;
	}

	private toClip(p: number): number {
		return this.warp ? this.warp.toClip(p) : p;
	}

	private hitKey(e: PointerEvent): { row: number; index: number } | null {
		const { r, x0, x1 } = this.geom();
		const y = e.clientY - r.top;
		const row = Math.floor((y - RULER - BAND - 4) / ROW);
		if (row < 0 || row >= this.rows.length) return null;
		const keys = this.rows[row]!.keys;
		let best = -1;
		let bestD = 7;
		keys.forEach((t, i) => {
			const x = x0 + (this.toPlay(t) / this.duration) * (x1 - x0);
			const d = Math.abs(e.clientX - r.left - x);
			if (d < bestD) {
				bestD = d;
				best = i;
			}
		});
		return best >= 0 ? { row, index: best } : null;
	}

	private down(e: PointerEvent): void {
		this.canvas.setPointerCapture(e.pointerId);
		const hit = this.hitKey(e);
		if (hit && this.on.selectKey) {
			this.on.selectKey(hit.row, hit.index);
			this.drag = { kind: 'key', ...hit, moved: false };
			return;
		}
		this.drag = { kind: 'scrub' };
		this.on.seek(this.timeAt(e));
	}

	private move(e: PointerEvent): void {
		const d = this.drag;
		if (!d) return;
		if (d.kind === 'scrub') this.on.seek(this.timeAt(e));
		else {
			d.moved = true;
			this.on.moveKey?.(d.row, d.index, this.toClip(this.timeAt(e)), false);
		}
	}

	private up(e: PointerEvent): void {
		const d = this.drag;
		this.drag = null;
		if (d?.kind === 'key' && d.moved) this.on.moveKey?.(d.row, d.index, this.toClip(this.timeAt(e)), true);
	}

	draw(): void {
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
		const g = this.canvas.getContext('2d')!;
		g.setTransform(dpr, 0, 0, dpr, 0, 0);
		g.clearRect(0, 0, W, H);
		const x0 = this.rows.length ? PAD_L : 12;
		const x1 = W - PAD_R;
		const dur = this.duration;
		const X = (t: number) => x0 + (t / dur) * (x1 - x0);
		const editing = this.rows.length > 0;
		const bandBottom = editing ? RULER + BAND : H - 8;
		g.fillStyle = 'rgba(255,255,255,0.03)';
		g.fillRect(x0, RULER, x1 - x0, bandBottom - RULER);
		// phases
		const ph = this.clip?.phases;
		if (ph) {
			for (const [name, range] of [['anticipation', ph.anticipation], ['action', ph.action], ['recovery', ph.recovery]] as const) {
				if (!range) continue;
				g.fillStyle = PHASE_COLOURS[name]!;
				const a = X(this.toPlay(range[0]));
				const b = X(this.toPlay(range[1]));
				g.fillRect(a, RULER, Math.max(1, b - a), bandBottom - RULER);
				if (b - a > 60 && !editing) {
					g.fillStyle = 'rgba(238,243,255,0.7)';
					g.font = '600 10px sans-serif';
					g.fillText(name === 'anticipation' ? 'WIND-UP' : name === 'action' ? 'STRIKE' : 'RECOVERY', a + 5, H - 12);
				}
			}
			if (ph.impact !== undefined) {
				g.strokeStyle = '#ff6b6b';
				g.lineWidth = 2;
				g.beginPath();
				g.moveTo(X(this.toPlay(ph.impact)), RULER);
				g.lineTo(X(this.toPlay(ph.impact)), editing ? H - 2 : H - 8);
				g.stroke();
			}
		}
		// ruler
		g.strokeStyle = 'rgba(159,208,255,0.35)';
		g.fillStyle = 'rgba(238,243,255,0.55)';
		g.font = '10px sans-serif';
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
		// events
		for (const ev of this.clip?.events ?? []) {
			const x = X(this.toPlay(ev.t));
			g.fillStyle = ev.name === 'contact' ? '#ff6b6b' : '#f2c45a';
			g.beginPath();
			g.moveTo(x, RULER + 1);
			g.lineTo(x + 4, RULER + 5);
			g.lineTo(x, RULER + 9);
			g.lineTo(x - 4, RULER + 5);
			g.closePath();
			g.fill();
		}
		// key rows
		this.rows.forEach((row, ri) => {
			const y = RULER + BAND + 4 + ri * ROW;
			g.fillStyle = ri % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.05)';
			g.fillRect(0, y, W, ROW);
			g.fillStyle = 'rgba(238,243,255,0.65)';
			g.font = '10px sans-serif';
			g.fillText(row.label, 6, y + 11);
			row.keys.forEach((t, i) => {
				const x = X(this.toPlay(t));
				const sel = row.selected === i;
				g.fillStyle = sel ? '#ffffff' : (row.colour ?? '#5aa9ff');
				g.strokeStyle = sel ? '#f2c45a' : '#0b1220';
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
		// play head
		const px = X(Math.min(this.time, dur));
		g.strokeStyle = '#ffffff';
		g.lineWidth = 2;
		g.beginPath();
		g.moveTo(px, 4);
		g.lineTo(px, H - 2);
		g.stroke();
		g.fillStyle = '#ffffff';
		g.beginPath();
		g.moveTo(px - 5, 2);
		g.lineTo(px + 5, 2);
		g.lineTo(px, 8);
		g.closePath();
		g.fill();
	}

	destroy(): void {
		this.ro.disconnect();
		this.el.remove();
	}
}
