export const SNAP_DISTANCE = 200; // pixels

function findClosestSlot(x, y, slots) {
	let closest = null;
	let minDistance = Infinity;

	slots.forEach(slot => {
		const distance = getDistance(x, y, slot);
		if (distance < minDistance) {
			minDistance = distance;
			closest = slot;
		}
	});

	return closest;
}

export function getDistance(x, y, slot) {
	const rect = slot.getBoundingClientRect();
	const slotCenterX = rect.left + rect.width / 2;
	const slotCenterY = rect.top + rect.height / 2;

	const dx = x - slotCenterX;
	const dy = y - slotCenterY;

	return Math.sqrt(dx * dx + dy * dy);
}

function isWithinSnapDistance(x, y, slot) {
	return getDistance(x, y, slot) < SNAP_DISTANCE;
}

export function getItem(items, val) {
	return Array.from(items).find((item) => item.dataset.num === val)
}

export function dropLogic(gameUI, X, Y) {
	if (!gameUI.draggedElement) return;

	gameUI.draggedElement.classList.remove("dragging");

	const closestSlot = findClosestSlot(X, Y, gameUI.droppableSlots);
	if (closestSlot && isWithinSnapDistance(X, Y, closestSlot)) {

		const existingCards = closestSlot.querySelectorAll(".troop-card");

		if (Array.from(existingCards).find(node => node.isEqualNode(gameUI.draggedElement))) {
			return;
		}
		if (existingCards.length >= 4) {
			gameUI.troopPool.appendChild(existingCards[0]);
		}

		const oldParent = gameUI.draggedElement.parentElement;
		closestSlot.appendChild(gameUI.draggedElement);
		closestSlot.classList.add("occupied");

		if (oldParent && oldParent.querySelectorAll(".troop-card").length === 0) {
			oldParent.classList.remove("occupied");
		}
	} else {
		if (gameUI.originalParent && gameUI.originalParent !== gameUI.draggedElement.parentElement) {
			gameUI.originalParent.appendChild(gameUI.draggedElement);
		}
	}

	gameUI.droppableSlots.forEach(s => s.classList.remove("hover"));
	gameUI.draggedElement = null;
}

export function allowMissionDrop(gameData, gameUI, slot) {
	const troopId = gameUI.draggedElement.dataset.num;
	const health = gameData.troops.get(troopId).health;

	return health != 0 || !slot.classList.contains("mission-slot");
}

export function isFrozen(element) {
	return element.classList.contains("frozen");
}

export function isOccupied(element) {
	return element.classList.contains("occupied");
}
