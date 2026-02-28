export const SNAP_DISTANCE = 200; // pixels

export function findClosestSlot(x, y, slots) {
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

export function isWithinSnapDistance(x, y, slot) {
	return getDistance(x, y, slot) < SNAP_DISTANCE;
}

export function getItem(items, val) {
	return Array.from(items).find((item) => item.getAttribute("data-num") === val)
}

