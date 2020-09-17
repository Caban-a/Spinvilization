var GAME_WINDOW_W = 800;
var GAME_WINDOW_H = 600;
var IMG_SPACE = {16 : 4, 32 : 8};
var CENTER_TEXT = "#CENTER";

var MY_COLORS = {
	DARK_ORANGE : "#ff704d",
	DARK_ORANGE_SHINE : "#ffc060",
	LIGHT_RED : "#ff6060",
	LIGHT_RED_SHINE : "#ffb080",
	PINKISH : "#ff80d5",
	PINKISH_SHINE : "#ffc0ff",
	GREY : "#777777",
	GREY_SHINE : "#bbbb77",
	BROWN : "#ab5236",
	LIGHT_BROWN : "#ffb38c",
	VERY_LIGHT_BROWN : "#ffddcc",
	LIGHT_BLUE : "#ddeeee",
	BLUE : "#8888ff"
}

var dragged;
var mouseIn;

var tooltip;

var blinkingValDisplays;

function drawProdTile32(prod, x, y, w, h) {
	gameStyle.drawImage(allImages["tileMap32"], prods[prod][0]*32, prods[prod][1]*32, 32, 32, x, y, w, h);
}

function drawRectangle(x, y, w, h, col, thick, fill, opacity) {
	gameStyle.beginPath();
	gameStyle.lineWidth = thick;
	if (fill == true) {
		var oldStyle = gameStyle.fillStyle;
		gameStyle.fillStyle = col;
		if (opacity != undefined) gameStyle.globalAlpha = opacity;
		gameStyle.fillRect(x, y, w, h);
		gameStyle.fillStyle = oldStyle;
		gameStyle.globalAlpha = 1;
	}
	else {
		gameStyle.strokeStyle = col;
		gameStyle.rect(x, y, w, h);
		gameStyle.stroke();
	}
}

function drawText(theText, style, x, y) {
	gameStyle.fillStyle = "#000000";
	gameStyle.font = style;
	gameStyle.fillText(theText, x, y);
	gameStyle.fillStyle = "#FFFFFF";
}

function replaceValuesInText(line) {
	var tempText;
	var args;
	var called;
	var textInserts = line.split(/\[|\]/);
	for (let i=1; i<textInserts.length; i+=2) {
		tempText = textInserts[i].split(/\(|\)/);
		called = window;
		for (let j of tempText[0].split(".")) called = called[j];
		if (tempText.length > 1) {
			args = [];
			for (let j of tempText[1].split(",")) {
				if (j == "true") args.push(true);
				else if (j == "false") args.push(false);
			}
			textInserts[i] = called(...args);
		}
		else textInserts[i] = called;
	}
	return textInserts;
}

function textWidthSub(tc, toPush, lineData, fontSize, maxWidth) {
	if (lineData.pos + lineData.addedLength > maxWidth || lineData.endLine) {
		lineData.pos = 0;
		tc.push({"txt" : toPush});
	}
	else {
		tc[tc.length-1].txt += " " + toPush;
	}
	lineData.pos += lineData.addedLength + (0.75 * fontSize) + 1;
	tc[tc.length-1].len = lineData.pos;
	lineData.endLine = false;
}

function textWidth(theText, fontSize, maxWidth, imgSize) {
	var textCut = [];
	var lineData = {pos:0, addedLength:0, endLine:true};
	var textInserts;
	for (let i of theText.split("\n")) {
		textInserts = replaceValuesInText(i).join("").split(/\{|\}/);
		lineData.endLine = true;
		for (let j=0; j<textInserts.length; j+=1) {
			lineData.addedLength = IMG_SPACE[imgSize];
			if (j%2 == 1) textWidthSub(textCut, "{" + textInserts[j] + "}", lineData, fontSize, maxWidth);
			else {
				for (let k of textInserts[j].split(" ")) {
					lineData.addedLength = 0;
					for (let l=0; l<k.length; l+=1) {
						if (k[l] == "#") l += 6;
						else {
							lineData.addedLength += (0.75 * fontSize) + 1;
							if (nbIn(k[l], ["i", "l"]) > 0) lineData.addedLength -= 2;
						}
					}
					textWidthSub(textCut, k, lineData, fontSize, maxWidth);
				}
			}
		}
	}
	return textCut;
}

function drawTextTight(theText, style, x, y, imgSize, centerShift, strokeData) {
	var fontSize = Number(style.slice(0, 2));
	var toDraw;
	var indication;
	gameStyle.font = style;
	if (strokeData != undefined) {
		gameStyle.fillStyle = strokeData.color;
		gameStyle.lineWidth = strokeData.thick;
	} else gameStyle.fillStyle = "#000000";

	if (centerShift == undefined) centerShift = 0;
	theText = String(theText).split(/\{|\}/);
	for (let i=0; i<theText.length; i+=1) {
		if (i%2 == 1) {
			for (let j of theText[i].split("|")) {
				drawProdTile32(j, x + ((IMG_SPACE[imgSize] - imgSize) / 2), y + IMG_SPACE[imgSize] - imgSize, imgSize, imgSize);				
			}
			x += IMG_SPACE[imgSize];
		}
		else {
			for (let j=0; j<theText[i].length; j+=1) {
				if (theText[i][j] == "#") {
					indication = theText[i].substr(j, 7);
					if (indication == CENTER_TEXT) x += centerShift;
					else gameStyle.fillStyle = theText[i].substr(j, 7);
					j += 6;
					continue;
				}
				if (nbIn(theText[i][j], ["i", "l"])) x -= 1;
				gameStyle.fillText(theText[i][j], Math.floor(x), y);
				if (strokeData != undefined) gameStyle.strokeText(theText[i][j], Math.floor(x), y);
				x += (0.75 * fontSize) + 1;
				if (nbIn(theText[i][j], ["i", "l"])) x -= 1;
			}
		}
	}
	gameStyle.fillStyle = "#FFFFFF";
	return x;
}

function tileRef(nb) {
	return [nb%16, Math.floor(nb/16)];
}

function ImageBox(x, y, w, h, originImg, ox, oy, ow, oh) {
	var imgBox = {x:x, y:y, w:w, h:h, img:originImg, ox:ox, oy:oy, ow:ow, oh:oh};
	imgBox.display = function() {
		if (this.w != 0 && this.h != 0) gameStyle.drawImage(allImages[this.img], this.ox, this.oy, this.ow, this.oh, this.x, this.y, this.w, this.h);
		else gameStyle.drawImage(allImages[this.img], this.x, this.y);
	};
	imgBox.mouseEvent = mouseEvent;
	imgBox.self_click = function() {return true};
	return imgBox;
}

function TileImageBox(x, y, w, h, imgRef, ttip, maxTimer) {
	var tileBox = {x:x, y:y, w:w, h:h, imgRef:imgRef, ttip:ttip, maxTimer:maxTimer};

	if (typeof tileBox.maxTimer == "number") {
		tileBox.timer = 0;
		tileBox.animate = function() {
			if (this == mouseIn) this.timer = (this.timer + 1) % this.maxTimer;
			else this.timer = 0;
		}
		
		tileBox.display = function() {
			drawProdTile32(this.imgRef[Math.floor(this.timer * this.imgRef.length / this.maxTimer)], this.x, this.y, this.w, this.h);
		}
	} else tileBox.display = function() {
		drawProdTile32(this.imgRef, this.x, this.y, this.w, this.h);
	}

	tileBox.mouseEvent = mouseEvent;

	tileBox.self_click = function() {return true};
	if (tileBox.ttip != undefined) tileBox.self_mousemove = function(e) {
		if (tooltip == undefined) {
			if (this.fullTtip == undefined) this.fullTtip = msgTextBox(this.ttip.x, this.ttip.y, this.ttip.w, this.ttip.h, this.ttip.msg, this, undefined, "18px prstart", true, {col:"#0033CC", thick:5});
			else this.fullTtip.updateText(this.ttip.msg);
			tooltip = this.fullTtip;
		}
		mouseIn = this;
		return true;
	}

	return tileBox;
}

function expandableImgBox(x, y, w, h, imgRef, fullTtip) {
	var expBox = {x:x, y:y, w:w, h:h, imgRef:imgRef, fullTtip:fullTtip};
	
	expBox.display = function() {
		drawProdTile32(this.imgRef, this.x, this.y, this.w, this.h);
	}

	expBox.mouseEvent = mouseEvent;
	expBox.self_mousemove = function(e) {
		if (tooltip == undefined && phase.split("|")[0] == "stand-by") tooltip = this.fullTtip;
		mouseIn = this;
		return true;
	}
	expBox.self_click = function() {return true};
	expBox.fullTtip.linkTo = expBox;
	expBox.fullTtip.self_mousemove = function(e) {
		if (tooltip != this) return;
		mouseIn = this;
		return true;
	}
	return expBox;
}

function tickBox(x, y, w, h, ticked) {
	var tBox = {x:x, y:y, w:w, h:h, ticked:ticked};
	
	tBox.display = function() {
		if (this.ticked) drawProdTile32("crossbox_ticked", this.x, this.y, this.w, this.h);
		else drawProdTile32("crossbox_unticked", this.x, this.y, this.w, this.h);
	}

	tBox.hasChanged = function() {}
	
	tBox.mouseEvent = mouseEvent;
	tBox.self_click = function(e) {
		this.ticked = !this.ticked;
		this.hasChanged();
		return true;
	}
	return tBox;
}

function UnknownComboBox(x, y, w, h) {
	var ucBox = {x:x,
		y : y,
		w : w,
		h : h
	};
	
	ucBox.display = function(blink, neverTried) {
		var colors = ["#000000", "#000000"];
		drawRectangle(this.x, this.y, this.w, this.h, colors[0], "1");
		drawRectangle(this.x, this.y, this.w, this.h, colors[1], "1", true, 0.2);
		
		drawTextTight(" ?????????", "14px prstart", this.x+5, this.y+16, 16);
	}
	
	ucBox.mouseEvent = mouseEvent;
	return ucBox;


}

function ComboTextBox(x, y, w, h, c, instanciate) {
	var cTxtBox = {x:x,
		y : y,
		w : w,
		h : h,
		combo : c[0],
		cName : c[0].attributes.getNamedItem("id").nodeValue,
		comboDist : c[1],
		comboUse : c[2],
		instanciate : instanciate,
		timer : 0
	};

	cTxtBox.display = function(blink, neverTried) {
		if (this.comboDist == 0) {
			if (this == mouseIn || blink) var colors = ["#88ff44", "#66ff00", "#ff9900"];
			else var colors = ["#228822", "#00aa00", "#ff0000"];
		}
		else {
			if (this == mouseIn) var colors = ["#884444", "#cc0000", "#ff9900"];
			else var colors = ["#226622", "#880000", "#ff0000"];
		}
		drawRectangle(this.x, this.y, this.w, this.h, colors[0], "1");
		drawRectangle(this.x, this.y, this.w, this.h, colors[1], "1", true, 0.2);
		
		drawTextTight(this.cName, "14px prstart", this.x+5, this.y+16, 16);

		if (neverTried) drawTextTight(colors[2] + "New", "14px prstart", this.x + 162, this.y + 6, 16);
		
		if (this.cName == "New Population") {
			drawProdTile32("happyGood", this.x+5, this.y+20, 16, 16);
			if (this.instanciate) var txt = " >= " + newPopThreshold();
			else var txt = " >= population";
			drawTextTight(txt, "14px prstart", this.x+19, this.y+36, 16);
			return;
		}

		var shiftX = 2;
		var imgElems = [];
		var spaceNeeded = false;
		var temp;
		for (let i of ["left", "right"]) {
			temp = this.combo.getElementsByTagName(i);
			if (temp.length > 0) {
				imgElems.push([shiftX, temp[0].childNodes[0].nodeValue]);
				imgElems.push([shiftX, i]);
				shiftX += 16;
				spaceNeeded = true;
			}
		}
		if (spaceNeeded) shiftX += 4;
		spaceNeeded = false;
		temp = this.combo.getElementsByTagName("sequence");
		for (let i of temp) {
			imgElems.push([shiftX, i.childNodes[0].nodeValue]);				
			shiftX += 16;
			spaceNeeded = true;
		}
		if (spaceNeeded) shiftX += 4;
		spaceNeeded = false;
		temp = this.combo.getElementsByTagName("quantity");
		var tempProd;
		for (let i of temp) {
			tempProd = i.childNodes[0].nodeValue;
			drawText(requiredQuantity(this.cName, tempProd, i.attributes.getNamedItem("q").nodeValue, this.instanciate), "14px prstart", this.x+3+shiftX, this.y+36);
			shiftX += 12;
			imgElems.push([shiftX, tempProd]);				
			shiftX += 20;
			spaceNeeded = true;
		}
		if (spaceNeeded) shiftX += 4;
		for (let i of ["only", "none"]) {
			temp = this.combo.getElementsByTagName(i);
			for (let j of temp) {
				imgElems.push([shiftX, j.childNodes[0].nodeValue]);
				imgElems.push([shiftX, i]);
				shiftX += 16;
			}
		}
		for (let i of imgElems) {
			drawProdTile32(i[1], this.x+3+i[0], this.y+20, 16, 16);
		}
	};
	
	cTxtBox.self_mousemove = function() {
		if (this.x < 250) tooltip = comboTipBox(402, 280, 345, 0, this);
		else tooltip = comboTipBox(2, 280, 345, 0, this);
		mouseIn = this;
		return true;
	}

	cTxtBox.canPerform = function() {
		return ((this.comboDist <= 0 || CHEAT_ON) && this.instanciate);
	}
	
	if (cTxtBox.canPerform()) cTxtBox.self_click = function() {
		tooltip = undefined;
		if (nbIn(this.cName, discoveredCombos) <= 0) discoveredCombos.push(this.cName);
		performCombo(this.combo, this.comboUse);
		return true;
	};
	
	cTxtBox.self_wheel = function(e) {
		return;
	}
	cTxtBox.mouseEvent = mouseEvent;
	return cTxtBox;
}

function TechTextBox(x, y, w, h, t) {
	var tTxtBox = {x:x, y:y, w:w, h:h, tech:t};
	tTxtBox.display = function(blink) {
		if (this.tech[0] == "Leisure") {
			if (this == mouseIn || blink) var colors = ["#8888FF", "#4444FF", "#4444FF"];
			else var colors = ["#222288", "#0000AA", "#0000AA"];
		}
		else {
			if (this == mouseIn || blink) var colors = ["#888844", "#00FF00", "#FF0000"];
			else var colors = ["#666622", "#00AA00", "#AA0000"];
		}
		var separation = Math.floor(this.tech[2] * this.w / this.tech[1]);
		drawRectangle(this.x, this.y, this.w, this.h, colors[0], "1");
		drawRectangle(this.x, this.y, separation, this.h, colors[1], "1", true, 0.2);
		drawRectangle(this.x + separation, this.y, this.w - separation, this.h, colors[2], "1", true, 0.2);
		
		drawTextTight(this.tech[0], "14px prstart", this.x+5, this.y+16, 16);
		if (this.tech[0] == "Leisure") {
			var shiftX = drawTextTight(this.tech[1], "14px prstart", this.x + this.w - 47, this.y + 16, 16);
			drawProdTile32("popLeisure", shiftX, this.y + 2, 16, 16);			
		}
		else {
			var shiftY = 2;
			for (let i of [[this.tech[2], "innovation", "popBusy"], [this.tech[1]-this.tech[2], "innovationOff", "popIdle"]]) {
				if (i[0] > 0) {
					var shiftX = drawTextTight(i[0], "14px prstart", this.x + this.w - 47, this.y + shiftY + 14, 16);
					drawProdTile32(i[1], shiftX, this.y + shiftY, 16, 16);
					if (techsXML.getElementById(this.tech[0]).tagName == "activity") {
						shiftX += 16;
						drawProdTile32(i[2], shiftX, this.y + shiftY, 16, 16);
					}
					shiftY += 20;
				}
			}
		}
		
		shiftX = 2;
		var imgElems = [];
		var realProd;
		for (let i of ["consumes", "produces"]) {
			temp = techsXML.getElementById(this.tech[0]).getElementsByTagName(i);
			for (let j of temp) {
				realProd = j.childNodes[0].nodeValue;
				if (prodsXML.getElementById(realProd).attributes.getNamedItem("hidden") != null) continue;
				imgElems.push([shiftX, realProd]);
				shiftX += 16;
			}
			if (i == "consumes") {
				drawTextTight(" => ", "14px prstart", this.x+3+shiftX, this.y+36, 16);
				shiftX += 40;
			}
		}
		for (let i of imgElems) {
			drawProdTile32(i[1], this.x+3+i[0], this.y+20, 16, 16);
		}
	};
	tTxtBox.mouseEvent = mouseEvent;	
	tTxtBox.self_click = function() {return true}
	tTxtBox.self_mousemove = function() {
		mouseIn = this;
		tooltip = techTipBox(330, 280, 360, 0, this);
		return true;
	}
	
	tTxtBox.self_wheel = function(e) {
		return;
	}
	return tTxtBox;
}

function recurMove(box, shiftX, shiftY) {
	if (box.elems == undefined) return;
	for (let i of box.elems) {
		i.x += shiftX;
		i.y += shiftY;
		recurMove(i, shiftX, shiftY);
	}
}

function msgTextBox(x, y, w, h, msg, linkedTo, moveType, fontSize, shadow, border, background, shine) {
	var mTxtBox = {x:x, y:y, w:w, h:h, thickness:5, moveType:moveType, fontSize:fontSize, linkedTo:linkedTo, border:border, background:background, shine:shine, elems:[], doNotDisplay:[]};

	mTxtBox.updateText = function(newMsg) {
		this.textSize = Number(this.fontSize.slice(0,2));
		if (this.textSize >= 18) this.imgSize = 32;
		else this.imgSize = 16;

		if (newMsg != undefined) this.msg = newMsg;
		this.shapedMsg = textWidth(this.msg, this.textSize, this.w - ((this.thickness + 7) * 2), this.imgSize);
		var minHeight = 10 + (this.thickness * 2) + (this.shapedMsg.length * (this.textSize + 10));
		if (this.h < minHeight) this.h = minHeight;
		if (this.y + this.h > GAME_WINDOW_H) this.y = GAME_WINDOW_H - this.h;
	}
	
	mTxtBox.updateText(msg);
	
	mTxtBox.display = function() {
		if (shadow === true) drawRectangle(this.x + 5, this.y + 5, this.w + 5, this.h + 5, "black", 10, true, 0.2);
		if (mouseIn == this && this.shine != undefined) drawRectangle(this.x, this.y, this.w, this.h, this.shine.col, 0, true, this.shine.opacity);
		else if (this.background == undefined) drawRectangle(this.x, this.y, this.w, this.h, MY_COLORS.LIGHT_BLUE, 10, true);
		else drawRectangle(this.x, this.y, this.w, this.h, this.background.col, 0, true, this.background.opacity);
		if (this.border != undefined) drawRectangle(this.x, this.y, this.w, this.h, this.border.col, this.border.thick);
		for (let i=0; i<this.shapedMsg.length; i+=1) {
			drawTextTight(this.shapedMsg[i].txt, this.fontSize, this.x + this.thickness + 7, this.y + this.thickness + ((i+1) * (this.textSize + 10)), this.imgSize, (this.w - (this.shapedMsg[i].len + 24)) / 2);
		}
		for (let i of this.elems) {
			if (nbIn(i, this.doNotDisplay) <= 0) i.display();
		}
	}
	mTxtBox.animate = function() {}
	mTxtBox.self_mousedown = function(e){
		dragged = this;
		this.dragPoint = [e.pageX - this.x, e.pageY - this.y];
		this.self_mousemove(e);
		return true;
	}
	
	if (moveType == "dragged") mTxtBox.self_mousemove = function(e) {
		if (dragged == this) {
			var oldX = this.x;
			var oldY = this.y;
			this.x = Math.max(Math.min(e.pageX - this.dragPoint[0], GAME_WINDOW_W - 50), 50 - this.w);
			this.y = Math.max(Math.min(e.pageY - this.dragPoint[1], GAME_WINDOW_H - 50), 50 - this.h);
			recurMove(this, this.x - oldX, this.y - oldY);
		}
		return true;
	}
	else if (moveType == "clickable") mTxtBox.self_mousemove = function(e) {
		mouseIn = this;
		return true;
	}
	else mTxtBox.self_mousemove = function(e) {return true};
	mTxtBox.mouseEvent = mouseEvent;
	return mTxtBox;
}


function comboTipBox(x, y, w, h, caller) {
	var comboText = [];
	var cName = caller.cName;
	comboText.push(CENTER_TEXT + cName);
	comboText.push("");
	comboText.push("Requires :");
	var temp;
	var tempProd;
	var onlyNone = true;
	if (cName == "New Population") {
		if (caller.instanciate) comboText.push("{happyGood} >= " + newPopThreshold());
		else comboText.push("{happyGood} >= population");
	}
	for (let i of ["left", "right"]) {
		temp = caller.combo.getElementsByTagName(i);
		if (temp.length > 0) {
			onlyNone = false;
			tempProd = temp[0].childNodes[0].nodeValue;
			comboText.push("{" + tempProd +"|" + i + "} : {" + tempProd + "} on the " + i + " reel");
		}
	}
	temp = caller.combo.getElementsByTagName("sequence");
	var line = "";
	if (temp.length > 0) {
		onlyNone = false;
		for (let i of temp) {
			line += "{" + i.childNodes[0].nodeValue + "}";
		}
		line += " : ";
		for (let i=0; i<temp.length-1; i+=1) {
			line += "{" + temp[i].childNodes[0].nodeValue + "} then ";
		}
		comboText.push(line + "{" + temp[temp.length-1].childNodes[0].nodeValue + "} in sequence on the wheel");
	}
	temp = caller.combo.getElementsByTagName("quantity");
	for (let i of temp) {
		onlyNone = false;
		tempProd = i.childNodes[0].nodeValue;
		req = requiredQuantity(cName, tempProd, i.attributes.getNamedItem("q").nodeValue, caller.instanciate);
		comboText.push(req + " {" + tempProd + "} : at least " + req + " {" + tempProd + "} on the wheel");
	}
	for (let i of [["only", "only"], ["none", "no"]]) {
		temp = caller.combo.getElementsByTagName(i[0]);
		if (temp.length > 0) {
			line = "";
			for (let j of temp) {
				tempProd = j.childNodes[0].nodeValue;
				line += "{" + tempProd + "|" + i[0] + "}";
			}
			line += " : " + i[1] + " {";
			tempProd = [];
			for (let j of temp) {
				tempProd.push(j.childNodes[0].nodeValue);
			}
			line += stringMultipleInText(tempProd, "}, {", "} or {");
			if (onlyNone) comboText.push(line + "} in the wheel");
			else comboText.push(line + "} in the remaining reels");
		}
	}
	temp = caller.combo.getElementsByTagName("requires");
	for (let i of temp) {
		comboText.push(i.attributes.getNamedItem("describe").nodeValue);
	}
	comboText.push("Effect :");
	comboText = comboText.concat(effectDescriptions(caller.combo.getElementsByTagName("effect")[0], undefined, !caller.instanciate));

	if (caller.instanciate) if (caller.canPerform()) {
		comboText.push("");
		comboText.push("#ff0000Click to perform");
	}
	comboText.push();
	
	return msgTextBox(x, y, w, h, comboText.join("\n"), caller, undefined, "18px prstart", true, {col:"#0033CC", thick:5});
}

function techTipText(techName) {
	var tempProd;
	var temp;
	var alteration;
	var line;
	var overrideDesc;
	
	var techText = [];
	var techDetail = techsXML.getElementById(techName);

	if (techDetail.tagName == "activity") techText.push("Activity : requires 1 population{popBusy}");

	for (let i of techDetail.childNodes) {
		if (i.nodeType != 1) continue;
		if (i.attributes.getNamedItem("descriptionOnTop") != null) techText.push(i.attributes.getNamedItem("describe").nodeValue);
	}
	
	for (let i of [["Consumes :", "consumes"], ["Produces :", "produces"]]) {
		alteration = false;
		techText.push(i[0]);
		temp = techDetail.getElementsByTagName(i[1]);
		for (let j of temp) {
			if (j.attributes.getNamedItem("descriptionOnTop") != null) continue;
			alteration = true;
			overrideDesc = j.attributes.getNamedItem("describe");
			if (overrideDesc != null) techText.push(overrideDesc.nodeValue);
			else {
				tempProd = j.childNodes[0].nodeValue;
				techText.push("{" + tempProd + "}" + tempProd);
			}
		}
		if (!alteration) techText.push("  nothing");
	}

	temp = techDetail.getElementsByTagName("alterCost");
	for (let i of temp) {
		alteration = Number(i.attributes.getNamedItem("q").nodeValue);
		if (alteration == 0) continue;
		if (alteration > 0) line = "Increase";
		else line = "Reduce";
		line += " the cost of ";
		tempProd = i.childNodes[0].nodeValue;
		if (tempProd == "any") line += "all symbols";
		else line += "{" + stringMultipleInText(tempProd.split("|"), "}, {", "} or {") + "}";
		line += " in ";
		tempProd = i.attributes.getNamedItem("combo").nodeValue;
		if (tempProd == "any") line += "all combos";
		else line += stringMultipleInText(tempProd.split("|"), ", ", " and ");
		techText.push(line + " by " + Math.abs(alteration));
	}
	temp = techDetail.getElementsByTagName("bonus");
	for (let i of temp) {
		overrideDesc = i.attributes.getNamedItem("describe");
		if (overrideDesc != null) techText = techText.concat(overrideDesc.nodeValue.split("\n"));
		else {
			alteration = Number(i.attributes.getNamedItem("q").nodeValue);
			if (alteration == 0) continue;
			techText.push(sign(alteration) + alteration + " " + replaceVarNames(i.childNodes[0].nodeValue));
		}
	}
	temp = techDetail.getElementsByTagName("describe");
	for (let i of temp) {
		techText.push(i.childNodes[0].nodeValue);
	}
	return techText;
}

function techTipBox(x, y, w, h, caller) {
	var techName = caller.tech[0];

	var techText = [CENTER_TEXT + techName, ""].concat(techTipText(techName));
	techText.push("");

	for (let i of [["Active", "{innovation}", caller.tech[2]], ["Idle", "{innovationOff}", (caller.tech[1] - caller.tech[2])]]) {
		line = i[0];
		if (techName != "Leisure") line += i[1];
		techText.push(line + " " + i[2]);
	}
	techText.push("Total : " + caller.tech[1]);
	techText.push("");
	line = "#ff0000Click to ";
	if (typeof replacingTech == "number") {
		if (techName != "Leisure") techText.push(line + "join the call");
	}
	else if (replacingTech != undefined) techText.push(line + "switch to #ff0000" + replacingTech);
	else if (techName == "Leisure") techText.push(line + "pass time");
	else techText.push(line + "abandon");
	return msgTextBox(x, y, w, h, techText.join("\n"), caller, undefined, "18px prstart", true, {col:"#0033CC", thick:5});
}

function simpleLine(x, y, msg, size) {
	var sLin = {x:x, y:y, msg:msg, altColor:"#000000", values:[]};
	if (size == undefined) sLin.size = "24px prstart";
	else sLin.size = size;
	
	sLin.checkValChange = function(cancelBlink) {
		var temp = replaceValuesInText(this.msg);
		for (let i=1; i<temp.length; i+=2) {
			if ((i-1)/2 >= this.values.length) this.values.push({val:temp[i], col:"#000000", timer:0});
			else if (temp[i] > this.values[(i-1)/2].val) this.values[(i-1)/2] = {val:temp[i], col:"#00ff00", timer:150};
			else if (temp[i] < this.values[(i-1)/2].val) this.values[(i-1)/2] = {val:temp[i], col:"#ff0000", timer:150};
			else if (cancelBlink) this.values[(i-1)/2].timer = 0;
			
			if (this.values[(i-1)/2].timer % 20 > 10) {
				temp[i-1] = temp[i-1].concat(this.values[(i-1)/2].col);
				temp[i+1] = "#000000".concat(temp[i+1]);
			}
		}
		return temp.join("");
	}
	
	sLin.display = function() {
		var updatedTxt = this.checkValChange(false);
		drawTextTight(updatedTxt, this.size, this.x, this.y, 32);
	}
	
	sLin.animate = function() {
		for (let i of this.values) {
			if (i.timer > 0) i.timer -= 1;
		}
	}
	
	sLin.mouseEvent = mouseEvent;
	return sLin;
}

function addSubBox(parentBox, children) {
	var initialY = parentBox.y + parentBox.h - 5;
	var totalLength = 0;
	for (let i of children) totalLength += i.w;
	var margin = (parentBox.w - totalLength) / (children.length + 1);	
	var x = parentBox.x + margin;
	for (let i of children) {
		i.y = initialY;
		i.x = x;
		x += i.w + margin;
		if (parentBox.y + parentBox.h < i.y + i.h + 5) parentBox.h = i.y + i.h + 5 - parentBox.y;
		parentBox.elems.push(i);
	}
}

function initBlinkingValDisplays(blinkingValues) {
	blinkingValDisplays = {blinkingValues:blinkingValues};
	blinkingValDisplays.update = function() {
		for (let i in this.blinkingValues) this.blinkingValues[i].checkValChange(true);
	}
	
	blinkingValDisplays.display = function() {
		for (let i in this.blinkingValues) this.blinkingValues[i].display();
	}

	blinkingValDisplays.animate = function() {
		for (let i in this.blinkingValues) this.blinkingValues[i].animate();
	}
}



