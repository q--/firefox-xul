/*
	commands.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

var vipre_commands =
{
	load_delayed: function()
	{
		try {
			this.menu = document.getElementById("contentAreaContextMenu");

			if (this.menu) {
				this.menu.addEventListener("popupshowing",
					vipre_commands.contextmenushowing, false);
			}
		} catch (e) {
			dump("vipre_commands.load: failed with " + e + "\n");
		}
	},

	unload: function()
	{
		try {
			if (this.menu) {
				this.menu.removeEventListener("popupshowing",
					vipre_commands.contextmenushowing, false);
				this.menu = null;
			}
		} catch (e) {
			dump("vipre_commands.unload: failed with " + e + "\n");
		}
	},

	getcontexthostname: function()
	{
		try {
			if (gContextMenu.onLink && gContextMenu.linkURL) {
				return vipre_url.gethostname(gContextMenu.linkURL);
			}
		} catch (e) {
			dump("vipre_commands.getcontexthostname:: failed with " + e + "\n");
		}

		return null;
	},

	contextmenushowing: function()
	{
		try {
			var hostname = vipre_commands.getcontexthostname();
			var r = -1;

			if (hostname) {
				r = vipre_search.getreputation(hostname);
			}

			var item = document.getElementById("vipre-content-openlinkscorecard");

			if (item) {
				if (r < 0) {
					item.setAttribute("image", "");
				} else {
					item.setAttribute("image", vipre_ui.geticonurl(r, 16, true));
				}
			}

			gContextMenu.showItem("vipre-content-openlinkscorecard",
				!!hostname);
		} catch (e) {
			dump("vipre_commands.contextmenushowing: failed with " + e + "\n");
		}
	},

	/* Determines the elements for which a tooltip should be shown */
	tooltip_update: function(element)
	{
		try {
			return (element == document.getElementById("vipre-button") ||
					element == document.getElementById("vipre-bar") ||
					element == document.getElementById("vipre-bar-image"));
		} catch (e) {
			dump("vipre_commands.tooltip_update: failed with " + e + "\n");
		}
		return false;
	},

	update: function(what)
	{
		try {
			if (!what) {
				what = "command";
			}

			/* Enabled? */
			document.getElementById("vipre-" + what + "-enabled").
				setAttribute("checked", vipre_prefs.enabled);

			var cached = vipre_cache.isok(vipre_core.hostname);

			/* Refresh */
			document.getElementById("vipre-" + what + "-refresh").
				setAttribute("disabled", !vipre_util.isenabled() || !cached);

		} catch (e) {
			dump("vipre_commands.update: failed with " + e + "\n");
		}
	},

	enabled: function()
	{
		try {
			vipre_prefs.enabled = !vipre_prefs.enabled;
			vipre_prefs.setBool("enabled", vipre_prefs.enabled);
			vipre_core.update();
		} catch (e) {
			wdump("vipre_commands.enabled: failed with " + e);
		}
	},

	refresh: function()
	{
		try {
			if (vipre_cache.iscached(vipre_core.hostname)) {
				vipre_cache.set(vipre_core.hostname, "status", VIPRE_QUERY_RETRY);
				vipre_core.update();
			}
		} catch (e) {
			wdump("vipre_commands.refresh: failed with " + e);
		}
	},

	preferences: function()
	{
		try {
			getBrowser().loadURI(vipre_url.getprefurl());
		} catch (e) {
			dump("vipre_commands.preferences: failed with " + e + "\n");
		}
	},

	checkupdates: function()
	{
		try {
			vipre_api_update.send(true);
		} catch (e) {
			dump("vipre_commands.checkupdates: failed with " + e + "\n");
		}
	},

	my: function()
	{
		try {
			var url = vipre_url.getwoturl("", "");
			if (url) {
				getBrowser().loadURI(url);
			}
		} catch (e) {
			dump("vipre_commands.my: failed with " + e + "\n");
		}
	}
};

vipre_modules.push({ name: "vipre_commands", obj: vipre_commands });

var vipre_events =
{
	click_button: function(event)
	{
		try {
			/* Middle-click takes to scorecard */
			if (event.button == 1 && vipre_core.hostname) {
				vipre_browser.openscorecard(vipre_core.hostname, null, VIPRE_URL_BTN);
			}
		} catch (e) {
			dump("vipre_events.click_button: failed with " + e + "\n");
		}
	}
};
