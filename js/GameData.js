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

export function initData() {
	GameData.draggedElement = null;
	GameData.originalParent = null;
	GameData.currentMission = null;
	GameData.selectedLocation = null;
	GameData.selectedStrategy = null;

	GameData.state.set("win", false);
	GameData.state.set("step", 0);
	GameData.state.set("week", 1);
	GameData.state.set("mission", {
		0: resetMission(),
		1: resetMission(),
	});
	GameData.state.set("winCondition", { condition: null, description: "" });
	GameData.state.set("loseCondition", { condition: null, description: "" });

	GameData.regions.set("A", {
		name: "Ata",
		travelDuration: 1,
		available: true,
		contract: "A",
	});
	GameData.regions.set("B", {
		name: "City B",
		travelDuration: 2,
		available: false,
		contract: null,
	});
	GameData.regions.set("C", {
		name: "City C",
		travelDuration: 2,
		available: false,
		contract: null,
	});
	GameData.regions.set("D", {
		name: "Linkerburg",
		travelDuration: 0,
		available: true,
		contract: null,
	});

	GameData.contracts.set("A", {
		efficiency: 5,
		danger: 3,
		reward: 5,
		done: false,
		repeatable: false,
	});
	GameData.contracts.set("B", {
		efficiency: 20,
		danger: 5,
		reward: 20,
		done: false,
		repeatable: false,

	});
	GameData.contracts.set("C", {
		efficiency: 30,
		danger: 10,
		reward: 30,
		done: false,
		repeatable: false,

	});

	GameData.troops.set("A", {
		name: "Anae",
		png: "images/MageLady.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});
	GameData.troops.set("B", {
		name: "Ekor",
		png: "images/MageMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});
	GameData.troops.set("C", {
		name: "Krisa",
		png: "images/PalLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	GameData.troops.set("D", {
		name: "Istriac",
		png: "images/PalMan.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	GameData.troops.set("E", {
		name: "Hjop",
		png: "images/RangerLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3
	});
	GameData.troops.set("F", {
		name: "Frivkyl",
		png: "images/RangerMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3
	});

	GameData.resources.set("ap", { class: "res-ap", value: 5 });
	GameData.resources.set("gold", { class: "res-gold", value: 100 });
	GameData.resources.set("food", { class: "res-food", value: 20 });
	GameData.resources.set("supplies", { class: "res-supplies", value: 10 });

	GameData.strategies.set("A", {
		name: "Default", cost: [], modifiers: []
	});
	GameData.strategies.set("B", {
		name: "Passive",
		cost: [
			{ type: "ap", value: 1 },
		],
		modifiers: [
			{ type: "efficiency", value: -1 },
			{ type: "cautiousness", value: +2 }
		]
	});
	GameData.strategies.set("C", {
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
	GameData.strategies.set("D", {
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

	nextConditions()
}

export function nextConditions() {

	const currentStep = GameData.state.get("step");
	if (currentStep == 0) {
		GameData.state.set("winCondition", {
			condition: () => GameData.contracts.get("A").done,
			description: "Complete the mission to Ata",
		});
		GameData.state.set("loseCondition", {
			condition: () => false,
			description: "",
		});

	} else {
		GameData.state.set("win", true);
	}

	GameData.state.set("step", currentStep + 1);
}
