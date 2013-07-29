/*
 categories.js
 Copyright © 2013  WOT Services Oy <info@mywot.com>

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

var wot_categories = {

    PREF_CATEGORY: "category",
    PREF_GROUPINGS: "groupings",
    CATEGORY_THRESHOLD: 3,  // confidence level to show a category as identified
    inited: false,
    loading: false,
    categories: {},
    grouping: [],   // Groupings for building category selector in Rating Window. Loaded from API server/update.xml.
    cgroups: {},    // Categories' groups and their mapping to colors and TR/CS.

    load_delayed: function () {
        if (this.inited) return;

        this.init_categories();
        this.pbi = wot_prefs.pref.QueryInterface(Components.interfaces.nsIPrefBranch2);
        this.pbi.addObserver(WOT_PREF + this.PREF_CATEGORY, this, false);
        this.inited = true;
    },

    unload: function () {
        try {
            if (this.pbi) {
                this.pbi.removeObserver(WOT_PREF + this.PREF_CATEGORY, this);
                this.pbi = null;
            }
        } catch (e) {
            wdump("wot_categories.unload: failed with " + e);
        }
    },

    observe: function (subject, topic, state) {
        // see load_delayed(). This function is used as a listener to
        try {
            if (!this.loading && topic == "nsPref:changed") {
                this.init_categories();
            }
        } catch (e) {
            wdump("wot_search.observe: failed with " + e);
        }
    },

    parse: function (categories_node) {
//        wdump("INFO: parse() categories");
        // process xml dom here and store to prefs
        this.loading = true;
        var i, j, gs_obj, cat_obj, res_grouping = [];

        var groupings = categories_node.getElementsByTagName("grouping");
        wot_prefs.deleteBranch(this.PREF_GROUPINGS + ".");
        if (groupings) {
            for (j = 0; j < groupings.length; j++) {
                gs_obj = wot_util.copy_attrs(groupings[j]);

                // convert some attrs to numbers
                gs_obj.tmax = gs_obj.tmax !== null ? parseInt(gs_obj.tmax) : null;
                gs_obj.tmin = gs_obj.tmin !== null ? parseInt(gs_obj.tmin) : null;

                var groups_node = groupings[j].getElementsByTagName("group");
                if (groups_node) {

                    gs_obj.groups = [];

                    for (i = 0; i < groups_node.length; i++) {
                        var grp_obj = wot_util.copy_attrs(groups_node[i]);
                        this.cgroups[grp_obj.name] = { type: grp_obj.type };
                        gs_obj.groups.push(grp_obj);
                    }
                }

                res_grouping.push(gs_obj);
            }
            wot_prefs.setChar(this.PREF_GROUPINGS + ".all", JSON.stringify(res_grouping));
        }

        // remove all categories from prefs
        wot_prefs.deleteBranch(this.PREF_CATEGORY + ".");

        // Iterate through <category> tags
        var categories = categories_node.getElementsByTagName("category");
        for (i = 0; i < categories.length; i++) {
            cat_obj = wot_util.copy_attrs(categories[i]);
            if (isNaN(cat_obj.name) || cat_obj.text == null || cat_obj.text.length == 0) {
                wdump("WARN: wot_categories.parse(): empty malformed category is found. Skipped.");
                continue;
            }

            cat_obj.id = parseInt(cat_obj.name);
            cat_obj.cs = (cat_obj.application == "4");               // set ChildSafety flag
            cat_obj.type = this.cgroups[cat_obj.group].type; // set type of the category based on parent group

//            this.categories[cat_obj.id] = cat_obj;

            wot_prefs.setChar(this.PREF_CATEGORY + "." + cat_obj.name, JSON.stringify(cat_obj));
        }

        this.init_categories();

        this.loading = false;
    },

    init_categories: function () {
//        wdump("INFO: init_categories()");
        /* Reads categories info from local preferences */

        try {
            var branch = wot_prefs.ps.getBranch(WOT_PREF + this.PREF_CATEGORY + ".");
            var children = branch.getChildList("", {});

            this.categories = {};   // clear categories in memory

            for (var i = 0; i < children.length; i++) {
                try {
                    var cat_id = children[i];
                    var cat_json = wot_prefs.getChar(this.PREF_CATEGORY + "." + cat_id, "{}");
                    var cat = JSON.parse(cat_json);
                    if (!wot_util.isEmpty(cat)) this.categories[cat_id] = cat;
                } catch (e) {
                    wdump("ERROR: exception in wot_categories.init_categories()" + e);
                    wdump("ERROR: cat id:" + cat_id);
                    wdump("ERROR: problematic string: " + cat_json);
                    continue;
                }
            }

            var groupings_json = wot_prefs.getChar(this.PREF_GROUPINGS + ".all", "{}");
            this.grouping = JSON.parse(groupings_json);

            this.inited = true;

        } catch (e) {
            wdump("wot_search.init_categories(): failed with " + e);
        }
    },

    get_category: function (cat_id) {
        var cid = String(cat_id),
            cat = {};
        if (this.categories && this.categories[cid]) {
            cat = this.categories[cid];
            cat.id = cid;
        }
        return cat;
    },

    get_category_name: function (cat_id, is_short) {
        var cat = this.get_category(cat_id);
        var text = is_short ? cat.shorttext : cat.text;
        return wot_util.htmlescape(text ? text : cat.text);  // if no short name is known, return full name
    },

    get_category_css: function (cat_id) {
        var type = wot_util.htmlescape(this.get_category(cat_id).type);
        return type !== null ? "c-" + type : "";
    },

    target_categories: function (target) {
        // return categories reported by API server (both identified and votes) taking them from cache.
        // Result is an Object.

        var count = wot_cache.get(target, "categories", 0),
            cats = {},
            attrs_list = [
                WOT_SERVICE_XML_QUERY_CATEGORY_NAME,
                WOT_SERVICE_XML_QUERY_CATEGORY_GROUP,
                WOT_SERVICE_XML_QUERY_CATEGORY_C,
                WOT_SERVICE_XML_QUERY_CATEGORY_I,
                WOT_SERVICE_XML_QUERY_CATEGORY_VOTE
            ];

        for (var i = 0, slot=""; i < count; i++) {
            var cat_obj = {}, val = null;
            for (var a = 0; a < attrs_list.length; a++) {
                slot = "category_" + i + "_" + attrs_list[a];
                val = wot_cache.get(target, slot, null);
                if (val !== null) {
                    cat_obj[attrs_list[a]] = val;
                }
            }
            if (!wot_util.isEmpty(cat_obj)) {
                cat_obj['id'] = cat_obj.name;
                cats[cat_obj.name] = cat_obj;
            }
        }

//        wdump("target_categories:: " + JSON.stringify(cats));
        return cats;
    },

    target_blacklists: function (target) {
        // return categories reported by API server (both identified and votes) taking them from cache.
        // Result is an Object.

        var count = wot_cache.get(target, "blacklists", 0),
            bls = [],
            attrs_list = [
                WOT_SERVICE_XML_QUERY_BLACKLIST_TYPE,
                WOT_SERVICE_XML_QUERY_BLACKLIST_TIME
            ];

        for (var i = 0, slot=""; i < count; i++) {
            var obj = {}, val = null;
            for (var a = 0; a < attrs_list.length; a++) {
                slot = "blacklist_" + i + "_" + attrs_list[a];
                val = wot_cache.get(target, slot, null);
                if (val !== null) {
                    obj[attrs_list[a]] = val;
                }
            }
            if (!wot_util.isEmpty(obj)) {
                bls.push(obj);
            }
        }

//        wdump("target_categories:: " + JSON.stringify(cats));
        return bls;

    },

    select_identified: function (target_cats) {
        // Returns categories identified by community (unsorted!)
        var res = {};
        for (var i in target_cats) {
            var cat = target_cats[i];
            if (cat.c >= this.CATEGORY_THRESHOLD) res[i] = cat;
        }

//        wdump("select_identified:: " + JSON.stringify(res));

        return res;
    },

    rearrange_categories: function (cats_object) {
        // sorts the categories given as object and return two arrays of category objects ordered by confidence
        var sort_array = [],
            cs_array = [];

        if (cats_object) {

            try {
                // Make the array of objects (categories)
                for (var key in cats_object) {
                    var cat = this.get_category(key);
                    cats_object[key].id = key;
                    cats_object[key].cs = cat.cs;
                    cats_object[key].group = cat.group;
                    sort_array.push(cats_object[key]);
                }

                // Sort the array
                sort_array.sort(function(a, b) {
                    if (a.c != b.c) {   // try to sort by confidence level
                        return a.c - b.c
                    } else {    // otherwise try to sort by group id
                        if (a.group != b.group) {
                            return a.group - b.group;
                        } else {
                            return a.id > b.id;
                        }
                    }
                });
                sort_array.reverse();
            } catch (e) {
                wdump("ERROR: wot_categories.rearrange_categories(): Failed to rearrange categories / 1", e);
            }

            var alltogether = sort_array.slice(0);

            try {
                // filter out Child Safety cats to other array
                for (var i=sort_array.length-1; i>=0; i--) {
                    if (sort_array[i].cs) {
                        cs_array.push(sort_array.splice(i, 1)[0]);
                    }
                }
                cs_array.reverse();
            } catch (e) {
                wdump("ERROR: wot_categories.rearrange_categories(): Failed to rearrange categories / 2", e);
            }
        }

        var res = {
            all: alltogether,
            trustworthy: sort_array,
            childsafety: cs_array
        };

//        wdump("rearrange_categories:: " + JSON.stringify(res));

        return res;
    }
};

wot_modules.push({ name: "wot_categories", obj: wot_categories });