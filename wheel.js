var MAX_TIME_POSSIBLE = 1000000;
var MAX_SPIN_SPEED = 64 + 40;
var SPINNING_SPEEDS = {
	"*0.5" : 50,
	"*1" : 40,
	"*2" : 35,
	"*3" : 30,
	"instant" : 0
}

var WHEEL_TIMERS = {
	"*0.5" : {
		"combo" : 0,
		"tribe" : 290,
		"adversity" : 290,
		"vanquish" : 290,
		"year end|wait" : 100,
		"new_roll" : 60,
		"new_roll|recycle" : 20
	},
	"*1" : {
		"combo" : 0,
		"tribe" : 150,
		"adversity" : 150,
		"vanquish" : 150,
		"year end|wait" : 50,
		"new_roll" : 30,
		"new_roll|recycle" : 10
	},
	"*2" : {
		"combo" : 0,
		"tribe" : 90,
		"adversity" : 90,
		"vanquish" : 90,
		"year end|wait" : 25,
		"new_roll" : 20,
		"new_roll|recycle" : 8
	},
	"*3" : {
		"combo" : 0,
		"tribe" : 50,
		"adversity" : 50,
		"vanquish" : 50,
		"year end|wait" : 20,
		"new_roll" : 10,
		"new_roll|recycle" : 5
	}
};


function initBasicWheelDisplay(x, y) {
	var bwd = {centerX:x, y:y};
	
	bwd.adjust_full = function() {
		if (this.wheelData == undefined) var oldWheelData = [];
		else var oldWheelData = this.wheelData;
		this.wheelData = [];
		this.w = gameState.wheel.length * 64;
		this.h = 192;
		this.x = this.centerX - Math.floor(this.w/2);
		this.elems = [[], [], []];
		this.processingTurn = false;
		this.clock = 0;
		for (let i=0; i<gameState.wheel.length; i+=1) {
			if (i < oldWheelData.length) this.wheelData.push(oldWheelData[i]);
			else this.wheelData.push({offset:0, state:"", speed:0});
			this.elems[0].push([]);
			for (let j=0; j<4; j+=1) {
				this.elems[0][i].push(ImageBox(this.x+(i*64), this.y+(j*64), 64, 64, "tileMap32", 0, 0, 32, 32));
			}
			this.elems[1].push([]);

			for (let j of [[-34, {
					ok : "arrowBlueUp",
					ok_hovered : "arrowLightBlueUp",
					blocked : "arrowGreyUp",
					refund : "arrowGreenUp",
					refund_hovered : "arrowLightGreenUp"
				}, -1], [this.h - 30, {
					ok : "arrowBlueDown",
					ok_hovered : "arrowLightBlueDown",
					blocked : "arrowGreyDown",
					refund : "arrowGreenDown",
					refund_hovered : "arrowLightGreenDown"
					}, 1]]) {
				var arrowBox = TileImageBox(this.x + (i*64), this.y + j[0], 64, 64, j[1]);
				var abSelfClick = this.arrowBoxSelfClick;
				var abDisplay = this.arrowBoxDisplay;				
				arrowBox.self_click = function() {return abSelfClick(i, j[2] * invertArrows);}
				
				arrowBox.drawLiveTile = function(goodImg) {
					if (this == mouseIn || bwd.elems[0][i][2 + j[2]] == mouseIn) goodImg += "_hovered";
					drawProdTile32(this.imgRef[goodImg], this.x, this.y, this.w, this.h);
				}

				arrowBox.display = function() {abDisplay(this, i, j[2] * invertArrows);}

				this.elems[1][i].push(arrowBox);
			}
		}
	}
		
	bwd.forgetReels = function() {
		for (let i of this.wheelData) {
			i.old = undefined;
		}
	}
	
	bwd.showConditions = function() {}
	
	bwd.indicateLocked = function() {}
	
	bwd.display = function() {
		var rightProd;
		var offset;
		var directionalCost;
		gameStyle.save();
		gameStyle.rect(this.x, this.y, this.w, this.h);
		gameStyle.clip();
		for (let i=0; i<gameState.wheel.length; i+=1) {
			for (let j=0; j<4; j+=1) {
				offset = modulo(j - (Math.floor(this.wheelData[i].offset/64) + 2), gameState.roster.length);
				rightProd = actualReel(i, offset);
				if (rightProd == "spinning" && this.wheelData[i].speed < this.spinMaxSpeed) rightProd = gameState.roster[(this.wheelData[i].old + offset + gameState.roster.length) % gameState.roster.length];
				this.elems[0][i][j].ox = prods[rightProd][0]*32;
				this.elems[0][i][j].oy = prods[rightProd][1]*32;
				this.elems[0][i][j].y = this.y + ((j - 1) * 64) + (this.wheelData[i].offset % 64);
				this.elems[0][i][j].display();
				this.indicateLocked(i, j);
				if (offset == 0 && this.wheelData[i].speed < Math.max(this.spinMaxSpeed, 1)) this.showConditions(i, j);
				if (j != 2) drawRectangle(this.elems[0][i][j].x, this.y + ((j - 1) * 64), 64, 64, "black", 10, true, 0.2);
			}
			
			if (actualReel(i, 0) == "spinning") continue;
		}
		gameStyle.restore();
		for (let i of this.elems[2]) {
			i.display();
		}
		for (let i=1; i<gameState.wheel.length; i+=1) {
			drawRectangle(this.x+(i*64), this.y, 1, this.h, "black", "1");
		}
		drawRectangle(this.x-5, this.y+1, this.w+10, this.h-2, "red", "10");
		for (let i=0; i<gameState.wheel.length; i+=1) {
			for (let j of this.elems[1][i]) {
				j.display();
			}
			if (gameState.wheel[i].locked) {
				drawRectangle(this.x + (i * 64) + 2, this.y - 5, 60, this.h + 10, "yellow", 10);
				drawRectangle(this.x + (i * 64), this.y + 44, 64, 24, "yellow", 10, true);
				drawTextTight("LOCKED", "12px prstart", this.x + (i * 64) + 1, this.y + 60, 16, 32);
			}
			directionalCost = gameState.wheel[i].stepCost * invertArrows;
			if (directionalCost > 0) drawTextTight(directionalCost, "20px prstart", this.x + (i * 64) + 22, this.y + this.h + 32, 32);
			else if (directionalCost < 0) drawTextTight(Math.abs(directionalCost), "20px prstart", this.x + (i * 64) + 22, this.y - 16, 32);
		}
		if (mouseIn != undefined) {
			if (mouseIn.comboUse != undefined) {
				for (let i of mouseIn.comboUse) {
					drawProdTile32("circle", this.elems[0][i][2].x, this.elems[0][i][2].y, 64, 64);
				}
			}
			else {
				for (let i of this.elems[0]) {
					if (i[2] == mouseIn) drawRectangle(i[2].x, i[2].y, 64, 64, "#FFAA00", 10, true, 0.2);
				}
			}
		}
	}
	
	bwd.sub_mousemove = function(type, column, line) {
		if (typeof line != "number") mouseIn = this.elems[type][column];
		else if (type != 0 || line != 0) mouseIn = this.elems[type][column][line];
	};
	
	bwd.mouseEvent = mouseEvent;
	return bwd;
}


function initMainWheelDisplay(x, y) {
	var mainWd = initBasicWheelDisplay(x, y);
	
	mainWd.arrowBoxSelfClick = function(pos, direction) {
		tryStep(pos, direction);
		return true;
	};
	
	mainWd.arrowBoxDisplay = function(arrow, pos, direction) {
		var goodImg;
		if (tryStep(pos, direction, true)) {
			if (gameState.wheel[pos].steps * direction >= 0) goodImg = "ok";
			else goodImg = "refund";
			arrow.drawLiveTile(goodImg);
		} else drawProdTile32(arrow.imgRef.blocked, arrow.x, arrow.y, arrow.w, arrow.h);
	}
	
	mainWd.base_adjust = mainWd.adjust_full;
	mainWd.adjust_full = function() {
		this.base_adjust();
				
		spinButton = TileImageBox(this.x + this.w + 20, this.y + 64, 64, 64, ["recycle", "recycle2", "recycle3", "recycle4", "recycle5", "recycle6", "recycle7", "recycle8"], {
			x : 505,
			y : 200,
			w : 280,
			h : 0,
			msg : ""
		}, 640);
		spinButton.seasons = ["tree_winter", "tree_fall", "tree_summer", "tree_spring"];
		spinButton.bloom = ["tree_winter", "tree_bloom1", "tree_bloom2", "tree_spring"];
		spinButton.self_click = function() {tryRecycle()};
		spinButton.animate = function() {
			if (gameState.actions > 0) {
				this.ttip.msg = "Recycle all reels\nCosts 1 Action";
				if (phase == "new_roll|recycle") this.timer = (this.timer + 80) % this.maxTimer;
				else if (this == mouseIn) this.timer = (this.timer + 8) % this.maxTimer;
				else if (phase.split("|")[0] == "stand-by") this.timer = (this.timer + 1) % this.maxTimer;
			}
			else {
				this.ttip.msg = "Move on to next year\nConsumes [popTotal()] {foodStorage}";
				if (this == mouseIn) this.timer = (this.timer + 16) % this.maxTimer;
				else this.timer = 0;
			}
		}
		spinButton.display = function() {
			if (gameState.actions > 0) {
				var season = Math.max(0, Math.min(3, Math.floor(gameState.actions * 4 / actionsPerYear())));
				drawProdTile32(this.seasons[season], this.x, this.y, this.w, this.h);
				drawProdTile32(this.imgRef[Math.floor(this.timer * this.imgRef.length / this.maxTimer)], this.x, this.y, this.w, this.h);
			}
			else drawProdTile32(this.bloom[Math.floor(this.timer * this.bloom.length / this.maxTimer)], this.x, this.y, this.w, this.h);
		};

		this.elems[2].push(spinButton);
		blinkingValDisplays.blinkingValues.actions.x = this.x + this.w + 40;
		blinkingValDisplays.blinkingValues.actions.y = this.y + 50;
		if (CHEAT_ON) {
			this.elems[2].push(initNumberButton(this.x + this.w + 32, this.y + 144, 16, 16, "actions", 1, ["cheatPlus", "cheatPlusClick"]));
			actionsMinus = initNumberButton(this.x + this.w + 52, this.y + 144, 16, 16, "actions", -1, ["cheatMinus", "cheatMinusClick"]);
			actionsMinus.self_click = function() {
				if (gameState.actions > 0) gameState.actions -= 1;
				autosave = storeGame();
			}
			this.elems[2].push(actionsMinus);
			var agePlus = initNumberButton(this.x - 32, this.y + 144, 16, 16, "", 1, ["cheatPlus", "cheatPlusClick"]);
			agePlus.self_click = function() {
				if (gameState.wheel.length >= 5) return;
				gameState.wheel.push(newReel());
				rollWheel();
			}
			this.elems[2].push(agePlus);
			var ageMinus = initNumberButton(this.x - 32, this.y + 164, 16, 16, "", -1, ["cheatMinus", "cheatMinusClick"]);
			ageMinus.self_click = function() {
				if (gameState.wheel.length <= 1) return;
				gameState.wheel.pop();
				signalWheelChanged();
			}
			this.elems[2].push(ageMinus);
		}
	}
	
	mainWd.updateSpeed = function(newSpeed) {
		this.speed = newSpeed;
		this.spinMaxSpeed = SPINNING_SPEEDS[newSpeed];
		if (this.spinMaxSpeed == undefined) this.spinMaxSpeed = 0;
	}
	
	mainWd.time = function(phase, chosenSpeed) {
		if (chosenSpeed == undefined) chosenSpeed = this.speed;
		if (chosenSpeed == "instant") return 0;
		var totalTime = WHEEL_TIMERS[chosenSpeed][phase];
		if (totalTime == undefined) return 0;
		if (nbIn(phase, ["combo", "year end|wait", "new_roll", "new_roll|recycle"]) > 0) totalTime += this.spinMaxSpeed;
		return totalTime;
	}
	
	mainWd.resetStates = function() {
		for (let i of this.wheelData) {
			i.state = "";
		}		
	}
	
	mainWd.spinAll = function() {
		this.resetStates();
		for (let i=0; i<this.wheelData.length; i+=1) {
			if (!gameState.wheel[i].locked) gameState.wheel[i].prodRef = undefined;
		}
	}
	
	mainWd.spinComboReels = function() {
		for (let i=0; i<this.wheelData.length; i+=1) {
			if (gameState.wheel[i].usedForCombo) {
				gameState.wheel[i].prodRef = undefined;
			}
		}
	}
	
	mainWd.showEffects = function(aPhase) {
		for (let i=0; i<this.wheelData.length; i+=1) {
			if (gameState.wheel[i].activated && actOnTribeOrAdversity(prodsXML.getElementById(actualReel(i, 0)), aPhase)) this.wheelData[i].state = BLINK;
		}
		for (let i in gameState.neutralized) for (let j of gameState.neutralized[i]) {
			if (j[0] != undefined) this.wheelData[j[0]].state = BLINK;
		}
		for (let i of gameState.killed) {
			if (i[0] != undefined) this.wheelData[i[0]].state = BLINK;
		}
	}

	mainWd.showPhase = function(aPhase) {
		this.resetStates();
		if (nbIn(aPhase.split("|")[0], ["combo", "tribe", "adversity", "vanquish"]) > 0) {
			this.showEffects(aPhase);
		}
	}

	mainWd.checkPhase = function() {
		var passiveReacted;
		if (phase.split("|")[0] == "combo") {
			moveOn("tribe");
			this.clock = this.time("tribe");
		}
		else if (nbIn(phase.split("|")[0], ["tribe", "adversity"]) > 0) {
			this.resetStates();
			for (let i=0; i<this.wheelData.length; i+=1) {
				if (gameState.wheel[i].activated) continue;
				passiveReacted = passiveEffect(i);
				if (passiveReacted[1]) this.wheelData[i].state = BLINK;
				if (passiveReacted[0]) {
					this.clock = 0;
					return;
				}
			}
			moveOn(shiftElem(phase.split("|")[0], COMMON_PHASES, 1));
			this.clock = this.time(phase.split("|")[0]);
		}
		else if (phase == "vanquish") {
			this.resetStates();
			passiveReacted = signalVanquisher();
			if (passiveReacted != undefined) {
				if (!isNaN(passiveReacted[0])) this.wheelData[Number(passiveReacted[0])].state = BLINK;
				for (let i of passiveReacted[1]) {
					if (i[0] == undefined) continue;
					this.wheelData[i[0]].state = BLINK;
				}
			}
			else {
				sweep();
				phase = "vanquish|waitVictoryChoice";
			}
			this.clock = 0;
		}
			
		else if (phase == "vanquish|waitVictoryChoice") {
			this.clock = 0;
			if (gameState.actions <= 0) moveOn("year end");
			else moveOn("turn_end");
		}
			
		else if (phase == "year end") {
			this.spinAll();
			changeYear();
			this.clock = 0;
			moveOn("year end|wait");
		}
		else if (phase == "year end|wait") {
			this.clock = 0;
			phase = "turn_end";
		}
			
		else if (phase == "turn_end") {
			if (computingPreview()) {
				rewind();
				return;
			}
			for (let i in actionLogs) gameLog = gameLog.concat(actionLogs[i]);
			if (gameState.actions <= 0) newYear();
			else {
				gameState.actions -= 1;
				this.spinAll();
			}
			phase = "new_roll";
			this.clock = 0;
		}
		
		else if (phase == "new_roll") {
			resetTurn();
			updateRoster();
			phase = "new_roll|choose";
			this.clock = 0;
		}
		
		else if (phase == "new_roll|recycle") {
			phase = "new_roll|choose";
			this.clock = 0;
		}
		
		else if (phase == "new_roll|choose") {
			rollWheel();
		}
	}
	
	mainWd.forgetReels = function() {
		for (let i of this.wheelData) {
			i.old = undefined;
		}
	}
	
	mainWd.phaseTime = function() {
		if (actionPreview && phase.split("|")[0] != "new_roll") return 0;
		return this.time(phase);
	}
	
	mainWd.advanceTurn = function() {
		while (phase.split("|")[0] != "stand-by" && this.clock >= this.phaseTime() && gameCanvas.elems[1].length <= 0) {
			this.checkPhase();
		}
		if (phase != "stand-by") this.clock = (this.clock + 1) % MAX_TIME_POSSIBLE;
	}
	
	mainWd.animate = function() {
		blinkingValDisplays.animate();
		
		this.advanceTurn();
		

		var actualData;
		for (let i=0; i<this.wheelData.length; i+=1) {
			actualData = this.wheelData[i];
			if (actualReel(i, 0) == "spinning") {
				if (actualData.speed >= this.spinMaxSpeed || actualData.old == undefined) actualData.speed = Math.floor(Math.random() * 8) + MAX_SPIN_SPEED;
				else if (actualData.speed >= 0) actualData.speed += 1;
				else actualData.speed = - actualData.speed;
			}
			else if (actualData.old == undefined) {
				if (actualData.speed >= this.spinMaxSpeed) {
					actualData.speed = this.spinMaxSpeed;
					actualData.offset = modulo(- (this.spinMaxSpeed * (this.spinMaxSpeed - 1) / 2), 64 * gameState.roster.length);
				}
				if (actualData.speed > 0) actualData.speed -= 1;
				else {
					actualData.offset = 0;
					actualData.speed = 0;
					actualData.old = gameState.wheel[i].prodRef;
				}
			}
			else {
				actualData.old = gameState.wheel[i].prodRef;
				if (actualData.speed >= this.spinMaxSpeed) {
					actualData.speed = - this.spinMaxSpeed;
					actualData.offset = modulo((this.spinMaxSpeed * (this.spinMaxSpeed - 1) / 2), 64 * gameState.roster.length);

				}
				if (actualData.speed < 0) actualData.speed += 1;
				else actualData.speed = -actualData.speed;
			}
			actualData.offset = (actualData.offset + actualData.speed + (64 * gameState.roster.length)) % (64 * gameState.roster.length);
		}
		
		this.elems[2][0].animate();
	}
	
	mainWd.blinkOut = function(pos) {
		return (this.wheelData[pos].state == BLINK && this.clock % 20 >= 10);
	}
	
	mainWd.showConditions = function(pos, off) {
		var hasCondition = false;
		if (enemyKilled(pos)) {
			hasCondition = true;
			if (!this.blinkOut(pos)) drawProdTile32("cross", this.elems[0][pos][off].x, this.elems[0][pos][off].y, 64, 64);
		}
		if (enemyNeutralized(pos)) {
			if (hasCondition || !this.blinkOut(pos)) drawProdTile32("stun", this.elems[0][pos][off].x, this.elems[0][pos][off].y, 64, 64);
			hasCondition = true;
		}
		if (!hasCondition && this.wheelData[pos].state == BLINK && !this.blinkOut(pos)) drawRectangle(this.elems[0][pos][off].x, this.elems[0][pos][off].y, 64, 64, "orange", 10, true, 0.2);
	}

	mainWd.base_display = mainWd.display;
	mainWd.display = function() {
		blinkingValDisplays.display();
		this.base_display();
	}
	
	mainWd.sub_click = function(type, column, line) {
		if (type == 0) {
			if (line == 2) tryLock(column);
			else if (line != 0) tryStep(column, (line - 2) * invertArrows);
		}
		return true;
	};
	
	return mainWd;
}


function initMenuWheelDisplay(x, y) {
	var menuWd = initBasicWheelDisplay(x, y);
	
	menuWd.adjust_base = menuWd.adjust_full;
	menuWd.adjust_full = function() {
		var actu;
		var setup;
		this.adjust_base();
		this.tribes = {};
		this.autosave = loadCookie("autosave");
		if (this.autosave != undefined) this.autosave = JSON.parse(this.autosave);
		for (let i of gameState.roster) {
			actu = prodsXML.getElementById(i);
			if (actu == null) continue;
			if (actu.tagName != "tribe") continue;
			setup = TRIBES[actu.attributes.getNamedItem("setup").nodeValue];
			this.tribes[i] = loadParsedCookie(setup.tribe);
		}
	}
	
	menuWd.arrowBoxSelfClick = function(pos, direction) {
		gameState.wheel[pos].prodRef = (gameState.wheel[pos].prodRef + direction + gameState.roster.length) % gameState.roster.length;
		tribeBox.adjust();
		return true;
	};
	
	menuWd.arrowBoxDisplay = function(arrow, pos, direction) {
		arrow.drawLiveTile("ok");
	}
	
	menuWd.indicateLocked = function(pos, offset) {
		var actu = actualReel(pos, offset - 2);
		if (actu == "codex") return;
		if (actu == "autosave" && this.autosave != undefined) return;
		if (!isNaN(this.tribes[actu])) return;
		drawProdTile32("cross", this.elems[0][pos][offset].x, this.y + ((offset - 1) * 64), 64, 64);
	}
	
	menuWd.sub_click = function(type, column, line) {
		if (type == 0) {
			if (nbIn(line, [1, 3]) > 0) {
				gameState.wheel[column].prodRef = (gameState.wheel[column].prodRef + line + ((gameState.roster.length - 2) * invertArrows)) % gameState.roster.length;
				tribeBox.adjust();
			};
		}
		return true;
	}
	
	return menuWd;
}
