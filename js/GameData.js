export const GameData = {
	// persistent data storage
	state: new Map(),
	regions: new Map(),
	troops: new Map(),
	resources: new Map(),
	strategies: new Map(),
	contracts: new Map(),

	// dragging cards
	draggedElement: null,
	originalParent: null,

	// mission selection
	currentMission: null,
	selectedLocation: null,

	// strategy selection
	selectedStrategy: null,
}

export function resetMission() {
	return {
		travelDuration: null,
		location: null,
		contract: null,
		efficiency: 0,
		cautiousness: 0,
		costAp: 0,
		costSupplies: 0,
		prevEfficiency: 0,
		party: [],
		reward: 0,
		missionDuration: 0,
	};
}

export function initData(gameData) {
	gameData.draggedElement = null;
	gameData.originalParent = null;
	gameData.currentMission = null;
	gameData.selectedLocation = null;
	gameData.selectedStrategy = null;

	gameData.state.set("week", 1);
	gameData.state.set("mission", {
		0: resetMission(),
		1: resetMission(),
	});
	gameData.state.set("winCondition", null);
	gameData.state.set("loseCondition", null);

	gameData.regions.set("A", {
		name: "Ata",
		travelDuration: 1,
		available: true,
		contract: "A",
	});
	gameData.regions.set("B", {
		name: "City B",
		travelDuration: 2,
		available: false,
		contract: null,
	});
	gameData.regions.set("C", {
		name: "City C",
		travelDuration: 2,
		available: false,
		contract: null,
	});
	gameData.regions.set("D", {
		name: "Linkerburg",
		travelDuration: 0,
		available: true,
		contract: null,
	});

	gameData.contracts.set("A", {
		efficiency: 5,
		danger: 3,
		reward: 5,
	});
	gameData.contracts.set("B", {
		efficiency: 20,
		danger: 5,
		reward: 20,
	});
	gameData.contracts.set("C", {
		efficiency: 30,
		danger: 10,
		reward: 30,
	});

	gameData.troops.set("A", {
		name: "Anae",
		png: "images/MageLady.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});
	gameData.troops.set("B", {
		name: "Ekor",
		png: "images/MageMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});
	gameData.troops.set("C", {
		name: "Krisa",
		png: "images/PalLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	gameData.troops.set("D", {
		name: "Istriac",
		png: "images/PalMan.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	gameData.troops.set("E", {
		name: "Hjop",
		png: "images/RangerLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	gameData.troops.set("F", {
		name: "Frivkyl",
		png: "images/RangerMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});

	gameData.resources.set("ap", { class: "res-ap", value: 5 });
	gameData.resources.set("gold", { class: "res-gold", value: 100 });
	gameData.resources.set("food", { class: "res-food", value: 20 });
	gameData.resources.set("supplies", { class: "res-supplies", value: 10 });

	gameData.strategies.set("A", {
		name: "Default", cost: [], modifiers: []
	});
	gameData.strategies.set("B", {
		name: "Passive",
		cost: [
			{ type: "ap", value: 1 },
		],
		modifiers: [
			{ type: "efficiency", value: -1 },
			{ type: "cautiousness", value: +2 }
		]
	});
	gameData.strategies.set("C", {
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
	gameData.strategies.set("D", {
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
}
