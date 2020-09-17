var BLINK = "blink";
var NEUTRALIZED = "neutralized";
var VANQUISHED = "vanquished";

var actionPreview;
var invertArrows;



function addLog(line) {
	if (typeof line != "string") return;
	if (actionPreview && actionLogs[phase.split("|")[0]] != undefined) {
		if (!previewDone) actionLogs[phase.split("|")[0]].push(line);
	} else {
		gameLog.push(line);
		if (wheelDisplay.speed == "instant") logDisplay.blinks.push(wheelDisplay.time("tribe", "*1"));
		else logDisplay.blinks.push(wheelDisplay.time("tribe"));	
	}
}

function signalRosterChanged() {
	rosterDisplay.adjust();
}

function signalWheelChanged() {
	wheelDisplay.adjust_full();
	comboDisplay.adjust();
}

function signalComboChanged() {
	comboDisplay.adjust();
}

function signalTechChanged() {
	techDisplay.adjust();
}

function signalStandBy() {
	phase = "stand-by";
	signalWheelChanged();
}

function signalNewEnemies(chosen, q, oldEnemies) {
	var encounterText = CENTER_TEXT + "!!! ENCOUNTER !!!\n\n";
	var encounterLog = "Enemies appear : " + gameState.enemies.length + " " + gameState.enemyType + quantityS(gameState.enemies.length);
	var oldEnum = [];
	encounterText += messagesXML.getElementById(chosen).getElementsByTagName("encounter")[0].childNodes[0].nodeValue;

	if (oldEnemies.length > 0) {
		var sortedOld = {};
		for (let i of oldEnemies) {
			if (sortedOld[i] == undefined) sortedOld[i] = 1;
			else sortedOld[i] += 1;
		}
		encounterText += "\n\n";
		encounterLog += " (";
		for (let i in sortedOld) {
			encounterText += CENTER_TEXT + " -" + sortedOld[i] + "{" + i + "} ";
			oldEnum.push(sortedOld[i] + " " + i + quantityS(sortedOld[i]));
		}
		encounterLog += stringMultipleInText(oldEnum, ", ", " and ") + " leave" + quantityS(2/oldEnum.length) + ")";
	}
	addLog(encounterLog);
	
	encounterText += "\n\n" + CENTER_TEXT + "+" + q + " {" + chosen + "}";
	var encounterBox = msgTextBox(200, 50, 400, 0, encounterText, undefined, "dragged", "18px prstart", true, {col:"#FF9900", thick:5}, {col:"#FFD699", opacity:1});
	var okButton = msgTextBox(0, 0, 120, 0, CENTER_TEXT + "Ok!", encounterBox, "clickable", "18px prstart", false, {col: "#ff3300", thick:2}, {col:MY_COLORS.DARK_ORANGE, opacity:1}, {col:MY_COLORS.DARK_ORANGE_SHINE, opacity:1});
	addSubBox(encounterBox, [okButton]);
	okButton.self_click = function() {
		removeElem(this.linkedTo, gameCanvas.elems[1]);
	}
	gameCanvas.elems[1].push(encounterBox);
}

function signalVictory(chosen, foodReward, happinessReward) {
	if (unforeseeable()) {
		unforeseen();
		return;
	}
	var victoryText = CENTER_TEXT + "!!! VICTORY !!!\n\n";
	var victoryLog = "The group of " + chosen + "s has been dispatched !";
	victoryText += messagesXML.getElementById(chosen).getElementsByTagName("victory")[0].childNodes[0].nodeValue;
	victoryText += "\n REWARDS :";
	if (foodReward != undefined) {
		victoryText += "\n +" + foodReward + "{foodStorage}";
		victoryLog += " +" + foodReward + "{foodStorage}";
	}
	if (happinessReward != undefined) {
		victoryText += "\n +" + happinessReward + "{happyGood}";
		victoryLog += " +" + happinessReward + "{happyGood}";
	}
	var victoryBox = msgTextBox(130, 50, 540, 0, victoryText, undefined, "dragged", "18px prstart", true, {col:"#ffff00", thick:5}, {col:"#ffffb3", opacity:1});

	var choices = messagesXML.getElementById(chosen).getElementsByTagName("choice");
	var choiceBox;
	var choiceBoxes = [];
	var buttonBoxes = [];
	var choiceMsg;
	if (choices.length > 0) {
		for (let i of choices) {
			choiceBox = msgTextBox(0, 0, 240, 0, i.childNodes[0].nodeValue, victoryBox, undefined, "14px prstart", false, {col: "#ff9900", thick:2}, {col:"#cccc00", opacity:1});
			
			choiceMsg = effectDescriptions(i).join("\n");
			if (choiceMsg.length <= 0) choiceMsg = "[CENTER_TEXT]Ok!";
			choiceButtonBox = msgTextBox(0, 0, 220, 0, choiceMsg, victoryBox, "clickable", "12px prstart", false, {col: "#ff3300", thick:2}, {col:MY_COLORS.DARK_ORANGE, opacity:1}, {col:MY_COLORS.DARK_ORANGE_SHINE, opacity:1});
			choiceButtonBox.self_click = function() {
				abilities(i, "Your choice");
				removeElem(this.linkedTo, gameCanvas.elems[1]);
			}
			buttonBoxes.push(choiceButtonBox);
			addSubBox(choiceBox, [choiceButtonBox]);
			choiceBoxes.push(choiceBox);
		}
		addSubBox(victoryBox, choiceBoxes);
		for (let i of victoryBox.elems) {
			i.elems[0].x += i.x;
			i.elems[0].y += i.y;
		}
	} else {
		var okButton = msgTextBox(0, 0, 120, 0, CENTER_TEXT + "Ok!", victoryBox, "clickable", "18px prstart", false, {col: "#ff3300", thick:2}, {col:MY_COLORS.DARK_ORANGE, opacity:1}, {col:MY_COLORS.DARK_ORANGE_SHINE, opacity:1});
		okButton.self_click = function() {
			removeElem(this.linkedTo, gameCanvas.elems[1]);
		}
		addSubBox(victoryBox, [okButton]);
	}

	gameCanvas.elems[1].push(victoryBox);
	addLog(victoryLog);
}

function signalReplaceTech(newTech) {
	replacingTech = newTech;
	replaceBox = msgTextBox(0, 0, 800, TOPDOWN_SEPARATION, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.1});
	replaceBox.elems.push(msgTextBox(0, TOPDOWN_SEPARATION, 300, 600-TOPDOWN_SEPARATION, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0}));
	replaceBox.elems.push(msgTextBox(300, TOPDOWN_SEPARATION, 500, 600-TOPDOWN_SEPARATION, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.1}));
	replaceBox.elems.push(techDisplay);
	replaceBox.doNotDisplay.push(techDisplay);
	if (typeof replacingTech == "number") {
		var replaceText = CENTER_TEXT + "Call to Arms !\n\nAbandon activities to vanquish enemies in the roster\n\n[replacingTech] population raised";
	} else {
		var replaceText = CENTER_TEXT + replacingTech + "\n";
		var newTechXML = techsXML.getElementById(replacingTech);
		if (newTechXML.tagName == "activity" && newTechXML.attributes.getNamedItem("newPopIn") === null) replaceText += "\nChoose 1 population{popGlobal} to assign to " + replacingTech;
		if (innovationTotal() >= maxInnovations()) replaceText += "\nToo much innovations{innovation}, abandon 1 innovation";
	}
	
	var actualMsgBox = msgTextBox(200, 50, 400, 0, replaceText, undefined, "dragged", "18px prstart", true, {col:"#ff00ff", thick:5}, {col:"#ffb3ff", opacity:1});
	replaceBox.elems.push(actualMsgBox);

	if (typeof replacingTech == "number") {
		var okButton = msgTextBox(0, 0, 180, 0, CENTER_TEXT + "Let's go!", replaceBox, "clickable", "18px prstart", false, {col: "#ff3300", thick:2}, {col:MY_COLORS.DARK_ORANGE, opacity:1}, {col:MY_COLORS.DARK_ORANGE_SHINE, opacity:1});
		addSubBox(actualMsgBox, [okButton]);
		okButton.self_click = function() {
			vanquish("enemy", replacingTech, "roster");
			removeElem(this.linkedTo, gameCanvas.elems[1]);
			processTurn();
		}
	}
	gameCanvas.elems[1].push(replaceBox);
	signalTechChanged();
}

function signalComboReels(cUse) {
	wheelDisplay.clock = 0;
	for (let i of cUse) {
		if (i < gameState.wheel.length) {
			gameState.wheel[i].prodRef = undefined;
		}
	}
}

function signalWheelSpin() {
	wheelDisplay.clock = 0;
	wheelDisplay.spinAll();

}

function signalWheelForget() {
	wheelDisplay.forgetReels();
}

function signalNeutralized(wheelPos) {
	wheelDisplay.wheelData[wheelPos].state = BLINK;
}

function signalVanquisher() {
	var beaten;
	for (let i in gameState.vanquished) {
		addLog(vanquish.log(i, gameState.vanquished[i]));
		beaten = gameState.vanquished[i];
		delete gameState.vanquished[i];
		gameState.killed = gameState.killed.concat(beaten);
		return [i, beaten];
	}
}

function tryRecordNewBestScore() {
	if (tryBestScore(gameState.setup.tribe, gameState.score)) {
		currentBestScore = gameState.score;
		return true;
	}
	return false;
}

function tryBestScore(tribe, newScore) {
	var bestScore = loadParsedCookie(tribe);
	if (bestScore == undefined || bestScore < newScore) {
		saveStringCookie(tribe, newScore);
		return true;
	}
	return false;
}

function signalLevelUp(lvl) {
	var ageNode = messagesXML.getElementById("level_" + lvl);
	var levelText = CENTER_TEXT + "AGE " + lvl + " :\n" + CENTER_TEXT + "AGE OF " + ageNode.attributes.getNamedItem("age").nodeValue.toUpperCase() + "\n\n";
	levelText += ageNode.childNodes[0].nodeValue;
	if (lvl <= 4 && (lvl != 4 || gameState.setup.tribe != "easy mode")) levelText += "\n\n\nThere are 3 ways to progress to Age " + (lvl+1) + ".\nOne of them is :";
	
	var levelShade = msgTextBox(0, 0, 800, 600, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.1});

	var levelBox = msgTextBox(100, 50, 600, 0, levelText, undefined, "dragged", "14px prstart", true, {col:MY_COLORS.BROWN, thick:5}, {col:MY_COLORS.LIGHT_BROWN, opacity:1});

	
	if (lvl <= 4 && (lvl != 4 || gameState.setup.tribe != "easy mode")) {
		var comboHintBox = ComboTextBox(0, 0, 200, COMBO_BOX_HEIGHT, [combos.getElementById(ageNode.attributes.getNamedItem("hint").nodeValue), 0]);
		comboHintBox.self_click = function() {return true};
		comboHintBox.canPerform = function() {return false};
		addSubBox(levelBox, [comboHintBox]);
	}
	else if (lvl == 5) gameState.score += 10000;


	var okButton = msgTextBox(0, 0, 120, 0, CENTER_TEXT + "Ok!", levelShade, "clickable", "18px prstart", false, {col: "#ff3300", thick:2}, {col:MY_COLORS.DARK_ORANGE, opacity:1}, {col:MY_COLORS.DARK_ORANGE_SHINE, opacity:1});
	addSubBox(levelBox, [okButton]);
	okButton.self_click = function() {
		removeElem(this.linkedTo, gameCanvas.elems[1]);
		if (lvl == 4) {
			var gameVictoryShade;
			if (gameState.setup.tribe == "easy mode") {
				gameVictoryShade = msgTextBox(0, 0, 800, 600, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.2});

				var victoryBox = msgTextBox(100, 50, 600, 0, CENTER_TEXT + "CONGRATULATIONS !\n\nOn its " + gameState.year + "th year, your tribe reached the Age of Power.\n\nIt's the highest Age you can reach in this mode.\nTo discover the ultimate Age of History, try to play in other game modes !\n", undefined, "dragged", "18px prstart", true, {col:"#ffa810", thick:5}, {col:"#ffcc40", opacity:1});

				var stopButton = msgTextBox(0, 0, 240, 0, CENTER_TEXT + "To Main Menu", gameVictoryShade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
				stopButton.self_click = function() {
					autosave = undefined;
					deleteCookie("autosave");
					newgameScreenSetup();
				}
				
				addSubBox(victoryBox, [stopButton]);
				gameVictoryShade.elems.push(victoryBox);				
			}
			if (tryBestScore("normal mode", 0)) {
				var unlockNormalShade = msgTextBox(0, 0, 800, 600, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.2});

				var unlockNormalBox = msgTextBox(200, 50, 400, 0, CENTER_TEXT + "#ffffffNORMAL MODE UNLOCKED !", undefined, "dragged", "18px prstart", true, {col:"#ffa810", thick:5}, {col:"#ffcc40", opacity:1});

				var nextButton = msgTextBox(0, 0, 240, 0, CENTER_TEXT + "Ok !", unlockNormalShade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
				nextButton.self_click = function() {
					removeElem(this.linkedTo, gameCanvas.elems[1]);
					if (gameVictoryShade != undefined) gameCanvas.elems[1].push(gameVictoryShade);
				}
				
				addSubBox(unlockNormalBox, [nextButton]);
				unlockNormalShade.elems.push(unlockNormalBox);
				gameCanvas.elems[1].push(unlockNormalShade);
			}
			else if (gameVictoryShade != undefined) gameCanvas.elems[1].push(gameVictoryShade);
		}
		else if (lvl == 5) signalGameVictory();
	}
	levelShade.elems.push(levelBox);
	gameCanvas.elems[1].push(levelShade);
}

function signalGameVictory() {
	var victoryText;
	addLog("Victory ! Your tribe enters History ! The memory of this day will be passed on by scribes");
	victoryText = CENTER_TEXT + "VICTORY !\n\nOn its " + gameState.year + "th year, your tribe reached the Age of History. The story of the tribe will be recorded and transmitted to the future generations to become legend. Your tribe has succeeded in leaving its print in the grand scheme of things.\n\n";
	if (TRIBES[prodsXML.getElementById(gameState.setup.tribe).attributes.getNamedItem("setup").nodeValue].difficulty != "easy") {
		if (tryBestScore("hard mode", 0)) victoryText += CENTER_TEXT + "#ffffffHARD MODE UNLOCKED !\n";
		if (TRIBES[prodsXML.getElementById(gameState.setup.tribe).attributes.getNamedItem("setup").nodeValue].difficulty != "normal") {
			if (tryBestScore("very Hard mode", 0)) victoryText += CENTER_TEXT + "#ffffffVERY HARD MODE UNLOCKED !\n";
		}
		if (!gameState.wastedFood) {
			if (tryBestScore("inuit tribe", 0)) victoryText += CENTER_TEXT + "#ffffffINUIT TRIBE UNLOCKED !\n";
		}
	}
	victoryText += CENTER_TEXT + "Victory bonus : +10 000 points !\n";
	victoryText += CENTER_TEXT + "You have reached the highest Age. No new combos, but you can keep playing to improve your score.\nTIP : The more population you have, the faster your score raises.";
	
	var gameVictoryShade = msgTextBox(0, 0, 800, 600, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.2});

	var victoryBox = msgTextBox(100, 50, 600, 0, victoryText, undefined, "dragged", "18px prstart", true, {col:"#ffa810", thick:5}, {col:"#ffcc40", opacity:1});

	var stopButton = msgTextBox(0, 0, 240, 0, CENTER_TEXT + "To Main Menu", gameVictoryShade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
	stopButton.self_click = function() {
		if (autosave != undefined) saveCookie("autosave", autosave);
		saveStringCookie("discoveredCombos", discoveredCombos);
		tryRecordNewBestScore();
		newgameScreenSetup();
	}

	var continueButton = msgTextBox(0, 0, 240, 0, CENTER_TEXT + "Keep playing", gameVictoryShade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
	continueButton.self_click = function() {
		removeElem(this.linkedTo, gameCanvas.elems[1]);
	}
	addSubBox(victoryBox, [stopButton, continueButton]);
	gameVictoryShade.elems.push(victoryBox);


	gameCanvas.elems[1].push(gameVictoryShade);
}

function signalTribeUnlocked(tribe) {
	var unlockTribeShade = msgTextBox(0, 0, 800, 600, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.2});

	var unlockTribeBox = msgTextBox(150, 50, 500, 0, CENTER_TEXT + "#ffffff" + tribe.toUpperCase() + " UNLOCKED !", undefined, "dragged", "18px prstart", true, {col:"#ffa810", thick:5}, {col:"#ffcc40", opacity:1});

	var nextButton = msgTextBox(0, 0, 240, 0, CENTER_TEXT + "Ok !", unlockTribeShade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
	nextButton.self_click = function() {
		removeElem(this.linkedTo, gameCanvas.elems[1]);
	}
	
	addSubBox(unlockTribeBox, [nextButton]);
	unlockTribeShade.elems.push(unlockTribeBox);
	gameCanvas.elems[1].push(unlockTribeShade);
}

function signalGameOver() {
	addLog("No more population... the last remnants of the tribe scatter...");
	autosave = undefined;
	deleteCookie("autosave");
	saveStringCookie("discoveredCombos", discoveredCombos);

	var gameoverText = CENTER_TEXT + "GAME OVER\n\nOn the year " + gameState.year + ", the struggling tribe got extinguished...\n\n";
	if (tryRecordNewBestScore()) gameoverText += CENTER_TEXT + "#ffdddd" + "New best Score !\n";
	
	gameoverText += CENTER_TEXT + "Final Score\n" + CENTER_TEXT + gameState.score + "\n";
	var memories = Math.min(4, String(gameState.score).length - 3);
	if (memories <= 0) gameoverText += "That group of people left no noticeable trace...";
	else if (memories == 1) gameoverText += "Not much will be remembered of that tribe.";
	else if (memories == 2) gameoverText += "That culture had a small influence on its surroundings.";
	else if (memories == 3) gameoverText += "That nation was the cradle of multiple innovations.";
	else gameoverText += "That civilization flourished and spread its way of life all over the world !";
	
	var gameoverShade = msgTextBox(0, 0, 800, 600, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0});
	gameoverShade.animate = function() {
		if (this.background.opacity < 0.5) this.background.opacity += 0.002;
	}

	var gameoverBox = msgTextBox(200, 50, 400, 0, gameoverText, undefined, "dragged", "18px prstart", true, {col:"#ff00ff", thick:5}, {col:"#ffb3ff", opacity:1});
	var okButton = msgTextBox(0, 0, 240, 0, CENTER_TEXT + "To Main Menu", gameoverShade, "clickable", "18px prstart", false, {col: "#000000", thick:2}, {col:MY_COLORS.GREY, opacity:1}, {col:MY_COLORS.GREY_SHINE, opacity:1});
	addSubBox(gameoverBox, [okButton]);
	okButton.self_click = function() {
		newgameScreenSetup();
	}

	gameoverShade.elems.push(gameoverBox);

	gameCanvas.elems[1].push(gameoverShade);
	gameCanvas.anims.push(gameoverShade);
}

function capitalizedTribeName() {
	return gameState.setup.tribe.toUpperCase();
}

function rebound_shrine() {
	if (gameState.permanentBonuses == undefined) return 3;
	return rebound();
}
