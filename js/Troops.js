import { GameData } from "./GameData.js"

const DragHandler = (() => {
	function addDragEvents(card) {
		card.addEventListener("dragstart", handleDragStart);
		card.addEventListener("dragend", handleDragEnd);
	}

	function handleDragStart(e) {
		GameData.draggedElement = e.currentTarget;
		GameData.originalParent = e.currentTarget.parentElement;
		e.currentTarget.classList.add("dragging");
		e.dataTransfer.effectAllowed = "move";
	}

	function handleDragEnd(e) {
		e.currentTarget.classList.remove("dragging");
	}

	return { addDragEvents };
})();

export function createTroopCard(troopId, draggable, resetHealth = true) {

	const troopInfo = GameData.troops.get(troopId);

	const card = document.createElement("div");
	card.className = "troop-card";
	card.draggable = draggable;
	card.dataset.num = troopId;

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

	card.style.display = troopInfo.available ? "" : "none";

	if (!draggable) {
		return card;
	}

	DragHandler.addDragEvents(card);

	return card;
}

