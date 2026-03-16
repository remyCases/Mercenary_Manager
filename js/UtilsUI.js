export function partyToStr(gameData, party) {
	const partyNames = Array.from(party).map(([id, _]) => gameData.troops.get(id).name);
	if (partyNames.length == 1) {
		return `${partyNames[0]} is`;
	}
	const last = partyNames.pop();
	return `${partyNames.join(", ")} and ${last} are`;
}

export function rewardsToStr(rewards) {
	if (!rewards.gold && !rewards.reputation) {
		return "";
	} else if (!rewards.gold) {
		return `You will <span class="bold">${RepToStr(rewards.reputation)}</span>.`;
	} else if (!rewards.reputation) {
		return `You should earn <span class="bold">${goldToStr(rewards.gold)}</span> if done during the first week.`;
	}

	return `You should earn <span class="bold">${goldToStr(rewards.gold)}</span> if done during the first week and will <span class="bold">${RepToStr(rewards.reputation)}</span>.`;
}

export function goldToStr(gold) {
	return `${gold} ${gold <= 1 ? "gold" : "golds"}`;
}

export function RepToStr(rep) {

	if (rep < -50) {
		return "lose a huge amout of reputation";
	} else if (rep < -20) {
		return "lose a lot of reputation";
	} else if (rep < -10) {
		return "lose some reputation";
	} else if (rep < 0) {
		return "lose a tiny amout of reputation";
	} else if (rep < 10) {
		return "gain a tiny amout of reputation";
	} else if (rep < 20) {
		return "gain some reputation";
	} else if (rep < 50) {
		return "gain a lot of reputation";
	} else {
		return "gain a huge amout of reputation";
	}
}

export function isFrozen(element) {
	return element.classList.contains("frozen");
}

export function isOccupied(element) {
	return element.classList.contains("occupied");
}

export function endMissionToStr(name, duration, initialRewards, currentRewards, hasWon) {
	let endMessage = "";
	if (hasWon) {
		endMessage = "was successful.<br>";
		if (duration == 0 && initialRewards.gold > 0) {
			endMessage += `You win <span class="bold">${currentRewards.gold} golds</span>.`;
		} else if (initialRewards.gold > 0) {
			endMessage += `From the initial <span class="bold">${goldToStr(initialRewards.gold)}</span>, you win <span class="bold">${goldToStr(currentRewards.gold)}</span> and lost <span class="bold">${goldToStr(initialRewards.gold - currentRewards.gold)}</span> as a late penalty fee.`;
		}
	} else {
		endMessage = "failed."
	}
	return `Mission to ${name} ${endMessage}`;
}
