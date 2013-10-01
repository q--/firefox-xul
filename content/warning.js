/*
	warning.js
	Copyright © 2013 WOT Services Oy <info@mywot.com>
*/

var vipre_warning =
{
	exit_mode: "back",
	is_blocked: false,
    warned: {},
    blocked: {},

    register_blocked: function (url) {
        var nonce = vipre_crypto.getrandomid();
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
			wdump("vipre_warning.load: failed with " + e);
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
			dump("vipre_warning.processhtml: failed with " + e + "\n");
		}

		return null;
	},

	isblocking: function()
	{
		// decides whether we must block page or just warn
		return (vipre_prefs["warning_type_0"] == VIPRE_WARNING_BLOCK);
	},

	getwarningtype: function(hostname, app, reason)
	{
		try {
			if (!vipre_prefs["show_application_" + app]) {
				return VIPRE_WARNING_NONE;
			}

			var type = vipre_prefs["warning_type_" + app];

			if (type == VIPRE_WARNING_NONE) {
				return VIPRE_WARNING_NONE;
			}

			var r = vipre_cache.get(hostname, "reputation_" + app);

			if (r < 100 && r >= 0) {
					return (reason) ? VIPRE_REASON_RATING : type;
            } else {
                return VIPRE_WARNING_NONE;
            }
		} catch (e) {
			dump("vipre_warning.getwarningtype: failed with " + e + "\n");
		}

		return VIPRE_WARNING_NONE;
	},

	isdangerous: function(hostname, increase)
	{
		var result = VIPRE_WARNING_NONE;
		try {
			if (!vipre_cache.isok(hostname)) {
				return result;
			}

            var type = vipre_warning.getwarningtype(hostname, 0, false);

            if (type > result) {
                result = type;
            }

            if (result == VIPRE_WARNING_BLOCK) {
                return result;
            }

		} catch (e) {
			dump("vipre_warning.isdangerous: failed with " + e + "\n");
		}
		return result;
	},

	set_exitmode: function(content)
	{
		var window = content.defaultView;
		var steps_back = this.is_blocked ? 1 : 1; // when mode is Blocking, there are at least 2 steps in history
		if(window.history.length > steps_back) {
			vipre_warning.exit_mode = "back"; // note: don't change this string, there are code dependent on it
		} else {
			vipre_warning.exit_mode = "leave";
		}
		return vipre_warning.exit_mode;
	},

	add: function(hostname, content, type, forced_reason)
	{
		try {
			if (!hostname || !content ||
					content.getElementById("viprewarning")) {
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
			dump("vipre_warning.add: failed with " + e + "\n");
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

			var vipre_blocked = content.getElementById("vipreblocked"), // Important to have element with this ID
			    is_blocked = !!vipre_blocked;

			if(is_blocked) {
				vipre_warning.set_exitmode(content);
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
                    var blocked_id = String(vipre_blocked.getAttribute("vipre_blocked_id")),
                        blocked_target = vipre_blocked.getAttribute("vipre_blocked_target");
                    vipre_core.bypass_blocking(blocked_id, blocked_target, content.defaultView);
					break;

				case "vipre-back":
					var window = content.defaultView;
					if(vipre_warning.exit_mode == "leave") {
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
			dump("vipre_warning.click: failed with " + e + "\n");
		}
	}
};

vipre_modules.push({ name: "vipre_warning", obj: vipre_warning });
