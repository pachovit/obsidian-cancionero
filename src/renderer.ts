// src/renderer.ts
import { Song, SongRow, ChordToken } from "./parser";

type Mode = "both" | "lyrics" | "chords";

export function renderSong(song: Song): HTMLElement {
	const root = document.createElement("div");
	root.className = "cancionero-root";

	// controls
	const controls = document.createElement("div");
	controls.className = "cancionero-buttons";
	(["both", "lyrics", "chords"] as Mode[]).forEach((m) => {
		const btn = document.createElement("button");
		btn.textContent = m.charAt(0).toUpperCase() + m.slice(1);
		btn.onclick = () => setMode(m);
		controls.appendChild(btn);
	});
	root.appendChild(controls);

	const content = document.createElement("div");
	root.appendChild(content);

	// sections
	const sectionEls: HTMLElement[] = [];
	for (const sec of song.sections) {
		const secEl = document.createElement("div");
		secEl.className = "cancionero-section";
		sectionEls.push(secEl);

		const header = document.createElement("div");
		header.className = "cancionero-section-header";
		if ((sec as any).prevGap) header.classList.add("prev-gap");
		header.appendChild(textSpan(`[${sec.name}]`));
		if (sec.note) {
			const modSpan = document.createElement("span");
			modSpan.className = "cancionero-mod";
			modSpan.textContent = ` {${sec.note}}`;
			header.appendChild(modSpan);
		}
		secEl.appendChild(header);

		// containers we will (re)fill on resize
		const rowsPlain = document.createElement("div");
		rowsPlain.className = "cancionero-rows-plain";
		secEl.appendChild(rowsPlain);

		const chart = document.createElement("div");
		chart.className = "cancionero-chart";
		secEl.appendChild(chart);

		// initial fill
		renderPlainSection(rowsPlain, sec.rows);
		renderChartSection(chart, sec.rows);

		content.appendChild(secEl);
	}

	// responsive reflow on resize
	const ro = new ResizeObserver(() => {
		// re-render only the plain rows (Both/Lyrics views)
		const secNodes = content.querySelectorAll(".cancionero-section");
		secNodes.forEach((secNode, idx) => {
			const rowsPlain = secNode.querySelector(
				".cancionero-rows-plain",
			) as HTMLElement;
			clearChildren(rowsPlain);
			renderPlainSection(rowsPlain, song.sections[idx].rows);
		});
	});
	ro.observe(content);

	function renderPlainSection(container: HTMLElement, rows: SongRow[]) {
		const chW = measureChar(container); // px width of one monospace glyph
		const maxCols = Math.max(
			1,
			Math.floor(container.getBoundingClientRect().width / chW) - 2,
		);

		for (const row of rows) {
			const chordLine = row.chordLine.replace(/\|/g, " ");
			const toks = [...row.chords].sort(
				(a, b) => a.startCol - b.startCol,
			);

			// wrap both strings to the same column windows
			const segments = wrapPair(chordLine, row.lyrics, maxCols);

			for (const seg of segments) {
				const wrap = document.createElement("div");
				wrap.className = "cancionero-row-plain";

				const chordsPre = document.createElement("pre");
				chordsPre.className = "cancionero-chords-plain";
				chordsPre.appendChild(
					buildChordFragment(chordLine, toks, seg.start, seg.end),
				);
				wrap.appendChild(chordsPre);

				const lyricsPre = document.createElement("pre");
				lyricsPre.className = "cancionero-lyrics";
				lyricsPre.textContent = row.lyrics.slice(seg.start, seg.end);
				wrap.appendChild(lyricsPre);

				container.appendChild(wrap);
			}
		}
	}

	function renderChartSection(chart: HTMLElement, rows: SongRow[]) {
		clearChildren(chart);
		const BAR_PER_LINE = 4;

		let acc: string[] = [];
		let badgeIdx: number | undefined;
		let badgeRepeat: number | undefined;

		for (const row of rows) {
			if (row.barSlices.length === 0) continue;

			row.barSlices.forEach((slice, idx) => {
				acc.push(slice.text);

				const isRowEnd = idx === row.barSlices.length - 1;
				if (isRowEnd && row.repeat && row.repeat > 1) {
					badgeIdx = acc.length - 1;
					badgeRepeat = row.repeat;
				}

				if (acc.length === BAR_PER_LINE) {
					chart.appendChild(
						renderChartLine(acc, badgeIdx, badgeRepeat),
					);
					acc = [];
					badgeIdx = undefined;
					badgeRepeat = undefined;
				}
			});
		}

		if (acc.length) {
			while (acc.length < BAR_PER_LINE) acc.push("");
			chart.appendChild(renderChartLine(acc, badgeIdx, badgeRepeat));
		}
	}

	function buildChordFragment(
		line: string,
		toks: ChordToken[],
		start: number,
		end: number,
	): DocumentFragment {
		const frag = document.createDocumentFragment();
		let cursor = start;

		// tokens that overlap this window
		for (const t of toks) {
			const tStart = t.startCol;
			const tEnd = t.startCol + t.text.length;
			if (tEnd <= start) continue;
			if (tStart >= end) break;

			// text before token
			if (tStart > cursor)
				frag.appendChild(
					document.createTextNode(
						line.slice(cursor, Math.min(tStart, end)),
					),
				);

			// token clipped to window
			const s = Math.max(tStart, start);
			const e = Math.min(tEnd, end);
			const strong = document.createElement("strong");
			strong.textContent = line
				.slice(s, e)
				.replace(/b/g, "♭")
				.replace(/#/g, "♯");
			frag.appendChild(strong);

			cursor = e;
		}
		// trailing text
		if (cursor < end)
			frag.appendChild(document.createTextNode(line.slice(cursor, end)));
		return frag;
	}

	function wrapPair(
		chords: string,
		lyrics: string,
		maxCols: number,
	): Array<{ start: number; end: number }> {
		const L = Math.max(chords.length, lyrics.length);
		const ranges: Array<{ start: number; end: number }> = [];
		let i = 0;
		while (i < L) {
			let limit = Math.min(i + maxCols, L);
			if (limit < L) {
				// prefer breaking on a space in the lyrics window
				const window = lyrics.slice(i, limit);
				const lastSpace = window.lastIndexOf(" ");
				if (lastSpace > 0) limit = i + lastSpace + 1;
			}
			ranges.push({ start: i, end: limit });
			i = limit;
		}
		return ranges;
	}

	function renderChartLine(
		barTexts: string[],
		badgeIndex?: number,
		badgeRepeat?: number,
	): HTMLElement {
		const line = document.createElement("div");
		line.className = "cancionero-chart-line";
		barTexts.forEach((txt, idx) => {
			const cell = document.createElement("div");
			cell.className = "cancionero-chart-bar";
			const span = document.createElement("span");
			span.textContent = txt.replace(/b/g, "♭").replace(/#/g, "♯");
			cell.appendChild(span);

			if (badgeRepeat && badgeIndex === idx) {
				const badge = document.createElement("span");
				badge.className = "cancionero-repeat-badge";
				badge.textContent = `×${badgeRepeat}`;
				cell.appendChild(badge);
			}

			line.appendChild(cell);
		});
		return line;
	}

	function setMode(m: Mode) {
		root.setAttribute("data-mode", m);
	}

	setMode("both");
	return root;
}

/* utils */
function textSpan(t: string): HTMLSpanElement {
	const s = document.createElement("span");
	s.textContent = t;
	return s;
}
function clearChildren(el: HTMLElement) {
	while (el.firstChild) el.removeChild(el.firstChild);
}
function measureChar(refEl: HTMLElement): number {
	const probe = document.createElement("span");
	probe.style.position = "absolute";
	probe.style.visibility = "hidden";
	probe.style.whiteSpace = "pre";
	probe.textContent = "0000000000";
	refEl.appendChild(probe);
	const w = probe.getBoundingClientRect().width / 10;
	probe.remove();
	return w || 8;
}
