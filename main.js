import { findClosestSlot, isWithinSnapDistance, getDistance, getItem, SNAP_DISTANCE } from "./js/utils.js";
import { resolveAction } from "./js/logic.js"

document.addEventListener("DOMContentLoaded", () => {

	let draggedElement = null;
	let originalParent = null;
	let currentMission = null;
	let selectedLocation = null;
	let weeks = 1;
	let regionData = new Map();
	let troopData = new Map();
	let resourceData = new Map();

	// elements on main screen
	const troopCards = document.querySelectorAll(".troop-card");
	const slots = document.querySelectorAll(".slot, .troop-pool");
	const troopPool = document.getElementById("troopPool");
	const resetButton = document.getElementById("resetSlots");
	const newWeekButton = document.getElementById("newWeekButton");
	const missionButtons = document.querySelectorAll(".mission-button");
	const stateDisplay = document.getElementById('state');

	// main buttons of missions
	const missionDialog = document.getElementById("missionDialog");
	const sendMission = document.getElementById("sendMission");
	const cancelMission = document.getElementById("cancelMission");
	const regions = document.querySelectorAll(".region");

	// tooltip of missions
	const tooltip = document.getElementById("tooltip");
	const tooltiptext = document.getElementById("tooltiptext");

	// supplies for missions
	const suppliesAmount = document.getElementById("suppliesAmount");
	const suppliesUp = document.getElementById("suppliesUp");
	const suppliesDown = document.getElementById("suppliesDown");

	// gameover modal
	const gameOverDialog = document.getElementById("gameOverDialog");
	const restartButton = document.getElementById("restart");

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

		card.addEventListener('touchstart', () => {
			draggedElement = card;
			originalParent = card.parentElement;

			card.classList.add("dragging");
			card.classList.add('dragging');
		}, { passive: false });

		card.addEventListener('touchend', (e) => {
			if (!draggedElement) return;

			const touchEndX = e.changedTouches[0].clientX;
			const touchEndY = e.changedTouches[0].clientY;

			draggedElement.classList.remove('dragging');

			const closestSlot = findClosestSlot(touchEndX, touchEndY, slots);
			if (closestSlot && isWithinSnapDistance(touchEndX, touchEndY, closestSlot)) {

				const existingCards = closestSlot.querySelectorAll('.troop-card');

				if (Array.from(existingCards).find(node => node.isEqualNode(draggedElement))) {
					return;
				}
				if (existingCards.length >= 4) {
					troopPool.appendChild(existingCards[0]);
				}

				const oldParent = draggedElement.parentElement;
				closestSlot.appendChild(draggedElement);
				closestSlot.classList.add("occupied");
				const num = closestSlot.getAttribute("data-num");
				if (num) {
					getItem(missionButtons, num).disabled = false;
				}

				if (oldParent && oldParent.querySelectorAll(".troop-card").length === 0) {
					oldParent.classList.remove("occupied");
					const num = oldParent.getAttribute("data-num");
					if (num) {
						getItem(missionButtons, num).disabled = true;
					}
				}
			} else {
				if (originalParent && originalParent !== draggedElement.parentElement) {
					originalParent.appendChild(draggedElement);
				}
			}

			slots.forEach(s => s.classList.remove('hover'));
			draggedElement = null;
			updateFilledSlots();
		}, { passive: false });

		card.addEventListener('touchmove', (e) => {
			if (!draggedElement) return;
			e.preventDefault();

			const touchX = e.touches[0].clientX;
			const touchY = e.touches[0].clientY;

			slots.forEach(slot => {
				const distance = getDistance(touchX, touchY, slot);
				if (distance < SNAP_DISTANCE) {
					slot.classList.add('hover');
				} else {
					slot.classList.remove('hover');
				}
			});
		}, { passive: false });
	});

	slots.forEach(slot => {
		slot.addEventListener("drop", (e) => {
			e.preventDefault()
			if (!draggedElement) return;

			draggedElement.classList.remove("dragging");

			const closestSlot = findClosestSlot(e.clientX, e.clientY, slots);
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
				const num = closestSlot.getAttribute("data-num");
				if (num) {
					getItem(missionButtons, num).disabled = false;
				}

				if (oldParent && oldParent.querySelectorAll(".troop-card").length === 0) {
					oldParent.classList.remove("occupied");
					const num = oldParent.getAttribute("data-num");
					if (num) {
						getItem(missionButtons, num).disabled = true;
					}
				}
			} else {
				// Return to original parent
				if (originalParent && originalParent !== draggedElement.parentElement) {
					originalParent.appendChild(draggedElement);
				}
			}
			// Clear hover state on all slots
			slots.forEach(s => s.classList.remove("hover"));
			draggedElement = null;
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
		resetButton.click();
		weeks += 1;
		const res = resolveAction("", 6, resourceData.get("gold").value, resourceData.get("food").value, 0, resourceData.get("supplies").value);
		resourceData.get("gold").value = res[1];
		resourceData.get("food").value = res[2];
		resourceData.get("supplies").value = res[4];
		updateUI();

		if (resourceData.get("food").value <= 0) {
			gameOverDialog.showModal();
		}
	});

	resetButton.addEventListener("click", () => {
		// Move all cards back to pool
		document.querySelectorAll(".slot .troop-card").forEach(card => {
			if (!card.classList.contains("frozen")) {
				troopPool.appendChild(card);
			}
		});

		// Clear occupied state
		slots.forEach(slot => {
			if (!slot.classList.contains("frozen")) {
				slot.classList.remove("occupied");
				const num = slot.getAttribute("data-num");
				if (num) {
					getItem(missionButtons, num).disabled = true;
				}

			}
		});

		regions.forEach(region => region.classList.remove("selected"));
		currentMission = null;
	});

	missionButtons.forEach(b => {
		b.disabled = true;
		b.addEventListener("click", () => {
			missionDialog.showModal();
			currentMission = b.getAttribute("data-num");
		});
	});

	sendMission.addEventListener("click", () => {
		missionDialog.close();

		const slot = getItem(slots, currentMission);
		const button = getItem(missionButtons, currentMission);
		if (!slot || !button) {
			alert("Invalid slot");
			return;
		}

		slot.classList.toggle("frozen");
		for (const child of slot.children) {
			child.classList.toggle("frozen");
		}

		button.disabled = true;
	});

	cancelMission.addEventListener("click", () => {
		suppliesAmount.value = 0;
		regions.forEach(slot => slot.classList.remove("selected"));
		sendMission.disabled = true;
		currentMission = null;
		missionDialog.close();
	});

	regions.forEach(region => {
		region.addEventListener("click", () => {
			regions.forEach(r => r.classList.remove("selected"));
			region.classList.add("selected");
			selectedLocation = region.getAttribute("data-location");
			sendMission.disabled = false;
		});

		region.addEventListener("mouseenter", () => {
			const id = region.getAttribute("data-location");
			const location = regionData.get(id);
			tooltiptext.textContent = `${location.name}\r\ntravel time: ${location.duration}`;

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

		regionData = new Map();
		troopData = new Map();
		resourceData = new Map();

		weeks = 1; regionData.set("A", { name: "City A", distance: "250km", duration: "1 week" })
		regionData.set("B", { name: "City B", distance: "300km", duration: "2 week" })
		regionData.set("C", { name: "City C", distance: "350km", duration: "2 week" })

		troopData.set("A", { name: "Anae", png: "images/MageLady.png", health: 0, max_health: 2, morale: 5 })
		troopData.set("B", { name: "Ekor", png: "images/MageMan.png", health: 0, max_health: 2, morale: 5 })
		troopData.set("C", { name: "Krisa", png: "images/PalLady.png", health: 0, max_health: 3, morale: 5 })
		troopData.set("D", { name: "Istriac", png: "images/PalMan.png", health: 0, max_health: 3, morale: 5 })
		troopData.set("E", { name: "Hjop", png: "images/RangerLady.png", health: 0, max_health: 3, morale: 5 })
		troopData.set("F", { name: "Frivkyl", png: "images/RangerMan.png", health: 0, max_health: 2, morale: 5 })

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

			const id = card.getAttribute("data-id");
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
			troop.health = troop.max_health;
			for (let i = 0; i < troop.health; i++) {
				const img = document.createElement("img");
				img.src = "images/fb681.png";
				img.draggable = false;
				healthIndicator.appendChild(img);
			}

			card.appendChild(portrait);
			card.appendChild(healthIndicator);
			card.appendChild(document.createTextNode(troop.name));

			troopPool.appendChild(card);
		});

		slots.forEach(slot => {
			slot.className = "slot";
		});

		troopPool.className = "troop-pool";

		regions.forEach(region => {
			region.setAttribute("class", "region");
		});

		missionButtons.forEach(b => {
			b.disabled = true;
		});

	}

	function updateUI() {
		stateDisplay.textContent = `Weeks: ${weeks}`;
		resourceData.forEach((v, _) => {
			const ui = document.getElementById(v.id);
			ui.textContent = v.value;
		});
	}
});
