//progressIndicator plugin

    function ProgressIndicator() {
        this.isShow ;

        function setIsShow(isSove) {
            this.isShow = isSove;
        }

        this.show = function (tapDisable, message, color, success, error) {
            var _success = function () {
                setIsShow(true);
                if (success) {
                    success();
                }
            };

            cordova.exec(_success, error, "ProgressIndicator", "show", [!!tapDisable, message ? message : "Waiting", color]);

        };

        this.hide = function (success, error) {
            var _success = function () {
                setIsShow(false);
                if (success) {
                    success();
                }
            };
            cordova.exec(_success, error, "ProgressIndicator", "hide", []);
        };
    }

module.exports = new ProgressIndicator();