/*
	ui.js
	Copyright © 2005 - 2012  WOT Services Oy <info@mywot.com>

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

var wot_status = {
	set: function(status, description)
	{
		try {
			if (wot_api_query.message.length > 0 &&
				wot_api_query.message_type.length > 0 &&
				wot_api_query.message_id != wot_prefs.last_message &&
				wot_api_query.message_id != VIPRE_SERVICE_XML_QUERY_MSG_ID_MAINT) {
				status += "-update";
			}

			/* Set tooltip and status */
			var mainwnd = document.getElementById("main-window");
			if (mainwnd) {
				mainwnd.setAttribute("vipre-status", status);
			}

//			var tooltip = document.getElementById("wot-tooltip-text");
//			if (tooltip) {
//				tooltip.value = description;
//			}

			/* Update display */
			if (wot_prefs.updateui) {
				wot_ui.update();
			}
		} catch (e) {
			dump("wot_status.set: failed with " + e + "\n");
		}
	},

	update: function()
	{
		try {
			if (!wot_util.isenabled()) {
				return;
			}

			var reputation = -1;

			if (wot_cache.isok(wot_core.hostname)) {
				reputation = wot_cache.get(wot_core.hostname, "reputation_0");
			}
			
			/* Set status and description */
			var rep_l, rep, r_level, description;

            rep_l = wot_util.get_level(VIPRE_REPUTATIONLEVELS, reputation);
            r_level = rep_l.level;
            rep = rep_l.name;
            description = wot_util.getstring("reputationlevels_" + rep);

			this.set(r_level, description);

		} catch (e) {
			wdump("wot_status.update: failed with " + e);
		}
	}
};

var wot_ui = {

    getElem: function (id) {
        // just a shortcut
        return document.getElementById(id);
    },

//	show_toolbar_button: function(id, after) {
//		try {
//			var nbr = this.getElem("nav-bar");
//
//			if (!nbr || nbr.currentSet.indexOf(id) != -1) {
//				return;
//			}
//
//			var box = this.getElem("navigator-toolbox");
//
//			if (!box) {
//				return;
//			}
//
//			var bar = box.firstChild;
//
//			while (bar) {
//				if (bar.currentSet && bar.currentSet.indexOf(id) != -1) {
//					return;
//				}
//				bar = bar.nextSibling;
//			}
//
//			var target = this.getElem(after);
//
//			if (target) {
//				target = target.nextSibling;
//			}
//
//			nbr.insertItem(id, target);
//			nbr.setAttribute("currentset", nbr.currentSet);
//			document.persist("nav-bar", "currentset");
//		} catch (e) {
//			wdump("wot_ui.show_toolbar_button: failed with " + e);
//		}
//	},

	/* Shows or hides user interface elements based on preferences */
//	show_elements: function()
//	{
//		try {
//			/* Toolbar */
//			if (!wot_prefs.button_created || wot_prefs.create_button) {
//				wot_prefs.setBool("button_created", true);
//				this.show_toolbar_button("vipre-button", "stop-button");
//			}
//
//		} catch (e) {
//			dump("wot_ui.show_elements: failed with " + e + "\n");
//		}
//	},

	update: function()
	{
		try {
			wot_commands.update();
//			this.show_elements();
		} catch (e) {
			dump("wot_ui.update: failed with " + e + "\n");
		}
	},

	geticonurl: function(r, size, plain)
	{
        var image = wot_util.get_level(VIPRE_REPUTATIONLEVELS, r).name,
		    base = "chrome://vipre/skin/vipre/";

		return base + size + "_" + size + "/" + image + ".png";
	}
};
