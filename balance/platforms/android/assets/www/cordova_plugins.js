cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.ionic.keyboard/www/keyboard.js",
        "id": "com.ionic.keyboard.keyboard",
        "clobbers": [
            "cordova.plugins.Keyboard"
        ]
    },
    {
        "file": "plugins/com.rjfun.cordova.plugin.admob/www/AdMob.js",
        "id": "com.rjfun.cordova.plugin.admob.AdMob",
        "clobbers": [
            "window.plugins.AdMob"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.device/www/device.js",
        "id": "org.apache.cordova.device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/de.kijok.pgadbuddiz/www/pgadbuddiz.js",
        "id": "de.kijok.pgadbuddiz.PGAdBuddiz",
        "clobbers": [
            "window.pgadbuddiz"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.google.playservices": "17.0.0",
    "com.ionic.keyboard": "0.0.1",
    "com.rjfun.cordova.plugin.admob": "1.1",
    "org.apache.cordova.device": "0.2.9",
    "de.kijok.pgadbuddiz": "0.1.0"
}
// BOTTOM OF METADATA
});