package com.luckfollow.cocoscreator.utils;

import android.util.Log;

import java.lang.reflect.Method;
import java.util.List;

import cn.hutool.core.util.ReflectUtil;
import cn.hutool.core.util.StrUtil;

/**
 * 基于lsposed 工具
 */
public class LsposedHelp {
    private static final String TAG = "LsposedHelp";

    public static ClassLoader getLsposedClassLoader() {
        //写在 Lsposed 中的类肯定是 来自于 lsposed 类加载器
        return LsposedHelp.class.getClassLoader();
    }

    /**
     * 在lsposed BaseDexClassLoader 中可以获取到 lib 库
     * @return
     */
    public static List<String> getPluginLibPaths() {
        ClassLoader lsposedClassLoader = getLsposedClassLoader();

        Class<? extends ClassLoader> classLoaderClass = lsposedClassLoader.getClass();
        Log.d(TAG,"classLoaderClass:" + classLoaderClass.getName());

        Method getLdLibraryPathMethod = ReflectUtil.getMethod(classLoaderClass, "getLdLibraryPath");
        Log.d(TAG,"getLdLibraryPathMethod:" + getLdLibraryPathMethod);

        String ldLibraryPath = ReflectUtil.invoke(lsposedClassLoader,getLdLibraryPathMethod);
        List<String> libPaths = StrUtil.split(ldLibraryPath, ":");
        Log.d(TAG,"libPaths:" + libPaths);
        return libPaths;
    }




}
