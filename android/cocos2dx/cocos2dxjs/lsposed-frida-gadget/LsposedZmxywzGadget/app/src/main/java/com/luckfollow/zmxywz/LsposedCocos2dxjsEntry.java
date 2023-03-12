package com.luckfollow.zmxywz;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.util.Log;
import android.widget.EditText;

import com.luckfollow.zmxywz.utils.AppHelp;
import com.luckfollow.zmxywz.utils.FridaGadgetUtil;
import com.luckfollow.zmxywz.version.VersionRequest;
import com.luckfollow.zmxywz.version.entity.VersionEntity;

import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.XposedBridge;
import de.robv.android.xposed.XposedHelpers;
import de.robv.android.xposed.callbacks.XC_LoadPackage;

/**
 * 基于 cocos2dxjs 对 frida gadget 的持久化
 * 根据源码
 * cocos2dxjs 会通过 Cocos2dxActivity.onCreate 进行加载 cocos2dxjs.so
 * 我们需要在此之前加载我们 libgadget.so
 */
public class LsposedCocos2dxjsEntry implements IXposedHookLoadPackage {
    private static final String TAG = "LsposedEntry";
    final String mainActivityClass = "org.cocos2dx.lib.Cocos2dxActivity";

    @Override
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) throws Throwable {
        final String matchPackage = "com.zmsy.zmxywz";
        if (lpparam.packageName.startsWith(matchPackage)) {
            gadgetInit(lpparam);
            cocos2dxjsActivityHandler(lpparam);
        }
    }

    private void gadgetInit(XC_LoadPackage.LoadPackageParam lpparam) {
        String versionScriptPath = VersionRequest.getVersionScriptPath();
        Log.d(TAG, "versionScriptPath: " + versionScriptPath);
        FridaGadgetUtil.gadgetInitByLsposed(lpparam, "gadget", "gadget", FridaGadgetUtil.ensureScriptDirectory(versionScriptPath));
    }


    public void cocos2dxjsActivityHandler(XC_LoadPackage.LoadPackageParam lpparam) {

        Class<?> MainActivityClass = XposedHelpers.findClass(mainActivityClass, lpparam.classLoader);
        Log.d(TAG, "Cocos2dxActivity: " + MainActivityClass);
        XposedHelpers.findAndHookMethod(MainActivityClass, "onCreate", Bundle.class, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                Activity context = (Activity) param.thisObject;
                // 创建一个 EditText 控件
                final EditText editText = new EditText(context);

                VersionRequest.reqVersion((versionEntity -> {
                    Log.d(TAG, "接收到的内容:" + versionEntity);
                    AppHelp.mainLooperRun(() -> checkToken(editText, context, versionEntity));
                }));

            }

            @Override
            protected void afterHookedMethod(MethodHookParam param) throws Throwable {
                super.afterHookedMethod(param);
            }
        });
    }

    private void checkToken(EditText editText, Context context, VersionEntity versionEntity) {
        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        builder.setTitle("校验令牌");
        builder.setMessage("请输入令牌：");
        builder.setView(editText);

        builder.setPositiveButton("确定", (dialog, which) -> {
            // 在这里处理用户输入的内容
            String content = editText.getText().toString();
            VersionRequest.handleVersion(context, content, versionEntity);
        });

        builder.show();
    }
}
