package com.luckfollow.cocoscreator;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.widget.EditText;

import com.luckfollow.cocoscreator.ui.VerityAssistView;
import com.luckfollow.cocoscreator.utils.AppHelp;
import com.luckfollow.cocoscreator.version.VersionRequest;

import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.XposedHelpers;
import de.robv.android.xposed.callbacks.XC_LoadPackage;

/**
 * 基于cocos creator 相对来说要简单
 * 因为cocos creator 为了兼容 v8 和 spider monkey 引擎 并没有使用字节码
 * 而是使用 xxxtea 进行包装
 * 所以我们不需要使用 evalScript 这种 植入 js hook 的方式
 * 直接将我们修改的 jsc 文件 替换即可
 * 替换要注意热更新
 * 热更新地址你需要 读取 fileUtils.setSearch 路径
 */
public class ZmwsXposedEntry implements IXposedHookLoadPackage {
    private static final String TAG = "ZmwsXposedEntry";
    final String mainActivityClass = "org.cocos2dx.lib.Cocos2dxActivity";
    final String matchPackage = "com.xm4399.zmws";

    //        final String matchPackage = "com.example.practicegadget1";
    @Override
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) throws Throwable {
        Log.d(TAG, "lpparam.packageName:" + lpparam.packageName);
        if (lpparam.packageName.startsWith(matchPackage)) {
            cocos2dxjsActivityHandler(lpparam);
        }
    }


    public void cocos2dxjsActivityHandler(XC_LoadPackage.LoadPackageParam lpparam) {

        Class<?> MainActivityClass = XposedHelpers.findClass(mainActivityClass, lpparam.classLoader);
        Log.d(TAG, "Cocos2dxActivity: " + MainActivityClass);
        XposedHelpers.findAndHookMethod(MainActivityClass, "onCreate", Bundle.class, new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                Activity context = (Activity) param.thisObject;
                VerityAssistView verityAssistView = new VerityAssistView(new EditText(context));
                VersionRequest.reqVersion((versionEntity -> {
//                    Log.d(TAG, "versionEntity: " + versionEntity);
                    if (verityAssistView.assertSignature(context.getApplication(), versionEntity)) {
                        AppHelp.mainLooperRun(() -> verityAssistView.checkToken(context, versionEntity));
                    }
                }));

            }

            @Override
            protected void afterHookedMethod(MethodHookParam param) throws Throwable {
                super.afterHookedMethod(param);
            }
        });
    }
}
