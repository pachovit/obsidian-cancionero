import { Editor, MarkdownView, Plugin } from "obsidian";
import { parseSong } from "./src/parser";
import { renderSong } from "./src/renderer";
import { convertAbsoluteToDegrees } from "./src/converter";
import { TonicPromptModal } from "./src/custom_modal";

export default class Cancionero extends Plugin {
  async onload() {
    
    this.registerMarkdownCodeBlockProcessor("song", (src, el) => {
      const parsed = parseSong(src);
	  console.log(JSON.stringify(parsed, null, 2));
      const view = renderSong(parsed);
      el.replaceWith(view);
    });

    this.addCommand({
      id: "convert-chords-to-degrees",
      name: "Convert chords to degrees",
      editorCallback: (editor) => {
        const selection = editor.getSelection() || editor.getValue();

        new TonicPromptModal(this.app, (tonic) => {
          if (!tonic) return;
          const converted = convertAbsoluteToDegrees(selection, tonic);

          if (editor.getSelection()) {
            editor.replaceSelection(converted);
          } else {
            editor.setValue(converted);
          }
        }).open();
      },
    });

  }

  async promptForTonic(): Promise<string | null> {
      return new Promise((resolve) => {
        const tonic = window.prompt("Enter tonic (e.g. C, D, G#, Fm):", "D");
        resolve(tonic ? tonic.trim() : null);
      });
    }
}