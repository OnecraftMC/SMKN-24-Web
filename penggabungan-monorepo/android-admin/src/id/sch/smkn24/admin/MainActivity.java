package id.sch.smkn24.admin;

import android.Manifest;
import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.text.InputType;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Shell Android untuk dashboard admin SMKN 24 Jakarta.
 *
 * Aplikasi ini TIDAK menyimpan data admin dan tidak memiliki akses langsung ke
 * database. Seluruh CRUD, unggah berkas, dan sesi login tetap diproses oleh web
 * dashboard yang sama (macdeep.my.id) sehingga perubahan dari HP langsung
 * tersimpan ke database server.
 */
public class MainActivity extends Activity {

    private static final String PREFS = "smkn24_admin";
    private static final String PREF_SERVER = "server_url";
    private static final String DEFAULT_SERVER = "https://macdeep.my.id/login";

    private static final int REQUEST_FILE_CHOOSER = 1001;
    private static final int REQUEST_STORAGE_PERMISSION = 1002;

    private WebView webView;
    private ProgressBar progressBar;
    private View errorView;
    private TextView errorDetail;
    private TextView subtitleView;
    private SharedPreferences preferences;

    private String serverUrl;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraUri;
    private long lastBackPress;
    private float pullStartY;
    private boolean trackingPull;
    private int entryFallbackStage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences(PREFS, MODE_PRIVATE);
        serverUrl = preferences.getString(PREF_SERVER, DEFAULT_SERVER);

        buildInterface();
        configureWebView();
        setupInsets();
        updateShortcuts();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            openFromIntent(getIntent());
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String path = pathFromIntent(intent);
        if (path != null) {
            loadUrl(originOf(serverUrl) + path);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }

    private void openFromIntent(Intent intent) {
        String path = pathFromIntent(intent);
        if (path != null) {
            loadUrl(originOf(serverUrl) + path);
        } else {
            loadEntry();
        }
    }

    private String pathFromIntent(Intent intent) {
        if (intent == null) {
            return null;
        }
        String path = intent.getStringExtra("path");
        Uri data = intent.getData();
        if (data != null && "smkn24admin".equalsIgnoreCase(data.getScheme())) {
            String fromLink = data.getPath();
            if (fromLink != null && !fromLink.isEmpty()) {
                path = fromLink;
            }
        }
        if (path != null && path.startsWith("/admin")) {
            return path;
        }
        return null;
    }

    private void buildInterface() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(color(R.color.navy));

        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setBackgroundColor(color(R.color.surface));

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setBackgroundColor(color(R.color.navy));
        toolbar.setPadding(dp(12), 0, dp(4), 0);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.mipmap.ic_launcher_round);
        toolbar.addView(logo, new LinearLayout.LayoutParams(dp(36), dp(36)));

        LinearLayout titleBox = new LinearLayout(this);
        titleBox.setOrientation(LinearLayout.VERTICAL);

        TextView title = new TextView(this);
        title.setText(R.string.app_name);
        title.setTextColor(Color.WHITE);
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        titleBox.addView(title);

        subtitleView = new TextView(this);
        subtitleView.setText(R.string.toolbar_subtitle);
        subtitleView.setTextColor(color(R.color.gold));
        subtitleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        titleBox.addView(subtitleView);

        LinearLayout.LayoutParams titleParams =
                new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        titleParams.setMarginStart(dp(10));
        toolbar.addView(titleBox, titleParams);

        ImageButton more = new ImageButton(this);
        more.setImageResource(R.drawable.ic_more_vert);
        more.setBackgroundColor(Color.TRANSPARENT);
        more.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        more.setContentDescription("Menu");
        more.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showMenu(view);
            }
        });
        toolbar.addView(more, new LinearLayout.LayoutParams(dp(44), dp(44)));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(true);
        progressBar.setVisibility(View.GONE);
        if (Build.VERSION.SDK_INT >= 21) {
            progressBar.setProgressTintList(ColorStateList.valueOf(color(R.color.gold)));
            progressBar.setBackgroundTintList(ColorStateList.valueOf(color(R.color.navy_light)));
        }

        FrameLayout content = new FrameLayout(this);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        content.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        errorView = buildErrorView();
        errorView.setVisibility(View.GONE);
        content.addView(errorView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        column.addView(toolbar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(60)));
        column.addView(progressBar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));
        column.addView(content, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        root.addView(column, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(root);
    }

    private View buildErrorView() {
        FrameLayout wrapper = new FrameLayout(this);
        wrapper.setBackgroundColor(color(R.color.surface));

        ScrollView scroll = new ScrollView(this);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        box.setPadding(dp(24), dp(40), dp(24), dp(40));

        ImageView icon = new ImageView(this);
        icon.setImageResource(R.mipmap.ic_launcher_round);
        icon.setAlpha(0.92f);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(dp(84), dp(84));
        box.addView(icon, iconParams);

        TextView title = new TextView(this);
        title.setText(R.string.error_title);
        title.setTextColor(color(R.color.navy));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 21);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleParams.topMargin = dp(18);
        box.addView(title, titleParams);

        errorDetail = new TextView(this);
        errorDetail.setText(R.string.error_message);
        errorDetail.setTextColor(color(R.color.on_surface_variant));
        errorDetail.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        errorDetail.setGravity(Gravity.CENTER);
        errorDetail.setLineSpacing(dp(2), 1f);
        LinearLayout.LayoutParams detailParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        detailParams.topMargin = dp(8);
        box.addView(errorDetail, detailParams);

        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setTextColor(Color.WHITE);
        retry.setAllCaps(false);
        if (Build.VERSION.SDK_INT >= 21) {
            retry.setBackgroundTintList(ColorStateList.valueOf(color(R.color.navy)));
        }
        retry.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                errorView.setVisibility(View.GONE);
                String current = webView.getUrl();
                if (current != null) {
                    webView.reload();
                } else {
                    loadEntry();
                }
            }
        });
        LinearLayout.LayoutParams retryParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(48));
        retryParams.topMargin = dp(22);
        box.addView(retry, retryParams);

        Button settings = new Button(this);
        settings.setText(R.string.server_settings);
        settings.setTextColor(color(R.color.navy));
        settings.setAllCaps(false);
        settings.setBackgroundColor(Color.TRANSPARENT);
        settings.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showServerDialog();
            }
        });
        box.addView(settings, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(48)));

        scroll.addView(box, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        FrameLayout.LayoutParams scrollParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        wrapper.addView(scroll, scrollParams);
        return wrapper;
    }

    private void setupInsets() {
        final View root = findViewById(android.R.id.content);
        if (root == null) {
            return;
        }
        root.setBackgroundColor(color(R.color.navy));
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @SuppressWarnings("deprecation")
            @Override
            public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                view.setPadding(0, insets.getSystemWindowInsetTop(),
                        0, insets.getSystemWindowInsetBottom());
                return insets;
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " SMKN24AdminApp/1.1");
        if (Build.VERSION.SDK_INT >= 26) {
            settings.setSafeBrowsingEnabled(true);
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new DownloadBridge(this), "SMKN24");
        webView.setWebViewClient(new AppWebViewClient());
        webView.setWebChromeClient(new AppChromeClient());
        webView.setDownloadListener(new AppDownloadListener());
        webView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View view, android.view.MotionEvent event) {
                switch (event.getActionMasked()) {
                    case android.view.MotionEvent.ACTION_DOWN:
                        trackingPull = webView.getScrollY() == 0;
                        pullStartY = event.getY();
                        break;
                    case android.view.MotionEvent.ACTION_UP:
                        if (trackingPull && event.getY() - pullStartY > dp(160)
                                && webView.getScrollY() == 0) {
                            webView.reload();
                        }
                        trackingPull = false;
                        break;
                    case android.view.MotionEvent.ACTION_CANCEL:
                        trackingPull = false;
                        break;
                    default:
                        break;
                }
                return false;
            }
        });
    }

    private void loadEntry() {
        entryFallbackStage = 0;
        loadUrl(serverUrl);
    }

    private boolean isSameSite(String host) {
        String baseHost = Uri.parse(serverUrl).getHost();
        if (host == null || baseHost == null) {
            return false;
        }
        String a = host.toLowerCase(java.util.Locale.US);
        String b = baseHost.toLowerCase(java.util.Locale.US);
        if (a.startsWith("www.")) {
            a = a.substring(4);
        }
        if (b.startsWith("www.")) {
            b = b.substring(4);
        }
        if (a.endsWith(".")) {
            a = a.substring(0, a.length() - 1);
        }
        if (b.endsWith(".")) {
            b = b.substring(0, b.length() - 1);
        }
        return a.equals(b);
    }

    private void loadUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            url = DEFAULT_SERVER;
        }
        if (errorView != null) {
            errorView.setVisibility(View.GONE);
        }
        if (progressBar != null) {
            progressBar.setVisibility(View.VISIBLE);
        }
        webView.loadUrl(url);
    }

    private boolean handleUri(Uri uri) {
        if (uri == null) {
            return false;
        }
        String scheme = uri.getScheme();
        if (scheme == null) {
            return false;
        }
        scheme = scheme.toLowerCase();

        if (scheme.equals("http") || scheme.equals("https")) {
            if (isSameSite(uri.getHost())) {
                return false;
            }
            openExternal(uri);
            return true;
        }

        if (scheme.equals("blob") || scheme.equals("data") || scheme.equals("about")
                || scheme.equals("javascript")) {
            return false;
        }

        if (scheme.equals("mailto") || scheme.equals("tel") || scheme.equals("sms")
                || scheme.equals("smsto") || scheme.equals("whatsapp")
                || scheme.equals("market") || scheme.equals("intent")) {
            openExternal(uri);
            return true;
        }

        return true;
    }

    private void openExternal(Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(intent);
        } catch (Exception error) {
            Toast.makeText(this, "Tidak ada aplikasi untuk membuka tautan ini.",
                    Toast.LENGTH_SHORT).show();
        }
    }

    private void showError(String detail) {
        if (progressBar != null) {
            progressBar.setVisibility(View.GONE);
        }
        if (errorDetail != null) {
            String message = getString(R.string.error_message);
            if (detail != null && !detail.trim().isEmpty()) {
                message = detail.trim() + "\n\n" + message;
            }
            errorDetail.setText(message);
        }
        if (errorView != null) {
            errorView.setVisibility(View.VISIBLE);
        }
    }

    private void injectPageHelpers() {
        String script =
                "(function(){" +
                "if(window.__smkn24Installed){return;}" +
                "window.__smkn24Installed=true;" +
                "function findLink(e){while(e&&e.tagName&&e.tagName.toLowerCase()!=='a'){e=e.parentNode;}return e;}" +
                "document.addEventListener('click',function(ev){" +
                "var a=findLink(ev.target);if(!a||!a.href){return;}" +
                "var href=a.href;if(href.indexOf('blob:')!==0){return;}" +
                "ev.preventDefault();ev.stopPropagation();" +
                "var name=a.getAttribute('download')||'unduhan';" +
                "fetch(href).then(function(r){return r.blob();}).then(function(b){" +
                "var fr=new FileReader();" +
                "fr.onload=function(){" +
                "try{" +
                "var data=String(fr.result);var comma=data.indexOf(',');var b64=data.substring(comma+1);" +
                "if(!window.SMKN24){alert('Fitur unduhan tidak tersedia.');return;}" +
                "window.SMKN24.startDownload(name,b.type||'application/octet-stream');" +
                "var CH=262144,idx=0;" +
                "function step(){var n=0;while(n<4&&idx<b64.length){window.SMKN24.appendChunk(b64.substring(idx,Math.min(idx+CH,b64.length)));idx+=CH;n++;}" +
                "if(idx<b64.length){setTimeout(step,0);}else{window.SMKN24.finishDownload();}}" +
                "step();" +
                "}catch(err){alert('Gagal mengunduh: '+err);}" +
                "};" +
                "fr.readAsDataURL(b);" +
                "}).catch(function(e){alert('Gagal mengunduh: '+e);});" +
                "},true);" +
                "})();";
        webView.evaluateJavascript(script, null);
    }

    private void showMenu(View anchor) {
        PopupMenu popup = new PopupMenu(this, anchor);
        Menu menu = popup.getMenu();
        menu.add(0, 1, 0, "Muat ulang");
        menu.add(0, 2, 1, "Pengaturan server");
        menu.add(0, 3, 2, "Buka di browser");
        menu.add(0, 4, 3, "Keluar (logout)");
        menu.add(0, 5, 4, "Tentang aplikasi");
        popup.setOnMenuItemClickListener(new PopupMenu.OnMenuItemClickListener() {
            @Override
            public boolean onMenuItemClick(MenuItem item) {
                switch (item.getItemId()) {
                    case 1:
                        String current = webView.getUrl();
                        if (current == null) {
                            loadEntry();
                        } else {
                            webView.reload();
                        }
                        return true;
                    case 2:
                        showServerDialog();
                        return true;
                    case 3:
                        String url = webView.getUrl();
                        if (url != null) {
                            openExternal(Uri.parse(url));
                        }
                        return true;
                    case 4:
                        confirmLogout();
                        return true;
                    case 5:
                        showAbout();
                        return true;
                    default:
                        return false;
                }
            }
        });
        popup.show();
    }

    private void showServerDialog() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(20), dp(8), dp(20), 0);

        TextView label = new TextView(this);
        label.setText("Alamat dashboard admin");
        label.setTextColor(color(R.color.navy));
        label.setTypeface(Typeface.DEFAULT_BOLD);
        label.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        box.addView(label);

        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setText(serverUrl);
        input.setSelection(input.getText().length());
        input.setSingleLine(false);
        input.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        inputParams.topMargin = dp(8);
        box.addView(input, inputParams);

        TextView hint = new TextView(this);
        hint.setText("Gunakan alamat web yang sama dengan dashboard admin. "
                + "Contoh: https://macdeep.my.id/login\n\n"
                + "Semua perubahan dari aplikasi ini langsung dikirim ke server "
                + "dan tersimpan di database sekolah.");
        hint.setTextColor(color(R.color.on_surface_variant));
        hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        hint.setLineSpacing(dp(2), 1f);
        LinearLayout.LayoutParams hintParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        hintParams.topMargin = dp(10);
        box.addView(hint, hintParams);

        final AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Pengaturan Server")
                .setView(box)
                .setPositiveButton("Simpan", null)
                .setNegativeButton("Batal", null)
                .create();

        dialog.setOnShowListener(new android.content.DialogInterface.OnShowListener() {
            @Override
            public void onShow(android.content.DialogInterface unused) {
                dialog.getButton(AlertDialog.BUTTON_POSITIVE)
                        .setOnClickListener(new View.OnClickListener() {
                            @Override
                            public void onClick(View view) {
                                String normalized = normalizeUrl(input.getText().toString());
                                if (normalized == null) {
                                    input.setError("Alamat tidak valid. Contoh: https://macdeep.my.id/login");
                                    return;
                                }
                                serverUrl = normalized;
                                preferences.edit().putString(PREF_SERVER, serverUrl).apply();
                                updateShortcuts();
                                dialog.dismiss();
                                loadEntry();
                            }
                        });
            }
        });
        dialog.show();
    }

    private void confirmLogout() {
        new AlertDialog.Builder(this)
                .setTitle("Keluar dari dashboard?")
                .setMessage("Sesi login di perangkat ini akan dihapus. Data di server tidak berubah.")
                .setPositiveButton("Keluar", new android.content.DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(android.content.DialogInterface dialog, int which) {
                        clearSession();
                        loadEntry();
                    }
                })
                .setNegativeButton("Batal", null)
                .show();
    }

    private void clearSession() {
        CookieManager cookies = CookieManager.getInstance();
        cookies.removeAllCookies(null);
        cookies.flush();
        WebStorage.getInstance().deleteAllData();
        if (webView != null) {
            webView.clearCache(true);
            webView.clearHistory();
            webView.clearFormData();
        }
        Toast.makeText(this, "Sesi login dihapus.", Toast.LENGTH_SHORT).show();
    }

    private void showAbout() {
        String version = "1.0";
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            version = info.versionName;
        } catch (Exception ignored) {
        }
        new AlertDialog.Builder(this)
                .setTitle("Tentang SMKN 24 Admin")
                .setMessage("Versi " + version + "\n\n"
                        + "Aplikasi pembungkus dashboard admin SMKN 24 Jakarta. "
                        + "Login, CRUD, unggah foto/berkas, dan unduhan memakai "
                        + "aplikasi web yang sama sehingga perubahan dari HP "
                        + "langsung tersimpan di database sekolah.\n\n"
                        + "Server: " + serverUrl)
                .setPositiveButton("Tutup", null)
                .show();
    }

    private String normalizeUrl(String raw) {
        if (raw == null) {
            return null;
        }
        String value = raw.trim();
        if (value.isEmpty()) {
            return null;
        }
        if (!value.matches("(?i)^[a-z][a-z0-9+.-]*://.*")) {
            value = "https://" + value;
        }
        Uri uri = Uri.parse(value);
        String scheme = uri.getScheme();
        if (scheme == null) {
            return null;
        }
        scheme = scheme.toLowerCase();
        if (!scheme.equals("http") && !scheme.equals("https")) {
            return null;
        }
        if (uri.getHost() == null || uri.getHost().isEmpty()) {
            return null;
        }
        String path = uri.getPath();
        if (path == null || path.isEmpty() || path.equals("/")) {
            Uri.Builder builder = uri.buildUpon().path("/login");
            value = builder.build().toString();
        }
        while (value.endsWith("/") && value.length() > 8) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String originOf(String url) {
        Uri uri = Uri.parse(url);
        return uri.getScheme() + "://" + uri.getAuthority();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private int color(int resourceId) {
        if (Build.VERSION.SDK_INT >= 23) {
            return getColor(resourceId);
        }
        return getResources().getColor(resourceId);
    }

    public void requestStoragePermission() {
        if (Build.VERSION.SDK_INT < 29) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                            != PackageManager.PERMISSION_GRANTED) {
                        requestPermissions(
                                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},
                                REQUEST_STORAGE_PERMISSION);
                    }
                }
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_STORAGE_PERMISSION) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            Toast.makeText(this,
                    granted ? "Izin diberikan. Silakan ulangi unduhan."
                            : "Izin penyimpanan ditolak.",
                    Toast.LENGTH_SHORT).show();
        }
    }

    @TargetApi(25)
    private void updateShortcuts() {
        if (Build.VERSION.SDK_INT < 25) {
            return;
        }
        try {
            ShortcutManager manager = (ShortcutManager) getSystemService(SHORTCUT_SERVICE);
            if (manager == null) {
                return;
            }
            String[][] items = {
                    {"berita", "Berita", "Kelola berita", "/admin/berita"},
                    {"pengumuman", "Pengumuman", "Kelola pengumuman", "/admin/pengumuman"},
                    {"agenda", "Agenda", "Kelola agenda", "/admin/agenda"},
                    {"galeri", "Galeri", "Kelola galeri", "/admin/galeri"},
                    {"bk", "Pesan BK", "Inbox bimbingan konseling", "/admin/bk"}
            };
            List<ShortcutInfo> shortcuts = new ArrayList<>();
            for (String[] item : items) {
                Intent intent = new Intent(this, MainActivity.class)
                        .setAction(Intent.ACTION_VIEW)
                        .putExtra("path", item[3])
                        .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                shortcuts.add(new ShortcutInfo.Builder(this, item[0])
                        .setShortLabel(item[1])
                        .setLongLabel(item[2])
                        .setIcon(Icon.createWithResource(this, R.mipmap.ic_launcher))
                        .setIntent(intent)
                        .build());
            }
            manager.setDynamicShortcuts(shortcuts);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onBackPressed() {
        if (errorView != null && errorView.getVisibility() == View.VISIBLE) {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
            } else {
                confirmExit();
            }
            return;
        }
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        String current = webView.getUrl();
        String path = current == null ? null : Uri.parse(current).getPath();
        boolean dashboardRoot = path != null && path.equals("/admin");
        if (!dashboardRoot && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        confirmExit();
    }

    private void confirmExit() {
        long now = System.currentTimeMillis();
        if (now - lastBackPress < 2000) {
            super.onBackPressed();
            return;
        }
        lastBackPress = now;
        Toast.makeText(this, "Tekan sekali lagi untuk keluar", Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    private boolean acceptsImages(String[] types) {
        if (types == null) {
            return false;
        }
        for (String type : types) {
            if (type == null) {
                continue;
            }
            String value = type.toLowerCase();
            if (value.startsWith("image/") || value.endsWith(".jpg") || value.endsWith(".jpeg")
                    || value.endsWith(".png") || value.endsWith(".webp") || value.endsWith(".heic")) {
                return true;
            }
        }
        return false;
    }

    private void grantUri(Intent intent, Uri uri) {
        List<ResolveInfo> receivers =
                getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        for (ResolveInfo info : receivers) {
            grantUriPermission(info.activityInfo.packageName, uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        }
    }

    private boolean hasContent(Uri uri) {
        InputStream stream = null;
        try {
            stream = getContentResolver().openInputStream(uri);
            return stream != null && stream.read() != -1;
        } catch (Exception error) {
            return false;
        } finally {
            if (stream != null) {
                try {
                    stream.close();
                } catch (Exception ignored) {
                }
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_FILE_CHOOSER) {
            return;
        }
        if (filePathCallback == null) {
            return;
        }
        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            if (data == null || data.getData() == null) {
                if (cameraUri != null && hasContent(cameraUri)) {
                    results = new Uri[]{cameraUri};
                }
            } else {
                ClipData clip = data.getClipData();
                if (clip != null && clip.getItemCount() > 0) {
                    results = new Uri[clip.getItemCount()];
                    for (int i = 0; i < clip.getItemCount(); i++) {
                        results[i] = clip.getItemAt(i).getUri();
                    }
                } else {
                    results = new Uri[]{data.getData()};
                }
            }
        }
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
        cameraUri = null;
    }

    private class AppWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleUri(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleUri(Uri.parse(url));
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            progressBar.setVisibility(View.VISIBLE);
            errorView.setVisibility(View.GONE);
            String host = Uri.parse(url).getHost();
            if (host != null) {
                subtitleView.setText(getString(R.string.toolbar_subtitle) + " • " + host);
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            progressBar.setVisibility(View.GONE);
            injectPageHelpers();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request,
                                    WebResourceError error) {
            if (request.isForMainFrame()) {
                showError(String.valueOf(error.getDescription()));
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request,
                                        WebResourceResponse errorResponse) {
            if (!request.isForMainFrame()) {
                return;
            }
            int code = errorResponse.getStatusCode();
            if (code >= 500) {
                showError("Server mengembalikan HTTP " + code + ".");
                return;
            }
            if (code != 404 && code != 410) {
                return;
            }
            String path = request.getUrl().getPath();
            if (path == null || path.isEmpty()) {
                path = "/";
            }
            String origin = originOf(request.getUrl().toString());
            boolean entryPath = path.equals("/login") || path.equals("/admin");
            if (entryPath && entryFallbackStage == 0) {
                entryFallbackStage = 1;
                loadUrl(origin + (path.equals("/admin") ? "/login" : "/admin"));
                return;
            }
            if (entryPath && entryFallbackStage == 1) {
                entryFallbackStage = 2;
                loadUrl(origin + "/");
            }
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description,
                                    String failingUrl) {
            String current = view.getUrl();
            if (current != null && current.equals(failingUrl)) {
                showError(description);
            }
        }

        @Override
        public void onReceivedSslError(WebView view,
                                       android.webkit.SslErrorHandler handler,
                                       android.net.http.SslError error) {
            handler.cancel();
            showError("Sertifikat HTTPS tidak valid: " + error.getUrl());
        }
    }

    private class AppChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view,
                                         ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
            }
            filePathCallback = callback;
            cameraUri = null;

            Intent content;
            try {
                content = params.createIntent();
            } catch (Exception error) {
                content = new Intent(Intent.ACTION_GET_CONTENT);
                content.setType("*/*");
            }
            content.addCategory(Intent.CATEGORY_OPENABLE);

            Intent chooser = Intent.createChooser(content, "Pilih berkas");
            if (acceptsImages(params.getAcceptTypes())) {
                Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                if (camera.resolveActivity(getPackageManager()) != null) {
                    cameraUri = CacheFileProvider.newCameraUri(MainActivity.this);
                    camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                    camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    camera.setClipData(ClipData.newRawUri("foto", cameraUri));
                    grantUri(camera, cameraUri);
                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
                    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    chooser.setClipData(ClipData.newRawUri("foto", cameraUri));
                }
            }

            try {
                startActivityForResult(chooser, REQUEST_FILE_CHOOSER);
            } catch (Exception error) {
                filePathCallback = null;
                cameraUri = null;
                Toast.makeText(MainActivity.this, "Tidak ada aplikasi pemilih berkas.",
                        Toast.LENGTH_SHORT).show();
                return false;
            }
            return true;
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            String host = request.getOrigin() == null ? null : request.getOrigin().getHost();
            if (isSameSite(host)) {
                request.grant(request.getResources());
            } else {
                request.deny();
            }
        }
    }

    private class AppDownloadListener implements DownloadListener {
        @Override
        public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                    String mimeType, long contentLength) {
            if (url == null || url.startsWith("blob:") || url.startsWith("data:")) {
                return;
            }
            try {
                String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                String cookie = CookieManager.getInstance().getCookie(url);
                if (cookie != null) {
                    request.addRequestHeader("Cookie", cookie);
                }
                request.addRequestHeader("User-Agent",
                        userAgent == null ? webView.getSettings().getUserAgentString() : userAgent);
                request.setTitle(fileName);
                request.setDescription("Mengunduh dari dashboard SMKN 24");
                request.setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS, "SMKN 24 Admin/" + fileName);
                request.allowScanningByMediaScanner();
                DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (manager != null) {
                    manager.enqueue(request);
                    Toast.makeText(MainActivity.this,
                            "Mengunduh " + fileName + " ke Download/SMKN 24 Admin",
                            Toast.LENGTH_SHORT).show();
                }
            } catch (Exception error) {
                Toast.makeText(MainActivity.this, "Gagal memulai unduhan.",
                        Toast.LENGTH_SHORT).show();
            }
        }
    }
}
