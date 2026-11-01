/**
 * Snapshot undo/redo. Rigs are small (a few KB to a few hundred KB), so storing whole snapshots
 * is simpler and safer than inverse operations. While a drag is in progress (a transaction) no
 * snapshots are taken; the gesture becomes one undo step when it ends.
 */
export class History {
	private stack: string[] = [];
	private index = -1;
	private depth = 0;
	constructor(private readonly max = 100) {}

	reset(snapshot: string): void {
		this.stack = [snapshot];
		this.index = 0;
		this.depth = 0;
	}

	get canUndo(): boolean {
		return this.index > 0 && this.depth === 0;
	}

	get canRedo(): boolean {
		return this.index < this.stack.length - 1 && this.depth === 0;
	}

	get inTransaction(): boolean {
		return this.depth > 0;
	}

	begin(): void {
		this.depth++;
	}

	/** End a transaction and record the result (only when the outermost one ends). */
	end(snapshot: string): void {
		this.depth = Math.max(0, this.depth - 1);
		if (this.depth === 0) this.record(snapshot);
	}

	/** Record a committed change. Ignored inside a transaction and when nothing changed. */
	record(snapshot: string): void {
		if (this.depth > 0) return;
		if (this.stack[this.index] === snapshot) return;
		this.stack.splice(this.index + 1);
		this.stack.push(snapshot);
		if (this.stack.length > this.max) this.stack.shift();
		this.index = this.stack.length - 1;
	}

	undo(): string | null {
		if (!this.canUndo) return null;
		return this.stack[--this.index]!;
	}

	redo(): string | null {
		if (!this.canRedo) return null;
		return this.stack[++this.index]!;
	}
}
