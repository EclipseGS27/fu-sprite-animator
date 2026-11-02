// A small stand-in for the parts of Foundry v13 the module touches, so the built bundle
// (dist/fu-sprite-animator.mjs) can be exercised in a browser. NOT a substitute for testing in
// Foundry: it only catches wiring mistakes (hooks, storage, token swap, API, socket).
(() => {
	const log = (window.mockLog = []);
	const files = (window.mockFiles = new Map());
	const realFetch = window.fetch.bind(window);
	window.fetch = async (url, opts) => {
		const path = String(url).split('?')[0];
		if (files.has(path)) return new Response(files.get(path), { status: 200, headers: { 'content-type': 'application/json' } });
		return realFetch(url, opts);
	};

	const hooks = new Map();
	let hid = 0;
	window.Hooks = {
		on(name, fn) {
			const id = ++hid;
			if (!hooks.has(name)) hooks.set(name, new Map());
			hooks.get(name).set(id, fn);
			return id;
		},
		once(name, fn) {
			const id = this.on(name, (...a) => (this.off(name, id), fn(...a)));
			return id;
		},
		off(name, id) {
			hooks.get(name)?.delete(id);
		},
		callAll(name, ...args) {
			for (const fn of [...(hooks.get(name)?.values() ?? [])]) fn(...args);
			return true;
		},
		call(name, ...args) {
			for (const fn of [...(hooks.get(name)?.values() ?? [])]) if (fn(...args) === false) return false;
			return true;
		},
	};

	const settings = new Map();
	const registered = new Map();
	const instances = new Map();

	class ApplicationV2 {
		static DEFAULT_OPTIONS = {};
		constructor(options = {}) {
			this.options = { ...this.constructor.DEFAULT_OPTIONS, ...options };
			this.id = this.options.id ?? `app-${Math.random().toString(36).slice(2)}`;
		}
		async render() {
			if (!this.element) {
				const win = document.createElement('section');
				win.className = `application ${(this.options.classes ?? []).join(' ')}`;
				win.style.cssText = 'position:fixed;left:10px;top:10px;width:1300px;height:820px;display:flex;flex-direction:column;';
				const header = document.createElement('header');
				header.className = 'window-header';
				header.textContent = this.options.window?.title ?? '';
				const content = document.createElement('div');
				content.className = 'window-content';
				content.style.cssText = 'flex:1;position:relative;';
				win.append(header, content);
				document.body.append(win);
				this.element = win;
				this.content = content;
				instances.set(this.id, this);
			}
			const html = await this._renderHTML({}, {});
			this._replaceHTML(html, this.content, {});
			return this;
		}
		async close() {
			this._onClose?.({});
			this.element?.remove();
			this.element = null;
			instances.delete(this.id);
			return this;
		}
	}

	class FilePicker {
		static async upload(_source, dir, file) {
			const path = `${dir}/${file.name}`;
			files.set(path, await file.text());
			return { status: 'success', path };
		}
		static async createDirectory() {
			throw new Error('EEXIST');
		}
		constructor(o) {
			this.o = o;
		}
		render() {
			setTimeout(() => this.o.callback(window.mockNextImage ?? '../sprites/warrior.png'), 0);
			return this;
		}
	}

	const flagsOf = (obj) => ({
		flags: {},
		getFlag(scope, key) {
			return this.flags[scope]?.[key];
		},
		async setFlag(scope, key, value) {
			(this.flags[scope] ??= {})[key] = value;
			Hooks.callAll(this.documentName === 'Actor' ? 'updateActor' : 'updateToken', this, { flags: { [scope]: { [key]: value } } });
			return this;
		},
		async unsetFlag(scope, key) {
			delete this.flags[scope]?.[key];
			Hooks.callAll('updateActor', this, { flags: { [scope]: { [`-=${key}`]: null } } });
		},
		async update() {
			return this;
		},
		...obj,
	});

	const actors = new Map();
	window.game = {
		world: { id: 'mock-world' },
		system: { id: 'projectfu', version: '4.14.0 (mock)' },
		items: [],
		user: { id: 'user-1', isGM: true, can: () => true, targets: new Set() },
		settings: {
			register(mod, key, data) {
				registered.set(`${mod}.${key}`, data);
				if (!settings.has(`${mod}.${key}`)) settings.set(`${mod}.${key}`, data.default);
			},
			registerMenu() {},
			get(mod, key) {
				if (!registered.has(`${mod}.${key}`)) throw new Error(`setting ${mod}.${key} not registered`);
				return settings.get(`${mod}.${key}`);
			},
			async set(mod, key, value) {
				settings.set(`${mod}.${key}`, value);
				Hooks.callAll('updateSetting', { key: `${mod}.${key}`, value });
				registered.get(`${mod}.${key}`)?.onChange?.(value);
				return value;
			},
		},
		modules: new Map([['fu-sprite-animator', { id: 'fu-sprite-animator', active: true }]]),
		socket: { emitted: [], emit(...a) { this.emitted.push(a); }, on(name, fn) { this.handler = fn; } },
		actors: Object.assign(actors, { getName: (n) => [...actors.values()].find((a) => a.name === n) }),
	};
	window.ui = { notifications: { info: (m) => log.push(`info: ${m}`), warn: (m) => log.push(`warn: ${m}`), error: (m) => log.push(`error: ${m}`) } };
	window.foundry = {
		applications: {
			api: {
				ApplicationV2,
				DialogV2: { confirm: async () => true, prompt: async () => null },
			},
			apps: { FilePicker: { implementation: FilePicker } },
			instances,
		},
		utils: {
			randomID: (n = 16) => Math.random().toString(36).slice(2, 2 + n).padEnd(n, '0'),
			fromUuidSync: (u) => window.fromUuidSync(u),
			getProperty: (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj),
		},
		canvas: { primary: {} },
	};
	// documents reachable by uuid (items, tokens)
	const uuids = (window.mockUuids = new Map());
	window.fromUuidSync = (u) => uuids.get(u) ?? null;
	const expand = (changes) => {
		const out = {};
		for (const [path, v] of Object.entries(changes)) {
			const keys = path.split('.');
			let o = out;
			for (const k of keys.slice(0, -1)) o = o[k] ??= {};
			o[keys.at(-1)] = v;
		}
		return out;
	};
	window.mockMakeActor = (id, name, hp = 40) => {
		const a = flagsOf({ id, name, documentName: 'Actor', isOwner: true, statuses: new Set(), system: { resources: { hp: { value: hp, max: hp } }, equipped: {} }, items: Object.assign([], { get: (iid) => a.items.find((i) => i.id === iid) }) });
		a.getActiveTokens = () => window.canvas.tokens.placeables.filter((t) => t.actor === a);
		a.update = async (changes) => {
			for (const [path, v] of Object.entries(changes)) {
				const keys = path.split('.');
				let o = a;
				for (const k of keys.slice(0, -1)) o = o[k] ??= {};
				o[keys.at(-1)] = v;
			}
			Hooks.callAll('updateActor', a, expand(changes));
			return a;
		};
		actors.set(id, a);
		return a;
	};
	window.mockMakeItem = (id, actor, data) => {
		const it = flagsOf({ id, documentName: 'Item', isOwner: true, actor, uuid: `Actor.${actor?.id}.Item.${id}`, ...data });
		it.setFlag = async function (scope, key, value) {
			(this.flags[scope] ??= {})[key] = value;
			return this;
		};
		it.unsetFlag = async function (scope, key) {
			delete this.flags[scope]?.[key];
			return this;
		};
		actor?.items.push(it);
		uuids.set(it.uuid, it);
		return it;
	};
	/** A Project FU chat card posted by this user. */
	window.mockChatCard = (speakerToken, check, itemUuid = null) => ({
		author: { id: 'user-1' },
		speaker: { token: speakerToken, scene: 'scene-1' },
		getFlag: (scope, key) => (scope !== 'projectfu' ? undefined : key === 'Check' ? check : key === 'Item' ? itemUuid : undefined),
	});
	window.mockMakeToken = async (id, actor, src, x, y, size) => {
		const P = window.PIXI;
		const texture = await P.Assets.load(src);
		texture.baseTexture.scaleMode = P.SCALE_MODES.NEAREST;
		const mesh = new P.Sprite(texture);
		mesh.anchor.set(0.5, 0.5);
		mesh.width = size;
		mesh.height = size * (texture.height / texture.width);
		mesh.position.set(x, y);
		window.canvas.app.stage.addChild(mesh);
		const token = { id, name: actor.name, actor, mesh, texture, visible: true, document: flagsOf({ documentName: 'Token', id }) };
		window.canvas.tokens.placeables.push(token);
		uuids.set(`Scene.scene-1.Token.${id}`, token.document);
		return token;
	};
	window.canvas = {
		ready: true,
		scene: { id: 'scene-1' },
		app: null,
		tokens: {
			placeables: [],
			get(id) {
				return this.placeables.find((t) => t.id === id);
			},
		},
	};
})();
