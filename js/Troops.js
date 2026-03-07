import { getDistance, SNAP_DISTANCE, dropLogic } from "./utils.js";

export function createTroopCard(gameData, gameUI, troopId, draggable, resetHealth = true) {

	const troopInfo = gameData.troops.get(troopId);

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

	if (!draggable) {
		return card;
	}

	addEvents(gameUI, card);

	return card;
}

function addEvents(gameUI, card) {
	card.addEventListener("dragstart", (e) => {
		gameUI.draggedElement = card;
		gameUI.originalParent = card.parentElement;

		card.classList.add("dragging");
		e.dataTransfer.effectAllowed = "move";
	});

	card.addEventListener("dragend", () => {
		card.classList.remove("dragging");
	});

	card.addEventListener("touchstart", (e) => {
		gameUI.draggedElement = card;
		gameUI.originalParent = card.parentElement;

		card.classList.add("dragging");
		e.dataTransfer.effectAllowed = "move";
	}, { passive: false });

	card.addEventListener("touchend", (e) => {
		dropLogic(gameUI, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
		updateUI(gameUI);
	}, { passive: false });

	card.addEventListener("touchmove", () => {
		if (!gameUI.draggedElement) return;

		const touchX = e.touches[0].clientX;
		const touchY = e.touches[0].clientY;

		gameUI.dropableSlots.forEach(slot => {
			if (!allowMissionDrop(gameUI, slot)) return;
			const distance = getDistance(touchX, touchY, slot);
			if (distance < SNAP_DISTANCE) {
				slot.classList.add("hover");
			} else {
				slot.classList.remove("hover");
			}
		});
	}, { passive: false });
}

export function createMissionTroopDisplay(gameUI, card, troopId, stratId) {
	const strategyBox = document.createElement("div");
	strategyBox.className = "strategy-box";
	strategyBox.textContent = gameUI.strategyData.get(stratId).name;
	strategyBox.dataset.num = troopId;
	strategyBox.dataset.description = "";
	strategyBox.addEventListener("click", (e) => {
		e.stopPropagation();
		gameUI.strategyMenu.style.display = "block";
		gameUI.selectedStrategy = strategyBox;
	});

	const stat = document.createElement("p");
	stat.className = "stat-info-text";
	stat.dataset.num = troopId;

	const lostHP = createStatDisplay("lost-hp-display", "-1", "./images/fb681.png", "Will lost 1 health next week");
	const consumedAp = createStatDisplay("consumed-ap", "-1", "images/fb97.png", "Cost 1 AP");
	const consumedSupplies = createStatDisplay("consumed-supplies", "-1", "images/fb671.png", "Cost 1 supply");

	const container = document.createElement("div");
	container.classList.add("stat-info");
	container.classList.add("vbox");
	container.appendChild(card);
	container.appendChild(strategyBox);
	container.appendChild(stat);
	container.appendChild(lostHP);
	container.appendChild(consumedAp);
	container.appendChild(consumedSupplies);

	return container
}

function createStatDisplay(className, text, imgSrc, desc) {
	const div = document.createElement("div");
	div.className = className;

	const p = document.createElement("p");
	p.textContent = text;

	const img = document.createElement("img");
	img.src = imgSrc;
	img.dataset.description = desc;


	div.appendChild(p);
	div.appendChild(img);
	return div;
}
