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

export function computePartyStat(GameUI) {
	const mission = GameUI.gameStateData.get("mission")[GameUI.currentMission];
	let partyEfficiency = mission.prevEfficiency;
	let partyCautiousness = 0;
	let partyCostAp = 0;
	let partyCostSupplies = 0;

	mission.party.forEach((stratId, troopId) => {
		const troop = GameUI.troopData.get(troopId);

		if (troop.health == 0) return;
		const strategy = GameUI.strategyData.get(stratId);

		const modEfficiency = strategy.modifiers.find((e) => e.type === "efficiency");
		const totalEfficiency = troop.efficiency + (modEfficiency ? modEfficiency.value : 0);

		const modCautiousness = strategy.modifiers.find((e) => e.type === "cautiousness");
		const totalCautiousness = troop.cautiousness + (modCautiousness ? modCautiousness.value : 0);

		const costAp = strategy.cost.find((e) => e.type === "ap");
		const modAp = costAp ? costAp.value : 0;

		const costSupplies = strategy.cost.find((e) => e.type === "supplies");
		const modSupplies = costSupplies ? costSupplies.value : 0;

		partyEfficiency += totalEfficiency;
		partyCautiousness += totalCautiousness;
		partyCostAp += modAp;
		partyCostSupplies += modSupplies;
	});
	mission.efficiency = partyEfficiency;
	mission.cautiousness = partyCautiousness;
	mission.costAp = partyCostAp;
	mission.costSupplies = partyCostSupplies;
}
