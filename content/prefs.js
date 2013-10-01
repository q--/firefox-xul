/*
	prefs.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

/* Observes extension preferences */
var vipre_prefs =
{
	load: function()
	{
		try {
			if (this.pref) {
				return;
			}

			this.ps = Components.classes["@mozilla.org/preferences-service;1"].
							getService(Components.interfaces.nsIPrefService);

			this.pref = this.ps.getBranch(null);
			this.pref_default = this.ps.getDefaultBranch(null);

			/* Default values */
			for (var i = 0; i < vipre_prefs_bool.length; ++i) {
				this.setDefaultBool(vipre_prefs_bool[i][0],
					vipre_prefs_bool[i][1]);
				this[vipre_prefs_bool[i][0]] = vipre_prefs_bool[i][1];
			}

			for (var i = 0; i < vipre_prefs_char.length; ++i) {
				this.setDefaultChar(vipre_prefs_char[i][0],
					vipre_prefs_char[i][1]);
				this[vipre_prefs_char[i][0]] = vipre_prefs_char[i][1];
			}

			for (var i = 0; i < vipre_prefs_int.length; ++i) {
				this.setDefaultInt(vipre_prefs_int[i][0],
					vipre_prefs_int[i][1]);
				this[vipre_prefs_int[i][0]] = vipre_prefs_int[i][1];
			}

			/* Add observer */
			this.pbi = this.pref.QueryInterface(
							Components.interfaces.nsIPrefBranch2);
			this.pbi.addObserver(VIPRE_PREF, this, false);

			this.updateui = false;
		} catch (e) {
			dump("vipre_prefs.load: failed with " + e + "\n");
		}
	},

	load_delayed: function()
	{
		try {
			this.sync();
		} catch (e) {
			dump("vipre_prefs.load: failed with " + e + "\n");
		}
	},

	unload: function()
	{
		try {
			if (this.pbi) {
				this.pbi.removeObserver(VIPRE_PREF, this);
				this.pbi = null;
			}
			this.pref_default = null;
			this.pref = null;
			this.ps = null;
		} catch (e) {
			dump("vipre_prefs.unload: failed with " + e + "\n");
		}
	},

	setupdateui: function()
	{
		try {
			this.updateui = true;
			this.sync();
		} catch (e) {
			dump("vipre_prefs.setupdateui: failed with " + e + "\n");
		}
	},

	getBool: function(name, default_value)
	{
		try {
			if (this.pref.getPrefType(VIPRE_PREF +
					name) == this.pref.PREF_BOOL) {
				return this.pref.getBoolPref(VIPRE_PREF + name);
			}
		} catch (e) {
			dump("vipre_prefs.getBool(" + name + "): failed with " + e + "\n");
		}
		return default_value;
	},

	setBool: function(name, value)
	{
		try {
			this.pref.setBoolPref(VIPRE_PREF + name, value);
			return true;
		} catch (e) {
			dump("vipre_prefs.setBool(" + name + "): failed with " + e + "\n");
		}
		return false;
	},

	setDefaultBool: function(name, value)
	{
		try {
			this.pref_default.setBoolPref(VIPRE_PREF + name, value);
			return true;
		} catch (e) {
			dump("vipre_prefs.setDefaultBool(" + name + "): failed with " +
				e + "\n");
		}
		return false;
	},

	getInt: function(name, default_value)
	{
		try {
			if (this.pref.getPrefType(VIPRE_PREF +
					name) == this.pref.PREF_INT) {
				return this.pref.getIntPref(VIPRE_PREF + name);
			}
		} catch (e) {
			dump("vipre_prefs.getInt(" + name + "): failed with " + e + "\n");
		}
		return default_value;
	},

	setInt: function(name, value)
	{
		try {
			this.pref.setIntPref(VIPRE_PREF + name, value);
			return true;
		} catch (e) {
			dump("vipre_prefs.setInt(" + name + "): failed with " + e + "\n");
		}
		return false;
	},

	setDefaultInt: function(name, value)
	{
		try {
			this.pref_default.setIntPref(VIPRE_PREF + name, value);
			return true;
		} catch (e) {
			dump("vipre_prefs.setDefaultInt(" + name + "): failed with " +
				e + "\n");
		}
		return false;
	},

	getChar: function(name, default_value, safe_utf8)
	{
		try {
			if (this.pref.getPrefType(VIPRE_PREF + name) == this.pref.PREF_STRING) {
				var res = this.pref.getCharPref(VIPRE_PREF + name);

                return safe_utf8 ? vipre_util.decode_utf8(res) : res; // decode from utf8
			}
		} catch (e) {
			dump("vipre_prefs.getChar(" + name + "): failed with " + e + "\n");
		}
		return default_value;
	},

	setChar: function(name, value, safe_utf8)
	{
		try {
            if (this.pref) {
                value = safe_utf8 ? vipre_util.encode_utf8(value) : value; // endode to utf8 if needed
                this.pref.setCharPref(VIPRE_PREF + name, value);
                return true;
            }
		} catch (e) {
			dump("vipre_prefs.setChar(" + name + "): failed with " + e + "\n");
		}
		return false;
	},

	setDefaultChar: function(name, value)
	{
		try {
			this.pref_default.setCharPref(VIPRE_PREF + name, value);
			return true;
		} catch (e) {
			dump("vipre_prefs.setDefaultChar(" + name + "): failed with " +
				e + "\n");
		}
		return false;
	},

	clear: function(name)
	{
		try {
			this.pref.clearUserPref(VIPRE_PREF + name);
		} catch (e) {
			/* dump("vipre_prefs.clear(" + name + "): failed with " + e + "\n"); */
		}
	},

	deleteBranch: function(name)
	{
		try {
			this.pref.deleteBranch(VIPRE_PREF + name.replace(/\.$/, ''));
		} catch (e) {
			dump("vipre_prefs.deleteBranch(" + name + "): failed with " + e + "\n");
		}
	},

	flush: function()
	{
		try {
			this.ps.savePrefFile(null);
		} catch (e) {
			dump("vipre_prefs.flush: failed with " + e + "\n");
		}
	},

    setSmart: function (name, value) {
        // Looks up through preferences names and call the proper function to set the value of the named preference
        var prefs_sets = [
            [vipre_prefs_char, vipre_prefs.setChar],
            [vipre_prefs_int, vipre_prefs.setInt ],
            [vipre_prefs_bool, vipre_prefs.setBool]
        ];

        for (var s = 0; s < prefs_sets.length; s++) {
            var pset = prefs_sets[s][0];
            for (var i = 0; i < pset.length; ++i) {
                if (pset[i][0] === name) {
                    var func = prefs_sets[s][1];
                    func.call(vipre_prefs, name, value);
                    return;
                }
            }
        }
    },

	sync: function()
	{
		try {
			var was_enabled = this.enabled;

			for (var i = 0; i < vipre_prefs_bool.length; ++i) {
				this[vipre_prefs_bool[i][0]] =
					this.getBool(vipre_prefs_bool[i][0], vipre_prefs_bool[i][1]);
			}

			for (var i = 0; i < vipre_prefs_char.length; ++i) {
				this[vipre_prefs_char[i][0]] =
					this.getChar(vipre_prefs_char[i][0], vipre_prefs_char[i][1]);
			}

			for (var i = 0; i < vipre_prefs_int.length; ++i) {
				this[vipre_prefs_int[i][0]] =
					this.getInt(vipre_prefs_int[i][0], vipre_prefs_int[i][1]);
			}

			/* Do stuff */
			if (this.updateui) {
				vipre_ui.update();

				if (was_enabled != this.enabled) {
					vipre_core.update();
				}

//				if (this.install_search) {
//					vipre_browser.installsearch();
//				}

				/* Always use prefetching when blocking is enabled */
				if (vipre_warning.isblocking()) {
					this.prefetch = true;
				}
			}
		} catch (e) {
			dump("vipre_prefs.sync: failed with " + e + "\n");
		}
	},

	observe: function(subject, topic, state)
	{
		try {
			if (topic == "nsPref:changed") {
				this.sync();
			}
		} catch (e) {
			dump("vipre_prefs.observe: failed with " + e + "\n");
		}
	}
};

vipre_modules.push({ name: "vipre_prefs", obj: vipre_prefs });
