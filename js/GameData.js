import { Signals } from "./EventEmitter.js";
import { DialogGoal } from "./dialogs/DialogGoal.js"
import { DialogWin } from "./dialogs/DialogWin.js"

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
	GameData.state.set("phase", { value: 0, duration: 0 });
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
		efficiency: 3,
		danger: 0,
		reward: 5,
		done: false,
		repeatable: false,
	});
	GameData.contracts.set("B", {
		efficiency: 8,
		danger: 50,
		reward: 0,
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

	GameData.troops.set("F", {
		name: "Anae",
		png: "images/MageLady.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3,
		available: false,
	});
	GameData.troops.set("B", {
		name: "Ekor",
		png: "images/MageMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3,
		available: false,

	});
	GameData.troops.set("C", {
		name: "Krisa",
		png: "images/PalLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3,
		available: false,

	});
	GameData.troops.set("D", {
		name: "Istriac",
		png: "images/PalMan.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3,
		available: false,

	});
	GameData.troops.set("E", {
		name: "Hjop",
		png: "images/RangerLady.png",
		health: 0,
		max_health: 3,
		efficiency: 2,
		cautiousness: 3,
		available: false,

	});
	GameData.troops.set("A", {
		name: "Frivkyl",
		png: "images/RangerMan.png",
		health: 0,
		max_health: 2,
		efficiency: 3,
		cautiousness: 3,
		available: true,

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
}

const PHASE_DATA = {
	0: {
		"win": {
			condition: () => GameData.contracts.get("A").done,
			description: "Complete the mission to Ata",
		},
		"lose": {
			condition: () => false,
			description: "",
		},
		"regions": {
			"A": "A",
		}
	},
	1: {
		"win": {
			condition: () => GameData.troops.get("A").max_health == GameData.troops.get("A").health,
			description: "Rest until Frivkyl regain all his health",
		},
		"lose": {
			condition: () => false,
			description: "",
		},
	},
	2: {
		"win": {
			condition: () => GameData.contracts.get("B").done,
			description: "Save Krisa in Ata in less than 3 weeks",
		},
		"lose": {
			condition: () => GameData.state.get("phase").duration > 4,
			description: "You fail to save Ata in time",
		},
		"regions": {
			"A": "B",
		}

	}
};

export function nextPhaseData(currentStep) {

	const config = PHASE_DATA[currentStep];
	if (config) {
		GameData.state.set("winCondition", config.win);
		GameData.state.set("loseCondition", config.lose);

		if (config.regions) {
			Object.entries(config.regions).forEach(([region, contract]) => {
				GameData.regions.get(region).contract = contract;
			});
		}
	}
	else {
		GameData.state.set("winCondition", {
			condition: () => false,
			description: "Enjoy playing",
		});
		GameData.state.set("loseCondition", {
			condition: () => false,
			description: "",
		});

		GameData.state.set("win", true);
	}

	Signals.emit("update");

	if (!GameData.state.get("win")) {
		DialogGoal.open();
	}
	else {
		DialogWin.open();
	}
}
