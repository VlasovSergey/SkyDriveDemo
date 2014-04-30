
package org.apache.cordova.progressIndicator;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.app.ProgressDialog;
import android.graphics.Color;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout.LayoutParams;
import android.widget.ProgressBar;

public class ProgressIndicator extends CordovaPlugin {
    ProgressDialog progressInd;
    ProgressBar progressBar;
    @Override
     public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
            try {
                if (action.equals("show")) {
                    show(args.getBoolean(0), args.getString(1), args.getString(2));
                    callbackContext.success();
                    return true;
                }
                if (action.equals("hide")) {
                    hide();
                    callbackContext.success();
                    return true;
                }
                return false; // invalid action
            } catch (Exception ex) {
                callbackContext.error(ex.getMessage());
            }
            return true;
        }

    private void show(boolean b, String message, String colorStr){
        if (progressInd != null || progressBar != null) return;
        if (b) {
            progressInd = new ProgressDialog(cordova.getActivity());
            progressInd.setMessage(message);
            progressInd.setIndeterminate(false);
            progressInd.setProgressStyle(ProgressDialog.STYLE_SPINNER);
            progressInd.show();
        } else {
        	int color = 0;
            progressBar = new ProgressBar(cordova.getActivity(), null, android.R.attr.progressBarStyleLarge);
            LayoutParams lp = new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT );
            lp.gravity = Gravity.CENTER;
            progressBar.setLayoutParams(new LayoutParams(100, 10));
        	try {
        		color = Color.parseColor(colorStr);
        		progressBar.getIndeterminateDrawable().setColorFilter(color, android.graphics.PorterDuff.Mode.MULTIPLY);
        	} catch(Exception e) {}
            cordova.getActivity().addContentView(progressBar, lp);
        }
   }

    private void hide() {
        if (progressInd != null) {
            progressInd.hide();
            progressInd = null;
        }
        if (progressBar != null) {
            ViewGroup vg = (ViewGroup) (progressBar.getParent());
            vg.removeView(progressBar);
            progressBar = null;
        }
    }
}
