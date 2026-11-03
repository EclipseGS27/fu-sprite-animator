import { distanceToSegment } from '../../src/core/math';
import type { Point } from '../../src/sprite/analysis';
import type { ImageDataLike } from '../../src/sprite/image';

/** Independently drawn capsule figures with known joints. No production detector constants. */
export function posedFigure(seed: number): { image: ImageDataLike; elbows: [Point, Point]; hands: [Point, Point] } {
	const width = 256, height = 256, data = new Uint8ClampedArray(width * height * 4);
	const r = 6 + seed % 4;
	const elbows: [Point, Point] = [[60 + seed % 11, 105 + seed % 12], [178 + seed % 7, 103 + seed % 13]];
	const hands: [Point, Point] = [[70 + seed % 9, 54 + seed % 16], [194 + seed % 8, 141 - seed % 13]];
	const capsule = (a: Point, b: Point, radius: number, color: number[]) => {
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (distanceToSegment(x + 0.5, y + 0.5, a[0], a[1], b[0], b[1]) <= radius) data.set([...color, 255], (y * width + x) * 4);
	};
	const skin = [180 + seed % 50, 100, 70], cloth = [40, 90 + seed % 60, 140];
	capsule([118, 143], [90 - seed % 9, 183], 10, cloth);
	capsule([90 - seed % 9, 183], [82 - seed % 8, 227], 9, cloth);
	capsule([138, 143], [154 + seed % 9, 183], 10, cloth);
	capsule([154 + seed % 9, 183], [166 + seed % 8, 227], 9, cloth);
	capsule([128, 79], [128, 142], 20 + seed % 4, cloth);
	capsule([128, 55], [128, 78], 8, skin);
	capsule([128, 42], [128, 42], 14 + seed % 4, skin);
	for (let k = 0; k < 2; k++) {
		capsule(k ? [149, 79] : [107, 79], elbows[k]!, r, skin);
		capsule(elbows[k]!, hands[k]!, r, skin);
		capsule(hands[k]!, hands[k]!, r + 1, skin);
	}
	return { image: { width, height, data }, elbows, hands };
}

export function transformImage(image: ImageDataLike, scale = 1, padX = 0, padY = 0, mirror = false, opacity = 1): ImageDataLike {
	const width = image.width * scale + padX * 2, height = image.height * scale + padY * 2;
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < image.height * scale; y++) for (let x = 0; x < image.width * scale; x++) {
		const sx = Math.floor(x / scale), sy = Math.floor(y / scale);
		const source = (sy * image.width + (mirror ? image.width - 1 - sx : sx)) * 4;
		const target = ((y + padY) * width + x + padX) * 4;
		data.set(image.data.subarray(source, source + 4), target);
		data[target + 3] = Math.round(data[target + 3]! * opacity);
	}
	return { width, height, data };
}

/** A family of curved, tapered bodies with a bulbous head and no legs. */
export function serpentFigure(seed: number): ImageDataLike {
	const width = 256, height = 256, data = new Uint8ClampedArray(width * height * 4);
	const points: Point[] = [[28, 205], [78, 212 - seed], [119, 170 + seed], [166, 157], [190, 103], [193 + seed, 61]];
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		let inside = false;
		for (let k = 1; k < points.length; k++) {
			const a = points[k - 1]!, b = points[k]!;
			if (distanceToSegment(x + 0.5, y + 0.5, a[0], a[1], b[0], b[1]) < 4 + k + seed % 3) inside = true;
		}
		if (Math.hypot(x + 0.5 - points[5]![0], y + 0.5 - points[5]![1]) < 17 + seed % 3) inside = true;
		if (inside) data.set([70, 130, 60, 255], (y * width + x) * 4);
	}
	return { width, height, data };
}
