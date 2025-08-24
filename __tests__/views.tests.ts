import { parseSong, Song } from "../src/parser";
import { renderSong } from "../src/renderer";

/* ---------- Fixtures ---------- */

const INPUT = String.raw`
\`\`\`song
[Intro]
|   IIm         V7   |    Imaj7  ♯VIdim
No existe un momento del día,

|      IIm        IVm7   |  Imaj7 
En que pueda apartarme de ti.

|  VIIm7b5    III7   | VIm7
El mundo parece distinto,

| II7                |   IIm  ♯V7 | V7 |
Cuando no estás junto a mí.

[Verso]

       VIdim   |  IIm     |  V7
No hay bella melodía,

|                Imaj7 | IIm 
En que no surjas tú.

   IIIm         | IIm
Ni yo quiero escucharla,

V7            |   Imaj7
Si no la escuchas tú.
\`\`\`
`.trim();

const EXPECT_BOTH = `
[Intro]
    IIm         V7        Imaj7  ♯VIdim
No existe un momento del día,
       IIm        IVm7      Imaj7 
En que pueda apartarme de ti.
   VIIm7♭5    III7     VIm7
El mundo parece distinto,
  II7                    IIm  ♯V7   V7  
Cuando no estás junto a mí.
[Verso]
       VIdim      IIm        V7
No hay bella melodía,
                 Imaj7   IIm 
En que no surjas tú.
   IIIm           IIm
Ni yo quiero escucharla,
V7                Imaj7
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
IIm V7
Imaj7 ♯VIdim
IIm IVm7
Imaj7
VIIm7♭5 III7
VIm7
II7
IIm ♯V7
V7
[Verso]
VIdim
IIm
V7
Imaj7
IIm
IIIm
IIm
V7
Imaj7
`.trim();

/* ---------- Helpers ---------- */

function stripFence(s: string): string {
  const m = s.match(/```song([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}

function normalize(s: string): string {
  return s
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .split("\n")
    .map((ln) => ln.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();
}

// Both view: keep spacing as authored, remove pipes.
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

// Lyrics view: headers + lyric lines, blank line between sections.
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

// Chords view: one bar per line, preserving chords grouped as in each bar slice.
function toChordsText(song: Song): string {
  const out: string[] = [];
  for (const sec of song.sections) {
    out.push(`[${sec.name}]`);
    for (const row of sec.rows) {
      for (const slice of row.barSlices) {
        const t = slice.text.trim();
        if (t) {
          out.push(
            t
              .replace(/b/g, "♭")
              .replace(/#/g, "♯")
              .replace(/\s+/g, " ")
              .trim(),
          );
        }
      }
    }
  }
  return out.join("\n").trim();
}

const parseFixture = () => parseSong(stripFence(INPUT));

/* ---------- Tests ---------- */

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

  test("Renderer smoke", () => {
    const root = renderSong(parseFixture());
    expect(root.querySelectorAll(".cancionero-section").length).toBeGreaterThan(0);
    root.setAttribute("data-mode", "chords");
    expect(root.querySelectorAll(".cancionero-chart-bar span").length).toBeGreaterThan(0);
  });
});