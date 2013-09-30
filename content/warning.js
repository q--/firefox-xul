/*
	warning.js
	Copyright © 2006 - 2012  WOT Services Oy <info@mywot.com>

	This file is part of WOT.

	WOT is free software: you can redistribute it and/or modify it
	under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	WOT is distributed in the hope that it will be useful, but WITHOUT
	ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
	License for more details.

	You should have received a copy of the GNU General Public License
	along with WOT. If not, see <http://www.gnu.org/licenses/>.
*/

var wot_warning =
{
	exit_mode: "back",
	is_blocked: false,
    warned: {},
    blocked: {},

    register_blocked: function (url) {
        var nonce = wot_crypto.getrandomid();
        this.blocked[nonce] = url;
        return nonce;
    },

    remove_blocked: function (blocked_id) {
        var url = null;
        if (this.blocked[blocked_id]) {
            url = String(this.blocked[blocked_id]);
            delete this.blocked[blocked_id];
        }
        return url;
    },

	load_delayed: function(blocked)
	{
		this.is_blocked = !!blocked || false;
		try {
			if (this.warned && !this.is_blocked) {
				return;
			}

			this.warned = {};
		} catch (e) {
			wdump("wot_warning.load: failed with " + e);
		}
	},

	processhtml: function(html, replaces)
	{
		try {
			for (var i = 0; i < replaces.length; ++i) {
				html = html.replace(
							RegExp("{" + replaces[i][0] + "}", "g"),
							replaces[i][1]);
			}

			return html;
		} catch (e) {
			dump("wot_warning.processhtml: failed with " + e + "\n");
		}

		return null;
	},

	isblocking: function()
	{
		// decides whether we must block page or just warn
		return (wot_prefs["warning_type_0"] == VIPRE_WARNING_BLOCK);
	},

	getwarningtype: function(hostname, app, reason)
	{
		try {
			if (!wot_prefs["show_application_" + app]) {
				return VIPRE_WARNING_NONE;
			}

			var type = wot_prefs["warning_type_" + app];

			if (type == VIPRE_WARNING_NONE) {
				return VIPRE_WARNING_NONE;
			}

			var r = wot_cache.get(hostname, "reputation_" + app);

			if (r < 100 && r >= 0) {
					return (reason) ? VIPRE_REASON_RATING : type;
            } else {
                return VIPRE_WARNING_NONE;
            }
		} catch (e) {
			dump("wot_warning.getwarningtype: failed with " + e + "\n");
		}

		return VIPRE_WARNING_NONE;
	},

	isdangerous: function(hostname, increase)
	{
		var result = VIPRE_WARNING_NONE;
		try {
			if (!wot_cache.isok(hostname)) {
				return result;
			}

            var type = wot_warning.getwarningtype(hostname, 0, false);

            if (type > result) {
                result = type;
            }

            if (result == VIPRE_WARNING_BLOCK) {
                return result;
            }

		} catch (e) {
			dump("wot_warning.isdangerous: failed with " + e + "\n");
		}
		return result;
	},

	set_exitmode: function(content)
	{
		var window = content.defaultView;
		var steps_back = this.is_blocked ? 1 : 1; // when mode is Blocking, there are at least 2 steps in history
		if(window.history.length > steps_back) {
			wot_warning.exit_mode = "back"; // note: don't change this string, there are code dependent on it
		} else {
			wot_warning.exit_mode = "leave";
		}
		return wot_warning.exit_mode;
	},

	add: function(hostname, content, type, forced_reason)
	{
		try {
			if (!hostname || !content ||
					content.getElementById("wotwarning")) {
				return false;
			}

			if (!content.contentType ||
					content.contentType.toLowerCase().indexOf("html") < 0) {
				return true;
			}

			var head = content.getElementsByTagName("head");
			var body = content.getElementsByTagName("body");

			if (!head || !head.length ||
				!body || !body.length) {
				return true;
			}

			return true;
		} catch (e) {
			dump("wot_warning.add: failed with " + e + "\n");
		}

		return false;
	},

	click: function(event)
	{
		try {

            var event_view = event.view;

			if (!event_view) return;

			var content = event_view.document;

			if (!content) return;

			var wot_blocked = content.getElementById("wotblocked"), // Important to have element with this ID
			    is_blocked = !!wot_blocked;

			if(is_blocked) {
				wot_warning.set_exitmode(content);
			}

			var node = event.originalTarget;
			var handle_ids = {
				"vipre-back":  true,
				"vipre-bypass": true
			};

			var node_id = null;

			while (node) {
				node_id = node.id;
				if (node_id && handle_ids[node_id]) break;
				node = node.parentNode;
			}

			if (!node || !node_id) {
				return;
			}

			switch (node_id) {
                case "vipre-bypass":
                    var blocked_id = String(wot_blocked.getAttribute("vipre_blocked_id")),
                        blocked_target = wot_blocked.getAttribute("vipre_blocked_target");
                    wot_core.bypass_blocking(blocked_id, blocked_target, content.defaultView);
					break;

				case "vipre-back":
					var window = content.defaultView;
					if(wot_warning.exit_mode == "leave") {
						// close tab
						window.close();
					} else {
						var back_timer = null;
						var prev_location = window.location.host;
						back_timer = window.setTimeout(function() {
							// this is a trick: we don't know if there is a back-step possible if history.length>1,
							// so we simply wait for a short time, and if we are still on a page, then "back" is impossible and
							// we should go to blank page
							if(window.location.host == prev_location) window.close();
						}, 2000);
                        window.history.go(-1);

                    }

					break;
			}

		} catch (e) {
			dump("wot_warning.click: failed with " + e + "\n");
		}
	}
};

wot_modules.push({ name: "wot_warning", obj: wot_warning });
