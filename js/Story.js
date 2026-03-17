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
				"But here I am, with a few gold and my fellow <strong>Frivkyl</strong>.",
				"At least, the food is cheap here.<br>And I won't have any troubles to convince locals to work for me.",
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
				{ from: "b", img: null, imgTxt: "You", text: "Who are you talking about?" },
				{ from: "a", img: "./images/RangerMan.png", text: "<strong>Krisa</strong>, she's alive. But won't be long. I've heard she is sentenced to death." },
				{ from: "b", img: null, imgTxt: "You", text: "I guess we can plan a little evasion. Do you feel ready to go back ?" },
				{ from: "a", img: "./images/RangerMan.png", text: "It won't be easy, I need some rest first." },
			],
			done: false,
		},
		{
			name: "krisa_rescued",
			lines: [
				{ from: "a", img: "./images/PalLady.png", text: "From all the people on this kingdom, I wasn't expecting to be saved by the both of you." },
				{ from: "b", img: null, imgTxt: "You", text: "Do you prefer to go back ?" },
				{ from: "a", img: "./images/PalLady.png", text: "Thanks for the offer but <strong>Frivkyl</strong> seems pretty beat up." },
				{ from: "a", img: "./images/RangerMan.png", text: "Pretty is an understatement." },
				{ from: "b", img: null, imgTxt: "You", text: "Now that we've thanked <strong>Frivkyl</strong> for his skills, let's focus on making some money." },
				{ from: "a", img: "./images/RangerMan.png", text: "We can forget going to <strong>Ata</strong> for awhile." },
				{ from: "a", img: "./images/PalLady.png", text: "I'd rather not." },
			],
			done: false,
		},
		{
			name: "ekor_coming",
			lines: [
				{ from: "a", img: "./images/MageMan.png", text: "Name <strong>Ekor</strong> from <strong>Csasi</strong>. I've heard, you were recruiting." },
				{ from: "b", img: null, imgTxt: "You", text: "We are. What can you offer ?" },
				{ from: "a", img: "./images/MageMan.png", text: "I was part of the Vellum Weaver. I still have a diplomacy network." },
				{ from: "a", img: "./images/RangerMan.png", text: "Was ?" },
				{ from: "a", img: "./images/MageMan.png", text: "Past tense, indeed." },
				{ from: "b", img: null, imgTxt: "You", text: "That's a good opportunity, we need some alliance, unless <strong>Krisa</strong> wants to reunite with the hangman." },
				{ from: "a", img: "./images/PalLady.png", text: "No thanks." },
			],
			done: false,
		},
	],
	triggers: [
		{
			condition: () => StoryData.state == "intro" && StoryData.story[0].done,
			action: () => {
				StoryElements.storyContainer.style.display = "none";
				StoryElements.mainContainer.style.display = "block";
				ModalQueue.forceProcessModals();
				Signals.emit("game_start");
			},
		},
		{
			condition: () => StoryData.state == "saving_krisa" && StoryData.dialogue[0].done,
			action: () => {
				StoryElements.storyContainer.style.display = "none";
				StoryElements.mainContainer.style.display = "block";
				ModalQueue.forceProcessModals();
			},
		},
		{
			condition: () => StoryData.state == "krisa_rescued" && StoryData.dialogue[1].done,
			action: () => {
				StoryElements.storyContainer.style.display = "none";
				StoryElements.mainContainer.style.display = "block";
				ModalQueue.forceProcessModals();
			},
		},
		{
			condition: () => StoryData.state == "ekor_coming" && StoryData.dialogue[2].done,
			action: () => {
				StoryElements.storyContainer.style.display = "none";
				StoryElements.mainContainer.style.display = "block";
				ModalQueue.forceProcessModals();
			},
		},
	],

	state: "",

	reset() {
		this.state = "";
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
	currentParagraph: 0,
	currentLine: 0,
	inStoryMode: true,

	getParagraphs() {
		return StoryData.story.find((s) => s.name === StoryData.state).paragraphs;
	},

	getLines() {
		return StoryData.dialogue.find((d) => d.name === StoryData.state).lines;
	},

	nextParagraph() {
		if (this.currentParagraph < this.getParagraphs().length - 1) {
			this.currentParagraph++;
			this.renderStory();
		}
		else {
			StoryData.story.find((s) => s.name === StoryData.state).done = true;
			this.currentParagraph = 0;
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

	showStory(state = null) {
		this.inStoryMode = true;

		if (state !== null) {
			StoryData.state = state;
		}
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
			StoryData.dialogue.find((d) => d.name === StoryData.state).done = true;
			this.currentLine = 0;
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
		const progress = `${this.currentLine + 1}/${lines.length}`;
		StoryElements.infoStory.textContent = progress;
	},

	showDialogue(state) {
		this.inStoryMode = false;
		StoryData.state = state;
		StoryElements.contentArea.style.display = "none";
		StoryElements.dialogueContainer.style.display = "flex";
		this.renderDialogue();
	},

	checkTriggers() {
		StoryData.triggers.forEach(trigger => {
			if (trigger.condition()) {
				trigger.action();
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
		this.resetStory();
		this.resetDialogue();
	},
};

const Story = (() => {

	function start() {
		ModalQueue.maskModals();
		StoryElements.storyContainer.style.display = "block";
		StoryElements.mainContainer.style.display = "none";
		StoryData.reset();
		StoryLogic.reset();
		StoryLogic.showStory("intro");
	}

	function continueStory(story) {
		ModalQueue.maskModals();
		StoryElements.storyContainer.style.display = "block";
		StoryElements.mainContainer.style.display = "none";
		StoryLogic.showStory(story);
	}

	function continueDialogue(dialogue) {
		ModalQueue.maskModals();
		StoryElements.storyContainer.style.display = "block";
		StoryElements.mainContainer.style.display = "none";
		StoryLogic.showDialogue(dialogue);
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

		const findStory = StoryData.story.find((s) => s.name === StoryData.state);
		const findDialog = StoryData.dialogue.find((d) => d.name === StoryData.state);

		if (findStory) {
			findStory.done = true;
		}
		if (findDialog) {
			findDialog.done = true;
		}
		StoryLogic.checkTriggers();
	});

	return { start, continueStory, continueDialogue };
})();

export { Story };
