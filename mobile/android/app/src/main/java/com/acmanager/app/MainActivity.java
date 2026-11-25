package com.acmanager.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

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
  }
}
