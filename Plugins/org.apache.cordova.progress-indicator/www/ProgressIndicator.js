//progressIndicator plugin

function ProgressIndicator() {
	this.isShow ;

	this.show = function (tapDisable, message, color, success, error) {
		var _success = function () {
			this.isShow = true;

			if (success) {
				success();
			}
		}.bind(this);

		cordova.exec(_success, error, "ProgressIndicator", "show", [!!tapDisable, message ? message : "Waiting", color]);
		
	};

	this.hide = function (success, error) {
		var _success = function () {
			this.isShow = false;
			if (success) {
				success();
			}
		}.bind(this);
		cordova.exec(_success, error, "ProgressIndicator", "hide", []);
	};
}

module.exports = new ProgressIndicator();