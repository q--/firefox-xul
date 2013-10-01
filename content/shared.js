/*
	shared.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

const VIPRE_PREFIX_SHARED = "vipre_shared";

var vipre_shared =
{
	set: "abcdefghijklmnopqrstuvwxyz234567",
	rev: null,

	load_delayed: function()
	{
		try {
			this.sync();
		} catch (e) {
			dump("vipre_shared.load: failed with " + e + "\n");
		}
	},

	parse: function(shared)
	{
		try {
			var i;
			var data = {};

			for (i = 0; i < shared.length; ++i) {
				var attr = shared[i].attributes.getNamedItem(
								VIPRE_SERVICE_XML_UPDATE_SHARED_LEVEL);

				if (!attr || !attr.value) {
					return;
				}

				var level = Number(attr.value);

				if (level < 1) {
					return;
				}

				var attr = shared[i].attributes.getNamedItem(
								VIPRE_SERVICE_XML_UPDATE_SHARED_DOMAINS);

				if (!attr || !attr.value) {
					return;
				}

				if (!data[level]) {
					data[level] = [];
				}

				data[level] = data[level].concat(attr.value.split(","));
			}

			for (i in data) {
				vipre_prefs.setChar("shared." + i, data[i].join(","));
			}

			this.sync();
		} catch (e) {
			dump("vipre_shared.parse: failed with " + e + "\n");
		}
	},

	sync: function()
	{
		try {
			var branch = vipre_prefs.ps.getBranch(VIPRE_PREF + "shared.");
			var children = branch.getChildList("", {});

			for (var i = 0; i < children.length; ++i) {
				var level = Number(children[i]);

				if (level < 1) {
					continue;
				}

				var data = vipre_prefs.getChar("shared." + children[i]);

				if (!data || !data.length) {
					continue;
				}

				var domains = data.split(",");

				for (var j = 0; j < domains.length; ++j) {
					if (!domains[j].length) {
						continue;
					}

					var pn = vipre_idn.utftoidn(domains[j]);

					if (!pn) {
						continue;
					}

					vipre_hashtable.set(VIPRE_PREFIX_SHARED + ":" + pn, level);
				}
			}
		} catch (e) {
			dump("vipre_shared.load: failed with " + e + "\n");
		}
	},

	isshared: function(host)
	{
		try {
			return vipre_hashtable.get(VIPRE_PREFIX_SHARED + ":" + host);
		} catch (e) {
			dump("vipre_shared.isshared: failed with " + e + "\n");
		}

		return null;
	},

	isencodedhostname: function(host)
	{
		try {
			return /^_p_[a-z2-7]+\..+$/.test(host);
		} catch (e) {
			dump("url.isencodedhostname: failed with " + e + "\n");
		}

		return false;
	},

	encodehostname: function(host, path)
	{
		try {
			if (!host || !path) {
				return host;
			}

			/* Clean up the path, drop query string and hash */
			path = path.replace(/^\s+/, "")
					.replace(/\s+$/, "")
					.replace(/[\?#].*$/, "");
 
			if (path.length < 2 || path[0] != "/") {
				return host;
			}

			var h = vipre_idn.utftoidn(host);

			if (!h) {
				return host;
			}

			var c = path.split("/");

			if (!c || !c.length) {
				return host;
			}

			/* Drop a suspected filename from the end */
			if (path[path.length - 1] != "/" &&
					/\.[^\.]{1,6}$/.test(c[c.length - 1])) {
				c.pop();
			}

			var level = 0;

			for (var i = c.length; !level && i > 0; --i) {
				level = this.isshared(h + c.slice(0, i).join("/"));
			}

			if (!level) {
				return host;
			}

			var p = c.slice(0, level + 1).join("/").replace(/^\//, "");

			if (!p || !p.length) {
				return host;
			}

			var encoded = this.base32encode(p);

			if (encoded == null) {
				return host;
			}

			return "_p_" + encoded + "." + host;
		} catch (e) {
			dump("vipre_shared.encodehostname: failed with " + e + "\n");
		}

		return host;
	},

	decodehostname: function(host)
	{
		try {
			var m = /^_p_([a-z2-7]+)\.(.+)$/.exec(host);

			if (!m || !m[1] || !m[2]) {
				return host;
			}

			var decoded = this.base32decode(m[1]);

			if (decoded == null) {
				return host;
			}

			return m[2] + "/" + decoded;
		} catch (e) {
			dump("vipre_shared.decodehostname: failed with " + e + "\n");
		}

		return host;
	},

	base32encode: function(s)
	{
		try {
			/* Unicode to UTF-8 */
			s = unescape(encodeURIComponent(decodeURIComponent(s)));

			var r = "";
			var b = 0;
			var l = 0;

			for (var i = 0; i < s.length; ++i) {
				var n = s.charCodeAt(i);

				if (n > 255) {
					return null; /* Invalid input */
				}

				b = (b << 8) + n;
				l += 8;

				do {
					l -= 5;
					r += this.set[(b >> l) & 0x1F];
				} while (l >= 5);
			}

			if (l > 0) {
				r += this.set[(b << (5 - l)) & 0x1F];
			}

			return r;
		} catch (e) {
			dump("vipre_shared.base32encode: failed with " + e + "\n");
		}
		
		return null;
	},

	base32decode: function(s)
	{
		try {
			/* Build a reverse lookup table */
			if (!this.rev) {
				this.rev = {};

				for (var i = 0; i < this.set.length; ++i) {
					this.rev[this.set.charAt(i)] = i;
				}
			}

			var r = "";
			var b = 0;
			var l = 0;

			for (var i = 0; i < s.length; ++i) {
				var n = this.rev[s.charAt(i)];

				if (n == null) {
					return null; /* Invalid input */
				}

				b = (b << 5) + n;
				l += 5;

				while (l >= 8) {
					l -= 8;
					r += String.fromCharCode((b >> l) & 0xFF);
				}
			}

			if (l >= 5) {
				return null; /* Invalid input */
			}

			/* UTF-8 to Unicode */
			return decodeURIComponent(escape(r));
		} catch (e) {
			dump("vipre_shared.base32decode: failed with " + e + "\n");
		}

		return null;
	}
};

vipre_modules.push({ name: "vipre_shared", obj: vipre_shared });
