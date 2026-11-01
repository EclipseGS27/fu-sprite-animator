import type { TimeWarp } from '../core/clip';
import type { ClipDocument } from '../core/types';

const PHASE_COLOURS: Record<string, string> = { anticipation: 'rgba(90,169,255,0.28)', action: 'rgba(242,196,90,0.38)', recovery: 'rgba(122,208,143,0.24)' };

/**
 * Timeline strip: time ruler, the clip's phases (as the GM has retimed them), events and the
 * play head. Drag to scrub.
 */
export class Timeline {
	readonly el: HTMLDivElement;
	private readonly canvas: HTMLCanvasElement;
	private clip: ClipDocument | null = null;
	private warp: TimeWarp | null = null;
	private time = 0;
	private dragging = false;
	private ro: ResizeObserver;

	constructor(private readonly onSeek: (playTime: number) => void) {
		this.el = document.createElement('div');
		this.el.className = 'fusa-timeline';
		this.canvas = document.createElement('canvas');
		this.el.append(this.canvas);
		this.canvas.addEventListener('pointerdown', (e) => {
			this.dragging = true;
			this.canvas.setPointerCapture(e.pointerId);
			this.seekAt(e);
		});
		this.canvas.addEventListener('pointermove', (e) => this.dragging && this.seekAt(e));
		this.canvas.addEventListener('pointerup', () => (this.dragging = false));
		this.ro = new ResizeObserver(() => this.draw());
		this.ro.observe(this.el);
	}

	get duration(): number {
		return this.warp?.duration ?? this.clip?.duration ?? 1;
	}

	set(clip: ClipDocument | null, warp: TimeWarp | null, time: number): void {
		const changed = clip !== this.clip || warp !== this.warp || Math.abs(time - this.time) > 1e-4;
		this.clip = clip;
		this.warp = warp;
		this.time = time;
		if (changed) this.draw();
	}

	private seekAt(e: PointerEvent): void {
		const r = this.canvas.getBoundingClientRect();
		const x = Math.max(0, Math.min(1, (e.clientX - r.left - 12) / Math.max(1, r.width - 24)));
		this.onSeek(x * this.duration);
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
		const x0 = 12;
		const x1 = W - 12;
		const dur = this.duration;
		const X = (t: number) => x0 + (t / dur) * (x1 - x0);
		const toPlay = (c: number) => (this.warp ? this.warp.toPlay(c) : c);
		g.fillStyle = 'rgba(255,255,255,0.03)';
		g.fillRect(x0, 18, x1 - x0, H - 26);
		// phases
		const ph = this.clip?.phases;
		if (ph) {
			for (const [name, range] of [['anticipation', ph.anticipation], ['action', ph.action], ['recovery', ph.recovery]] as const) {
				if (!range) continue;
				g.fillStyle = PHASE_COLOURS[name]!;
				const a = X(toPlay(range[0]));
				const b = X(toPlay(range[1]));
				g.fillRect(a, 18, Math.max(1, b - a), H - 26);
				if (b - a > 60) {
					g.fillStyle = 'rgba(238,243,255,0.7)';
					g.font = '600 10px sans-serif';
					g.fillText(name === 'anticipation' ? 'WIND-UP' : name === 'action' ? 'STRIKE' : 'RECOVERY', a + 5, H - 12);
				}
			}
			if (ph.impact !== undefined) {
				g.strokeStyle = '#ff6b6b';
				g.lineWidth = 2;
				g.beginPath();
				g.moveTo(X(toPlay(ph.impact)), 18);
				g.lineTo(X(toPlay(ph.impact)), H - 8);
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
			g.moveTo(x, 18);
			g.lineTo(x, major ? 8 : 13);
			g.stroke();
			if (major) g.fillText(`${t.toFixed(1)}s`, x + 3, 10);
		}
		// events
		for (const ev of this.clip?.events ?? []) {
			const x = X(toPlay(ev.t));
			g.fillStyle = ev.name === 'contact' ? '#ff6b6b' : '#f2c45a';
			g.beginPath();
			g.moveTo(x, 20);
			g.lineTo(x + 4, 24);
			g.lineTo(x, 28);
			g.lineTo(x - 4, 24);
			g.closePath();
			g.fill();
		}
		// play head
		const px = X(Math.min(this.time, dur));
		g.strokeStyle = '#ffffff';
		g.lineWidth = 2;
		g.beginPath();
		g.moveTo(px, 4);
		g.lineTo(px, H - 4);
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
