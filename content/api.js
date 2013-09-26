/*
	api.js
	Copyright © 2005 - 2013  WOT Services Oy <info@mywot.com>

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

var wot_api_link =
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

        wdump(wot_core.wot_service_url() + target);

        request.open("GET", wot_core.wot_service_url() + target);

        new wot_cookie_remover(request);

        request.onload = function(event)
        {
            try {
                if (this.status == 200) {
                    wdump(target);
                    wdump(this.responseText);

                    var status = wot_api_link.get_status(this.responseText);
                    wot_cache.add_target(target, status);
                    wot_cache.set(target, "inprogress", false);

                    if (typeof(callback) == "function") {
                        callback(target, status);
                    }
                }
            } catch (e) {
                dump("wot_api_link.onload: failed with " + e + "\n");
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
                        wdump("api_link: " + target);
                        if (rule) {
                            var obj = {};
                            obj[target] = true;
                            wot_search.update(rule, content, obj, true);
                        }
                    });

                request.send(null);
            }
		} catch (e) {
			dump("wot_api_link.call: failed with " + e + "\n");
		}
	},

	send: function(rule, content, cache, retrycount)
	{
		try {
			if (!wot_util.isenabled()) {
				return;
			}

			var fetch = [];

			for (var i in cache) {
				if (cache[i] != i ||
						(wot_cache.iscached(i) && (wot_cache.get(i, "pending") ||
						 wot_cache.get(i, "inprogress")))) {
					continue;
				}

				fetch.push(i);
			}

			while (fetch.length > 0) {
				this.call(rule, content, fetch.splice(0, WOT_MAX_LINK_PARAMS),
					retrycount);
			}
		} catch (e) {
			dump("wot_api_link.send: failed with " + e + "\n");
		}
	}
};

var wot_api_query =
{
	/* Variables */
    message: "",
	message_id: "",
	message_type: "",
	message_url: "",
	users: [],

    /* Constants */
    XML_QUERY_STATUS_LEVEL: "level",
    XML_QUERY_USER_LABEL: "label",

	/* Methods */
    send: function(hostname, callback)
	{
		try {
			if (!wot_util.isenabled()) {
				return false;
			}

			if (wot_cache.iscached(hostname) &&
					(wot_cache.get(hostname, "pending") ||
						wot_cache.get(hostname, "inprogress"))) {
				return false;
			}

			wot_cache.create(hostname);
			wot_cache.set(hostname, "time", Date.now());
			wot_cache.set(hostname, "inprogress", true);
			wot_cache.set(hostname, "status", WOT_QUERY_ERROR);

			var request = wot_api_link._get_request(hostname, function (target, status) {
                wdump("api_query: " + target);
                if (typeof(callback) == "function") {
                    callback();
                }
                wot_core.update();
            });

			/* If we don't receive data reasonably soon, retry */
			var timeout =
				window.setTimeout(function() {
						wot_api_query.timeout(request, hostname, callback);
					},	WOT_TIMEOUT_QUERY);

			request.send();
			return true;
		} catch (e) {
			dump("wot_api_query.send: failed with " + e + "\n");
		}
		return false;
	},

	timeout: function(request, hostname, callback) /* XMLHttpRequest */
	{
		try {
			if (!wot_cache.get(hostname, "inprogress")) {
				return;
			}

			dump("wot_api_query.timeout: for " + hostname + "\n");

			request.abort();
			wot_cache.set(hostname, "time", Date.now());
			wot_cache.set(hostname, "inprogress", false);
			wot_core.update();
			
			if (typeof(callback) == "function") {
				callback();
			}
		} catch (e) {
			dump("wot_api_query.timeout: failed with " + e + "\n");
		}
	}
};


var wot_api_update =
{
	send: function(force)
	{
		try {
			var interval = wot_prefs.update_interval;

			if (interval < WOT_MIN_INTERVAL_UPDATE_CHECK) {
				interval = WOT_MIN_INTERVAL_UPDATE_CHECK;
			} else if (interval > WOT_MAX_INTERVAL_UPDATE_CHECK) {
				interval = WOT_MAX_INTERVAL_UPDATE_CHECK;
			}

			var last = Date.now() - interval;

			if (!force && VIPRE_VERSION == wot_prefs.last_version &&
					last < Number(wot_prefs.update_checked)) {
				return;
			}

			/* Increase the last check time a notch */
			var next = last + WOT_INTERVAL_UPDATE_ERROR;

			if (!wot_prefs.setChar("last_version", VIPRE_VERSION) ||
					!wot_prefs.setChar("update_checked", next)) {
				return;
			}

			wot_prefs.flush();
			
			/* Build a request */
			var request = new XMLHttpRequest();

			request.open("GET", REAL_WOT_API_URL +
				WOT_SERVICE_API_UPDATE +
//				"?id="		+ wot_prefs.witness_id +
				"?nonce="	+ wot_crypto.nonce() +
				"&format="	+ WOT_SERVICE_UPDATE_FORMAT +
				wot_url.getapiparams());

			new wot_cookie_remover(request);

			request.onload = this.onload;
			request.send(null);
		} catch (e) {
			dump("wot_api_update.send: failed with " + e + "\n");
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
			wot_prefs.setChar("update_checked", Date.now());

			var update = null;
			var tags = response.getElementsByTagName(VIPRE_PLATFORM);

			if (tags) {
				update = tags.item(0);
			}

			if (!update) return;

			/* Attributes */
			var interval = update.getAttribute(WOT_SERVICE_XML_UPDATE_INTERVAL);

			if (interval && Number(interval) > 0) {
				wot_prefs.setInt("update_interval", interval * 1000);
			}

			/* Search rules */
			var search = response.getElementsByTagName(WOT_SERVICE_XML_UPDATE_SEARCH);
			if (search) wot_search.parse(search);

			/* Shared domains */
			var shared = response.getElementsByTagName(WOT_SERVICE_XML_UPDATE_SHARED);
			if (shared) wot_shared.parse(shared);

			wot_prefs.flush();
		} catch (e) {
			dump("wot_api_update.onload: failed with " + e + "\n");
		}
	}
};

