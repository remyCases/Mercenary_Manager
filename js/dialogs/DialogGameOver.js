import { Signals } from "../EventEmitter.js";

export const DialogGameOver = (() => {
	const modal = document.getElementById("gameOverDialog");
	const gameOverMessage = modal.querySelector("#gameOverMessage");
	const button = modal.querySelector("#gameOverButton");

	function open(message = null) {
		gameOverMessage.innerHTML = `GAME OVER<br>${message}`;
		modal.showModal();
	}

	function init() {
		button.addEventListener("click", () => {
			modal.close();
			Signals.emit("start");
		});
	}

	return { init, open };
})();

DialogGameOver.init();
