// Common suffixes/extensions shared across absolute and degree notation.
export const CHORD_SUFFIX_RE =
	"(?:maj7|maj9|maj11|maj13" +
	"|m|m7|m9|m11|m13|m6|mMaj7" +
	"|dim7|dim|aug" +
	"|add\\d+" +
	"|sus\\d*" + // NEW: catch sus, sus2, sus4
	"|°|ø" +
	"|6|7|9|11|13" +
	"|b5|#5|b9|#9|b11|#11|b13|#13" +
	"|(?:m)?7b5|(?:m)?7#5|(?:m)?7" +
	")?";

// Absolute chord regex: root note + suffix + optional extra + slash bass
export const ABSOLUTE_CHORD_RE = new RegExp(
	"\\b([A-G](?:#|b)?)" + // root (A–G, accidental)
		CHORD_SUFFIX_RE + // quality/extensions
		"((?:add\\d+|sus\\d*|b5|#5|b9|#9|b11|#11|b13|#13)*)?" +
		"(?:/([A-G](?:#|b)?))?\\b", // optional /bass
	"g",
);

// Degree chord regex: Roman numeral + suffix + extensions
export const DEGREE_CHORD_RE = new RegExp(
	"\\b(b|#)?" + // accidental
		"(I{1,3}|IV|V|VI|VII|i{1,3}|iv|v|vi|vii)" + // numeral
		"(?:" +
		CHORD_SUFFIX_RE +
		")?" + // suffix/extensions
		"((?:maj7|6|7|9|11|13|add\\d+|b\\d+|#\\d+)*)",
	"g",
);
