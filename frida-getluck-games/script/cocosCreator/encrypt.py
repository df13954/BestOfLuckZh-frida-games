import gzip
import os
import xxtea


# 获取 指定路径下 所有 .js 文件
def find_targets(path):
    result = []
    if not os.path.exists(path):
        return []
    if not os.path.isdir(path):
        return [path]
    # root 当前目录 dirs 子目录 files 子文件夹
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".js"):
                result.append(os.path.join(root, file))
    return result


# 加密
if __name__ == '__main__':
    # 从 解密到加密路径
    src_path = r"C:\Users\hp\Desktop\cocos-decrypt\dumpjs"
    out_path = r"C:\Users\hp\Desktop\cocos-decrypt\encrypt-jsc"
    key = b"a133430b-7bff-4e"
    src_len = len(src_path)
    # 重复是否强制替换
    force = True
    # 是否 gzip 压缩 大部分情况是需要的
    encrypt_gzip = True

    targets = find_targets(src_path)
    for target in targets:
        #  .js => .jsc
        out = target[:-3] + ".jsc"

        # 输出路径
        out = out_path + out[src_len:]

        if os.path.exists(out) and force:
            os.remove(out)

        out_relative = os.path.dirname(out)

        if not os.path.exists(out_relative):
            os.makedirs(out_relative)

        # 读取二进制数据
        content = open(target, "rb").read()

        if encrypt_gzip:
            content = gzip.compress(content, gzip._COMPRESS_LEVEL_TRADEOFF)

        if key:
            # 加密数据
            content = xxtea.encrypt(content, key)

        # 输出到 jsc
        with open(out, 'wb') as _:
            _.write(content)
            print("out:", out)
