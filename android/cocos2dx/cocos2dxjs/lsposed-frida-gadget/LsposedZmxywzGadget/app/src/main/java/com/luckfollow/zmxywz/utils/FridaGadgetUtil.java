package com.luckfollow.zmxywz.utils;

import android.os.Build;
import android.util.Log;

import java.io.BufferedOutputStream;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.core.io.file.FileNameUtil;
import cn.hutool.core.util.StrUtil;
import de.robv.android.xposed.callbacks.XC_LoadPackage;

/**
 * 用于生成 FridaGadget 配置内容 等等操作
 */
public class FridaGadgetUtil {
    private static final String TAG = "FridaGadgetUtil";

    public static String listen(String address, String port) {
        String template = "{\n" +
                "  \"interaction\": {\n" +
                "    \"type\": \"listen\",\n" +
                "    \"address\": \"{}\",\n" +
                "    \"port\": {},\n" +
                "    \"on_port_conflict\": \"fail\",\n" +
                "    \"on_load\": \"wait\"\n" +
                "  }\n" +
                "}";
        return StrUtil.format(template, address, port);
    }

    public static String listen() {
        return listen("127.0.0.1", "27042");
    }

    public static String script(String path) {
        String template = "{\n" +
                "  \"interaction\": {\n" +
                "    \"type\": \"script\",\n" +
                "    \"path\": \"{}\"\n" +
                "  }\n" +
                "}";
        return StrUtil.format(template, path);
    }

    public static String scriptDirectory(String path) {
        String template = "{\n" +
                "  \"interaction\": {\n" +
                "    \"type\": \"script-directory\",\n" +
                "    \"path\": \"{}\"\n" +
                "  }\n" +
                "}";
        return StrUtil.format(template, path);
    }

    public static String ensureScriptDirectory(String path) {
        //确保目录
        FileUtil.mkdir(path);
        return scriptDirectory(path);
    }

    public static String configName(String libraryName) {
        String mapLibraryName = System.mapLibraryName(libraryName + ".config");
        return mapLibraryName;
    }

    /**
     * 理论上将 xposed 中 gadget 库复制到 饿hook应用的数据目录下
     *
     * @param libraryPath 库路径 由当前xposed 插件提供 理论上时一个 apk 路径
     * @param transferDir 转移路径 目标应用数据存储目录
     * @param configData  配置数据 gadget 配置数据
     * @return 转移到的最终目录
     */
    public static String copyFridaGadget(String libraryPath, String transferDir, String configData) {
        //mkdir dir and copy lib to transfer dir
        String transferFile = AppHelp.copyApkLibrary(libraryPath, transferDir);
        if (StrUtil.isEmpty(transferFile)) {
            return null;
        }
        String libName = FileNameUtil.getName(transferFile);
        String configFileName = FileUtil.getPrefix(libName) + ".config" + "." + FileUtil.getSuffix(libName);
        Log.d(TAG, "configFileName:" + configFileName);

        String fridaGadgetDir = FileUtil.getParent(transferFile, 1);
        String absoluteConfigName = fridaGadgetDir + "/" + configFileName;
        Log.d(TAG, "absoluteConfigName:" + absoluteConfigName);

        ByteArrayInputStream configInputStream = IoUtil.toStream(configData, StandardCharsets.UTF_8);
        BufferedOutputStream outputStream = FileUtil.getOutputStream(absoluteConfigName);
        IoUtil.copy(configInputStream, outputStream);

        return fridaGadgetDir;
    }


    /**
     * 加载gadget so
     * 原理是通过当前 lsposed 插件 中打包的 so 复制到 目标应用数据目录下 进行加载。
     * 这样的好处是可以动态的 加载 gadget.config.so
     *
     * @param lpparam      lsposed 加载应用参数
     * @param libraryName  gadget 库名称
     * @param toDir        到应用目录中存储的目录 推荐填 gadget
     * @param gadgetConfig gadget配置数据 参考官网  配置有listen , script , script-dir
     */
    public static void gadgetInitByLsposed(XC_LoadPackage.LoadPackageParam lpparam,
                                           String libraryName,
                                           String toDir,
                                           String gadgetConfig) {
        List<String> currentPluginGadgetPaths = AppHelp.findLibPath(LsposedHelp.getPluginLibPaths(), libraryName);
        Log.d(TAG, "pluginGadgetPaths:" + currentPluginGadgetPaths);

        String dataDir = lpparam.appInfo.dataDir;
        final String transferGadgetDir = dataDir + "/" + toDir;
        Log.d(TAG, "toAppPath:" + transferGadgetDir);

        //[x86_64, x86, arm64-v8a, armeabi-v7a, armeabi]
        Log.d(TAG, "supportABI:" + Arrays.toString(Build.SUPPORTED_ABIS));
        Optional<String> bestPluginGadget = currentPluginGadgetPaths.stream()
                .filter(AppHelp::isSupportABIByLibraryPath)
                .findAny();
        String pluginGadgetPath;
        if (bestPluginGadget.isPresent()) {
            pluginGadgetPath = bestPluginGadget.get();
        } else {
            pluginGadgetPath = CollUtil.get(currentPluginGadgetPaths, 0);
        }
        if(StrUtil.isNotBlank(pluginGadgetPath)){
            Log.d(TAG, "selectPluginGadgetPath:" + pluginGadgetPath);
            String appGadgetDir = FridaGadgetUtil.copyFridaGadget(pluginGadgetPath, transferGadgetDir, gadgetConfig);
            String gadgetSo = appGadgetDir + "/" + System.mapLibraryName(libraryName);
            Log.d(TAG, "loadGadgetSo:" + gadgetSo);
            System.load(gadgetSo);
        }
    }

}
