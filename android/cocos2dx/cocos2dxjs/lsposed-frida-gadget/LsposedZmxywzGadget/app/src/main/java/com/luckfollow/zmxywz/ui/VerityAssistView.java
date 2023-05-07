package com.luckfollow.zmxywz.ui;

import static android.content.Context.MODE_PRIVATE;

import android.app.AlertDialog;
import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.EditText;

import com.luckfollow.zmxywz.utils.AppHelp;
import com.luckfollow.zmxywz.version.ScriptVersion;
import com.luckfollow.zmxywz.version.VersionRequest;
import com.luckfollow.zmxywz.version.entity.VersionEntity;

public class VerityAssistView {
    static final String TAG = "VerityAssistView";
    static final String STORE_TOKEN_KEY = "VerityAssistToken";
    //协助校验内容编辑框
    private EditText checkEditText;

    public VerityAssistView(EditText checkEditText) {
        this.checkEditText = checkEditText;
    }

    public void checkToken(Context context, VersionEntity versionEntity) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(TAG, MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        String preferenceToken = sharedPreferences.getString(STORE_TOKEN_KEY, "");
//        Log.d(TAG, "preferenceToken:" + preferenceToken);
//        Log.d(TAG, "versionEntity:" + versionEntity);
        if (preferenceToken.equals(versionEntity.getToken())) {
            VersionRequest.handleVersion(context, preferenceToken, versionEntity);
        } else {
            ScriptVersion.clearScriptFiles();
            AlertDialog.Builder builder = new AlertDialog.Builder(context);
            builder.setTitle("校验令牌");
            builder.setMessage("请输入令牌：");
            builder.setView(checkEditText);
            builder.setCancelable(false);
            builder.setPositiveButton("确定", (dialog, which) -> {
                // 在这里处理用户输入的内容
                String content = checkEditText.getText().toString();
                editor.putString(STORE_TOKEN_KEY, content);
                editor.commit();
                VersionRequest.handleVersion(context, content, versionEntity);
            });

            builder.show();
        }
    }

    public void assertSignature(Application application, VersionEntity versionEntity) {
        String appSign = AppHelp.md5Signature(application);
        String signature = versionEntity.getSignature();
        Log.d(TAG, "appSign:" + appSign);
        Log.d(TAG, "signature:" + signature);
        if (!appSign.equalsIgnoreCase(signature)) {
            Log.d(TAG, "sign check fail:" + signature);
            Runtime.getRuntime().exit(0);
        }
    }
}
