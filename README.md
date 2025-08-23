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

---

## 🛣️ Roadmap

**Near-term**
- [ ] 🖨️ PDF / image export  
- [ ] ⚙️ Global plugin settings (default view, font size)  
- [ ] 🔄 Toggle between degree notation and absolute chords  
- [ ] 🎵 Transposition engine (pick new tonic → auto-shift chords)  

**Medium-term**
- [ ] 🌐 Import chord sheets from the web → auto-convert to degrees  
- [ ] ✍️ Visual “easy editor” for bar splitting and chord placement  

---

## 📌 Status

🚧 This plugin is in **early development**. Core features (notation parsing, rendering, responsive layouts) are already working. Expect rapid iteration. Contributions and feedback welcome.
