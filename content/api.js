/*
	api.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

var vipre_api_link =
{
    get_status: function (response) {
        var res = response.trim();
        switch (res) {
            case "bad":
                return VIPRE_BAD_REPUTATION;   // low level = there is a threat
            default:    // don't care about other states than "bad"
                return VIPRE_REPUTATION_UKNOWN;
        }
    },

    _get_request: function (target, callback) {
        var request = new XMLHttpRequest();
        request.open("GET", vipre_core.vipre_service_url() + target);

        new vipre_cookie_remover(request);

        request.onload = function(event)
        {
            try {
                if (this.status == 200) {
                    var status = vipre_api_link.get_status(this.responseText);
                    vipre_cache.add_target(target, status);
                    vipre_cache.set(target, "inprogress", false);

                    if (typeof(callback) == "function") {
                        callback(target, status);
                    }
                }
            } catch (e) {
                dump("vipre_api_link.onload: failed with " + e + "\n");
            }
        };

        return request;
    },

	call: function (rule, content, batch, retrycount)
	{
		try {
            for (var i = 0; i < batch.length; i++) {
                var target = batch[i],
                    request = this._get_request(target, function (target, status) {
                        if (rule) {
                            var obj = {};
                            obj[target] = true;
                            vipre_search.update(rule, content, obj, true);
                        }
                    });

                request.send(null);
            }
		} catch (e) {
			dump("vipre_api_link.call: failed with " + e + "\n");
		}
	},

	send: function(rule, content, cache, retrycount)
	{
		try {
			if (!vipre_util.isenabled()) {
				return;
			}

			var fetch = [];

			for (var i in cache) {
				if (cache[i] != i ||
						(vipre_cache.iscached(i) && (vipre_cache.get(i, "pending") ||
						 vipre_cache.get(i, "inprogress")))) {
					continue;
				}

				fetch.push(i);
			}

			while (fetch.length > 0) {
				this.call(rule, content, fetch.splice(0, VIPRE_MAX_LINK_PARAMS),
					retrycount);
			}
		} catch (e) {
			dump("vipre_api_link.send: failed with " + e + "\n");
		}
	}
};

var vipre_api_query =
{
	/* Methods */
    send: function(hostname, callback)
	{
		try {
			if (!vipre_util.isenabled()) {
				return false;
			}

			if (vipre_cache.iscached(hostname) &&
					(vipre_cache.get(hostname, "pending") ||
						vipre_cache.get(hostname, "inprogress"))) {
				return false;
			}

			vipre_cache.create(hostname);
			vipre_cache.set(hostname, "time", Date.now());
			vipre_cache.set(hostname, "inprogress", true);
			vipre_cache.set(hostname, "status", VIPRE_QUERY_ERROR);

			var request = vipre_api_link._get_request(hostname, function (target, status) {
                if (typeof(callback) == "function") {
                    callback();
                }
                vipre_core.update();
            });

			/* If we don't receive data reasonably soon, retry */
			var timeout =
				window.setTimeout(function() {
						vipre_api_query.timeout(request, hostname, callback);
					},	VIPRE_TIMEOUT_QUERY);

			request.send();
			return true;
		} catch (e) {
			dump("vipre_api_query.send: failed with " + e + "\n");
		}
		return false;
	},

	timeout: function(request, hostname, callback) /* XMLHttpRequest */
	{
		try {
			if (!vipre_cache.get(hostname, "inprogress")) {
				return;
			}

			dump("vipre_api_query.timeout: for " + hostname + "\n");

			request.abort();
//			vipre_cache.set(hostname, "time", Date.now());
			vipre_cache.set(hostname, "inprogress", false);
			vipre_cache.set(hostname, "exists", true);
            vipre_cache.set(hostname, "status", VIPRE_QUERY_OK);
            vipre_cache.add_target(hostname, VIPRE_REPUTATION_UKNOWN);
			vipre_core.update();
			
			if (typeof(callback) == "function") {
				callback();
			}
		} catch (e) {
			dump("vipre_api_query.timeout: failed with " + e + "\n");
		}
	}
};


var vipre_api_update =
{
	send: function(force)
	{
		try {
			var interval = vipre_prefs.update_interval;

			if (interval < VIPRE_MIN_INTERVAL_UPDATE_CHECK) {
				interval = VIPRE_MIN_INTERVAL_UPDATE_CHECK;
			} else if (interval > VIPRE_MAX_INTERVAL_UPDATE_CHECK) {
				interval = VIPRE_MAX_INTERVAL_UPDATE_CHECK;
			}

			var last = Date.now() - interval;

			if (!force && VIPRE_VERSION == vipre_prefs.last_version &&
					last < Number(vipre_prefs.update_checked)) {
				return;
			}

			/* Increase the last check time a notch */
			var next = last + VIPRE_INTERVAL_UPDATE_ERROR;

			if (!vipre_prefs.setChar("last_version", VIPRE_VERSION) ||
					!vipre_prefs.setChar("update_checked", next)) {
				return;
			}

			vipre_prefs.flush();
			
			/* Build a request */
			var request = new XMLHttpRequest();

			request.open("GET", REAL_WOT_API_URL +
				VIPRE_SERVICE_API_UPDATE +
				"?nonce="	+ vipre_crypto.nonce() +
				"&format="	+ VIPRE_SERVICE_UPDATE_FORMAT +
				vipre_url.getapiparams());

			new vipre_cookie_remover(request);

			request.onload = this.onload;
			request.send(null);
		} catch (e) {
			dump("vipre_api_update.send: failed with " + e + "\n");
		}
	},

	onload: function(event)
	{
		try {
			if (!event) {
				return;
			}

			var request = event.target;
			if (!request || request.status != 200) return;

			var response = request.responseXML;
			if (!response) return;

			/* Update the the last check time */
			vipre_prefs.setChar("update_checked", Date.now());

			var update = null;
			var tags = response.getElementsByTagName(VIPRE_PLATFORM);

			if (tags) {
				update = tags.item(0);
			}

			if (!update) return;

			/* Attributes */
			var interval = update.getAttribute(VIPRE_SERVICE_XML_UPDATE_INTERVAL);

			if (interval && Number(interval) > 0) {
				vipre_prefs.setInt("update_interval", interval * 1000);
			}

			/* Search rules */
			var search = response.getElementsByTagName(VIPRE_SERVICE_XML_UPDATE_SEARCH);
			if (search) vipre_search.parse(search);

			/* Shared domains */
			var shared = response.getElementsByTagName(VIPRE_SERVICE_XML_UPDATE_SHARED);
			if (shared) vipre_shared.parse(shared);

			vipre_prefs.flush();
		} catch (e) {
			dump("vipre_api_update.onload: failed with " + e + "\n");
		}
	}
};

