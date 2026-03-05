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
	draggedElement: null,
	originalParent: null,
	currentMission: null,
	currentParty: new Array(),
	selectedLocation: null,
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
	missionResolveDialog: document.getElementById("missionResolveDialog"),
	missionTroopBox: document.getElementById("missionTroopBox"),
	strategyMenu: document.getElementById("strategyMenu"),
	strategyOptions: document.querySelectorAll(".strategy-option"),
	progressBar: document.getElementById("progressBar"),
	confirmMissionResolve: document.getElementById("confirmMissionResolve"),
	cancelMissionResolve: document.getElementById("cancelMissionResolve"),

	// tooltip of strategies
	strategyTooltip: document.getElementById("strategyTooltip"),
	strategyTooltiptext: document.getElementById("strategyTooltiptext"),

	// supplies for missions
	suppliesAmount: document.getElementById("suppliesAmount"),
	suppliesUp: document.getElementById("suppliesUp"),
	suppliesDown: document.getElementById("suppliesDown"),

	// gameover modal
	gameOverDialog: document.getElementById("gameOverDialog"),
	restartButton: document.getElementById("restart"),

	// buyer buttons
	buyFoodButton: document.getElementById("buyFood"),
	buySuppliesButton: document.getElementById("buySupplies"),
};

export function start(GameUI) {
	GameUI.draggedElement = null;
	GameUI.originalParent = null;
	GameUI.currentMission = null;
	GameUI.selectedLocation = null;

	GameUI.gameStateData = new Map();
	GameUI.regionData = new Map();
	GameUI.troopData = new Map();
	GameUI.resourceData = new Map();

	GameUI.gameStateData.set("week", 1);
	GameUI.gameStateData.set("mission", {
		0: { travelDuration: null, location: null, efficiency: 0, cautiousness: 0, party: [] },
		1: { travelDuration: null, location: null, efficiency: 0, cautiousness: 0, party: [] }
	});

	GameUI.regionData.set("A", { name: "City A", distance: "250km", travelDuration: 1, efficiency: 10 });
	GameUI.regionData.set("B", { name: "City B", distance: "300km", travelDuration: 2, efficiency: 20 });
	GameUI.regionData.set("C", { name: "City C", distance: "350km", travelDuration: 2, efficiency: 30 });

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

	GameUI.resourceData.set("ap", { id: "ap", value: 5 });
	GameUI.resourceData.set("gold", { id: "gold", value: 100 });
	GameUI.resourceData.set("food", { id: "food", value: 20 });
	GameUI.resourceData.set("supplies", { id: "supplies", value: 10 });

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

	suppliesAmount.value = 0;
	sendMission.disabled = true;

	while (GameUI.troopPool.firstChild) {
		GameUI.troopPool.removeChild(GameUI.troopPool.lastChild);
	}

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

export function updateUI(GameUI) {
	GameUI.stateDisplay.textContent = `Weeks: ${GameUI.gameStateData.get("week")}`;

	GameUI.missionSlots.forEach((slot) => {
		const missionId = slot.getAttribute("data-num");
		if (slot.classList.contains("frozen")) {
			const travelDuration = GameUI.gameStateData.get("mission")[missionId].travelDuration;
			const textOverlay = slot.querySelector(".frozen-overlay-text");

			if (textOverlay) {
				textOverlay.textContent = `TRAVEL TO MISSION\r\n${travelDuration} weeks remaining`;
			}
			getItem(GameUI.missionButtons, missionId).disabled = true;
		} else {
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
		const ui = document.getElementById(v.id);
		ui.textContent = v.value;
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

	GameUI.missionDescription.textContent = "";

	GameUI.strategyOptions.forEach((option) => {
		const optionId = option.getAttribute("data-num");
		option.textContent = GameUI.strategyData.get(optionId).name;
	});

	let partyEfficiency = 0;
	let partyCautiousness = 0;
	GameUI.missionTroopBox.querySelectorAll(".stat-info").forEach((stat) => {
		const card = stat.querySelector(".troop-card");
		const strategyBox = stat.querySelector(".strategy-box");
		const text = stat.querySelector(".stat-info-text");

		const troopId = card.getAttribute("data-num");
		const troop = GameUI.troopData.get(troopId);

		const strategyId = strategyBox.getAttribute("data-num");
		const strategy = GameUI.strategyData.get(strategyId);

		const modEfficiency = strategy.modifiers.find((e) => e.type === "efficiency");
		const totalEfficiency = troop.efficiency + (modEfficiency ? modEfficiency.value : 0);

		const modCautiousness = strategy.modifiers.find((e) => e.type === "cautiousness");
		const totalCautiousness = troop.cautiousness + (modCautiousness ? modCautiousness.value : 0);

		partyEfficiency += totalEfficiency;
		partyCautiousness += totalCautiousness;

		text.textContent = `Efficiency: ${totalEfficiency}\nCautiousness: ${totalCautiousness}`;
	});

	if (GameUI.selectedLocation) {
		GameUI.progressBar.style.width = Math.ceil(100 * partyEfficiency / GameUI.regionData.get(GameUI.selectedLocation).efficiency) + "%";
	}
}

export { GameUI };
