package id.sch.smkn24.admin;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;

/**
 * Jembatan JS -> Android untuk menyimpan berkas yang dibuat lewat
 * URL.createObjectURL (fitur unduh arsip / bukti prestasi / ekspor CSV admin).
 * Data dikirim bertahap (base64 per potongan) supaya berkas besar tidak
 * memblokir WebView.
 */
public class DownloadBridge {

    private final WeakReference<MainActivity> activityRef;

    private OutputStream output;
    private Uri pendingMediaUri;
    private File legacyFile;
    private String displayName;
    private String mimeType;
    private boolean failed;
    private boolean storagePermissionNeeded;

    public DownloadBridge(MainActivity activity) {
        this.activityRef = new WeakReference<>(activity);
    }

    @android.webkit.JavascriptInterface
    public synchronized void startDownload(String name, String mime) {
        closeQuietly();
        MainActivity activity = activityRef.get();
        if (activity == null) {
            return;
        }

        displayName = sanitize(name);
        mimeType = (mime == null || mime.trim().isEmpty())
                ? "application/octet-stream"
                : mime.trim();
        failed = false;
        storagePermissionNeeded = false;

        if (Build.VERSION.SDK_INT >= 29) {
            startMediaStoreDownload(activity);
        } else {
            startLegacyDownload(activity);
        }
    }

    private void startMediaStoreDownload(MainActivity activity) {
        try {
            ContentResolver resolver = activity.getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, displayName);
            values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
            values.put(MediaStore.MediaColumns.RELATIVE_PATH,
                    Environment.DIRECTORY_DOWNLOADS + "/SMKN 24 Admin");
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);

            pendingMediaUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (pendingMediaUri == null) {
                failed = true;
                return;
            }
            output = resolver.openOutputStream(pendingMediaUri);
            if (output == null) {
                failed = true;
            }
        } catch (Exception error) {
            failed = true;
        }
    }

    private void startLegacyDownload(MainActivity activity) {
        if (activity.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            storagePermissionNeeded = true;
            failed = true;
            activity.requestStoragePermission();
            return;
        }
        try {
            File dir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "SMKN 24 Admin");
            if (!dir.exists() && !dir.mkdirs()) {
                failed = true;
                return;
            }
            File target = uniqueFile(dir, displayName);
            legacyFile = target;
            output = new BufferedOutputStream(new FileOutputStream(target));
        } catch (Exception error) {
            failed = true;
        }
    }

    @android.webkit.JavascriptInterface
    public synchronized void appendChunk(String base64) {
        if (failed || output == null || base64 == null) {
            return;
        }
        try {
            output.write(Base64.decode(base64, Base64.DEFAULT));
        } catch (Exception error) {
            failed = true;
        }
    }

    @android.webkit.JavascriptInterface
    public synchronized void finishDownload() {
        final MainActivity activity = activityRef.get();
        boolean wasFailed = failed;
        String finishedName = displayName;

        try {
            if (output != null) {
                output.flush();
                output.close();
            }
        } catch (Exception ignored) {
            wasFailed = true;
        }
        output = null;

        if (!wasFailed && pendingMediaUri != null && activity != null) {
            try {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                activity.getContentResolver().update(pendingMediaUri, values, null, null);
            } catch (Exception ignored) {
                wasFailed = true;
            }
        }

        if (!wasFailed && legacyFile != null && activity != null) {
            MediaScannerConnection.scanFile(
                    activity,
                    new String[]{legacyFile.getAbsolutePath()},
                    new String[]{mimeType},
                    null);
        }

        if (wasFailed && pendingMediaUri != null && activity != null) {
            try {
                activity.getContentResolver().delete(pendingMediaUri, null, null);
            } catch (Exception ignored) {
            }
        }

        pendingMediaUri = null;
        legacyFile = null;

        if (activity != null) {
            final boolean showFailure = wasFailed;
            final boolean permission = storagePermissionNeeded;
            final String message = showFailure
                    ? (permission
                        ? "Izin penyimpanan diperlukan. Setujui izin lalu ulangi unduhan."
                        : "Gagal menyimpan unduhan.")
                    : "Tersimpan di Download/SMKN 24 Admin/" + finishedName;
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(activity, message, Toast.LENGTH_LONG).show();
                }
            });
        }

        failed = false;
        storagePermissionNeeded = false;
    }

    private void closeQuietly() {
        if (output != null) {
            try {
                output.close();
            } catch (Exception ignored) {
            }
        }
        output = null;
        pendingMediaUri = null;
        legacyFile = null;
    }

    private static File uniqueFile(File dir, String name) {
        File candidate = new File(dir, name);
        if (!candidate.exists()) {
            return candidate;
        }
        String base = name;
        String extension = "";
        int dot = name.lastIndexOf('.');
        if (dot > 0) {
            base = name.substring(0, dot);
            extension = name.substring(dot);
        }
        int index = 1;
        while (candidate.exists()) {
            candidate = new File(dir, base + " (" + index + ")" + extension);
            index++;
        }
        return candidate;
    }

    private static String sanitize(String name) {
        if (name == null) {
            return "unduhan";
        }
        String clean = name.trim()
                .replace('/', '_')
                .replace('\\', '_')
                .replace(':', '_')
                .replace('*', '_')
                .replace('?', '_')
                .replace('"', '_')
                .replace('<', '_')
                .replace('>', '_')
                .replace('|', '_');
        if (clean.isEmpty()) {
            clean = "unduhan";
        }
        if (clean.length() > 120) {
            clean = clean.substring(0, 120);
        }
        return clean;
    }
}
