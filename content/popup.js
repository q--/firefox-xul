/*
	popup.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

const VIPRE_POPUP_HTML =
    '<div id="wot-logo">{POPUPHEADERTEXT}</div>' +
        '<div id="wot-ratings{ID}" class="wot-ratings">' +
        '<div id="wot-hostname"></div>' +
        '<div id="wot-r0-stack{ID}" class="wot-stack wot-stack-left">' +
        '<div id="wot-r0-header{ID}" class="wot-header">{POPUPTEXT0}</div>' +
        '<div id="wot-r0-rep{ID}" class="wot-rep"></div>' +
        '<div id="wot-r0-cnf{ID}" class="wot-cnf"></div>' +
        '<div class="rating-legend-wrapper">' +
            '<div class="rating-legend">{REPTEXT0}</div>' +
        '</div>' +

        '</div>' +
        '<div id="wot-r4-stack{ID}" class="wot-stack wot-stack-right">' +
        '<div id="wot-r4-header{ID}" class="wot-header">{POPUPTEXT4}</div>' +
        '<div id="wot-r4-rep{ID}" class="wot-rep"></div>' +
        '<div id="wot-r4-cnf{ID}" class="wot-cnf"></div>' +
        '<div class="rating-legend-wrapper">' +
            '<div class="rating-legend">{REPTEXT4}</div>' +
        '</div>' +

        '</div>' +
        '</div>' +
        '<div id="wot-categories">' +
        '<div id="wot-cat-text">{POPUPNOCAT}</div>' +
        '<ul id="wot-cat-list"></ul>' +
        '</div>' +
        '<div class="wot-corners-wrapper">' +
        '<div id="wot-pp-tr" class="wot-pp-tr"></div>' +
        '<div id="wot-pp-cs" class="wot-pp-cs"></div>' +
        '</div>';

const VIPRE_POPUP_STYLE = "@import \"chrome://vipre/skin/include/popup.css\";";

var wot_popup =
{
	offsety:		-15,
	offsetx:		4,
	height:			220,
	width:			300,
//	ratingheight:	52,
//	areaheight:		214,
	barsize:		20,
	offsetheight:	0,
	postfix:		"-" + Date.now(),
	id:				"wot-popup-layer",
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
					wot_popup.onmouseover, false);
			}
		} catch (e) {
			dump("wot_popup.load: failed with " + e + "\n");
		}
	},

	unload: function()
	{
		try {
			if (this.browser) {
				this.browser.removeEventListener("mouseover",
						wot_popup.onmouseover, false);
				this.browser = null;
			}
		} catch (e) {
			dump("wot_popup.unload: failed with " + e + "\n");
		}
	},

	addpopup: function(content, elem)
	{
		try {
			if (!wot_prefs.show_search_popup) {
                return false;
            }

            var replaces = [
                { from: "ID", to: this.postfix },
                { from: "POPUPTEXT0", to: wot_util.getstring("components_0") },
                { from: "POPUPTEXT4", to: wot_util.getstring("components_4") },
                { from: "POPUPHEADERTEXT", to: wot_util.getstring("popup_headertext") },
                { from: "POPUPNOCAT", to: wot_util.getstring("popup_nocattext") }
            ];

			if (!this.layer) {
				this.layer = wot_util.processhtml(VIPRE_POPUP_HTML, replaces);
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
            var accessible_cls = wot_prefs.accessible ? " wot-popup-layer-accessible" : "";

			layer.setAttribute("id", this.id);
			layer.setAttribute("class", "wot-popup-layer" + accessible_cls);
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
					wot_browser.openscorecard(layer.getAttribute("target"), null, "");
				}, false);

			elem.appendChild(layer);
			head[0].appendChild(style);

			return true;
		} catch (e) {
			dump("wot_popup.addpopup: failed with " + e + "\n");
		}
		return false;
	},

	loadlayer: function(content, layer, target)
	{
		try {
			var status = wot_cache.get(target, "status"),
                tr_t, cs_t, r, c, x, t;

			if (status != VIPRE_QUERY_OK && status != VIPRE_QUERY_LINK) {
				return false;
			}

            // set target name
            var normalized_target = wot_cache.get(target, "normalized") || null;

            var hostname_elem = content.getElementById("wot-hostname");
            if (hostname_elem) {
                var display_target = normalized_target && normalized_target.length ? normalized_target : target;
                hostname_elem.textContent = wot_util.htmlescape(wot_shared.decodehostname(display_target));
            }

            // Update categories in the popup
            wot_popup.toggle_categories(false, content); // hide categories list

			return true;

		} catch (e) {
			wdump("wot_popup.loadlayer: failed with " + e);
		}
		return false;
	},

    toggle_categories: function (show, content) {
        var cat_list = content.getElementById("wot-cat-list"),
            cat_text = content.getElementById("wot-cat-text");
        if (cat_list && cat_text) {
            if (show) {
                cat_text.style.display = "none";
                cat_list.style.display = "block";
            }
            else {
                cat_text.style.display = "block";
                cat_list.style.display = "none";
            }
        }
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
			/* dump("wot_popup.hidelayer: failed with " + e + "\n"); */
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
					attr = elem.attributes.getNamedItem(wot_search.attribute);
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
			dump("wot_popup.findelem: failed with " + e + "\n");
		}
		return null;
	},

	onmouseover: function(event)
	{
		try {

            var event_view = event.view; // workaround for FF Nightly 22.0a1 (when this object is accessed second time, it is null)

			if (!wot_util.isenabled() || !wot_prefs.show_search_popup || !event_view) {
				return;
			}

			var content = event_view.document;

			if (!content) return;

			var layer = content.getElementById(wot_popup.id);

			if (!layer) return;

			wot_popup.target = wot_popup.findelem(event);

			if (!wot_popup.target) {
				var appearance = wot_popup.appearance;

				window.setTimeout(function() {
						wot_popup.hidelayer(content, appearance);
					}, wot_prefs.popup_hide_delay);

				return;
			}

			var attr = wot_popup.target.attributes.getNamedItem(wot_search.attribute),
			    target = attr.value;

			if (layer.style.visibility == "visible" &&
					layer.getAttribute("target") == target) {
				return;
			}

			layer.setAttribute("target", target);

			if (!wot_popup.loadlayer(content, layer, target)) {
				wot_popup.hidelayer(content);
				return;
			}

            var style = event_view.getComputedStyle(layer),
                popupheight = Math.max(isNaN(style.height) ? 0 : style.height , wot_popup.height),
                popupwidth = style.width || wot_popup.width;
			
			var height = parseInt(event_view.innerHeight - wot_popup.barsize);
			var width  = 0 + event_view.innerWidth  - wot_popup.barsize;

			if (height < popupheight ||	width < popupwidth) {
				wot_popup.hidelayer(content);
				return;
			}

			var vscroll = isNaN(event_view.pageYOffset) ? 0 : parseInt(event_view.pageYOffset);
			var hscroll = isNaN(event_view.pageXOffset) ? 0 : parseInt(event_view.pageXOffset);

			// more accurate way to calc position
			// got from http://javascript.ru/ui/offset
			var elem = wot_popup.target;
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

			var posy = wot_popup.offsety + y;// + wot_popup.target.offsetHeight;
			var posx = wot_popup.offsetx + x + wot_popup.target.offsetWidth;

            if (posy < vscroll) {
                // if placeholder's top doesn't fit into view, align it to the view
                posy = vscroll;
            }

			if (posy + popupheight > height + vscroll) {
                if (posy < height + vscroll) {
                    y_offset = height + vscroll - y;
                }
                posy = (y - popupheight + height + vscroll + wot_popup.offsety)/2;
			}

			if (posx - hscroll < 0) {
				posx = hscroll;
			} else if ((posx + wot_popup.width) > (width + hscroll)) {
				posx = width - wot_popup.width + hscroll;
			}
			
			var appearance = ++wot_popup.appearance;

			if (layer.style.visibility != "hidden") {
				layer.style.top  = posy + "px";
				layer.style.left = posx + "px";
			} else {
				window.setTimeout(function() {
						if (wot_popup.target &&
								appearance == wot_popup.appearance) {
							layer.style.top  = posy + "px";
							layer.style.left = posx + "px";
							layer.style.visibility = "visible";
						}
					}, wot_prefs.popup_show_delay);
			}
		} catch (e) {
			wdump("wot_popup.onmouseover: failed with " + e);
		}
	}
};

wot_modules.push({ name: "wot_popup", obj: wot_popup });
