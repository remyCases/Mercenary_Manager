import { getDistance, getItem, SNAP_DISTANCE, dropLogic, allowMissionDrop } from "./js/utils.js";
import { resolveAction, computePartyStat } from "./js/logic.js"
import { GameUI, start, updateUI, resetMission, goldToStr } from "./js/GameUI.js"
import { createTroopCard, createMissionTroopDisplay } from "./js/Troops.js"

document.addEventListener("DOMContentLoaded", () => {
	start(GameUI);
	updateUI(GameUI);

	GameUI.dropableSlots.forEach(slot => {
		slot.addEventListener("drop", (e) => {
			e.preventDefault();
			dropLogic(GameUI, e.clientX, e.clientY);
			updateUI(GameUI);
		});

		slot.addEventListener("dragover", (e) => {
			if (!allowMissionDrop(GameUI, slot)) return;
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
		GameUI.gameStateData.set("week", GameUI.gameStateData.get("week") + 1);

		// handles missions
		GameUI.missionSlots.forEach((slot) => {
			const missionId = slot.getAttribute("data-num");
			const mission = GameUI.gameStateData.get("mission")[missionId];
			const location = GameUI.regionData.get(mission.location);
			if (mission.travelDuration) {
				mission.travelDuration -= 1;
			} else if (mission.travelDuration == 0) {

				mission.prevEfficiency = mission.efficiency;
				mission.efficiency = 0;

				let sumHealth = 0;
				mission.party.forEach((_, troopId) => {
					mission.party.set(troopId, "A");
					const troop = GameUI.troopData.get(troopId);
					if (mission.cautiousness < location.danger && troop.health > 0) {
						troop.health -= 1;
					}
					sumHealth += troop.health;
				});

				const win = mission.prevEfficiency >= location.efficiency;

				if (win || sumHealth == 0) {
					const slotToUnfreeze = getItem(GameUI.missionSlots, missionId);
					const regionToUnfreeze = getItem(GameUI.regions, mission.location);

					slotToUnfreeze.querySelectorAll(".troop-card").forEach((card) => {
						card.classList.remove("frozen");
						GameUI.troopPool.appendChild(card);
					});

					slotToUnfreeze.classList.remove("frozen");
					slotToUnfreeze.classList.remove("occupied");
					regionToUnfreeze.classList.remove("frozen");

					if (win) {
						GameUI.resourceData.get("gold").value += mission.reward;
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
							endMessage += `From the initial <span class="bold">${goldToStr(location.reward)}</span>, you win <span class="bold">${goldToStr(mission.reward)}</span> and lost <span class="bold">${goldToStr(location.reward - mission.reward)}</span> as late fees.`;
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
					GameUI.gameStateData.get("mission")[missionId] = resetMission();
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
				while (slot.firstChild) {
					const child = slot.lastChild;
					const childId = child.getAttribute("data-num");
					if (GameUI.troopData.get(childId).health < GameUI.troopData.get(childId).max_health) {
						GameUI.troopData.get(childId).health += 1;
					}
					child.classList.remove("frozen");
					GameUI.troopPool.appendChild(child);
				}

				slot.classList.remove("frozen");
				slot.classList.remove("occupied");
			}
		});

		// handles resources
		GameUI.resourceData.get("ap").value = 5;
		const res = resolveAction(
			6,
			GameUI.resourceData.get("gold").value,
			GameUI.resourceData.get("food").value,
			0,
		);
		GameUI.resourceData.get("gold").value = res[0];
		GameUI.resourceData.get("food").value = res[1];

		updateUI(GameUI, true);

		// handles game over
		if (GameUI.gameStateData.get("week") >= 100) {

		}
		if (GameUI.resourceData.get("food").value <= 0) {
			GameUI.gameOverDialog.showModal();
		} else if (GameUI.resourceData.get("food").value < 13) {
			GameUI.lowOnFoodDialog.showModal();

		}
	});

	GameUI.resetButton.addEventListener("click", () => {
		// Move all cards back to pool
		GameUI.dropableSlots.forEach(slot => {
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
		GameUI.currentMission = null;

		updateUI(GameUI);
	});

	GameUI.buyFoodButton.addEventListener("click", () => {
		GameUI.resourceData.get("ap").value -= 1;
		GameUI.resourceData.get("gold").value -= 1;
		GameUI.resourceData.get("food").value += 10;
		updateUI(GameUI);
	});

	GameUI.buySuppliesButton.addEventListener("click", () => {
		GameUI.resourceData.get("ap").value -= 1;
		GameUI.resourceData.get("gold").value -= 10;
		GameUI.resourceData.get("supplies").value += 10;
		updateUI(GameUI);
	});

	GameUI.missionButtons.forEach(b => {
		b.addEventListener("click", () => {
			GameUI.currentMission = b.getAttribute("data-num");
			const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
			mission.party = getPartyFromSlot(GameUI.currentMission);

			computePartyStat(GameUI);

			missionDialog.showModal();
		});
	});

	GameUI.restButtons.forEach(b => {
		b.addEventListener("click", () => {
			GameUI.resourceData.get("ap").value -= 1;
			const restId = b.getAttribute("data-num");
			const slot = getItem(GameUI.restSlots, restId);
			slot.classList.add("frozen");
			for (const child of slot.children) {
				child.classList.add("frozen");
			}
			updateUI(GameUI);
		});
	});

	GameUI.sendMission.addEventListener("click", () => {
		const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
		const location = GameUI.regionData.get(GameUI.selectedLocation);

		const travelDuration = location.travelDuration;
		mission.travelDuration = travelDuration;

		const region = getItem(GameUI.regions, GameUI.selectedLocation);
		region.classList.add("frozen");
		mission.location = GameUI.selectedLocation;
		mission.reward = location.reward;

		const slot = getItem(GameUI.missionSlots, GameUI.currentMission);
		slot.classList.add("frozen");
		slot.querySelectorAll(".troop-card").forEach((card) => {
			card.classList.add("frozen");
		});

		GameUI.resourceData.get("ap").value -= 1;

		GameUI.currentMission = null;
		GameUI.selectedLocation = null;
		missionDialog.close();

		updateUI(GameUI);
	});

	GameUI.cancelMission.addEventListener("click", () => {
		GameUI.regions.forEach(slot => slot.classList.remove("selected"));
		GameUI.currentMission = null;
		GameUI.selectedLocation = null;
		missionDialog.close();

		updateUI(GameUI);
	});

	GameUI.regions.forEach(region => {
		region.addEventListener("click", () => {
			GameUI.regions.forEach(r => r.classList.remove("selected"));
			region.classList.add("selected");
			GameUI.selectedLocation = region.getAttribute("data-num");

			updateUI(GameUI);
		});

		region.addEventListener("mouseenter", () => {
			const id = region.getAttribute("data-num");
			const location = GameUI.regionData.get(id);

			GameUI.regionTooltip.textContent = `${location.name}`;
			GameUI.regionTooltip.style.display = "block";
			GameUI.regionTooltip.style.left = region.getAttribute("cx") + "px";
			GameUI.regionTooltip.style.top = region.getAttribute("cy") + "px";
		});

		region.addEventListener("mouseleave", () => {
			GameUI.regionTooltip.style.display = "none";
		});
	});

	GameUI.restartButton.addEventListener("click", () => {
		gameOverDialog.close();
		start(GameUI);
		updateUI(GameUI);
	});

	GameUI.endMissionButton.addEventListener("click", () => {
		endMissionDialog.close();
		updateUI(GameUI);
	});

	GameUI.lowOnFoodButton.addEventListener("click", () => {
		lowOnFoodDialog.close();
		updateUI(GameUI);
	});

	GameUI.giveOrderButtons.forEach((b) => {
		b.addEventListener("click", () => {
			GameUI.currentMission = b.getAttribute("data-num");
			while (GameUI.missionTroopBox.firstChild) {
				GameUI.missionTroopBox.removeChild(GameUI.missionTroopBox.lastChild);
			}

			const party = GameUI.gameStateData.get("mission")[GameUI.currentMission].party

			party.forEach((stratId, troopId) => {
				const card = createTroopCard(GameUI, troopId, false, false);
				const container = createMissionTroopDisplay(GameUI, card, troopId, stratId);

				GameUI.missionTroopBox.appendChild(container);
			});

			GameUI.missionResolveDialog.showModal();

			computePartyStat(GameUI);
			updateUI(GameUI);
		});
	});

	GameUI.cancelMissionResolve.addEventListener("click", () => {
		GameUI.currentMission = null;
		GameUI.missionResolveDialog.close();

		updateUI(GameUI);
	});

	GameUI.resetMissionResolve.addEventListener("click", () => {
		const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
		mission.party.forEach((_, troopId) => {
			mission.party.set(troopId, "A");
		});

		computePartyStat(GameUI);
		updateUI(GameUI);
	});

	GameUI.confirmMissionResolve.addEventListener("click", () => {
		getItem(GameUI.giveOrderButtons, GameUI.currentMission).disabled = true;

		const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission]
		GameUI.resourceData.get("ap").value -= mission.costAp;
		GameUI.resourceData.get("supplies").value -= mission.costSupplies;
		GameUI.currentMission = null;
		GameUI.missionResolveDialog.close();

		updateUI(GameUI);
	});

	GameUI.strategyOptions.forEach((option) => {
		option.addEventListener("click", () => {
			const troopId = GameUI.selectedStrategy.getAttribute("data-num");
			const optionId = option.getAttribute("data-num");
			GameUI.strategyMenu.style.display = "none";

			const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
			mission.party.set(troopId, optionId);

			computePartyStat(GameUI);
			updateUI(GameUI);
		});

		option.addEventListener("mouseenter", (e) => {
			const optionId = option.getAttribute("data-num");
			const strategy = GameUI.strategyData.get(optionId);

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

	document.addEventListener("click", () => {
		GameUI.strategyMenu.style.display = "none";
	});

	document.addEventListener("mouseenter", (e) => {
		const element = e.target;
		const description = element.getAttribute("data-description");

		if (!description) return;

		GameUI.tooltip.textContent = description;
		GameUI.tooltip.style.display = "block";

		const rect = element.getBoundingClientRect();
		GameUI.tooltip.style.left = (rect.left + rect.width / 2 - GameUI.tooltip.offsetWidth / 2) + "px";
		GameUI.tooltip.style.top = (rect.top - GameUI.tooltip.offsetHeight - 5) + "px";
	}, true);

	document.addEventListener("mouseleave", (e) => {
		const element = e.target;
		const description = element.getAttribute("data-description");

		if (description) {
			GameUI.tooltip.style.display = "none";
		}
	}, true);

	function getPartyFromSlot(slotId) {
		const slot = getItem(GameUI.missionSlots, slotId);
		return new Map(Array.from(slot.querySelectorAll(".troop-card"))
			.map((card) => [card.getAttribute("data-num"), "A"]));
	}
});
