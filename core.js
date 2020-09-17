var LANDS = ["Forest", "Mountain"];
var WEATHER = ["Storm", "Frost", "Drought"];
var BASE_ACTIONS = 8;
var BASE_MAX_FOOD = 10;
var BASE_MAX_HAPPINESS = 10;
var DANGER_RATIO = 1.2;
var DANGER_BASE = 3;
var ENEMY_CHANCE = 0.25;
var INNOVATIONS_PER_AGE = 10;

var TRIBES = {
	EASY1 : {
		tribe : "easy mode",
		difficulty : "easy",
		describe : "Start here",
		detail : "12 actions per year, no enemies",
		baseActions : 12,
		forbiddenCombos : ["Stone Throw", "Hall of Champions", "Ambush", "Garrison"],
		scoreMultiplier : 0
	},
	EASY2_SENTINELESE : {
		tribe : "sentinelese tribe",
		difficulty : "easy",
		describe : "Few dare bother you",
		detail : "10 actions per year, less enemies",
		unlock : "Discover the Arrow to unlock",
		enemyPowers : 0.5,
		baseActions : 10,
		scoreMultiplier : 0.5
	},
	NORMAL1 : {
		tribe : "normal mode",
		difficulty : "normal",
		describe : "Standard game",
		detail : "10 actions per year",
		unlock : "Reach Age 4 to unlock",
		baseActions : 10
	},
	NORMAL2_PALAWA : {
		tribe : "palawa tribe",
		difficulty : "normal",
		describe : "Less space to develop",
		detail : "Only 5 Innovation points per Age",
		unlock : "Discover 44 combos to unlock",
		innovationsPerAge : 5,
		baseActions : 10,
		scoreMultiplier : 2
	},
	HARD1 : {
		tribe : "hard mode",
		difficulty : "hard",
		describe : "Challenging",
		detail : "8 actions per year",
		unlock : "Win a game in Normal difficulty to unlock",
		scoreMultiplier : 2
	},
	HARD2_INUIT : {
		tribe : "inuit tribe",
		difficulty : "hard",
		describe : "Extra frosty",
		detail : "Tough weather",
		unlock : "Win a game in Normal difficulty without ever wasting food to unlock",
		lands : ["Forest", "Mountain", "Frost"],
		hiddenTechs : ["setupInuit"],
		scoreMultiplier : 3
	},
	HARD3_MAYANS : {
		tribe : "mayan tribe",
		difficulty : "hard",
		describe : "A set place for everyone",
		detail : "Try abandoning an activity an you'll see...",
		scoreMultiplier : 3
	},
	VERY_HARD1 : {
		tribe : "very Hard mode",
		difficulty : "very hard",
		describe : "Outlandish",
		detail : "6 actions per year",
		unlock : "Win a game in Hard difficulty to unlock",
		baseActions : 6,
		scoreMultiplier : 4
	},
	VERY_HARD2_ANANGU : {
		tribe : "anangu tribe",
		difficulty : "very hard",
		describe : "Sacred Mountain is off limits",
		detail : "8 actions per year, only Forest !",
		unlock : "Have 100 food in Normal difficulty to unlock",
		lands : ["Forest"],
		scoreMultiplier : 4
	},
	VERY_HARD3_SABINES : {
		tribe : "sabine tribe",
		difficulty : "very hard",
		describe : "Face the wolves of Rome",
		detail : "8 actions per year, wolves come relentlessly every year",
		additionalEnemies : ["Wolf"],
		scoreMultiplier : 5
	}
}

var gameState;
var autosave;
var previewSaves;
var gameLog;

var prodsXML;
var prods = {};
var techXML;
var replacingTech;
var messagesXML;
var combos;
var possibleEnemies = {"1":[], "2":[], "3":[], "4":[], "5":[]};

var freeAction;

function storeGame() {
	return JSON.stringify(gameState);
}

function copyGame(original) {
	gameState = original;
	signalRosterChanged();
	signalWheelChanged();
	signalTechChanged();
}

function retrieveGame(stored) {
	copyGame(JSON.parse(stored));
}

function permanentBonus(affected) {
	var totalBonus = 0;
	for (let i of gameState.permanentBonuses) {
		if (i[0] == affected) {
			totalBonus += i[1];
		}
	}
	return totalBonus;
}

function difficultyRatio(_setup) {
	if (_setup == undefined) _setup = gameState.setup;
	if (_setup.scoreMultiplier == undefined) return 1;
	return _setup.scoreMultiplier;
}

function scoreRatio() {
	return Math.ceil(difficultyRatio() * gameState.year * gameState.wheel.length);

}

function maxFood(fixedOnly) {
	var temp = permanentBonus("maxFood");
	if (gameState.setup.baseMaxFood != undefined) temp += gameState.setup.baseMaxFood;
	else temp += BASE_MAX_FOOD;
	if (fixedOnly === true) return temp;
	return temp + gameState.yearlyMaxFood;
}

function maxHappiness(fixedOnly) {
	var temp = permanentBonus("maxHappiness") + (permanentBonus("pictogramsMaxHappiness") * nbDifferentElems(gameState.roster));
	if (gameState.setup.baseMaxHappiness != undefined) temp += gameState.setup.baseMaxHappiness;
	else temp += BASE_MAX_HAPPINESS;
	if (fixedOnly === true) return temp;
	return temp + gameState.yearlyMaxHappiness;
}

function actionsPerYear() {
	if (gameState.setup.baseActions != undefined) return gameState.setup.baseActions + permanentBonus("actions");
	else return BASE_ACTIONS + permanentBonus("actions");
}

function rebound() {
	return 3 + permanentBonus("rebound");
}

function countTech(activityOk, innovationOk, leisureOk, activeOk, inactiveOk) {
	var cmp = 0;
	for (let i of gameState.techs) {
		if ((techsXML.getElementById(i[0]).tagName == "activity" && activityOk) || (techsXML.getElementById(i[0]).tagName == "innovation" && innovationOk)) {
			if (i[0] == "Leisure") {
				if(leisureOk) cmp += i[1];
			}
			else {
				if (activeOk) cmp += i[2];
				if (inactiveOk) cmp += i[1] - i[2];
			}
		}
	}
	return cmp;
}

function popTotal() {
	return countTech(true, false, true, true, true);
}

function innovationTotal() {
	return countTech(true, true, false, true, true);
}

function maxInnovations() {
	if (gameState.setup.innovationsPerAge != undefined) var ipa = gameState.setup.innovationsPerAge;
	else var ipa = INNOVATIONS_PER_AGE;
	return (gameState.wheel.length * ipa) + gameState.yearlyMaxInnovations + permanentBonus("maxInnovations");
}

function newPopThreshold() {
	return popTotal() + gameState.yearlyPopThreshold  + permanentBonus("popThreshold");
}

function fruitValue() {
		return gameState.baseFruitValue + permanentBonus("fruitValue");
}

function newReel(prodRef) {
	return {prodRef:prodRef, locked:false, steps:0, stepCost:0, usedForCombo:false, activated:false};
}

function actualReel(nb, shift) {
	if (gameState.wheel[nb].prodRef == undefined) return "spinning";
	return gameState.roster[modulo(gameState.wheel[nb].prodRef + shift, gameState.roster.length)];
}

function actualWheel() {
	var actu = [];
	for (let i=0; i<gameState.wheel.length; i+=1) {
		actu.push(actualReel(i, 0));
	}
	return actu;
}

function findTech(techList, techName) {
	for (let i=0; i<techList.length; i+=1) if (techList[i][0] == techName) return i;
}

function addTech(techList, newTech) {
	for (let i of techList) {
		if (i[0] == newTech) {
				i[1] += 1;
				return;
		}
	}
	if (newTech == "Leisure") techList.unshift([newTech, 1, 0]);
	else techList.push([newTech, 1, 0]);
	if (newTech == "Arrow") gameState.sentineleseUnlock = true;
}

function remTech(techList, pos) {
	if (techList[pos][1] > 1) {
		techList[pos][1] -= 1;
		techList[pos][2] = Math.min(techList[pos][1], techList[pos][2]);
	}
	else techList.splice(pos, 1);
}

function enemyVanquished(enemyPos) {
	for (let i in gameState.vanquished) for (let j of gameState.vanquished[i]) if (j[0] == enemyPos) return true;
	return false;
}

function enemyKilled(enemyPos) {
	for (let i of gameState.killed) if (i[0] == enemyPos) return true;
	return false;
}

function enemyNeutralized(enemyPos) {
	for (let i in gameState.neutralized) for (let j of gameState.neutralized[i]) if (j[0] == enemyPos) return true;
	return false;
}

function requiredQuantity(cName, prod, nb, alter) {
	var q = Number(nb);
	if (!alter) return Math.max(q, 0);
	for (let i of ["any", cName]) {
		if (gameState.alteredCosts[i] != undefined) {
			for (let j of ["any", prod]) {
				if (gameState.alteredCosts[i][j] != undefined) q += gameState.alteredCosts[i][j];
			}
		}
	}
	return Math.max(q, 0);
}

function extendedProd(aProd) {
	var okProds = [aProd];
	alternate = prodsXML.getElementById(aProd).attributes.getNamedItem("comboReplacedBy");
	if (alternate != undefined) {
		okProds = okProds.concat(alternate.nodeValue.split("|"));
	}
	return okProds;
}

function extendedProdNbIn(aProd, anArray) {
	var matching = 0;
	for (let i of extendedProd(aProd)) {
		matching += nbIn(i, anArray);
	}
	return matching;
}

function extendedProdEquals(aProd, targetProd) {
	for (let i of extendedProd(aProd)) {
		if (i == targetProd) return true;
	}
	return false;
}

function nbActiveTech(techName, inactiveToo) {
	nbTechs = 0;
	if (inactiveToo === true) var techStatus = 1;
	else var techStatus = 2;
	for (let i of gameState.yearlyTechs.concat(gameState.techs)) {
		if (i[0] == techName) nbTechs += i[techStatus];
	}
	return nbTechs;
}

function nbDifferentActivities() {
	nb = 0;
	for (let i of gameState.techs) {
		if (i[0] != "Leisure" && techsXML.getElementById(i[0]).tagName == "activity") nb += 1;
	}
	return nb;
}

function comboDistance(c) {
	var cName = c.attributes.getNamedItem("id").nodeValue;
	
	if (gameState.setup.forbiddenCombos != undefined) if (nbIn(cName, gameState.setup.forbiddenCombos) > 0) return Infinity;
	
	if (cName == "New Population") {
		if (gameState.happiness >= newPopThreshold()) return [0, []];
		else return [1, []];
	}
	var dist = 0;
	var distLR = 0;
	var actual = actualWheel();
	var used = [];
	var temp;
	var tempProd;
	var q;
	var tempIter = {right : gameState.wheel.length-1, left : 0};
	for (let i in tempIter) {
		temp = c.getElementsByTagName(i);
		if (temp.length > 0) {
			tempProd = temp[0].childNodes[0].nodeValue;
			if (extendedProdNbIn(tempProd, gameState.roster) <= 0) return Infinity;
			if (!extendedProdEquals(tempProd, actual[tempIter[i]])) distLR += 1;
			used.push(tempIter[i]);
		}
	}
	
	temp = c.getElementsByTagName("sequence");
	if (temp.length > 0) {
		for (let i of temp) {
			if (extendedProdNbIn(i.childNodes[0].nodeValue, gameState.roster) <= 0) return Infinity;
		}
		var seqFail;
		var seqOffset;
		var bestSequence = [];
		for (let i=0; i<=actual.length-temp.length; i+=1) {
			var seqOk = [];
			seqOffset = 0;
			for (let j=0; j+seqOffset<temp.length && i+j<actual.length; j+=1) {
				if (nbIn(i+j, used) > 0 || !extendedProdEquals(temp[j+seqOffset].childNodes[0].nodeValue, actual[i+j])) {
					if (prodsXML.getElementById(actual[i+j]).attributes.getNamedItem("noSequenceBreak") != null) seqOffset -= 1;
				}
				else seqOk.push(i + j);
			}
			if (seqOk.length > bestSequence.length) bestSequence = seqOk;
		}
		dist += temp.length - bestSequence.length;
		used = used.concat(bestSequence);

	}
	
	temp = c.getElementsByTagName("quantity");
	for (let i of temp) {
		tempProd = i.childNodes[0].nodeValue;
		q = requiredQuantity(cName, tempProd, i.attributes.getNamedItem("q").nodeValue, true);
		if (q > 0 && extendedProdNbIn(tempProd, gameState.roster) <= 0) return Infinity;
		for (let j=0; j<actual.length; j+=1) {
			if (q <= 0) break;
			if (nbIn(j, used) <= 0 && extendedProdEquals(tempProd, actual[j])) {
				q -= 1;
				used.push(j);
			}
		}
		dist += q;
	}
	
	temp = c.getElementsByTagName("only");
	if (temp.length > 0) {
		tempProd = [];
		for (let i of temp) {
			tempProd = tempProd.concat(extendedProd(i.childNodes[0].nodeValue));
		}

		var elemFromOnlyNeeded = (dist + used.length < gameState.wheel.length);
		var elemFromOnlyInRoster = false;
		for (let i of tempProd) {
			if (nbIn(i, gameState.roster) > 0) elemFromOnlyInRoster = true;
		}
		if (elemFromOnlyNeeded && (!elemFromOnlyInRoster)) return Infinity;

		for (let i=0; i<actual.length; i+=1) {
			if (nbIn(i, used) <= 0) {
				if (nbIn(actual[i], tempProd) <= 0) dist += 1;
				else used.push(i);
			}
		}
	}

	temp = c.getElementsByTagName("none");
	if (temp.length > 0) {
		tempProd = [];
		for (let i of temp) {
			tempProd.push(i.childNodes[0].nodeValue);
		}
		for (let i=0; i<actual.length; i+=1) {
			if (nbIn(i, used) <= 0 && nbIn(actual[i], tempProd) > 0) dist += 1;
		}
	}

	for (let i of c.getElementsByTagName("requires")) {
		q = i.attributes.getNamedItem("q");
		if (q != null) {
			if (gameState[i.childNodes[0].nodeValue] < Number(q.nodeValue)) dist += 1;
		}
		else if (gameState[i.childNodes[0].nodeValue] !== true) dist += 1;
	}

	return [dist + distLR, used];
}

function targetReel(reelNb) {
	return [reelNb, actualReel(reelNb, 0)];
}

function targetEnemies(targetType, q, loc, prodLoc, testCondition) {
	var targeted = [];
	if (loc == "roster") {
		for (let i of gameState.roster) {
			targeted.push([undefined, i]);
		}
	}
	if (loc == "sides") {
		targeted.push(targetReel(0));
		targeted.push(targetReel(gameState.wheel.length-1));
	}
	if ((loc == "adjacent" || loc == "adj_left") && prodLoc - 1 >= 0) {
		targeted.push(targetReel(prodLoc-1));
	}
	if ((loc == "adjacent" || loc == "adj_right") && prodLoc + 1 < gameState.wheel.length) {
		targeted.push(targetReel(prodLoc+1));
	}
	if (loc == "wheel") {
		for (let i=0; i<gameState.wheel.length; i+=1) {
			targeted.push(targetReel(i));
		}
	}
	var actualTargets = [];
	for (let i of targeted) {
		if (q <= 0) break;
		if (i[1] == "spinning") continue;
		if (i[0] != undefined) {
			if (testCondition(i[0])) continue;
		}
		if (nbIn(prodsXML.getElementById(i[1]).tagName, targetType.split("|")) <= 0 && nbIn(i[1], targetType.split("|")) <= 0) continue;
		q -= 1;
		actualTargets.push(i);
	}
	return actualTargets;
}

function gainTech(techList, newTech) {
	addTech(techList, newTech);
	signalTechChanged();
}

function abandonTech(pos, yearEnd) {
	var toRemove = gameState.techs[pos][0];
	remTech(gameState.techs, pos);
	if (techsXML.getElementById(toRemove).tagName == "activity") {
		if  (toRemove == "Slow Recovery" && yearEnd !== true) addLog("1 population died of their wounds in consequence");
		else if (gameState.setup.tribe == "Mayans") addLog("The priests of the Pyramid demanded that they be exiled to perpetuate the cosmic order");
		else return gainTech(gameState.techs, "Leisure");
	}
	signalTechChanged();
}

function resetAllReels() {
	for (let i of gameState.wheel) {
		i.steps = 0;
		i.stepCost = 0;
		i.locked = false;
		i.activated = false;
	}
}

function tryStep(column, direction, testOnly) {
	if (gameState.wheel[column].locked) return false;
	if (direction * gameState.wheel[column].steps >= 0) var checkSteps = {checkOut:0, checkIn:direction, costFactor:1};
	else var checkSteps = {checkOut:direction, checkIn:0, costFactor:-1};
	var actionCost = 1;
	var happinessCost = 0;
	var stepMods = {
		stepOut : prodsXML.getElementById(actualReel(column, checkSteps.checkOut)).attributes.getNamedItem("stepCost"),
		stepIn : prodsXML.getElementById(actualReel(column, checkSteps.checkIn)).attributes.getNamedItem("stepCost")
	};
	for (i in stepMods) {
		if (stepMods[i] != null) stepMods[i] = stepMods[i].nodeValue;
	}
	if (stepMods.stepOut == "noStepOut") return false;
	else if (stepMods.stepOut == "noStepOutIfPictograms" && nbActiveTech("Pictograms") > 0) return false;
	else if (stepMods.stepOut == "stepOutFree") actionCost = 0;
	if (stepMods.stepIn == "stepInFree") actionCost = 0;
	if (actualReel(column, checkSteps.checkIn) == "Command") happinessCost += permanentBonus("stepToCommandHappinessCost");

	if (gameState.actions - (actionCost * checkSteps.costFactor) < 0) return false;
	if (testOnly === true) return true;
	gameState.actions -= actionCost * checkSteps.costFactor;
	gameState.happiness -= happinessCost * checkSteps.costFactor;
	gameState.wheel[column].steps += direction;
	gameState.wheel[column].stepCost += actionCost * direction;
	gameState.wheel[column].prodRef = (gameState.wheel[column].prodRef + direction + gameState.roster.length) % gameState.roster.length;
	autosave = storeGame();
	signalWheelChanged();
	return true;
}

function refundSteps() {
	for (let i of gameState.wheel) {
		if (!i.locked && i.stepCost != 0) {
			gameState.actions += Math.abs(i.stepCost);
			i.stepCost = 0;
			i.steps = 0;
		}
	}	
}

function doableCombos(age, discovered) {
	if (discovered == undefined) discovered = [];
	var dists = [];
	var possibleCombo;
	var tempDist;
	for (let i=1; i<=Math.min(4, age); i+=1) {
		for (let j of combos.getElementById(i.toString()).childNodes) {
			if (j.nodeType != 1) continue;
			tempDist = comboDistance(j);
			if (tempDist == Infinity) continue;
			tempDist.unshift(j);
			if (tempDist[1] > 0) tempDist[2] = [];
			dists.push(tempDist);
		}
	}
	dists.sort(function(a,b) {
		var aNew = nbIn(a[0].attributes.getNamedItem("id").nodeValue, discovered);
		var bNew = nbIn(b[0].attributes.getNamedItem("id").nodeValue, discovered);
		if ((a[1] == 0) == (b[1] == 0) && aNew != bNew) return aNew - bNew;
		return a[1] - b[1];
	});
	return dists;
}

function effectDescriptions(actuProd, loc, general) {
	var args;
	var desc = [];
	var overrideDesc;
	for (let i of actuProd.childNodes) {
		if (i.nodeType != 1) continue;
		if (i.tagName == "br") continue;
		overrideDesc = i.attributes.getNamedItem("describe");
		if (overrideDesc != null) desc = desc.concat(overrideDesc.nodeValue.split("\n"));
		else if (i.tagName == "describe") desc = desc.concat(i.childNodes[0].nodeValue.split("\n")); 
		else {
			args = [i.childNodes[0].nodeValue];
			for (j of i.attributes) {
				args.push(j.nodeValue);
			}
			if (loc != undefined) args.push(loc);
			if (general === true && window[i.tagName].describe_general != undefined) desc = desc.concat(window[i.tagName].describe_general(...args));
			else if (window[i.tagName].describe != undefined) desc = desc.concat(window[i.tagName].describe(...args));
		}
	}
	return desc;
}

function yearScoring() {
}

function tryLock(reel) {
	if (gameState.wheel[reel].locked) {
		gameState.wheel[reel].locked = false;
		return;
	}
	if (prodsXML.getElementById(actualReel(reel, 0)).attributes.getNamedItem("noLock") != null) return;
	var maxLocks = permanentBonus("locks");
	for (let i=0; i<gameState.wheel.length; i+=1) {
		if (gameState.wheel[i].locked) maxLocks -= 1;
	}
	if (maxLocks > 0) gameState.wheel[reel].locked = true;
}

function newGame(setup) {
	gameState = {
		setup : setup,
		wheel : [newReel()],
		year : 1,
		happiness : 5,
		food : 5,
		wastedFood : false,
		techs : [["Leisure", 5]],
		permanentBonuses : [],
		score : 0,
		baseFruitValue : 1,
		levelUp : 0,
		enemies : [],
		groupDefeated : false,
		popKilled : 0,
		yearsWithoutEnemies : 0
	}

	gameState.setup.describe = undefined;
	gameState.setup.unlock = undefined;

	freeAction = false;
	gameLog = ["A new tribe arises."];
	resetTurn();
	previewDone = true;
	newYear();
	updateRoster();
	signalWheelChanged();
	phase = "new_roll|choose";
	signalTechChanged();
}

