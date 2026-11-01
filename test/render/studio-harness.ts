/**
 * The Studio outside Foundry, for automated UI tests and screenshots: a host that keeps rigs in
 * memory/localStorage and serves images from the repository.
 */
import { Studio, type StudioHost, type RigSummary } from '../../src/ui/studio';
import type { RigDocument } from '../../src/core/types';

const store = new Map<string, RigDocument>();
const log: string[] = [];
let nextImage = '../sprites/warrior.png';
let confirmAnswer = true;

const host: StudioHost = {
	pickImage: async () => nextImage,
	saveRig: async (rig) => void store.set(rig.id, JSON.parse(JSON.stringify(rig))),
	listRigs: async (): Promise<RigSummary[]> => [...store.values()].map((r) => ({ id: r.id, name: r.name, image: r.image.src, updated: r.updated })),
	loadRig: async (id) => JSON.parse(JSON.stringify(store.get(id))),
	download: (name, text) => void ((window as unknown as { lastDownload: unknown }).lastDownload = { name, text }),
	pickTextFile: async () => (window as unknown as { nextFile: string | null }).nextFile ?? null,
	storeImage: async (_name, dataUrl) => dataUrl,
	notify: (m, t = 'info') => void log.push(`${t}: ${m}`),
	confirm: async () => confirmAnswer,
};

const studio = new Studio(document.getElementById('app')!, host);
Object.assign(window, {
	studio,
	store,
	log,
	setNextImage: (src: string) => (nextImage = src),
	setConfirm: (v: boolean) => (confirmAnswer = v),
});
(window as unknown as { harnessReady: boolean }).harnessReady = true;
