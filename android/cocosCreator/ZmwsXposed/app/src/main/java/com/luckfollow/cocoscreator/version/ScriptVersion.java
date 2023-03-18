package com.luckfollow.cocoscreator.version;

import android.app.AndroidAppHelper;
import android.app.Application;
import android.content.pm.ApplicationInfo;
import android.util.Log;

import java.io.File;

import cn.hutool.core.io.FileUtil;

/**
 * Cocos Creator 的 打包 jsc 文件路径
 */
public interface ScriptVersion {
    String TAG = "ScriptVersion";
    String hotUpdatePath = "/zmonline-remote-asset/src/";
    String projectName = "project.jsc";


    static String getVersionScriptPath() {
        Application application = AndroidAppHelper.currentApplication();
        String dataDir = application.getFilesDir().getAbsolutePath();
        String scriptLocation = dataDir + hotUpdatePath;
        return scriptLocation;
    }

    static String getVersionScriptFile() {
        String versionScriptPath = getVersionScriptPath();
        if (!FileUtil.exist(versionScriptPath)) {
            FileUtil.mkdir(versionScriptPath);
        }
        return versionScriptPath + projectName;
    }

    static boolean clearScriptFiles() {
        //清空脚本目录内的文件 避免更改文件名出现冗余
        String versionScriptFile = getVersionScriptFile();
        if (new File(versionScriptFile).exists()) {
            FileUtil.del(versionScriptFile);
        }
        return true;
    }
}
