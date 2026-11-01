/** Tiny DOM helpers: no framework, so the Studio mounts the same way in Foundry and in tests. */

type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown> & { class?: string; style?: string; dataset?: Record<string, string> };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	if (props) {
		for (const [k, v] of Object.entries(props)) {
			if (v === undefined || v === null || v === false) continue;
			if (k === 'class') el.className = String(v);
			else if (k === 'style') el.setAttribute('style', String(v));
			else if (k === 'dataset') Object.assign(el.dataset, v as Record<string, string>);
			else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
			else if (k === 'html') el.innerHTML = String(v);
			else if (k in el && typeof v !== 'string') (el as unknown as Record<string, unknown>)[k] = v;
			else el.setAttribute(k, v === true ? '' : String(v));
		}
	}
	append(el, children);
	return el;
}

export function append(el: Element, children: Child[]): void {
	for (const c of children) {
		if (c === null || c === undefined || c === false) continue;
		el.append(c instanceof Node ? c : document.createTextNode(String(c)));
	}
}

export function clear(el: Element): void {
	while (el.firstChild) el.firstChild.remove();
}

export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Inline icons (stroke icons drawn for this module, 16px grid). */
const PATHS: Record<string, string> = {
	bone: 'M4 12 12 4M3 11a2 2 0 1 0 2 2M11 3a2 2 0 1 0 2 2',
	add: 'M8 3v10M3 8h10',
	trash: 'M3 4h10M6 4V2.5h4V4M4.5 4l.7 9h5.6l.7-9',
	undo: 'M5 3 2 6l3 3M2 6h7a4 4 0 0 1 0 8H6',
	redo: 'M11 3l3 3-3 3M14 6H7a4 4 0 0 0 0 8h3',
	play: 'M5 3v10l8-5z',
	pause: 'M5 3v10M11 3v10',
	stop: 'M4 4h8v8H4z',
	loop: 'M3 7a4 4 0 0 1 4-4h5l-2-2M13 9a4 4 0 0 1-4 4H4l2 2',
	save: 'M3 3h8l2 2v8H3zM5 3v3h5V3M5 13V9h6v4',
	open: 'M2 4h5l1 2h6v7H2z',
	import: 'M8 2v8M5 7l3 3 3-3M3 12v2h10v-2',
	export: 'M8 10V2M5 5l3-3 3 3M3 12v2h10v-2',
	image: 'M2 3h12v10H2zM2 11l4-4 3 3 2-2 3 3M10.5 6.5h.01',
	fit: 'M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4',
	eye: 'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
	brush: 'M10 2l4 4-6 6-4-4zM4 8l-2 6 6-2',
	bucket: 'M3 7l5-5 5 5-5 5zM13 9s1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3',
	wand: 'M2 14 10 6M9 2v2M13 6h-2M12 3l-1.5 1.5M6 3l1 1',
	reset: 'M3 8a5 5 0 1 0 1.5-3.5M3 2v3h3',
	dice: 'M3 3h10v10H3zM6 6h.01M10 10h.01M8 8h.01',
	user: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 14c0-3 3-4 6-4s6 1 6 4',
	up: 'M8 13V3M4 7l4-4 4 4',
	down: 'M8 3v10M4 9l4 4 4-4',
	warn: 'M8 2 1 14h14zM8 6v4M8 12h.01',
};

export function icon(name: string, title?: string): SVGSVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 16 16');
	svg.setAttribute('class', 'fusa-icon');
	svg.setAttribute('aria-hidden', 'true');
	const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	p.setAttribute('d', PATHS[name] ?? PATHS.bone!);
	svg.append(p);
	if (title) {
		const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
		t.textContent = title;
		svg.append(t);
	}
	return svg;
}

/** Icon button. */
export function ibtn(name: string, title: string, onClick: (e: MouseEvent) => void, extra: Props = {}): HTMLButtonElement {
	return h('button', { type: 'button', title, 'aria-label': title, onclick: onClick, ...extra, class: `fusa-ibtn ${extra.class ?? ''}`.trim() }, icon(name));
}

/** Labelled range input with a live value. */
export function slider(label: string, value: number, min: number, max: number, step: number, onInput: (v: number) => void, fmt: (v: number) => string = (v) => String(v)): HTMLLabelElement {
	const out = h('output', null, fmt(value));
	const input = h('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) });
	input.addEventListener('input', () => {
		const v = Number(input.value);
		out.textContent = fmt(v);
		onInput(v);
	});
	return h('label', { class: 'fusa-slider' }, h('span', null, label), input, out);
}
