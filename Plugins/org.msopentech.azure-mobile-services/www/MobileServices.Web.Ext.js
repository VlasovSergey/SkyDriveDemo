/*
* Licensed under the Apache License, Version 2.0 (the "License")
* http://www.apache.org/licenses/LICENSE-2.0
*
* Copyright © Microsoft Open Technologies, Inc.
* All Rights Reserved
*/

// polyfill for Mobile Services Web SDK to correctly detect cordova version

function restoreOriginalWindowOpen() {
    // if our module is called before InAppBrowser
    cordova.define.remove("org.apache.cordova.inappbrowser.inappbrowser");
    cordova.define("org.apache.cordova.inappbrowser.inappbrowser", function(require, exports, module) {
        module.exports = window.open;
    });
    // if our module is called after InAppBrowser
    var modulemapper = require('cordova/modulemapper');
    var origOpenFunc = modulemapper.getOriginalSymbol(window, 'window.open');
    if (origOpenFunc) {
        window.open = origOpenFunc;
    }
}

// special patch to correctly work on Ripple emulator
if (window.tinyHippos) { // https://gist.github.com/triceam/4658021
    restoreOriginalWindowOpen();
    return;
}

window.device = window.device || {};
window.device.cordova = window.device.cordova || window.cordova.version;