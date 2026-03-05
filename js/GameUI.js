import { createTroopCard } from "./Troops.js"
import { getItem } from "./utils.js"

const GameUI = {
	// persistent data storage
	gameStateData: new Map(),
	regionData: new Map(),
	troopData: new Map(),
	resourceData: new Map(),
	strategyData: new Map(),

	// globals

	// dragging cards
	draggedElement: null,
	originalParent: null,

	// mission selection
	currentMission: null,
	selectedLocation: null,

	// strategy selection
	selectedStrategy: null,

	// elements on main screen
	missionSlots: document.querySelectorAll(".mission-slot"),
	restSlots: document.querySelectorAll(".rest-slot"),
	troopPool: document.getElementById("troopPool"),
	dropableSlots: document.querySelectorAll(".slot, .troop-pool"),

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
	regionTooltiptext: document.getElementById("regionTooltiptext"),

	// description of missions
	missionDescription: document.getElementById("missionDescription"),

	// mission resolve
	frozenTexts: document.querySelectorAll(".frozen-overlay-text"),
	giveOrderButtons: document.querySelectorAll(".overlay-button"),
	missionResolveDialog: document.getElementById("missionResolveDialog"),
	missionTroopBox: document.getElementById("missionTroopBox"),
	progressBar: document.getElementById("progressBar"),
	progressBarPrev: document.getElementById("progressBarPrev"),
	rewardInfo: document.getElementById("rewardInfo"),
	confirmMissionResolve: document.getElementById("confirmMissionResolve"),
	cancelMissionResolve: document.getElementById("cancelMissionResolve"),

	// strategies
	strategyMenu: document.getElementById("strategyMenu"),
	strategyOptions: document.querySelectorAll(".strategy-option"),

	// tooltip of strategies
	strategyTooltip: document.getElementById("strategyTooltip"),
	strategyTooltiptext: document.getElementById("strategyTooltiptext"),

	// gameover modal
	gameOverDialog: document.getElementById("gameOverDialog"),
	restartButton: document.getElementById("restart"),

	// gameover modal
	endMissionDialog: document.getElementById("endMissionDialog"),
	messageEndMission: document.getElementById("messageEndMission"),
	continueButton: document.getElementById("continue"),

	// buyer buttons
	buyFoodButton: document.getElementById("buyFood"),
	buySuppliesButton: document.getElementById("buySupplies"),
};

export function resetMission() {
	return {
		travelDuration: null,
		location: null,
		efficiency: 0,
		cautiousness: 0,
		costAp: 0,
		costSupplies: 0,
		prevEfficiency: 0,
		party: [],
		reward: 0
	};
}

export function start(GameUI) {
	GameUI.draggedElement = null;
	GameUI.originalParent = null;
	GameUI.currentMission = null;
	GameUI.selectedLocation = null;
	GameUI.selectedStrategy = null;

	GameUI.gameStateData = new Map();
	GameUI.regionData = new Map();
	GameUI.troopData = new Map();
	GameUI.resourceData = new Map();

	GameUI.gameStateData.set("week", 1);
	GameUI.gameStateData.set("mission", {
		0: resetMission(),
		1: resetMission(),
	});

	GameUI.regionData.set("A", { name: "City A", distance: "250km", travelDuration: 1, efficiency: 10, danger: 5, reward: 10, });
	GameUI.regionData.set("B", { name: "City B", distance: "300km", travelDuration: 2, efficiency: 20, danger: 5, reward: 20, });
	GameUI.regionData.set("C", { name: "City C", distance: "350km", travelDuration: 2, efficiency: 30, danger: 10, reward: 30, });

	GameUI.troopData.set("A", {
		name: "Anae",
		png: "images/MageLady.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});
	GameUI.troopData.set("B", {
		name: "Ekor",
		png: "images/MageMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});
	GameUI.troopData.set("C", {
		name: "Krisa",
		png: "images/PalLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	GameUI.troopData.set("D", {
		name: "Istriac",
		png: "images/PalMan.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	GameUI.troopData.set("E", {
		name: "Hjop",
		png: "images/RangerLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	GameUI.troopData.set("F", {
		name: "Frivkyl",
		png: "images/RangerMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});

	GameUI.resourceData.set("ap", { class: "res-ap", value: 5 });
	GameUI.resourceData.set("gold", { class: "res-gold", value: 100 });
	GameUI.resourceData.set("food", { class: "res-food", value: 20 });
	GameUI.resourceData.set("supplies", { class: "res-supplies", value: 10 });

	GameUI.strategyData.set("A", {
		name: "Default", cost: [], modifiers: []
	});
	GameUI.strategyData.set("B", {
		name: "Passive",
		cost: [
			{ type: "ap", value: 1 },
		],
		modifiers: [
			{ type: "efficiency", value: -1 },
			{ type: "cautiousness", value: +2 }
		]
	});
	GameUI.strategyData.set("C", {
		name: "Aggressive",
		cost: [
			{ type: "ap", value: 1 },
			{ type: "supplies", value: 1 },
		],
		modifiers: [
			{ type: "efficiency", value: +2 },
			{ type: "cautiousness", value: -1 }
		]
	});
	GameUI.strategyData.set("D", {
		name: "Defensive",
		cost: [
			{ type: "ap", value: 1 },
			{ type: "supplies", value: 1 },
		],
		modifiers: [
			{ type: "efficiency", value: +1 },
			{ type: "cautiousness", value: +1 }
		]
	});

	GameUI.sendMission.disabled = true;

	document.querySelectorAll(".troop-card").forEach((card) => card.remove());

	GameUI.troopData.forEach((_, troopId) => {
		const card = createTroopCard(GameUI, troopId, true);
		troopPool.appendChild(card);
	});

	GameUI.dropableSlots.forEach(slot => {
		slot.className = "slot";
	});

	GameUI.troopPool.className = "troop-pool";

	GameUI.regions.forEach(region => {
		region.setAttribute("class", "region");
	});
}

export function updateUI(GameUI, newTurn = false) {
	GameUI.newWeekButton.disabled = false;
	GameUI.stateDisplay.textContent = `Weeks: ${GameUI.gameStateData.get("week")}`;

	GameUI.missionSlots.forEach((slot) => {
		const missionId = slot.getAttribute("data-num");
		const textOverlay = getItem(GameUI.frozenTexts, missionId);
		const giveOrder = getItem(GameUI.giveOrderButtons, missionId);

		if (slot.classList.contains("frozen")) {
			const travelDuration = GameUI.gameStateData.get("mission")[missionId].travelDuration;
			if (travelDuration >= 1) {
				textOverlay.style.display = "block";
				textOverlay.textContent = `TRAVEL TO MISSION\r\n${travelDuration} weeks remaining`;
				giveOrder.style.display = "none";
				giveOrder.disabled = true;
			} else {
				textOverlay.style.display = "none";
				textOverlay.textContent = "";
				giveOrder.style.display = "block";
				if (newTurn) {
					giveOrder.disabled = false;
				}

				if (!giveOrder.disabled) {
					GameUI.newWeekButton.disabled = true;
				}
			}
			getItem(GameUI.missionButtons, missionId).disabled = true;
		} else {

			textOverlay.style.display = "none";
			textOverlay.textContent = "";
			giveOrder.style.display = "none";

			if (GameUI.resourceData.get("ap").value <= 0 || !slot.classList.contains("occupied")) {
				getItem(GameUI.missionButtons, missionId).disabled = true;
			} else {
				getItem(GameUI.missionButtons, missionId).disabled = false;
			}
		}
	});

	GameUI.restSlots.forEach((slot) => {
		const restId = slot.getAttribute("data-num");
		if (slot.classList.contains("frozen")) {
			slot.setAttribute("data-frozen-text", "Rest until next week");
			getItem(GameUI.restButtons, restId).disabled = true;
		} else {
			if (GameUI.resourceData.get("ap").value <= 0 || !slot.classList.contains("occupied")) {
				getItem(GameUI.restButtons, restId).disabled = true;
			} else {
				getItem(GameUI.restButtons, restId).disabled = false;
			}
		}
	});

	GameUI.resourceData.forEach((v, _) => {
		const uis = document.querySelectorAll("." + v.class);
		uis.forEach((ui) => {
			ui.textContent = v.value;
		});
	});

	if (GameUI.resourceData.get("ap").value <= 0 || GameUI.resourceData.get("gold").value <= 0) {
		GameUI.buyFoodButton.disabled = true;
		GameUI.buySuppliesButton.disabled = true;
	} else {
		GameUI.buyFoodButton.disabled = false;
		GameUI.buySuppliesButton.disabled = false;
	}

	document.querySelectorAll(".troop-card").forEach((card) => {
		const id = card.getAttribute("data-num");
		const troop = GameUI.troopData.get(id);
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

	if (GameUI.currentMission && GameUI.selectedLocation) {
		const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
		const location = GameUI.regionData.get(GameUI.selectedLocation);

		const partyNames = Array.from(mission.party).map(([id, _]) => GameUI.troopData.get(id).name);
		const estimatedWeeksWork = Math.ceil(location.efficiency / mission.efficiency);

		GameUI.missionDescription.innerHTML = `${partyNames} are going to <span class="city-name">${location.name}</span>, they are expected to reach destination in <span class="weeks-info">${location.travelDuration} weeks</span>.<br>They are expected to spend <span class="weeks-info">${estimatedWeeksWork} weeks</span> to finish this contract that is prized at <span class="weeks-info">${location.reward} golds</span>`;

		GameUI.sendMission.disabled = false;
	} else {
		GameUI.missionDescription.textContent = "";
		GameUI.sendMission.disabled = true;
	}

	GameUI.strategyOptions.forEach((option) => {
		const optionId = option.getAttribute("data-num");
		option.textContent = GameUI.strategyData.get(optionId).name;
	});

	if (GameUI.currentMission) {
		const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
		const location = GameUI.regionData.get(mission.location);

		if (location) {
			GameUI.missionTroopBox.querySelectorAll(".stat-info").forEach((box) => {

				const text = box.querySelector(".stat-info-text");
				const ap = box.querySelector(".consumed-ap");
				const supplies = box.querySelector(".consumed-supplies");

				const troopId = text.getAttribute("data-num");
				const troop = GameUI.troopData.get(troopId);

				if (troop.health == 0) {
					text.textContent = "Cant fight";
					return;
				}

				const strategyId = mission.party.get(troopId);
				const strategy = GameUI.strategyData.get(strategyId);

				const modEfficiency = strategy.modifiers.find((e) => e.type === "efficiency");
				const totalEfficiency = troop.efficiency + (modEfficiency ? modEfficiency.value : 0);

				const modCautiousness = strategy.modifiers.find((e) => e.type === "cautiousness");
				const totalCautiousness = troop.cautiousness + (modCautiousness ? modCautiousness.value : 0);

				text.textContent = `Efficiency: ${totalEfficiency}\nCautiousness: ${totalCautiousness}`;

				const costAp = strategy.cost.find((e) => e.type === "ap");
				if (costAp && costAp.value > 0) {
					ap.style.display = "block";
				} else {
					ap.style.display = "none";
				}

				const costSupplies = strategy.cost.find((e) => e.type === "supplies");
				if (costSupplies && costSupplies.value > 0) {
					supplies.style.display = "block";
				} else {
					supplies.style.display = "none";
				}
			});

			GameUI.missionTroopBox.querySelectorAll(".lost-hp-display").forEach((lost) => {
				if (location.danger > mission.cautiousness) {
					lost.style.display = "block"
				} else {
					lost.style.display = "none"
				}
			});

			GameUI.progressBar.style.width = Math.ceil(100 * mission.efficiency / location.efficiency) + "%";
			GameUI.progressBarPrev.style.width = Math.ceil(100 * mission.prevEfficiency / location.efficiency) + "%";
			GameUI.rewardInfo.textContent = `Reward: ${mission.reward}`;

			if (GameUI.resourceData.get("ap").value < mission.costAp ||
				GameUI.resourceData.get("supplies").value < mission.costSupplies) {
				GameUI.confirmMissionResolve.disabled = true;
			} else {
				GameUI.confirmMissionResolve.disabled = false;
			}
		}
	}
}

export { GameUI };
