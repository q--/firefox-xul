/*
	ui.js
	Copyright © 2013 WOT Services Oy <info@mywot.com>
*/

var vipre_status = {
	set: function(status, description)
	{
		try {
			/* Set tooltip and status */
			var mainwnd = document.getElementById("main-window");
			if (mainwnd) {
				mainwnd.setAttribute("vipre-status", status);
			}

			/* Update display */
			if (vipre_prefs.updateui) {
				vipre_ui.update();
			}
		} catch (e) {
			dump("vipre_status.set: failed with " + e + "\n");
		}
	},

	update: function()
	{
		try {
			if (!vipre_util.isenabled()) {
				return;
			}

			var reputation = -1;

			if (vipre_cache.isok(vipre_core.hostname)) {
				reputation = vipre_cache.get(vipre_core.hostname, "reputation_0");
			}
			
			/* Set status and description */
			var rep_l, rep, r_level, description;

            rep_l = vipre_util.get_level(VIPRE_REPUTATIONLEVELS, reputation);
            r_level = rep_l.level;
            rep = rep_l.name;
            description = vipre_util.getstring("reputationlevels_" + rep);

			this.set(r_level, description);

		} catch (e) {
			wdump("vipre_status.update: failed with " + e);
		}
	}
};

var vipre_ui = {

	update: function()
	{
		try {
			vipre_commands.update();
		} catch (e) {
			dump("vipre_ui.update: failed with " + e + "\n");
		}
	},

	geticonurl: function(r, size, plain)
	{
        var image = vipre_util.get_level(VIPRE_REPUTATIONLEVELS, r).name,
		    base = "chrome://vipre/skin/vipre/";

		return base + size + "_" + size + "/" + image + ".png";
	}
};
