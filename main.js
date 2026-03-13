import { getDistance, getItem, SNAP_DISTANCE, dropLogic, allowMissionDrop } from "./js/utils.js";
import { goldToStr } from "./js/UtilsUI.js";
import { resolveAction, computePartyStat } from "./js/Logic.js"
import { GameUI, initUI, updateUI, cleanRestSlot, nextPhaseUI } from "./js/GameUI.js"
import { Story } from "./js/Story.js"
import { GameData, initData, nextPhaseData, resetMission } from "./js/GameData.js"
import { Signals } from "./js/EventEmitter.js";
import { DialogLowOnFood } from "./js/dialogs/DialogLowOnFood.js"
import { DialogGameOver } from "./js/dialogs/DialogGameOver.js"
import { DialogMissionPreparation } from "./js/dialogs/DialogMissionPreparation.js"
import { DialogMissionResolve } from "./js/dialogs/DialogMissionResolve.js"
import "./js/dialogs/DialogConfirm.js"

function start() {
	document.querySelector(".main-container").style.display = "none";
	document.querySelector(".story-container").style.display = "";
	Story.start();
}

function gameStart() {
	initData();
	initUI(GameData);
	updateUI(GameData);
	const currentStep = GameData.state.get("phase").value;
	nextPhase(currentStep);
}

function update() {
	updateUI(GameData);
}

function freezeMissionSlot(id = GameData.currentMission) {
	const slot = getItem(GameUI.missionSlots, id);
	slot.classList.add("frozen");
	slot.querySelectorAll(".troop-card").forEach((card) => {
		card.classList.add("frozen");
	});
}

function unfreezeMissionSlot(id = GameData.currentMission) {
	const slot = getItem(GameUI.missionSlots, id);
	slot.querySelectorAll(".troop-card").forEach((card) => {
		card.classList.remove("frozen");
		GameUI.troopPool.appendChild(card);
	});

	slot.classList.remove("frozen");
	slot.classList.remove("occupied");
}

function disableGiveOrderButton(id = GameData.currentMission) {
	getItem(GameUI.giveOrderButtons, id).disabled = true;
}

function nextPhase(currentStep) {
	nextPhaseData(currentStep);
	nextPhaseUI(currentStep);
	GameData.state.get("phase").value = currentStep + 1;
	GameData.state.get("phase").duration = 0;
}

document.addEventListener("DOMContentLoaded", () => {
	Signals.on("start", start);
	Signals.on("game_start", gameStart);
	Signals.on("update", update);
	Signals.on("freezeMissionSlot", freezeMissionSlot);
	Signals.on("unfreezeMissionSlot", unfreezeMissionSlot);
	Signals.on("disableGiveOrderButton", disableGiveOrderButton);
	start();

	GameUI.droppableSlots.forEach(slot => {
		slot.addEventListener("drop", (e) => {
			e.preventDefault();
			dropLogic(GameData, GameUI, e.clientX, e.clientY);
			updateUI(GameData);
		});

		slot.addEventListener("dragover", (e) => {
			if (!allowMissionDrop(GameData, slot)) return;
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";

			if (GameData.draggedElement) {
				const distance = getDistance(e.clientX, e.clientY, slot);
				if (distance < SNAP_DISTANCE) {
					slot.classList.add("hover");
				} else {
					slot.classList.remove("hover");
				}
			}
		});

		slot.addEventListener("dragleave", () => {
			slot.classList.remove("hover");
		});
	});

	GameUI.newWeekButton.addEventListener("click", () => {
		// reset everything that can be reset
		GameUI.resetButton.click();

		// handles time
		GameData.state.set("week", GameData.state.get("week") + 1);
		GameData.state.get("phase").duration += 1;

		// handles missions
		GameUI.missionSlots.forEach((slot) => {
			const missionId = slot.dataset.num;
			const mission = GameData.state.get("mission")[missionId];
			const location = GameData.regions.get(mission.location);
			const contract = GameData.contracts.get(mission.contract);
			if (mission.travelDuration) {
				mission.travelDuration -= 1;
			} else if (mission.travelDuration == 0) {

				mission.prevEfficiency = mission.efficiency;
				mission.efficiency = 0;

				let sumHealth = 0;
				mission.party.forEach((_, troopId) => {
					mission.party.set(troopId, "A");
					const troop = GameData.troops.get(troopId);
					if (mission.cautiousness < contract.danger && troop.health > 0) {
						troop.health -= 1;
					}
					sumHealth += troop.health;
				});

				const win = mission.prevEfficiency >= contract.efficiency;

				if (win || sumHealth == 0) {

					Signals.emit("unfreezeMissionSlot", missionId);
					Signals.emit("unfreezeRegion", missionId);
					if (win) {
						GameData.resources.get("gold").value += mission.reward;
						contract.done = true;
						if (!contract.repeatable) {
							location.contract = null;
						}
					}

					const clone = GameUI.endMissionDialog.cloneNode(true);
					clone.id = `eventModal-${missionId}`;
					clone.classList.add("mission-resolve-dialog");
					clone.classList.add("small-dialog");

					let endMessage = "";
					if (win) {
						endMessage = "was successful.<br>";
						if (mission.missionDuration == 0 && contract.reward > 0) {
							endMessage += `You win <span class="bold">${mission.reward} golds</span>.`;
						} else if (contract.reward > 0) {
							endMessage += `From the initial <span class="bold">${goldToStr(contract.reward)}</span>, you win <span class="bold">${goldToStr(mission.reward)}</span> and lost <span class="bold">${goldToStr(contract.reward - mission.reward)}</span> as a late penalty fee.`;
						}
					} else {
						endMessage = "failed."
					}
					clone.querySelector(".end-mission-message").innerHTML = `Mission to ${location.name} ${endMessage}`;

					clone.querySelector(".end-mission-button").addEventListener("click", () => {
						clone.remove();
					});

					document.body.appendChild(clone);
					clone.showModal();
					GameData.state.get("mission")[missionId] = resetMission();
				} else {
					mission.missionDuration += 1;
					mission.reward = Math.floor(mission.reward - 0.1 * contract.reward)
					if (mission.reward < 0) {
						mission.reward = 0;
					}
				}
			}
		});

		// handles rest
		GameUI.restSlots.forEach((slot) => {
			if (slot.classList.contains("frozen")) {
				cleanRestSlot(GameData, slot);
			}
		});

		// handles resources
		GameData.resources.get("ap").value = 5;
		const res = resolveAction(
			6,
			GameData.resources.get("gold").value,
			GameData.resources.get("food").value,
			0,
		);
		GameData.resources.get("gold").value = res[0];
		GameData.resources.get("food").value = res[1];

		updateUI(GameData, true);

		if (GameData.state.get("winCondition").condition()) {
			const currentStep = GameData.state.get("phase").value;
			nextPhase(currentStep);
		} else if (GameData.resources.get("food").value <= 0) {
			DialogGameOver.open("You ran out of food");
		} else if (GameData.state.get("loseCondition").condition()) {
			DialogGameOver.open(GameData.state.get("loseCondition").description);
		} else if (GameData.resources.get("food").value < 13) {
			DialogLowOnFood.open();
		}
	});

	GameUI.resetButton.addEventListener("click", () => {
		// Move all cards back to pool
		GameUI.droppableSlots.forEach(slot => {
			if (slot == GameUI.troopPool) {
				return;
			}

			if (!slot.classList.contains("frozen")) {
				slot.querySelectorAll(".troop-card").forEach((card) => {
					card.classList.remove("frozen");
					GameUI.troopPool.appendChild(card);
				});

				slot.classList.remove("occupied");
			}
		});

		DialogMissionPreparation.unselectRegions();
		GameData.currentMission = null;

		updateUI(GameData);
	});

	GameUI.buyFoodButton.addEventListener("click", () => {
		GameData.resources.get("ap").value -= 1;
		GameData.resources.get("gold").value -= 1;
		GameData.resources.get("food").value += 10;
		updateUI(GameData);
	});

	GameUI.buySuppliesButton.addEventListener("click", () => {
		GameData.resources.get("ap").value -= 1;
		GameData.resources.get("gold").value -= 10;
		GameData.resources.get("supplies").value += 10;
		updateUI(GameData);
	});

	GameUI.missionButtons.forEach(b => {
		b.addEventListener("click", () => {
			GameData.currentMission = b.dataset.num;
			const mission = GameData.state.get("mission")[GameData.currentMission];
			mission.party = getPartyFromSlot(GameData.currentMission);

			computePartyStat(GameData);
			DialogMissionPreparation.open();
		});
	});

	GameUI.restButtons.forEach(b => {
		b.addEventListener("click", () => {
			GameData.resources.get("ap").value -= 1;
			const restId = b.dataset.num;
			const slot = getItem(GameUI.restSlots, restId);
			slot.classList.add("frozen");
			for (const child of slot.children) {
				child.classList.add("frozen");
			}
			updateUI(GameData);
		});
	});

	GameUI.endMissionButton.addEventListener("click", () => {
		endMissionDialog.close();
		updateUI(GameData);
	});

	GameUI.giveOrderButtons.forEach((b) => {
		b.addEventListener("click", () => {
			GameData.currentMission = b.dataset.num;
			DialogMissionResolve.open();

			computePartyStat(GameData);
			updateUI(GameData);
		});
	});

	// handles general tooltips
	document.addEventListener("mouseenter", (e) => {
		const element = e.target;
		const description = element.dataset.description;

		if (!description) return;

		GameUI.tooltip.textContent = description;
		GameUI.tooltip.style.display = "block";

		const rect = element.getBoundingClientRect();
		GameUI.tooltip.style.left = (rect.left + rect.width / 2 - GameUI.tooltip.offsetWidth / 2) + "px";
		GameUI.tooltip.style.top = (rect.top - GameUI.tooltip.offsetHeight - 5) + "px";
	}, true);

	document.addEventListener("mouseleave", (e) => {
		const element = e.target;
		const description = element.dataset.description;

		if (description) {
			GameUI.tooltip.style.display = "none";
		}
	}, true);

	function getPartyFromSlot(slotId) {
		const slot = getItem(GameUI.missionSlots, slotId);
		return new Map(Array.from(slot.querySelectorAll(".troop-card"))
			.map((card) => [card.dataset.num, "A"]));
	}

});
