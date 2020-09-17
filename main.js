

var CHEAT_ON = false;

var gameInterval;
var gameCanvas;
var eventCatcherDiv;
var gameStyle;

var backgroundColor = "#ffffff";

var allImages = {};


function subMouseEvent(anArray, e) {
	var result;
	for (let i=anArray.length-1; i>=0; i-=1) {
		if (anArray[i] instanceof Array) {
			result = subMouseEvent(anArray[i], e);
			if (result != undefined) return [i].concat(result);
		}
		else if (anArray[i].mouseEvent(e)) {
			return [i, e];
		}
	}
}

function mouseEvent(e) {
	var result;
	if (this.elems != undefined) result = subMouseEvent(this.elems, e);
	if (result != undefined) {
		if (this["sub_" + e.type] != undefined) return this["sub_" + e.type](...result);
		else return true;
	}

	if (this.x <= e.pageX && this.x+this.w >= e.pageX && this.y <= e.pageY && this.y+this.h >= e.pageY) {
		if (this["self_" + e.type] != undefined) return this["self_" + e.type](e);
		else return true;
	}

	return false;
}


function globalMouseEvent(e) {
	if (e.type == "mouseup") dragged = undefined;
	if (tooltip != undefined) {
		if (tooltip.moveType == "reactive_tooltip") if (tooltip.mouseEvent(e)) return true;
		if (nbIn(mouseIn, [tooltip, tooltip.linkTo]) <= 0) {
			tooltip = undefined;
		}
	}
	mouseIn = undefined;
	if (wheelDisplay != undefined) {
		if (phase.split("|")[0] != "stand-by") return subMouseEvent(gameCanvas.elems[1], e);
	}
	return gameCanvas.mouseEvent(e);
}

function keyShortcut(e) {
	return;
}


function loadCookie(key) {
	var result = document.cookie;
	if (result == undefined) return;
	result = result.split(key + "=");
	if (result.length <= 1) return;
	return result[1].split(";")[0];
}

function loadParsedCookie(key, _default) {
	var val = loadCookie(key);
	if (val == undefined) return _default;
	else return JSON.parse(val);
}

function saveCookie(key, value) {
	var expiration_date = new Date();
	expiration_date.setFullYear(expiration_date.getFullYear() + 5);
	document.cookie = key + "=" + value + "; expires=" + expiration_date.toUTCString() + "; path=/";	
}

function saveStringCookie(key, value) {
	saveCookie(key, JSON.stringify(value));
}

function deleteCookie(key) {
	document.cookie = key + "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
}

function beforeClosing(e) {
	if (gameState == undefined) return;
	if (gameState.setup != undefined && gameState.score != undefined) tryBestScore(gameState.setup.tribe, gameState.score);
	if (discoveredCombos != undefined) saveStringCookie("discoveredCombos", discoveredCombos);
	if (autosave != undefined) saveCookie("autosave", autosave);
}



function loadImageFile(fileName, reference) {
    var imgVar = document.createElement("img");
    imgVar.setAttribute("src", fileName);
    allImages[reference] = imgVar;
}

function loadDoc(url, cFunction) {
  var xhttp;
  xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      cFunction(this);
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}

function startLoading() {
    gameCanvas = document.getElementById("myCanvas");
	gameStyle = gameCanvas.getContext("2d");
	gameCanvas.mouseEvent = mouseEvent;

    eventCatcherDiv = document.getElementById("EventCatcher");
    eventCatcherDiv.addEventListener("click", globalMouseEvent);
    eventCatcherDiv.addEventListener("mousemove", globalMouseEvent);
    eventCatcherDiv.addEventListener("mousedown", globalMouseEvent);
    eventCatcherDiv.addEventListener("mouseup", globalMouseEvent);
	eventCatcherDiv.addEventListener("wheel", function(e){
		e.preventDefault();
		globalMouseEvent(e);
	});
	
    window.addEventListener("keydown", keyShortcut);
    window.addEventListener("unload", beforeClosing);

	loadDoc("combos v0_9_9_1.xml", function(xhttp){combos = xhttp.responseXML});
	loadDoc("prods v0_9_9_1.xml", function(xhttp){prodsXML = xhttp.responseXML});
	loadDoc("techs v0_9_9_1.xml", function(xhttp){techsXML = xhttp.responseXML});
	loadDoc("messages v0_9_9_1.xml", function(xhttp){messagesXML = xhttp.responseXML});
	loadImageFile("tilemap 32 v0_9_9_1.png", "tileMap32");
	loadImageFile("htp3_population2 v0_9_9_1.png", "htp3");
	loadImageFile("htp4_roster2 v0_9_9_1.png", "htp4");
	loadImageFile("htp5_wheel v0_9_9_1.png", "htp5");
	loadImageFile("htp6_combos v0_9_9_1.png", "htp6");
	loadImageFile("htp7_new-population v0_9_9_1.png", "htp7");
	loadImageFile("htp8_activities v0_9_9_1.png", "htp8");
	loadImageFile("htp9_food v0_9_9_1.png", "htp9");
	loadImageFile("htp10_happiness v0_9_9_1.png", "htp10");
	loadImageFile("htp11_innovations v0_9_9_1.png", "htp11");
	loadImageFile("htp12_wolf v0_9_9_1.png", "htp12");
	loadImageFile("htp13_masonry v0_9_9_1.png", "htp13");
	loadImageFile("htp14_spear v0_9_9_1.png", "htp14");
	loadImageFile("htp15_enemies v0_9_9_1.png", "htp15");
	loadImageFile("htp17_tribe v0_9_9_1.png", "htp17");
	loadImageFile("htp18_adversity v0_9_9_1.png", "htp18");
	loadImageFile("htp19_vanquish v0_9_9_1.png", "htp19");
	loadImageFile("htp20_game-log v0_9_9_1.png", "htp20");

    gameInterval = setInterval(hasLoaded, 250);
}

function hasLoaded()
{
    for (let _image in allImages) {
        if (!allImages[_image].complete) return;
	}

	for (let i of [combos, prodsXML, techsXML, messagesXML]) if (i === undefined) return;

	for (let i of prodsXML.getElementsByTagName("prods")[0].childNodes) {
		if (i.nodeType == 1) prods[i.attributes.getNamedItem("id").nodeValue] = tileRef(i.attributes.getNamedItem("icon_id").nodeValue);
	}
	for (let i of prodsXML.getElementsByTagName("enemy")) {
		possibleEnemies[i.attributes.getNamedItem("age").nodeValue].push(i.attributes.getNamedItem("id").nodeValue);
	}
	clearInterval(gameInterval);
	
	wheelDisplay = initMainWheelDisplay(400, 40, true);
	initRosterDisplay(750, 0);
	initComboDisplay(360, 270, 245, 330);
	initTechDisplay(5, 270, 244, 330);
	initLogDisplay(305, 270, 320, 328);
	initEventBox(305, 268, 320, 280);
	foodTile = TileImageBox(10, 85, 32, 32, "foodStorage", {
		x : 52,
		y : 97,
		w : 500,
		h : 350,
		msg : messagesXML.getElementById("food").childNodes[0].nodeValue
	});
	happinessTile = TileImageBox(10, 130, 32, 32, "", {
		x : 52,
		y : 142,
		w : 500,
		h : 350,
		msg : messagesXML.getElementById("happiness").childNodes[0].nodeValue
	});
	happinessTile.display = function() {
		var mood;
		if (gameState.happiness > 0) mood = "happyGood";
		else if (gameState.happiness < 0) mood = "happyBad";
		else mood = "happyNeutral";
		drawProdTile32(mood, this.x, this.y, this.w, this.h);
	}
	
	resetScreen();
	introScreenSetup();
	gameInterval = setInterval(runGame, 25);
}

function resetScreen() {
	gameCanvas.elems = [[], [], []];
	gameCanvas.anims = [];
	backgroundColor = "#ffffff";
	tooltip = undefined;
	phase = "stand-by";
}



function manageScreen() {
	gameStyle.fillStyle = backgroundColor;
	gameStyle.fillRect(0, 0, GAME_WINDOW_W, GAME_WINDOW_H);

	for (let i of gameCanvas.anims) {
		i.animate();
	}

	for (let i of gameCanvas.elems) {
		for (let j of i) {
			j.display();
		}
	}

	if (tooltip != undefined) {
		tooltip.display();
	}
}

function runGame()
{
	manageScreen();
}
