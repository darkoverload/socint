var sigInst, canvas, $GP
var config = {};
var autoPush = false;

//Automatically load configuration file
jQuery.getJSON("conf/2018-07-13_maga.json", function (data, textStatus, jqXHR) {
	config = data;

	if (config.type != "network") {
		alert("Invalid configuration settings.")
		return;
	}

	$(document).ready(setupGUI(config));
});

// Manually load new configuration file
function switchConfig(configFile) {
	jQuery.getJSON(configFile, function (data, textStatus, jqXHR) {
		config = data;

		$GP.info.animate({
			width: 'hide'
		}, 350);

		$('#sigma-canvas').remove();
		$('#sigma-parent').html('<div class="sigma-expand" id="sigma-canvas"></div>');

		if (config.type != "network") {
			alert("Invalid configuration settings.")
			return;
		}

		$(document).ready(setupGUI(config));
	});
}

// Dataset selection load trigger
function dataSelect() {
	var x = document.getElementById("dataselector").value;
	sigInst.emptyGraph(); // Fix memory leak when switching datasets
	switchConfig(x);
}

// Custom object size function
Object.size = function (obj) {
	var size = 0,
	key;
	for (key in obj) {
		if (obj.hasOwnProperty(key))
			size++;
	}
	return size;
};

// Initialize Sigma.js instance
function initSigma(config) {
	var data = config.data
	var drawProps, graphProps, mouseProps;

	if (config.sigma && config.sigma.drawingProperties)
		drawProps = config.sigma.drawingProperties;
	else
		drawProps = {
			defaultLabelColor: "#000",
			defaultLabelSize: 14,
			defaultLabelBGColor: "#ddd",
			defaultHoverLabelBGColor: "#002147",
			defaultLabelHoverColor: "#fff",
			labelThreshold: 10,
			defaultEdgeType: "curve",
			hoverFontStyle: "bold",
			fontStyle: "bold",
			activeFontStyle: "bold"
		};

	if (config.sigma && config.sigma.graphProperties)
		graphProps = config.sigma.graphProperties;
	else
		graphProps = {
			minNodeSize: 1,
			maxNodeSize: 7,
			minEdgeSize: 0.2,
			maxEdgeSize: 0.5
		};

	if (config.sigma && config.sigma.mouseProperties)
		mouseProps = config.sigma.mouseProperties;
	else
		mouseProps = {
			minRatio: 0.75,
			maxRatio: 20,
		};

	var a = sigma.init(document.getElementById("sigma-canvas")).drawingProperties(drawProps).graphProperties(graphProps).mouseProperties(mouseProps);
	sigInst = a;
	a.active = !1;
	a.neighbors = {};
	a.detail = !1;

	dataReady = function () { //Called as soon as data is loaded
		a.clusters = {};

		a.iterNodes(
			function (b) { //Populate the array used for the group select box

			// Note: index may not be consistent for all nodes. Should calculate each time.
			a.clusters[b.color] || (a.clusters[b.color] = []);
			a.clusters[b.color].push(b.id);
		});

		a.bind("upnodes", function (a) {
			nodeActive(a.content[0])
		});

		a.draw();
		configSigmaElements(config);
	}

	if (data.indexOf("gexf") > 0 || data.indexOf("xml") > 0)
		a.parseGexf(data, dataReady);
	else
		a.parseJson(data, dataReady);
	gexf = sigmaInst = null;
}

// Setup DOM GUI with values from config file
function setupGUI(config) {

	var logo = "";
	if (config.logo.file) {

		logo = "<img src=\"" + config.logo.file + "\"";
		if (config.logo.text)
			logo += " alt=\"" + config.logo.text + "\"";
		logo += ">";
	} else if (config.logo.text) {
		logo = "<h1>" + config.logo.text + "</h1>";
	}
	if (config.logo.link)
		logo = "<a href=\"" + config.logo.link + "\">" + logo + "</a>";
	$("#maintitle").html(logo);

	$("#title").html("<h2>" + config.text.title + "</h2>");

	$("#titletext").html(config.text.intro);

	if (config.text.more) {
		$("#information").html(config.text.more + "<br /><br />Built on technology developed by the <a href=\"http://www.oii.ox.ac.uk/\">Oxford Internet Institute</a> and <a href=\"http://jisc.ac.uk/\">JISC</a>. Full source available on <a href=\"https://github.com/darkoverload/socint\">GitHub</a>.");
	} else {
		$("#moreinformation").hide();
	}

	if (config.legend.nodeLabel) {
		$(".node").next().html(config.legend.nodeLabel);
	} else {
		$(".node").hide();
	}

	if (config.legend.edgeLabel) {
		$(".edge").next().html(config.legend.edgeLabel);
	} else {
		$(".edge").hide();
	}
	
	if (config.legend.nodeLabel) {
		$(".colours").next().html(config.legend.colorLabel);
	} else {
		$(".colours").hide();
	}

	$GP = {
		calculating: !1,
		showgroup: !1
	};

	$GP.intro = $("#intro");
	$GP.minifier = $GP.intro.find("#minifier");
	$GP.mini = $("#minify");
	$GP.info = $("#attributepane");
	$GP.info_donnees = $GP.info.find(".nodeattributes");
	$GP.info_name = $GP.info.find(".name");
	$GP.info_link = $GP.info.find(".link");
	$GP.info_data = $GP.info.find(".data");
	$GP.info_botlogic = $GP.info.find(".botlogic");
	$GP.info_close = $GP.info.find(".returntext");
	$GP.info_close2 = $GP.info.find(".close");
	$GP.info_p = $GP.info.find(".p");
	$GP.info_close.click(nodeNormal);
	$GP.info_close2.click(nodeNormal);
	$GP.form = $("#mainpanel").find("form");
	$GP.search = new Search($GP.form.find("#search"));

	if (!config.features.search) {
		$("#search").hide();
	}

	if (!config.features.groupSelectorAttribute) {
		$("#attributeselect").hide();
	}

	$GP.cluster = new Cluster($GP.form.find("#attributeselect"));

	config.GP = $GP;
	initSigma(config);
}

// Initialize Sigma.js elements
function configSigmaElements(config) {
	$GP = config.GP;

	// Node hover behaviour
	if (config.features.hoverBehavior == "dim") {

		var greyColor = '#ccc';
		sigInst.bind('overnodes', function (event) {
			var nodes = event.content;
			var neighbors = {};
			sigInst.iterEdges(function (e) {
				if (nodes.indexOf(e.source) < 0 && nodes.indexOf(e.target) < 0) {
					if (!e.attr['grey']) {
						e.attr['true_color'] = e.color;
						e.color = greyColor;
						e.attr['grey'] = 1;
					}
				} else {
					e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
					e.attr['grey'] = 0;

					neighbors[e.source] = 1;
					neighbors[e.target] = 1;
				}
			}).iterNodes(function (n) {
				if (!neighbors[n.id]) {
					if (!n.attr['grey']) {
						n.attr['true_color'] = n.color;
						n.color = greyColor;
						n.attr['grey'] = 1;
					}
				} else {
					n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
					n.attr['grey'] = 0;
				}
			}).draw(2, 2, 2);
		}).bind('outnodes', function () {
			sigInst.iterEdges(function (e) {
				e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
				e.attr['grey'] = 0;
			}).iterNodes(function (n) {
				n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
				n.attr['grey'] = 0;
			}).draw(2, 2, 2);
		});

	} else if (config.features.hoverBehavior == "hide") {

		sigInst.bind('overnodes', function (event) {
			var nodes = event.content;
			var neighbors = {};
			sigInst.iterEdges(function (e) {
				if (nodes.indexOf(e.source) >= 0 || nodes.indexOf(e.target) >= 0) {
					neighbors[e.source] = 1;
					neighbors[e.target] = 1;
				}
			}).iterNodes(function (n) {
				if (!neighbors[n.id]) {
					n.hidden = 1;
				} else {
					n.hidden = 0;
				}
			}).draw(2, 2, 2);
		}).bind('outnodes', function () {
			sigInst.iterEdges(function (e) {
				e.hidden = 0;
			}).iterNodes(function (n) {
				n.hidden = 0;
			}).draw(2, 2, 2);
		});

	}
	
	$GP.bg = $(sigInst._core.domElements.bg);
	$GP.bg2 = $(sigInst._core.domElements.bg2);
	
	var a = [], b, x = 1;
	for (b in sigInst.clusters)
		a.push('<div style="line-height:12px"><a href="#' + b + '"><div style="width:40px;height:12px;border:1px solid #fff;background:' + b + ';display:inline-block"></div> Group ' + (x++) + ' (' + sigInst.clusters[b].length + ' members)</a></div>');
	$GP.cluster.content(a.join(""));
	b = {
		minWidth: 400,
		maxWidth: 800,
		maxHeight: 600
	};
	$("a.fb").fancybox(b);
	$("#zoom").find("div.z").each(function () {
		var a = $(this),
		b = a.attr("rel");
		a.click(function () {
			if (b == "center") {
				sigInst.position(0, 0, 1).draw();
			} else {
				var a = sigInst._core;
				sigInst.zoomTo(a.domElements.nodes.width / 2, a.domElements.nodes.height / 2, a.mousecaptor.ratio * ("in" == b ? 1.5 : 0.5));
			}
		})
	});

	$GP.mini.click(function () {
		$GP.mini.hide();
		$GP.intro.show();
		$GP.minifier.show()
	});

	$GP.minifier.click(function () {
		$GP.intro.hide();
		$GP.minifier.hide();
		$GP.mini.show()
	});

	$GP.intro.find("#showGroups").click(function () {
		!0 == $GP.showgroup ? showGroups(!1) : showGroups(!0)
	});

	// Initial hash-link processing.
	a = window.location.hash.substr(1);
	if (0 < a.length)
		switch (a) {
		case "Groups":
			showGroups(!0);
			break;
		case "information":
			$.fancybox.open($("#information"), b);
			break;
		default:
			$GP.search.exactMatch = !0,
			$GP.search.search(a)
			$GP.search.clean();
		}

	// Hash-link popstate listener.
	window.addEventListener('popstate', function (event) {
		a = window.location.hash.substr(1);
		var c = [];
		if (0 < a.length)
			switch (a) {
			case "Groups":
				showGroups(!0);
				break;
			case "information":
				$.fancybox.open($("#information"), b);
				break;
			default:
				var rxValidRgb = /([R][G][B][A]?[(]\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])(\s*,\s*((0\.[0-9]{1})|(1\.0)|(1)))?[)])/i
					if (rxValidRgb.test(a)) {
						$GP.search.exactMatch = !0,
						$GP.search.search(a);
						$GP.search.clean();
						break;
					}
					b = ("^" + a + "$").toLowerCase()
					g = RegExp(b);
				sigInst.iterNodes(function (a) {
					g.test(a.label.toLowerCase()) && c.push({
						id: a.id
					})
				});
				autoPush = true;
				nodeActive(c[0].id);
				autoPush = false;
			}
		else {
			autoPush = true;
			nodeNormal();
			autoPush = false;
		}
	});

}

// Node search function
function Search(a) {
	this.input = a.find("input[name=search]");
	this.state = a.find(".state");
	this.results = a.find(".results");
	this.exactMatch = !1;
	this.lastSearch = "";
	this.searching = !1;
	var b = this;
	this.input.focus(function () {
		var a = $(this);
		a.data("focus") || (a.data("focus", !0), a.removeClass("empty"));
		b.clean()
	});
	this.input.keydown(function (a) {
		if (13 == a.which)
			return b.state.addClass("searching"), b.search(b.input.val()), !1
	});
	this.state.click(function () {
		var a = b.input.val();
		b.searching && a == b.lastSearch ? b.close() : (b.state.addClass("searching"), b.search(a))
	});
	this.dom = a;
	this.close = function () {
		this.state.removeClass("searching");
		this.results.hide();
		this.searching = !1;
		this.input.val("");
		nodeNormal()
	};
	this.clean = function () {
		this.results.empty().hide();
		this.state.removeClass("searching");
		this.input.val("");
	};
	this.search = function (a) {
		var b = !1,
		c = [],
		b = this.exactMatch ? ("^" + a + "$").toLowerCase() : a.toLowerCase(),
		g = RegExp(b);
		this.exactMatch = !1;
		this.searching = !0;
		this.lastSearch = a;
		this.results.empty();
		var pageHeight = jQuery(window).height();
		this.results.css("max-height", (pageHeight - 600) + "px");
		if (2 >= a.length)
			this.results.html("<i>You must enter a minimum of three characters.</i>");
		else {
			sigInst.iterNodes(function (a) {
				g.test(a.label.toLowerCase()) && c.push({
					id: a.id,
					name: a.label,
					colour: a.color
				})
			});
			c.length ? (b = !0, nodeActive(c[0].id)) : b = showCluster(a);
			a = ["<div><b>Search Results (" + c.length + ")</b></div>"];
			if (1 < c.length)
				for (var d = 0, h = c.length; d < h; d++)
					a.push('<div class="smallpill" style="background: ' + c[d].colour + ';"></div><a href="#' + c[d].name + '" onclick="nodeActive(\'' + c[d].id + "')\">" + c[d].name + "</a>");
			0 == c.length && !b && a.push("<i>No results found.</i>");
			1 < a.length && this.results.html(a.join(""));
		}
		if (c.length != 1)
			this.results.show();
		if (c.length == 1)
			this.results.hide();
	}
}

// Node cluster function
function Cluster(a) {
	this.cluster = a;
	this.display = !1;
	this.list = this.cluster.find(".list");
	this.list.empty();
	this.select = this.cluster.find(".select");
	this.select.click(function () {
		$GP.cluster.toggle()
	});
	this.toggle = function () {
		this.display ? this.hide() : this.show()
	};
	this.content = function (a) {
		this.list.html(a);
		this.list.find("a").click(function () {
			var a = $(this).attr("href").substr(1);
			showCluster(a)
		})
	};
	this.hide = function () {
		this.display = !1;
		this.list.hide();
		this.select.removeClass("close")
	};
	this.show = function () {
		this.display = !0;
		this.list.show();
		this.select.addClass("close")
	}
}

// Show group selector
function showGroups(a) {
	a ? ($GP.intro.find("#showGroups").text("Hide groups"), $GP.bg.show(), $GP.bg2.hide(), $GP.showgroup = !0) : ($GP.intro.find("#showGroups").text("View Groups"), $GP.bg.hide(), $GP.bg2.show(), $GP.showgroup = !1)
}

// Clear active node
function nodeNormal() {
	!0 != $GP.calculating && !1 != sigInst.detail && (showGroups(!1), $GP.calculating = !0, sigInst.detail = !0, $GP.info.delay(400).animate({
			width: 'hide'
		}, 350), $GP.cluster.hide(), sigInst.iterEdges(function (a) {
			a.attr.color = !1;
			a.hidden = !1
		}), sigInst.iterNodes(function (a) {
			a.hidden = !1;
			a.attr.color = !1;
			a.attr.lineWidth = !1;
			a.attr.size = !1
		}), sigInst.draw(2, 2, 2, 2), sigInst.neighbors = {}, sigInst.active = !1, $GP.calculating = !1/*, window.location.hash = ""*/)
		if (autoPush == false) {
			history.pushState(null, null, document.location.pathname);
		}
}

// Select active node
function nodeActive(a) {

	var groupByDirection = false;
	if (config.informationPanel.groupByEdgeDirection && config.informationPanel.groupByEdgeDirection == true)
		groupByDirection = true;

	sigInst.neighbors = {};
	sigInst.detail = !0;
	var b = sigInst._core.graph.nodesIndex[a];
	showGroups(!1);
	var outgoing = {},
	incoming = {},
	mutual = {};
	sigInst.iterEdges(function (b) {
		b.attr.lineWidth = !1;
		b.hidden = !0;

		n = {
			name: b.label,
			colour: b.color
		};

		if (a == b.source)
			outgoing[b.target] = n;
		else if (a == b.target)
			incoming[b.source] = n;
		if (a == b.source || a == b.target)
			sigInst.neighbors[a == b.target ? b.source : b.target] = n;
		b.hidden = !1,
		b.attr.color = "rgba(0, 0, 0, 1)";
	});
	var f = [];
	sigInst.iterNodes(function (a) {
		a.hidden = !0;
		a.attr.lineWidth = !1;
		a.attr.color = a.color
	});

	if (groupByDirection) {
		//Compute intersection for mutual and remove these from incoming/outgoing
		for (e in outgoing) {
			if (e in incoming) {
				mutual[e] = outgoing[e];
				delete incoming[e];
				delete outgoing[e];
			}
		}
	}

	var createList = function (c) {
		var f = [];
		var e = [],
		g;
		for (g in c) {
			var d = sigInst._core.graph.nodesIndex[g];
			d.hidden = !1;
			d.attr.lineWidth = !1;
			d.attr.color = c[g].colour;
			a != g && e.push({
				id: g,
				name: d.label,
				group: (c[g].name) ? c[g].name : "",
				colour: c[g].colour
			})
		}
		e.sort(function (a, b) {
			var c = a.group.toLowerCase(),
			d = b.group.toLowerCase(),
			e = a.name.toLowerCase(),
			f = b.name.toLowerCase();
			return c != d ? c < d ? -1 : c > d ? 1 : 0 : e < f ? -1 : e > f ? 1 : 0
		});
		d = "";
		for (g in e) {
			c = e[g];
			f.push('<li class="membership"><div class="smallpill" style="background: ' + c.colour + ';"></div><a onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' + c.id + '\'])\" onclick=\"nodeActive(\'' + c.id + '\')" onmouseout="sigInst.refresh()">' + c.name + "</a></li>");
		}
		return f;
	}

	var f = [];

	if (groupByDirection) {
		size = Object.size(mutual);
		f.push("<h2>Mututal (" + size + ")</h2>");
		(size > 0) ? f = f.concat(createList(mutual)) : f.push("No mutual links<br>");
		size = Object.size(incoming);
		f.push("<h2>Incoming (" + size + ")</h2>");
		(size > 0) ? f = f.concat(createList(incoming)) : f.push("No incoming links<br>");
		size = Object.size(outgoing);
		f.push("<h2>Outgoing (" + size + ")</h2>");
		(size > 0) ? f = f.concat(createList(outgoing)) : f.push("No outgoing links<br>");
	} else {
		f = f.concat(createList(sigInst.neighbors));
	}

	b.hidden = !1;
	b.attr.color = b.color;
	b.attr.lineWidth = 6;
	b.attr.strokeStyle = "#000000";
	sigInst.draw(2, 2, 2, 2);

	$GP.info_link.find("ul").html(f.join(""));
	$GP.info_link.find("li").each(function () {
		var a = $(this),
		b = a.attr("rel");
	});
	f = b.attr;
	if (f.attributes) {
		var image_attribute = false;
		if (config.informationPanel.imageAttribute) {
			image_attribute = config.informationPanel.imageAttribute;
		}
		e = [];
		temp_array = [];
		g = 0;
		for (var attr in f.attributes) {
			var d = f.attributes[attr],
			h = "";
			if (attr != image_attribute) {
				h = '<span><strong>' + attr + ':</strong> ' + d + '</span><br/>'
			}
			e.push(h)
		}

		if (image_attribute) {
			$GP.info_name.html("<div><img src=" + f.attributes[image_attribute] + " style=\"vertical-align:middle\" /> <span onmouseover=\"sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex['" + b.id + '\'])" onmouseout="sigInst.refresh()">' + b.label + "</span></div>");
		} else {
			$GP.info_name.html("<div><img src=\"images/twitter.png\" style=\"vertical-align:middle\" /><span onmouseover=\"sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex['" + b.id + '\'])" onmouseout="sigInst.refresh()"><a href="http://twitter.com/' + b.label + '" target="_blank">' + b.label + "</a></span></div>");
		}

		// Image field for attribute pane
		$GP.info_data.html(e.join("<br/>"))
	}

	// Debug
	// var time = new Date();
	// console.log("DEBUG(" + time.getTime() + "): " + arguments.callee.caller.toString());

	var blResp, bl = [];

	// DISABLED UNTIL CORS FIXED @BOTLOGIC
	/* jQuery.getJSON("https://botlogic.io/?sn=" + b.label + "&json=true", function (data, textStatus, jqXHR) {
		blResp = data;
	}); */

	if (blResp && blResp.search_status == "found") {
		bl.push("<span><strong>BotLogic Type:</strong> " + blResp.type_string + "</span><br/>");
		bl.push("<span><strong>BotLogic Score:</strong> " + blResp.score + "</span><br/>");
		bl.push("<span><strong>BotLogic Timestamp:</strong> " + blResp.found_timestamp + "</span><br/>");
		$GP.info_botlogic.html(bl.join("<br/>"));
		$GP.info_botlogic.show();
	} else {
		$GP.info_botlogic.hide();
	}

	$GP.info_data.show();
	$GP.info_p.html("Connections");
	$GP.info.animate({
		width: 'show'
	}, 350);
	$GP.info_donnees.hide();
	$GP.info_donnees.show();
	sigInst.active = a;
	if (autoPush == false) {
		history.pushState(null, null, document.location.pathname + '#' + b.label);
	}
}

// Show node cluster
function showCluster(a) {
	var b = sigInst.clusters[a];
	if (b && 0 < b.length) {
		showGroups(!1);
		sigInst.detail = !0;
		b.sort();
		sigInst.iterEdges(function (a) {
			a.hidden = !1;
			a.attr.lineWidth = !1;
			a.attr.color = !1
		});
		sigInst.iterNodes(function (a) {
			a.hidden = !0
		});
		for (var f = [], e = [], c = 0, g = b.length; c < g; c++) {
			var d = sigInst._core.graph.nodesIndex[b[c]];
			!0 == d.hidden && (e.push(b[c]), d.hidden = !1, d.attr.lineWidth = !1, d.attr.color = d.color, f.push('<li class="membership"><div class="smallpill" style="background: ' + d.color + ';"></div><a href="#' + d.label + '" onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' + d.id + "'])\" onclick=\"nodeActive('" + d.id + '\')" onmouseout="sigInst.refresh()">' + d.label + "</a></li>"))
		}
		sigInst.clusters[a] = e;
		sigInst.draw(2, 2, 2, 2);
		$GP.info_name.html("<b>" + a + "</b>");
		$GP.info_data.hide();
		$GP.info_botlogic.hide();
		$GP.info_p.html("Group Members");
		$GP.info_link.find("ul").html(f.join(""));
		$GP.info.animate({
			width: 'show'
		}, 350);
		$GP.search.clean();
		$GP.cluster.hide();
		return !0
	}
	return !1
}
