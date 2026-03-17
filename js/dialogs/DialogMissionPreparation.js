import { Signals } from "../EventEmitter.js";
import { GameData } from "../GameData.js"
import { getItem } from "../utils.js";
import { partyToStr, rewardsToStr, repToStr, weekToStr } from "../UtilsUI.js";

export const DialogMissionPreparation = (() => {
	const dialog = document.getElementById("missionDialog");
	const sendMissionButton = dialog.querySelector("#sendMission");
	const cancelMissionButton = dialog.querySelector("#cancelMission");
	const regions = dialog.querySelectorAll(".region");
	const regionTooltip = dialog.querySelector("#regionTooltip");
	const missionDescription = dialog.querySelector("#missionDescription");

	function init() {
		Signals.on("unfreezeRegion", unfreezeRegion);

		sendMissionButton.addEventListener("click", () => {
			const mission = GameData.state.get("mission")[GameData.currentMission];
			const location = GameData.regions.get(GameData.selectedLocation);
			const contract = GameData.contracts.get(location.contract);

			const travelDuration = location.travelDuration;
			mission.travelDuration = travelDuration;

			const region = getItem(regions, GameData.selectedLocation);
			region.classList.add("frozen");
			mission.location = GameData.selectedLocation;
			mission.contract = location.contract;
			mission.reward = structuredClone(contract.reward);

			// remove expiration counter for reset missions
			location.expiration = -1;
			Signals.emit("freezeMissionSlot");

			GameData.resources.get("ap").value -= 1;

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
				if (!GameData.regions.get(region.dataset.num).contract) return;

				regions.forEach(r => r.classList.remove("selected"));
				region.classList.add("selected");
				GameData.selectedLocation = region.dataset.num;

				Signals.emit("update");
			});

			region.addEventListener("mouseenter", () => {
				const id = region.dataset.num;
				const location = GameData.regions.get(id);

				regionTooltip.innerHTML = `${location.name}<br>Reputation: ${repToStr(location.reputation)}`;
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

	function update() {
		if (dialog.open) {
			if (GameData.currentMission && GameData.selectedLocation) {
				const mission = GameData.state.get("mission")[GameData.currentMission];
				const location = GameData.regions.get(GameData.selectedLocation);
				const contract = GameData.contracts.get(location.contract);

				const estimatedWeeksWork = Math.ceil(contract.efficiency / mission.efficiency);
				const enoughCautiousness = mission.cautiousness >= (contract.danger - location.reputation / 10);

				missionDescription.style.visibility = "visible";
				const contractDescription = `${contract.description}, it should be <span class="bold">${estimatedDifficulty(estimatedWeeksWork, enoughCautiousness)}</span>`;
				const rewardsDescription = rewardsToStr(contract.reward);

				const expirationDescription = location.expiration >= 0 ? `It will expire in <span class="bold">${weekToStr(location.expiration)}</span>.` : "It will never expire.";
				missionDescription.innerHTML = `${partyToStr(GameData, mission.party)} going to <span class="bold">${location.name}</span> a <span class="bold">${location.travelDuration}-${location.travelDuration <= 1 ? "week" : "weeks"}</span> travel.<br>${contractDescription}.<br>${rewardsDescription}<br>${expirationDescription}`;

				sendMission.disabled = false;
			}
		} else {
			missionDescription.style.visibility = "hidden";
			sendMission.disabled = true;
		}
	}

	function disableSendMission(val) {
		sendMission.disabled = val;
	}

	function unselectRegions() {
		regions.forEach(region => region.classList.remove("selected"));
	}

	function open() {
		regions.forEach(region => {
			const regionData = GameData.regions.get(region.dataset.num);
			region.style.visibility = regionData.available ? "visible" : "hidden";
			region.style.fill = getReputationColor(regionData.reputation);
		});
		dialog.showModal();
	}

	function unfreezeRegion(id = GameData.currentMission) {
		const mission = GameData.state.get("mission")[id];
		const region = getItem(regions, mission.location);
		region.classList.remove("frozen");
	}

	return { init, start, update, disableSendMission, open, unselectRegions };
})();

function estimatedDifficulty(weeks, enoughCautiousness) {

	let timeDifficulty = 0;
	if (weeks < 3) {
		timeDifficulty = 0;
	}
	else if (weeks < 5) {
		timeDifficulty = 1;
	}
	else if (weeks < 10) {
		timeDifficulty = 2;
	}
	else if (weeks < 20) {
		timeDifficulty = 3;
	}
	else {
		timeDifficulty = 4;
	}

	timeDifficulty += enoughCautiousness ? 0 : 1;

	switch (timeDifficulty) {
		case 0:
			return "easy";
		case 1:
			return "average";
		case 2:
			return "hard";
		case 3:
			return "very hard";
		default:
			return "fiendish";
	}
}

const COLOR_NEGATIVE = "#B12B1DB3"
const COLOR_NEUTRAL = "#B19719B3"
const COLOR_POSITIVE = "#16B13DB3"

function getReputationColor(reputation) {
	let color;
	if (reputation < 0) {
		color = `color-mix(in oklab, ${COLOR_NEUTRAL} ${reputation + 100}%, ${COLOR_NEGATIVE})`;
	} else {
		color = `color-mix(in oklab, ${COLOR_NEUTRAL} ${100 - reputation}%, ${COLOR_POSITIVE})`;
	}
	return color;
}

DialogMissionPreparation.init();
