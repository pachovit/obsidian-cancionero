import { parseSong, Song } from "../src/parser";
import { renderSong } from "../src/renderer";

/* ---------- fixtures ---------- */

const INPUT = String.raw`
\`\`\`song
[Intro]
|   Em         A7   |    Dmaj7  Cdim
No existe un momento del día,

|      Em        Gm7   |  Dmaj7 
En que pueda apartarme de ti.

|  C#m7b5    FA#7   | Bm7
El mundo parece distinto,

| E7                |   Em  Bb7 | A7 |
Cuando no estás junto a mí.

[Verso]

       Bdim   |  Em     |  A7
No hay bella melodía,

|                Dmaj7 | Em 
En que no surjas tú.

   F#m         | Em
Ni yo quiero escucharla,

A7            |   Dmaj
Si no la escuchas tú.
\`\`\`
`.trim();

const EXPECT_BOTH = `
[Intro]
    Em         A7        Dmaj7  Cdim
No existe un momento del día,
       Em        Gm7      Dmaj7 
En que pueda apartarme de ti.
   C#m7b5    FA#7     Bm7
El mundo parece distinto,
  E7                    Em  Bb7   A7  
Cuando no estás junto a mí.
[Verso]
       Bdim      Em        A7
No hay bella melodía,
                 Dmaj7   Em 
En que no surjas tú.
   F#m           Em
Ni yo quiero escucharla,
A7                Dmaj
Si no la escuchas tú.
`.trim();

const EXPECT_LYRICS = `
[Intro]
No existe un momento del día,
En que pueda apartarme de ti.
El mundo parece distinto,
Cuando no estás junto a mí.

[Verso]
No hay bella melodía,
En que no surjas tú.
Ni yo quiero escucharla,
Si no la escuchas tú.
`.trim();

const EXPECT_CHORDS = `
[Intro]
Em
A7
Dmaj7
Cdim
Em
Gm7
Dmaj7
C#m7b5
FA#7
Bm7
E7
Em
Bb7
A7

[Verso]
Bdim
Em
A7
Dmaj7
Em
F#m
Em
A7
Dmaj
`.trim();

/* ===================== Helpers ===================== */

function stripFence(s: string): string {
  const m = s.match(/```song([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}

// Normalize for robust comparisons:
// - Map Unicode ♯/♭ to ASCII #/b
// - Collapse runs of spaces
// - Trim line-end spaces and file-end spaces
function normalize(s: string): string {
  return s
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .split("\n")
    .map((ln) => ln.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();
}

// BOTH view as plain text from the parsed model:
// keep spacing as authored, remove only pipes.
function toBothText(song: Song): string {
  const out: string[] = [];
  for (const sec of song.sections) {
    out.push(`[${sec.name}]`);
    for (const row of sec.rows) {
      const chords = row.chordLine.replace(/\|/g, "");
      if (chords.trim()) out.push(chords);
      if (row.lyrics.trim()) out.push(row.lyrics);
    }
  }
  return out.join("\n").trim();
}

// LYRICS view: headers + lyric lines; blank line between sections.
function toLyricsText(song: Song): string {
  const out: string[] = [];
  for (const sec of song.sections) {
    out.push(`[${sec.name}]`);
    for (const row of sec.rows) {
      if (row.lyrics.trim()) out.push(row.lyrics);
    }
    out.push("");
  }
  return out.join("\n").trim();
}

// CHORDS view: one token per line, reading each bar slice left→right.
function toChordsText(song: Song): string {
  const out: string[] = [];
  for (const sec of song.sections) {
    out.push(`[${sec.name}]`);
    for (const row of sec.rows) {
      for (const slice of row.barSlices) {
        const t = slice.text.trim();
        if (!t) continue;
        t.split(/\s+/).forEach((tok) => out.push(tok));
      }
    }
    out.push("");
  }
  return out.join("\n").trim();
}

const parseFixture = () => parseSong(stripFence(INPUT));

/* ===================== Tests ===================== */

describe("views", () => {
  test("Both view", () => {
    expect(normalize(toBothText(parseFixture()))).toBe(normalize(EXPECT_BOTH));
  });

  test("Lyrics view", () => {
    expect(normalize(toLyricsText(parseFixture()))).toBe(normalize(EXPECT_LYRICS));
  });

  test("Chords view", () => {
    expect(normalize(toChordsText(parseFixture()))).toBe(normalize(EXPECT_CHORDS));
  });

  test("renderer smoke", () => {
    const root = renderSong(parseFixture());
    expect(root.querySelectorAll(".cancionero-section").length).toBeGreaterThan(0);
    root.setAttribute("data-mode", "chords");
    expect(root.querySelectorAll(".cancionero-chart-bar span").length).toBeGreaterThan(0);
  });
});