// src/parser.ts

export interface ChordToken {
	text: string;
	startCol: number;
}
export interface BarSlice {
	start: number;
	end: number;
	text: string;
}

export interface SongRow {
	chordLine: string;
	chords: ChordToken[];
	bars: number[];
	barSlices: BarSlice[]; // segments between pipes (tail included)
	lyrics: string;
	repeat?: number;
	modulation?: string;
	prevGap?: boolean;
}

export interface SongSection {
	name: string;
	note?: string;
	prevGap?: boolean;
	rows: SongRow[];
}

export interface Song {
	sections: SongSection[];
}

const TAB_WIDTH = 4;

const HEADER_RE = /^\s*\[([^\]]+)\]\s*$/; // [Section]
const MOD_RE = /^\s*\{\s*(.+?)\s*\}\s*$/; // { Mod IV } or { I }
const REPEAT_HINT_RE = /[\(\[]\s*x\s*(\d+)\s*[\)\]]/i;

// DEGREE chord token (Roman numerals + quality/extensions). Includes sus.
const CHORD_RE =
	/\b(b|#)?(I{1,3}|IV|V|VI|VII|i{1,3}|iv|v|vi|vii)(m|°|dim|aug|ø|sus\d*)?((?:maj7|6|7|9|11|13|add\d+|b\d+|#\d+)*)\b/g;

function expandTabs(s: string): string {
	return s.replace(/\t/g, " ".repeat(TAB_WIDTH));
}

export function parseSong(src: string): Song {
	const lines = src.split(/\r?\n/).map(expandTabs);
	const sections: SongSection[] = [];
	let current: SongSection | null = null;
	let i = 0;
	let pendingMod: string | undefined;
	let sawBlank = true;

	// Track the last row across the whole song (spans sections).
	let lastRowGlobal: SongRow | undefined;

	const newSection = (name: string) => {
		const sec: SongSection = { name, rows: [], prevGap: sawBlank };
		sections.push(sec);
		return sec;
	};

	while (i < lines.length) {
		if (!lines[i].trim()) {
			sawBlank = true;
			i++;
			continue;
		}
		const raw = lines[i];

		// [Section]
		const h = raw.match(HEADER_RE);
		if (h) {
			current = newSection(h[1].trim());
			i++;
			sawBlank = true;
			continue;
		}

		// { Mod ... } or { I }
		const m = raw.match(MOD_RE);
		if (m) {
			const inner = m[1].trim();
			pendingMod = /^Mod\s+/i.test(inner)
				? inner.replace(/^Mod\s+/i, "").trim()
				: inner;
			if (!current) current = newSection("Untitled");
			current.note = inner;
			i++;
			sawBlank = true;
			continue;
		}

		// Chord line + Lyrics line
		if (i + 1 >= lines.length) break;
		const chordLine = lines[i];
		const lyricLine = lines[i + 1];
		if (HEADER_RE.test(lyricLine) || MOD_RE.test(lyricLine)) {
			i++;
			continue;
		}

		if (!current) current = newSection("Untitled");
		const repeat = extractRepeatHint(lyricLine);

		const prevRowForMerge = lastRowGlobal; // may be from previous section
		const row = makeRow(
			chordLine,
			lyricLine,
			pendingMod,
			sawBlank,
			repeat,
			prevRowForMerge,
		);

		pendingMod = undefined;
		sawBlank = false;

		current.rows.push(row);
		lastRowGlobal = row; // update global last row pointer

		i += 2;
	}

	return { sections };
}

function extractRepeatHint(lyrics: string): number | undefined {
	const m = lyrics.match(REPEAT_HINT_RE);
	if (!m) return undefined;
	const n = parseInt(m[1], 10);
	return Number.isFinite(n) && n > 1 ? n : undefined;
}

function makeRow(
	chordLine: string,
	lyrics: string,
	modulation?: string,
	prevGap?: boolean,
	repeat?: number,
	prevRowGlobal?: SongRow,
): SongRow {
	const bars = extractBars(chordLine);
	let slices = extractBarSlicesSegments(chordLine, bars);

	// Carry-over logic:
	// If this chord line does NOT start with a pipe, merge its leading slice into
	// the last bar of the previous row (even across sections).
	const startsWithPipe = /^\s*\|/.test(chordLine);
	if (
		!startsWithPipe &&
		prevRowGlobal &&
		prevRowGlobal.barSlices.length > 0
	) {
		const head = slices.shift(); // first slice from this line
		if (head && head.text) {
			const lastIdx = prevRowGlobal.barSlices.length - 1;
			const last = prevRowGlobal.barSlices[lastIdx];
			// merge texts with single space; keep previous bar boundaries
			last.text = (last.text + " " + head.text).trim();
			// Note: we do not mutate prevRowGlobal.bars; rendering uses barSlices.
		}
	}

	return {
		chordLine,
		chords: extractChords(chordLine),
		bars,
		barSlices: slices,
		lyrics,
		repeat,
		modulation,
		prevGap,
	};
}

function extractBars(line: string): number[] {
	const out: number[] = [];
	for (let i = 0; i < line.length; i++) if (line[i] === "|") out.push(i);
	return out;
}

function extractChords(line: string): ChordToken[] {
	const toks: ChordToken[] = [];
	CHORD_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = CHORD_RE.exec(line)) !== null)
		toks.push({ text: m[0], startCol: m.index });
	return toks;
}

/** Segments between pipes, including the tail after the last '|' as a bar. */
function extractBarSlicesSegments(line: string, bars: number[]): BarSlice[] {
	if (bars.length === 0) {
		const t = line.trim();
		return t ? [{ start: 0, end: line.length, text: t }] : [];
	}
	const anchors = [-1, ...bars, line.length];
	const slices: BarSlice[] = [];
	for (let i = 0; i < anchors.length - 1; i++) {
		const start = anchors[i] + 1;
		const end = anchors[i + 1];
		const raw = line.slice(start, end);
		slices.push({ start, end, text: raw.trim() });
	}
	return slices;
}
