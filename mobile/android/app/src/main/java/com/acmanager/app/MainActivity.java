package com.acmanager.app;

import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    Window window = getWindow();
    WindowCompat.setDecorFitsSystemWindows(window, true);
    window.setStatusBarColor(Color.parseColor("#0e1525"));
    window.setNavigationBarColor(Color.parseColor("#0e1525"));

    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(window, window.getDecorView());
    if (controller != null) {
      controller.setAppearanceLightStatusBars(false);
      controller.setAppearanceLightNavigationBars(false);
    }

    View content = findViewById(android.R.id.content);
    if (content != null) {
      ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
        Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
        v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
        return insets;
      });
    }

    if (getBridge() != null && getBridge().getWebView() != null) {
      getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(getBridge()) {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
          Uri uri = request.getUrl();
          if (uri == null) return false;
          String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
          String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();

          boolean isAppHost =
              host.equals("localhost")
                  || host.equals("127.0.0.1")
                  || scheme.equals("capacitor")
                  || scheme.equals("ionic")
                  || scheme.equals("file");

          if (!isAppHost && (scheme.equals("http") || scheme.equals("https") || scheme.equals("geo") || scheme.equals("tel") || scheme.equals("mailto"))) {
            return openOutside(uri);
          }
          return super.shouldOverrideUrlLoading(view, request);
        }
      });
    }
  }

  private boolean openOutside(Uri uri) {
    try {
      Intent intent = new Intent(Intent.ACTION_VIEW, uri);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      startActivity(intent);
      return true;
    } catch (Exception ignored) {
      return false;
    }
  }
}
