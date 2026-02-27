function computeGold(troops, gold, food) {
	return food == 0 ? gold - 2 * troops : gold - troops;
}

function consume(troops, consumable) {
	return Math.max(consumable - troops, 0);
}

const moraleDecay = 0.01
function computeMorale(morale, gold, goods) {
	let new_morale = morale;
	let isBankrupted = gold == 0;
	let hasGoods = goods > 0;
	new_morale *= (1 - moraleDecay);
	new_morale -= isBankrupted ? 5 : 0;
	new_morale += hasGoods ? 5 : 0;
	return Math.min(Math.max(new_morale, 0), 100);
}

export function resolveAction(action, troops, gold, food, goods, supplies) {

	let new_troops = troops;
	let new_gold = computeGold(troops, gold, food);
	let new_food = consume(troops, food);
	let new_goods = consume(troops, goods);
	let new_supplies = supplies;

	if (action == "REST") {

	} else if (action.includes("RECRUIT")) {
		if (new_gold >= 0) {
			new_troops = new_troops + Number(action.split(" ")[1]);
		}
	} else if (action.includes("MISSION")) {
		const supplies_factor = new_troops > 0 ? Math.min(new_supplies / new_troops, 1.0) : 0.0;
		const effectiveness = new_troops * (1.0 + supplies_factor);

		let weight = 0;
		if (action.includes("EASY")) {
			weight = 5;
		} else if (action.includes("NORMAL")) {
			weight = 20;
		} else if (action.includes("HARD")) {
			weight = 100;
		}

		const outcome = effectiveness >= weight;
		const casualities = Math.min(Math.max(2 * weight - effectiveness, 0) / (2 * weight), 1);
		const waste = Math.min(Math.max((3 * weight) - effectiveness, 0) / (3 * weight), 1);
		new_troops *= (1 - casualities);
		new_supplies *= (1 - waste);

		if (outcome) {
			new_gold += 2 * weight;
		}
	} else if (action == "BUY FOOD") {
		if (new_gold >= 0) {
			new_food = new_food + 100;
			new_gold = new_gold - 10;
		}
	} else if (action == "BUY GOODS") {
		if (new_gold >= 0) {
			new_goods = new_goods + 20;
			new_gold = new_gold - 10;
		}
	} else if (action == "BUY SUPPLIES") {
		if (new_gold >= 0) {
			new_supplies = new_supplies + 10;
			new_gold = new_gold - 10;
		}
	}

	return [new_troops, new_gold, new_food, new_goods, new_supplies];
}

