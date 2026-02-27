import { getDistance, findClosestSlot, isWithinSnapDistance, SNAP_DISTANCE } from "./js/utils.js";

document.addEventListener("DOMContentLoaded", () => {

	let draggedElement = null;
	let originalParent = null;
	let currentMission = null;
	let selectedLocation = null;

	const troopCards = document.querySelectorAll(".troop-card");
	const slots = document.querySelectorAll(".slot, .troop-pool");
	const troopPool = document.getElementById("troopPool");
	const resetButton = document.getElementById("resetSlots");
	const missionDialog = document.getElementById("missionDialog");
	const missionButtons = document.querySelectorAll(".mission-button");

	// main buttons of missions
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

	const cityData = new Map();
	cityData.set("A", { name: "City A", distance: "250km", duration: "4 days" })
	cityData.set("B", { name: "City B", distance: "300km", duration: "5 days" })
	cityData.set("C", { name: "City C", distance: "350km", duration: "6 days" })

	const troopData = new Map();
	troopData.set("A", { name: "Anae", png: "images/MageLady.png", health: 0, max_health: 2, morale: 5 })
	troopData.set("B", { name: "Ekor", png: "images/MageMan.png", health: 0, max_health: 2, morale: 5 })
	troopData.set("C", { name: "Krisa", png: "images/PalLady.png", health: 0, max_health: 3, morale: 5 })
	troopData.set("D", { name: "Istriac", png: "images/PalMan.png", health: 0, max_health: 3, morale: 5 })
	troopData.set("E", { name: "Hjop", png: "images/RangerLady.png", health: 0, max_health: 3, morale: 5 })
	troopData.set("F", { name: "Frivkyl", png: "images/RangerMan.png", health: 0, max_health: 2, morale: 5 })

	troopCards.forEach(card => {
		const id = card.getAttribute("data-id");
		const troop = troopData.get(id);
		card.firstElementChild.src = troop.png;
		card.firstElementChild.style.margin = "0 auto";
		card.firstElementChild.style.display = "block";
		const healthIndicator = document.createElement("div");
		healthIndicator.className = "health-indicator";
		troop.health = troop.max_health;
		for (let i = 0; i < troop.health; i++) {
			const img = document.createElement("img");
			img.src = "images/fb681.png";
			img.draggable = false;
			healthIndicator.appendChild(img);
		}
		card.appendChild(healthIndicator);
		card.appendChild(document.createTextNode(troop.name));

		card.addEventListener("dragstart", (e) => {
			draggedElement = card;
			originalParent = card.parentElement;

			card.classList.add("dragging");
			e.dataTransfer.effectAllowed = "move";
		});

		card.addEventListener("dragend", () => {
			card.classList.remove("dragging");
		});
	});

	slots.forEach(slot => {
		slot.addEventListener("drop", (e) => {
			e.preventDefault()
			if (!draggedElement) return;

			draggedElement.classList.remove("dragging");

			// Find closest slot
			const closestSlot = findClosestSlot(e.clientX, e.clientY, slots);
			if (closestSlot && isWithinSnapDistance(e.clientX, e.clientY, closestSlot)) {

				// Snap to slot
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
					getButton(num).disabled = false;
				}

				if (oldParent && oldParent.querySelectorAll(".troop-card").length === 0) {
					oldParent.classList.remove("occupied");
					const num = oldParent.getAttribute("data-num");
					if (num) {
						getButton(num).disabled = true;
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

		slot.addEventListener("drop", (e) => {
			e.preventDefault();
			slot.classList.remove("hover");
		});
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
					getButton(num).disabled = true;
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

		const slot = getSlot(currentMission);
		const button = getButton(currentMission);
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
			const location = cityData.get(id);
			tooltiptext.textContent = `${location.name}\r\n${location.distance}\r\n${location.duration}`;

			// Position tooltip at circle center
			tooltip.style.display = "block";
			tooltip.style.left = region.getAttribute("cx") + "px";
			tooltip.style.top = region.getAttribute("cy") + "px";
		});

		region.addEventListener("mouseleave", () => {
			tooltip.style.display = "none";
		});
	});

	suppliesAmount.value = 0;
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

	function getSlot(val) {
		return Array.from(slots).find((slot) => slot.getAttribute("data-num") === val)
	}

	function getButton(val) {
		return Array.from(missionButtons).find((b) => b.getAttribute("data-num") === val)
	}
});
