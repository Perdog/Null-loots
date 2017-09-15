// Scan parser

$('#submit').click(function() {
	var parsed = parse($('#items').val())
	$('#results').val(parsed);
});

var condensed = {};
var rows;

function parse(text) {
	
};

/*
35833	Fliet - Ticonderoga	Fortizar	0 m
35825	Fliet - Stop and Swap	Raitaru	1,092 km
35832	Fliet - William Henry Technical Outpost	Astrahus	1,108 km
35826	Fliet - Robotics Fabrication Factory	Azbel	2,118 km
*/
