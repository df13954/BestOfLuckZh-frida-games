package com.luckfollow.cocoscreator.version;

import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

import cn.hutool.core.io.IoUtil;

public class VersionLocal {
    static String TAG = "VersionLocal";

    /**
     * 兼容 VersionRequest 改成读取本地 assets/script 资源内脚本
     * 并将脚本放在 ScriptVersion.getVersionScriptPath() 下
     */
    public static void handleVersion(String scriptName) {
        ClassLoader classLoader = VersionLocal.class.getClassLoader();
        try {
            URL moduleResource = classLoader.getResource("assets/script/" + scriptName);
            Log.d(TAG, "moduleResource:" + moduleResource.getPath());
            InputStream inputStream = moduleResource.openStream();

            ScriptVersion.clearScriptFiles();

            File versionScriptFile = new File(ScriptVersion.getVersionScriptFile());
            FileOutputStream scriptOutputStream = new FileOutputStream(versionScriptFile);
            IoUtil.copy(inputStream, scriptOutputStream);
            Log.d(TAG, "versionScriptPath:" + versionScriptFile.getAbsolutePath());
        } catch (IOException e) {
            Log.e(TAG, e.getMessage(), e);
        }
    }
}
