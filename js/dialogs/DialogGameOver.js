import { Signals } from "../EventEmitter.js";

export const DialogGameOver = (() => {
	const modal = document.getElementById("gameOverDialog");
	const button = modal.querySelector("#restart");

	function open() {
		modal.showModal();
	}

	function init() {
		button.addEventListener("click", () => {
			modal.close();
			Signals.emit("start_game");
		});
	}

	return { init, open };
})();

DialogGameOver.init();
