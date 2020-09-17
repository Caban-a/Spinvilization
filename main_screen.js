var ENEMIES_PAGE = 12;

var PRODS_BY_ROSTER_LINE = 18;

var MAX_COMBO_DISPLAY = 8;
var COMBO_BOX_HEIGHT = 39;
var TECH_BOX_HEIGHT = 39;
var MAX_TECH_DISPLAY = 8;
var MAX_LOG_DISPLAY = 16;

var TOPDOWN_SEPARATION = 266;

var NEW_COMBOS_ON_TOP = true;

var BLINK_TIME_MAX = 80;
var BLINK_SWITCH = 60;

var previewDone;

var FOOD_X = 10;
var FOOD_Y = 55;
var HAPPINESS_X = 10;
var HAPPINESS_Y = 100;

var wheelDisplay;
var rosterDisplay;
var comboDisplay;
var techDisplay;
var logDisplay;
var eventBox;

var foodTile;
var happinessTile;
var logOpener;

var replaceBox;

var currentBestScore;
var discoveredCombos;


function initComboDisplay(x, y, w, h) {
	comboDisplay = {x:x, y:y, w:w, h:h, timer:0};
	comboDisplay.elems = [[], [initScrolling(315, 280, (MAX_COMBO_DISPLAY*COMBO_BOX_HEIGHT) - 32, "COMBOS", comboDisplay, MAX_COMBO_DISPLAY)]];
	
	comboDisplay.adjust = function(newStart) {
		this.timer = 0;
		if (NEW_COMBOS_ON_TOP) this.listed = doableCombos(gameState.wheel.length, discoveredCombos);
		else this.listed = doableCombos(gameState.wheel.length);
		if (newStart == undefined) this.start = 0;
		else this.start = newStart;
		this.elems[0] = [];
		for (let i=0; i<Math.min(this.listed.length-this.start, MAX_COMBO_DISPLAY); i+=1) {
			this.elems[0].push(ComboTextBox(this.x, this.y+(i*(COMBO_BOX_HEIGHT + 2)), 200, COMBO_BOX_HEIGHT, this.listed[i + this.start], true));
		}
	}

	comboDisplay.display = function() {
		if (phase.split("|")[0] != "stand-by" || nbIn(mouseIn, [logOpener, logDisplay]) > 0) return;
		for (let i of this.elems) for (let j of i) if (j == mouseIn) this.timer = 0;
		if (this.timer > BLINK_SWITCH) var blink = true;
		else var blink = false;
		for (let i of this.elems) for (let j of i) j.display(blink, (nbIn(j.cName, discoveredCombos) <= 0));
	}
	
	comboDisplay.animate = function() {
		this.timer += 1;
		if (this.timer >= BLINK_TIME_MAX) this.timer = 0;
	}

	comboDisplay.mouseEvent = mouseEvent;
	comboDisplay.self_wheel = function(e) {
		if (e.deltaY > 0) {
			if (this.start < this.listed.length - MAX_COMBO_DISPLAY) this.adjust(this.start + 1);
		}
		else if (this.start > 0) this.adjust(this.start - 1);
	}
}

function initScrolling(x, y, h, label, associatedList, maxListElems) {
	var listScroll = {x:x, y:y, w:32, h:h, label:label, list:associatedList, maxElems:maxListElems};
	listScroll.display = function(blink) {
		var innerThick = 8;
		var labelStartY = this.y + ((this.h - (this.label.length * 20)) / 2) + 32;
		gameStyle.beginPath();
		gameStyle.strokeStyle = "#e67300";
		gameStyle.fillStyle = "#ffcc00";
		gameStyle.moveTo(this.x, this.y + this.w - innerThick);
		gameStyle.lineTo(this.x + (this.w/2), this.y + (this.w/2) - innerThick);
		gameStyle.lineTo(this.x + this.w, this.y + this.w - innerThick);
		gameStyle.lineTo(this.x + this.w, this.y + this.h + innerThick);
		gameStyle.lineTo(this.x + (this.w/2), this.y + this.h + (this.w/2) + innerThick);
		gameStyle.lineTo(this.x, this.y + this.h + innerThick);
		gameStyle.lineTo(this.x, this.y + this.w - innerThick);
		gameStyle.fill();
		gameStyle.stroke();
		
		for (let i=0; i<this.label.length; i+=1) {
			drawTextTight(this.label.charAt(i), "14px prstart", this.x + 10, labelStartY + (i * 20), 16);
		}
		
		if (blink) {
			if (this.list.start < this.list.listed.length - this.maxElems) drawProdTile32("arrowRedDown", this.x, this.y + this.h, 32, 32);
			if (this.list.start > 0) drawProdTile32("arrowRedUp", this.x, this.y, 32, 32);
		}
		
		var posY = this.cursorY;
		if (this != dragged) posY = this.y + Math.floor(this.h * this.list.start / Math.max(1, this.list.listed.length - this.maxElems));
		drawProdTile32("slideButton", this.x, posY, 32, 32);
	}
	listScroll.mouseEvent = mouseEvent;
	listScroll.self_mousedown = function(e){
		dragged = this;
		this.self_mousemove(e);
	}
	listScroll.self_mousemove = function(e) {
		if (dragged == this) {
			this.cursorY = e.pageY;
			this.list.adjust(Math.floor((e.pageY - this.y) * Math.max(1, this.list.listed.length + 1 - this.maxElems)/ (this.h+1)));
		}
	}
	listScroll.self_wheel = function(e) {
		this.list.self_wheel(e);
	}
	return listScroll;
}

function initBasicHScrollBar(x, y, w, list, initialVal) {
	var hScroll = {x:x, y:y, w:w, h:32, list:list, pos:uniquePos(initialVal, list)};

	hScroll.display = function() {
		var distOctagons = (this.w - this.h) / (this.list.length-1);
		for (let i=1; i<this.list.length; i+=1) {
			gameStyle.beginPath();
			gameStyle.lineWidth = 12;
			gameStyle.strokeStyle = "#ffd600";
			gameStyle.moveTo(this.x + (this.h/2) + ((i-1) * distOctagons), this.y + (this.h/2));
			gameStyle.lineTo(this.x + (this.h/2) + (i * distOctagons), this.y + (this.h/2));
			gameStyle.stroke();
			gameStyle.beginPath();
			gameStyle.lineWidth = 4;
			gameStyle.strokeStyle = "#e67300";
			gameStyle.moveTo(this.x + (this.h/2) + ((i-1) * distOctagons), this.y + (this.h/2));
			gameStyle.lineTo(this.x + (this.h/2) + (i * distOctagons), this.y + (this.h/2));
			gameStyle.stroke();
		}
		
		for (let i=0; i<this.list.length; i+=1) {
			drawProdTile32("octagon_live", this.x + (i * (this.w-32) / (this.list.length-1)), this.y, 32, 32);
		}
		drawProdTile32("slideButton", this.x + Math.floor((this.w-32) * this.pos / (this.list.length-1)), this.y, 32, 32);
	}
	
	hScroll.updateTarget = function() {}
	
	hScroll.mouseEvent = mouseEvent;
	hScroll.self_mousedown = function(e){
		this.pos = Math.min(this.list.length-1, Math.max(0, Math.round((e.pageX - (this.x + 16)) * (this.list.length-1) / (this.w - 32))));
		this.updateTarget();
	}
	return hScroll;
}

function initHScrollBar(x, y, w, list) {
	var hScroll = {x:x, y:y, w:w, h:32, list:list};

	hScroll.display = function() {
		var distOctagons = (this.w - this.h) / (this.list.phases.length-1);
		for (let i=1; i<this.list.phases.length; i+=1) {
			if (nbIn(this.list.phases[i], nonDeterministicPhases) > 0) continue;
			gameStyle.beginPath();
			gameStyle.lineWidth = 12;
			gameStyle.strokeStyle = "#ffd600";
			gameStyle.moveTo(this.x + (this.h/2) + ((i-1) * distOctagons), this.y + (this.h/2));
			gameStyle.lineTo(this.x + (this.h/2) + (i * distOctagons), this.y + (this.h/2));
			gameStyle.stroke();
			gameStyle.beginPath();
			gameStyle.lineWidth = 4;
			gameStyle.strokeStyle = "#e67300";
			gameStyle.moveTo(this.x + (this.h/2) + ((i-1) * distOctagons), this.y + (this.h/2));
			gameStyle.lineTo(this.x + (this.h/2) + (i * distOctagons), this.y + (this.h/2));
			gameStyle.stroke();
		}
		
		var octa;
		for (let i=0; i<this.list.phases.length; i+=1) {
			if (nbIn(YEAR_PHASES[i], donePhases) > 0) octa = "octagon_done";
			else if (nbIn(YEAR_PHASES[i], nonDeterministicPhases) > 0) octa = "octagon_unknown";
			else if (this.list.scripts[this.list.phases[i]].length <= 0) octa = "octagon_dead";
			else octa = "octagon_live";
			drawProdTile32(octa, this.x + (i * (this.w-32) / (this.list.phases.length-1)), this.y, 32, 32);
		}
		drawProdTile32("slideButton", this.x + Math.floor((this.w-32) * this.list.currentPhase / (this.list.phases.length-1)), this.y, 32, 32);
	}
	
	hScroll.mouseEvent = mouseEvent;
	hScroll.self_mousedown = function(e){
		var newPhase = Math.min(this.list.phases.length-1, Math.max(0, Math.round((e.pageX - (this.x + 16)) * (this.list.phases.length-1) / (this.w - 32))));
		if (nbIn(this.list.phases[newPhase], nonDeterministicPhases) <= 0) this.list.currentPhase = newPhase;
		this.list.adjustToPhase();
	}
	return hScroll;
}

function initTechDisplay(x, y, w, h) {
	techDisplay = {x:x, y:y, w:w, h:h, timer:0};
	techDisplay.elems = [[], [initScrolling(260, 280, (MAX_TECH_DISPLAY*TECH_BOX_HEIGHT) - 32, "INNOVATIONS", techDisplay, MAX_TECH_DISPLAY)]];
	
	techDisplay.partialList = function(techType, leisureOk) {
		var partList = [];
		for (let i of gameState.techs) {
			if (i[0] == "Leisure") {
				if (leisureOk) partList.push(i);
			}
			else if (nbIn(techType, ["all", techsXML.getElementById(i[0]).tagName]) > 0) partList.push(i);
		}
		return partList;
	}
	
	techDisplay.adjust = function(newStart) {
		this.timer = 0;

		if (replacingTech == undefined) this.listed = gameState.techs;
		else if (typeof replacingTech == "number") this.listed = this.partialList("activity", false);
		else {
			var leisureOk = true;
			if (innovationTotal() >= maxInnovations()) leisureOk = false;
			if (techsXML.getElementById(replacingTech).tagName == "activity") this.listed = this.partialList("activity", leisureOk);
			else this.listed = this.partialList("all", leisureOk);
		}

		if (newStart == undefined) this.start = 0;
		else this.start = newStart;
		
		this.elems[0] = [];
		for (let i=0; i<Math.min(this.listed.length - this.start, MAX_TECH_DISPLAY); i+=1) {
			this.elems[0].push(TechTextBox(this.x, this.y+(i*TECH_BOX_HEIGHT + 2), 244, TECH_BOX_HEIGHT, this.listed[i + this.start]));
		}
	}

	techDisplay.display = function() {
		var blinkingTechs;
		for (let i of this.elems) for (let j of i) if (j == mouseIn) this.timer = 0;
		if (replacingTech == undefined) blinkingTechs = false;
		else blinkingTechs = (this.timer > BLINK_SWITCH);
		for (let i of this.elems[0]) i.display(blinkingTechs);
		for (let i of this.elems[1]) i.display(this.timer > BLINK_SWITCH);
	}
	
	techDisplay.animate = function() {
		this.timer += 1;
		if (this.timer >= BLINK_TIME_MAX) this.timer = 0;
	}
	
	techDisplay.sub_click = function(type, pos) {
		if (type != 0) return;
		tooltip = undefined;
		var toRemove = this.listed[pos + this.start][0];
		var toRemoveActualPos = findTech(gameState.techs, toRemove);
		var toRemoveActivity = (techsXML.getElementById(toRemove).tagName == "activity");
		var casualties = false;
		
		if (nbIn(toRemove, gameState.cantAbandon) > 0) return;
		
		if (replacingTech == undefined) {
			initializeTurn();
			if (toRemove == "Leisure") addLog(randChoice(["Time passes", "The tribesfolk enjoy life", "The tribesfolk rest", "The tribesfolk take a break"]));
			else {
				addLog(toRemove + " " + randChoice(["was abandoned", "fell out of fashion", "was forgotten"]));
				abandonTech(toRemoveActualPos);
			}
			processTurn();
			return;
		}
		
		if (typeof replacingTech == "number") {
			if (toRemove == "Leisure" || !toRemoveActivity) return;
			addLog(randChoice(["The folk", "People", "1 population"]) + " in " + toRemove + " answered the call !");
			abandonTech(toRemoveActualPos);
			replacingTech += 1;
			replaceBox.elems[1].updateText();
			return;
		}
		
		if (toRemove == "Leisure" && innovationTotal() >= maxInnovations()) return;

		var peopleNeed = 0;
		var newTechXML = techsXML.getElementById(replacingTech);
		if (newTechXML.tagName == "activity" && newTechXML.attributes.getNamedItem("newPopIn") === null) peopleNeed += 1;
		if (toRemoveActivity) peopleNeed -= 1;
		if (peopleNeed > 0) return;

		remTech(gameState.techs, toRemoveActualPos);

		if (toRemove == "Slow Recovery") {
			var logLine = "1 population died when the treatment of their wounds was abandoned";
			casualties = true;
		}
		else if (gameState.setup.tribe == "Mayans" && toRemoveActivity && toRemove != "Leisure") {
			var logLine = "The priests of the Pyramid refused that the people at " + toRemove + " change activities and had them executed to maintain the cosmic balance";
			casualties = true;
		}
		
		if (casualties) {
			peopleNeed += 1;
			if (peopleNeed <= 0) {
				addLog(logLine + ", but the implementation of " + replacingTech + " continued nonetheless");
				addTech(gameState.techs, replacingTech);
			}
			else addLog(logLine + ", and the idea of " + replacingTech + " was forgotten soon after");
		} else {
			if (replacingTech == "Oracle") addLog("A small cult developed around a" + randomPerson() + " who wandered alone in the mountain and had a revelation");
			else if (toRemove == "Leisure") addLog(randChoice([
				replacingTech + " " + randChoice(["was discovered", "was adopted", "became the new thing", "technique was perfected"]),
				"A breakthrough was made in " + replacingTech,
				"A group of tribesfolk " + randChoice(["dedicated themselves to", "showed talent in", "perfected the technique of", "mastered the art of"]) + " " + replacingTech
			]));
			else addLog(toRemove + " was abandoned " + randChoice(["to make way for", "in favour of", "for"]) + " " + replacingTech);
			addTech(gameState.techs, replacingTech);
		}

		replacingTech = undefined;
		removeElem(replaceBox, gameCanvas.elems[1]);
		for (let i=peopleNeed; i<0; i+=1) {
			addTech(gameState.techs, "Leisure");
		}
		signalTechChanged();
		processTurn();
	}
	
	techDisplay.self_wheel = function(e) {
		if (e.deltaY > 0) {
			if (this.start < this.listed.length - MAX_COMBO_DISPLAY) this.adjust(this.start + 1);
		}
		else if (this.start > 0) this.adjust(this.start - 1);
	}

	techDisplay.mouseEvent = mouseEvent;
}


function initRosterDisplay(x, y) {
	rosterDisplay = {
		x:x,
		y:y,
		maxTimer:60,
		timer:0,
		hovered:{}};
	
	rosterDisplay.prodPos = function(index) {
		return [
			this.x - (64 * Math.floor(index / PRODS_BY_ROSTER_LINE)),
			this.y + 20 + ((index % PRODS_BY_ROSTER_LINE) * 32)		
		];
	}

	rosterDisplay.adjust = function() {
		var pos;
		var prodSymbol;
		var tooltipMsg;
		var line;
		this.w = 32;
		this.h = Math.min(PRODS_BY_ROSTER_LINE, gameState.roster.length) * 32;
		this.elems = [[], [], []];
		for (let i=0; i<gameState.roster.length; i+=1) {
			pos = this.prodPos(i);
			prodSymbol = prodsXML.getElementById(gameState.roster[i]);
			tooltipMsg = [CENTER_TEXT + "{" + gameState.roster[i] + "}" + gameState.roster[i], ""];
			if (prodSymbol.tagName != "prod") {
				line = initials(prodSymbol.tagName) + " (";
				if (prodSymbol.tagName == "enemy" && gameState.enemyType == undefined) line +=messagesXML.getElementById("enemy_no_reward").childNodes[0].nodeValue;
				else line += messagesXML.getElementById(prodSymbol.tagName).childNodes[0].nodeValue;
				tooltipMsg.push(line + ")");
			}
			tooltipMsg.push("");
			tooltipMsg = tooltipMsg.concat(effectDescriptions(prodSymbol));
			this.elems[0].push(TileImageBox(pos[0], pos[1], 32, 32, gameState.roster[i], {
				x : pos[0] - 400,
				y : pos[1]- 10,
				w : 360,
				h : 0,
				msg : tooltipMsg.join("\n")
			}));
		}
	}
	
	rosterDisplay.display = function() {
		for (let i of this.elems[0]) i.display();
		for (let i=0; i<Math.ceil(gameState.roster.length / PRODS_BY_ROSTER_LINE); i+=1) {
			drawRectangle(
				this.elems[0][i*PRODS_BY_ROSTER_LINE].x - 1,
				this.elems[0][i*PRODS_BY_ROSTER_LINE].y - 1,
				34,
				(32 * Math.min(PRODS_BY_ROSTER_LINE, gameState.roster.length - (i*PRODS_BY_ROSTER_LINE))) + 2, "#0000ff", 1);
		}

		var actuTile;
		this.hovered.oldReel = this.hovered.newReel;
		this.hovered.newReel = undefined;
		for (let i=0; i<gameState.wheel.length; i+=1) {
			actuTile = this.elems[0][gameState.wheel[i].prodRef];
			if (actuTile != undefined) {
				drawProdTile32("only", actuTile.x, actuTile.y, 32, 32);
				drawTextTight("#00ff00" + (i + 1), "18px prstart", actuTile.x - 25, actuTile.y + 25, 32);
				if (wheelDisplay.elems[0][i][2] == mouseIn) {
					this.hovered.newReel = i;
					this.hovered.actualTile = actuTile;
					if (this.hovered.newReel != this.hovered.oldReel) this.timer = 0;
				}
			}
		}
		
		if (this.hovered.newReel != undefined && this.timer < this.maxTimer / 2) {
			drawRectangle(this.hovered.actualTile.x, this.hovered.actualTile.y, 32, 32, "#ff9900", 10, true);
			drawTextTight("#ff9900" + (this.hovered.newReel + 1), "18px prstart", this.hovered.actualTile.x - 25, this.hovered.actualTile.y + 25, 32);
		}

	}

	rosterDisplay.animate = function() {
		if (this.hovered.newReel != undefined) this.timer = (this.timer + 1) % this.maxTimer;
		else this.timer = 0;
	}

	rosterDisplay.mouseEvent = mouseEvent;
}

function initNumberButton(x, y, w, h, target, change, imgs) {
	var numberButton = {x:x, y:y, w:w, h:h, target:target, change:change, imgRest:imgs[0], imgPressed:imgs[1]};
	numberButton.display = function() {
		drawProdTile32(this.imgRest, this.x, this.y, this.w, this.h);
	}
	numberButton.self_click = function() {
		modify(this.target, this.change);
		autosave = storeGame();
	}
	numberButton.mouseEvent = mouseEvent;
	return numberButton;
}

function initLogDisplay(x, y, w, h) {
	logDisplay = {x:x, y:y, w:w, h:h, thick:4, blinks:[], moveType:"reactive_tooltip"};
	
	logDisplay.display = function() {
		var lines;
		var lineCount = 0;
		var shade;
		
		drawRectangle(this.x, this.y, this.w, this.h, MY_COLORS.BROWN, this.thick);
		drawRectangle(this.x + (this.thick/2), this.y + (this.thick/2), this.w - this.thick, this.h - this.thick, MY_COLORS.VERY_LIGHT_BROWN, 10, true);

		for (let i = 1; i <= gameLog.length; i += 1) {
			lines = textWidth(gameLog[gameLog.length - i], 14, w, 16);
			lineCount += lines.length;
			if (i-1 < logDisplay.blinks.length) {
				if (logDisplay.blinks[i-1] % 20 < 10) shade = "dddd00";
				else shade = "ff0000";
			}
			else {
				shade = ("0" + Math.floor(200 * lineCount / MAX_LOG_DISPLAY).toString(16)).slice(-2);
				shade = shade + shade + "ff";
			}
			for (let j=0; j<lines.length; j+=1) {
				if (lineCount - j <= MAX_LOG_DISPLAY) drawTextTight("#" + shade + lines[j].txt, "12px prstart", this.x + 8, this.y + this.h + 8 + ((j - lineCount) * 20), 16);
			}
			if (lineCount > MAX_LOG_DISPLAY) break;
		}
	}
	
	logDisplay.animate = function() {
		for (let i=0; i<logDisplay.blinks.length; i+=1) {
			if (logDisplay.blinks[i] <= 0) logDisplay.blinks.splice(i, 1);
			else logDisplay.blinks[i] -= 1;
		}
	}
	
	logDisplay.mouseEvent = mouseEvent;
	logDisplay.self_mousedown = function() {
		return true;
	}
}


function initOptionBox() {
	var optionBox = msgTextBox(0, 0, 620, 400, CENTER_TEXT + "OPTIONS\n\n\n     Action Preview\n\n     Invert Arrows\n\nGame Speed :\n  Slow                            Fast     Instant\n\n\n\n" + CENTER_TEXT + "Game is saved automatically.", undefined, "reactive_tooltip", "14px prstart", true, {col:"#ab5236", thick:2}, {col:"#ffcc00", opacity:1});
	
	var previewTickBox = tickBox(15, 75, 32, 32, actionPreview);
	previewTickBox.hasChanged = function() {
		actionPreview = this.ticked;
		saveStringCookie("actionPreview", actionPreview);
		if (!actionPreview) actionLogs = {};
	}

	var invertArrowsTickBox = tickBox(15, 125, 32, 32, invertArrows == -1);
	invertArrowsTickBox.hasChanged = function() {
		if (this.ticked) invertArrows = -1;
		else invertArrows = 1;
		saveStringCookie("invertArrows", invertArrows);
	}
	
	var speedBar = initBasicHScrollBar(40, 230, 520, ["*0.5", "*1", "*2", "*3", "instant"], wheelDisplay.speed);
	speedBar.updateTarget = function() {
		wheelDisplay.updateSpeed(this.list[this.pos]);
		saveStringCookie("speed", wheelDisplay.speed);
	}
	
	var abandonButton = msgTextBox(150, 335, 320, 0, CENTER_TEXT + "Return to Main Menu", optionBox, "clickable", "14px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.GREY, opacity:1}, {col:MY_COLORS.GREY_SHINE, opacity:1});
	abandonButton.self_click = function() {
		if (autosave !== undefined) saveCookie("autosave", autosave);
		saveStringCookie("discoveredCombos", discoveredCombos);
		tryRecordNewBestScore();
		newgameScreenSetup();
	}

	optionBox.elems = [previewTickBox, invertArrowsTickBox, speedBar, abandonButton];
	
	return optionBox;
}



function initHelpBox(page) {
	var helpBox = msgTextBox(0, 0, 800, 600, "", undefined, "reactive_tooltip", "18px prstart", true, {col:"#0033CC", thick:5});
	
	helpBox.adjust = function(_page) {
		this.elems = [];
		
		if (_page == undefined) _page = loadParsedCookie("help_page", 1);
		var sourceNode = messagesXML.getElementById("htp" + _page.toString());
		var sourceFont = sourceNode.attributes.getNamedItem("font");
		if (sourceFont != null) this.fontSize = sourceFont.nodeValue;
		else this.fontSize = "18px prstart";
		this.updateText(sourceNode.childNodes[0].nodeValue);

		if (messagesXML.getElementById("htp" + (_page-1)) != null) {
			var backButton = msgTextBox(87, 535, 100, 0, CENTER_TEXT + "Back", this, "clickable", "14px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.GREY, opacity:1}, {col:MY_COLORS.GREY_SHINE, opacity:1});
			backButton.self_click = function() {
				saveStringCookie("help_page", _page - 1);
				this.linkedTo.adjust(_page - 1);
			}
			this.elems.push(backButton);
		}
		
		var exitButton = msgTextBox(274, 535, 252, 0, CENTER_TEXT + "Alright, let's go !", this, "clickable", "14px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.GREY, opacity:1}, {col:MY_COLORS.GREY_SHINE, opacity:1});
		exitButton.self_click = function() {
			tooltip = undefined;
		}
		this.elems.push(exitButton);
		
		if (messagesXML.getElementById("htp" + (_page+1)) != null) {
			var nextButton = msgTextBox(613, 535, 100, 0, CENTER_TEXT + "Next", this, "clickable", "14px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.GREY, opacity:1}, {col:MY_COLORS.GREY_SHINE, opacity:1});
			nextButton.self_click = function() {
				saveStringCookie("help_page", _page + 1);
				this.linkedTo.adjust(_page + 1);
			}
			this.elems.push(nextButton);
		}
		
		var fullImage = sourceNode.attributes.getNamedItem("img");
		if (fullImage != null) {
			this.elems.push(ImageBox(Number(sourceNode.attributes.getNamedItem("x").nodeValue), Number(sourceNode.attributes.getNamedItem("y").nodeValue), 0, 0, fullImage.nodeValue));
		}
	}
	helpBox.adjust(page);
	return helpBox;
}


function initEventBox(x, y, w, h) {
	eventBox = msgTextBox(x, y, w, h, "", undefined, undefined, "14px prstart", true, {col:MY_COLORS.BLUE, thick:6}, {col:MY_COLORS.LIGHT_BLUE, opacity:1});
	eventBox.originH = h;
	eventBox.timer = 0;
	
	eventBox.nextLivePhase = function(val) {
		var ph = this.currentPhase + val;
		while (ph >= 0 && ph < this.phases.length) {
			if (this.scripts[this.phases[ph]].length > 0) return ph;
			ph += val;
		}
	}
	
	eventBox.adjustToPhase = function() {
		this.doNotDisplay = [];
		if (this.currentPhase == 0) retrieveGame(autosave);
		else retrieveGame(previewSaves[this.phases[this.currentPhase - 1]]);
		blinkingValDisplays.update();
		retrieveGame(previewSaves[this.phases[this.currentPhase]]);
		blinkingValDisplays.update();
		wheelDisplay.showPhase(this.phases[this.currentPhase]);
		var nph;
		var newMsg = CENTER_TEXT + initials(this.phases[this.currentPhase]) + " Phase\n\n" + this.scripts[this.phases[this.currentPhase]].join("\n");
		this.updateText(newMsg);
		for (let i of [[0, -1, "Back", "Cancel"], [1, 1, "Next", "Ok!"]]) {
			nph = this.nextLivePhase(i[1]);
			if (nph == undefined) {
				var goodText = i[3];
				if (i[0] == 0) {
					if (donePhases.length > 0) this.doNotDisplay.push(this.elems[i[0]]);
					else this.elems[i[0]].mainSelfClick = function() {
						removeElem(this.linkedTo, gameCanvas.elems[1]);
						removeElem(this.linkedTo, gameCanvas.anims);
						retrieveGame(autosave);
						blinkingValDisplays.update();
						blinkingValDisplays.update();
						signalStandBy();
						previewDone = false;
						wheelDisplay.resetStates();
					}
				}
				else this.elems[i[0]].mainSelfClick = function() {
					var metNonDeterministic = false;
					donePhases = [];
					previewDone = true;
					for (let i of this.linkedTo.phases) {
						if (nbIn(i, nonDeterministicPhases) > 0) {
							previewDone = false;
							break;
						}
						donePhases.push(i);
					}
					nonDeterministicPhases = [];
					if (donePhases.length > 0) retrieveGame(previewSaves[donePhases[donePhases.length-1]]);
					wheelDisplay.processingTurn = true;
					removeElem(this.linkedTo, gameCanvas.elems[1]);
					removeElem(this.linkedTo, gameCanvas.anims);
				}
			} else {
				var goodText = i[2];
				this.elems[i[0]].targetPhase = nph;
				this.elems[i[0]].mainSelfClick = function() {
					this.linkedTo.currentPhase = this.targetPhase;
					this.linkedTo.adjustToPhase();
				}
			}
			
			this.elems[i[0]].self_click = function() {
				wheelDisplay.clock = 0;
				this.mainSelfClick();
			}
			this.elems[i[0]].updateText(CENTER_TEXT + goodText);
		}
	}
	
	eventBox.adjust = function(scripts) {
		this.h = this.originH;
		this.scripts = scripts;
		this.phases = [];
		this.currentPhase = undefined;
		for (let i in scripts) {
			this.phases.push(i);
			if (scripts[i].length > 0 && nbIn(i, donePhases) <= 0 && this.currentPhase == undefined) this.currentPhase = this.phases.length-1;
		}
		if (this.currentPhase == undefined) this.currentPhase = 0;
		this.elems = [];
		var prevButton = msgTextBox(0, 0, 100, 0, "", this, "clickable", "14px prstart", false, {col: "#ff8080", thick:4}, {col:MY_COLORS.LIGHT_RED, opacity:1}, {col:MY_COLORS.LIGHT_RED_SHINE, opacity:1});
		var nextButton = msgTextBox(0, 0, 100, 0, "", this, "clickable", "14px prstart", false, {col: "#ff8080", thick:4}, {col:MY_COLORS.LIGHT_RED, opacity:1}, {col:MY_COLORS.LIGHT_RED_SHINE, opacity:1});
		addSubBox(this, [prevButton, nextButton]);
		for (let i of this.elems) i.y -= 42;
		this.elems.push(initHScrollBar(this.x + 8, this.y + this.h - 40, this.w - 16, this));
		this.adjustToPhase();
	}
	
	eventBox.animate = function() {
		this.timer += 1;
		if (this.timer == 60) this.border.col = MY_COLORS.DARK_ORANGE_SHINE;
		else if (this.timer >= 80) {
			this.timer = 0;
			this.border.col = MY_COLORS.BLUE;
		}
	}
	
	return eventBox;
}


function tutorialBox(nb) {
	var tutoNode = messagesXML.getElementById("tuto" + nb);
	var opacity;

	var baseTutoBox = msgTextBox(0, 0, 0, 0, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0});

	for (let i of tutoNode.getElementsByTagName("shadow")) {
		baseTutoBox.elems.push(msgTextBox(0, 0, 0, 0, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.1}));
		for (let j of ["x", "y", "w", "h"]) {
			baseTutoBox.elems[baseTutoBox.elems.length-1][j] = Number(i.attributes.getNamedItem(j).nodeValue);			
		}
		opacity = i.attributes.getNamedItem("opacity");
		if (opacity == null) baseTutoBox.elems[baseTutoBox.elems.length-1].background.opacity = 0.1;
		else baseTutoBox.elems[baseTutoBox.elems.length-1].background.opacity = Number(opacity.nodeValue);
	}

	var tutoText = tutoNode.childNodes[0].nodeValue;
	var tutoBoxDimensions = {};
	for (let i of ["x", "y", "w", "h"]) {
		tutoBoxDimensions[i] = Number(tutoNode.attributes.getNamedItem(i).nodeValue);
	}
	var tutoBox = msgTextBox(tutoBoxDimensions.x, tutoBoxDimensions.y, tutoBoxDimensions.w, tutoBoxDimensions.h, tutoText, undefined, "dragged", "14px prstart", true, {col:MY_COLORS.BROWN, thick:5}, {col:MY_COLORS.LIGHT_BROWN, opacity:1});
//	var cancelButton = msgTextBox(0, 0, 125, 0, CENTER_TEXT + "Main Menu", baseTutoBox, "clickable", "14px prstart", false, {col: "#ff3300", thick:2}, {col:MY_COLORS.DARK_ORANGE, opacity:1}, {col:MY_COLORS.DARK_ORANGE_SHINE, opacity:1});
	var nextButton = msgTextBox(0, 0, 125, 0, CENTER_TEXT + "Ok !", baseTutoBox, "clickable", "14px prstart", false, {col: "#ff3300", thick:2}, {col:MY_COLORS.DARK_ORANGE, opacity:1}, {col:MY_COLORS.DARK_ORANGE_SHINE, opacity:1});
	addSubBox(tutoBox, [nextButton]);//[cancelButton, nextButton]);
//	cancelButton.self_click = function() {
//		newgameScreenSetup();
//	}
	nextButton.self_click = function() {
		removeElem(this.linkedTo, gameCanvas.elems[1]);
	}

	baseTutoBox.elems.push(tutoBox);
	return baseTutoBox;
}

function loadTutorial() {
	gameCanvas.elems[1].push(tutorialBox(2));
}


function mainScreenSetup1(playedTribe) {
	resetScreen();
	currentBestScore = loadParsedCookie(playedTribe);
	discoveredCombos = loadParsedCookie("discoveredCombos");
	if (discoveredCombos == undefined) discoveredCombos = [];

	actionPreview = loadParsedCookie("actionPreview", true);
	invertArrows = loadParsedCookie("invertArrows", 1);
	var speed = loadParsedCookie("speed", "*1");
	wheelDisplay.updateSpeed(speed);
	
	initBlinkingValDisplays({
		year : simpleLine(60, 70, "Year [gameState.year]"),
		food : simpleLine(60, 110, "[gameState.food]/[maxFood()]"),
		happiness : simpleLine(60, 155, "[gameState.happiness]/[maxHappiness()]"),
		pop : simpleLine(60, 200, "[popTotal()]"),
		innovation : simpleLine(60, 245, "[innovationTotal()]/[maxInnovations()]"),
		actions : simpleLine(0, 0, "[gameState.actions]")
	});

	logOpener = expandableImgBox(625, 568, 32, 32, "scroll", logDisplay);
	logOpener.display = function() {
		drawProdTile32(this.imgRef, this.x, this.y, this.w, this.h);
		drawTextTight("Event log", "14px prstart", this.x+32, this.y+25);
		if (phase.split("|")[0] != "stand-by" && !actionPreview) this.fullTtip.display();
	}
	gameCanvas.elems[0].push(logOpener);

	gameCanvas.elems[0].push(expandableImgBox(0, 0, 32, 32, "options_corner", initOptionBox()));
	var hBox = expandableImgBox(64, 0, 32, 32, "help_border", initHelpBox());
	gameCanvas.elems[0].push(hBox);
	if (playedTribe != "easy mode" && !loadParsedCookie("explained_enemies", false)) {
		hBox.fullTtip.adjust(ENEMIES_PAGE);
		tooltip = hBox.fullTtip;
		saveStringCookie("explained_enemies", true);
		saveStringCookie("help_page", ENEMIES_PAGE);
	}
	else if (loadParsedCookie("help_page", undefined) == undefined) {
		tooltip = hBox.fullTtip;
		saveStringCookie("help_page", 1);
	}


	gameCanvas.elems[0].push(wheelDisplay);
	gameCanvas.elems[0].push(rosterDisplay);
	gameCanvas.elems[0].push(techDisplay);
	
	gameCanvas.elems[0].push(foodTile);
	gameCanvas.elems[0].push(happinessTile);
	
	if (difficultyRatio(TRIBES[prodsXML.getElementById(playedTribe).attributes.getNamedItem("setup").nodeValue]) > 0) var _tribeMsgNode = "tribe_and_score";
	else var _tribeMsgNode = "tribe_only";
	gameCanvas.elems[0].push(TileImageBox(10, 45, 32, 32, playedTribe, {
		x : 52,
		y : 87,
		w : 600,
		h : 450,
		msg : messagesXML.getElementById(_tribeMsgNode).childNodes[0].nodeValue
	}));
	gameCanvas.elems[0].push(TileImageBox(10, 175, 32, 32, "popGlobal", {
		x : 52,
		y : 187,
		w : 600,
		h : 500,
		msg : messagesXML.getElementById("population").childNodes[0].nodeValue
	}));
	gameCanvas.elems[0].push(TileImageBox(10, 220, 32, 32, "innovation", {
		x : 52,
		y : 232,
		w : 500,
		h : 350,
		msg : messagesXML.getElementById("innovation").childNodes[0].nodeValue
	}));
	
	if (CHEAT_ON) {
		gameCanvas.elems[0].push(initNumberButton(43, 84, 16, 16, "food", 1, ["cheatPlus", "cheatPlusClick"]));
		gameCanvas.elems[0].push(initNumberButton(43, 101, 16, 16, "food", -1, ["cheatMinus", "cheatMinusClick"]));
		var happinessCheats = [
			initNumberButton(43, 129, 16, 16, "happiness", 1, ["cheatPlus", "cheatPlusClick"]),
			initNumberButton(43, 146, 16, 16, "happiness", -1, ["cheatMinus", "cheatMinusClick"])
		];
		for (let i of happinessCheats) {
			i.self_click = function() {
				modify(this.target, this.change);
				autosave = storeGame();
				signalComboChanged();
			}
			gameCanvas.elems[0].push(i);
		}
	}

	gameCanvas.elems[0].push(comboDisplay);

	gameCanvas.anims = [];
	gameCanvas.anims.push(wheelDisplay);
	gameCanvas.anims.push(comboDisplay);
	gameCanvas.anims.push(rosterDisplay);
	gameCanvas.anims.push(techDisplay);
	gameCanvas.anims.push(logDisplay);
	
//	gameCanvas.elems[1].push(tutorialBox(1));

}



