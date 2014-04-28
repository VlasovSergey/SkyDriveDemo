/**
 * Created by sergey.vlasov on 4/9/14.
 */
var ctrl = ngOneDriveCtrl();
ctrl.initialize();
document.addEventListener('deviceready', function() {
    $('body').addClass(device.platform);
    ProgressIndicator.hide();
    //ctrl.run();
});