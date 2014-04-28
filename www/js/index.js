/**
 * Created by sergey.vlasov on 4/9/14.
 */
document.addEventListener('deviceready', function() {
    $('body').addClass(device.platform);
    ProgressIndicator.hide();
});