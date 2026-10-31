package com.okankilic.myverge;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

// Receives links, text and photos sent to the app from other apps' share sheets (src/services/shareInbox.ts)
@CapacitorPlugin(name = "ShareInbox")
public class ShareInboxPlugin extends Plugin {
    // Shared images larger than this are dropped; the web side downscales the rest
    private static final int MAX_IMAGE_BYTES = 20 * 1024 * 1024;

    private final List<JSObject> pending = new ArrayList<>();

    // BridgeActivity passes the launching intent here once the bridge is up (cold start),
    // and every later one, since MainActivity is singleTask (warm start)
    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (handleShare(intent)) notifyListeners("shareReceived", new JSObject());
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        JSArray items = new JSArray();
        synchronized (pending) {
            for (JSObject item : pending) items.put(item);
            pending.clear();
        }
        JSObject result = new JSObject();
        result.put("items", items);
        call.resolve(result);
    }

    private boolean handleShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return false;
        // Reopening from Recents replays the launching intent; it was already handled
        if ((intent.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) return false;

        JSObject item = new JSObject();
        CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (text != null) item.put("text", text.toString());
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (subject != null) item.put("subject", subject);

        String type = intent.getType();
        if (type != null && type.startsWith("image/")) {
            Uri uri = streamUri(intent);
            String base64 = isForeignImage(uri) ? readBase64(uri) : null;
            if (base64 != null) {
                item.put("imageBase64", base64);
                item.put("imageMime", type);
            }
        }

        // Consume it, so a later recreation of the activity doesn't see the share again
        getActivity().setIntent(new Intent(Intent.ACTION_MAIN));

        if (item.length() == 0) return false;
        synchronized (pending) {
            pending.add(item);
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    private Uri streamUri(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
        }
        return intent.getParcelableExtra(Intent.EXTRA_STREAM);
    }

    // Only read images another app serves through its own content provider. A file:// URI or one of
    // this app's own providers could otherwise trick it into copying its private files into a wish.
    private boolean isForeignImage(Uri uri) {
        if (uri == null || !"content".equals(uri.getScheme())) return false;
        String authority = uri.getAuthority();
        if (authority == null || authority.startsWith(getContext().getPackageName())) return false;
        String mime = getContext().getContentResolver().getType(uri);
        return mime != null && mime.startsWith("image/");
    }

    private String readBase64(Uri uri) {
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) return null;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
                if (out.size() > MAX_IMAGE_BYTES) return null;
            }
            return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) {
            Logger.error("ShareInbox", "Could not read shared image", e);
            return null;
        }
    }
}
