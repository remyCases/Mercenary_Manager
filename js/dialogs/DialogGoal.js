import { GameData } from "../GameData.js"

export const DialogGoal = (() => {
	const modal = document.getElementById("goalDialog");
	const message = modal.querySelector("#goalMessage");
	const button = modal.querySelector("#confirmGoalButton");

	function open() {
		message.innerHTML = `New objective:<br>${GameData.state.get("winCondition").description}`;
		modal.showModal();
	}

	function init() {
		button.addEventListener("click", () => {
			modal.close();
		});
	}

	return { init, open };
})();

DialogGoal.init();
