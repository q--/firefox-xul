/*
 blocked.js
 Copyright © 2013  WOT Services Oy <info@mywot.com>
 */

var WOT_QUERY_OK = 1;

var blocked_target = null;

var l10n = {};
var wot_modules = [];

// Implementation of core's module
var wot_categories = {

    select_identified: function (target) {
        // TODO: implement extracting categories info from URL
        return {};
    },

    target_categories: function (target) {
        // TODO: implement extracting categories info from URL and show them on WS
        return {};
    },

    target_blacklists: function (target) {
        // TODO: implement extracting blacklisting info from URL and show it on WS
        return [];
    }
};

function load_l10n(callback) {
	// loads locale stings for add-on, parse them and store in l10n object
	try {
		xhr = new XMLHttpRequest();
		xhr.open("GET", "chrome://vipre/locale/wot.properties", true);

		xhr.onload = function(e) {
			var text = xhr.responseText;

			// detect separator
			var sep = "\r\n";
			if (text.indexOf(sep) < 1) {
				sep = "\n";
			}

			var lines = text.split(sep);
			for(var i=0; i < lines.length; i++) {
				var pair = lines[i].split(" = ", 2);
				l10n[pair[0]] = pair[1];
			}

			callback();
		};

		xhr.send();

	} catch (e) {
		console.log("Exception in blocked.js / load_l10n()");
	}
}

// emulation of original wot_util module
var wot_util = {
	getstring: function(str) {
		return l10n[str] || "?!";
	},

    // Dirty hack: avoid copying functions from other modules!
    isEmpty: function (obj) {
        for (var name in obj) {
            return false;
        }
        return true;
    },

    get_level: function (levels, value, next) {
        next = next ? next : false;

        var next_level = levels[levels.length - 1];

        for (var i = levels.length - 1; i >= 0; --i) {
            if (value >= levels[i].min) {
                return next ? next_level : levels[i];
            }
            next_level = levels[i];
        }

        return levels[1];
    }
};

// stub
var wot_prefs = {
	accessible: false,
	warning_opacity: 1,
	min_confidence_level: 1
};

// stub
var wot_shared = {
	decodehostname: function(s)
	{
		return s;
	}
};

var wot_cache = {
	data: {},
	get: function(name, property)
	{
		return wot_cache.data[property];
	}
};

var wot_browser = {
	show_warning: function(){}  // pure stub. Does nothing.
};

// copy-pasted from core.js - not a best way, I know.
var wot_core = {
	get_level: function(r) {
		if (r >= WOT_MAX_REPUTATION) {
			return 5;
		} else if (r >= 0) {
			return 1;
		} else if (r == -1){
			return 0;
		}
	}
};

function blocked_info()
{
	if (blocked_target) {
		location.href = "http://www.mywot.com/scorecard/" + blocked_target;
	}
}

function blocked_action() {
	var query = atob(decodeURIComponent(window.location.search.substr(1)));
	var m = /target=([^&]*)/.exec(query);

	if (m && m[1]) {
		blocked_target = m[1];
	}

	var reasons = {
		reputation: false,
		userrating: false,
		reason: WOT_REASON_RATING     // will be set to reason of showing warning
	};

	var apps = [ 0 ];

	for (var i = 0; i < apps.length; ++i) {

		var app = apps[i];
		wot_prefs["warning_type_" + app] = WOT_WARNING_BLOCK;
		wot_prefs["warning_level_" + app] = 40;

		var r = -1;

		m = RegExp(apps[i] + "=([^&]*)").exec(query);

		if (m && m[1] != null) {
			for (r = 5; r > 0; --r) {
				if (m[1].indexOf(r) >= 0) {
					wot_cache.data["reputation_" + app] = r * 20 - 1; //already mapped reputation, unmap it back
					wot_cache.data["confidence_" + app] = 99; // dummy confidence
					wot_prefs["show_application_" + app] = true;
					break;
				}
			}

			if (m[1].indexOf("x") >= 0) {
				wot_cache.data["excluded_" + app] = true;
			}

			if (m[1].indexOf("y") >= 0) {
				reasons.userrating = true;
			} else if (m[1].indexOf("r") >= 0 && r > 0) {
				reasons.reputation = true;
			}

			if (m[1].indexOf("a") >= 0) {
				wot_prefs.accessible = true;
			}
		}
	}

	if (!reasons.reputation) {
		if (reasons.userrating) {
			reasons.reason = WOT_REASON_TESTIMONY;
		} else {
			reasons.reason = WOT_REASON_UNKNOWN;
		}
	}

	var el_wotblocked = document.getElementById("wotblocked");

	if (el_wotblocked) {
		wot_warning.is_blocked = true;
		el_wotblocked.setAttribute("exit_mode", wot_warning.set_exitmode(document));
		wot_warning.load_delayed(true); // init warning with blocked=true flag to hide "Goto the site" button
		wot_warning.add(blocked_target, document, WOT_WARNING_DOM, reasons.reason);
	}
}

function blocked_load()
{
	if (!window.location.search) {
		return;
	}

	load_l10n(blocked_action);
}
