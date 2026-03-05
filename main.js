import { getDistance, getItem, SNAP_DISTANCE, dropLogic } from "./js/utils.js";
import { resolveAction } from "./js/logic.js"
import { GameUI, start, updateUI } from "./js/GameUI.js"
import { createTroopCard } from "./js/Troops.js"

document.addEventListener("DOMContentLoaded", () => {
	start(GameUI);
	updateUI(GameUI);

	GameUI.dropableSlots.forEach(slot => {
		slot.addEventListener("drop", (e) => {
			e.preventDefault()
			dropLogic(GameUI, e.clientX, e.clientY);
			updateUI(GameUI);
		});

		slot.addEventListener("dragover", (e) => {
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
			if (mission.travelDuration) {
				mission.travelDuration -= 1;
			} else if (mission.travelDuration == 0) {

				const textOverlay = slot.querySelector(".frozen-overlay-text");
				if (textOverlay) {
					slot.removeChild(textOverlay);

					const buttonOverlay = document.createElement("button");
					buttonOverlay.className = "overlay-button";
					buttonOverlay.textContent = "Give orders";
					slot.appendChild(buttonOverlay);
					buttonOverlay.addEventListener("click", () => {
						missionResolveDialog.showModal();
						createMissionDialog(mission);
						updateUI(GameUI);
					});
				}

				//const slotToUnfreeze = getItem(dropableSlots, missionId);
				//const regionToUnfreeze = getItem(regions, gameStateData.get("mission")[missionId].location);

				//while (slotToUnfreeze.firstChild) {
				//	const child = slotToUnfreeze.lastChild;
				//	const childId = child.getAttribute("data-num");
				//	troopData.get(childId).health -= 1;
				//	child.classList.remove("frozen");
				//	troopPool.appendChild(child);
				//}

				//slotToUnfreeze.classList.remove("frozen");
				//slotToUnfreeze.classList.remove("occupied");
				//regionToUnfreeze.classList.remove("frozen");

				//gameStateData.get("mission")[missionId] = { travelDuration: null, location: null, doneEfficiency: 0, };
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
			"",
			6,
			GameUI.resourceData.get("gold").value,
			GameUI.resourceData.get("food").value,
			0,
			GameUI.resourceData.get("supplies").value
		);
		GameUI.resourceData.get("gold").value = res[1];
		GameUI.resourceData.get("food").value = res[2];
		GameUI.resourceData.get("supplies").value = res[4];

		updateUI(GameUI);

		// handles game over
		if (GameUI.resourceData.get("food").value <= 0) {
			GameUI.gameOverDialog.showModal();
		}
	});

	GameUI.resetButton.addEventListener("click", () => {
		// Move all cards back to pool
		GameUI.dropableSlots.forEach(slot => {
			if (slot == GameUI.troopPool) {
				return;
			}

			if (!slot.classList.contains("frozen")) {
				while (slot.firstChild) {
					slot.lastChild.classList.remove("frozen");
					GameUI.troopPool.appendChild(slot.lastChild);
				}
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
			missionDialog.showModal();
			GameUI.currentMission = b.getAttribute("data-num");
			const missionSlot = getItem(GameUI.missionSlots, GameUI.currentMission);
			GameUI.currentParty = Array.from(missionSlot.querySelectorAll(".troop-card"))
				.map((card) => card.getAttribute("data-num"));
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
		missionDialog.close();
		const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
		mission.party = GameUI.currentParty;

		const travelDuration = GameUI.regionData.get(GameUI.selectedLocation).travelDuration;
		mission.travelDuration = travelDuration;

		const region = getItem(GameUI.regions, GameUI.selectedLocation);
		region.classList.add("frozen");
		mission.location = GameUI.selectedLocation;

		const slot = getItem(GameUI.missionSlots, GameUI.currentMission);
		slot.classList.add("frozen");
		for (const child of slot.children) {
			child.classList.add("frozen");
		}
		const overlay = document.createElement("div");
		overlay.className = "frozen-overlay-text";
		slot.appendChild(overlay);

		GameUI.resourceData.get("ap").value -= 1;

		updateUI(GameUI);
	});

	GameUI.cancelMission.addEventListener("click", () => {
		suppliesAmount.value = 0;
		GameUI.regions.forEach(slot => slot.classList.remove("selected"));
		sendMission.disabled = true;
		GameUI.currentMission = null;
		missionDialog.close();

		updateUI(GameUI);
	});

	GameUI.regions.forEach(region => {
		region.addEventListener("click", () => {
			GameUI.regions.forEach(r => r.classList.remove("selected"));
			region.classList.add("selected");
			GameUI.selectedLocation = region.getAttribute("data-num");
			const location = GameUI.regionData.get(GameUI.selectedLocation);

			const partyNames = GameUI.currentParty.map((id) => GameUI.troopData.get(id).name);
			const partyEfficiency = GameUI.currentParty.reduce((acc, id) => acc + GameUI.troopData.get(id).efficiency, 0);
			const estimatedWeeksWork = Math.ceil(location.efficiency / partyEfficiency);
			GameUI.missionDescription.innerHTML = `${partyNames} are going to <span class="city-name">${location.name}</span>, they are expected to reach destination in <span class="weeks-info">${location.travelDuration} weeks</span>.<br>They will need <span class="weeks-info">${estimatedWeeksWork} weeks</span> to finish this contract`;

			sendMission.disabled = false;
		});

		region.addEventListener("mouseenter", () => {
			const id = region.getAttribute("data-num");
			const location = GameUI.regionData.get(id);
			GameUI.regionTooltiptext.textContent = `${location.name}`;

			// Position tooltip at circle center
			GameUI.regionTooltip.style.display = "block";
			GameUI.regionTooltip.style.left = region.getAttribute("cx") + "px";
			GameUI.regionTooltip.style.top = region.getAttribute("cy") + "px";
		});

		region.addEventListener("mouseleave", () => {
			GameUI.regionTooltip.style.display = "none";
		});
	});

	GameUI.cancelMissionResolve.addEventListener("click", () => {
		GameUI.missionResolveDialog.close();
	});

	GameUI.suppliesUp.addEventListener("click", (e) => {
		if (e.ctrlKey) {
			suppliesAmount.value = Number(suppliesAmount.value) + 100;
		} else if (e.shiftKey) {
			suppliesAmount.value = Number(suppliesAmount.value) + 10;

		} else {
			suppliesAmount.value = Number(suppliesAmount.value) + 1;
		}
	});

	GameUI.suppliesDown.addEventListener("click", (e) => {
		if (e.ctrlKey) {
			suppliesAmount.value = Math.max(Number(suppliesAmount.value) - 100, 0);
		} else if (e.shiftKey) {
			suppliesAmount.value = Math.max(Number(suppliesAmount.value) - 10, 0);

		} else {
			suppliesAmount.value = Math.max(Number(suppliesAmount.value) - 1, 0);
		}
	});

	GameUI.restartButton.addEventListener("click", () => {
		gameOverDialog.close();
		start(GameUI);
		updateUI(GameUI);
	});

	GameUI.strategyOptions.forEach((option) => {
		option.addEventListener("click", () => {
			const optionId = option.getAttribute("data-num");
			GameUI.selectedStrategy.textContent = GameUI.strategyData.get(optionId).name;
			GameUI.selectedStrategy.setAttribute("data-num", optionId);
			GameUI.strategyMenu.style.display = "none";

			updateUI(GameUI);
		});

		option.addEventListener("mouseenter", (e) => {
			const optionId = option.getAttribute("data-num");
			const strategy = GameUI.strategyData.get(optionId);

			let stringBuilder = "";
			strategy.cost.forEach((c) => {
				stringBuilder += `${c.type}: ${c.value}\n`;
			});
			GameUI.strategyTooltiptext.textContent = stringBuilder;

			// Position tooltip on the element
			const modalRect = GameUI.missionResolveDialog.getBoundingClientRect();
			const rect = e.target.getBoundingClientRect();
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

	function createMissionDialog(mission) {
		while (GameUI.missionTroopBox.firstChild) {
			GameUI.missionTroopBox.removeChild(GameUI.missionTroopBox.lastChild);
		}
		mission.party.forEach((troopId) => {
			const card = createTroopCard(GameUI, troopId, false);

			const strategyBox = document.createElement("div");
			strategyBox.className = "strategy-box";
			strategyBox.textContent = GameUI.strategyData.get("A").name;
			strategyBox.setAttribute("data-num", "A");
			strategyBox.addEventListener("click", (e) => {
				e.stopPropagation();
				GameUI.strategyMenu.style.display = GameUI.strategyMenu.style.display === "none" ? "block" : "none";
				GameUI.selectedStrategy = strategyBox;
			});

			const stat = document.createElement("p");
			stat.className = "stat-info-text";

			const container = document.createElement("div");
			container.classList.add("stat-info");
			container.classList.add("vbox");
			container.appendChild(card);
			container.appendChild(strategyBox);
			container.appendChild(stat);
			GameUI.missionTroopBox.appendChild(container);

			updateUI(GameUI);
		});
	}
});
