import { Plugin } from "obsidian";
import { parseSong } from "./src/parser";
import { renderSong } from "./src/renderer";

export default class Cancionero extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("song", (src, el) => {
      const parsed = parseSong(src);
	  console.log(JSON.stringify(parsed, null, 2));
      const view = renderSong(parsed);
      el.replaceWith(view);
    });
  }
}