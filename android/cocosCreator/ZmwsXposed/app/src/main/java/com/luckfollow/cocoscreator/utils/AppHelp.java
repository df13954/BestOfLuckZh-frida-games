package com.luckfollow.cocoscreator.utils;

import android.app.Application;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.jar.JarFile;
import java.util.zip.ZipEntry;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.HexUtil;
import cn.hutool.core.util.StrUtil;

/**
 * 基于被hook 应用工具
 * 或常见的apk 操作
 */
public class AppHelp {
    private static final String TAG = "AppHelp";

    private static final String zipSeparator = "!/";

    /**
     * 查找库在 指定 库集合对应位置
     *
     * @param libPaths    库路径
     * @param libraryName 库名称
     * @return
     */
    public static List<String> findLibPath(List<String> libPaths, String libraryName) {
        List<String> libs = new ArrayList<>();
        //映射本地库名称 如 lib + libraryName + .so
        String fileName = System.mapLibraryName(libraryName);
        Log.d(TAG, "mapLibraryName:" + fileName);
        for (String libPath : libPaths) {
            //目前只针对 apk 里面的目录
            if (libPath.contains(zipSeparator)) {
                // 0 apk 路径 1 库路径
                String[] split = libPath.split(zipSeparator, 2);
                JarFile jarFile = null;
                try {
                    jarFile = new JarFile(split[0]);
                    String entryName = split[1] + '/' + fileName;
                    Log.d(TAG, "findEntry:" + entryName);
                    ZipEntry entry = jarFile.getEntry(entryName);
                    if (entry != null && entry.getMethod() == ZipEntry.STORED) {
                        String foundLibPath = split[0] + zipSeparator + entryName;
                        libs.add(foundLibPath);
                    }
                } catch (IOException e) {
                    Log.e(TAG, e.getMessage(), e);
                } finally {
                    IoUtil.close(jarFile);
                }
            }
        }
        return libs;
    }

    public static String extraApkPathForLib(String libPath) {
        String[] split = libPath.split(zipSeparator, 2);
        return split[0];
    }

    public static String extraLibPathForLib(String libPath) {
        String[] split = libPath.split(zipSeparator, 2);
        return split[1];
    }


    /**
     * 针对apk 里面的 lib 进行 copyToDir
     *
     * @return 返回copy到的路径
     */
    public static String copyApkLibrary(String libraryPath, String transferDir) {
        String[] split = libraryPath.split(zipSeparator);
        String apkDir = split[0];
        JarFile jarFile = null;
        try {
            jarFile = new JarFile(apkDir);
            String filename = split[1];
            ZipEntry entry = jarFile.getEntry(filename);
            if (entry != null && entry.getMethod() == ZipEntry.STORED) {
                InputStream inputStream = jarFile.getInputStream(entry);

                String transferFile = transferDir + "/" + filename;
                Log.d(TAG, "transferFile:" + transferFile);

                File dirs = FileUtil.mkParentDirs(transferFile);
                Log.d(TAG, "parentDir:" + dirs);

                FileUtil.del(transferFile);

                BufferedOutputStream outputStream = FileUtil.getOutputStream(transferFile);
                IoUtil.copy(inputStream, outputStream);
                return transferFile;
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            IoUtil.close(jarFile);
        }
        return null;
    }

    /**
     * library 库 是否受支持的 library api
     * 由于实现限制 根据目录中包含特征来判断
     * 可能会误判这取决于你目录位置  大部分情况不会
     *
     * @return
     */
    public static boolean isSupportABIByLibraryPath(String libraryPath) {
        String[] supportedAbis = Build.SUPPORTED_ABIS;
        String firstAbi = ArrayUtil.get(supportedAbis, 0);
        return libraryPath.contains(firstAbi);
    }

    public static boolean isSupportABIByLibraryPath(String libraryPath, ApplicationInfo applicationInfo) {
        String app_abi = getAbiByLibDir(applicationInfo);
        return libraryPath.contains(app_abi);
    }

    public static String getAbiByLibDir(ApplicationInfo applicationInfo) {
        String nativeLibraryDir = applicationInfo.nativeLibraryDir;
        List<String> split = StrUtil.split(nativeLibraryDir, "/");
        return CollUtil.getLast(split);
    }

    public static boolean mainLooperRun(Runnable runnable) {
        Handler handler = new Handler(Looper.getMainLooper());
        return handler.post(runnable);
    }


    public static String md5Signature(Application application) {

        try {
            PackageInfo packageInfo = application.getPackageManager().getPackageInfo(application.getPackageName(), PackageManager.GET_SIGNATURES);
            Signature signature = ArrayUtil.get(packageInfo.signatures, 0);
            byte[] signData = signature.toByteArray();

            MessageDigest md5 = MessageDigest.getInstance("md5");
            byte[] digest = md5.digest(signData);

            return HexUtil.encodeHexStr(digest,false);
        } catch (Exception e) {
            Log.e(TAG, e.getMessage(), e);
        }
        return StrUtil.EMPTY;
    }
}
