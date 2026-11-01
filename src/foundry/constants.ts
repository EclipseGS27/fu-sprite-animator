export const MODULE_ID = 'fu-sprite-animator';
export const SOCKET = `module.${MODULE_ID}`;
export const STUDIO_TITLE = 'Fabula Ultima — Sprite Animation Studio';

/** What an actor (or a token, overriding its actor) stores about its animation. */
export interface AnimationProfile {
	/** Rig id in this world's library. */
	rig: string;
	enabled: boolean;
	/** Base loop: 'idle-breathing', 'combat-stance', or '' for none. */
	idle?: string;
	/** Amplitude multiplier for every clip on this character. */
	intensity?: number;
}

export function setting<T = unknown>(key: string): T | undefined {
	try {
		return game.settings.get(MODULE_ID, key) as T;
	} catch {
		return undefined;
	}
}

export function log(...args: unknown[]): void {
	console.log(`${MODULE_ID} |`, ...args);
}
