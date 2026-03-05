import { getDistance, SNAP_DISTANCE, dropLogic } from "./utils.js";

export function createTroopCard(GameUI, troopId, draggable, resetHealth = true) {

	const troopInfo = GameUI.troopData.get(troopId);

	const card = document.createElement("div");
	card.className = "troop-card";
	card.draggable = draggable;
	card.setAttribute("data-num", troopId);

	// create portrait
	const portrait = document.createElement("img");
	portrait.src = troopInfo.png;
	portrait.draggable = false;
	portrait.style.margin = "0 auto";
	portrait.style.display = "block";

	// create health indicator
	const healthIndicator = document.createElement("div");
	healthIndicator.className = "health-indicator";

	if (resetHealth) {
		troopInfo.health = troopInfo.max_health - 1;
	}

	card.appendChild(portrait);
	card.appendChild(healthIndicator);
	card.appendChild(document.createTextNode(troopInfo.name));

	if (!draggable) {
		return card;
	}

	card.addEventListener("dragstart", (e) => {
		GameUI.draggedElement = card;
		GameUI.originalParent = card.parentElement;

		card.classList.add("dragging");
		e.dataTransfer.effectAllowed = "move";
	});

	card.addEventListener("dragend", () => {
		card.classList.remove("dragging");
	});

	card.addEventListener("touchstart", (e) => {
		GameUI.draggedElement = card;
		GameUI.originalParent = card.parentElement;

		card.classList.add("dragging");
		e.dataTransfer.effectAllowed = "move";
	}, { passive: false });

	card.addEventListener("touchend", (e) => {
		dropLogic(GameUI, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
		updateUI(GameUI);
	}, { passive: false });

	card.addEventListener("touchmove", () => {
		if (!GameUI.draggedElement) return;
		e.preventDefault();

		const touchX = e.touches[0].clientX;
		const touchY = e.touches[0].clientY;

		GameUI.dropableSlots.forEach(slot => {
			const distance = getDistance(touchX, touchY, slot);
			if (distance < SNAP_DISTANCE) {
				slot.classList.add("hover");
			} else {
				slot.classList.remove("hover");
			}
		});
	}, { passive: false });

	return card;
}

