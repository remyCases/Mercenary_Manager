import { createTroopCard } from "./Troops.js"
import { getItem } from "./utils.js"
import { isFrozen, isOccupied } from "./UtilsUI.js"
import { DialogMissionPreparation } from "./dialogs/DialogMissionPreparation.js"
import { DialogMissionResolve } from "./dialogs/DialogMissionResolve.js"

export const GameUI = {
	// general tooltip
	tooltip: null,
	// elements on main screen
	getTroopCards: () => document.querySelectorAll(".troop-card"),
	missionSlots: document.querySelectorAll(".mission-slot"),
	restSlots: document.querySelectorAll(".rest-slot"),
	troopPool: document.getElementById("troopPool"),
	droppableSlots: document.querySelectorAll(".slot, .troop-pool"),

	// buttons
	resetButton: document.getElementById("resetSlots"),
	newWeekButton: document.getElementById("newWeekButton"),
	missionButtons: document.querySelectorAll(".mission-button"),
	restButtons: document.querySelectorAll(".rest-button"),
	goalInfo: document.getElementById("goalInfo"),
	warningInfo: document.getElementById("warningInfo"),
	weekDisplay: document.getElementById("weekDisplay"),

	// mission resolve
	giveOrderButtons: document.querySelectorAll(".give-order-button"),

	// end of mission modal
	endMissionDialog: document.getElementById("endMissionDialog"),
	endMissionButton: endMissionDialog.querySelector("#endMissionButton"),

	// buyer buttons
	buyFoodButton: document.getElementById("buyFood"),
	buySuppliesButton: document.getElementById("buySupplies"),
};

export function initUI(gameData) {

	GameUI.tooltip = document.createElement("div");
	GameUI.tooltip.className = "tooltip";
	document.body.appendChild(GameUI.tooltip);

	document.querySelectorAll(".troop-card").forEach((card) => card.remove());

	gameData.troops.forEach((_, troopId) => {
		const card = createTroopCard(troopId, true, true);
		troopPool.appendChild(card);
	});

	GameUI.droppableSlots.forEach(slot => {
		slot.className = "slot";
	});

	GameUI.troopPool.className = "troop-pool";

	GameUI.missionSlots.forEach(slot => {
		slot.classList.add("mission-slot");
	});

	DialogMissionPreparation.init();
}

const MissionSlotUI = (() => {
	function update(slot, gameData, newTurn) {
		const missionId = slot.dataset.num;
		const frozen = isFrozen(slot);
		const occupied = isOccupied(slot);
		const travelDuration = gameData.state.get("mission")[missionId].travelDuration;
		const ap = gameData.resources.get("ap").value;

		const textOverlay = slot.querySelector(".frozen-overlay-text");
		const giveOrderButton = getItem(GameUI.giveOrderButtons, missionId);
		const missionButton = getItem(GameUI.missionButtons, missionId);

		if (frozen && travelDuration >= 1) {
			textOverlay.textContent = `TRAVEL TO MISSION\r\n${travelDuration} weeks remaining`;
			textOverlay.style.visibility = "visible";

			giveOrderButton.style.visibility = "hidden";
			giveOrderButton.disabled = true;

			missionButton.disabled = true;
		}
		else if (frozen && travelDuration < 1) {
			textOverlay.textContent = "";
			textOverlay.style.visibility = "hidden";

			giveOrderButton.style.visibility = "visible";
			if (newTurn) {
				giveOrderButton.disabled = false;
			}

			if (!giveOrderButton.disabled) {
				GameUI.newWeekButton.disabled = true;
			}
		} else {
			textOverlay.textContent = "";
			textOverlay.style.visibility = "hidden";

			giveOrderButton.style.visibility = "hidden";

			missionButton.disabled = (ap <= 0 || !occupied);
		}
	}
	return { update };
})();

const RestSlotUI = (() => {
	function update(slot, gameData) {
		const restId = slot.dataset.num;
		const frozen = isFrozen(slot);
		const occupied = isOccupied(slot);
		const ap = gameData.resources.get("ap").value;

		const textOverlay = slot.querySelector(".frozen-overlay-text");
		const restButton = getItem(GameUI.restButtons, restId);

		if (frozen) {
			textOverlay.textContent = "Rest until next week";
			textOverlay.style.visibility = "visible";

			restButton.disabled = true;
		} else {
			textOverlay.textContent = "";

			textOverlay.style.visibility = "hidden";
			restButton.disabled = (ap <= 0 || !occupied);
		}
	}
	return { update };
})();

const resourceUI = (() => {
	function update(res) {
		const uis = document.querySelectorAll("." + res.class);
		uis.forEach((ui) => {
			ui.textContent = res.value;
		});
	}
	return { update };
})();

const buyButtonsUI = (() => {
	function update(gameData) {
		const ap = gameData.resources.get("ap");
		const gold = gameData.resources.get("gold");

		GameUI.buyFoodButton.disabled = (ap.value <= 0 || gold.value <= 0);
		GameUI.buySuppliesButton.disabled = (ap.value <= 0 || gold.value <= 0);
	}
	return { update };
})();

export function updateUI(gameData, newTurn = false) {
	GameUI.newWeekButton.disabled = false;
	GameUI.weekDisplay.textContent = `Weeks: ${gameData.state.get("week")}`;
	GameUI.goalInfo.textContent = `Goal: ${gameData.state.get("winCondition").description}`;
	GameUI.warningInfo.textContent = gameData.state.get("deathCounter") ? `Warning: ${gameData.state.get("deathCounter").name} will die in ${gameData.state.get("deathCounter").counter} weeks`: "";

	GameUI.missionSlots.forEach((slot) => {
		MissionSlotUI.update(slot, gameData, newTurn);
	});

	GameUI.restSlots.forEach((slot) => {
		RestSlotUI.update(slot, gameData);
	});

	gameData.resources.forEach((v, _) => {
		resourceUI.update(v);
	});

	buyButtonsUI.update(gameData);

	GameUI.getTroopCards().forEach((card) => {
		const id = card.dataset.num;
		const troop = gameData.troops.get(id);
		const healthIndicator = card.querySelector(".health-indicator")
		while (healthIndicator.firstChild) {
			healthIndicator.removeChild(healthIndicator.lastChild);
		}
		for (let i = 0; i < troop.health; i++) {
			const img = document.createElement("img");
			img.src = "images/fb681.png";
			img.draggable = false;
			healthIndicator.appendChild(img);
		}
		for (let i = troop.health; i < troop.max_health; i++) {
			const img = document.createElement("img");
			img.src = "images/fb681_altered.png";
			img.draggable = false;
			healthIndicator.appendChild(img);
		}
	});

	DialogMissionPreparation.update();
	DialogMissionResolve.update();
}

export function cleanRestSlot(gameData, slot) {

	slot.querySelectorAll(".troop-card").forEach((card) => {
		const troopId = card.dataset.num;
		const troop = gameData.troops.get(troopId);
		if (troop.health < troop.max_health) {
			troop.health += 1;
		}

		card.classList.remove("frozen");
		GameUI.troopPool.appendChild(card);
	});

	slot.classList.remove("frozen");
	slot.classList.remove("occupied");
}

const PHASE_UI = {
	0: {
		"#missionBox1": false,
		"#missionBox0": true,
		"#restBoxes": false,
	},
	1: {
		"#missionBoxes": false,
		"#missionBox0": false,
		"#restBoxes": true,
	},
	2: {
		"#missionBox0": true,
		"#restBoxes": false,
	}

};

export function nextPhaseUI(currentStep) {

	const config = PHASE_UI[currentStep];

	if (config) {
		Object.entries(config).forEach(([selector, show]) => {
			document.querySelector(selector).style.visibility = show ? "visible" : "hidden";
		});
	}
}
