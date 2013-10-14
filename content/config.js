/*
	config.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

const VIPRE_PLATFORM = "firefox";
const VIPRE_VERSION  = "20130917";
const VIPRE_PARTNER  = "vipresg";

/*
 * Constants
 */

const VIPRE_GUID = "vipre@threattrack.com";

const VIPRE_URL_BAD = "http://go.threattracksecurity.com/?linkid=1569&URL=";
const VIPRE_URL_GOOD = "http://go.threattracksecurity.com/?linkid=1570&URL=";
const VIPRE_URL_UNAVAILABLE = "http://go.threattracksecurity.com/?linkid=1571";

/* Reputation values */
const VIPRE_BAD_REPUTATION = 0;
const VIPRE_REPUTATION_UKNOWN   = -1;

const VIPRE_REPUTATIONLEVELS = [
        { level: "0", name: "good", min: VIPRE_REPUTATION_UKNOWN },
        { level: "1", name: "bad", min:  VIPRE_BAD_REPUTATION }
    ];

/* API */
const REAL_WOT_API_URL = "http://api.mywot.com"; // this is used for receiving search rules from WOT

const VIPRE_SERVICE_NORMAL		= "http://localhost:53911/WOT/Query?target="; // local webservice by VIPRE that provides websites' statuses

const VIPRE_SERVICE_API_VERSION	= "/0.4/";
const VIPRE_SERVICE_UPDATE_FORMAT	= 4;
const VIPRE_SERVICE_API_UPDATE    = VIPRE_SERVICE_API_VERSION + "update";

/* API XML tags and attributes */
const VIPRE_SERVICE_XML_UPDATE_INTERVAL			= "interval";
const VIPRE_SERVICE_XML_UPDATE_SEARCH				= "search";
const VIPRE_SERVICE_XML_UPDATE_SEARCH_NAME		= "name";
const VIPRE_SERVICE_XML_UPDATE_SHARED				= "shared";
const VIPRE_SERVICE_XML_UPDATE_SHARED_DOMAINS		= "domains";
const VIPRE_SERVICE_XML_UPDATE_SHARED_LEVEL		= "level";

/* My */
const VIPRE_MY_URL = "http://threattrack.com/";

const VIPRE_SCORECARD_PATH = "?link=";

/* Operation intervals (in ms) */
const VIPRE_INTERVAL_BLOCK_ERROR			= 1000;		/* 1 s */
const VIPRE_INTERVAL_CACHE_REFRESH 	  	= 30 * 60 * 1000;	/* 30 min */
const VIPRE_INTERVAL_CACHE_REFRESH_BLOCK 	= 18000 * 1000;		/* 5 h */
const VIPRE_INTERVAL_CACHE_REFRESH_ERROR	= 30 * 1000;		/* 30 s */
const VIPRE_INTERVAL_UPDATE_CHECK		  	= 10800 * 1000;		/* 3 h */
const VIPRE_MIN_INTERVAL_UPDATE_CHECK		= 30 * 60 * 1000;	/* 30 min */
const VIPRE_MAX_INTERVAL_UPDATE_CHECK		= 3 * 86400 * 1000;	/* 3 d */
const VIPRE_INTERVAL_UPDATE_ERROR		  	= 15 * 60 * 1000;	/* 15 min */
const VIPRE_INTERVAL_UPDATE_OFFLINE 	  	= 30 * 1000;		/* 30 s */
const VIPRE_TIMEOUT_QUERY 				= 500;		/* 0.5 s */

/* Maximum number of hostnames in a link query */
const VIPRE_MAX_LINK_PARAMS = 100;

/* Warnings */
const VIPRE_MAX_WARNINGS = 100;
const VIPRE_DEFAULT_WARNING_LEVEL = 1;

const VIPRE_BLOCK_LOADING = "chrome://vipre/locale/loading.html";
const VIPRE_BLOCK_BLOCKED = "chrome://vipre/locale/blocked.html";


/*
 * Preferences
 */

const VIPRE_PREF_PATH = "settings/";
const VIPRE_PREF = "vipre.";

/* Values */
const VIPRE_WARNING_NONE			= 0;
const VIPRE_WARNING_DOM			= 2;
const VIPRE_WARNING_BLOCK			= 3;
const VIPRE_REASON_RATING			= 3;
const VIPRE_SEARCH_TYPE_OPTIMIZED	= 0;

/* Preferences and defaults */
const vipre_prefs_bool = [
	[ "show_welcome_page",		    false ],
	[ "accessible",					false ],
	[ "button_created",				false ],
	[ "create_button",				false ],
	[ "enabled",					true  ],
	[ "install_search",				false ],
	[ "prefetch",					true ],
	[ "private_disable",			false ],
	[ "search_ignore_0",			false ],
	[ "search_scripts",				false ],
	[ "show_application_0",			true  ],
	[ "show_search_popup",			false ],
	[ "use_search_level",			true ],
	[ "warning_unknown_0",			false ]
];

const vipre_prefs_char = [
	[ "cookie_updated",				"0"	],
	[ "extension_id",				""	],
	[ "firstrun_guide",				"0"	],
	[ "firstrun_time",				""	],
	[ "last_version",				""	],
	[ "norepsfor",					""	],
	[ "status_level",				""	],
	[ "update_checked",				"0"	],
	[ "warning_opacity",			"0.7" ]
];

const vipre_prefs_int = [
	[ "popup_hide_delay",			1000 ],
	[ "popup_show_delay",			200 ],
	[ "activity_score",			    0 ],
	[ "search_level",				1 ],
	[ "search_type",				VIPRE_SEARCH_TYPE_OPTIMIZED ],
	[ "update_interval",			VIPRE_INTERVAL_UPDATE_CHECK ],
	[ "warning_level_0",			VIPRE_DEFAULT_WARNING_LEVEL ],
	[ "warning_type_0",				VIPRE_WARNING_BLOCK ]
];

/* Search rules */
const VIPRE_SEARCH				= "search";
const VIPRE_SEARCH_DISPLAY		= "display";
const VIPRE_SEARCH_DYNAMIC		= "dynamic";
const VIPRE_SEARCH_ENABLED		= "enabled";
const VIPRE_SEARCH_VIPRE		= "vipre";  // this allows WOT to tell VIPRE not to use the search rule
const VIPRE_SEARCH_IGN			= "ign";
const VIPRE_SEARCH_PRE			= "pre";
const VIPRE_SEARCH_PRE_MATCH		= "match";
const VIPRE_SEARCH_PRE_RE			= "re";
const VIPRE_SEARCH_PRESTYLE		= "prestyle";
const VIPRE_SEARCH_REMOVE			= "remove";
const VIPRE_SEARCH_SCRIPT			= "script";
const VIPRE_SEARCH_SEARCHLEVEL	= "searchlevel";
const VIPRE_SEARCH_STYLE			= "style";
const VIPRE_SEARCH_URLIGN			= "urlign";
const VIPRE_SEARCH_URL			= "url";
const VIPRE_SEARCH_MATCH			= "match";
const VIPRE_SEARCH_MATCH_COND		= "condition";
const VIPRE_SEARCH_MATCH_DOC		= "document";
const VIPRE_SEARCH_MATCH_ELEM		= "element";
const VIPRE_SEARCH_CONTENT_ATTR	= "attribute";
const VIPRE_SEARCH_CONTENT_VALUE	= "value";
const VIPRE_SEARCH_CONTENT_NAME	= "name";
const VIPRE_SEARCH_CONTENT_RE		= "re";
const VIPRE_SEARCH_CONTENT_FLAGS	= "flags";
const VIPRE_SEARCH_TARGET			= "target";
const VIPRE_SEARCH_POPUP			= "popup";

/* contexts for opening WOT links */
const VIPRE_URL_BTN =          "button";
const VIPRE_URL_CTX =          "contextmenu";


var vipre_modules = [];

// This function should be moved to other place
function wdump (str) {
    dump(str + "\n");
}
