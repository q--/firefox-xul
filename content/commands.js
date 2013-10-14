/*
	commands.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

var vipre_commands =
{
	update: function(what)
	{
		try {
			if (!what) {
				what = "command";
			}

			/* Enabled? */
			document.getElementById("vipre-" + what + "-enabled").
				setAttribute("checked", vipre_prefs.enabled);

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

	checkupdates: function()
	{
		try {
			vipre_api_update.send(true);
		} catch (e) {
			dump("vipre_commands.checkupdates: failed with " + e + "\n");
		}
	}
};

vipre_modules.push({ name: "vipre_commands", obj: vipre_commands });
