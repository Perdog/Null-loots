////////////////////////////////////////////////////////////////////////////////////
var version = "v1.0.0";
$(document).ready(function() {
	$.ajax({
        //type: "GET",
        url: "typeids.csv",
        dataType: "text",
        //success: function(data) {processData(data);}
     }).done(processTypeIDs);
	 $.ajax({
		 url: "willbuy.txt",
		 dataType: "text",
	 }).done(processBuying);
	 loadMarketPrices();
	 console.log(version);
});

var typeid = {};
var buying = [];
var prices = {};
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
function loadMarketPrices() {
	var fetch = new XMLHttpRequest();
	fetch.onload = function() {
		prices = JSON.parse(this.responseText);
	};
	fetch.onerror = function() {
		alert("Failed to load market prices. Try reloading the page. If it still doesn't work CCP's API may be down, give it 30 minutes to fix itself.");
	};
	fetch.open('get', 'https://esi.tech.ccp.is/latest/markets/prices/?datasource=tranquility', true);
	fetch.send();
}
////////////////////////////////////////////////////////////////////////////////////

//update this with your js_form selector
var regID = "10000002";
var form_id_js = "javascript_form";
var uuid;
var waitingOn = 0;
var data_js = {
    "access_token": "q7evs0jcl1n40n6s2kkkvx5x"
};

var sendButton = document.getElementById("send_email");
var js_form = document.getElementById(form_id_js);

sendButton.onclick = do_the_stuffs;
	
function do_the_stuffs() {
	uuid = uuidv4();
	compose_list($('#items').val());
}

function reqsuc() {
	var data = JSON.parse(this.responseText);
	var id = data[0].type_id;
	var average = 0;
	var count = 0;
	
	for(var i = 0; i < data.length; i++) {
		var range = data[i].range;
		// Only take station and 1 range into effect, trying to not skew the result with 1 isk buys set to regional
		if (range == "1" | range == "station") {
			average += data[i].price;
			count++;
		}
	}
	
	average = Math.round((average/count) *100)/100;
	willTake.items[id].buy_average = average;
	waitingOn--;
	if (waitingOn == 0) {
		sendButton.value = 'Submit';
		sendButton.disabled=false;
	}
}
function reqerror(error) {
	alert("error \n" + error);
}

function waitForIt() {
	// Still waiting..
	if (waitingOn > 0) {
		setTimeout(function(){waitForIt()},500);
	}
	// Everything is done, lets build the output and email
	else {
		var willPay = 0.0;
		var totalm3 = 0.0;
		var finalText = "<h4>What I'll buy (" + Object.keys(willTake.items).length + "/" + totalPasted + ")</h4><br><br><table style=\"width:100%>\" <tr> <th>Item name</th><th>Quantity</th><th>Price per unit</th><th>Total</th></tr>";
		var messageBody = "Someone wants to sell you shit, bruh! \n\n";
		//messageBody += "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\"><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" /><title></title><style></style></head><body>";
		//messageBody += "<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" height=\"100%\" width=\"100%\" id=\"bodyTable\"><tr><td align=\"center\" valign=\"top\"><table border=\"0\" cellpadding=\"20\" cellspacing=\"0\" width=\"600\" id=\"emailContainer\">";
		//messageBody += "<tr><td>Item name</td><td>Quantity</td><td>isk/unit</td><td>Total</td><td>isk/m3</td></tr>";
		for (var key in willTake.items) {
			var k = willTake.items[key];
			var p = (k.buy_average * k.quantity);
			var perm3 = Math.round(((p/(parseFloat(k.m3.replace(" m3", ""))*k.quantity))-(250*k.quantity))*100)/100;
			
			k.will_pay = p;
			if (p)
				willPay += p;
			totalm3 += perm3;
			
			messageBody += k.item_name + "\t\t x" + k.quantity.toLocaleString() + "\t\t @ " + k.buy_average.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk/unit\t\tTotal: " + k.will_pay.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk\t\t" + perm3.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk per m3 \n";
			//messageBody += "<tr><td>" + k.item_name + "</td><td>" + k.quantity + "</td><td>" + k.buy_average + "</td><td>" + k.will_pay + "</td><td>" + perm3 + "</td></tr>";
			finalText += "<tr><td>" + k.item_name + "</td><td>" + k.quantity.toLocaleString() + "</td><td>" + k.buy_average.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk</td><td>" + k.will_pay.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk</td></tr>"
		}
		
		messageBody += "\nTotal Profit per m3: " + totalm3.toLocaleString(undefined, { minimumFractionDigits:2}) + "isk";
		//messageBody += "<tr hieght=\"30\"></tr><tr><td>Grand total</td><td></td><td></td><td>" + willPay + "</td><td>" + totalm3 + "</td></tr>";
		//messageBody += "</table></td></tr></table></body></html>";
		finalText += "<tr height=30px></tr><tr><td>Grand total</td><td><td></td></td><td>" + willPay.toLocaleString(undefined, { minimumFractionDigits:2}) + " isk</td></tr></table><br><u><h4>Add the code \"" + uuid + "\" in the contract description.</h4></u>";
		$('#results').text("");
		$('#results').append(finalText);
		send_email(messageBody);
	}
}

var totalPasted = 0;
var willTake = {};
/*
"line" array layout
| 0=Item name |    1=Quantity   | 2=Ignored | 3=Ignored |
|  4=Ignored  | 5=Size per unit |    6=Estimate cost    |

"willTake" layout
| 0=Item id, 1=Item name, 2=quantity, 3=price I'll pay, 4=m3
*/
function compose_list(pasted) {
	var allLines = pasted.split(/\r\n|\n/);
	totalPasted = allLines.length;
	
	if (allLines[0].length < 7) {
		alert("Empty field or failed paste. Please try again");
		return;
	}
	
	willTake.items = {};
	
	for(var i = 0; i < allLines.length; i++) {
		var line = allLines[i].split(/\t/g);
		
		if (buying.indexOf(line[0].toLowerCase()) != -1) {
			addToOrder(line);
		}
		// If not on my buy list, check the price of it, if above 1M lets take it anyways.
		else if (checkPrice(line[0])) {
			addToOrder(line);
		}
	}
	
	// Need to wait for all the HTTP requests to finish running
	waitForIt();
}

function checkPrice(itemName) {
	var id = typeid[itemName.toLowerCase()];
	for (var key in prices) {
		if ((prices[key].type_id + "") == id) {
			if (prices[key].average_price && prices[key].average_price > 1500000) {
				//console.log("Nice price for " + itemName + " @ " + prices[key].average_price);
				return true;
			} else {
				//console.log("Bad price for " + itemName + " @ " + prices[key].average_price);
				return false;
			}
		}
	}
	console.log("No ID found for " + itemName);
	
	return false;
}

function addToOrder(line) {
	var itemid = typeid[line[0].toLowerCase()];
	willTake.items[itemid] = {};
	willTake.items[itemid].item_name = line[0];
	willTake.items[itemid].quantity = line[1];
	willTake.items[itemid].m3 = line[5];
	
	//https://esi.tech.ccp.is/latest/markets/10000002/orders/?datasource=tranquility&order_type=buy&page=1&type_id= item[0]
	if (waitingOn == 0) {
		sendButton.value='Processing...';
		sendButton.disabled=true;
	}
	waitingOn++;
	
	var fetch = new XMLHttpRequest();
	fetch.onload = reqsuc;
	fetch.onerror = reqerror;
	fetch.open('get', 'https://esi.tech.ccp.is/latest/markets/10000002/orders/?datasource=tranquility&order_type=buy&page=1&type_id=' + itemid, true);
	fetch.send();
}

function send_email(body) {
    sendButton.value='Sending…';
    sendButton.disabled=true;
	
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            js_onSuccess();
        } else
        if(request.readyState == 4) {
            js_onError(request.response);
        }
    };
		
    data_js['subject'] = uuid;
    data_js['text'] = body;
    var params = toParams(data_js);
    request.open("POST", "https://postmail.invotes.com/send", true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send(params);
	
    return false;
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
function js_onSuccess() {
	sendButton.value = 'Sent!';
}
function js_onError(error) {
	sendButton.value = 'Failed!';
	alert("The page failed to send an email. Please try again. \n " + error);
}

function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

///////////////////////////////////////////////////////////////////////////////////

/*
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
