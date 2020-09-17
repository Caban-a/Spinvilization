
function modulo(x, y) {
	while (x < 0) x += y;
	return x % y;
}

function nbIn(anElement, anArray) {
	var matching = 0;
	for (let i of anArray) {
		if (i == anElement) matching += 1;
	}
	return matching;
}

function shuffleArray(anArray) {
	for (let i=anArray.length; i>0; i-=1) {
		var chosen = Math.floor(Math.random() * i);
		anArray.push(anArray[chosen]);
        anArray.splice(chosen, 1);
	}
}

function nbDifferentElems(anArray) {
	diffElems = [];
	for (let i of anArray) {
		if (nbIn(i, diffElems) <= 0) diffElems.push(i);
	}
	return diffElems.length;
}

function removeElem(anElem, anArray) {
	for (let i=0; i<anArray.length; i+=1) {
		if (anArray[i] == anElem) {
			anArray.splice(i, 1);
			return true;
		}
	}
	return false;
}

function uniquePos(anElem, anArray) {
	for (let i=0; i<anArray.length; i+=1) if (anArray[i] == anElem) return i;	
}

function shiftElem(anElem, anArray, val) {
	for (let i=0; i<anArray.length; i+=1) if (anArray[i] == anElem) {
		if (i + val < 0 || i + val >= anArray.length) return;
		return anArray[i + val];
	}
}

function randChoice(anArray) {
	return anArray[Math.floor(Math.random() * anArray.length)];
}



function pickRandomChar(charList) {
	return charList.charAt(Math.floor(Math.random() * charList.length));
}

function stringMultipleInText(elems, def, last) {
	var line = "";
	for (let i=0; i<elems.length-2; i+=1) {
		line += elems[i] + def;
	}
	if (elems.length > 1) line += elems[elems.length - 2] + last;
	return line + elems[elems.length - 1];
}

function sign(q) {
	if (q > 0) return "+";
	else return "";
}

function happySign(q) {
	if (q > 0) return "{happyGood}";
	if (q < 0) return "{happyBad}";
	return "{happyNeutral}";
}

function quantityS(q) {
	if (Math.abs(q) > 1) return "s";
	return "";
}

function quantityWere(q) {
	if (Math.abs(q) > 1) return "were";
	return "was";
}

function randomPerson() {
	var line = randChoice([" young", "", "n elderly"]);
	line += " " + randChoice(["man", "woman"]);
	return line;
}

function replaceVarNames(txt) {
	var toReplace = {
		"yearlyMaxHappiness" : "culture this year",
		"yearlyMaxFood" : "food storage this year",
		"yearlyHuntFood" : "food from hunting this year",
		"yearlyPopThreshold" : "{happyGood} required to recruit{popGlobal} this year",
		"yearlyMaxInnovations" : "max innovations this year"
	};
	var rg;
	for (let i in toReplace) {
		rg = new RegExp(i, "g");
		txt = txt.replace(rg, toReplace[i]);
	}
	return txt;
}

function initials(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1);
}



function randomColorChange(colorValues) {
	var col = "#";
	for (let i in colorValues) {
		for (let j=0; j<100; j+=1) colorValues[i] = Math.max(0, Math.min(255, Math.floor(Math.random() * 3) + colorValues[i] - 1));
		col += ("0" + colorValues[i].toString(16)).slice(-2);
	}
	return col;
}

