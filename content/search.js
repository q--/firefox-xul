/*
	search.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

var wot_search =
{
	attrstr: [
			VIPRE_SEARCH_DISPLAY,
			VIPRE_SEARCH_URL,
			VIPRE_SEARCH_IGN,
			VIPRE_SEARCH_URLIGN,
			VIPRE_SEARCH_PRESTYLE,
			VIPRE_SEARCH_SCRIPT,
			VIPRE_SEARCH_STYLE
    ],

	attrint: [
			VIPRE_SEARCH_DYNAMIC,
			VIPRE_SEARCH_SEARCHLEVEL
		],

    VIPRE_VERDICT_ATTR: "vipre_status",

	load_delayed: function()
	{
		try {

			if (this.rules && !wot_util.isEmpty(this.rules) && wot_search.attribute) {
				return;
			}
            this.attribute  = wot_crypto.getrandomid();
            this.processed  = wot_crypto.getrandomid();
            this.prestyleid = wot_crypto.getrandomid();
			this.rules = {};

			/* Prefs */
			this.sync();
			this.pbi = wot_prefs.pref.QueryInterface(
							Components.interfaces.nsIPrefBranch2);
			this.pbi.addObserver(VIPRE_PREF + VIPRE_SEARCH, this, false);
		} catch (e) {
			dump("wot_search.load: failed with " + e + "\n");
		}
	},

	unload: function()
	{
		try {
			if (this.pbi) {
				this.pbi.removeObserver(VIPRE_PREF + VIPRE_SEARCH, this);
				this.pbi = null;
			}
		} catch (e) {
			dump("wot_search.unload: failed with " + e + "\n");
		}
	},

	/* Parsing */

	setint: function(entry, value)
	{
		try {
			if (value != null) {
				return wot_prefs.setInt(entry, Number(value));
			} else {
				wot_prefs.clear(entry);
			}
		} catch (e) {
			dump("wot_search.setint: failed with " + e + "\n");
		}

		return false;
	},

	setchar: function(entry, value)
	{
		try {
			if (value != null) {
				return wot_prefs.setChar(entry, value);
			} else {
				wot_prefs.clear(entry);
			}
		} catch (e) {
			dump("wot_search.setchar: failed with " + e + "\n");
		}

		return false;
	},

	parsecontentrules: function(base, child)
	{
		try {
			var attr = 0, value = 0;
			var node = child.firstChild;

			while (node) {
				if (node.nodeName == VIPRE_SEARCH_CONTENT_ATTR) {
					/* Attribute rule */
					var key = base + VIPRE_SEARCH_CONTENT_ATTR + attr + ".";

					/* Flags (optional) */
					this.setchar(key + VIPRE_SEARCH_CONTENT_FLAGS,
						node.getAttribute(VIPRE_SEARCH_CONTENT_FLAGS));

					/* Attribute name and regexp */
					if (this.setchar(key + VIPRE_SEARCH_CONTENT_NAME,
							node.getAttribute(VIPRE_SEARCH_CONTENT_NAME)) &&
						this.setchar(key + VIPRE_SEARCH_CONTENT_RE,
							node.getAttribute(VIPRE_SEARCH_CONTENT_RE))) {
						++attr;
					} else {
						wot_prefs.deleteBranch(key);
					}
				} else if (node.nodeName == VIPRE_SEARCH_CONTENT_VALUE) {
					/* Value rule */
					var key = base + VIPRE_SEARCH_CONTENT_VALUE + value + ".";
					
					/* Flags (optional) */
					this.setchar(key + VIPRE_SEARCH_CONTENT_FLAGS,
						node.getAttribute(VIPRE_SEARCH_CONTENT_FLAGS));

					/* Regexp */
					if (this.setchar(key + VIPRE_SEARCH_CONTENT_RE,
							node.getAttribute(VIPRE_SEARCH_CONTENT_RE))) {
						++value;
					} else {
						wot_prefs.deleteBranch(key);
					}
				}

				node = node.nextSibling;
			}
		} catch (e) {
			dump("wot_search.parsecontentrules: failed with " + e + "\n");
		}
	},

	parsematchrule: function(base, child, match)
	{
		try {
			var entry = base + child.nodeName + match + ".";

			/* Condition */
			var cond = child.getAttribute(VIPRE_SEARCH_MATCH_COND);
			this.setchar(entry + VIPRE_SEARCH_MATCH_COND, cond);

			if (cond) {
				var index = 0;
				var node = child.firstChild;

				/* Subrules */
				while (node) {
					if (node.nodeName == VIPRE_SEARCH_MATCH) {
						this.parsematchrule(entry, node, index++);
					}

					node = node.nextSibling;
				}

				return;
			}

			/* Document (optional) */
			this.setchar(entry + VIPRE_SEARCH_MATCH_DOC,
				child.getAttribute(VIPRE_SEARCH_MATCH_DOC));

			/* Element */
			if (!this.setchar(entry + VIPRE_SEARCH_MATCH_ELEM,
					child.getAttribute(VIPRE_SEARCH_MATCH_ELEM))) {
				return;
			}

			/* Content rules */
			this.parsecontentrules(entry, child);
		} catch (e) {
			dump("wot_search.parsematchrule: failed with " + e + "\n");
		}
	},

	parseprerule: function(base, child, pre)
	{
		try {
			var entry = base + VIPRE_SEARCH_PRE + pre + ".";

			if (this.setchar(entry + VIPRE_SEARCH_PRE_RE,
					child.getAttribute(VIPRE_SEARCH_PRE_RE)) &&
				this.setint(entry + VIPRE_SEARCH_PRE_MATCH,
					child.getAttribute(VIPRE_SEARCH_PRE_MATCH))) {
				return true;
			} else {
				wot_prefs.deleteBranch(entry);
			}
		} catch (e) {
			dump("wot_search.parseprerule: failed with " + e + "\n");
		}

		return false;
	},

	parserule: function(node)
	{
		try {
			var name = node.getAttribute(VIPRE_SERVICE_XML_UPDATE_SEARCH_NAME);

			if (!name) {
				return;
			}

			var base = VIPRE_SEARCH + "." + name + ".";
			var enabled = wot_prefs.getBool(base + VIPRE_SEARCH_ENABLED, true);

			wot_prefs.deleteBranch(base);

			/* Don't forget the enabled status */
			if (!enabled) {
				wot_prefs.setBool(base + VIPRE_SEARCH_ENABLED, enabled);
			}

			var url = node.getAttribute(VIPRE_SEARCH_URL);
			var display = node.getAttribute(VIPRE_SEARCH_DISPLAY);

			if (!url || !display) {
				return;
			}

			var remove = node.getAttribute(VIPRE_SEARCH_REMOVE);

			if (remove && remove.toLowerCase() == "true") {
				return;
			}

			for (var j = 0; j < this.attrstr.length; ++j) {
				this.setchar(base + this.attrstr[j],
					node.getAttribute(this.attrstr[j]));
			}

			for (var j = 0; j < this.attrint.length; ++j) {
				this.setint(base + this.attrint[j],
					node.getAttribute(this.attrint[j]));
			}

			var index = [];
			var child = node.firstChild;

			while (child) {
				var elem = child.nodeName;

				if (elem) {
					index[elem] = index[elem] || 0;

					if (elem == VIPRE_SEARCH_PRE) {
						this.parseprerule(base, child, index[elem]++);
					} else if (elem == VIPRE_SEARCH_MATCH ||
							   elem == VIPRE_SEARCH_POPUP) {
						this.parsematchrule(base, child, index[elem]++);
					} else if (elem == VIPRE_SEARCH_TARGET) {
						this.parsecontentrules(base + VIPRE_SEARCH_TARGET + ".",
							child);
					}
				}

				child = child.nextSibling;
			}
		} catch (e) {
			dump("wot_search.parserule: failed with " + e + "\n");
		}
	},

	parse: function(search)
	{
		try {
			this.loading = true;

			for (var i = 0; i < search.length; ++i) {
				this.parserule(search[i]);
			}

			this.sync();
		} catch (e) {
			dump("wot_search.parse: failed with " + e + "\n");
		}

		this.loading = false;
	},

	/* Loading */

	observe: function(subject, topic, state)
	{
		try {
			if (!this.loading && topic == "nsPref:changed") {
				this.sync();
			}
		} catch (e) {
			dump("wot_search.observe: failed with " + e + "\n");
		}
	},

	loadruletree: function(node, pref, next)
	{
		try {
			/* 1 = array, 2 = index, 4 = next */
			var m = next.match(RegExp("^([^\d\.]+)(\\d+)(\.(.+))?"));

			if (m && m[1] && m[2] != null && m[4]) {
				var name = m[1], index = Number(m[2]);

				node[name] = node[name] || [];
				node[name][index] =
					this.loadruletree(node[name][index] || {}, pref, m[4]);
			} else {
				node[next] = wot_prefs.getChar(pref, "");
			}

			return node;
		} catch (e) {
			dump("wot_search.loadmatch: failed with " + e + "\n");
		}

		return null;
	},

	loadmatchrule: function(name, attr, pref, index, next)
	{
		try {
			this.rules[name][attr] = this.rules[name][attr] || {
				match: [],
				condition: "and"
			};

			this.rules[name][attr].match[index] = 
				this.loadruletree(this.rules[name][attr].match[index] || {},
					pref, next);
		} catch (e) {
			dump("wot_search.loadmatchrule: failed with " + e + "\n");
		}
	},

	loadprerule: function(name, pref, index, attr)
	{
		try {
			this.rules[name].pre = this.rules[name].pre || [];
			this.rules[name].pre[index] = this.rules[name].pre[index] || {};

			if (attr == VIPRE_SEARCH_PRE_MATCH) {
				this.rules[name].pre[index][attr] = wot_prefs.getInt(pref, 0);
			} else if (attr == VIPRE_SEARCH_PRE_RE) {
				this.rules[name].pre[index][attr] = wot_prefs.getChar(pref, "");
			}
		} catch (e) {
			dump("wot_search.loadprerule: failed with " + e + "\n");
		}
	},

	loadrule: function(rule)
	{
		try {
			/* 1 = name, 4 = attribute, 5 = attribute index, 7 = next */
			var m = rule.match(/^([^\.]+)(\.(([^\.\d]+)(\d+)?)(\.(.+))?)?/);

			if (!m) {
				return;
			}

			var name = m[1], attr = m[4], index = Number(m[5]), next = m[7];

			if (!name || !attr) {
				return;
			}

			if (!this.rules[name]) {
				this.rules[name] = {
					rule:    name,
					enabled: true
				};
			}

			var pref = VIPRE_SEARCH + "." + rule;

			if (m[5] != null && next) {
				if (attr == VIPRE_SEARCH_PRE) {
					this.loadprerule(name, pref, index, next);
				} else if (attr == VIPRE_SEARCH_MATCH ||
						attr == VIPRE_SEARCH_POPUP) {
					this.loadmatchrule(name, attr, pref, index, next);
				}
			} else if (attr == VIPRE_SEARCH_TARGET) {
				this.rules[name].target =
					this.loadruletree(this.rules[name].target || {},
						pref, next);
			} else if (this.attrint.indexOf(attr) >= 0) {
				this.rules[name][attr] = wot_prefs.getInt(pref, 0);
			} else if (this.attrstr.indexOf(attr) >= 0) {
				this.rules[name][attr] = wot_prefs.getChar(pref, "");
			} else {
				this.rules[name][attr] = wot_prefs.getBool(pref, true);
			}
		} catch (e) {
			dump("wot_search.loadrule: failed with " + e + "\n");
		}
	},

	sync: function()
	{
		try {
			this.rules = {};

			var branch = wot_prefs.ps.getBranch(VIPRE_PREF + VIPRE_SEARCH + ".");
			var children = branch.getChildList("", {});

			for (var i = 0; i < children.length; ++i) {
				this.loadrule(children[i]);
			}
		} catch (e) {
			dump("wot_search.sync: failed with " + e + "\n");
		}
	},

	/* Processing */

	domcontentloaded: function(event)
	{

        try {   // Workaround to resolve "TypeError: can't access dead object" at start of the browser
            if (!event.originalTarget) return;
        } catch (e) { return; } // do nothing

		try {
			wot_search.watch(event.originalTarget);
		} catch (e) {
			dump("wot_search.domcontentloaded: failed with " + e + "\n");
		}
	},

	watch: function(content)
	{
		try {
			var rule = wot_search.process(content);

			if (rule) {
				if (!rule.dynamic && !content.defaultView.frameElement) {
					return;
				}
			} else if (!wot_prefs.prefetch) {
				return;
			}

            if (content && content.firstChild) {
                var mo = new MutationObserver(function(mutations, observer) {
                    observer.disconnect();
                    delete(observer);

                    window.setTimeout(function() {
                        wot_search.watch(content);
                    }, 500);
                });

                mo.observe(content, {
                    attributes: true, childList: true, subtree: true
                });
            }

		} catch (e) {
			dump("wot_search.watch: failed with " + e + "\n");
		}
	},

	processrule: function(link, rule)
	{
		try {
			var url = link.href;
			var target = null;

			/* Preprocess the link */
			if (rule.pre) {
				for (var i = 0; i < rule.pre.length; ++i) {
					if (!rule.pre[i].re) {
						continue;
					}

					var m = RegExp(rule.pre[i].re).exec(url);

					if (m && m[rule.pre[i].match]) {
						url = decodeURIComponent(m[rule.pre[i].match]);
						target = wot_idn.utftoidn(wot_url.gethostname(url));
						break;
					}
				}
			}

			/* See if ignored */
			if (rule.ign && RegExp(rule.ign).test(url)) {
				return null;
			}

			/* Find target hostname */
			if (!target) {
				target = wot_idn.utftoidn(wot_url.gethostname(url));
			}

			/* Match by element if we have a target rule */
			if (target && rule.target &&
					!this.matchelement(rule.target, link)) {
				return null;
			}

			return target;
		} catch (e) {
			dump("wot_search.processrule: failed with " + e + "\n");
		}

		return null;
	},

	addrating: function(target, content, link, rule)
	{
		try {
			var elem = content.createElement("div");

			if (elem) {
				elem.setAttribute(wot_search.attribute, target);
				elem.setAttribute("style", "cursor: pointer; " +
					"width: 16px; " +
					"height: 16px;" +
					"display: inline-block;");

				elem.innerHTML = "&nbsp;";
				elem.addEventListener("click", this.onclick, false);

				if (link.nextSibling) {
					link.parentNode.insertBefore(elem, link.nextSibling);
				} else {
					link.parentNode.appendChild(elem);
				}
			}
		} catch (e) {
			dump("wot_search.addrating: failed with " + e + "\n");
		}
	},

	matchregexp: function(spec, data)
	{
		try {
			/* Custom flags:
				- n = negative match
				*/
			var flags = spec.flags || "";
			var rv = RegExp(spec.re, flags.replace("n", "")).test(data);

			return (flags.indexOf("n") < 0) ? rv : !rv;
		} catch (e) {
			dump("wot_search.matchregexp: failed with " + e + "\n");
		}

		return false;
	},

	matchelement: function(match, elem)
	{
		try {
			/* Match by attributes */
			if (match.attribute && match.attribute.length) {
				for (var i = 0; i < match.attribute.length; ++i) {
					if (!match.attribute[i].name || !match.attribute[i].re) {
						continue;
					}

					if (!elem.hasAttribute(match.attribute[i].name) ||
							!this.matchregexp(match.attribute[i],
								elem.getAttribute(match.attribute[i].name))) {
						return false;
					}
				}
			}

			/* Match by content */
			if (match.value && match.value.length) {
				if (!elem.innerHTML) {
					return false;
				}

				for (var i = 0; i < match.value.length; ++i) {
					if (!match.value[i].re) {
						continue;
					}

					if (!this.matchregexp(match.value[i], elem.innerHTML)) {
						return false;
					}
				}
			}

			return true;
		} catch (e) {
			dump("wot_search.matchelement: failed with " + e + "\n");
		}

		return false;
	},

	findmatchingelement: function(match, content)
	{
		try {
			var set = [];
				
			if (match.element == "$frame") {
				set.push(content.defaultView.frameElement);
			} else {
				var docelem = content;

				if (match.document == "$parent" &&
						content.defaultView.parent) {
					docelem = content.defaultView.parent.document;
				}

				if (!docelem) {
					return null;
				}

				if (/^#/.test(match.element)) {
					set.push(docelem.getElementById(
						match.element.replace(/^#/, "")));
				} else {
					set = docelem.getElementsByTagName(match.element);
				}
			}

			if (set && set.length) {
				/* One matching element is enough */
				for (var i = 0; i < set.length; ++i) {
					if (set[i] && this.matchelement(match, set[i])) {
						return set[i];
					}
				}
			}
		} catch (e) {
			dump("wot_search.findmatchingelement: failed with " + e + "\n");
		}

		return null;
	},

	matchcontent: function(match, content)
	{
		try {
			/* Process conditional rules */
			if (match.condition && match.match) {
				for (var i = 0; i < match.match.length; ++i) {
					var rv = this.matchcontent(match.match[i], content);

					if (match.condition == "or" && rv) {
						return true;
					} else if (match.condition == "and" && !rv) {
						return false;
					}
				}

				return (match.match.length == 0 || match.condition == "and");
			}

			/* See if there's a matching element */
			if (match.element &&
					this.findmatchingelement(match, content)) {
				return true;
			}
		} catch (e) {
			dump("wot_search.matchcontent: failed with " + e + "\n");
		}

		return false;
	},

	matchrule: function(content, url)
	{
		try {
			var rule = null;

			for (var i in this.rules) {
				if (!this.rules[i].enabled || !this.rules[i].url) {
					continue;
				}

				/* Match by URL */
				if (!RegExp(this.rules[i].url).test(url) ||
						(this.rules[i].urlign &&
						 RegExp(this.rules[i].urlign).test(url))) {
					continue;
				}

				rule = this.rules[i];
				break;
			}

			return rule;
		} catch (e) {
			dump("wot_search.matchrule: failed with " + e + "\n");
		}

		return null;
	},

	process: function(content)
	{
        try {
            if(!content) {return null}
        } catch(e) {
            wdump("Dead object accessed");
        }

		try {
			if (!wot_util.isenabled() || !content || !content.links) {
				return null;
			}

			var url = null;

			if (content.location && content.location.href) {
				url = content.location.href;
			}

			if (!url) {
				return null;
			}

			/* Using about:blank in a frame isn't cool, btw */
			if (url == "about:blank" &&
					content.defaultView.frameElement &&
					content.defaultView.frameElement.baseURI) {
				url = content.defaultView.frameElement.baseURI;
			}

			/* URL match */
			var rule = this.matchrule(content, url);

			if (!rule && !wot_prefs.prefetch) {
				return null; /* If in prefetch mode, continue anyway */
			}

			var contentmatch = true;

			if (rule && rule.match) {
				/* Content match */
				contentmatch = this.matchcontent(rule.match, content);

				if (!contentmatch && !wot_prefs.prefetch) {
					/* Return the rule anyway so we can keep an eye on content
					  	changes */
					return rule;
				}
			}

			var haspopup = false;

			if (rule && contentmatch) {
				if (rule.popup && rule.popup.match &&
						rule.popup.match.length) {
					/* Add only only to the specified element */
					var elem = this.findmatchingelement(rule.popup.match[0],
									content);

					if (elem) {
						haspopup = wot_popup.addpopup(content, elem);
					}
				} else {
					/* Just add to the document */
					haspopup = wot_popup.addpopup(content);
				}
			}

			/* Walk through each link and fetch ratings */
			var cache = {};
			var fetch = {};
			var offline = wot_browser.isoffline();

			for (var i = 0; i < content.links.length; ++i) {
				var link = content.links[i];
				if (link.isContentEditable || link.getAttribute(this.processed) ||
						!link.parentNode) {
					continue; /* Process each link only once */
				}

				var target = null;
				var showrating = false;

				if (rule && contentmatch) {
					target = this.processrule(link, rule);
				}

				if (target) {
					showrating = true;
				} else if (wot_prefs.prefetch) {
					/* Prefetch ratings for all links, not only if ratings are
						shown */
					target = wot_idn.utftoidn(
								wot_url.gethostname(link.href));
				}

				if (!target) {
					continue;
				}

				if (wot_cache.iscached(target) &&
						wot_cache.get(target, "status") != VIPRE_QUERY_RETRY) {
					cache[target] = target;
				} else {
					fetch[target] = target;
				}

				if (showrating) {
					this.addrating(target, content, link, rule);
				}

				link.setAttribute(this.processed, true);
			}

			if (rule && contentmatch) {
                // Don't inject JS to VIPRE's Search Guard!
//				if (rule.script) {
//					this.addscript(content, rule.script);
//				}

				if (rule.prestyle) {
					this.addstyle(content, this.formatcss(rule.prestyle), this.prestyleid);
				}

				/* Add styles for cached ratings */
				this.update(rule, content, cache, offline);
			}

			/* Load missing ratings */
			if (!offline) {
				wot_api_link.send(rule, content, fetch);
			}

			return rule;
		} catch (e) {
			dump("wot_search.process: failed with " + e + "\n");
		}
		return null;
	},

	update: function(rule, content, cache, last)
	{
		try {
			var style = "";

			for (var target in cache) {
				if (wot_cache.iscached(target)) {
					var s = wot_cache.get(target, "status");

					if (s == VIPRE_QUERY_OK || s == VIPRE_QUERY_LINK) {
						style += this.getcss(rule, target);
					}
				}
			}

			if (style.length > 0) {
				this.addstyle(content, style);
			}
		} catch (e) {
			dump("wot_search.update: failed with " + e + "\n");
		}
	},

	sandboxapi: {
		loadscript: function(sandbox, url)
		{
//			try {
//				if (!sandbox || typeof(url) != "string" ||
//						!/^https?\:\/\//.test(url)) {
//					return;
//				}
//
//				var request = new XMLHttpRequest();
//
//				request.open("GET", url);
//				new wot_cookie_remover(request);
//
//				request.onload = function() {
//					wot_search.sandboxapi.lastloadedscript = {
//						url: url,
//						code: request.responseText,
//						status: request.status,
//						time: Date.now()
//					};
//
//					if (request.status != 200 || !request.responseText ||
//							!request.responseText.length) {
//						return;
//					}
//
//					try {
//						Components.utils.evalInSandbox(request.responseText,
//							sandbox);
//					} catch (e) {
//						dump("wot_search.sandboxapi.loadscript: evalInSandbox " +
//							"failed with " + e + "\n");
//					}
//				};
//
//				request.send(null);
//			} catch (e) {
//				dump("wot_search.sandboxapi.loadscript: failed with " + e + "\n");
//			}
		},

		getlastscript: function(sandbox)
		{
			return this.lastloadedscript;
		},

		getratings: function(sandbox, url)
		{
//			try {
//				if (typeof(url) != "string") {
//					return null;
//				}
//
//				var target = wot_idn.utftoidn(wot_url.gethostname(url));
//
//				if (wot_cache.isok(target)) {
//					var rv = {
//						target: target
//					};
//
//					for (var i = 0, a = 0; i < VIPRE_COMPONENTS.length; ++i) {
//                        a = VIPRE_COMPONENTS[i];
//						rv["reputation_" + a] =
//							wot_cache.get(target, "reputation_" + a);
//						rv["confidence_" + a] =
//							wot_cache.get(target, "confidence_" + a);
//						rv["testimony_"  + a] =
//							wot_cache.get(target, "testimony_"  + a);
//						rv["excluded_"  + a] =
//							wot_cache.get(target, "excluded_"  + a);
//					}
//
//					return rv;
//				}
//			} catch (e) {
//				dump("wot_search.sandboxapi.getratings: failed with " + e +
//					"\n");
//			}

			return null;
		},

		getpreference: function(sandbox, name)
		{
			try {
				if (typeof(name) != "string") {
					return null;
				}

				var type = wot_prefs.pref.getPrefType(VIPRE_PREF + name);

				switch (type) {
				case wot_prefs.pref.PREF_STRING:
					return wot_prefs.getChar(name);
				case wot_prefs.pref.PREF_INT:
					return wot_prefs.getInt(name);
				case wot_prefs.pref.PREF_BOOL:
					return wot_prefs.getBool(name);
				}
			} catch (e) {
				dump("wot_search.sandboxapi.getpreference: failed with " + e +
					"\n");
			}

			return null;
		},

		setpreference: function(sandbox, name, value)
		{
			try {
				if (typeof(name) != "string") {
					return false;
				}

				var rv = false;

				switch (typeof(value)) {
				case "string":
					rv = wot_prefs.setChar(name, value);
					break;
				case "number":
					rv = wot_prefs.setInt(name, value.toFixed());
					break;
				case "boolean":
					rv = wot_prefs.setBool(name, value);
					break;
				}

				if (rv) {
					wot_prefs.flush();
					return rv;
				}
			} catch (e) {
				dump("wot_search.sandboxapi.setpreference: failed with " + e +
					"\n");
			}

			return false;
		},

		getapiparams: function(sandbox)
		{
			try {
				return wot_url.getapiparams();
			} catch (e) {
				dump("wot_serach.sandboxapi.getapiparams: failed with " + e +
					"\n");
			}
		}
	},

	getsandboxfunc: function(sandbox, name, obj)
	{
		obj = obj || wot_search.sandboxapi;

		return function() {
			var args = [ sandbox ];

			for (var i = 0; i < arguments.length; ++i) {
				args.push(arguments[i]);
			}

			return obj[name].apply(obj, args);
		};
	},

	addscript: function(content, code)
	{
//		try {
//			if (!wot_prefs.search_scripts || !code.length) {
//				return;
//			}
//
//			var sandbox = content.wotsandbox;
//
//			if (!sandbox) {
//				var wnd = new XPCNativeWrapper(content.defaultView);
//				var sandbox = new Components.utils.Sandbox(wnd);
//
//				sandbox.window = wnd;
//				sandbox.document = sandbox.window.document;
//				sandbox.__proto__ = sandbox.window;
//
//				sandbox.wot_loadscript =
//					this.getsandboxfunc(sandbox, "loadscript");
//				sandbox.wot_getlastscript =
//					this.getsandboxfunc(sandbox, "getlastscript");
//				sandbox.wot_getratings =
//					this.getsandboxfunc(sandbox, "getratings");
//				sandbox.wot_getpreference =
//					this.getsandboxfunc(sandbox, "getpreference");
//				sandbox.wot_setpreference =
//					this.getsandboxfunc(sandbox, "setpreference");
//				sandbox.wot_getapiparams =
//					this.getsandboxfunc(sandbox, "getapiparams");
//
//				content.wotsandbox = sandbox;
//			}
//
//			try {
//				Components.utils.evalInSandbox(code, sandbox);
//			} catch (e) {
//				dump("wot_search.addscript: evalInSandbox failed with " +
//					e + "\n");
//			}
//		} catch (e) {
//			dump("wot_search.addscript: failed with " + e + "\n");
//		}
	},

	addstyle: function(content, css, id)
	{
		try {
			if (id && content.getElementById(id)) {
				return;
			}

			var style = content.createElement("style");

			style.setAttribute("type", "text/css");
			if (id) {
				style.setAttribute("id", id);
			}
			style.innerHTML = css;

			var head = content.getElementsByTagName("head");

			if (head && head.length > 0) {
				head[0].appendChild(style);
			}
		} catch (e) {
			dump("wot_search.addstyle: failed with " + e + "\n");
		}
	},

	formatcss: function(css)
	{
		return css.replace(/ATTR/g, this.attribute);
	},

	getreputation: function(name)
	{
		try {
			var status = wot_cache.get(name, "status");

			if (status != VIPRE_QUERY_OK && status != VIPRE_QUERY_LINK) {
				return -1;
			}

			return wot_cache.get(name, "reputation_0");
		} catch (e) {
			dump("wot_search.getreputation: failed with " + e + "\n");
		}

		return -1;
	},

	getcss: function(rule, name)
	{
		try {
			if (!rule.style) {
				return "";
			}

			var r = this.getreputation(name);

			if ((wot_prefs.use_search_level && r >= wot_prefs.search_level) ||
					(rule.searchlevel != null && r >= rule.searchlevel)) {
				return "";
			}

			var css = this.formatcss(rule.style);
			css = css.replace(/NAME/g, name);

			return css.replace(/IMAGE/g, wot_ui.geticonurl(r, 16, true));
		} catch (e) {
			dump("wot_search.getcss: failed with " + e + "\n");
		}

		return "";
	},

	onclick: function(event)
	{
		try {
			var target = event.originalTarget.getAttribute(wot_search.attribute),
                r0 = wot_search.getreputation(target),
                verdict = wot_util.get_level(VIPRE_REPUTATIONLEVELS, r0).name;
			if (target && verdict) {
				wot_browser.open_link(verdict, target);
				event.stopPropagation();
			}
		} catch (e) {
			dump("wot_search.onclick: failed with " + e + "\n");
		}
	}
};

wot_modules.push({ name: "wot_search", obj: wot_search });
