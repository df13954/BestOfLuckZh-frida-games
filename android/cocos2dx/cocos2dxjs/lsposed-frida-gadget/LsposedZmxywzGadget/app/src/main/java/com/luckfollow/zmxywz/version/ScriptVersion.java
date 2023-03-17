package com.luckfollow.zmxywz.version;

import android.app.AndroidAppHelper;
import android.content.pm.ApplicationInfo;
import android.util.Log;

import cn.hutool.core.io.FileUtil;

/**
 * frida gadget 动态版本脚本
 * 将 gadget.config 会 配置 script-directory 读取
 * ScriptVersion。getVersionScriptPath() 下的脚本。
 * 所以我们只要动态的处理这个目录的脚本
 * 就可以完成动态脚本加载
 */
public interface ScriptVersion {
    String TAG = "ScriptVersion";


    static ApplicationInfo getApplicationInfo() {
        return AndroidAppHelper.currentApplicationInfo();
    }

    static String getVersionScriptPath() {
        String dataDir = getApplicationInfo().dataDir;
        String scriptLocation = dataDir + "/" + "gadget-script";
        return scriptLocation;
    }

    static String getVersionScriptFile() {
        String versionScriptPath = getVersionScriptPath();
        if (!FileUtil.exist(versionScriptPath)) {
            FileUtil.mkdir(versionScriptPath);
        }
        return versionScriptPath + "/" + "index.js";
    }

    static boolean clearScriptFiles(){
        //清空脚本目录内的文件 避免更改文件名出现冗余
        String outPath = ScriptVersion.getVersionScriptPath();
        FileUtil.walkFiles(FileUtil.file(outPath), file -> {
            FileUtil.del(file);
            Log.d(TAG, "del:" + file);
        });
        return true;
    }
}
