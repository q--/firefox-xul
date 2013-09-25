/*
	cache.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

var wot_hashtable =
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
			wdump("wot_hashtable.init: failed with: " + e);
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
			dump("wot_hashtable.set: failed with " + e + "\n");
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
			dump("wot_hashtable.get_enumerator: failed with " + e + "\n");
		}
		return null;
	}
};

wot_modules.push({ name: "wot_hashtable", obj: wot_hashtable });

/* Cache status */
const WOT_QUERY_ERROR = 0;	/* Failed */
const WOT_QUERY_OK    = 1;	/* Successful */
const WOT_QUERY_RETRY = 2;	/* Request or cache timed out, retry */
const WOT_QUERY_LINK  = 3;	/* Incomplete for a query use, retry */

const WOT_PREFIX_CACHE = "wot_cache";
const WOT_PREFIX_NONCE = "wot_nonce";
const WOT_CNRE = RegExp(WOT_PREFIX_CACHE + "\:(.+)\:exists");

var wot_cache =
{
	get_nonce_name: function(nonce)
	{
		if (!nonce) {
			return null;
		}

		return WOT_PREFIX_NONCE + ":" + nonce;
	},

	add_nonce: function(nonce, name)
	{
		var nn = this.get_nonce_name(nonce);

		if (!nn) {
			return;
		}

		wot_hashtable.set(nn, name);
	},

	resolve_nonce: function(nonce)
	{
		var nn = this.get_nonce_name(nonce);

		if (!nn) {
			return null;
		}

		return wot_hashtable.get(nn);
	},

	remove_nonce: function(nonce)
	{
		var nn = this.get_nonce_name(nonce);

		if (!nn) {
			return;
		}

		wot_hashtable.remove(nn);
	},

	get_property_name: function(name, property)
	{
		if (!name || !property) {
			return null;
		}

		var cn = wot_idn.utftoidn(name);

		if (!cn) {
			return null;
		}

		return WOT_PREFIX_CACHE + ":" + cn + ":" + property;
	},

	get: function(name, property)
	{
		if (!wot_util.isenabled()) {
			return null;
		}

		var pn = this.get_property_name(name, property);

		if (!pn) {
			return null;
		}

		return wot_hashtable.get(pn);
	},

	set: function(name, property, value)
	{
		var pn = this.get_property_name(name, property);

		if (!pn) {
			return;
		}

//		wdump(name + ", " + property + ", " + value);
        wot_hashtable.set(pn, value);
	},

	remove: function(name, property)
	{
		var pn = this.get_property_name(name, property);

		if (!pn) {
			return;
		}

		wot_hashtable.remove(pn);
	},

	iscached: function(name)
	{
		return !!this.get(name, "exists");
	},

	isok: function(name)
	{
		if (this.iscached(name)) {
			var s = this.get(name, "status");
 			return (s == WOT_QUERY_OK ||
						(wot_prefs.prefetch && s == WOT_QUERY_LINK));
		}
		return false;
	},

	get_enumerator: function()
	{
		return wot_hashtable.get_enumerator();
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

			var match = property.name.match(WOT_CNRE);

			if (!match || !match[1]) {
				return null;
			}

			return match[1];
		} catch (e) {
			dump("wot_cache.get_name_from_element: failed with " + e + "\n");
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
			this.set(name, "status", WOT_QUERY_RETRY);
			this.set(name, "time", Date.now());

            this.set(name, "reputation_0", -1);
		} catch (e) {
			wdump("wot_cache.create: failed with " + e);
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
			wdump("wot_cache.destroy: failed with " + e);
		}
	},

	add_target: function(target, status)
	{
		try {
			if (!this.iscached(target)) {
				this.create(target);
			}

            this.set(target, "reputation_0", status);
            this.set(target, "status", WOT_QUERY_OK);

        } catch (e) {
			wdump("ERROR: wot_cache.add_target: failed with " + e);
		}
	}
};
