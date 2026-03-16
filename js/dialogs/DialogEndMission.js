import { Signals } from "../EventEmitter.js";

export const DialogEndMission = (() => {
	const modal = document.getElementById("endMissionDialog");

	function getModal(id, message = null) {

		const clone = modal.cloneNode(true);
		clone.id = `eventModal-${id}`;
		clone.classList.add("mission-resolve-dialog");
		clone.classList.add("small-dialog");
		clone.querySelector(".end-mission-message").innerHTML = message;

		clone.querySelector(".end-mission-button").addEventListener("click", () => {
			clone.close();
			clone.remove();
			Signals.emit("update");
		});

		document.body.appendChild(clone);
		return clone;
	}

	function open() {
		modal.showModal();
	}

	return { open, getModal };
})();
