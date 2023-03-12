import codecs
import frida
import sys
import os

from frida.core import Script

script: Script

# dump 路径
dump_path = r"C:\Users\hp\Desktop\cocos-decrypt\dumpjs"
# 用于替换的文件
replaceFiles = ("src/project.js")
# 是否强制dump 重复的文件会被删除替换
force_dump: bool = False


def on_message(message, data):
    if message['type'] == 'send':
        payload = message['payload']
        if payload['type'] == 'askReload':
            dump_file(payload, data)

    elif message['type'] == 'error':
        print(message['stack'])


def dump_file(payload, data: bytes):
    file_name: str = payload['fileName']
    length: str = payload['length']

    save_file = dump_path + os.sep + file_name
    save_path = os.path.dirname(save_file)

    if not os.path.exists(save_path):
        os.makedirs(save_path)

    # 强制就删除 历史的
    if force_dump and os.path.exists(save_file):
        os.remove(save_file)

    if not os.path.exists(save_file):
        fo = open(save_file, mode="wb")
        fo.write(data)
        fo.close()
        print("dump:", payload)
        payload['type'] = "dump"
        script.post(payload)
    elif file_name in replaceFiles:
        bs = file_data(save_file)

        payload['type'] = "replace"
        payload['length'] = len(bs)
        script.post(payload, bs)
    else:
        script.post(payload)


def file_data(_path):
    fo = open(_path, "rb")
    bs = fo.read()
    fo.close()
    return bs


if __name__ == '__main__':
    # frida -U 参数
    device = frida.get_usb_device()
    # -f 参数
    f = "com.xm4399.zmws.m4399"
    # 启动程序成可附加状态
    pid = device.spawn([f])
    session = device.attach(pid)
    # 恢复附加进程
    device.resume(pid)

    # -l 参数
    l = "../../_agent.js"
    with codecs.open(l, 'r', 'utf-8') as f:
        source = f.read()

    script = session.create_script(source)
    script.on('message', on_message)
    script.load()
    print("ojbk....")
    sys.stdin.read()
