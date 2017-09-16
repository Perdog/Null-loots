////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function() {
	$.ajax({
        //type: "GET",
        url: "typeids.csv",
        dataType: "text",
        //success: function(data) {processData(data);}
     }).done(processData);
});

var lines = {};
function processData(allText) {
    var allTextLines = allText.split(/\r\n|\n/);

    for (var i=0; i<allTextLines.length; i++) {
		var line = allTextLines[i].replace(new RegExp("\",\"", 'g'),"\"---\"")
		line = line.replace(new RegExp("\"", 'g'), "")
        var data = line.split("---");
		var key = data[1];
        lines[key] = data[2];
    }
	//console.log(lines);
    //alert(lines);
}
////////////////////////////////////////////////////////////////////////////////////

//update this with your js_form selector
var form_id_js = "javascript_form";
var uuid;
var data_js = {
    "access_token": "q7evs0jcl1n40n6s2kkkvx5x"
};

var sendButton = document.getElementById("send_email");
var js_form = document.getElementById(form_id_js);

sendButton.onclick = do_the_stuffs;
	
function do_the_stuffs() {
	uuid = uuidv4();
	var messageBody = compose_list($('#items').val());
	//send_email(messageBody);
}
	
function compose_list(pasted) {
		
		
		
	$('#results').val(JSON.stringify(lines));
}

function send_email() {
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
		
    var subject = uuid; //Create UUID //document.querySelector("#" + form_id_js + " [name='subject']").value;
	var message = document.querySelector("#" + form_id_js + " [name='text']").value;
    data_js['subject'] = subject;
    data_js['text'] = message;
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
    // remove this to avoid redirect
}
function js_onError(error) {
    // remove this to avoid redirect
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
$('#submit').click(function() {
	var parsed = parse($('#items').val());
	var 
	$('#results').val(parsed);
});

var condensed = {};
var rows;

// Item name  |  Quantity  |  Ignore  |  Size per unit  |  Ignore //

function parse(text) {
	rows = text.split('\n');
	
	if (rows.length === 0) {
		return "Empty!";
	}
	
	for (var i = 0; i < rows.length; i++) {
		var cells = rows[i].split('\t');
		//var index = cells.length - 2;
		console.log(index);
	}
};
*/

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
