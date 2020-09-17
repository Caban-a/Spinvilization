
var YEAR_PHASES = ["combo", "tribe", "adversity", "vanquish", "year end"];
var COMMON_PHASES = ["combo", "tribe", "adversity", "vanquish"];




var phase;
var nonDeterministicPhases;
var donePhases;
var actionLogs;



function resetActionLog(phases) {
	actionLogs = {};
	for (let i of phases) actionLogs[i] = [];
}


function unforeseeable() {
	if (!computingPreview()) return false;
	var pos = uniquePos(phase.split("|")[0], YEAR_PHASES);
	if (pos <= 0) return false;
	if (nbIn(YEAR_PHASES[pos - 1], donePhases) > 0) return false;
	return true;
}

function unforeseen() {
	var reachedCurrentPhase = false;
	for (let i of YEAR_PHASES) {
		if (i == phase.split("|")[0]) reachedCurrentPhase = true;
		if (reachedCurrentPhase) nonDeterministicPhases.push(i);
	}
}

function moveOn(newPhase) {
	if (computingPreview()) {
		if (nbIn(phase.split("|")[0], nonDeterministicPhases) > 0) {
			actionLogs[phase.split("|")[0]] = [];
			rewind();
			return;
		}
		previewSaves[phase.split("|")[0]] = storeGame();
	}
	phase = newPhase;
}

function computingPreview() {
	return (actionPreview && !previewDone);
}

function rewind() {
	previewDone = true;
	phase = phase.split("|")[0];
	gameCanvas.elems[1].push(eventBox);
	gameCanvas.anims.push(eventBox);
	eventBox.adjust(actionLogs);
}
	


function performCombo(c, cUse) {
	initializeTurn();
	abilities(c.getElementsByTagName("effect")[0], c.attributes.getNamedItem("id").nodeValue);
	if (freeAction) {
		freeAction = false;
		return;
	}
	signalComboReels(cUse);
	for (let i of cUse) if (i < gameState.wheel.length) gameState.wheel[i].usedForCombo = true;
	if (replacingTech == undefined) processTurn();
}



function actOnTribeOrAdversity(actuProd, ph) {
	return ((actuProd.tagName == "enemy" || actuProd.tagName == "weather") != (ph.split("|")[0] == "tribe"));
}

function passiveEffect(loc) {
	var actu = actualReel(loc, 0);
	if (actu == "spinning" || gameState.wheel[loc].activated) return [false, false];
	var actualProd = prodsXML.getElementById(actu);
	if (!actOnTribeOrAdversity(actualProd, phase)) return [false, false];
	if (enemyNeutralized(loc)) {
		gameState.wheel[loc].activated = true;
		addLog(actu + " is neutralized and has no effect");
		return [true, true];
	}
	if (abilities(actualProd, loc)) {
		gameState.wheel[loc].activated = true;
		return [true, true];
	}
	return [false, false];
}



function sweep() {
	for (let i of gameState.killed) removeElem(i[1], gameState.enemies);

	if (gameState.enemyType != undefined && gameState.enemies.length <= 0) {
		gameState.groupDefeated = true;
		var rewards = {"food" : undefined, "happiness" : undefined};
		for (let i in rewards) {
			rewards[i] = messagesXML.getElementById(gameState.enemyType).getElementsByTagName(i + "Reward");
			if (rewards[i].length > 0) {
				rewards[i] = [Number(rewards[i][0].attributes.getNamedItem("min").nodeValue), Number(rewards[i][0].attributes.getNamedItem("max").nodeValue)];
				rewards[i] = rewards[i][0] + Math.floor((Math.random() * (rewards[i][1] - rewards[i][0])));
				modify(i, rewards[i]);
			}
			else rewards[i] = undefined;
		}
		signalVictory(gameState.enemyType, rewards["food"], rewards["happiness"]);
		gameState.enemyType = undefined;
	}
}




function addEnemies(chance) {
	if (gameState.setup.tribe == "easy mode") return;
	chance += gameState.yearsWithoutEnemies * 0.04;
	if (Math.random() > chance) return;

	var possibleNew = [];
	var enemyPower;
	var oldEnemies = gameState.enemies;
	for (let i=1; i<=gameState.wheel.length; i+=1) {
		for (let j of possibleEnemies[String(i)]) {
			possibleNew.push(j);
		}
	}
	var currentPower = 0;
	for (let i=0; i<gameState.enemies.length; i+=1) {
		currentPower += Number(prodsXML.getElementById(gameState.enemies[i]).attributes.getNamedItem("danger").nodeValue) + i;
	}
	newPower = (Math.random() + 0.2 + (gameState.yearsWithoutEnemies * 0.01)) * gameState.year;
	if (gameState.setup.enemyPowers == undefined) newPower = Math.floor(newPower);
	else newPower = Math.floor(newPower * gameState.setup.enemyPowers);
	if (newPower < currentPower) return;
	
	gameState.enemyType = possibleNew[Math.floor(Math.random() * possibleNew.length)];
	gameState.score += scoreRatio() * newPower;
	
	gameState.enemies = [gameState.enemyType];
	enemyPower = Number(prodsXML.getElementById(gameState.enemyType).attributes.getNamedItem("danger").nodeValue);
	while (newPower >= 0) {
		newPower -= gameState.enemies.length + enemyPower;
		gameState.enemies.push(gameState.enemyType);
	}
	signalNewEnemies(gameState.enemyType, gameState.enemies.length, oldEnemies);
}

function changeYear() {
	gameState.year += 1;
	var temp;
	for (let i of gameState.techs) {
		if ((i[0] == "Menhir") && i[2] > 0 && (gameState.happiness < 0)) {
			temp = gameState.happiness;
			gameState.happiness = Math.min(gameState.happiness + i[2], 0);
			addLog("The " + randChoice(["stern", "immutable", "blind", "stubborn"]) + " menhir" + quantityS(i[2]) + " " + randChoice(["calmly", "gently", "quietly"]) + " " + randChoice([
				"question" + quantityS(2/i[2]) + " the " + randChoice(["void", "sky", "stars", "clouds"]),
				"soothe" + quantityS(2/i[2]) + " the " + randChoice(["grieving", "lost", "sad", "desperate"])
			]) + " (+" + (gameState.happiness - temp) + "{happyGood})");
		}
	}
	
	temp = [0, 0];
	for (let i of gameState.techs) {
		if (i[0] == "Shrine") {
			for (let j=0; j<i[2]; j+=1) {
				if ((gameState.food > maxFood()) && (gameState.happiness < maxHappiness())) {
					temp[0] += modify("food", -1)[1];
					temp[1] += modify("happiness", 1, "rebound")[1];
				}
			}
		}
	}
	if (temp[0] != 0) addLog("At new year, people go to the shrine" + quantityS(-temp[0]) + " and gift leftovers in hope for " + randChoice(["luck", "good fortune", "success", "boons", "presents", "protection"]) + " (" + temp[0] + "{foodStorage}, +" + temp[1] + "{happyGood})");
	
	var consume = popTotal();
	addLog("End of year : " + consume + " populations need to eat");
	temp = [gameState.food, gameState.happiness];
	gameState.food -= consume;
	if (gameState.food < 0) {
		gameState.happiness += gameState.food;
		gameState.food = 0;
	}
	addLog((temp[0] - gameState.food) + " {foodStorage} consumed");
	if (gameState.happiness < temp[1]) addLog("Not enough food ! " + (temp[1] - gameState.happiness) + " {happyGood} lost");
	else if (gameState.food > maxFood()) {
		temp = gameState.food;
		gameState.food = maxFood();
		addLog((temp - gameState.food) + " {foodStorage} became stale and got wasted");
		gameState.wastedFood = true;
	}
	if (gameState.happiness < Math.min(0, newPopThreshold()))  {
		temp = losePop();
		addLog("{happyBad}People are unhappy ! 1 population in " + temp + " " + randChoice(["disbanded and left", "rejected the ways of the tribe and went on its own way", "joined another tribe", "couldn't make it to the next year", "let itself wither away", "was decimated by a plague", "was torn apart by a series of vendetta", "took desperate measures to placate the higher forces leading its fate. " + randChoice(["That didn't end well", "It stopped at its total destruction", "It only precipitated its demise"]), "didn't pay attention to its water source being polluted by " + randChoice(["lead", "mercury", "arsenic", "germs"]) + " before it was too late"]));
	}
}

function newYear() {
	if (gameState.year > 1) {
		if (gameState.setup.enemyChance != undefined) addEnemies(gameState.setup.enemyChance);
		else addEnemies(ENEMY_CHANCE);
		if (gameState.enemyType == undefined) gameState.yearsWithoutEnemies += 1;
		else gameState.yearsWithoutEnemies = 0;
		if (gameState.setup.additionalEnemies != undefined) for (let i of gameState.setup.additionalEnemies) gameState.enemies.push(i);
	}
	
	gameState.yearlyMaxHappiness = 0;
	gameState.yearlyMaxFood = 0;
	gameState.yearlyMaxInnovations = 0;
	gameState.yearlyPopThreshold = 0;
	gameState.yearlyHuntFood = 0;
	gameState.baseWheatValue = 1;
	gameState.yearlyTechs = [];

	var fullyRecovered = 0;
	for (let i=gameState.techs.length-1; i>=0; i-=1) {
		if (gameState.techs[i][0] == "Slow Recovery") {
			fullyRecovered += gameState.techs[i][1];
			gameState.techs.splice(i, 1);
		}
	}
	for (let i=0; i<fullyRecovered; i+=1) {
		gainTech(gameState.techs, "Leisure");
	}

	if (gameState.setup.weather != undefined) var possibleWeather = gameState.setup.weather;
	else var possibleWeather = WEATHER;
	gameState.yearlyWeather = possibleWeather[Math.floor(Math.random() * possibleWeather.length)];
	gameState.actions = actionsPerYear();
	
	gameState.score += scoreRatio() * popTotal();
	recordYear();

	gameState.groupDefeated = false;
	gameState.popKilled = 0;
}

function recordYear() {
	var yearRecord = {
		food : gameState.food,
		happiness : gameState.happiness,
		population : popTotal(),
		innovations : innovationTotal(),
		groupDefeated : gameState.groupDefeated,
		nbEnemies : gameState.enemies.length
	};
}




function updateRoster() {	
	gameState.alteredCosts = {};
	gameState.permanentBonuses = [];
	gameState.cantAbandon = [];

	gameState.roster = [];
	if (gameState.setup.lands != undefined) for (let i of gameState.setup.lands) gameState.roster.push(i);
	else for (let i of LANDS) gameState.roster.push(i);
	gameState.roster.push(gameState.yearlyWeather);
	for (let i of gameState.enemies) {
		gameState.roster.push(i);
	}
	if (gameState.setup.hiddenTechs != undefined) for (let i of gameState.setup.hiddenTechs) addTech(gameState.yearlyTechs, i);
	
	var techsChanged = false;
	var changed = true;
	var paid;
	for (let i of gameState.yearlyTechs.concat(gameState.techs)) {
		i[2] = 0;	
	}
	var tmp_ros;
	var tmp_techXML;
	var q;
	while (changed) {
		changed = false;
		for (let i of gameState.yearlyTechs.concat(gameState.techs)) {
			if (i[2] >= i[1]) continue;
			tmp_ros = gameState.roster.slice();
			paid = true;
			tmp_techXML = techsXML.getElementById(i[0]);
			for (let j of tmp_techXML.getElementsByTagName("consumes")) {
				if (!removeElem(j.childNodes[0].nodeValue, gameState.roster)) {
					paid = false;
					break;
				}
			}
			if (paid) {
				changed = true;
				for (let j of tmp_techXML.getElementsByTagName("produces")) {
					gameState.roster.push(j.childNodes[0].nodeValue);
				}
				for (let j of tmp_techXML.getElementsByTagName("alterCost")) {
					for (let k of j.attributes.getNamedItem("combo").nodeValue.split("|")) {
						for (let l of j.childNodes[0].nodeValue.split("|")) {
							q = Number(j.attributes.getNamedItem("q").nodeValue);
							if (gameState.alteredCosts[k] == undefined) gameState.alteredCosts[k] = {};
							if (gameState.alteredCosts[k][l] == undefined) gameState.alteredCosts[k][l] = q;
							else gameState.alteredCosts[k][l] += q;
						}
					}
				}
				for (let j of tmp_techXML.getElementsByTagName("bonus")) {
					gameState.permanentBonuses.push([j.childNodes[0].nodeValue, Number(j.attributes.getNamedItem("q").nodeValue)]);
				}
				for (let j of tmp_techXML.getElementsByTagName("cantAbandon")) {
					gameState.cantAbandon = gameState.cantAbandon.concat(j.childNodes[0].nodeValue.split("|"));
				}
				i[2] += 1;
				break;
			}
			else gameState.roster = tmp_ros;
		}
	}
	for (let i=gameState.roster.length-1; i>=0; i-=1) {
		if (prodsXML.getElementById(gameState.roster[i]).attributes.getNamedItem("hidden") != null) gameState.roster.splice(i, 1);
	}
	for (let i=gameState.techs.length-1; i>=0; i-=1) {
		if (gameState.techs[i][0] == "Slow Recovery") {
			for (let j=gameState.techs[i][2]; j<gameState.techs[i][1]; j+=1) {
				techsChanged = true;
				remTech(gameState.techs, i);
			}
		}
	}
	if (techsChanged) signalTechChanged();
	shuffleArray(gameState.roster);

	signalRosterChanged();
	
	phase = "new_roll";
}

function rollWheel() {
	for (let i of gameState.wheel) {
		if (i.prodRef == undefined) {
			i.prodRef = Math.floor(Math.random() * gameState.roster.length);
		}
	}
	
	previewDone = false;
	signalWheelForget();
	signalStandBy();

	if (popTotal() <= 0) {
		signalGameOver();
		return;
	}

	if (gameState.sentineleseUnlock === true) if (tryBestScore("sentinelese tribe", 0)) signalTribeUnlocked("sentinelese tribe");
	gameState.sentineleseUnlock = false;
	if (discoveredCombos.length >= 44) if (tryBestScore("palawa tribe", 0)) signalTribeUnlocked("palawa tribe");
	if (gameState.food >= 100) if (tryBestScore("anangu tribe", 0)) signalTribeUnlocked("anangu tribe");
	if (gameState.levelUp > 1) signalLevelUp(gameState.levelUp);
	gameState.levelUp = 0;
	autosave = storeGame();
}




function abilities(actuProd, loc) {
	var args;
	var actuLoc;
	var specialLog;
	var hasEffect = false;
	if (typeof loc == "number") actuLoc = actualReel(loc, 0);
	else actuLoc = loc;
	for (let i of actuProd.childNodes) {
		if (i.nodeType != 1) continue;
		if (i.tagName == "br") continue;
		if (i.tagName == "describe") continue;

		args = [i.childNodes[0].nodeValue];
		for (j of i.attributes) {
			args.push(j.nodeValue);
		}
		args.push(loc);
		returned = window[i.tagName](...args);
		if (returned == undefined) continue;
		hasEffect = true;

		specialLog = i.attributes.getNamedItem("log");
		if (specialLog != null) addLog(specialLog.nodeValue);
		else if (window[i.tagName].log != undefined) {
			addLog(window[i.tagName].log(actuLoc, returned));
		}
	}

	var actuName = actuProd.attributes.getNamedItem("id");
	if (actuName == null) return hasEffect;

	actuName = actuName.nodeValue;
	var line;
	if (actuProd.tagName == "land") {
		for (let i=0; i<gameState.techs.length; i+=1) {
			if (gameState.techs[i][0] == "Ambush" && gameState.techs[i][2] > 0) {
				line = "";
				neutralize("enemy", 100, "wheel", "Ambush");
				if (gameState.neutralized["Ambush"] != undefined) {
					line += neutralize.log("Tally :", gameState.neutralized["Ambush"]);
				}
				vanquish("enemy", 100, "wheel", "Ambush");
				if (gameState.vanquished["Ambush"] != undefined) {
					line = line.slice(0, -1) + vanquish.log(", ", gameState.vanquished["Ambush"]);
				}
				if (line.length > 0) {
					abandonTech(i);
					addLog("Hidden in the " + actuName.toLowerCase() + ", tbe tribesfolk take the enemies by surprise ! " + line);
					return true;
				}
				break;
			}
		}
	} else if (actuName == "Tower" && nbActiveTech("Garrison") > 0) {
		line = "";
		neutralize("enemy", 2, "sides", "Garrison");
		if (gameState.neutralized["Garrison"] != undefined) {
			line += neutralize.log("Tally :", gameState.neutralized["Garrison"]);
		}
		vanquish("enemy", 2, "sides", "Garrison");
		if (gameState.vanquished["Garrison"] != undefined) {
			line = line.slice(0, -1) + vanquish.log(", ", gameState.vanquished["Garrison"]);
		}
		if (line.length > 0) {
			addLog("The garrison shoots from the tower ! " + line);
			return true;
		}
	}

	return hasEffect;
}

function tryRecycle() {
	if (gameState.actions > 0) {
		gameState.actions -= 1;
		refundSteps();
		signalWheelSpin();
		phase = "new_roll|recycle";
	} else {
		initializeTurn();
		processTurn();
	}
}

function initializeTurn() {
	nonDeterministicPhases = [];
	donePhases = [];
	phase = "combo";
		for (let i of gameState.wheel) i.usedForCombo = false;
	if (computingPreview()) {
		previewSaves = {};
		if (gameState.actions <= 0) resetActionLog(YEAR_PHASES);
		else resetActionLog(COMMON_PHASES);
	}
}

function processTurn() {
	resetAllReels();
}

function resetTurn() {
	gameState.neutralized = {};
	gameState.vanquished = {};
	gameState.killed = [];
	gameState.sanctuaryTime = false;
}





