/*
	core.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

function vipre_listener(browser)
{
	this.browser = browser;
}

vipre_listener.prototype =
{
	browser: null,

	aborted: 0x804b0002, /* NS_BINDING_ABORTED */

	loading: Components.interfaces.nsIWebProgressListener.STATE_START |
			 Components.interfaces.nsIWebProgressListener.STATE_REDIRECTING |
			 Components.interfaces.nsIWebProgressListener.STATE_TRANSFERRING |
			 Components.interfaces.nsIWebProgressListener.STATE_NEGOTIATING,

	isdocument: Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT,

	abort: function(request)
	{
		request.cancel(this.aborted);
	},

	QueryInterface: function(iid)
	{
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsISupportsWeakReference) &&
			!iid.equals(Components.interfaces.nsIWebProgressListener)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	},

	onLocationChange: function(progress, request, location)
	{
		if (progress.DOMWindow != this.browser.contentWindow) {
			return;
		}

		if (location) {
			vipre_core.block(this, request, location.spec);
		}
		vipre_core.update();
	},

	onProgressChange: function(progress, request, curSelfProgress,
		maxSelfProgress, curTotalProgress, maxTotalProgress)
	{
	},

	onStateChange: function(progress, request, flags, status)
	{
		if (progress.DOMWindow != this.browser.contentWindow) {
			return;
		}

		if (flags & this.loading && flags & this.isdocument &&
				request) {
			vipre_core.block(this, request, request.name);
		}
	},

	onStatusChange: function(progress, request, status, message)
	{
	},

	onSecurityChange: function(progress, request, state)
	{
	}
};

var vipre_core =
{
	blockedstreams: {},
	hostname: null,
	pending: {},
	purged: Date.now(),
	loaded: false,
	force_https: false,
	is_beingUninstalled: false,

	detect_environment: function()
	{
		// check if there is HTTPSEveryWhere addon also installed
		var is_https_everywhere = false;
		try {
			var https_everywhere =
				Components.classes["@eff.org/https-everywhere;1"]
					.getService(Components.interfaces.nsISupports).wrappedJSObject;
			is_https_everywhere = true;
		} catch (e) {
			is_https_everywhere = false; // there is no HTTPS EveryWhere
		}

		this.force_https = this.force_https || is_https_everywhere; // forced to use https if "HTTPS EveryWhere" addon is also installed
	},

	init: function()
	{
		try {
			this.detect_environment();
			window.addEventListener("load", function(e) {
					window.removeEventListener("load", arguments.callee, true);
					vipre_core.load();
				}, false);

			window.addEventListener("unload", function(e) {
					vipre_core.unload();
				}, false);

			this.browser = document.getElementById("appcontent");

			if (this.browser) {
				this.browser.addEventListener("DOMContentLoaded",
					vipre_core.domcontentloaded, false);
				this.browser.addEventListener("click",
					vipre_core.click, false);
			}
		} catch (e) {
			dump("vipre_core.init: failed with " + e + "\n");
		}
	},

	load: function()
	{
		try {
			for (var i in vipre_modules) {
				if (typeof(vipre_modules[i].obj.load) == "function") {
					vipre_modules[i].obj.load();
				}
			}

			window.setTimeout(function() {
				for (var i in vipre_modules) {
					if (typeof(vipre_modules[i].obj.load_delayed) == "function") {
						vipre_modules[i].obj.load_delayed();
					}
				}

				vipre_prefs.setupdateui();

				vipre_core.loaded = true;
				vipre_core.update();
			}, 250);

			try {
				Components.utils.import("resource://gre/modules/AddonManager.jsm");
				AddonManager.addAddonListener(vipre_core.install_listener);
			} catch (e) {
				dump("vipre_core.load() setting up uninstall listener failed with " + e + "\n");
			}

			var browser = getBrowser();
			this.listener = new vipre_listener(browser);
			browser.addProgressListener(this.listener);

			if (browser.tabContainer) {
				browser.tabContainer.addEventListener("TabOpen",
					vipre_core.tabopen, false);
				browser.tabContainer.addEventListener("TabSelect",
					vipre_core.tabselect, false);
			}
		} catch (e) {
			dump("vipre_core.load: failed with " + e + "\n");
		}
	},

	install_listener: {
		onUninstalling: function(addon) {
			if (addon.id == VIPRE_GUID) {
				vipre_core.is_beingUninstalled = true;
			}
		},
		onOperationCancelled: function(addon) {
			if (addon.id == VIPRE_GUID) {
				vipre_core.is_beingUninstalled = (addon.pendingOperations & AddonManager.PENDING_UNINSTALL) != 0;
			}
		}
	},

	unload: function()
	{
		try {
			var browser = getBrowser();

			if (this.listener) {
				browser.removeProgressListener(this.listener);
				this.listener = null;
			}

			if (browser.tabContainer) {
				browser.tabContainer.removeEventListener("TabOpen",
					vipre_core.tabopen, false);
				browser.tabContainer.removeEventListener("TabSelect",
					vipre_core.tabselect, false);
			}

			if (this.browser) {
				this.browser.removeEventListener("DOMContentLoaded",
						vipre_core.domcontentloaded, false);
				this.browser.removeEventListener("click",
						vipre_core.click, false);
				this.browser = null;
			}

			// do pre-cleaning on uninstall (before modules are unloaded)
			if (vipre_core.is_beingUninstalled) {
				vipre_core.clean_search_rules();
			}

			for (var i in vipre_modules) {
				if (typeof(vipre_modules[i].obj.unload) == "function") {
					vipre_modules[i].obj.unload();
				}
			}

			// do post-cleaning on uninstall
//			if (vipre_core.is_beingUninstalled) {
//			}

		} catch (e) {
			dump("vipre_core.unload: failed with " + e + "\n");
		}
	},

	domcontentloaded: function(event, retry)
	{
		if (!vipre_core.loaded && !retry) {
			window.setTimeout(function() {
					vipre_core.domcontentloaded(event, true);
				}, 500);
		}

		for (var i in vipre_modules) {
			if (typeof(vipre_modules[i].obj.domcontentloaded) == "function") {
				vipre_modules[i].obj.domcontentloaded(event);
			}
		}
	},

	click: function(event)
	{
		for (var i in vipre_modules) {
			if (typeof(vipre_modules[i].obj.click) == "function") {
				vipre_modules[i].obj.click(event);
			}
		}
	},

	tabselect: function(event)
	{
		try {
			var browser = getBrowser().selectedTab;

			if (browser && browser.listener) {
				browser.removeProgressListener(browser.listener);
				browser.listener = null;
			}
		} catch (e) {
			dump("vipre_core.tabselect: failed with " + e + "\n");
		}
	},

	tabopen: function(event)
	{
		try {
			var browser = event.target.linkedBrowser;

			if (!browser || browser.listener) {
				return;
			}

			/* Catch state changes for background tabs */
			browser.listener = new vipre_listener(browser);
			browser.addProgressListener(browser.listener);
		} catch (e) {
			dump("vipre_core.tabopen: failed with " + e + "\n");
		}
	},

	showloading: function(pl, request, url)
	{
		try {
			var stream = null;

			if (request) {
				if (request.QueryInterface) {
					try {
						var channel = request.QueryInterface(Components.interfaces.nsIHttpChannel);

						if (channel && channel.requestMethod == "POST") {
							var upload = request.QueryInterface(Components.interfaces.nsIUploadChannel);

							if (upload) {
								stream = upload.uploadStream;
							}
						}
					} catch (e) {
						// just do nothing
					}
				}
				
				pl.abort(request);
			}

			if (vipre_browser.isoffline()) {
				return;
			}

			this.blockedstreams[url] = stream;

			pl.browser.loadURIWithFlags(VIPRE_BLOCK_LOADING + "#" + encodeURIComponent(btoa(url)),
				Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY,
				null, null);

			vipre_api_query.send(url);
		} catch (e) {
			dump("vipre_core.showloading: failed with " + e + "\n");
		}
	},

	showblocked: function(pl, request, url, blocked_id)
	{
		try {
			if (request) {
				pl.abort(request);
			}

			var blocked_urlquery = [
                "target=" + encodeURIComponent(url),
                "id="+String(blocked_id)].join("&");

            blocked_urlquery = "?" + encodeURIComponent(btoa(blocked_urlquery));

            pl.browser.loadURIWithFlags(VIPRE_BLOCK_BLOCKED + blocked_urlquery,
                Components.interfaces.nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY,
                null, null);


		} catch (e) {
			dump("vipre_core.showblocked: failed with " + e + "\n");
		}
	},

	block: function(pl, request, target)
	{
		try {
			if (!vipre_util.isenabled() || !pl || !pl.browser || !target) {
				return;
			}
			
			if (!vipre_warning.isblocking()) {
				return;
			}

			var hostname = vipre_url.gethostname(target);

			if (!target || vipre_url.isprivate(hostname) || vipre_url.isprivate(target) ||
					vipre_url.isexcluded(hostname)) {
				return;
			}

			if (vipre_cache.isok(target)) {
				if (vipre_warning.isdangerous(target, false) == VIPRE_WARNING_BLOCK && !vipre_warning.warned[target]) {
                    var blocked_id = vipre_warning.register_blocked(target);
					this.showblocked(pl, request, target, blocked_id);
				}

				if (this.blockedstreams[target]) {
					delete this.blockedstreams[target];
				}
			} else {
				// allow user to go to a website if we don't know anything about it's safety
//				this.showloading(pl, request, target);
			}
		} catch (e) {
			dump("vipre_core.block: failed with " + e + "\n");
		}
	},

    bypass_blocking: function (blocked_id, target, wnd) {

        var target_url = "";
        if (blocked_id) {
            target_url = vipre_warning.remove_blocked(blocked_id);
            if (!target_url) {
                target_url = target;
            } else {
                target = target_url;   // override target by computed one from url
            }
        } else {
            if (target) {
                target_url = target;
            } else {
                target_url = VIPRE_URL_BAD;
            }
        }

        vipre_warning.warned[target] = true;  // remember the fact that we warned user and decided to proceed anyway
        var browser = getBrowser();
        browser.loadURIWithFlags(target_url,
            Components.interfaces.nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY,
            null, null);
    },

	updateloading: function()
	{
		try {
			if (!vipre_warning.isblocking()) {
				return;
			}

			var browser = getBrowser();
			var num = browser.mPanelContainer.childNodes.length;

			for (var i = 0; i < num; i++) {
				var tab = browser.getBrowserAtIndex(i);

				if (!tab || !tab.currentURI ||
						tab.currentURI.spec.indexOf(VIPRE_BLOCK_LOADING) != 0) {
					continue;
				}

				var url = this.isredirect(tab.currentURI.spec);

				if (!url || !vipre_cache.iscached(url)) {
					continue;
				}
				
				var age = Date.now() - vipre_cache.get(url, "time");

				if (vipre_cache.get(url, "status") == VIPRE_QUERY_ERROR &&
						age < VIPRE_INTERVAL_BLOCK_ERROR) {
					continue;
				}

				var postdata = null;

				if (this.blockedstreams[url]) {
					postdata = this.blockedstreams[url];
					delete this.blockedstreams[url];
				}

				/* Try again */
				tab.loadURIWithFlags(url,
					Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
					null, null, postdata);
			}
		} catch (e) {
			dump("vipre_core.updateloading: failed with " + e + "\n");
		}
	},

	is_internal: function(url)
	{
		return (url.indexOf(VIPRE_BLOCK_LOADING) >= 0 || url.indexOf(VIPRE_BLOCK_BLOCKED) >= 0);
	},

	isredirect: function(url)
	{
		// on the Blocked page we extract encoded hostname from parameter, and use it as a target
		try {
			if (!url) return null;

			if(!this.is_internal(url)) return null;

			var m = /#(.+)$/.exec(url);

			if (m && m[1]) {
				return atob(decodeURIComponent(m[1]));
			}
		} catch (e) {
			dump("vipre_core.isredirect: failed with " + e + "\n");
		}
		return null;
	},

	purgecache: function()
	{
		try {
			var interval = VIPRE_INTERVAL_CACHE_REFRESH;

			/* Purging cache entries while blocking is enabled causes the
				page to be reloaded while ratings are being loaded, so we'll
				purge the cache less often to not annoy the user... */

			if (vipre_warning.isblocking()) {
				interval = VIPRE_INTERVAL_CACHE_REFRESH_BLOCK;
			}

			var now = Date.now();

			if ((now - vipre_core.purged) < interval) {
				return;
			}

			vipre_core.purged = now;
			var cache = vipre_cache.get_enumerator();

			while (cache.hasMoreElements()) {
				var name = vipre_cache.get_name_from_element(cache.getNext());

				if (!name) {
					continue;
				}

				if (vipre_cache.get(name, "inprogress")) {
					continue;
				}
				
				var age = now - vipre_cache.get(name, "time");

				if (age > interval) {
					vipre_cache.destroy(name);
				}
			}
		} catch (e) {
			dump("vipre_core.purgecache: failed with " + e + "\n");
		}
	},

	update: function()
	{
		try {
			vipre_core.hostname = vipre_browser.geturl();

			if (!vipre_util.isenabled()) {
				vipre_status.set("disabled",
					vipre_util.getstring("messages_disabled"));
				return;
			}

			/* Update any tabs waiting for reputations */
			vipre_core.updateloading();

			/* Recover the original hostname */
			var redirected = vipre_core.isredirect(vipre_browser.geturl());
			if (redirected) {
				vipre_core.hostname = redirected;
			}

			/* Purge expired cache entries */
			vipre_core.purgecache();

			if (vipre_browser.isoffline()) {
				/* Browser offline */
				vipre_status.set("offline",
					vipre_util.getstring("message_offline"));
				/* Retry after a timeout */
				window.setTimeout(vipre_core.update, VIPRE_INTERVAL_UPDATE_OFFLINE);
				return;
			}

			vipre_api_update.send(false);

			if (!vipre_core.hostname || vipre_url.isprivate(vipre_core.hostname) ||
					vipre_url.isexcluded(vipre_core.hostname)) {
				/* Invalid or excluded hostname */
				if (vipre_cache.iscached(vipre_core.hostname)) {
					vipre_cache.destroy(vipre_core.hostname);
				}
				vipre_status.set("nohost",
					vipre_util.getstring("messages_notavailable"));
				return;
			}

			if (!vipre_cache.iscached(vipre_core.hostname)) {
				/* No previous record of the hostname, start a new query */
				vipre_status.set("inprogress",
					vipre_util.getstring("messages_loading"));
				vipre_api_query.send(vipre_core.hostname);
				return;
			}
			
			var age = Date.now() - vipre_cache.get(vipre_core.hostname, "time");

			if (vipre_cache.get(vipre_core.hostname, "inprogress")) {
				if (age > VIPRE_TIMEOUT_QUERY) {
					/* Done waiting, clear the flag  */
					vipre_cache.set(vipre_core.hostname, "inprogress", false);
				} else {
					/* Query already in progress, keep waiting */
					vipre_status.set("inprogress",
						vipre_util.getstring("messages_loading"));
					return;
				}
			}

			var status = vipre_cache.get(vipre_core.hostname, "status");

			if (status == VIPRE_QUERY_OK) {
				if (age > VIPRE_INTERVAL_CACHE_REFRESH) {
					vipre_status.set("inprogress",
						vipre_util.getstring("messages_loading"));
					vipre_api_query.send(vipre_core.hostname);
				} else {
					vipre_status.update();
				}
				return;
			} else  {
				if (status == VIPRE_QUERY_RETRY || status == VIPRE_QUERY_LINK) {
					/* Retry immediately */
					vipre_status.set("inprogress",
						vipre_util.getstring("messages_loading"));
					vipre_api_query.send(vipre_core.hostname);
					return;
				} else if (age > VIPRE_INTERVAL_CACHE_REFRESH_ERROR) {
					vipre_status.set("inprogress",
						vipre_util.getstring("messages_loading"));
					vipre_api_query.send(vipre_core.hostname);
					return;
				}
			}
		} catch (e) {
			dump("vipre_core.update: failed with " + e + "\n");
		}

		try {
			/* For some reason, we failed to get anything meaningful to display */
			vipre_status.set("error",
				vipre_util.getstring("messages_failed"));
		} catch (e) {
			dump("vipre_core.update: failed with " + e + "\n");
		}
	},

	vipre_service_url: function() {
		return VIPRE_SERVICE_NORMAL;
	},

	clean_search_rules: function () {
		// removes search rules from preferences
		vipre_prefs.deleteBranch(VIPRE_SEARCH);
		vipre_prefs.clear("update_checked");
	}

};

vipre_core.init();
