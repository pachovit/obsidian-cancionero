import { ABSOLUTE_CHORD_RE } from "./chordPatterns";

// Convert absolute chords (Dmaj7, Em, F#m7, E/G#...) to Roman degrees for a given tonic.
// Keeps quality/alterations as suffixes. Slash bass becomes "/<degree>".
const NOTE_PC: Record<string, number> = {
	C: 0,
	"C#": 1,
	Db: 1,
	D: 2,
	"D#": 3,
	Eb: 3,
	E: 4,
	"E#": 5,
	Fb: 4,
	F: 5,
	"F#": 6,
	Gb: 6,
	G: 7,
	"G#": 8,
	Ab: 8,
	A: 9,
	"A#": 10,
	Bb: 10,
	B: 11,
	"B#": 0,
	Cb: 11,
};

const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11]; // I II III IV V VI VII

type Match = {
	raw: string;
	root: string; // e.g., F#, Eb
	suffix: string; // e.g., maj7, m7, 7sus, add9, dim, aug, °, ø, b9, #11, etc.
	slash?: string; // optional bass, e.g., G#
	index: number; // start index in line
};

export function convertAbsoluteToDegrees(input: string, tonic: string): string {
	const T = normNote(tonic);
	if (!(T in NOTE_PC)) throw new Error(`Unknown tonic: ${tonic}`);
	const tonicPc = NOTE_PC[T];

	return input
		.split(/\r?\n/)
		.map((line) => {
			ABSOLUTE_CHORD_RE.lastIndex = 0;
			const parts: string[] = [];
			let last = 0;
			let m: RegExpExecArray | null;
			while ((m = ABSOLUTE_CHORD_RE.exec(line)) !== null) {
				const [raw, root, s1, s2, slash] = m;
				const suffix = (s1 || "") + (s2 || "");
				parts.push(line.slice(last, m.index));
				parts.push(
					toDegreeToken(
						{ raw, root, suffix, slash, index: m.index },
						tonicPc,
					),
				);
				last = m.index + raw.length;
			}
			parts.push(line.slice(last));
			return parts.join("");
		})
		.join("\n");
}

function toDegreeToken(tok: Match, tonicPc: number): string {
	const rootPc = NOTE_PC[normNote(tok.root)];
	if (rootPc === undefined) return tok.raw;

	const { degreeIndex, accidental } = nearestDegree(rootPc, tonicPc);
	const numeral = ["I", "II", "III", "IV", "V", "VI", "VII"][degreeIndex];
	const acc =
		accidental === -1
			? "♭"
			: accidental === 1
				? "♯"
				: accidental === -2
					? "♭♭"
					: accidental === 2
						? "♯♯"
						: "";

	const quality = normalizeQuality(tok.suffix || "");
	const rn = numeral + quality;

	if (tok.slash) {
		const bassPc = NOTE_PC[normNote(tok.slash)];
		if (bassPc !== undefined) {
			const b = nearestDegree(bassPc, tonicPc);
			const bassNumeral = ["I", "II", "III", "IV", "V", "VI", "VII"][
				b.degreeIndex
			];
			const bAcc =
				b.accidental === -1
					? "♭"
					: b.accidental === 1
						? "♯"
						: b.accidental === -2
							? "♭♭"
							: b.accidental === 2
								? "♯♯"
								: "";
			return `${acc}${rn}/${bAcc}${bassNumeral}`;
		}
	}
	return `${acc}${rn}`;
}

// Map suffixes into our notation rules: we keep m, °, ø, dim, aug, 6/7/9..., add, sus, b/# extensions.
function normalizeQuality(s: string): string {
	if (!s) return "";
	// collapse common tokens
	// prefer "m7b5" → "m7b5", keep "dim" and "aug" as-is, convert "dim7" to "°7"
	s = s
		.replace(/^dim7$/i, "°7")
		.replace(/^dim$/i, "dim")
		.replace(/^aug$/i, "aug");
	// keep maj7, m, 6/7/9/11/13, addX, sus, accidentals
	return s;
}

// Choose closest scale degree and accidental offset from tonic.
function nearestDegree(
	pc: number,
	tonicPc: number,
): { degreeIndex: number; accidental: number } {
	let best = { degreeIndex: 0, accidental: 0 };
	let bestDist = 99;
	for (let i = 0; i < 7; i++) {
		const degPc = (tonicPc + MAJOR_OFFSETS[i]) % 12;
		let diff = ((pc - degPc + 18) % 12) - 6; // map to [-6..5]
		if (Math.abs(diff) < Math.abs(bestDist)) {
			bestDist = diff;
			best = { degreeIndex: i, accidental: clampAcc(diff) };
		}
	}
	return best;
}

function clampAcc(n: number): number {
	if (n <= -2) return -2;
	if (n >= 2) return 2;
	if (n === -1 || n === 0 || n === 1) return n;
	// treat ±3.. as ±2 for simplicity
	return n > 0 ? 2 : -2;
}

function normNote(n: string): string {
	return n.trim().replace(/(^[a-g])/i, (c) => c.toUpperCase());
}
