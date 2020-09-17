

function initCodex(found) {
	var codexDisplay = {found:found, age:1};
	var ageBar = initBasicHScrollBar(50, 20, GAME_WINDOW_W - 100, [1, 2, 3, 4], codexDisplay.age);
	ageBar.updateTarget = function() {
		codexDisplay.adjust(this.list[this.pos]);
	}
	codexDisplay.elems = [[], [ageBar]];
	
	codexDisplay.adjust = function(newAge) {
		if (newAge == undefined) this.age = 1;
		else this.age = newAge;
		var posX = 10;
		var posY = 80;
		this.elems[0] = [];
		for (let i of combos.getElementById(this.age.toString()).childNodes) {
			if (i.nodeType != 1) continue;
			if (nbIn(i.attributes.getNamedItem("id").nodeValue, discoveredCombos) > 0) this.elems[0].push(ComboTextBox(posX, posY, 180, COMBO_BOX_HEIGHT, [i, 0, []], false));
			else this.elems[0].push(UnknownComboBox(posX, posY, 180, COMBO_BOX_HEIGHT));
			if (posY > GAME_WINDOW_H - 160) {
				posX += 200;
				posY = 80;
			}
			else posY += 50;
		}

	}
	
	codexDisplay.adjust();
	
	codexDisplay.display = function() {
		for (let i=1; i<=4; i+=1) {
			drawTextTight("Age " + i, "14px prstart", (i * 220) - 180, 70)
		}
		for (let i of this.elems) for (let j of i) j.display(false, false);
	}
	
	codexDisplay.mouseEvent = mouseEvent;
	return codexDisplay;
}


function comboCodexScreenSetup() {
	resetScreen();
	gameCanvas.elems[0].push(initCodex([]));

	var backButton = msgTextBox(280, 540, 240, 0, CENTER_TEXT + "To Main Menu", undefined, "clickable", "18px prstart", false, {col: "#ff33bb", thick:2}, {col:MY_COLORS.PINKISH, opacity:1}, {col:MY_COLORS.PINKISH_SHINE, opacity:1});
	backButton.self_click = function() {
		newgameScreenSetup();
	}
	
	gameCanvas.elems[0].push(backButton);
	
	phase = "stand-by";
}






