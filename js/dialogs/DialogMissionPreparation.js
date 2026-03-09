import { Signals } from "../EventEmitter.js";
import { GameData } from "../GameData.js"
import { getItem } from "../utils.js";

export const DialogMissionPreparation = (() => {
	const dialog = document.getElementById("missionDialog");
	const sendMissionButton = dialog.querySelector("#sendMission");
	const cancelMissionButton = dialog.querySelector("#cancelMission");
	const regions = dialog.querySelectorAll(".region");
	const regionTooltip = dialog.querySelector("#regionTooltip");

	function init() {
		sendMissionButton.addEventListener("click", () => {
			const mission = GameData.state.get("mission")[GameData.currentMission];
			const location = GameData.region.get(GameData.selectedLocation);

			const travelDuration = location.travelDuration;
			mission.travelDuration = travelDuration;

			const region = getItem(regions, GameData.selectedLocation);
			region.classList.add("frozen");
			mission.location = GameData.selectedLocation;
			mission.reward = location.reward;

			Signals.emit("clearMissionSlot");

			GameData.resource.get("ap").value -= 1;

			GameData.currentMission = null;
			GameData.selectedLocation = null;
			dialog.close();
			Signals.emit("update");
		});

		cancelMissionButton.addEventListener("click", () => {
			regions.forEach(slot => slot.classList.remove("selected"));

			GameData.currentMission = null;
			GameData.selectedLocation = null;
			dialog.close();
			Signals.emit("update");
		});

		regions.forEach(region => {
			region.addEventListener("click", () => {
				regions.forEach(r => r.classList.remove("selected"));
				region.classList.add("selected");
				GameData.selectedLocation = region.dataset.num;

				Signals.emit("update");
			});

			region.addEventListener("mouseenter", () => {
				const id = region.dataset.num;
				const location = GameData.region.get(id);

				// AIE
				regionTooltip.textContent = `${location.name}`;
				regionTooltip.style.display = "block";
				regionTooltip.style.left = region.getAttribute("cx") + "px";
				regionTooltip.style.top = region.getAttribute("cy") + "px";
			});

			region.addEventListener("mouseleave", () => {
				regionTooltip.style.display = "none";
			});
		});
	}

	function start() {
		disableSendMission(true);

		regions.forEach(region => {
			region.classList.add("region");
		});
	}

	function disableSendMission(val) {
		sendMission.disabled = val;
	}

	function open() {
		dialog.showModal();
	}

	return { init, start, disableSendMission, open };
})();

DialogMissionPreparation.init();
