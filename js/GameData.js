export const GameData = {
	// persistent data storage
	state: new Map(),
	region: new Map(),
	troops: new Map(),
	resource: new Map(),
	strategy: new Map(),

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

	gameData.state = new Map();
	gameData.region = new Map();
	gameData.troops = new Map();
	gameData.resource = new Map();

	gameData.state.set("week", 1);
	gameData.state.set("mission", {
		0: resetMission(),
		1: resetMission(),
	});

	gameData.region.set("A", { name: "City A", distance: "250km", travelDuration: 1, efficiency: 10, danger: 5, reward: 10, });
	gameData.region.set("B", { name: "City B", distance: "300km", travelDuration: 2, efficiency: 20, danger: 5, reward: 20, });
	gameData.region.set("C", { name: "City C", distance: "350km", travelDuration: 2, efficiency: 30, danger: 10, reward: 30, });

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

	gameData.resource.set("ap", { class: "res-ap", value: 5 });
	gameData.resource.set("gold", { class: "res-gold", value: 100 });
	gameData.resource.set("food", { class: "res-food", value: 20 });
	gameData.resource.set("supplies", { class: "res-supplies", value: 10 });

	gameData.strategy.set("A", {
		name: "Default", cost: [], modifiers: []
	});
	gameData.strategy.set("B", {
		name: "Passive",
		cost: [
			{ type: "ap", value: 1 },
		],
		modifiers: [
			{ type: "efficiency", value: -1 },
			{ type: "cautiousness", value: +2 }
		]
	});
	gameData.strategy.set("C", {
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
	gameData.strategy.set("D", {
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
