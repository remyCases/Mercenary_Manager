import { Signals } from "./EventEmitter.js";
import { ModalQueue } from "./ModalQueue.js";

const StoryElements = {
	mainContainer: document.querySelector(".main-container"),
	storyContainer: document.querySelector(".story-container"),

	dialogueContainer: document.getElementById("dialogueContainer"),
	contentArea: document.getElementById("contentArea"),
	infoStory: document.getElementById("infoStory"),

	nextStoryButton: document.getElementById("nextStoryButton"),
	resetStoryButton: document.getElementById("resetStoryButton"),
	passStoryButton: document.getElementById("passStoryButton"),
}

const StoryData = {
	story: [
		{
			name: "intro",
			paragraphs: [
				"<strong>Linkerburg</strong>, a small farming village in the middle of nowhere.",
				"The last place in the whole kingdom to start a mercenary company.",
				"But here I am, with a few golds and my fellow <strong>Frivkyl</strong>.",
				"At least, the food is cheap here.<br>And I won't have any troubles to convince locals to works for me.",
				"As soon as we arrived, we heard a local merchant was looking for a caravan hand for a delivery in <strong>Ata</strong>.",
				"<h1>ACT 1</h1><br>Nothing ever happens at <strong>Linkerburg</strong>",
			],
			done: false,
		},
	],
	dialogue: [
		{
			name: "saving_krisa",
			lines: [
				{ from: "a", img: "./images/RangerMan.png", text: "I've seen her, in <strong>Ata</strong>." },
				{ from: "b", img: null, imgTxt: "You", text: "Who are you talking about ?" },
				{ from: "a", img: "./images/RangerMan.png", text: "<strong>Krisa</strong>, she's alive. But won't be long. I've heard she was sentenced to death." },
				{ from: "b", img: null, imgTxt: "You", text: "I guess we can plan a little evasion. Do you feel ready to go back ?" },
				{ from: "a", img: "./images/RangerMan.png", text: "It won't be easy, I need some rest first." },
			],
			done: false,
		},
	],
	triggers: [
		{
			id: "game_start",
			condition: () => StoryData.story[0].done,
			action: () => {
				StoryElements.storyContainer.style.display = "none";
				StoryElements.mainContainer.style.display = "block";
				ModalQueue.forceProcessModals();
				Signals.emit("game_start");
			},
			done: false,
		},
		{
			id: "making_money",
			condition: () => StoryData.dialogue[0].done,
			action: () => {
				StoryElements.storyContainer.style.display = "none";
				StoryElements.mainContainer.style.display = "block";
				ModalQueue.forceProcessModals();
			},
			done: false,
		},
	],

	reset() {
		this.story.forEach((s) => {
			s.done = false;
		});
		this.dialogue.forEach((d) => {
			d.done = false;
		});
		this.triggers.forEach((t) => {
			t.done = false;
		});
	}
};

const StoryLogic = {
	currentStory: 0,
	currentParagraph: 0,
	currentDialogue: 0,
	currentLine: 0,
	inStoryMode: true,

	getParagraphs() {
		return StoryData.story[this.currentStory].paragraphs;
	},

	getLines() {
		return StoryData.dialogue[this.currentDialogue].lines;
	},

	nextParagraph() {
		if (this.currentParagraph < this.getParagraphs().length - 1) {
			this.currentParagraph++;
			this.renderStory();
		}
		else {
			StoryData.story[this.currentStory].done = true;
			this.currentParagraph = 0;
			this.currentStory++;
		}
		this.checkTriggers();
	},

	renderStory() {
		const paragraphs = this.getParagraphs();
		const text = paragraphs[this.currentParagraph];
		StoryElements.contentArea.innerHTML = `<div class="story-text">${text}</div>`;

		const progress = `${this.currentParagraph + 1}/${paragraphs.length}`;
		StoryElements.infoStory.textContent = progress;
	},

	showStory() {
		this.inStoryMode = true;
		StoryElements.contentArea.style.display = "flex";
		StoryElements.dialogueContainer.style.display = "none";
		this.renderStory();
	},

	nextLine() {
		if (this.currentLine < this.getLines().length - 1) {
			this.currentLine++;
			this.renderDialogue();
		}
		else {
			StoryData.dialogue[this.currentDialogue].done = true;
			this.currentLine = 0;
			this.currentDialogue++;
		}
		this.checkTriggers();
	},

	renderDialogue() {
		StoryElements.dialogueContainer.innerHTML = "";

		const lines = this.getLines();
		lines.slice(0, this.currentLine + 1).forEach(msg => {
			const messageFrom = document.createElement("div");
			messageFrom.className = `message from-${msg.from}`;

			let portrait;
			if (msg.img) {
				portrait = document.createElement("img");
				portrait.className = `portrait person-${msg.from}`;
				portrait.src = msg.img;
			} else {
				portrait = document.createElement("div");
				portrait.className = `portrait person-${msg.from}`;
				portrait.textContent = msg.imgTxt;
			}

			const text = document.createElement("div");
			text.className = "dialogue-text";
			text.innerHTML = msg.text;

			messageFrom.appendChild(portrait);
			messageFrom.appendChild(text);
			StoryElements.dialogueContainer.appendChild(messageFrom);
		});

		// Auto-scroll to bottom
		StoryElements.dialogueContainer.scrollTop = StoryElements.dialogueContainer.scrollHeight;
	},

	showDialogue() {
		this.inStoryMode = false;
		StoryElements.contentArea.style.display = "none";
		StoryElements.dialogueContainer.style.display = "flex";
		this.renderDialogue();
	},

	checkTriggers() {
		StoryData.triggers.forEach(trigger => {
			if (trigger.condition() && !trigger.done) {
				trigger.action();
				trigger.done = true;
			}
		});
	},

	resetStory() {
		this.currentParagraph = 0;
	},

	resetDialogue() {
		this.currentLine = 0;
	},

	reset() {
		this.currentStory = 0;
		this.currentDialogue = 0;
		this.resetStory();
		this.resetDialogue();
	},
};

const Story = (() => {

	let storyToPass = null;
	let dialogueToPass = null;

	function start() {
		ModalQueue.maskModals();
		StoryElements.storyContainer.style.display = "block";
		StoryElements.mainContainer.style.display = "none";
		storyToPass = 0;
		StoryData.reset();
		StoryLogic.reset();
		StoryLogic.showStory();
	}

	function continueStory(story) {
		ModalQueue.maskModals();
		StoryElements.storyContainer.style.display = "block";
		StoryElements.mainContainer.style.display = "none";
		storyToPass = story;
		StoryLogic.showStory();
	}

	function continueDialogue(dialogue) {
		ModalQueue.maskModals();
		StoryElements.storyContainer.style.display = "block";
		StoryElements.mainContainer.style.display = "none";
		dialogueToPass = dialogue;
		StoryLogic.showDialogue();
	}

	StoryElements.nextStoryButton.addEventListener("click", () => {
		if (StoryLogic.inStoryMode) {
			StoryLogic.nextParagraph();
		}
		else {
			StoryLogic.nextLine();
		}
	});

	StoryElements.resetStoryButton.addEventListener("click", () => {
		if (StoryLogic.inStoryMode) {
			StoryLogic.resetStory();
			StoryLogic.showStory();
		}
		else {
			StoryLogic.resetDialogue();
			StoryLogic.showDialogue();
		}
	});

	StoryElements.passStoryButton.addEventListener("click", () => {

		if (storyToPass !== null) {
			StoryData.story[storyToPass].done = true;
			storyToPass = null;
		}
		if (dialogueToPass !== null) {
			StoryData.dialogue[dialogueToPass].done = true;
			dialogueToPass = null;
		}
		StoryLogic.checkTriggers();
	});

	return { start, continueStory, continueDialogue };
})();

export { Story };
