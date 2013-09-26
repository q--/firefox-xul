/*
	config.js
	Copyright © 2013  WOT Services Oy <info@mywot.com>
*/

const VIPRE_PLATFORM = "firefox";
const VIPRE_VERSION  = "20130917";

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

/* Applications */
const VIPRE_COMPONENTS = [0];

/* Search */
//const WOT_SAFESEARCH_OSD_URL = "https://search.mywot.com/osd/en-US.xml";

/* API */
const REAL_WOT_API_URL = "http://api.mywot.com"; // this is used for receiving search rules from WOT

//const VIPRE_SERVICE_NORMAL		= "http://people.mywot.com/sami/vipre/bad.txt?target=";
//const VIPRE_SERVICE_NORMAL		= "http://people.mywot.com/sami/vipre/good.txt?target=";
const VIPRE_SERVICE_NORMAL		= "http://localhost:53911/WOT/Query?target="; // local webservice by VIPRE that provides websites' statuses

const WOT_SERVICE_API_VERSION	= "/0.4/";
const WOT_SERVICE_UPDATE_FORMAT	= 4;
const WOT_SERVICE_API_UPDATE    = WOT_SERVICE_API_VERSION + "update";

/* API XML tags and attributes */
const WOT_SERVICE_XML_QUERY_MSG_ID_MAINT		= "downtime";
const WOT_SERVICE_XML_UPDATE_INTERVAL			= "interval";
const WOT_SERVICE_XML_UPDATE_SEARCH				= "search";
const WOT_SERVICE_XML_UPDATE_SEARCH_NAME		= "name";
const WOT_SERVICE_XML_UPDATE_SHARED				= "shared";
const WOT_SERVICE_XML_UPDATE_SHARED_DOMAINS		= "domains";
const WOT_SERVICE_XML_UPDATE_SHARED_LEVEL		= "level";

/* My */
const WOT_MY_URL = "http://www.mywot.com/";

/* Scorecard */
const WOT_SCORECARD_PATH = "scorecard/";
const WOT_SCORECARD_RATE = "/rate";

/* Operation intervals (in ms) */
const WOT_DELAY_WARNING					= 1000;				/* 1 s */
const WOT_INTERVAL_BLOCK_ERROR			= 3 * 1000;		/* 3 s */
const WOT_INTERVAL_CACHE_REFRESH 	  	= 30 * 60 * 1000;	/* 30 min */
const WOT_INTERVAL_CACHE_REFRESH_BLOCK 	= 18000 * 1000;		/* 5 h */
const WOT_INTERVAL_CACHE_REFRESH_ERROR	= 30 * 1000;		/* 30 s */
const WOT_INTERVAL_LINK_RETRY			= 2 * 1000;			/* 2 s */
const WOT_INTERVAL_UPDATE_CHECK		  	= 10800 * 1000;		/* 3 h */
const WOT_MIN_INTERVAL_UPDATE_CHECK		= 30 * 60 * 1000;	/* 30 min */
const WOT_MAX_INTERVAL_UPDATE_CHECK		= 3 * 86400 * 1000;	/* 3 d */
const WOT_INTERVAL_UPDATE_ERROR		  	= 15 * 60 * 1000;	/* 15 min */
const WOT_INTERVAL_UPDATE_OFFLINE 	  	= 30 * 1000;		/* 30 s */
const WOT_TIMEOUT_QUERY 				= 3 * 1000;		/* 3 s */

/* Maximum number of hostnames in a link query */
const WOT_MAX_LINK_PARAMS = 100;

/* Warnings */
const WOT_MAX_WARNINGS = 100;
const WOT_DEFAULT_WARNING_LEVEL = 1;

const WOT_BLOCK_LOADING = "chrome://vipre/locale/loading.html";
const WOT_BLOCK_BLOCKED = "chrome://vipre/locale/blocked.html";


/*
 * Preferences
 */

const WOT_PREF_PATH = "settings/";
const WOT_PREF_TRIGGER = /^(http(s)?\:\/\/(.+\.)?mywot\.com)\/([^\/]{2}(-[^\/]+)?\/)?(settings)\/.+/;


const WOT_PREF = "vipre.";

/* Values */
const WOT_WARNING_NONE			= 0;
const WOT_WARNING_NOTIFICATION	= 1;
const WOT_WARNING_DOM			= 2;
const WOT_WARNING_BLOCK			= 3;

const WOT_REASON_UNKNOWN		= 1;
const WOT_REASON_TESTIMONY		= 2;
const WOT_REASON_RATING			= 3;

const WOT_SEARCH_TYPE_OPTIMIZED	= 0;
const WOT_SEARCH_TYPE_WORST		= 1;
const WOT_SEARCH_TYPE_APP0		= 2;

/* First run */
const WOT_FIRSTRUN_WELCOME = 1;
const WOT_FIRSTRUN_CURRENT = 3;
const WOT_UPDATE_PATH = "update";


/* Preferences and defaults */
const wot_prefs_bool = [
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
	[ "use_search_level",			false ],
	[ "warning_unknown_0",			false ]
];

const wot_prefs_char = [
	[ "cookie_updated",				"0"	],
	[ "extension_id",				""	],
	[ "firstrun_guide",				"0"	],
	[ "firstrun_time",				""	],
	[ "last_message",				""	],
	[ "last_version",				""	],
	[ "norepsfor",					""	],
	[ "status_level",				""	],
	[ "update_checked",				"0"	],
	[ "warning_opacity",			"0.7" ]
];

const wot_prefs_int = [
	[ "popup_hide_delay",			1000 ],
	[ "popup_show_delay",			200 ],
	[ "activity_score",			    0 ],
	[ "search_level",				1 ],
	[ "search_type",				WOT_SEARCH_TYPE_OPTIMIZED ],
	[ "update_interval",			WOT_INTERVAL_UPDATE_CHECK ],
	[ "warning_level_0",			WOT_DEFAULT_WARNING_LEVEL ],
	[ "warning_type_0",				WOT_WARNING_BLOCK ]
];

/* Search rules */
const WOT_SEARCH				= "search";
const WOT_SEARCH_DISPLAY		= "display";
const WOT_SEARCH_DYNAMIC		= "dynamic";
const WOT_SEARCH_ENABLED		= "enabled";
const WOT_SEARCH_IGN			= "ign";
const WOT_SEARCH_PRE			= "pre";
const WOT_SEARCH_PRE_MATCH		= "match";
const WOT_SEARCH_PRE_RE			= "re";
const WOT_SEARCH_PRESTYLE		= "prestyle";
const WOT_SEARCH_REMOVE			= "remove";
const WOT_SEARCH_SCRIPT			= "script";
const WOT_SEARCH_SEARCHLEVEL	= "searchlevel";
const WOT_SEARCH_STYLE			= "style";
const WOT_SEARCH_URLIGN			= "urlign";
const WOT_SEARCH_URL			= "url";
const WOT_SEARCH_MATCH			= "match";
const WOT_SEARCH_MATCH_COND		= "condition";
const WOT_SEARCH_MATCH_DOC		= "document";
const WOT_SEARCH_MATCH_ELEM		= "element";
const WOT_SEARCH_CONTENT_ATTR	= "attribute";
const WOT_SEARCH_CONTENT_VALUE	= "value";
const WOT_SEARCH_CONTENT_NAME	= "name";
const WOT_SEARCH_CONTENT_RE		= "re";
const WOT_SEARCH_CONTENT_FLAGS	= "flags";
const WOT_SEARCH_TARGET			= "target";
const WOT_SEARCH_POPUP			= "popup";
const WOT_SEARCH_NINJA			= "ninja";

/* contexts for opening WOT links */
const WOT_URL_WARNVIEWSC =   "warn-viewsc";
const WOT_URL_WARNRATE =     "warn-rate";
const WOT_URL_POPUPVIEWSC =  "popup";
const WOT_URL_POPUPDONUTS =  "popup-donuts";
const WOT_URL_MENUMY =       "menu-my";
const WOT_URL_BTN =          "button";
const WOT_URL_CTX =          "contextmenu";

const WOT_COMMENTS = {
    error_codes: {
        "0": "SUCCESS",
        "1": "NO_ACTION_DEFINED",
        "2": "IS_BANNED",
        "3": "AUTHENTICATION_FAILED",
        "4": "NO_TARGET",
        "5": "COMMENT_NOT_FOUND",
        "6": "COMMENT_REMOVAL_FAILED",
        "7": "COMMENT_NOT_ALLOWED",
        "8": "NO_COMMENTID",
        "9": "NO_CATEGORIES_SPECIFIED",
        "10": "NO_COMMENT_SPECIFIED",
        "11": "AUTHENTICATION_INVALID_QUERY_PARAMETERS",
        "12": "AUTHENTICATION_REP_SERVER_ERROR",
        "13": "NO_QUERY_SPECIFIED",
        "14": "QUERY_STRING_MISSING",
        "15": "COMMENT_HAS_BEEN_ALTERED",
        "16": "COMMENT_TOO_SHORT",
        "17": "COMMENT_TOO_LONG",
        "18": "COMMENT_SAVE_FAILED",
        SUCCESS: 0,
        NO_ACTION_DEFINED: 1,
        IS_BANNED: 2,
        AUTHENTICATION_FAILED: 3,
        COMMENT_NOT_FOUND: 5,
        COMMENT_REMOVAL_FAILED: 6,
        COMMENT_NOT_ALLOWED: 7,
        AUTHENTICATION_REP_SERVER_ERROR: 12,
        COMMENT_SAVE_FAILED: 18
    }
};

var wot_modules = [];

// This function should be moved to other place
function wdump (str) {
    dump(str + "\n");
}