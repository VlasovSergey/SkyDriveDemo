//progressIndicator plugin

function ProgressIndicator() {
    this.isShow;

    var me = this;

    this.show = function (tapDisable, message, color, success, error) {
        var _success = function () {
            me.isShow = true;
            if (success) {
                success();
            }
        };

        cordova.exec(_success, error, "ProgressIndicator", "show", [!!tapDisable, message ? message : "Waiting", color]);

    };

    this.hide = function (success, error) {
        var _success = function () {
            me.isShow = false;
            if (success) {
                success();
            }
        };
        cordova.exec(_success, error, "ProgressIndicator", "hide", []);
    };
}

module.exports = new ProgressIndicator();