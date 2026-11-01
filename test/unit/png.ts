import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { inflateSync } from 'node:zlib';
import type { ImageDataLike } from '../../src/sprite/image';

/** Minimal PNG reader for the generated test sprites: 8-bit RGBA, RGB or greyscale, no interlace. */
export function readPng(path: string): ImageDataLike {
	const buf = readFileSync(path);
	let p = 8;
	let width = 0;
	let height = 0;
	let colorType = 0;
	const idat: Buffer[] = [];
	while (p < buf.length) {
		const len = buf.readUInt32BE(p);
		const type = buf.toString('ascii', p + 4, p + 8);
		const data = buf.subarray(p + 8, p + 8 + len);
		if (type === 'IHDR') {
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			if (data[8] !== 8 || data[12] !== 0) throw new Error('Unsupported PNG');
			colorType = data[9]!;
		} else if (type === 'IDAT') idat.push(data);
		else if (type === 'IEND') break;
		p += 12 + len;
	}
	const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : 0;
	if (!channels) throw new Error(`Unsupported PNG colour type ${colorType}`);
	const raw = inflateSync(Buffer.concat(idat));
	const stride = width * channels;
	const px = new Uint8Array(height * stride);
	for (let y = 0; y < height; y++) {
		const f = raw[y * (stride + 1)]!;
		const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
		for (let x = 0; x < stride; x++) {
			const a = x >= channels ? px[y * stride + x - channels]! : 0;
			const b = y > 0 ? px[(y - 1) * stride + x]! : 0;
			const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels]! : 0;
			let v = row[x]!;
			if (f === 1) v += a;
			else if (f === 2) v += b;
			else if (f === 3) v += (a + b) >> 1;
			else if (f === 4) {
				const pp = a + b - c;
				const pa = Math.abs(pp - a);
				const pb = Math.abs(pp - b);
				const pc = Math.abs(pp - c);
				v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
			}
			px[y * stride + x] = v & 255;
		}
	}
	const data = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		if (channels === 4) data.set(px.subarray(i * 4, i * 4 + 4), i * 4);
		else if (channels === 3) data.set([px[i * 3]!, px[i * 3 + 1]!, px[i * 3 + 2]!, 255], i * 4);
		else if (channels === 2) data.set([px[i * 2]!, px[i * 2]!, px[i * 2]!, px[i * 2 + 1]!], i * 4);
		else data.set([px[i]!, px[i]!, px[i]!, 255], i * 4);
	}
	return { width, height, data };
}

export const SPRITES = ['warrior', 'mage', 'greatsword', 'knight', 'tiny', 'wolf', 'slime', 'illustrated', 'swordsman_white', 'mage_front', 'golem', 'ghost', 'dragon'] as const;
export const spritePath = (name: string) => new URL(`../sprites/${name}.png`, import.meta.url).pathname;

/** Write an RGBA PNG (for debugging and visual review). */
export function writePng(path: string, img: ImageDataLike, scale = 1): void {
	const { deflateSync } = require('node:zlib') as typeof import('node:zlib');
	const { writeFileSync } = require('node:fs') as typeof import('node:fs');
	const w = img.width * scale;
	const h = img.height * scale;
	const raw = Buffer.alloc((w * 4 + 1) * h);
	for (let y = 0; y < h; y++) {
		raw[y * (w * 4 + 1)] = 0;
		for (let x = 0; x < w; x++) {
			const s = ((Math.floor(y / scale) * img.width + Math.floor(x / scale)) * 4);
			for (let c = 0; c < 4; c++) raw[y * (w * 4 + 1) + 1 + x * 4 + c] = img.data[s + c]!;
		}
	}
	const crcTable = Array.from({ length: 256 }, (_, n) => {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		return c >>> 0;
	});
	const crc = (b: Buffer) => {
		let c = 0xffffffff;
		for (const v of b) c = crcTable[(c ^ v) & 255]! ^ (c >>> 8);
		return (c ^ 0xffffffff) >>> 0;
	};
	const chunk = (type: string, data: Buffer) => {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
		const c = Buffer.alloc(4);
		c.writeUInt32BE(crc(td));
		return Buffer.concat([len, td, c]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0);
	ihdr.writeUInt32BE(h, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
