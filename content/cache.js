/*
	cache.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

var vipre_hashtable =
{
	load_delayed: function()
	{
		try {
			if (this.bag) {
				return;
			}
			this.bag = Components.classes["@mozilla.org/hash-property-bag;1"].
						getService(Components.interfaces.nsIWritablePropertyBag);
		} catch (e) {
			wdump("vipre_hashtable.init: failed with: " + e);
		}
	},

	unload: function()
	{
		this.bag = null;
	},

	set: function(name, value)
	{
		try {
            if (!this.bag) this.load_delayed();
			this.bag.setProperty(name, value);
		} catch (e) {
			dump("vipre_hashtable.set: failed with " + e + "\n");
            wdump(name + " = " + value);
		}
	},

	get: function(name)
	{
		try {
            if (!this.bag) this.load_delayed();
			return this.bag.getProperty(name);
		} catch (e) {
		}
		return null;
	},

	remove: function(name)
	{
		try {
            if (!this.bag) this.load_delayed();
			this.bag.deleteProperty(name);
		} catch (e) {
		}
	},

	get_enumerator: function(name)
	{
		try {
            if (!this.bag) this.load_delayed();
			return this.bag.enumerator;
		} catch (e) {
			dump("vipre_hashtable.get_enumerator: failed with " + e + "\n");
		}
		return null;
	}
};

vipre_modules.push({ name: "vipre_hashtable", obj: vipre_hashtable });

/* Cache status */
const VIPRE_QUERY_ERROR = 0;	/* Failed */
const VIPRE_QUERY_OK    = 1;	/* Successful */
const VIPRE_QUERY_RETRY = 2;	/* Request or cache timed out, retry */
const VIPRE_QUERY_LINK  = 3;	/* Incomplete for a query use, retry */

const VIPRE_PREFIX_CACHE = "vipre_cache";
const VIPRE_CNRE = RegExp(VIPRE_PREFIX_CACHE + "\:(.+)\:exists");

var vipre_cache =
{
	get_property_name: function(name, property)
	{
		if (!name || !property) {
			return null;
		}

		var cn = vipre_idn.utftoidn(name);

		if (!cn) {
			return null;
		}

		return VIPRE_PREFIX_CACHE + ":" + cn + ":" + property;
	},

	get: function(name, property)
	{
		if (!vipre_util.isenabled()) {
			return null;
		}

		var pn = this.get_property_name(name, property);

		if (!pn) {
			return null;
		}

		return vipre_hashtable.get(pn);
	},

	set: function(name, property, value)
	{
		var pn = this.get_property_name(name, property);

		if (!pn) {
			return;
		}

        vipre_hashtable.set(pn, value);
	},

	remove: function(name, property)
	{
		var pn = this.get_property_name(name, property);

		if (!pn) {
			return;
		}

		vipre_hashtable.remove(pn);
	},

	iscached: function(name)
	{
		return !!this.get(name, "exists");
	},

	isok: function(name)
	{
		if (this.iscached(name)) {
			var s = this.get(name, "status");
 			return (s == VIPRE_QUERY_OK ||
						(vipre_prefs.prefetch && s == VIPRE_QUERY_LINK));
		}
		return false;
	},

	get_enumerator: function()
	{
		return vipre_hashtable.get_enumerator();
	},

	get_name_from_element: function(element)
	{
		try {
			if (!element || !element.QueryInterface) {
				return null;
			}

			var property =
					element.QueryInterface(Components.interfaces.nsIProperty);

			if (!property) {
				return null;
			}

			if (property.name.lastIndexOf(":exists") < 0) {
				return null;
			}

			var match = property.name.match(VIPRE_CNRE);

			if (!match || !match[1]) {
				return null;
			}

			return match[1];
		} catch (e) {
			dump("vipre_cache.get_name_from_element: failed with " + e + "\n");
		}
		return null;
	},

	create: function(name)
	{
		try {
			if (!name) {
				return;
			}

			if (!this.iscached(name)) {
				this.set(name, "exists", true);
				this.set(name, "pending", false);
				this.set(name, "warned",  0);
			}

			this.set(name, "inprogress", false);
			this.set(name, "status", VIPRE_QUERY_RETRY);
			this.set(name, "time", Date.now());

            this.set(name, "reputation_0", -1);
		} catch (e) {
			wdump("vipre_cache.create: failed with " + e);
		}
	},

	destroy: function(name)
	{
		try {
			if (!this.iscached(name)) {
				return;
			}

			this.remove(name, "exists");
			this.remove(name, "warned");
			this.remove(name, "inprogress");
			this.remove(name, "status");
			this.remove(name, "time");
            this.remove(name, "reputation_0");
		} catch (e) {
			wdump("vipre_cache.destroy: failed with " + e);
		}
	},

	add_target: function(target, status)
	{
		try {
			if (!this.iscached(target)) {
				this.create(target);
			}

            this.set(target, "reputation_0", status);
            this.set(target, "status", VIPRE_QUERY_OK);

        } catch (e) {
			wdump("ERROR: vipre_cache.add_target: failed with " + e);
		}
	}
};
