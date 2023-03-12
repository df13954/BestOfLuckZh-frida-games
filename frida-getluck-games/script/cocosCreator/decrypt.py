# reference for https://github.com/hluwa/Cocos2dHunter/blob/master/xxtea.py
import gzip
import os
import sys
from gzip import GzipFile
from io import BytesIO
import click
import xxtea


# 获取 指定路径下 所有 .jsc 文件
def find_targets(path):
    result = []
    if not os.path.exists(path):
        return []
    if not os.path.isdir(path):
        return [path]
    # root 当前目录 dirs 子目录 files 子文件夹
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".jsc"):
                result.append(os.path.join(root, file))
    return result


# 这个是 hluwa的 暂时放着
def row_main(path, key, force=False):
    result = []
    targets = find_targets(path)
    for target in targets:
        # .jsc 截取 成 .js
        out = target[:-1]
        if os.path.exists(out) and force:
            click.secho("file is existed, please use `-f` to overwrite it: {}".format(out), fg="yellow")
            result.append(out)
            continue

        content = open(target, "rb").read()
        if key:
            # 解密数据
            content = xxtea.decrypt(content, key)
        # 如果解密出的数据是 gzip 则需要解压
        if content[:2] == b'\037\213':
            try:
                mock_fp = BytesIO(content)
                gz = GzipFile(fileobj=mock_fp)
                content = gz.read()
            except Exception as e:
                import traceback
                click.secho("ungz fault {} in {}".format(e, traceback.format_tb(sys.exc_info()[2])[-1]), fg="red")
        # 输出到 js
        with open(out, 'wb') as _:
            _.write(content)

        click.secho("decrypt successful: {}".format(out), fg="green")
        result.append(out)
    return result


if __name__ == '__main__':
    # 提取要解码的 jsc 目录
    src_path = r"C:\Users\hp\Desktop\cocos-decrypt\src"
    out_path = r"C:\Users\hp\Desktop\cocos-decrypt\decrypt"
    key = b"a133430b-7bff-4e"
    src_len = len(src_path)
    # 重复是否强制替换
    force = True

    targets = find_targets(src_path)
    for target in targets:
        # .jsc 截取 成 .js
        out = target[:-1]
        # 输出路径
        out = out_path + out[src_len:]
        if os.path.exists(out) and force:
            os.remove(out)

        out_relative = os.path.dirname(out)

        if not os.path.exists(out_relative):
            os.makedirs(out_relative)

        # 读取二进制数据
        content = open(target, "rb").read()

        if key:
            # 解密数据
            content = xxtea.decrypt(content, key)
        # 如果解密的数据出来的是 gzip 则 解压
        if content[:2] == b'\037\213':
            try:
                content = gzip.decompress(content)
            except Exception as e:
                import traceback

                click.secho("ungz fault {} in {}".format(e, traceback.format_tb(sys.exc_info()[2])[-1]), fg="red")

        # 输出到 js
        with open(out, 'wb') as _:
            _.write(content)
            print("out:", out)
