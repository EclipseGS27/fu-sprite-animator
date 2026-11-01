import type { RigDocument } from '../core/types';
import { parseRig } from '../rig/document';
import type { RigSummary } from '../ui/studio';
import { MODULE_ID, setting } from './constants';

/**
 * World storage. Rig documents are JSON files in the world folder
 * (worlds/<world>/fu-sprite-animator/rigs/<id>.json); a hidden world setting keeps the index.
 * Images are referenced where they are and never rewritten. Only users allowed to upload files
 * (normally the GM) can save; everyone can read.
 */

interface IndexEntry {
	name: string;
	file: string;
	image: string;
	updated: number;
	revision: number;
}

const cache = new Map<string, { revision: number; rig: Promise<RigDocument> }>();

export const FilePickerImpl = () => foundry.applications?.apps?.FilePicker?.implementation ?? (globalThis as { FilePicker?: unknown }).FilePicker;

function worldDir(sub: string): string {
	return `worlds/${game.world.id}/${MODULE_ID}/${sub}`;
}

export function index(): Record<string, IndexEntry> {
	return setting<Record<string, IndexEntry>>('rigs') ?? {};
}

async function ensureDir(path: string): Promise<void> {
	const FP = FilePickerImpl();
	const parts = path.split('/');
	for (let i = 1; i <= parts.length; i++) {
		const p = parts.slice(0, i).join('/');
		try {
			await FP.createDirectory('data', p, {});
		} catch (e) {
			// already there (EEXIST) is fine; anything else surfaces on upload
			void e;
		}
	}
}

async function upload(dir: string, file: File): Promise<string> {
	const FP = FilePickerImpl();
	await ensureDir(dir);
	const res = await FP.upload('data', dir, file, {}, { notify: false });
	const path = res?.path ?? `${dir}/${file.name}`;
	if (res && res.status && res.status !== 'success') throw new Error(res.message ?? 'Upload failed.');
	return path;
}

export function canSave(): boolean {
	return !!game.user?.isGM || !!game.user?.can?.('FILES_UPLOAD');
}

export async function saveRig(rig: RigDocument): Promise<void> {
	if (!canSave()) throw new Error('Only users who may upload files (normally the GM) can save rigs.');
	const file = new File([JSON.stringify(rig)], `${rig.id}.json`, { type: 'application/json' });
	const path = await upload(worldDir('rigs'), file);
	const next = { ...index(), [rig.id]: { name: rig.name, file: path, image: rig.image.src, updated: rig.updated, revision: rig.revision } };
	await game.settings.set(MODULE_ID, 'rigs', next);
	cache.set(rig.id, { revision: rig.revision, rig: Promise.resolve(rig) });
}

export async function loadRig(id: string): Promise<RigDocument> {
	const entry = index()[id];
	if (!entry) throw new Error('This rig is not in the world library.');
	const hit = cache.get(id);
	if (hit && hit.revision === entry.revision) return hit.rig;
	const rig = (async () => {
		const res = await fetch(`${entry.file}?r=${entry.revision}`, { cache: 'no-cache' });
		if (!res.ok) throw new Error(`Could not read ${entry.file} (${res.status}).`);
		return parseRig(await res.json());
	})();
	cache.set(id, { revision: entry.revision, rig });
	rig.catch(() => cache.delete(id));
	return rig;
}

export async function deleteRig(id: string): Promise<void> {
	const next = { ...index() };
	delete next[id];
	await game.settings.set(MODULE_ID, 'rigs', next);
	cache.delete(id);
}

export function listRigs(): RigSummary[] {
	return Object.entries(index()).map(([id, e]) => ({ id, name: e.name, image: e.image, updated: e.updated }));
}

export function revisionOf(id: string): number {
	return index()[id]?.revision ?? 0;
}

/** Store an image from an imported bundle (data URL) in the world folder. */
export async function storeImage(name: string, dataUrl: string): Promise<string> {
	const [head, b64] = dataUrl.split(',', 2);
	const type = /data:([^;]+)/.exec(head ?? '')?.[1] ?? 'image/png';
	const bin = atob(b64 ?? '');
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return upload(worldDir('images'), new File([bytes], name.replace(/[^a-z0-9._-]+/gi, '_'), { type }));
}

/** Ask the GM for an image with Foundry's file picker. */
export function pickImage(current = ''): Promise<string | null> {
	return new Promise((resolve) => {
		const FP = FilePickerImpl();
		let done = false;
		const fp = new FP({
			type: 'image',
			current,
			callback: (path: string) => {
				done = true;
				resolve(path);
			},
		});
		const hook = Hooks.on('closeFilePicker', (app: unknown) => {
			if (app !== fp) return;
			Hooks.off('closeFilePicker', hook);
			// the callback runs before the picker closes; give it a tick
			setTimeout(() => !done && resolve(null), 50);
		});
		fp.render(true);
	});
}

export function pickTextFile(accept: string): Promise<string | null> {
	return new Promise((resolve) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.addEventListener('change', async () => {
			const f = input.files?.[0];
			resolve(f ? await f.text() : null);
		});
		input.addEventListener('cancel', () => resolve(null));
		input.click();
	});
}

export function download(filename: string, text: string): void {
	const save = foundry.utils?.saveDataToFile ?? (globalThis as { saveDataToFile?: (d: string, t: string, f: string) => void }).saveDataToFile;
	if (save) return save(text, 'application/json', filename);
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
