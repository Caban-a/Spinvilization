INTRO_REEL_LENGTH = 10;
MAX_SPEED = 4;
INTRO_TILE_SIZE = 64;
X_SEPARATION = 4;
NB_INTRO_REELS = 15;



function initTitle(x, y, name) {
	var title = {x:x, y:y, name:name, color:color};
	
	title.display = function() {
		var color = "#ffffff";
		if (this.animateTime <= 0) color = backgroundColor;
		drawTextTight(this.name, "64px prstart", x, y, undefined, undefined, {color:color, thick:6});
	}
		this.name = "Spin-vilization".slice(Math.max(0, Math.ceil(this.animateTime/20)));
		for (let i=0; i<Math.min(5, Math.ceil(this.animateTime/20)); i+=1) {
			this.name = pickRandomChar(this.rndLetters) + this.name;
		}
		if (this.animateTime > 0) this.animateTime -= 1;
	
}

function initIntroReel(x, y, possibleSymbols) {
	var introReel = {offset:[x, y], speedY:1 + Math.floor(Math.random() * MAX_SPEED)};
	introReel.roster = [];
	for (let i=0; i<(Math.random()*INTRO_REEL_LENGTH) + 3; i+=1) {
		introReel.roster.push(possibleSymbols[Math.floor(Math.random() * possibleSymbols.length)]);
	}
	
	introReel.display = function() {
		var mainOffset = - this.roster.length * INTRO_TILE_SIZE;
		while(mainOffset < GAME_WINDOW_H) {
			for (let j=0; j<this.roster.length; j+=1) {
				drawProdTile32(this.roster[j], this.offset[0] - (INTRO_TILE_SIZE * 2), this.offset[1] + mainOffset + (j*INTRO_TILE_SIZE), INTRO_TILE_SIZE, INTRO_TILE_SIZE);
			}
			mainOffset += this.roster.length * INTRO_TILE_SIZE;
		}
	}
	
	introReel.animate = function(mainSpeed) {
		this.offset[0] = modulo(this.offset[0] + mainSpeed[0], (INTRO_TILE_SIZE + X_SEPARATION) * NB_INTRO_REELS);
		this.offset[1] = modulo(this.offset[1] + this.speedY + mainSpeed[1], this.roster.length*INTRO_TILE_SIZE);
	}
	introReel.mouseEvent = mouseEvent;
	return introReel;
}

function initIntroBack() {
	var introBack = {x:0, y:0, w:GAME_WINDOW_W, h:GAME_WINDOW_H, elems : [], offset : [0, 0], speed : [-2, 0], back : {r : 0, g : 255, b : 0}, name:"", animateTime:300, rndLetters:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789+-*/"};
	var symbols = [];
	for (let i of ["prod", "weather", "land", "enemy"]) {
		for (let j of prodsXML.getElementsByTagName(i)) {
			if (j.attributes.getNamedItem("icon_id").nodeValue != "0") symbols.push(j.attributes.getNamedItem("id").nodeValue);
		}
	}
	for (let i=0; i<NB_INTRO_REELS; i+=1) {
		introBack.elems.push(initIntroReel(i*(INTRO_TILE_SIZE + X_SEPARATION), 0, symbols));
	}
	var greyShade = msgTextBox(0, 0, GAME_WINDOW_W, GAME_WINDOW_H, "", undefined, undefined, "14px prstart", false, undefined, {col:"#000000", opacity:0.25});
	greyShade.self_click = function() {return false;}
	introBack.elems.push(greyShade);
	
	
	introBack.display = function() {
		for (let i of this.elems) i.display();
		
		var color = "#ffffff";
		if (this.animateTime <= 0) color = backgroundColor;
		drawTextTight(this.name, "64px prstart", 40, 300, undefined, undefined, {color:color, thick:6});
	}
	
	
	introBack.animate = function() {
		backgroundColor = randomColorChange(this.back);
		
		this.name = "Spin-vilization".slice(Math.max(0, Math.ceil(this.animateTime/20)));
		for (let i=0; i<Math.min(5, Math.ceil(this.animateTime/20)); i+=1) {
			this.name = pickRandomChar(this.rndLetters) + this.name;
		}
		if (this.animateTime > 0) this.animateTime -= 1;
		
		for (let i of this.elems) i.animate(this.speed);
	}
	introBack.mouseEvent = mouseEvent;
	introBack.self_click = function() {
		newgameScreenSetup();
	}
	return introBack;
}


function introScreenSetup() {
	resetScreen();
	var introBack = initIntroBack();
	gameCanvas.elems[0] = [];
	gameCanvas.elems[0].push(introBack);

	gameCanvas.anims = [];
	gameCanvas.anims.push(introBack);
}




