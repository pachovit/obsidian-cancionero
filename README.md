# 🎶 Cancionero

**Cancionero** is an [Obsidian](https://obsidian.md) plugin for writing, studying, and visualizing songs using **harmonic degrees**, **Roman numeral notation**, and **synchronized lyrics**.  

It turns your vault into a simple digital **songbook** that works beautifully on both desktop 💻 and mobile 📱.

---

## ✨ Features

- 🎼 Write songs in plain text using chords + lyrics blocks
- 🔀 Toggle **Lyrics**, **Chords**, or **Both** views
- 🎹 Roman numeral notation with ♭ / ♯ accidentals
- 📖 Section headers `[Verso]`, `[Coro]`, etc. with `{Mod …}` for modulations
- 📐 Compact **4-bar chord charts**
- 📲 Responsive design: auto reflows on mobile screens
- 🔁 Repeat markers `(x2)` show as `×2` in chord view
- 🪄 **Convert real chord sheets into degrees** with a single command

---

## ⚡ Installation

1. Build the plugin:
   ```bash
   npm install
   npm run build
   ```
2. Copy into your vault:
   ```
   <Vault>/.obsidian/plugins/cancionero/
   ```
   Required files:
   - `manifest.json`
   - `main.js`
   - `styles.css`
   - `versions.json` (optional)

3. Enable in Obsidian:
   - Settings → Community Plugins → Installed plugins → **Cancionero**

---

## 🎤 Usage

Songs are written in fenced code blocks with the `song` language.

### Example

```song
[Verse]
I                     | IIIm7                      | IIIm bIIIm  | IIm
Quedate sentada donde estas, hasta el final de la canción, como si nada

IIm                          | IIm7                     | V            | I
piensa que a tu lado hay un control, que puede malinterpretar, ciertas miradas

[Chorus] {Mod Im}
I                   | IIIm                | ♭VII I      | IV
Soy un invitado de ocasión y no pretendo figurar en tu programa

IV          V               | I    VIm          | IIm V     | I
Soy como lo fui siempre en tu vida, una noche de debut y despedida

[End] {Imaj}
I
Quédate sentada donde estás...
```

- Use `|` pipes for bar boundaries  
- Use `[Section]` headers to organize verses, choruses, etc.  
- Use `{Mod …}` to indicate modulations and `{I}` to return to tonic  
- Add `(x2)` in a lyric line to mark repeats  

### Convert real chords → degrees

Use the command palette (**Cmd+P / Ctrl+P**) → **Convert chords to degrees**.  
A modal will ask for the tonic key.  

**Example input:**

```
Dmaj7 Em F#m7 Fdim7
Sé    que    aun
    Em                  A7sus   A7
Me queda una oportunidad
```

**With tonic = D, becomes:**

```
Imaj7 IIm IIIm7 ♭III°7
Sé    que    aun
IIm                  V7sus   V7
Me queda una oportunidad
```

---

## 🛣️ Roadmap

**Near-term**
- [ ] 🌐 Smarter import of chord sheets from the web → auto-convert to degrees  
- [ ] ✍️ Visual “easy editor” for bar splitting and chord placement  

**Medium-term**
- [ ] 🖨️ PDF / image export  
- [ ] ⚙️ Global plugin settings (default view, font size)  
- [ ] 🔄 Toggle between degree notation and absolute chords  
- [ ] 🎵 Transposition engine (pick new tonic → auto-shift chords)  

---

## 📌 Status

🚧 This plugin is in **early development**. Core features (notation parsing, rendering, conversion, responsive layouts) are already working. Expect rapid iteration. Contributions and feedback welcome.
