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
	for (const sec of song.sections) {
		const secEl = document.createElement("div");
		secEl.className = "cancionero-section";

		const header = document.createElement("div");
		header.className = "cancionero-section-header";
		if ((sec as any).prevGap) header.classList.add("prev-gap");
		header.textContent =
			`[${sec.name}]` + (sec.note ? ` {${sec.note}}` : "");
		secEl.appendChild(header);

		const rowsPlain = document.createElement("div");
		rowsPlain.className = "cancionero-rows-plain";
		secEl.appendChild(rowsPlain);

		const chart = document.createElement("div");
		chart.className = "cancionero-chart";
		secEl.appendChild(chart);

		renderPlainSection(rowsPlain, sec.rows);
		renderChartSection(chart, sec.rows);

		content.appendChild(secEl);
	}

	// responsive reflow
	const ro = new ResizeObserver(() => {
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
		const chW = measureChar(container);
		const maxCols = Math.max(
			1,
			Math.floor(container.getBoundingClientRect().width / chW) - 2,
		);

		for (const row of rows) {
			const chordLine = row.chordLine.replace(/\|/g, " ");
			const toks = [...row.chords].sort(
				(a, b) => a.startCol - b.startCol,
			);
			const segments = wrapPair(chordLine, row.lyrics, maxCols);

			let first = true;
			for (const seg of segments) {
				const wrap = document.createElement("div");
				wrap.className = "cancionero-row-plain";
				if (first && row.prevGap) wrap.classList.add("prev-gap"); // <-- visible blank line
				first = false;

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
			if (!row.barSlices.length) continue;

			row.barSlices.forEach((slice, idx) => {
				const txt = slice.text.trim();
				if (!txt) return; // skip empty leading cell when line starts with '|'
				acc.push(txt);

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

		for (const t of toks) {
			const tStart = t.startCol;
			const tEnd = t.startCol + t.text.length;
			if (tEnd <= start) continue;
			if (tStart >= end) break;

			if (tStart > cursor)
				frag.appendChild(
					document.createTextNode(
						line.slice(cursor, Math.min(tStart, end)),
					),
				);

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
