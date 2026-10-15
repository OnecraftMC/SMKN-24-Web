package id.sch.smkn24.kantinpenjual;

import android.app.Activity;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final String PREFS = "kantin-seller";
    private static final String DEFAULT_API = "https://macdeep.my.id/backend";
    private static final int NAVY = 0xFF173B69;
    private static final int BLUE = 0xFF1D4F91;
    private static final int BG = 0xFFF5F7FA;
    private static final int TEXT = 0xFF1C2736;
    private static final int MUTED = 0xFF667085;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private String apiBase;
    private String token;
    private String sellerName;
    private String standName;
    private boolean mustChangePassword;
    private boolean loading;
    private String errorMessage;
    private JSONArray orders = new JSONArray();
    private LinearLayout content;
    private ScrollView activeScroll;
    private Runnable pollTask;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(BG);
        apiBase = getPreferences(MODE_PRIVATE).getString("api", DEFAULT_API);
        token = getPreferences(MODE_PRIVATE).getString("token", null);
        sellerName = getPreferences(MODE_PRIVATE).getString("seller", "");
        standName = getPreferences(MODE_PRIVATE).getString("stand", "");
        mustChangePassword = getPreferences(MODE_PRIVATE).getBoolean("change_password", false);
        render();
        if (token != null && !mustChangePassword) loadOrders(false);
    }

    @Override protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        network.shutdownNow();
        super.onDestroy();
    }

    private void render() {
        int previousScrollY = activeScroll == null ? 0 : activeScroll.getScrollY();
        ScrollView scroll = new ScrollView(this);
        activeScroll = scroll;
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(20), dp(20), dp(20), dp(28));
        scroll.addView(content);
        setContentView(scroll);
        scroll.post(() -> scroll.scrollTo(0, previousScrollY));
        if (token == null) renderLogin();
        else if (mustChangePassword) renderChangePassword();
        else renderDashboard();
    }

    private void renderLogin() {
        addSpacer(24);
        TextView mark = text("🍽", 32, BLUE, true);
        mark.setGravity(Gravity.CENTER);
        mark.setBackground(roundRect(0xFFE7EFFB, 24));
        LinearLayout.LayoutParams markParams = new LinearLayout.LayoutParams(dp(72), dp(72));
        markParams.gravity = Gravity.CENTER_HORIZONTAL;
        content.addView(mark, markParams);
        addText("APLIKASI PENJUAL", 12, BLUE, true, 0, 8);
        addText("Pesanan kantin, lebih mudah.", 27, NAVY, true, 0, 8);
        addText("Masuk menggunakan akun yang dibuat administrator sekolah.", 15, MUTED, false, 0, 22);
        EditText api = field("Alamat API, contoh https://domain.sch.id/backend", false);
        api.setText(apiBase);
        content.addView(api, fieldParams());
        EditText username = field("Nama pengguna", false);
        username.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
        content.addView(username, fieldParams());
        EditText password = field("Kata sandi", true);
        content.addView(password, fieldParams());
        Button login = button("Masuk", true);
        content.addView(login, buttonParams());
        TextView status = statusView();
        content.addView(status, fieldParams());
        login.setOnClickListener(v -> {
            apiBase = normalizeApi(api.getText().toString());
            if (apiBase.isEmpty() || username.getText().toString().trim().isEmpty() || password.getText().length() == 0) {
                showMessage(status, "Isi alamat API, nama pengguna, dan kata sandi.", true); return;
            }
            setBusy(login, true, "Memeriksa akun…");
            JSONObject body = new JSONObject();
            try { body.put("action", "login"); body.put("username", username.getText().toString().trim()); body.put("password", password.getText().toString()); }
            catch (Exception ignored) { }
            network.execute(() -> {
                try {
                    JSONObject result = request("POST", "/api/kantin/seller/auth.php", body, null);
                    token = result.getString("token");
                    mustChangePassword = result.optBoolean("mustChangePassword");
                    JSONObject user = result.optJSONObject("user");
                    sellerName = user == null ? "Penjual" : user.optString("fullName", "Penjual");
                    standName = user == null ? "Stand kantin" : user.optString("standName", "Stand kantin");
                    getPreferences(MODE_PRIVATE).edit().putString("api", apiBase).putString("token", token).putString("seller", sellerName).putString("stand", standName).putBoolean("change_password", mustChangePassword).apply();
                    runOnUiThread(() -> { render(); if (!mustChangePassword) loadOrders(false); });
                } catch (Exception e) {
                    runOnUiThread(() -> { setBusy(login, false, "Masuk"); showMessage(status, e.getMessage(), true); });
                }
            });
        });
    }

    private void renderChangePassword() {
        addText("Amankan akun penjual", 27, NAVY, true, 0, 8);
        addText("Kata sandi sementara harus diganti sebelum pesanan bisa dibuka.", 15, MUTED, false, 0, 20);
        EditText current = field("Kata sandi sementara", true);
        content.addView(current, fieldParams());
        EditText next = field("Kata sandi baru (minimal 10 karakter)", true);
        content.addView(next, fieldParams());
        Button save = button("Simpan kata sandi", true);
        content.addView(save, buttonParams());
        TextView status = statusView();
        content.addView(status, fieldParams());
        save.setOnClickListener(v -> {
            if (next.getText().length() < 10) { showMessage(status, "Kata sandi baru minimal 10 karakter.", true); return; }
            setBusy(save, true, "Menyimpan…");
            JSONObject body = new JSONObject();
            try { body.put("action", "change_password"); body.put("currentPassword", current.getText().toString()); body.put("newPassword", next.getText().toString()); }
            catch (Exception ignored) { }
            network.execute(() -> {
                try {
                    request("POST", "/api/kantin/seller/auth.php", body, token);
                    mustChangePassword = false;
                    getPreferences(MODE_PRIVATE).edit().putBoolean("change_password", false).apply();
                    runOnUiThread(() -> { render(); loadOrders(false); });
                } catch (Exception e) {
                    runOnUiThread(() -> { setBusy(save, false, "Simpan kata sandi"); showMessage(status, e.getMessage(), true); });
                }
            });
        });
        Button logout = button("Keluar", false);
        content.addView(logout, buttonParams());
        logout.setOnClickListener(v -> logout());
    }

    private void renderDashboard() {
        LinearLayout header = column();
        header.setPadding(dp(20), dp(22), dp(20), dp(22));
        header.setBackground(roundRect(NAVY, 24));
        TextView kicker = text("PANEL PENJUAL", 12, 0xFFBFD5F5, true);
        header.addView(kicker);
        TextView title = text(standName, 23, 0xFFFFFFFF, true);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(-1, -2);
        titleParams.topMargin = dp(5);
        header.addView(title, titleParams);
        TextView greeting = text("Halo, " + sellerName, 14, 0xFFDCE8F9, false);
        header.addView(greeting);
        content.addView(header, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout heading = new LinearLayout(this);
        heading.setGravity(Gravity.CENTER_VERTICAL);
        heading.setOrientation(LinearLayout.HORIZONTAL);
        TextView section = text("Pesanan lunas", 21, NAVY, true);
        heading.addView(section, new LinearLayout.LayoutParams(0, -2, 1));
        Button refresh = smallButton("Segarkan");
        heading.addView(refresh);
        LinearLayout.LayoutParams headingParams = new LinearLayout.LayoutParams(-1, -2);
        headingParams.topMargin = dp(22);
        headingParams.bottomMargin = dp(4);
        content.addView(heading, headingParams);
        TextView caption = text("Pesanan terbayar diperbarui otomatis setiap 6 detik.", 13, MUTED, false);
        content.addView(caption);
        TextView status = statusView();
        if (errorMessage != null) showMessage(status, errorMessage, true);
        content.addView(status, fieldParams());
        refresh.setOnClickListener(v -> loadOrders(true));

        if (loading && orders.length() == 0) {
            TextView loadingView = text("Memuat pesanan…", 15, MUTED, false);
            loadingView.setGravity(Gravity.CENTER);
            content.addView(loadingView, new LinearLayout.LayoutParams(-1, dp(140)));
        } else if (orders.length() == 0) {
            LinearLayout empty = column();
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(dp(22), dp(28), dp(22), dp(28));
            empty.setBackground(roundRect(0xFFFFFFFF, 20));
            empty.addView(text("Belum ada pesanan masuk", 17, NAVY, true));
            TextView detail = text("Pesanan baru tampil setelah pembayaran berhasil dikonfirmasi.", 14, MUTED, false);
            detail.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams detailParams = new LinearLayout.LayoutParams(-1, -2);
            detailParams.topMargin = dp(8);
            empty.addView(detail, detailParams);
            LinearLayout.LayoutParams emptyParams = new LinearLayout.LayoutParams(-1, -2);
            emptyParams.topMargin = dp(16);
            content.addView(empty, emptyParams);
        } else {
            for (int i = 0; i < orders.length(); i++) {
                JSONObject order = orders.optJSONObject(i);
                if (order != null) addOrderCard(order);
            }
        }
        Button logout = button("Keluar dari akun", false);
        LinearLayout.LayoutParams logoutParams = buttonParams();
        logoutParams.topMargin = dp(24);
        content.addView(logout, logoutParams);
        logout.setOnClickListener(v -> logout());
    }

    private void addOrderCard(JSONObject order) {
        LinearLayout card = column();
        card.setPadding(dp(17), dp(17), dp(17), dp(17));
        card.setBackground(roundRect(0xFFFFFFFF, 20));
        String orderNo = order.optString("order_no");
        TextView number = text(orderNo, 12, BLUE, true);
        card.addView(number);
        LinearLayout person = new LinearLayout(this);
        person.setOrientation(LinearLayout.HORIZONTAL);
        person.setGravity(Gravity.CENTER_VERTICAL);
        TextView name = text(order.optString("buyer_name", "Pembeli"), 18, NAVY, true);
        person.addView(name, new LinearLayout.LayoutParams(0, -2, 1));
        TextView paid = text("LUNAS", 11, 0xFF18794E, true);
        paid.setPadding(dp(9), dp(5), dp(9), dp(5));
        paid.setBackground(roundRect(0xFFE5F5EC, 16));
        person.addView(paid);
        LinearLayout.LayoutParams personParams = new LinearLayout.LayoutParams(-1, -2);
        personParams.topMargin = dp(6);
        card.addView(person, personParams);
        card.addView(text(order.optString("buyer_class", "") + " · " + ("delivery".equals(order.optString("fulfillment")) ? "Diantar" : "Ambil sendiri"), 13, MUTED, false));

        JSONArray items = order.optJSONArray("items");
        if (items != null) for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) continue;
            LinearLayout row = new LinearLayout(this);
            row.setGravity(Gravity.CENTER_VERTICAL);
            TextView itemName = text(item.optInt("quantity") + "× " + item.optString("name"), 14, TEXT, false);
            row.addView(itemName, new LinearLayout.LayoutParams(0, -2, 1));
            row.addView(text(money(item.optLong("lineTotal")), 14, NAVY, true));
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(-1, -2);
            rowParams.topMargin = dp(10);
            card.addView(row, rowParams);
        }
        LinearLayout total = new LinearLayout(this);
        total.setGravity(Gravity.CENTER_VERTICAL);
        total.setPadding(0, dp(12), 0, 0);
        TextView totalLabel = text("Total pesanan", 14, MUTED, false);
        total.addView(totalLabel, new LinearLayout.LayoutParams(0, -2, 1));
        total.addView(text(money(order.optLong("total")), 16, NAVY, true));
        LinearLayout.LayoutParams totalParams = new LinearLayout.LayoutParams(-1, -2);
        totalParams.topMargin = dp(10);
        card.addView(total, totalParams);
        Button advance = button(nextLabel(order.optString("status")), true);
        LinearLayout.LayoutParams actionParams = buttonParams();
        actionParams.topMargin = dp(15);
        card.addView(advance, actionParams);
        advance.setOnClickListener(v -> advanceOrder(order, advance));
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(-1, -2);
        cardParams.topMargin = dp(14);
        content.addView(card, cardParams);
    }

    private void advanceOrder(JSONObject order, Button button) {
        String from = order.optString("status");
        String to = "received".equals(from) ? "preparing" : "preparing".equals(from) ? "ready" : "completed";
        setBusy(button, true, "Memperbarui…");
        JSONObject body = new JSONObject();
        try { body.put("orderNo", order.optString("order_no")); body.put("fromStatus", from); body.put("status", to); }
        catch (Exception ignored) { }
        network.execute(() -> {
            try { request("PUT", "/api/kantin/seller/orders.php", body, token); loadOrders(false); }
            catch (Exception e) { runOnUiThread(() -> { setBusy(button, false, nextLabel(from)); errorMessage = e.getMessage(); render(); }); }
        });
    }

    private void loadOrders(boolean showLoading) {
        if (token == null || mustChangePassword) return;
        loading = showLoading;
        if (showLoading) runOnUiThread(this::render);
        network.execute(() -> {
            try {
                JSONObject response = request("GET", "/api/kantin/seller/orders.php", null, token);
                orders = response.optJSONArray("orders");
                if (orders == null) orders = new JSONArray();
                errorMessage = null;
            } catch (Exception e) { errorMessage = e.getMessage(); }
            loading = false;
            runOnUiThread(this::render);
            schedulePoll();
        });
    }

    private void schedulePoll() {
        handler.removeCallbacksAndMessages(null);
        pollTask = () -> { if (token != null && !mustChangePassword) loadOrders(false); };
        handler.postDelayed(pollTask, 6000);
    }

    private JSONObject request(String method, String path, JSONObject body, String accessToken) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(apiBase + path).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(20000);
        connection.setRequestProperty("Accept", "application/json");
        if (accessToken != null) connection.setRequestProperty("Authorization", "Bearer " + accessToken);
        if (body != null) {
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            try (OutputStream out = connection.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
        }
        int code = connection.getResponseCode();
        InputStream stream = code >= 400 ? connection.getErrorStream() : connection.getInputStream();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        if (stream != null) { byte[] chunk = new byte[4096]; int read; while ((read = stream.read(chunk)) != -1) buffer.write(chunk, 0, read); stream.close(); }
        connection.disconnect();
        JSONObject json = new JSONObject(buffer.toString(StandardCharsets.UTF_8));
        if (code < 200 || code >= 300) throw new Exception(json.optString("error", "Permintaan gagal (" + code + ")."));
        return json;
    }

    private void logout() {
        handler.removeCallbacksAndMessages(null);
        token = null; sellerName = null; standName = null; mustChangePassword = false; orders = new JSONArray(); errorMessage = null;
        getPreferences(MODE_PRIVATE).edit().remove("token").remove("seller").remove("stand").remove("change_password").apply();
        render();
    }

    private EditText field(String hint, boolean password) {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setTextSize(15);
        input.setTextColor(TEXT);
        input.setHintTextColor(0xFF98A2B3);
        input.setHint(hint);
        input.setPadding(dp(15), dp(13), dp(15), dp(13));
        input.setBackground(roundRect(0xFFFFFFFF, 13));
        if (password) input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        return input;
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private void addText(String value, int size, int color, boolean bold, int top, int bottom) {
        TextView view = text(value, size, color, bold);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.topMargin = dp(top); params.bottomMargin = dp(bottom);
        content.addView(view, params);
    }

    private Button button(String value, boolean primary) {
        Button button = new Button(this);
        button.setText(value);
        button.setAllCaps(false);
        button.setTextSize(15);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setTextColor(primary ? 0xFFFFFFFF : NAVY);
        button.setPadding(dp(14), dp(8), dp(14), dp(8));
        button.setBackground(roundRect(primary ? BLUE : 0xFFE7EFFB, 14));
        return button;
    }

    private Button smallButton(String value) {
        Button button = button(value, false);
        button.setTextSize(13);
        button.setMinHeight(dp(42));
        return button;
    }

    private TextView statusView() { return text("", 14, MUTED, false); }
    private void showMessage(TextView view, String message, boolean error) { view.setText(message == null ? "Terjadi kesalahan." : message); view.setTextColor(error ? 0xFFB42318 : MUTED); }
    private void setBusy(Button button, boolean busy, String label) { button.setEnabled(!busy); button.setText(label); button.setAlpha(busy ? 0.72f : 1f); }
    private LinearLayout column() { LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); return layout; }
    private void addSpacer(int size) { View spacer = new View(this); content.addView(spacer, new LinearLayout.LayoutParams(1, dp(size))); }
    private LinearLayout.LayoutParams fieldParams() { LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2); params.bottomMargin = dp(12); return params; }
    private LinearLayout.LayoutParams buttonParams() { LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, dp(52)); params.bottomMargin = dp(12); return params; }
    private GradientDrawable roundRect(int color, int radius) { GradientDrawable bg = new GradientDrawable(); bg.setColor(color); bg.setCornerRadius(dp(radius)); return bg; }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private String normalizeApi(String value) { String trimmed = value.trim(); while (trimmed.endsWith("/")) trimmed = trimmed.substring(0, trimmed.length() - 1); return trimmed; }
    private String nextLabel(String status) { return "received".equals(status) ? "Terima & mulai proses" : "preparing".equals(status) ? "Tandai siap" : "Tandai selesai"; }
    private String money(long amount) { return NumberFormat.getCurrencyInstance(new Locale("id", "ID")).format(amount).replace(",00", ""); }
}
