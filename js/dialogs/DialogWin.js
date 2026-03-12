import { Signals } from "../EventEmitter.js";

export const DialogWin = (() => {
	const modal = document.getElementById("winDialog");
	const restartButton = modal.querySelector("#restartButton");
	const continueButton = modal.querySelector("#continueButton");

	function open() {
		modal.showModal();
	}

	function init() {
		restartButton.addEventListener("click", () => {
			modal.close();
			Signals.emit("start");
		});

		continueButton.addEventListener("click", () => {
			modal.close();
		});
	}

	return { init, open };
})();

DialogWin.init();
