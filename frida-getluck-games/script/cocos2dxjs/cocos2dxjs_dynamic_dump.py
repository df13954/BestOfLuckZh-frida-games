import codecs
import json

import frida
import sys
import os

from frida.core import Script

script: Script

# dump 路径
dump_path = r"C:\Users\hp\Desktop\cocos-decrypt\cocos2dxjs"

# 是否强制dump 重复的文件会被删除替换
force_dump: bool = True


def on_message(message, data):
    if message['type'] == 'send':
        payload = message['payload']
        if payload['type'] == 'dump':
            dump_file(payload)

    elif message['type'] == 'error':
        print(message['stack'])


def dump_file(payload):
    dump_log: str = payload['dump_log']
    data = json.loads(dump_log)
    txt_json = json.dumps(data, ensure_ascii=False)
    root_fragment = data["rootProp"]

    save_file = dump_path + os.sep + root_fragment + ".json"
    save_path = os.path.dirname(save_file)

    if not os.path.exists(save_path):
        os.makedirs(save_path)

    # 强制就删除 历史的
    if force_dump and os.path.exists(save_file):
        os.remove(save_file)

    if not os.path.exists(save_file):
        fo = open(save_file, mode="w", encoding="utf-8")
        fo.write(txt_json)
        fo.close()
        print("dump:", save_file)
        payload['type'] = "dump"


def file_data(_path):
    fo = open(_path, "rb")
    bs = fo.read()
    fo.close()
    return bs


# 配合Cocos2dxjs.ts
if __name__ == '__main__':
    # frida -U 参数
    device = frida.get_usb_device()
    # -f 参数
    f = "com.zmsy.zmxywz.m4399"
    # 启动程序成可附加状态
    pid = device.spawn([f])
    session = device.attach(pid)

    # -l 参数
    l = "../../_agent.js"
    with codecs.open(l, 'r', 'utf-8') as f:
        source = f.read()

    script = session.create_script(source)
    script.on('message', on_message)
    script.load();

    # 恢复附加进程 让应用活动起来
    # 经过测试 最好在脚本加载完成后 进行恢复 不然有些 so 提前加载了
    device.resume(pid);

    print("ojbk....")
    sys.stdin.read()
