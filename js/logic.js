function computeGold(troops, gold, food) {
	return food == 0 ? gold - 2 * troops : gold - troops;
}

function consume(troops, consumable) {
	return Math.max(consumable - troops, 0);
}

export function resolveAction(troops, gold, food, goods) {

	let new_gold = computeGold(troops, gold, food);
	let new_food = consume(troops, food);
	let new_goods = consume(troops, goods);

	return [new_gold, new_food, new_goods];
}

