/**
 * Created by sergey.vlasov on 4/9/14.
 */
window.bind = function(funct, thisArg) {
    return (
        function(param){
            return funct.call(thisArg, param);
        });
}

document.addEventListener('deviceready', function() {
    $('body').addClass(device.platform);
    ProgressIndicator.hide();
});