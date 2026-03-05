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

	addEvents(GameUI, card);

	return card;
}

function addEvents(GameUI, card) {
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
		e.preventDefault();
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
}

export function createMissionTroopDisplay(GameUI, card, troopId, stratId) {
	const strategyBox = document.createElement("div");
	strategyBox.className = "strategy-box";
	strategyBox.textContent = GameUI.strategyData.get(stratId).name;
	strategyBox.setAttribute("data-num", troopId);
	strategyBox.addEventListener("click", (e) => {
		e.stopPropagation();
		GameUI.strategyMenu.style.display = "block";
		GameUI.selectedStrategy = strategyBox;
	});

	const stat = document.createElement("p");
	stat.className = "stat-info-text";
	stat.setAttribute("data-num", troopId);

	const lostHP = createStatDisplay("lost-hp-display", "-1", "./images/fb681.png");
	const consumedAp = createStatDisplay("consumed-ap", "-1", "images/fb97.png")
	const consumedSupplies = createStatDisplay("consumed-supplies", "-1", "images/fb671.png");

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

function createStatDisplay(className, text, imgSrc) {
	const div = document.createElement("div");
	div.className = className;

	const p = document.createElement("p");
	p.textContent = text;

	const img = document.createElement("img");
	img.src = imgSrc;

	div.appendChild(p);
	div.appendChild(img);
	return div;
}
