import { getDistance, getItem, SNAP_DISTANCE, dropLogic, allowMissionDrop } from "./js/utils.js";
import { resolveAction, computePartyStat } from "./js/Logic.js"
import { GameUI, start, updateUI, goldToStr, cleanMissionSlot, cleanRestSlot } from "./js/GameUI.js"
import { createTroopCard, createMissionTroopDisplay } from "./js/Troops.js"
import { Story } from "./js/Story.js"
import { GameData, initData, resetMission } from "./js/GameData.js"
import { Signals } from "./js/EventEmitter.js";
import { DialogLowOnFood } from "./js/dialogs/DialogLowOnFood.js"
import { DialogGameOver } from "./js/dialogs/DialogGameOver.js"

function startGame() {
	document.querySelector(".main-container").style.display = "none";
	document.querySelector(".story-container").style.display = "";
	initData(GameData);
	start(GameData, GameUI);
	updateUI(GameData, GameUI);
	Story.start();
}

document.addEventListener("DOMContentLoaded", () => {
	Signals.on("start_game", startGame);
	startGame();


	GameUI.droppableSlots.forEach(slot => {
		slot.addEventListener("drop", (e) => {
			e.preventDefault();
			dropLogic(GameUI, e.clientX, e.clientY);
			updateUI(GameData, GameUI);
		});

		slot.addEventListener("dragover", (e) => {
			if (!allowMissionDrop(GameData, GameUI, slot)) return;
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";

			if (GameUI.draggedElement) {
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

		// handles missions
		GameUI.missionSlots.forEach((slot) => {
			const missionId = slot.dataset.num;
			const mission = GameData.state.get("mission")[missionId];
			const location = GameData.region.get(mission.location);
			if (mission.travelDuration) {
				mission.travelDuration -= 1;
			} else if (mission.travelDuration == 0) {

				mission.prevEfficiency = mission.efficiency;
				mission.efficiency = 0;

				let sumHealth = 0;
				mission.party.forEach((_, troopId) => {
					mission.party.set(troopId, "A");
					const troop = GameData.troops.get(troopId);
					if (mission.cautiousness < location.danger && troop.health > 0) {
						troop.health -= 1;
					}
					sumHealth += troop.health;
				});

				const win = mission.prevEfficiency >= location.efficiency;

				if (win || sumHealth == 0) {
					cleanMissionSlot(GameUI, slot, mission);

					if (win) {
						GameData.resource.get("gold").value += mission.reward;
					}

					const clone = GameUI.endMissionDialog.cloneNode(true);
					clone.id = `eventModal-${missionId}`;
					clone.classList.add("mission-resolve-dialog");
					clone.classList.add("small-dialog");

					let endMessage = "";
					if (win) {
						endMessage = "was successful.<br>";
						if (mission.missionDuration == 0) {
							endMessage += `You win <span class="bold">${mission.reward} golds</span>.`;
						} else {
							endMessage += `From the initial <span class="bold">${goldToStr(location.reward)}</span>, you win <span class="bold">${goldToStr(mission.reward)}</span> and lost <span class="bold">${goldToStr(location.reward - mission.reward)}</span> as a late penalty fee.`;
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
					mission.reward = Math.floor(mission.reward - 0.1 * location.reward)
					if (mission.reward < 0) {
						mission.reward = 0;
					}
				}
			}
		});

		// handles rest
		GameUI.restSlots.forEach((slot) => {
			if (slot.classList.contains("frozen")) {
				cleanRestSlot(GameData, GameUI, slot);
			}
		});

		// handles resources
		GameData.resource.get("ap").value = 5;
		const res = resolveAction(
			6,
			GameData.resource.get("gold").value,
			GameData.resource.get("food").value,
			0,
		);
		GameData.resource.get("gold").value = res[0];
		GameData.resource.get("food").value = res[1];

		updateUI(GameData, GameUI, true);

		// handles game over
		if (GameData.state.get("week") >= 100) {

		}
		if (GameData.resource.get("food").value <= 0) {
			DialogGameOver.open();
		} else if (GameData.resource.get("food").value < 13) {
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

		GameUI.regions.forEach(region => region.classList.remove("selected"));
		GameData.currentMission = null;

		updateUI(GameData, GameUI);
	});

	GameUI.buyFoodButton.addEventListener("click", () => {
		GameData.resource.get("ap").value -= 1;
		GameData.resource.get("gold").value -= 1;
		GameData.resource.get("food").value += 10;
		updateUI(GameData, GameUI);
	});

	GameUI.buySuppliesButton.addEventListener("click", () => {
		GameData.resource.get("ap").value -= 1;
		GameData.resource.get("gold").value -= 10;
		GameData.resource.get("supplies").value += 10;
		updateUI(GameData, GameUI);
	});

	GameUI.missionButtons.forEach(b => {
		b.addEventListener("click", () => {
			GameData.currentMission = b.dataset.num;
			const mission = GameData.state.get("mission")[GameData.currentMission];
			mission.party = getPartyFromSlot(GameData.currentMission);

			computePartyStat(GameData);

			missionDialog.showModal();
		});
	});

	GameUI.restButtons.forEach(b => {
		b.addEventListener("click", () => {
			GameData.resource.get("ap").value -= 1;
			const restId = b.dataset.num;
			const slot = getItem(GameUI.restSlots, restId);
			slot.classList.add("frozen");
			for (const child of slot.children) {
				child.classList.add("frozen");
			}
			updateUI(GameData, GameUI);
		});
	});

	GameUI.sendMission.addEventListener("click", () => {
		const mission = GameData.state.get("mission")[GameData.currentMission];
		const location = GameData.region.get(GameData.selectedLocation);

		const travelDuration = location.travelDuration;
		mission.travelDuration = travelDuration;

		const region = getItem(GameUI.regions, GameData.selectedLocation);
		region.classList.add("frozen");
		mission.location = GameData.selectedLocation;
		mission.reward = location.reward;

		const slot = getItem(GameUI.missionSlots, GameData.currentMission);
		slot.classList.add("frozen");
		slot.querySelectorAll(".troop-card").forEach((card) => {
			card.classList.add("frozen");
		});

		GameData.resource.get("ap").value -= 1;

		GameData.currentMission = null;
		GameData.selectedLocation = null;
		missionDialog.close();

		updateUI(GameData, GameUI);
	});

	GameUI.cancelMission.addEventListener("click", () => {
		GameUI.regions.forEach(slot => slot.classList.remove("selected"));
		GameData.currentMission = null;
		GameData.selectedLocation = null;
		missionDialog.close();

		updateUI(GameData, GameUI);
	});

	GameUI.regions.forEach(region => {
		region.addEventListener("click", () => {
			GameUI.regions.forEach(r => r.classList.remove("selected"));
			region.classList.add("selected");
			GameData.selectedLocation = region.dataset.num;

			updateUI(GameData, GameUI);
		});

		region.addEventListener("mouseenter", () => {
			const id = region.dataset.num;
			const location = GameData.region.get(id);

			GameUI.regionTooltip.textContent = `${location.name}`;
			GameUI.regionTooltip.style.display = "block";
			GameUI.regionTooltip.style.left = region.getAttribute("cx") + "px";
			GameUI.regionTooltip.style.top = region.getAttribute("cy") + "px";
		});

		region.addEventListener("mouseleave", () => {
			GameUI.regionTooltip.style.display = "none";
		});
	});



	GameUI.endMissionButton.addEventListener("click", () => {
		endMissionDialog.close();
		updateUI(GameData, GameUI);
	});

	GameUI.giveOrderButtons.forEach((b) => {
		b.addEventListener("click", () => {
			GameData.currentMission = b.dataset.num;
			while (GameUI.missionTroopBox.firstChild) {
				GameUI.missionTroopBox.removeChild(GameUI.missionTroopBox.lastChild);
			}

			const party = GameData.state.get("mission")[GameData.currentMission].party

			party.forEach((strategyId, troopId) => {
				const card = createTroopCard(GameData, GameUI, troopId, false, false);
				const container = createMissionTroopDisplay(GameData, GameUI, card, troopId, strategyId);

				GameUI.missionTroopBox.appendChild(container);
			});

			GameUI.missionResolveDialog.showModal();

			computePartyStat(GameData);
			updateUI(GameData, GameUI);
		});
	});

	GameUI.giveUpMissionResolve.addEventListener("confirmed", () => {
		cleanMissionSlot(GameUI, getItem(GameUI.missionSlots, GameData.currentMission), GameData.state.get("mission")[GameData.currentMission]);
		GameData.state.get("mission")[GameData.currentMission] = resetMission();
		GameData.currentMission = null;
		GameUI.missionResolveDialog.close();

		updateUI(GameData, GameUI);
	});


	GameUI.cancelMissionResolve.addEventListener("click", () => {
		GameData.currentMission = null;
		GameUI.missionResolveDialog.close();

		updateUI(GameData, GameUI);
	});

	GameUI.resetMissionResolve.addEventListener("click", () => {
		const mission = GameData.state.get("mission")[GameData.currentMission];
		mission.party.forEach((_, troopId) => {
			mission.party.set(troopId, "A");
		});

		computePartyStat(GameData);
		updateUI(GameData, GameUI);
	});

	GameUI.confirmMissionResolve.addEventListener("click", () => {
		getItem(GameUI.giveOrderButtons, GameData.currentMission).disabled = true;

		const mission = GameData.state.get("mission")[GameData.currentMission]
		GameData.resource.get("ap").value -= mission.costAp;
		GameData.resource.get("supplies").value -= mission.costSupplies;
		GameData.currentMission = null;
		GameUI.missionResolveDialog.close();

		updateUI(GameData, GameUI);
	});

	GameUI.strategyOptions.forEach((option) => {
		option.addEventListener("click", () => {
			const troopId = GameUI.selectedStrategy.dataset.num;
			const optionId = option.dataset.num;
			GameUI.strategyMenu.style.display = "none";

			const mission = GameData.state.get("mission")[GameData.currentMission];
			mission.party.set(troopId, optionId);

			computePartyStat(GameData);
			updateUI(GameData, GameUI);
		});

		option.addEventListener("mouseenter", (e) => {
			const optionId = option.dataset.num;
			const strategy = GameData.strategy.get(optionId);

			let stringBuilder = "";
			strategy.cost.forEach((c) => {
				stringBuilder += `${c.type}: ${c.value}\n`;
			});

			// Position tooltip on the element
			const modalRect = GameUI.missionResolveDialog.getBoundingClientRect();
			const rect = e.target.getBoundingClientRect();
			GameUI.strategyTooltip.textContent = stringBuilder;
			GameUI.strategyTooltip.style.display = "block";
			GameUI.strategyTooltip.style.left = rect.left - modalRect.left - 10 + "px";
			GameUI.strategyTooltip.style.top = rect.top - modalRect.top - 10 + "px";
		});

		option.addEventListener("mouseleave", () => {
			GameUI.strategyTooltip.style.display = "none";
		});

	});

	// close strategy menu if clicked outside
	document.addEventListener("click", () => {
		GameUI.strategyMenu.style.display = "none";
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

	document.addEventListener("click", (e) => {
		const button = e.target.closest("button.danger");
		if (!button) return;

		e.preventDefault();
		e.stopPropagation();

		GameUI.pendingAction = button;

		const message = button.dataset.confirmMessage ||
			`Are you sure you want to ${button.textContent.toLowerCase()} ?`;
		GameUI.confirmMessage.textContent = message;
		GameUI.confirmDialog.showModal();
	});

	GameUI.confirmButton.addEventListener("click", () => {
		if (GameUI.pendingAction) {
			GameUI.pendingAction.dispatchEvent(new Event("confirmed"));
			GameUI.pendingAction.click();
		}
		GameUI.confirmDialog.close();
		GameUI.pendingAction = null;
	});

	GameUI.cancelButton.addEventListener("click", () => {
		GameUI.confirmDialog.close();
		GameUI.pendingAction = null;
	});

	GameUI.confirmDialog.addEventListener("close", () => {
		GameUI.pendingAction = null;
	});

});
