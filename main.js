import { findClosestSlot, isWithinSnapDistance, getDistance, getItem, SNAP_DISTANCE } from "./js/utils.js";
import { resolveAction } from "./js/logic.js"

document.addEventListener("DOMContentLoaded", () => {

	// persistent data storage
	let gameStateData = new Map();
	let regionData = new Map();
	let troopData = new Map();
	let resourceData = new Map();

	// globals
	let draggedElement = null;
	let originalParent = null;
	let currentMission = null;
	let selectedLocation = null;

	// elements on main screen
	const troopCards = document.querySelectorAll(".troop-card");
	const missionSlots = document.querySelectorAll(".mission-slot");
	const restSlots = document.querySelectorAll(".rest-slot");
	const troopPool = document.getElementById("troopPool");
	const dropableSlots = document.querySelectorAll(".slot, .troop-pool");

	// buttons
	const resetButton = document.getElementById("resetSlots");
	const newWeekButton = document.getElementById("newWeekButton");
	const missionButtons = document.querySelectorAll(".mission-button");
	const restButtons = document.querySelectorAll(".rest-button");
	const stateDisplay = document.getElementById("state");

	// main buttons of missions
	const missionDialog = document.getElementById("missionDialog");
	const sendMission = document.getElementById("sendMission");
	const cancelMission = document.getElementById("cancelMission");
	const regions = document.querySelectorAll(".region");

	// tooltip of missions
	const tooltip = document.getElementById("tooltip");
	const tooltiptext = document.getElementById("tooltiptext");

	// description of missions
	const missionDescription = document.getElementById("missionDescription");

	// supplies for missions
	const suppliesAmount = document.getElementById("suppliesAmount");
	const suppliesUp = document.getElementById("suppliesUp");
	const suppliesDown = document.getElementById("suppliesDown");

	// gameover modal
	const gameOverDialog = document.getElementById("gameOverDialog");
	const restartButton = document.getElementById("restart");

	// buyer buttons
	const buyFoodButton = document.getElementById("buyFood");
	const buySuppliesButton = document.getElementById("buySupplies");

	start();
	updateUI();

	troopCards.forEach(card => {
		card.addEventListener("dragstart", (e) => {
			draggedElement = card;
			originalParent = card.parentElement;

			card.classList.add("dragging");
			e.dataTransfer.effectAllowed = "move";
		});

		card.addEventListener("dragend", () => {
			card.classList.remove("dragging");
		});

		card.addEventListener("touchstart", (e) => {
			draggedElement = card;
			originalParent = card.parentElement;

			card.classList.add("dragging");
			e.dataTransfer.effectAllowed = "move";
		}, { passive: false });

		card.addEventListener("touchend", (e) => {
			if (!draggedElement) return;

			const touchEndX = e.changedTouches[0].clientX;
			const touchEndY = e.changedTouches[0].clientY;

			draggedElement.classList.remove("dragging");

			const closestSlot = findClosestSlot(touchEndX, touchEndY, dropableSlots);
			if (closestSlot && isWithinSnapDistance(touchEndX, touchEndY, closestSlot)) {

				const existingCards = closestSlot.querySelectorAll(".troop-card");

				if (Array.from(existingCards).find(node => node.isEqualNode(draggedElement))) {
					return;
				}
				if (existingCards.length >= 4) {
					troopPool.appendChild(existingCards[0]);
				}

				const oldParent = draggedElement.parentElement;
				closestSlot.appendChild(draggedElement);
				closestSlot.classList.add("occupied");

				if (oldParent && oldParent.querySelectorAll(".troop-card").length === 0) {
					oldParent.classList.remove("occupied");
				}
			} else {
				if (originalParent && originalParent !== draggedElement.parentElement) {
					originalParent.appendChild(draggedElement);
				}
			}

			dropableSlots.forEach(s => s.classList.remove("hover"));
			draggedElement = null;
			updateUI();
		}, { passive: false });

		card.addEventListener("touchmove", (e) => {
			if (!draggedElement) return;
			e.preventDefault();

			const touchX = e.touches[0].clientX;
			const touchY = e.touches[0].clientY;

			dropableSlots.forEach(slot => {
				const distance = getDistance(touchX, touchY, slot);
				if (distance < SNAP_DISTANCE) {
					slot.classList.add("hover");
				} else {
					slot.classList.remove("hover");
				}
			});
		}, { passive: false });
	});

	dropableSlots.forEach(slot => {
		slot.addEventListener("drop", (e) => {
			e.preventDefault()
			if (!draggedElement) return;

			draggedElement.classList.remove("dragging");

			const closestSlot = findClosestSlot(e.clientX, e.clientY, dropableSlots);
			if (closestSlot && isWithinSnapDistance(e.clientX, e.clientY, closestSlot)) {

				const existingCards = closestSlot.querySelectorAll(".troop-card");

				if (Array.from(existingCards).find(node => node.isEqualNode(draggedElement))) {
					return;
				}
				if (existingCards.length >= 4) {
					troopPool.appendChild(existingCards[0]);
				}
				const oldParent = draggedElement.parentElement;
				closestSlot.appendChild(draggedElement);
				closestSlot.classList.add("occupied");

				if (oldParent && oldParent.querySelectorAll(".troop-card").length === 0) {
					oldParent.classList.remove("occupied");
				}
			} else {
				// Return to original parent
				if (originalParent && originalParent !== draggedElement.parentElement) {
					originalParent.appendChild(draggedElement);
				}
			}

			// Clear hover state on all dropableSlots
			dropableSlots.forEach(s => s.classList.remove("hover"));
			draggedElement = null;
			updateUI();
		});

		slot.addEventListener("dragover", (e) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";

			if (draggedElement) {
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

	newWeekButton.addEventListener("click", () => {
		// reset everything that can be reset
		resetButton.click();

		// handles time
		gameStateData.set("week", gameStateData.get("week") + 1);

		// handles missions
		missionSlots.forEach((slot) => {
			const missionId = slot.getAttribute("data-num");
			if (gameStateData.get("mission")[missionId].duration) {
				gameStateData.get("mission")[missionId].duration -= 1;
			} else if (gameStateData.get("mission")[missionId].duration == 0) {
				const slotToUnfreeze = getItem(dropableSlots, missionId);
				const regionToUnfreeze = getItem(regions, gameStateData.get("mission")[missionId].location);

				while (slotToUnfreeze.firstChild) {
					const child = slotToUnfreeze.lastChild;
					const childId = child.getAttribute("data-num");
					troopData.get(childId).health -= 1;
					child.classList.remove("frozen");
					troopPool.appendChild(child);
				}

				slotToUnfreeze.classList.remove("frozen");
				slotToUnfreeze.classList.remove("occupied");
				regionToUnfreeze.classList.remove("frozen");

				gameStateData.get("mission")[missionId].duration = null;
				gameStateData.get("mission")[missionId].location = null;
			}
		});

		// handles rest
		restSlots.forEach((slot) => {
			if (slot.classList.contains("frozen")) {
				while (slot.firstChild) {
					const child = slot.lastChild;
					const childId = child.getAttribute("data-num");
					if (troopData.get(childId).health < troopData.get(childId).max_health) {
						troopData.get(childId).health += 1;
					}
					child.classList.remove("frozen");
					troopPool.appendChild(child);
				}

				slot.classList.remove("frozen");
				slot.classList.remove("occupied");
			}
		});

		// handles resources
		resourceData.get("ap").value = 5;
		const res = resolveAction("", 6, resourceData.get("gold").value, resourceData.get("food").value, 0, resourceData.get("supplies").value);
		resourceData.get("gold").value = res[1];
		resourceData.get("food").value = res[2];
		resourceData.get("supplies").value = res[4];

		updateUI();

		// handles game over
		if (resourceData.get("food").value <= 0) {
			gameOverDialog.showModal();
		}
	});

	resetButton.addEventListener("click", () => {
		// Move all cards back to pool
		dropableSlots.forEach(slot => {
			if (slot == troopPool) {
				return;
			}

			if (!slot.classList.contains("frozen")) {
				while (slot.firstChild) {
					slot.lastChild.classList.remove("frozen");
					troopPool.appendChild(slot.lastChild);
				}
				slot.classList.remove("occupied");
			}
		});

		regions.forEach(region => region.classList.remove("selected"));
		currentMission = null;

		updateUI();
	});

	buyFoodButton.addEventListener("click", () => {
		resourceData.get("ap").value -= 1;
		resourceData.get("gold").value -= 1;
		resourceData.get("food").value += 10;
		updateUI();
	});

	buySuppliesButton.addEventListener("click", () => {
		resourceData.get("ap").value -= 1;
		resourceData.get("gold").value -= 10;
		resourceData.get("supplies").value += 10;
		updateUI();
	});

	missionButtons.forEach(b => {
		b.addEventListener("click", () => {
			missionDialog.showModal();
			currentMission = b.getAttribute("data-num");
		});
	});

	restButtons.forEach(b => {
		b.addEventListener("click", () => {
			resourceData.get("ap").value -= 1;
			const restId = b.getAttribute("data-num");
			const slot = getItem(restSlots, restId);
			slot.classList.toggle("frozen");
			for (const child of slot.children) {
				child.classList.toggle("frozen");
			}
			updateUI();
		});
	});

	sendMission.addEventListener("click", () => {
		missionDialog.close();

		const duration = regionData.get(selectedLocation).duration;
		gameStateData.get("mission")[currentMission].duration = duration;

		const region = getItem(regions, selectedLocation);
		region.classList.toggle("frozen");
		gameStateData.get("mission")[currentMission].location = selectedLocation;

		const slot = getItem(missionSlots, currentMission);
		slot.classList.toggle("frozen");
		for (const child of slot.children) {
			child.classList.toggle("frozen");
		}

		resourceData.get("ap").value -= 1;

		updateUI();
	});

	cancelMission.addEventListener("click", () => {
		suppliesAmount.value = 0;
		regions.forEach(slot => slot.classList.remove("selected"));
		sendMission.disabled = true;
		currentMission = null;
		missionDialog.close();

		updateUI();
	});

	regions.forEach(region => {
		region.addEventListener("click", () => {
			regions.forEach(r => r.classList.remove("selected"));
			region.classList.add("selected");
			selectedLocation = region.getAttribute("data-num");
			const location = regionData.get(selectedLocation);

			missionDescription.innerHTML = `Going to <span class="city-name">${location.name}</span>, they are expected to reach destination in <span class="weeks-info">${location.duration} weeks</span>.<br>`;
			sendMission.disabled = false;
		});

		region.addEventListener("mouseenter", () => {
			const id = region.getAttribute("data-num");
			const location = regionData.get(id);
			tooltiptext.textContent = `${location.name}`;

			// Position tooltip at circle center
			tooltip.style.display = "block";
			tooltip.style.left = region.getAttribute("cx") + "px";
			tooltip.style.top = region.getAttribute("cy") + "px";
		});

		region.addEventListener("mouseleave", () => {
			tooltip.style.display = "none";
		});
	});

	suppliesUp.addEventListener("click", (e) => {
		if (e.ctrlKey) {
			suppliesAmount.value = Number(suppliesAmount.value) + 100;
		} else if (e.shiftKey) {
			suppliesAmount.value = Number(suppliesAmount.value) + 10;

		} else {
			suppliesAmount.value = Number(suppliesAmount.value) + 1;
		}
	});

	suppliesDown.addEventListener("click", (e) => {
		if (e.ctrlKey) {
			suppliesAmount.value = Math.max(Number(suppliesAmount.value) - 100, 0);
		} else if (e.shiftKey) {
			suppliesAmount.value = Math.max(Number(suppliesAmount.value) - 10, 0);

		} else {
			suppliesAmount.value = Math.max(Number(suppliesAmount.value) - 1, 0);
		}
	});

	restartButton.addEventListener("click", () => {
		gameOverDialog.close();
		start();
		updateUI();
	});

	function start() {
		draggedElement = null;
		originalParent = null;
		currentMission = null;
		selectedLocation = null;

		gameStateData = new Map();
		regionData = new Map();
		troopData = new Map();
		resourceData = new Map();

		gameStateData.set("week", 1);
		gameStateData.set("mission", {
			0: { duration: null, location: null },
			1: { duration: null, location: null }
		});

		regionData.set("A", { name: "City A", distance: "250km", duration: 1 });
		regionData.set("B", { name: "City B", distance: "300km", duration: 2 });
		regionData.set("C", { name: "City C", distance: "350km", duration: 2 });

		troopData.set("A", { name: "Anae", png: "images/MageLady.png", health: 0, max_health: 2, morale: 5 });
		troopData.set("B", { name: "Ekor", png: "images/MageMan.png", health: 0, max_health: 2, morale: 5 });
		troopData.set("C", { name: "Krisa", png: "images/PalLady.png", health: 0, max_health: 3, morale: 5 });
		troopData.set("D", { name: "Istriac", png: "images/PalMan.png", health: 0, max_health: 3, morale: 5 });
		troopData.set("E", { name: "Hjop", png: "images/RangerLady.png", health: 0, max_health: 3, morale: 5 });
		troopData.set("F", { name: "Frivkyl", png: "images/RangerMan.png", health: 0, max_health: 2, morale: 5 });

		resourceData.set("ap", { id: "ap", value: 5 });
		resourceData.set("gold", { id: "gold", value: 100 });
		resourceData.set("food", { id: "food", value: 20 });
		resourceData.set("supplies", { id: "supplies", value: 10 });

		suppliesAmount.value = 0;
		sendMission.disabled = true;

		troopCards.forEach(card => {
			// clear every child
			while (card.firstChild) {
				card.removeChild(card.lastChild);
			}

			// clear residual classes
			card.className = "troop-card";

			const id = card.getAttribute("data-num");
			const troop = troopData.get(id);

			// create portrait
			const portrait = document.createElement("img");
			portrait.src = troop.png;
			portrait.draggable = false;
			portrait.style.margin = "0 auto";
			portrait.style.display = "block";

			// create health indicator
			const healthIndicator = document.createElement("div");
			healthIndicator.className = "health-indicator";
			troop.health = troop.max_health - 1;

			card.appendChild(portrait);
			card.appendChild(healthIndicator);
			card.appendChild(document.createTextNode(troop.name));

			troopPool.appendChild(card);
		});

		dropableSlots.forEach(slot => {
			slot.className = "slot";
		});

		troopPool.className = "troop-pool";

		regions.forEach(region => {
			region.setAttribute("class", "region");
		});

	}

	function updateUI() {
		stateDisplay.textContent = `Weeks: ${gameStateData.get("week")}`;

		missionSlots.forEach((slot) => {
			const missionId = slot.getAttribute("data-num");
			if (slot.classList.contains("frozen")) {
				const duration = gameStateData.get("mission")[missionId].duration;
				slot.setAttribute("data-frozen-text", `ONGOING MISSION\r\n${duration} weeks remaining`);
				getItem(missionButtons, missionId).disabled = true;
			} else {
				if (resourceData.get("ap").value <= 0 || !slot.classList.contains("occupied")) {
					getItem(missionButtons, missionId).disabled = true;
				} else {
					getItem(missionButtons, missionId).disabled = false;
				}
			}
		});

		restSlots.forEach((slot) => {
			const restId = slot.getAttribute("data-num");
			if (slot.classList.contains("frozen")) {
				slot.setAttribute("data-frozen-text", "Rest until next week");
				getItem(restButtons, restId).disabled = true;
			} else {
				if (resourceData.get("ap").value <= 0 || !slot.classList.contains("occupied")) {
					getItem(restButtons, restId).disabled = true;
				} else {
					getItem(restButtons, restId).disabled = false;
				}
			}
		});

		resourceData.forEach((v, _) => {
			const ui = document.getElementById(v.id);
			ui.textContent = v.value;
		});

		if (resourceData.get("ap").value <= 0 || resourceData.get("gold").value <= 0) {
			buyFoodButton.disabled = true;
			buySuppliesButton.disabled = true;
		} else {
			buyFoodButton.disabled = false;
			buySuppliesButton.disabled = false;
		}

		troopCards.forEach((card) => {
			const id = card.getAttribute("data-num");
			const troop = troopData.get(id);
			const healthIndicator = card.querySelector(".health-indicator")
			while (healthIndicator.firstChild) {
				healthIndicator.removeChild(healthIndicator.lastChild);
			}
			for (let i = 0; i < troop.health; i++) {
				const img = document.createElement("img");
				img.src = "images/fb681.png";
				img.draggable = false;
				healthIndicator.appendChild(img);
			}
			for (let i = troop.health; i < troop.max_health; i++) {
				const img = document.createElement("img");
				img.src = "images/fb681_altered.png";
				img.draggable = false;
				healthIndicator.appendChild(img);
			}
		});

		missionDescription.textContent = "";
	}
});
