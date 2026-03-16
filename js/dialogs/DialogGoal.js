import { GameData } from "../GameData.js"

export const DialogGoal = (() => {
	const modal = document.getElementById("goalDialog");
	const message = modal.querySelector("#goalMessage");
	const button = modal.querySelector("#confirmGoalButton");

	function getModal() {
		message.innerHTML = `New objective:<br>${GameData.state.get("winCondition").description}`;
		return modal;
	}

	function open() {
		modal.showModal();
	}

	function init() {
		button.addEventListener("click", () => {
			modal.close();
		});
	}

	return { init, open, getModal };
})();

DialogGoal.init();
