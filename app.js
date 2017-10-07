/*
Initial page loads. Load the included text files, log the version for funsies.
*/
var version = "v1.0.0";
$(document).ready(function() {
	$.ajax({
        //type: "GET",
        url: "typeids.csv",
        dataType: "text",
     }).done(processTypeIDs);
	 $.ajax({
		 url: "willbuy.txt",
		 dataType: "text",
	 }).done(processBuying);
	 //Versioning
	 console.log(version);
});

var typeid = {};
var buying = [];
function processTypeIDs(allText) {
    var allLines = allText.split(/\r\n|\n/);

    for (var i=0; i<allLines.length; i++) {
		var line = allLines[i].replace(new RegExp("\",\"", 'g'),"\"---\"")
		line = line.replace(new RegExp("\"", 'g'), "")
        var data = line.toLowerCase().split("---");
		var key = data[1];
        typeid[key] = data[2];
    }
}
function processBuying(allText) {
	buying = allText.toLowerCase().split(/\r\n|\n/);
}

/*
The meat and bones of it all.
*/

// Variables
// Statics
var regID = "10000002";
var jita = "30000142";
var priceToBuy = 2500000;
var maxCallSize = 150;
var form_id_js = "javascript_form";

// Non-Statics
var uuid;
var emailBody = "";
var data_js = {
    "access_token": "q7evs0jcl1n40n6s2kkkvx5x"
};
var js_form = document.getElementById(form_id_js);
var quoteButton = document.getElementById("submit_quote");
var totalPasted = 0;
var allItems = {};
var willTake = {};
var allItemIds = [];
var waitingOn = 0;

quoteButton.onclick = do_the_stuffs;

// Main function. Create UUID, put together the table for user viewing
function do_the_stuffs() {
	uuid = uuidv4();
	parse_list($('#items').val());
}

function parse_list(pasted) {
	var allLines = pasted.split(/\r\n|\n/);
	totalPasted = allLines.length;
	updateButton('Processing.. 0/' + totalPasted, true);
	
	if (allLines[0].length < 7) {
		updateButton('Failed paste, please try again!', false);
		alert("Empty field or failed paste. Please try again");
		return;
	}
	
	allItemIds = [];
	allItems = {};
	
	for(var i = 0; i < allLines.length; i++) {
		updateButton('Processing.. ' + (i+1) + '/' + totalPasted, true);
		var line = allLines[i].split(/\t/g);
		var id = typeid[line[0].toLowerCase()];
		if (!id) {
			console.log(line[0] + ' does not exist on the market');
			continue;
		}
		allItemIds.push(id);
		allItems[id] = {};
		allItems[id].item_name = line[0];
		allItems[id].quantity = parseInt(line[1]);
		if (!allItems[id].quantity) {
			console.log(line[0] + ' does not have a quantity.');
			alert('Item has not been repackaged! Double check ' + line[0] + '.');
			delete allItems[id];
			continue;
		}
		allItems[id].m3 = parseFloat(line[5].replace(" m3", ""));
	}
	fetchPrices();
}

function fetchPrices() {
	updateButton('Fetching prices..', true);
	willTake = {};
	
	var toLoop = Math.ceil(allItemIds.length/maxCallSize);
	if (toLoop == 0) {
		updateButton('There are no items in there... Try again', false);
		console.log('No quotable items in the list');
		return;
	}
	for (var i = 0; i < toLoop; i++) {
		waitingOn++;
		var begin = maxCallSize*i;
		var end = Math.min((maxCallSize + begin), (allItemIds.length));
		
		var fetch = new XMLHttpRequest();
		fetch.onload = reqsuc;
		fetch.onerror = reqerror;
		var str = allItemIds.slice(begin, end).toString();
		fetch.open('get', 'https://api.evemarketer.com/ec/marketstat/json?typeid=' + str + '&regionlimit=' + regID + '&usesystem=' + jita, true);
		fetch.send();
	}
}

/*
Marketeer end points
data:
    .buy
	.sell
	
attributes:
    .avg -> Average price, useless
	.fivePercent -> No idea, top 5% of order maybe?
	.generated -> /shrug
	.max -> highest priced order
	.median -> Mid point
	.min -> lowest priced order
	.stdDev -> Unknown, has something to do with the thing below. These might be used for price fluctuation?
	.variance -> Unknown, outputs some big ass numbers though.
	.volume -> Potentially the *movement* volume ( How much sells a day)
	.wavg -> Weighted average. Not sure what to use that for.
*/
function reqerror(error) {
	updateButton('Whoooops..', false);
	alert("Oh no! Something's wrong!\nPing Pedro on Discord and give his this error code:\n" + error);
}

function reqsuc() {
	var data = JSON.parse(this.responseText);
	
	for (var key in data) {
		var d = data[key];
		var id = d.buy.forQuery.types[0];
		
		if (!allItems[id])
			continue;
		
		if (buying.indexOf(allItems[id].item_name.toLowerCase()) != -1) {
			willTake[id] = allItems[id];
			var w = willTake[id];
			w.buy_max = d.buy.max;
			w.sell_max = d.sell.max;
			w.will_pay = w.buy_max*0.95;
		}
		else if (d.buy.max >= priceToBuy) {
			willTake[id] = allItems[id];
			var w = willTake[id];
			w.buy_max = d.buy.max;
			w.sell_max = d.sell.max;
			w.will_pay = w.buy_max*0.95;
		}
	}
	waitingOn--;
	if (waitingOn == 0)
		postIt();
}
/*
willTake attributes:
    .item_name
	.quantity
	.m3
	.will_pay
	.buy_max
	.sell_max
*/
// Post table to webpage
function postIt() {
	updateButton('Putting together your list..', true);
	var willPay = 0.0;
	var totalm3 = 0.0;
	var m3final = 0.0;
	var finalText = "<h4>What I'll buy (" + Object.keys(willTake).length + "/" + totalPasted + ")</h4><br><br><table style=\"width:100%>\" <tr> <th>Item name</th><th>Quantity</th><th>Price per unit</th><th>Total</th></tr>";
	emailBody = "Someone wants to sell you shit, bruh! \n\n";
	
	for (var key in willTake) {
		var k = willTake[key];
		var p = (k.will_pay * k.quantity);
		var perm3 = Math.round(((k.buy_max-k.will_pay)/k.m3)*100)/100;
		
		if (p)
			willPay += p;
		m3final += k.m3;
		totalm3 += perm3;
	
		emailBody += k.item_name + fuckingTabs(k.item_name, 70) + "x" + k.quantity.toLocaleString() + fuckingTabs(k.quantity.toString() + " ", 15) + "@ " + k.will_pay.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk/unit" + fuckingTabs(k.will_pay.toString(), 40) + "Total: " + p.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk" + fuckingTabs(p.toString(), 40) + perm3.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk per m3, at buy prices - " + (k.m3*k.quantity).toLocaleString(undefined, { minimumFractionDigits:2}) + " m3 total\n";
		finalText += "<tr><td>" + k.item_name + "</td><td>" + k.quantity.toLocaleString() + "</td><td>" + k.will_pay.toLocaleString(undefined, { minimumFractionDigits:2 }) + " isk</td><td>" + p.toLocaleString(undefined, { minimumFractionDigits:2 }) + " isk</td></tr>"
	}
	
	emailBody += "\nTotal paying: " + willPay.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk\nTotal Profit per m3: " + totalm3.toLocaleString(undefined, { minimumFractionDigits:2}) + "isk\nTotal profit: " + (totalm3.toLocaleString(undefined, { minimumFractionDigits:2}) * m3final.toLocaleString(undefined, { minimumFractionDigits:2})) + " isk\nTotal size: " + m3final.toLocaleString(undefined, { minimumFractionDigits:2}) + " m3";
	emailBody += "\n\t\n\t\n\t";
	finalText += "<tr height=30px></tr><tr><td>Grand total</td><td><td></td></td><td>" + willPay.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk</td></tr></table><br><u><h4>Add the code \"" + uuid + "\" in the contract description.</h4></u>";
	finalText += "<input type=\"submit\" id=\"send_email\" class=\"btn btn-warning btn-block\" value=\"Looks good!\" onclick=\"send_email()\" />";
	updateButton('Get a new quote', false);
	$('#results').text("");
	$('#results').append(finalText);
}


// Send email to me so I can see what contracts should have and be priced at.
function send_email() {
    var b = document.getElementById("send_email");
	b.value='Sending…';
    b.disabled=true;
	
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            b.value = 'Sent!';
			//Debugging
			console.log("Email sent.");
        } else
        if(request.readyState == 4) {
            var error = request.response;
			b.value = 'Failed!';
			//Debugging
			console.log("Email failed:\n" + error);
			alert("The page failed to send an email. Please try again.\nIf you continue to see this error, ping Pedro on Discord\n" + error);
        }
    };
		
    data_js['subject'] = uuid;
    data_js['text'] = emailBody;
    var params = toParams(data_js);
    request.open("POST", "https://postmail.invotes.com/send", true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send(params);
	
    return false;
}

// Helper functions
function updateButton(str, dis) {
	quoteButton.value = str;
	quoteButton.disabled = dis;
}
function toParams(data_js) {
    var form_data = [];
    for ( var key in data_js ) {
        form_data.push(encodeURIComponent(key) + "=" + encodeURIComponent(data_js[key]));
    }
    return form_data.join("&");
}
js_form.addEventListener("submit", function (e) {
    e.preventDefault();
});
function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}
// Tabs R hard... So is formatting emails without tables
function fuckingTabs(string, s) {
	var toAdd = s - string.length;
	var ret = "";
	for (var i = 0; i < toAdd; i++) {
		ret += " ";
	}
	return ret;
	/*
	var L = string.length;
	var tabCount = s - Math.floor(L/7);
	var returnS = "";
	for (var i = 0; i <tabCount; i++) {
		returnS += "\t";
	}
	return returnS;
	*/
}

/* MENU BAR FUNCTIONS */
function expand_menu(x) {
	x.classList.toggle("change");
}

///////////////////////////////////////////////////////////////////////////////////

/* For testing:
Augoror Exoplanets Hunter SKIN (Permanent)	1	Super Kerr-Induced Nanocoatings			0.01 m3	212,584.47 ISK
Barium Firework	400	Festival Charges			40 m3	148,204.00 ISK
Copper Firework	400	Festival Charges			40 m3	119,168.00 ISK
Griffin Exoplanets Hunter SKIN (Permanent)	1	Super Kerr-Induced Nanocoatings			0.01 m3	54,407.50 ISK
Hurricane Exoplanets Hunter SKIN (Permanent)	1	Super Kerr-Induced Nanocoatings			0.01 m3	3,899,339.76 ISK
Navitas Exoplanets Hunter SKIN (Permanent)	1	Super Kerr-Induced Nanocoatings			0.01 m3	12,734.53 ISK
Sigil Exoplanets Hunter SKIN (Permanent)	1	Super Kerr-Induced Nanocoatings			0.01 m3	168,689.59 ISK
Small Transverse Bulkhead I Blueprint	49	Rig Blueprint			0.49 m3	11,533,295.13 ISK
Sodium Firework	400	Festival Charges			40 m3	62,304.00 ISK
*/
