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

export function dropLogic(GameUI, X, Y) {
	if (!GameUI.draggedElement) return;

	GameUI.draggedElement.classList.remove("dragging");

	const closestSlot = findClosestSlot(X, Y, GameUI.dropableSlots);
	if (closestSlot && isWithinSnapDistance(X, Y, closestSlot)) {

		const existingCards = closestSlot.querySelectorAll(".troop-card");

		if (Array.from(existingCards).find(node => node.isEqualNode(GameUI.draggedElement))) {
			return;
		}
		if (existingCards.length >= 4) {
			GameUI.troopPool.appendChild(existingCards[0]);
		}

		const oldParent = GameUI.draggedElement.parentElement;
		closestSlot.appendChild(GameUI.draggedElement);
		closestSlot.classList.add("occupied");

		if (oldParent && oldParent.querySelectorAll(".troop-card").length === 0) {
			oldParent.classList.remove("occupied");
		}
	} else {
		if (GameUI.originalParent && GameUI.originalParent !== GameUI.draggedElement.parentElement) {
			GameUI.originalParent.appendChild(GameUI.draggedElement);
		}
	}

	GameUI.dropableSlots.forEach(s => s.classList.remove("hover"));
	GameUI.draggedElement = null;
}

export function allowMissionDrop(GameUI, slot) {
	const troopId = GameUI.draggedElement.dataset.num;
	const health = GameUI.troopData.get(troopId).health;

	if (health == 0 && slot.classList.contains("mission-slot")) {
		return false;
	}

	return true;
}

