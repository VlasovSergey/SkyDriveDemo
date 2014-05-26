window.bind = function(funct, thisArg) {
    return (
        function(param){
            return funct.call(thisArg, param);
        });
};

document.addEventListener('deviceready', function() {
    $('html').addClass(device.platform);
    ProgressIndicator.hide();
});