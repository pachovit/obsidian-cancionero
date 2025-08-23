import { App, Modal, Setting } from "obsidian";

export class TonicPromptModal extends Modal {
	result: string | null = null;
	onSubmit: (result: string | null) => void;

	constructor(app: App, onSubmit: (result: string | null) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Choose tonic" });

		let input = "";
		new Setting(contentEl).setName("Tonic").addText((text) =>
			text.setPlaceholder("e.g. D, G#, Fm").onChange((val) => {
				input = val.trim();
			}),
		);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("OK")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(input || null);
				}),
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
