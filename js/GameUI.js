import { createTroopCard } from "./Troops.js"
import { getItem, isFrozen, isOccupied } from "./utils.js"

export const GameUI = {
	// general tooltip
	tooltip: null,
	// elements on main screen
	missionSlots: document.querySelectorAll(".mission-slot"),
	restSlots: document.querySelectorAll(".rest-slot"),
	troopPool: document.getElementById("troopPool"),
	droppableSlots: document.querySelectorAll(".slot, .troop-pool"),

	// buttons
	resetButton: document.getElementById("resetSlots"),
	newWeekButton: document.getElementById("newWeekButton"),
	missionButtons: document.querySelectorAll(".mission-button"),
	restButtons: document.querySelectorAll(".rest-button"),
	stateDisplay: document.getElementById("state"),

	// main buttons of missions
	missionDialog: document.getElementById("missionDialog"),
	sendMission: document.getElementById("sendMission"),
	cancelMission: document.getElementById("cancelMission"),
	regions: document.querySelectorAll(".region"),

	// tooltip of missions
	regionTooltip: document.getElementById("regionTooltip"),

	// description of missions
	missionDescription: document.getElementById("missionDescription"),

	// mission resolve
	giveOrderButtons: document.querySelectorAll(".give-order-button"),
	missionResolveDialog: document.getElementById("missionResolveDialog"),
	missionTroopBox: document.getElementById("missionTroopBox"),
	progressBar: document.getElementById("progressBar"),
	progressBarPrev: document.getElementById("progressBarPrev"),
	durationInfo: document.getElementById("durationInfo"),
	confirmMissionResolve: document.getElementById("confirmMissionResolve"),
	resetMissionResolve: document.getElementById("resetMissionResolve"),
	cancelMissionResolve: document.getElementById("cancelMissionResolve"),
	giveUpMissionResolve: document.getElementById("giveUpMissionResolve"),

	// strategies
	strategyMenu: document.getElementById("strategyMenu"),
	strategyOptions: document.querySelectorAll(".strategy-option"),

	// tooltip of strategies
	strategyTooltip: document.getElementById("strategyTooltip"),

	// end of mission modal
	endMissionDialog: document.getElementById("endMissionDialog"),
	endMissionButton: endMissionDialog.querySelector("#endMissionButton"),

	// buyer buttons
	buyFoodButton: document.getElementById("buyFood"),
	buySuppliesButton: document.getElementById("buySupplies"),

};

export function start(gameData, gameUI) {

	gameUI.tooltip = document.createElement("div");
	gameUI.tooltip.className = "tooltip";
	document.body.appendChild(gameUI.tooltip);
	gameUI.sendMission.disabled = true;

	document.querySelectorAll(".troop-card").forEach((card) => card.remove());

	gameData.troops.forEach((_, troopId) => {
		const card = createTroopCard(gameData, gameUI, troopId, true);
		troopPool.appendChild(card);
	});

	gameUI.droppableSlots.forEach(slot => {
		slot.className = "slot";
	});

	gameUI.troopPool.className = "troop-pool";

	gameUI.missionSlots.forEach(slot => {
		slot.classList.add("mission-slot");
	});

	gameUI.regions.forEach(region => {
		region.classList.add("region");
	});
}

const MissionSlotUI = (() => {
	function update(slot, gameUI, gameData, newTurn) {
		const missionId = slot.dataset.num;
		const frozen = isFrozen(slot);
		const occupied = isOccupied(slot);
		const travelDuration = gameData.state.get("mission")[missionId].travelDuration;
		const ap = gameData.resource.get("ap").value;

		const textOverlay = slot.querySelector(".frozen-overlay-text");
		const giveOrderButton = getItem(gameUI.giveOrderButtons, missionId);
		const missionButton = getItem(gameUI.missionButtons, missionId);

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
				gameUI.newWeekButton.disabled = true;
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
	function update(slot, gameUI, gameData) {
		const restId = slot.dataset.num;
		const frozen = isFrozen(slot);
		const occupied = isOccupied(slot);
		const ap = gameData.resource.get("ap").value;

		const textOverlay = slot.querySelector(".frozen-overlay-text");
		const restButton = getItem(gameUI.restButtons, restId);

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
	function update(gameData, gameUI) {
		const ap = gameData.resource.get("ap");
		const gold = gameData.resource.get("gold");

		gameUI.buyFoodButton.disabled = (ap.value <= 0 || gold.value <= 0);
		gameUI.buySuppliesButton.disabled = (ap.value <= 0 || gold.value <= 0);
	}
	return { update };
})();

export function updateUI(gameData, gameUI, newTurn = false) {
	gameUI.newWeekButton.disabled = false;
	gameUI.stateDisplay.textContent = `Weeks: ${gameData.state.get("week")}`;

	gameUI.missionSlots.forEach((slot) => {
		MissionSlotUI.update(slot, gameUI, gameData, newTurn);
	});

	gameUI.restSlots.forEach((slot) => {
		RestSlotUI.update(slot, gameUI, gameData);
	});

	gameData.resource.forEach((v, _) => {
		resourceUI.update(v);
	});

	buyButtonsUI.update(gameData, gameUI);

	document.querySelectorAll(".troop-card").forEach((card) => {
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

	if (gameData.currentMission && gameData.selectedLocation) {
		const mission = gameData.state.get("mission")[gameData.currentMission];
		const location = gameData.region.get(gameData.selectedLocation);

		const estimatedWeeksWork = Math.ceil(location.efficiency / mission.efficiency);
		const enoughCautiousness = mission.cautiousness >= location.danger;

		gameUI.missionDescription.style.visibility = "visible"
		gameUI.missionDescription.innerHTML = `${partyToStr(gameData, mission.party)} going to <span class="bold">${location.name}</span> a <span class="bold">${location.travelDuration}-${location.travelDuration <= 1 ? "week" : "weeks"}</span> travel.<br>The contract should be <span class="bold">${estimatedDifficulty(estimatedWeeksWork, enoughCautiousness)}</span> and should earn <span class="bold">${location.reward} golds</span> if done during the first week.`;

		gameUI.sendMission.disabled = false;
	} else {
		gameUI.missionDescription.style.visibility = "hidden"
		gameUI.sendMission.disabled = true;
	}

	gameUI.strategyOptions.forEach((option) => {
		const optionId = option.dataset.num;
		option.textContent = gameData.strategy.get(optionId).name;
	});

	if (gameData.currentMission) {
		const mission = gameData.state.get("mission")[gameData.currentMission];
		const location = gameData.region.get(mission.location);

		if (location) {
			gameUI.missionTroopBox.querySelectorAll(".stat-info").forEach((box) => {

				const text = box.querySelector(".stat-info-text");
				const ap = box.querySelector(".consumed-ap");
				const supplies = box.querySelector(".consumed-supplies");
				const lostHp = box.querySelector(".lost-hp-display");
				const strategyBox = box.querySelector(".strategy-box");

				const troopId = text.dataset.num;
				const troop = gameData.troops.get(troopId);

				const strategyId = mission.party.get(troopId);
				const strategy = gameData.strategy.get(strategyId);

				const modEfficiency = strategy.modifiers.find((e) => e.type === "efficiency");
				const totalEfficiency = troop.efficiency + (modEfficiency ? modEfficiency.value : 0);

				const modCautiousness = strategy.modifiers.find((e) => e.type === "cautiousness");
				const totalCautiousness = troop.cautiousness + (modCautiousness ? modCautiousness.value : 0);

				if (troop.health == 0) {
					text.textContent = "Cant fight";
					ap.style.visibility = "hidden";
					supplies.style.visibility = "hidden";
					lostHp.style.visibility = "hidden";
					strategyBox.style.visibility = "hidden";
					return;
				} else {
					text.textContent = `Efficiency: ${totalEfficiency}\nCautiousness: ${totalCautiousness}`;
				}

				const costAp = strategy.cost.find((e) => e.type === "ap");
				if (costAp && costAp.value > 0) {
					ap.style.visibility = "visible";
				} else {
					ap.style.visibility = "hidden";
				}

				const costSupplies = strategy.cost.find((e) => e.type === "supplies");
				if (costSupplies && costSupplies.value > 0) {
					supplies.style.visibility = "visible";
				} else {
					supplies.style.visibility = "hidden";
				}

				if (location.danger > mission.cautiousness) {
					lostHp.style.visibility = "visible";
				} else {
					lostHp.style.visibility = "hidden";
				}

				strategyBox.textContent = strategy.name;
			});

			gameUI.progressBar.style.width = Math.ceil(100 * mission.efficiency / location.efficiency) + "%";
			gameUI.progressBarPrev.style.width = Math.ceil(100 * mission.prevEfficiency / location.efficiency) + "%";
			const latePenaltyFees = location.reward - mission.reward;
			gameUI.durationInfo.innerHTML = `${partyToStr(gameData, mission.party)} working on this mission for <span class="bold">${mission.missionDuration} ${mission.missionDuration <= 1 ? "week" : "weeks"}</span> ${latePenaltyFees > 0 ? `<br>resulting in a loss of <span class="bold">${goldToStr(latePenaltyFees)}</span> as a late penalty fee.` : "."}`;

			if (gameData.resource.get("ap").value < mission.costAp ||
				gameData.resource.get("supplies").value < mission.costSupplies) {
				gameUI.confirmMissionResolve.disabled = true;
			} else {
				gameUI.confirmMissionResolve.disabled = false;
			}
		}
	}
}

function partyToStr(gameData, party) {
	const partyNames = Array.from(party).map(([id, _]) => gameData.troops.get(id).name);
	if (partyNames.length == 1) {
		return `${partyNames[0]} is`;
	}
	const last = partyNames.pop();
	return `${partyNames.join(", ")} and ${last} are`;
}

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

export function goldToStr(gold) {
	return `${gold} ${gold <= 1 ? "gold" : "golds"}`;
}

export function cleanMissionSlot(gameUI, slot, mission) {
	const region = getItem(gameUI.regions, mission.location);

	slot.querySelectorAll(".troop-card").forEach((card) => {
		card.classList.remove("frozen");
		gameUI.troopPool.appendChild(card);
	});

	slot.classList.remove("frozen");
	slot.classList.remove("occupied");
	region.classList.remove("frozen");
}

export function cleanRestSlot(gameData, gameUI, slot) {

	slot.querySelectorAll(".troop-card").forEach((card) => {
		const troopId = card.dataset.num;
		const troop = gameData.troops.get(troopId);
		if (troop.health < troop.max_health) {
			troop.health += 1;
		}

		card.classList.remove("frozen");
		gameUI.troopPool.appendChild(card);
	});

	slot.classList.remove("frozen");
	slot.classList.remove("occupied");
}
