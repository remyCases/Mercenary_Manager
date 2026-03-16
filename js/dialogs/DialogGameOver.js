import { Signals } from "../EventEmitter.js";

export const DialogGameOver = (() => {
	const modal = document.getElementById("gameOverDialog");
	const gameOverMessage = modal.querySelector("#gameOverMessage");
	const button = modal.querySelector("#gameOverButton");

	function getModal(message = null) {
		gameOverMessage.innerHTML = `GAME OVER<br>${message}`;
		return modal;
	}

	function open() {
		modal.showModal();
	}

	function init() {
		button.addEventListener("click", () => {
			modal.close();
			Signals.emit("start");
		});
	}

	return { init, open, getModal };
})();

DialogGameOver.init();
