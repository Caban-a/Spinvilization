var JAR_BLOCK = "jarBlock";


function addList(list, elem, min, max) {
	min = Number(min);
	max = Number(max);
	var q = min + Math.floor(Math.random() * (max - min));
	if (window[list] != undefined) list = window[list];
	else list = gameState[list];
	for (let i=0; i<q; i+=1) list.push(elem);
	return [elem, q];
}
addList.describe = function(list, elem, min, max) {
	if (min == max) return ["Adds " + min + " {" + elem + "} to " + list];
	return ["Adds between " + min + " and " + max + " {" + elem + "} to " + list];
}
addList.log = function(caller, returned) {
	return caller + " : " + returned[1] + " " + returned[0] + " appeared";
}

function losePop(chosen) {
	if (chosen == undefined || chosen == "any") {
		var tmp_tec = [];
		for (let i of gameState.techs) {
			if (techsXML.getElementById(i[0]).tagName == "activity") {
				for (let j=0; j<i[1]; j+=1) {
					tmp_tec.push(i[0]);
				}
			}
		}
		chosen = tmp_tec[Math.floor(Math.random() * tmp_tec.length)];
		if (unforeseeable()) unforeseen();
	}
	for (let i=0; i<gameState.techs.length; i+=1) {
		if (gameState.techs[i][0] == chosen) {
			remTech(gameState.techs, i);
			break;
		}
	}
	gameState.popKilled += 1;
	signalTechChanged(chosen);
	return chosen;
}
losePop.describe = function(chosen) {
	var line = "Lose 1 population";
	if (chosen != undefined && chosen != "any") line += " in " + chosen;
	return [line];
}
losePop.log = function(caller, returned) {
	return caller + " : You lost 1 population in " + returned + " !";
}

function tech(techName, attrib) {
	var newTech = techsXML.getElementById(techName);
	if (newTech.tagName == "activity" && attrib != "newPopIn") signalReplaceTech(techName);
	else if (attrib == "yearly") addTech(gameState.yearlyTechs, techName);
	else if (innovationTotal() < maxInnovations()) {
		if (attrib == "newPopIn") addLog("1 population was recovered and slowly heals in " + techName);
		else addLog("Gained the " + techName + " innovation");
		gainTech(gameState.techs, techName);
	}
	else signalReplaceTech(techName);
}
tech.describe = function(techName, yearly) {
	if (yearly == "yearly") return [];
	return ["Gain " + techName + " :"].concat(techTipText(techName));
}

function levelUp(newLvl, caller) {
	newLvl = Number(newLvl);
	if (gameState.wheel.length >= newLvl) return 0;
	while (gameState.wheel.length < newLvl) gameState.wheel.push(newReel());
	gameState.levelUp = newLvl;
	signalWheelChanged();
	return newLvl;
}
levelUp.describe = function(newLvl) {
	var line = "Progress to AGE " + newLvl;
	if (gameState.wheel.length >= newLvl) line = "#AAAAAA" + line;
	return [line];
}
levelUp.log = function(caller, returned) {
	if (returned == 0) return;
	return "The tribe made a leap forward ! Age " + returned + " begins";
}

function modify(toModify, q, type) {
	if (typeof q == "string") q = Number(q);
	if (toModify == "happiness") {
		var toReturn = ["happiness", gameState.happiness, 1];
		if (type == "rebound" && gameState.happiness < 0) {
			q *= rebound();
			toReturn[2] = rebound();
		}
		gameState.happiness = Math.min(gameState.happiness + q, Math.max(gameState.happiness, maxHappiness()));
		toReturn[1] = gameState.happiness - toReturn[1];
	}
	else if (toModify == "food") {
		var toReturn = ["food", gameState.food, 0];
		if (type == "hunt") {
			for (let i of gameState.techs) {
				if (i[0] == "Totem") {
					q += i[2];
					toReturn[2] += i[2];
				}
			}
			q += gameState.yearlyHuntFood;
			addTech(gameState.yearlyTechs, "yearlyHuntProduct");
		}
		else if (type == "steal" && nbActiveTech("Granary") > 0 && nbIn("Jar", actualWheel()) > 0) return JAR_BLOCK;
		gameState.food = Math.max(gameState.food + q, 0);
		toReturn[1] = gameState.food - toReturn[1];
	}
	else {
		var toReturn = [toModify, q];
		if (gameState[toModify] != undefined) gameState[toModify] += q;
		else window[toModify] += q;
	}
	return toReturn;
}
modify.describe = function(toModify, q) {
	var line = sign(q) + q;
	if (toModify == "happiness") line += "{happyGood}";
	else if (toModify == "food") line += "{foodStorage}";
	else  line += " " + toModify;
	if (arguments[2] == "rebound") line += " (*" + rebound() + " if {happyGood} < 0)";
	else if (arguments[2] == "rebound_general") line += " (*3 if {happyGood} < 0)";
	return [replaceVarNames(line)];
}
modify.describe_general = function(toModify, q) {
	if (arguments[2] == "rebound") return modify.describe(toModify, q, "rebound_general");
	return modify.describe(toModify, q);
}
modify.log = function(caller, returned) {
	if (returned == JAR_BLOCK) return caller + " couldn't find food{foodStorage} hidden in jars ({Jar} prevented food theft)";
	
	var textMsg = caller + " : " + sign(returned[1]) + returned[1];
	if (returned[0] == "happiness") {
		textMsg += "{happyGood}";
		if (returned[2] > 1) textMsg += ", bringing comfort in those " + randChoice(["dark", "dire", "tough", "hard"]) + " times (*" + returned[2] + " bonus)";
	} else if (returned[0] == "food") {
		textMsg += "{foodStorage}";
		if (returned[2] > 0) textMsg += " (" + returned[2] + " gained thanks to Totem" + quantityS(returned[2]) + ")";
	} else textMsg +=  " " + returned[0];
	return replaceVarNames(textMsg);
}

function vnDescribe(targetType, q, loc, prodLoc, prefix) {
	var line = prefix + " " + q + " ";
	var targets = targetType.split("|");
	for (let i=0; i < targets.length - 2; i+=1) {
		line += targets[i] + ", ";
	}
	if (targets.length > 1) line += targets[targets.length - 2] + " or ";
	line += targets[targets.length - 1] + " " + {
		"wheel" : "on the wheel",
		"adj_left" : "on the reel to its left",
		"adj_right" : "on the reel to its right",
		"adjacent" : "on an adjacent reel",
		"sides" : "on the side reels",
		"roster" : "in the roster"}[loc];
	return [line];
}
function vnLog(caller, beaten, actionVerb) {
	var tally = [];
	for (let j of beaten) tally.push(j[1]);
	if (!isNaN(caller)) caller = actualReel(Number(caller), 0);
	return caller + " " + actionVerb + " " + stringMultipleInText(tally, ", ", " and ") + "!";
}

function vanquish(targetType, q, loc, prodLoc) {
	if (gameState.sanctuaryTime) return;
	var beaten = targetEnemies(targetType, Number(q), loc, prodLoc, enemyVanquished);
	for (let i of beaten) {
		addTech(gameState.yearlyTechs, "yearlyVanquishProduct");			
	}
	if (beaten.length > 0) gameState.vanquished[prodLoc] = beaten;
}
vanquish.describe = function(targetType, q, loc, prodLoc) {
	return vnDescribe(targetType, q, loc, prodLoc, "Vanquish");
}
vanquish.log = function(caller, returned) {
	return vnLog(caller, returned, "vanquished");
}

function neutralize(targetType, q, loc, prodLoc) {
	var beaten = [];
	for (let i of targetEnemies(targetType, Number(q), loc, prodLoc, enemyNeutralized)) {
		if (enemyNeutralized(i[0])) continue;
		beaten.push(i);
		signalNeutralized(i[0]);
	}
	if (beaten.length > 0) {
		gameState.neutralized[prodLoc] = beaten;
		return beaten;
	}
}
neutralize.describe = function(targetType, q, loc, prodLoc) {
	return vnDescribe(targetType, q, loc, prodLoc, "Neutralize");
}
neutralize.log = function(caller, returned) {
	return vnLog(caller, returned, "neutralized");
}


function devour(q) {
	if (gameState.food > 0) return modify("food", q, "steal");
	else return losePop();
}
devour.describe = function(q) {
	return ["If {foodStorage} > 0, " + q + "{foodStorage}", "Else, lose 1 population{popGlobal}"];
}
devour.log = function(caller, returned) {
	if (returned == JAR_BLOCK) return "Jar{Jar} prevented " + caller + " from stealing food !";
	if (typeof returned == "string") return caller + " devoured 1 population in " + returned + " !";
	return caller + " stole " + Math.abs(returned[1]) + " food{foodStorage} !";
}

function special(specialEffectName) {
	return [specialEffectName, window[specialEffectName]()];
}
special.describe = function(specialEffectName) {
	return window[specialEffectName].describe();
}
special.describe_general = function(specialEffectName) {
	if (window[specialEffectName].describe_general != undefined) return window[specialEffectName].describe_general();
	return window[specialEffectName].describe();
}
special.log = function(caller, returned) {
	return window[returned[0]].log(caller, returned[1]);
}

function spNewPop() {
	gainTech(gameState.techs, "Leisure");
}
spNewPop.describe = function() {
	return ["Gain 1 new population{popLeisure}in Leisure"];
}
spNewPop.log = function() {
	if (Math.random() < 0.5) return "Welcome, newcomers !";
	return "A " + randChoice(["new", "fresh"]) + " population joins the tribe";
}

function spVision() {
	modify("happiness", -2);
	resetAllReels();
	signalWheelSpin();
	phase = "new_roll|recycle";
	freeAction = true;
}
spVision.describe = function() {
	return ["-2{happyGood}", "Reroll all reels, for free"];
}
spVision.log = function() {
	return "A" + randomPerson() + " of the tribe went alone in the forest and had a vision...";
}

function spBirdHunt() {
	return modify("food", nbIn("Game", gameState.roster)*6, "hunt");
}
spBirdHunt.describe = function() {
	return spBirdHunt.describe_general().concat([nbIn("Game", gameState.roster) + " {Game} in roster -> +" + nbIn("Game", gameState.roster)*6 + "{foodStorage}"]);
}
spBirdHunt.describe_general = function() {
	return ["+6{foodStorage} for each {Game} in the roster"];
}
spBirdHunt.log = function(caller, returned) {
	return modify.log(caller, returned);
}

function spFruit() {
	return modify("food", fruitValue());
}
spFruit.describe = function() {
	return ["+" + fruitValue() + "{foodStorage}"];
}
spFruit.log = function(caller, returned) {
	return modify.log(caller, returned);
}

function spFireside() {
	var nbVanquished = nbActiveTech("yearlyVanquishProduct");
	return [modify("happiness", 3 + (4 * nbVanquished))[1], nbVanquished];
}
spFireside.describe = function() {
	var gain = nbActiveTech("yearlyVanquishProduct");
	return spFireside.describe_general().concat([gain + " enemies vanquished -> +" + (3 + (4 * gain)) + " {happyGood}"]);
}
spFireside.describe_general = function() {
	return ["+3{happyGood}", "+4 additional {happyGood} for each enemy vanquished this year"];
}
function firesideStoryBit() {
	return randChoice(["giants", "ogres", "horror", "terror", "perils", "shadows", "spirits", "heroes", "fame", "courage", "bravery", "craft", "unknown", "wonder", "love"]);
}
spFireside.log = function(caller, returned) {
	var txtMsg = "The " + randChoice(["ancients", "elderly", "warriors"]) + " tell a legend of " + firesideStoryBit();
	for (let i=1; i<Math.min(returned[1], 5); i+=1) {
		txtMsg += " and " + randChoice([]);
	}
	if (returned[1] > 5) txtMsg += " and...";
	txtMsg += " (+" + returned[0] + "{happyGood}";
	return txtMsg;
}

function spFolksong() {
	return modify("happiness", nbDifferentActivities());
}
spFolksong.describe = function() {
	var gain = nbDifferentActivities();
	return spFolksong.describe_general().concat([gain + " different activities -> +" + gain + " {happyGood}"]);
}
spFolksong.describe_general = function() {
	return ["+1{happyGood} for each different activity"];
}
spFolksong.log = function(caller, returned) {
	return "A popular song emerges among the craftspeople (+" + returned[1] + "{happyGood})";
}

function spRootJuice() {
	return modify("food", 1 + nbIn("Forest", actualWheel()));
}
spRootJuice.describe = function() {
	return spRootJuice.describe_general().concat([nbIn("Forest", actualWheel()) + "{Forest} on the wheel -> +" + (1 + nbIn("Forest", actualWheel())) + "{foodStorage}"]);
}
spRootJuice.describe_general = function() {
	return ["+1{foodStorage}", "+1 additional {foodStorage} for each {Forest} on the wheel"];
}
spRootJuice.log = function(caller, returned) {
	return "When there's nothing to eat, there's always root juice ! (+" + returned[1] + "{foodStorage})";
}

function spSanctuary() {
	gameState.sanctuaryTime = true;
	return neutralize("enemy", 100, "wheel");
}
spSanctuary.describe = function() {
	return ["All enemies are neutralized", "Enemies can't be vanquished"];
}
spSanctuary.log = function(caller, returned) {
	return "The tribespeople go hide in a secret sacred place. " + neutralize.log(caller, returned);
}

function spSummerCeremony() {
	return [
		modify("happiness", gameState.actions)[1],
		modify("yearlyPopThreshold", -gameState.actions)[1]
	]
}
spSummerCeremony.describe = function() {
	return spSummerCeremony.describe_general().concat([gameState.actions + " actions remaining", "+" + gameState.actions + "{happyGood}", "-" + gameState.actions + " " + replaceVarNames("yearlyPopThreshold")]);
}
spSummerCeremony.describe_general = function() {
	return ["+1{happyGood} for each action remaning", "-1 " + replaceVarNames("yearlyPopThreshold") + " for each action remaining"];
}
spSummerCeremony.log = function(caller, returned) {
	"A group of tribesfolk celebrate the Summer solstice by blessing the crops (+" + returned[0] + "{happyGood}" + ", " + sign(returned[1]) + returned[1] + " " + replaceVarNames("yearlyPopThreshold") + ")";
}

function spWinterCeremony() {
	var temp = modify("happiness", -gameState.actions);
	var toReturn = modify("happiness", 5, "rebound");
	toReturn[1] += temp[1];
	return toReturn;
}
spWinterCeremony.describe = function() {
	if (gameState.happiness >= gameState.actions) var total = 5 - gameState.actions;
	else var total = (5 * rebound()) - gameState.actions;
	return ["-1{happyGood} for each action remaining", "+5{happyGood} (*" + rebound() + " if {happyGood} < 0)", gameState.actions + " actions remaining -> " + sign(total) + total + "{happyGood}"];
}
spWinterCeremony.describe_general = function() {
	return ["-1{happyGood} for each action remaining", "+5{happyGood} (*3 if {happyGood} < 0)"];
}
spWinterCeremony.log = function(caller, returned) {
	var textMsg = "A group of tribesfolk celebrate the Winter solstice... (" + sign(returned[1]) + returned[1] + "{happyGood})";
	if (returned[2] > 1) textMsg += " ...for the night is dark and full of terrors (*" + returned[2] + " bonus)";
	return textMsg;
}

function spCrop() {
	for (let i of actualWheel()) {
		if (prodsXML.getElementById(i).tagName == "weather" || prodsXML.getElementById(i).attributes.getNamedItem("trample") != null) {
			addTech(gameState.yearlyTechs, "yearlyAntiCrop");
			return i;
		}
	}
	addTech(gameState.yearlyTechs, "yearlyCrop");
	return true;
}
spCrop.describe = function() {
	return ["If there is {Drought}, {Frost}, {Storm}, {Raider} or {War Elephant} on the wheel, -1{Crop} for the year", "Otherwise, +1{Crop} for the year"];
}
spCrop.log = function(caller, returned) {
	if (typeof returned == "string") {
		if (prodsXML.getElementById(returned).tagName == "weather") return "The " + randChoice(["bad", "terrible"]) + " " + returned.toLowerCase() + " decimated the crops (-1{Crop} for the year)";
		return returned + " trampled the crops to shreds ! (-1{Crop} for the year)";
	}
	return "The crops seem to be growing well this year (+1{Crop} for the year)";
}

function harvest(cropValue) {
	var nbCrop = nbIn("Crop", gameState.roster);
	var toSeed = 0;
	gameState.yearlyTechs.push(["yearlyAntiCrop", nbCrop]);
	for (let i=0; i<nbActiveTech("Seed Oil", true) - nbActiveTech("Seed Oil"); i+=1) {
		if (nbCrop >= 3) {
			gameState.yearlyTechs.push("yearlyHarvestProduct");
			nbCrop -= 3;
			toSeed += 1;
		}
	}
	return [modify("food", nbCrop * cropValue)[1], toSeed];
}
harvest.describe = function(cropValue) {
	return ["Remove all {Crop} from the roster", "Gain " + cropValue + " {foodStorage} for each {Crop} removed"];
}
harvest.log = function(caller, returned) {
	var txtMsg = "Harvested all the crops for " + returned[0] + "{foodStorage}";
	if (returned[1] > 0) txtMsg += " and " + returned[1] + " seed oil" + quantityS(returned[1]) + " " + quantityWere(returned[1]) + " created";
	return txtMsg;
}

function spHarvestBarley() {
	return harvest(2);
}
spHarvestBarley.describe = function() {return harvest.describe(2)}
spHarvestBarley.log = function(caller, returned) {return harvest.log(caller, returned)}

function spHarvestMaize() {
	return harvest(5);
}
spHarvestMaize.describe = function() {return harvest.describe(5)}
spHarvestMaize.log = function(caller, returned) {return harvest.log(caller, returned)}

function spCallToArms() {
	signalReplaceTech(0);
}
spCallToArms.describe = function() {
	return ["Abandon any activities you want", "For each activity abandoned, vanquish an enemy in the roster"];
}
spCallToArms.log = function() {return "Tribespeople are marching to eradicate their enemies !"}




