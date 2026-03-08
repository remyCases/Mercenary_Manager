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
		{ from: "a", img: "./../images/RangerMan.png", text: "You know when I said I'd follow you whenever we go, I didn't expect the whenever to be <strong>Linkerburg</strong>." },
		{ from: "b", img: null, imgTxt: "You", text: "I know, I didn't expect it either." },
	],
	triggers: [
		{
			id: "game_start",
			condition: () => StoryData.story[0].done,
			action: () => {
				StoryElements.storyContainer.style.display = "none";
				StoryElements.mainContainer.style.display = "block";
			}
		},
	],

	reset() {
		this.story.forEach((s) => {
			s.done = false;
		});
	}
};

const StoryLogic = {
	currentStory: 0,
	currentParagraph: 0,
	currentDialogue: 0,
	inStoryMode: true,

	getParagraphs() {
		return StoryData.story[this.currentStory].paragraphs;
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

	showDialogue() {
		this.inStoryMode = false;
		StoryElements.contentArea.style.display = "none";
		StoryElements.dialogueContainer.style.display = "flex";
		this.renderDialogue();
	},

	showStory() {
		this.inStoryMode = true;
		StoryElements.contentArea.style.display = "flex";
		StoryElements.dialogueContainer.style.display = "none";
		this.renderStory();
	},

	renderDialogue() {
		StoryElements.dialogueContainer.innerHTML = "";

		StoryData.dialogue.slice(0, this.currentDialogue + 1).forEach(msg => {
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

		if (this.currentDialogue < StoryData.dialogue.length - 1) {
			this.currentDialogue++;
		}
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
		this.currentDialogue = 0;
		this.showStory();
	},

	reset() {
		this.currentStory = 0;
		this.resetStory();
	},
};

const Story = (() => {

	function start() {
		StoryData.reset();
		StoryLogic.reset();
	}

	StoryElements.nextStoryButton.addEventListener("click", () => {
		StoryLogic.nextParagraph();
	});

	StoryElements.resetStoryButton.addEventListener("click", () => {
		StoryLogic.resetStory();
	});

	StoryElements.passStoryButton.addEventListener("click", () => {
		StoryData.story[0].done = true;
		StoryLogic.checkTriggers();
	});

	return { start };
})();

export { Story };
