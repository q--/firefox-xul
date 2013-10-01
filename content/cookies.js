/*
	cookies.js
	Copyright © 2013 WOT Services Oy <info@mywot.com>
*/

const VIPRE_COOKIE_TIMEOUT = 10000;
const VIPRE_COOKIE_TOPIC = "http-on-modify-request";

function vipre_cookie_remover(request)
{
	this.channel = request.channel;

	this.service = Components.classes["@mozilla.org/observer-service;1"].
						getService(Components.interfaces.nsIObserverService);
	this.service.addObserver(this, VIPRE_COOKIE_TOPIC, false);

	this.timeout = window.setTimeout(this.stop, VIPRE_COOKIE_TIMEOUT);
}

vipre_cookie_remover.prototype =
{
	channel: null,
	service: null,
	timeout: null,

	QueryInterface: function(iid)
	{
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsIObserver)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	},

	observe: function(subject, topic, data)
	{
		try {
			if (topic == VIPRE_COOKIE_TOPIC && subject == this.channel) {
				this.channel.QueryInterface(Components.interfaces.nsIHttpChannel);
				this.channel.setRequestHeader("Cookie", "", false);
				this.stop();
			}
		} catch (e) {
			dump("vipre_cookie_remover.observe: failed with " + e + "\n");
		}
	},

	stop: function()
	{
		try {
			if (this.timeout) {
				window.clearTimeout(this.timeout);
				this.timeout = null;
			}

			if (this.service) {
				this.service.removeObserver(this, VIPRE_COOKIE_TOPIC);
				this.service = null;
			}

			this.channel = null;
		} catch (e) {
			dump("vipre_cookie_remover.stop: failed with " + e + "\n");
		}
	}
};
