/**
 * Run-length encoding for the ownership map: (value byte, run length as LEB128 varint) pairs,
 * then base64. A 256×256 map with a dozen parts is typically 2–6 KB.
 */

function toBase64(bytes: Uint8Array): string {
	let bin = '';
	const CHUNK = 0x8000;
	for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	return btoa(bin);
}

function fromBase64(str: string): Uint8Array {
	const bin = atob(str);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

export function encodeRle(data: Uint8Array): string {
	const out: number[] = [];
	let i = 0;
	while (i < data.length) {
		const v = data[i]!;
		let run = 1;
		while (i + run < data.length && data[i + run] === v) run++;
		out.push(v);
		let r = run;
		while (r >= 0x80) {
			out.push((r & 0x7f) | 0x80);
			r >>>= 7;
		}
		out.push(r);
		i += run;
	}
	return toBase64(Uint8Array.from(out));
}

/** Decode into exactly `length` values; throws if the data does not match the length. */
export function decodeRle(str: string, length: number): Uint8Array {
	const bytes = fromBase64(str);
	const out = new Uint8Array(length);
	let p = 0;
	let o = 0;
	while (p < bytes.length) {
		const v = bytes[p++]!;
		let run = 0;
		let shift = 0;
		for (;;) {
			if (p >= bytes.length) throw new Error('Ownership map is truncated.');
			const b = bytes[p++]!;
			run |= (b & 0x7f) << shift;
			if (!(b & 0x80)) break;
			shift += 7;
		}
		if (o + run > length) throw new Error('Ownership map is larger than the image.');
		out.fill(v, o, o + run);
		o += run;
	}
	if (o !== length) throw new Error(`Ownership map covers ${o} of ${length} pixels.`);
	return out;
}
