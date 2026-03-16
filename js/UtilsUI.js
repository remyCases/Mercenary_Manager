export function partyToStr(gameData, party) {
	const partyNames = Array.from(party).map(([id, _]) => gameData.troops.get(id).name);
	if (partyNames.length == 1) {
		return `${partyNames[0]} is`;
	}
	const last = partyNames.pop();
	return `${partyNames.join(", ")} and ${last} are`;
}

export function goldToStr(gold) {
	return `${gold} ${gold <= 1 ? "gold" : "golds"}`;
}

export function isFrozen(element) {
	return element.classList.contains("frozen");
}

export function isOccupied(element) {
	return element.classList.contains("occupied");
}
