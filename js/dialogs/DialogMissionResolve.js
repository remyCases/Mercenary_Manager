import { Signals } from "../EventEmitter.js";
import { GameData, resetMission } from "../GameData.js"
import { partyToStr, goldToStr } from "../UtilsUI.js";
import { createTroopCard } from "../Troops.js";
import { computePartyStat } from "../Logic.js";

export const DialogMissionResolve = (() => {
	const dialog = document.getElementById("missionResolveDialog");

	// main buttons
	const confirmMissionResolve = dialog.querySelector("#confirmMissionResolve");
	const resetMissionResolve = dialog.querySelector("#resetMissionResolve");
	const cancelMissionResolve = dialog.querySelector("#cancelMissionResolve");
	const giveUpMissionResolve = dialog.querySelector("#giveUpMissionResolve");

	// container
	const missionTroopBox = dialog.querySelector("#missionTroopBox");

	// misc
	const progressBar = dialog.querySelector("#progressBar");
	const progressBarPrev = dialog.querySelector("#progressBarPrev");
	const durationInfo = dialog.querySelector("#durationInfo");

	// strategies
	const strategyMenu = dialog.querySelector("#strategyMenu");
	const strategyOptions = dialog.querySelectorAll(".strategy-option");

	// tooltip of strategies
	const strategyTooltip = dialog.querySelector("#strategyTooltip");

	function init() {
		giveUpMissionResolve.addEventListener("confirmed", () => {
			Signals.emit("unfreezeMissionSlot", GameData.currentMission);
			Signals.emit("unfreezeRegion", GameData.currentMission);
			GameData.state.get("mission")[GameData.currentMission] = resetMission();
			GameData.currentMission = null;
			dialog.close();

			Signals.emit("update");
		});

		cancelMissionResolve.addEventListener("click", () => {
			GameData.currentMission = null;
			dialog.close();

			Signals.emit("update");
		});

		resetMissionResolve.addEventListener("click", () => {
			const mission = GameData.state.get("mission")[GameData.currentMission];
			mission.party.forEach((_, troopId) => {
				mission.party.set(troopId, "A");
			});

			computePartyStat(GameData);
			Signals.emit("update");
		});

		confirmMissionResolve.addEventListener("click", () => {
			Signals.emit("disableGiveOrderButton", GameData.currentMission);

			const mission = GameData.state.get("mission")[GameData.currentMission]
			GameData.resources.get("ap").value -= mission.costAp;
			GameData.resources.get("supplies").value -= mission.costSupplies;
			GameData.currentMission = null;
			dialog.close();

			Signals.emit("update");
		});

		strategyOptions.forEach((option) => {
			option.addEventListener("click", () => {
				const troopId = GameData.selectedStrategy.dataset.num;
				const optionId = option.dataset.num;
				strategyMenu.style.display = "none";

				const mission = GameData.state.get("mission")[GameData.currentMission];
				mission.party.set(troopId, optionId);

				computePartyStat(GameData);
				Signals.emit("update");
			});

			option.addEventListener("mouseenter", (e) => {
				const optionId = option.dataset.num;
				const strategy = GameData.strategies.get(optionId);

				let stringBuilder = "";
				strategy.cost.forEach((c) => {
					stringBuilder += `${c.type}: ${c.value}\n`;
				});

				// Position tooltip on the element
				const modalRect = dialog.getBoundingClientRect();
				const rect = e.target.getBoundingClientRect();
				strategyTooltip.textContent = stringBuilder;
				strategyTooltip.style.display = "block";
				strategyTooltip.style.left = rect.left - modalRect.left - 10 + "px";
				strategyTooltip.style.top = rect.top - modalRect.top - 10 + "px";
			});

			option.addEventListener("mouseleave", () => {
				strategyTooltip.style.display = "none";
			});

		});

		// close strategy menu if clicked outside
		document.addEventListener("click", () => {
			strategyMenu.style.display = "none";
		});
	}


	function open() {
		while (missionTroopBox.firstChild) {
			missionTroopBox.removeChild(missionTroopBox.lastChild);
		}

		const party = GameData.state.get("mission")[GameData.currentMission].party

		party.forEach((strategyId, troopId) => {
			const card = createTroopCard(troopId, false, false);
			const container = createMissionTroopDisplay(card, troopId, strategyId);

			missionTroopBox.appendChild(container);
		});
		dialog.showModal();
	}

	function update() {
		if (dialog.open) {
			const mission = GameData.state.get("mission")[GameData.currentMission];
			const contract = GameData.contracts.get(mission.contract);
			const location = GameData.regions.get(mission.location);

			if (contract) {
				missionTroopBox.querySelectorAll(".stat-info").forEach((box) => {

					const text = box.querySelector(".stat-info-text");
					const ap = box.querySelector(".consumed-ap");
					const supplies = box.querySelector(".consumed-supplies");
					const lostHp = box.querySelector(".lost-hp-display");
					const strategyBox = box.querySelector(".strategy-box");

					const troopId = text.dataset.num;
					const troop = GameData.troops.get(troopId);

					const strategyId = mission.party.get(troopId);
					const strategy = GameData.strategies.get(strategyId);

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

					if ((contract.danger - location.reputation / 10) > mission.cautiousness) {
						lostHp.style.visibility = "visible";
					} else {
						lostHp.style.visibility = "hidden";
					}

					strategyBox.textContent = strategy.name;
				});

				progressBar.style.width = Math.ceil(100 * mission.efficiency / contract.efficiency) + "%";
				progressBarPrev.style.width = Math.ceil(100 * mission.prevEfficiency / contract.efficiency) + "%";
				const latePenaltyFees = contract.reward.gold - mission.reward.gold;
				durationInfo.innerHTML = `${partyToStr(GameData, mission.party)} working on this mission for <span class="bold">${mission.missionDuration} ${mission.missionDuration <= 1 ? "week" : "weeks"}</span> ${latePenaltyFees > 0 ? `<br>resulting in a loss of <span class="bold">${goldToStr(latePenaltyFees)}</span> as a late penalty fee.` : "."}`;

				if (GameData.resources.get("ap").value < mission.costAp ||
					GameData.resources.get("supplies").value < mission.costSupplies) {
					confirmMissionResolve.disabled = true;
				} else {
					confirmMissionResolve.disabled = false;
				}
			}
		}
		strategyOptions.forEach((option) => {
			const optionId = option.dataset.num;
			option.textContent = GameData.strategies.get(optionId).name;
		});
	}

	function createMissionTroopDisplay(card, troopId, strategyId) {
		const strategyBox = document.createElement("div");
		strategyBox.className = "strategy-box";
		strategyBox.textContent = GameData.strategies.get(strategyId).name;
		strategyBox.dataset.num = troopId;
		strategyBox.dataset.description = "";
		strategyBox.addEventListener("click", (e) => {
			e.stopPropagation();
			strategyMenu.style.display = "block";
			GameData.selectedStrategy = strategyBox;
		});

		const stat = document.createElement("p");
		stat.className = "stat-info-text";
		stat.dataset.num = troopId;

		const lostHP = createStatDisplay("lost-hp-display", "-1", "./images/fb681.png", "Will lost 1 health next week");
		const consumedAp = createStatDisplay("consumed-ap", "-1", "images/fb97.png", "Cost 1 AP");
		const consumedSupplies = createStatDisplay("consumed-supplies", "-1", "images/fb671.png", "Cost 1 supply");

		const container = document.createElement("div");
		container.classList.add("stat-info");
		container.classList.add("vbox");
		container.appendChild(card);
		container.appendChild(strategyBox);
		container.appendChild(stat);
		container.appendChild(lostHP);
		container.appendChild(consumedAp);
		container.appendChild(consumedSupplies);

		return container
	}

	return { init, open, update };
})();

DialogMissionResolve.init();


function createStatDisplay(className, text, imgSrc, desc) {
	const div = document.createElement("div");
	div.className = className;

	const p = document.createElement("p");
	p.textContent = text;

	const img = document.createElement("img");
	img.src = imgSrc;
	img.dataset.description = desc;


	div.appendChild(p);
	div.appendChild(img);
	return div;
}
