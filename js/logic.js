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

export function computePartyStat(gameData) {
	const mission = gameData.state.get("mission")[gameData.currentMission];
	let partyEfficiency = mission.prevEfficiency;
	let partyCautiousness = 0;
	let partyCostAp = 0;
	let partyCostSupplies = 0;

	mission.party.forEach((strategyId, troopId) => {
		const troop = gameData.troops.get(troopId);

		if (troop.health == 0) return;
		const strategy = gameData.strategies.get(strategyId);

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
