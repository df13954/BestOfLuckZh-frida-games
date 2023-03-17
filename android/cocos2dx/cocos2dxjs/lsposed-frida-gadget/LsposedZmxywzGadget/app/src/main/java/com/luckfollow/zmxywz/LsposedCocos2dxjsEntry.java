package com.luckfollow.zmxywz;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Application;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.util.Log;
import android.widget.EditText;

import com.luckfollow.zmxywz.ui.VerityAssistView;
import com.luckfollow.zmxywz.utils.AppHelp;
import com.luckfollow.zmxywz.utils.FridaGadgetUtil;
import com.luckfollow.zmxywz.version.ScriptVersion;
import com.luckfollow.zmxywz.version.VersionLocal;
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
    private static final String TAG = "LsposedCocos2dxjsEntry";
    final String mainActivityClass = "org.cocos2dx.lib.Cocos2dxActivity";

    @Override
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) throws Throwable {
        final String matchPackage = "com.zmsy.zmxywz";
//        final String matchPackage = "com.example.practicegadget1";
        Log.d(TAG, "lpparam.packageName:" + lpparam.packageName);
        if (lpparam.packageName.startsWith(matchPackage)) {
            gadgetInit(lpparam);
            cocos2dxjsActivityHandler(lpparam);
        }
    }

    /**
     * 1. gadget 初始化
     * 通过 LspModuleClassLoader 模块类加载器 提取 当前模块的 apk 路径
     * 在这个apk 路径中 包含我们libs 中的 libgadget.so
     * 注意一点 需要配置 ndk abi 过滤 这个过滤在 build.gradle 里面
     * 否则当前模块可能不会把gadget 打包进去
     * 除了这个还需要配置 Jnilib 来源 把我们 libs 目录设置为 jni 目录
     *
     * @param lpparam
     */
    private void gadgetInit(XC_LoadPackage.LoadPackageParam lpparam) {
        //获取要把脚本导出的位置 配置 gadget 的 script-directory 配置
        String versionScriptPath = ScriptVersion.getVersionScriptPath();
        Log.d(TAG, "versionScriptPath: " + versionScriptPath);
        FridaGadgetUtil.gadgetInitByLsposed(lpparam, "gadget", "gadget", FridaGadgetUtil.ensureScriptDirectory(versionScriptPath));
    }

    /**
     * 加载 /assets/script 中脚本
     */
    public void localScriptLoad(XC_LoadPackage.LoadPackageParam lpparam) {
        final String moduleScriptName = "index.js";
        VersionLocal.handleVersion(moduleScriptName);
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

                    verityAssistView.assertSignature(context.getApplication(), versionEntity);
                    AppHelp.mainLooperRun(() -> verityAssistView.checkToken(context, versionEntity));
                }));

            }

            @Override
            protected void afterHookedMethod(MethodHookParam param) throws Throwable {
                super.afterHookedMethod(param);
            }
        });
    }


}
