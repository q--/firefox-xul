/*
	popup.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

const VIPRE_POPUP_HTML =
    '<div id="vipre-logo">{POPUPHEADERTEXT}</div>' +
        '<div id="vipre-ratings{ID}" class="vipre-ratings">' +
        '<div id="vipre-hostname"></div>' +
        '</div>' +
        '</div>';

const VIPRE_POPUP_STYLE = "@import \"chrome://vipre/skin/include/popup.css\";";

var vipre_popup =
{
	offsety:		-15,
	offsetx:		4,
	height:			220,
	width:			300,
	barsize:		20,
	offsetheight:	0,
	postfix:		"-" + Date.now(),
	id:				"vipre-popup-layer",
	onpopup:		false,
    layer:          null,
    MAX_CATEGORIES: 3,

	load_delayed: function()
	{
		try {
			if (this.browser) {
				return;
			}

			this.appearance = 0;
			this.browser = document.getElementById("appcontent");
			this.id += this.postfix;

			if (this.browser) {
				this.browser.addEventListener("mouseover",
					vipre_popup.onmouseover, false);
			}
		} catch (e) {
			dump("vipre_popup.load: failed with " + e + "\n");
		}
	},

	unload: function()
	{
		try {
			if (this.browser) {
				this.browser.removeEventListener("mouseover",
						vipre_popup.onmouseover, false);
				this.browser = null;
			}
		} catch (e) {
			dump("vipre_popup.unload: failed with " + e + "\n");
		}
	},

	addpopup: function(content, elem)
	{
		try {
			if (!vipre_prefs.show_search_popup) {
                return false;
            }

            var replaces = [
                { from: "ID", to: this.postfix },
                { from: "POPUPHEADERTEXT", to: vipre_util.getstring("popup_headertext") }
            ];

			if (!this.layer) {
				this.layer = vipre_util.processhtml(VIPRE_POPUP_HTML, replaces);
			}

			if (content.getElementById(this.id)) {
				return true;
			}

            if (!elem) {
                var body = content.getElementsByTagName("body");

                if (body && body.length) {
                    elem = body[0];
                }

                if (!elem) return false;
            }

            if (elem.isContentEditable) return false;

            var layer = content.createElement("div");
			layer.setAttribute("id", this.id);
			layer.setAttribute("class", "vipre-popup-layer");
			layer.setAttribute("style", "visibility: hidden;");
			layer.innerHTML = this.layer;

			var style = content.createElement("style");
			style.setAttribute("type", "text/css");
			style.innerHTML = VIPRE_POPUP_STYLE;


			var head = content.getElementsByTagName("head");

			if (!elem || !head || !head.length) {
				return false;
			}

			layer.addEventListener("click", function() {
					vipre_browser.openscorecard(layer.getAttribute("target"), null, "");
				}, false);

			elem.appendChild(layer);
			head[0].appendChild(style);

			return true;
		} catch (e) {
			dump("vipre_popup.addpopup: failed with " + e + "\n");
		}
		return false;
	},

	loadlayer: function(content, layer, target)
	{
		try {
			var status = vipre_cache.get(target, "status");

			if (status != VIPRE_QUERY_OK && status != VIPRE_QUERY_LINK) {
				return false;
			}

            // set target name
            var normalized_target = vipre_cache.get(target, "normalized") || null;

            var hostname_elem = content.getElementById("vipre-hostname");
            if (hostname_elem) {
                var display_target = normalized_target && normalized_target.length ? normalized_target : target;
                hostname_elem.textContent = vipre_util.htmlescape(vipre_shared.decodehostname(display_target));
            }

			return true;

		} catch (e) {
			wdump("vipre_popup.loadlayer: failed with " + e);
		}
		return false;
	},

	hidelayer: function(content, appearance)
	{
		try {
			var layer = content.getElementById(this.id);

			if (layer && layer.style.visibility != "hidden" &&
					(appearance == null || appearance == this.appearance) &&
					!this.onpopup) {
				layer.style.visibility = "hidden";
			}
		} catch (e) {
			/* dump("vipre_popup.hidelayer: failed with " + e + "\n"); */
		}
	},

	findelem: function(event)
	{
		try {
			var elem = event.originalTarget;
			var attr = null;
			var onpopup = false;

			while (elem) {
				if (elem.attributes) {
					attr = elem.attributes.getNamedItem(vipre_search.attribute);
					if (attr && attr.value) {
						break;
					}
					attr = null;
					if (elem.id == this.id) {
						onpopup = true;
					}
				}
				elem = elem.parentNode;
			}

			this.onpopup = onpopup;

			if (!elem || !attr) {
				return null;
			}

			return elem;
		} catch (e) {
			dump("vipre_popup.findelem: failed with " + e + "\n");
		}
		return null;
	},

	onmouseover: function(event)
	{
		try {

            var event_view = event.view; // workaround for FF Nightly 22.0a1 (when this object is accessed second time, it is null)

			if (!vipre_util.isenabled() || !vipre_prefs.show_search_popup || !event_view) {
				return;
			}

			var content = event_view.document;

			if (!content) return;

			var layer = content.getElementById(vipre_popup.id);

			if (!layer) return;

			vipre_popup.target = vipre_popup.findelem(event);

			if (!vipre_popup.target) {
				var appearance = vipre_popup.appearance;

				window.setTimeout(function() {
						vipre_popup.hidelayer(content, appearance);
					}, vipre_prefs.popup_hide_delay);

				return;
			}

			var attr = vipre_popup.target.attributes.getNamedItem(vipre_search.attribute),
			    target = attr.value;

			if (layer.style.visibility == "visible" &&
					layer.getAttribute("target") == target) {
				return;
			}

			layer.setAttribute("target", target);

			if (!vipre_popup.loadlayer(content, layer, target)) {
				vipre_popup.hidelayer(content);
				return;
			}

            var style = event_view.getComputedStyle(layer),
                popupheight = Math.max(isNaN(style.height) ? 0 : style.height , vipre_popup.height),
                popupwidth = style.width || vipre_popup.width;
			
			var height = parseInt(event_view.innerHeight - vipre_popup.barsize);
			var width  = 0 + event_view.innerWidth  - vipre_popup.barsize;

			if (height < popupheight ||	width < popupwidth) {
				vipre_popup.hidelayer(content);
				return;
			}

			var vscroll = isNaN(event_view.pageYOffset) ? 0 : parseInt(event_view.pageYOffset);
			var hscroll = isNaN(event_view.pageXOffset) ? 0 : parseInt(event_view.pageXOffset);

			// more accurate way to calc position
			// got from http://javascript.ru/ui/offset
			var elem = vipre_popup.target;
			var box = elem.getBoundingClientRect();

			var docElem = content.documentElement;
			var body = content.body;

            var y_offset = 0;   // vertical offset for the pointer (which is not implemented yet)

            var scrollTop = event_view.pageYOffset || docElem.scrollTop || body.scrollTop;
			var scrollLeft = event_view.pageXOffset || docElem.scrollLeft || body.scrollLeft;
			var clientTop = docElem.clientTop || body.clientTop || 0;
			var clientLeft = docElem.clientLeft || body.clientLeft || 0;
			var y  = box.top +  scrollTop - clientTop;
			var x = box.left + scrollLeft - clientLeft;

			var posy = vipre_popup.offsety + y;// + vipre_popup.target.offsetHeight;
			var posx = vipre_popup.offsetx + x + vipre_popup.target.offsetWidth;

            if (posy < vscroll) {
                // if placeholder's top doesn't fit into view, align it to the view
                posy = vscroll;
            }

			if (posy + popupheight > height + vscroll) {
                if (posy < height + vscroll) {
                    y_offset = height + vscroll - y;
                }
                posy = (y - popupheight + height + vscroll + vipre_popup.offsety)/2;
			}

			if (posx - hscroll < 0) {
				posx = hscroll;
			} else if ((posx + vipre_popup.width) > (width + hscroll)) {
				posx = width - vipre_popup.width + hscroll;
			}
			
			var appearance = ++vipre_popup.appearance;

			if (layer.style.visibility != "hidden") {
				layer.style.top  = posy + "px";
				layer.style.left = posx + "px";
			} else {
				window.setTimeout(function() {
						if (vipre_popup.target &&
								appearance == vipre_popup.appearance) {
							layer.style.top  = posy + "px";
							layer.style.left = posx + "px";
							layer.style.visibility = "visible";
						}
					}, vipre_prefs.popup_show_delay);
			}
		} catch (e) {
			wdump("vipre_popup.onmouseover: failed with " + e);
		}
	}
};

vipre_modules.push({ name: "vipre_popup", obj: vipre_popup });
