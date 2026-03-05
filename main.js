import { getDistance, getItem, SNAP_DISTANCE, dropLogic } from "./js/utils.js";
import { resolveAction } from "./js/logic.js"
import { GameUI, start, updateUI, resetMission } from "./js/GameUI.js"
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
			const location = GameUI.regionData.get(mission.location);
			if (mission.travelDuration) {
				mission.travelDuration -= 1;
			} else if (mission.travelDuration == 0) {

				mission.prevEfficiency = mission.efficiency;
				mission.efficiency = 0;

				mission.party.forEach((_, troopId) => {
					mission.party.set(troopId, "A");
				});

				if (mission.cautiousness < location.danger) {
					mission.party.forEach((_, troopId) => {
						GameUI.troopData.get(troopId).health -= 1;
					});
				}

				if (mission.prevEfficiency >= location.efficiency) {
					const slotToUnfreeze = getItem(GameUI.missionSlots, missionId);
					const regionToUnfreeze = getItem(GameUI.regions, mission.location);

					slotToUnfreeze.querySelectorAll(".troop-card").forEach((card) => {
						card.classList.remove("frozen");
						GameUI.troopPool.appendChild(card);
					});

					slotToUnfreeze.classList.remove("frozen");
					slotToUnfreeze.classList.remove("occupied");
					regionToUnfreeze.classList.remove("frozen");

					GameUI.gameStateData.get("mission")[missionId] = resetMission();
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

	GameUI.restartButton.addEventListener("click", () => {
		gameOverDialog.close();
		start(GameUI);
		updateUI(GameUI);
	});

	GameUI.giveOrderButtons.forEach((b) => {
		b.addEventListener("click", () => {
			GameUI.currentMission = b.getAttribute("data-num");
			while (GameUI.missionTroopBox.firstChild) {
				GameUI.missionTroopBox.removeChild(GameUI.missionTroopBox.lastChild);
			}

			const party = GameUI.gameStateData.get("mission")[GameUI.currentMission].party

			party.forEach((startId, troopId) => {
				const card = createTroopCard(GameUI, troopId, false, false);

				const strategyBox = document.createElement("div");
				strategyBox.className = "strategy-box";
				strategyBox.textContent = GameUI.strategyData.get(startId).name;
				strategyBox.setAttribute("data-num", troopId);
				strategyBox.addEventListener("click", (e) => {
					e.stopPropagation();
					GameUI.strategyMenu.style.display = "block";
					GameUI.selectedStrategy = strategyBox;
				});

				const stat = document.createElement("p");
				stat.className = "stat-info-text";
				stat.setAttribute("data-num", troopId);

				const lostHP = document.createElement("div");
				lostHP.className = "lost-hp-display";

				const textLostHP = document.createElement("p");
				textLostHP.textContent = "-1";
				const imgLostHP = document.createElement("img");
				imgLostHP.src = "./images/fb681.png";

				lostHP.appendChild(textLostHP);
				lostHP.appendChild(imgLostHP);

				const container = document.createElement("div");
				container.classList.add("stat-info");
				container.classList.add("vbox");
				container.appendChild(card);
				container.appendChild(strategyBox);
				container.appendChild(stat);
				container.appendChild(lostHP);
				GameUI.missionTroopBox.appendChild(container);

				updateUI(GameUI);
			});

			missionResolveDialog.showModal();

			computePartyStat(GameUI);
			updateUI(GameUI);
		});
	});

	GameUI.cancelMissionResolve.addEventListener("click", () => {
		GameUI.currentMission = null;
		GameUI.missionResolveDialog.close();
	});

	GameUI.confirmMissionResolve.addEventListener("click", () => {
		getItem(GameUI.giveOrderButtons, GameUI.currentMission).disabled = true;
		GameUI.currentMission = null;
		GameUI.missionResolveDialog.close();
	});

	GameUI.strategyOptions.forEach((option) => {
		option.addEventListener("click", () => {
			const troopId = GameUI.selectedStrategy.getAttribute("data-num");
			const optionId = option.getAttribute("data-num");
			GameUI.selectedStrategy.textContent = GameUI.strategyData.get(optionId).name;
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

	function computePartyStat(GameUI) {
		const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
		let partyEfficiency = mission.prevEfficiency;
		let partyCautiousness = 0;

		mission.party.forEach((stratId, troopId) => {
			const troop = GameUI.troopData.get(troopId);
			const strategy = GameUI.strategyData.get(stratId);

			const modEfficiency = strategy.modifiers.find((e) => e.type === "efficiency");
			const totalEfficiency = troop.efficiency + (modEfficiency ? modEfficiency.value : 0);

			const modCautiousness = strategy.modifiers.find((e) => e.type === "cautiousness");
			const totalCautiousness = troop.cautiousness + (modCautiousness ? modCautiousness.value : 0);

			partyEfficiency += totalEfficiency;
			partyCautiousness += totalCautiousness;
		});
		mission.efficiency = partyEfficiency;
		mission.cautiousness = partyCautiousness;
	}

	function getPartyFromSlot(slotId) {
		const slot = getItem(GameUI.missionSlots, slotId);
		return new Map(Array.from(slot.querySelectorAll(".troop-card"))
			.map((card) => [card.getAttribute("data-num"), "A"]));
	}
});
