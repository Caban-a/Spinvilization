var LEGACYTRIBENAMES = [
	["Easy mode", "normal mode"],
	["Normal mode", "hard mode"],
	["Hard mode", "very Hard mode"]
];


var submittedData = false;

var tribeWheel;
var tribeBox;


function confirmBox(setup) {
	var shade = msgTextBox(0, 0, GAME_WINDOW_W, GAME_WINDOW_H, "", undefined, "", "18px prstart", false, undefined, {col:"#000000", opacity:0});
	
	var cBox = msgTextBox(190, 200, 420, 0, CENTER_TEXT + "Saved game exists\n\nStarting a new game will overwrite the saved game.", undefined, "dragged", "18px prstart", false, {col: "#333333", thick:4}, {col:MY_COLORS.GREY, opacity:1});

	var continueButton = msgTextBox(0, 0, 140, 0, CENTER_TEXT + "Continue", shade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.LIGHT_RED, opacity:1}, {col:MY_COLORS.LIGHT_RED_SHINE, opacity:1});
	continueButton.self_click = function() {
		mainScreenSetup1(setup.tribe);
		gameCanvas.elems[1].push(tutorialBox(1));
		newGame(setup);
	}
	var cancelButton = msgTextBox(0, 0, 140, 0, CENTER_TEXT + "Cancel", shade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.LIGHT_RED, opacity:1}, {col:MY_COLORS.LIGHT_RED_SHINE, opacity:1});
	cancelButton.self_click = function() {
		removeElem(this.linkedTo, gameCanvas.elems[1]);
	}
	
	shade.elems = [cBox];
	addSubBox(cBox, [continueButton, cancelButton]);
	return shade;
}

function initTribeDisplay() {
	var td = msgTextBox(150, 280, 500, 280, "", undefined, undefined, "18px prstart", true, {col:"#ff00ff", thick:5}, {col:"#ffb3ff", opacity:1});
	
	td.adjust = function() {
		var actu = prodsXML.getElementById(actualReel(0, 0));
		var txt;
		if (actualReel(0, 0) == "autosave") {
			this.border.col = "#4444aa";
			this.background.col = "#aaaaff";
			if (tribeWheel.autosave == undefined) {
				txt = CENTER_TEXT + "NO SAVED GAME\n\nGame is saved automatically.";
				this.updateText(txt);
				return;
			}
			txt = CENTER_TEXT + "AUTOSAVE\n\n";
			txt += "Tribe : " + initials(tribeWheel.autosave.setup.tribe);
			txt += "\nYear " + tribeWheel.autosave.year + ", " + tribeWheel.autosave.actions + " action" + quantityS(tribeWheel.autosave.actions) +  " remaining\n";
			if (difficultyRatio(tribeWheel.autosave.setup) > 0) {
				txt += CENTER_TEXT + "Score multiplier : *" + difficultyRatio(tribeWheel.autosave.setup) + "\n";
				txt += "Score : " + tribeWheel.autosave.score;
			}
			else txt += "No Scoring in this mode\n";
			txt += "\n\n\n\nGame is saved automatically.";
			this.updateText(txt);
		
			var continueButton = msgTextBox(290, 460, 220, 0, CENTER_TEXT + "Continue Game", this, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
			continueButton.self_click = function() {
				mainScreenSetup1(tribeWheel.autosave.setup.tribe);
				copyGame(tribeWheel.autosave);
				autosave = storeGame();
				gameLog = ["Welcome back !"];
				resetTurn();
				signalStandBy();
			}
			this.elems = [continueButton];
		}
		else if (actualReel(0, 0) == "codex") {
			this.border.col = MY_COLORS.DARK_ORANGE;
			this.background.col = MY_COLORS.DARK_ORANGE_SHINE;
			this.updateText(CENTER_TEXT + "COMBO CODEX\n\nReview all the combos you discovered !\n\nFound : " + discoveredCombos.length + "/" + combos.getElementsByTagName("combo").length);
			var codexButton = msgTextBox(290, 500, 220, 0, CENTER_TEXT + "View Combos", this, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
			codexButton.self_click = function() {
				comboCodexScreenSetup();
			}
			this.elems = [codexButton];
		}
		else if (actu.tagName == "tribe") {
			var setup = TRIBES[actu.attributes.getNamedItem("setup").nodeValue];
			var bestScore = tribeWheel.tribes[actualReel(0, 0)];
			if (setup.difficulty == "easy") {
				this.border.col = "#22aa22";
				this.background.col = "#66ff66";
			}
			else if (setup.difficulty == "normal") {
				this.border.col = "#ffcc00";
				this.background.col = "#ffee88";
			}
			else if (setup.difficulty == "hard") {
				this.border.col = "#aa4444";
				this.background.col = "#ff8888";
			}
			else if (setup.difficulty == "very hard") {
				this.border.col = MY_COLORS.PINKISH;
				this.background.col = MY_COLORS.PINKISH_SHINE;
			}
			txt = CENTER_TEXT + setup.tribe.toUpperCase() + "\n\n";
			if (setup.describe != undefined) {
				txt += CENTER_TEXT + setup.describe;
				if (setup.detail == undefined || bestScore == undefined) txt += "\n\n";
				else txt += " : ";
			}
			if (setup.detail != undefined && bestScore != undefined) txt += setup.detail + "\n\n";
			if (difficultyRatio(setup) > 0) txt += CENTER_TEXT + "Score multiplier : *" + difficultyRatio(setup) + "\n";
			else txt += CENTER_TEXT + "No Scoring in this mode\n";
			if (bestScore == undefined) {
				if (setup.unlock != undefined) txt += "\n" + setup.unlock + "\n";
				this.elems = [];
				this.updateText(txt);
				return;
			}
			if (difficultyRatio(setup) > 0) txt += CENTER_TEXT + "Best score : " + bestScore;
			td.updateText(txt);
		
			var startButton = msgTextBox(300, 500, 200, 0, CENTER_TEXT + "Start Game", this, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});

			if (tribeWheel.autosave == undefined) startButton.self_click = function() {
				mainScreenSetup1(setup.tribe);
				gameCanvas.elems[1].push(tutorialBox(1));
				newGame(setup);
			}
			else startButton.self_click = function() {
				gameCanvas.elems[1].push(confirmBox(setup));
			}

			this.elems = [startButton];
		}
	}
	
	return td;
}

function submitKongData() {
	var bestScore = 0;

	if (tribeWheel.tribes["Normal mode"] != undefined) kongregate.stats.submit("gameWon", 1);
	if (tribeWheel.autosave != undefined) bestScore = tribeWheel.autosave.score;
	for (let i of gameState.roster) {
		if (tribeWheel.tribes[i] != undefined) if (tribeWheel.tribes[i] > bestScore) bestScore = tribeWheel.tribes[i];
	}
	if (bestScore > 0) kongregate.stats.submit("score", bestScore);
	if (discoveredCombos != undefined) kongregate.stats.submit("nbCombos", discoveredCombos.length);
	if (!submittedData) kongregate.stats.submit("loadedCorrectly", 1);
	submittedData = true;
}

function whatsNew() {
	var wnShade = msgTextBox(0, 0, 800, 600, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.2});

	var wnBox = msgTextBox(100, 25, 600, 0, CENTER_TEXT + "WHAT'S NEW\n" + messagesXML.getElementById("wnw").childNodes[0].nodeValue, undefined, "dragged", "14px prstart", true, {col:"#ffa810", thick:5}, {col:"#ffcc40", opacity:1});

	var exitButton = msgTextBox(0, 0, 240, 0, CENTER_TEXT + "Ok !", wnShade, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
	exitButton.self_click = function() {
		removeElem(this.linkedTo, gameCanvas.elems[1]);
	}
	
	addSubBox(wnBox, [exitButton]);
	wnShade.elems.push(wnBox);
	gameCanvas.elems[1].push(wnShade);
}


function newgameScreenSetup() {
	var legacyTribeNamesScores;
	for (let i of LEGACYTRIBENAMES) {
		legacyTribeNamesScores = loadParsedCookie(i[0]);
		if (legacyTribeNamesScores != undefined) tryBestScore(i[1], legacyTribeNamesScores);
	}
	
	tryBestScore("easy mode", 0);
	invertArrows = loadParsedCookie("invertArrows", 1);
	if (discoveredCombos == undefined) discoveredCombos = loadParsedCookie("discoveredCombos", []);
	if (discoveredCombos.length >= 44) tryBestScore("palawa tribe", 0);

	gameState = {};
	gameState.roster = ["autosave", "easy mode", "sentinelese tribe", "normal mode", "palawa tribe", "hard mode", "inuit tribe", "very Hard mode", "anangu tribe", "codex"];
	gameState.wheel = [newReel(0)];
	gameState.actions = undefined;

	resetScreen();
	tribeWheel = initMenuWheelDisplay(400, 40);
	tribeWheel.adjust_full();

	for (let i of LEGACYTRIBENAMES) {
		if (tribeWheel.autosave != undefined) if (tribeWheel.autosave.setup.tribe == i[0]) tribeWheel.autosave.setup.tribe = i[1];
	}

	tribeBox = initTribeDisplay();
	tribeBox.adjust();
	gameCanvas.elems[0].push(tribeWheel);
	gameCanvas.elems[0].push(tribeBox);
	
/*	var wnButton = msgTextBox(590, 0, 210, 0, CENTER_TEXT + "What's New ?", undefined, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
	wnButton.self_click = function() {
		whatsNew();
	}
	gameCanvas.elems[0].push(wnButton);*/

	gameCanvas.elems[0].push(simpleLine(30, 30, "Click arrow to step UP ->", "16px prstart"));
	gameCanvas.elems[0].push(simpleLine(80, 60, "You can also click here ->", "12px prstart"));
	gameCanvas.elems[0].push(simpleLine(50, 120, "CHOOSE YOUR TRIBE", "18px prstart"));
	gameCanvas.elems[0].push(simpleLine(75, 150, "ON THE WHEEL", "18px prstart"));
	gameCanvas.elems[0].push(simpleLine(80, 220, "You can also click here ->", "12px prstart"));
	gameCanvas.elems[0].push(simpleLine(10, 260, "Click arrow to step DOWN ->", "16px prstart"));
	gameCanvas.elems[0].push(simpleLine(450, 150, "<- Clicking here does nothing", "12px prstart"));
	gameCanvas.elems[0].push(simpleLine(700, 580, "#999999by Casual42", "10px prstart"));
	gameCanvas.elems[0].push(simpleLine(715, 594, "#999999v 0.9.9.1", "10px prstart"));
	
	phase = "stand-by";
	
	if (kongregate != undefined) submitKongData();		
}






