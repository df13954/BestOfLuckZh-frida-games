package com.luckfollow.cocoscreator.version;


import static com.luckfollow.cocoscreator.version.ScriptVersion.getVersionScriptFile;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.gson.Gson;
import com.luckfollow.cocoscreator.utils.AppHelp;
import com.luckfollow.cocoscreator.version.entity.VersionEntity;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.IoUtil;
import cn.hutool.core.util.HexUtil;
import cn.hutool.core.util.StrUtil;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

public class VersionRequest {
    private static final String TAG = "VersionUtil";
//    private static final String versionGet = "https://gitlab.com/zhanghecn/hotgame/-/raw/main/zmws/free/version-zmws.json";
    private static final String versionGet = "https://gitlab.com/zhanghecn/hotgame/-/raw/main/zmws/custom-made/version-zmws.json";
    static OkHttpClient okHttpClient = new OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build();

    static Gson gson = new Gson();
    /**
     * okhttpclient 自带 enqueue 异步排队执行请求
     * 但某些情况还是需要异步执行
     */
    static ExecutorService executorService = Executors.newFixedThreadPool(1);

    /**
     * 请求版本信息 由于是异步的 需要 @entityConsumer 进行处理
     *
     * @param entityConsumer
     */
    public static void reqVersion(Consumer<VersionEntity> entityConsumer) {
        final String address = versionGet;

        Request request = new Request.Builder()
                .url(address)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.63")
                .get()
                .build();

        okHttpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                e.printStackTrace();
                Log.e(TAG, e.getMessage(), e);
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                ResponseBody responseBody = response.body();
                String bodyContent = responseBody.string();
                VersionEntity versionEntity = new DecryptContext<>(bodyContent, VersionEntity.class).decode();
                entityConsumer.accept(versionEntity);
            }
        });
    }


    /**
     * 将 远程版本脚本下载到 脚本目录里
     * 这是一种可动态更新的 gadget 示例的关键。
     * gadget 推荐配置 script-directory
     *
     * @param address 下载地址
     * @return
     */
    private static boolean downloadScript(String address) {
        Request request = new Request.Builder()
                .url(address)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.63")
                .get()
                .build();
        try {
            Response response = okHttpClient.newCall(request).execute();
            if (response.isSuccessful()) {
                //清空脚本目录内的文件 避免更改文件名出现冗余
                ScriptVersion.clearScriptFiles();

                String outFile = getVersionScriptFile();
                InputStream inputStream = response.body().byteStream();
                BufferedOutputStream outputStream = FileUtil.getOutputStream(outFile);
                IoUtil.copy(inputStream, outputStream);
                return true;
            }
            return false;
        } catch (IOException e) {
            Log.e(TAG, e.getMessage(), e);
            return false;
        }
    }

    public static void handleVersion(Context context, String token, VersionEntity versionEntity) {
        String tken = versionEntity.getToken();
        if (tken.equals(token)) {
            executorService.execute(() -> {
                //[x86_64, x86, arm64-v8a, armeabi-v7a, armeabi]
                Log.d(TAG, "校验成功 获取cpu类型:" + Arrays.toString(Build.SUPPORTED_ABIS));

                //System.loadLibrary("frida-gadget-16.0.8-android-x86.so");
                long size = FileUtil.size(new File(getVersionScriptFile()));
                Log.d(TAG, "size1:" + size);
                Log.d(TAG, "size2:" + versionEntity.getSize());
                DialogInterface.OnClickListener confirm = (dialog, which) -> {
                };
                if (size != versionEntity.getSize()) {
                    String address = versionEntity.getAddress();
                    boolean downRet = downloadScript(address);
                    Log.d(TAG, "downRet:" + downRet);
                    AppHelp.mainLooperRun(() -> {
                        new AlertDialog.Builder(context).setTitle("更新版本")
                                .setMessage(StrUtil.format("更新版本信息:{} 重启生效", versionEntity.getVersion()))
                                .setPositiveButton("确定", confirm)
                                .show();
                    });
                } else {
                    AppHelp.mainLooperRun(() -> {
                        new AlertDialog.Builder(context).setTitle("当前版本")
                                .setMessage(StrUtil.format("当前版本信息:{}", versionEntity.getContent()))
                                .setPositiveButton("确定", confirm)
                                .show();
                    });
                }
            });
            return;
        } else {
            Log.d(TAG, "ERROR Token");
            System.exit(0);
        }
    }

    static class DecryptContext<T> {
        private String data;
        private Class<T> decodeType;

        public DecryptContext(String data, Class<T> decodeType) {
            this.data = data;
            this.decodeType = decodeType;
        }

        public T decode() {
            Map<String, String> map = gson.fromJson(this.data, Map.class);
            List<String> split = StrUtil.split(map.get("data"), ".");
            String keyStr = split.get(0);
            String encryptStr = split.get(1);

            Log.d(TAG, "keyStr:" + keyStr);
            Log.d(TAG, "encryptStr:" + encryptStr);

            SecretKey secretKeySpec = new SecretKeySpec(HexUtil.decodeHex(keyStr), "AES");

            T decryptObj = null;
            try {
                Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
                cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);

                byte[] decryptData = cipher.doFinal(HexUtil.decodeHex(encryptStr));
                String jsonData = new String(decryptData);
                decryptObj = gson.fromJson(jsonData, decodeType);
            } catch (NoSuchAlgorithmException e) {
                e.printStackTrace();
            } catch (Exception e) {
                Log.e(TAG, e.getMessage(), e);
            }
            return decryptObj;
        }
    }
}
