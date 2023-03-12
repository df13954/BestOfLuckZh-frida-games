import codecs
import frida
import sys
import os

from frida.core import Script

script: Script

# dump lua路径
luaDownload = r"C:\Users\hp\Desktop\xlua"
# 用于替换的文件
replaceLuaFiles = {"@protobuf.lua", "@Data/Model/HeroData.lua", "@Data/Model/ItemData.lua", "@Module/GameModule.lua",
                   "@Char/SkillScript/BaseSkillScript.lua"}
# 是否强制dump 重复的文件会被删除替换
force_dump: bool = False


def on_message(message, data):
    if message['type'] == 'send':
        lua_rpc_info = message['payload']
        # LuaRpcInfo: {'type': 'askReload', 'path': '@Launcher', 'name': '@Launcher/servers.lua', 'sz': 1309, 'dumpDir': 'il2cppXLua/'}
        if lua_rpc_info["type"] == "askReload":
            ask_reload(lua_rpc_info)
        elif lua_rpc_info["type"] == "dumpLua":
            dump_lua(lua_rpc_info, data)

    elif message['type'] == 'error':
        print(message['stack'])


def file_path(lua_rpc_info):
    name = lua_rpc_info["name"]
    dump_dir = lua_rpc_info["dumpDir"]
    _file_path = os.path.normpath(luaDownload + os.sep + dump_dir + name)
    return _file_path


# 询问是否重新加载
def ask_reload(lua_rpc_info):
    name = lua_rpc_info["name"]
    _file_path = file_path(lua_rpc_info)
    dir_path = os.path.dirname(_file_path)

    # lua dump 下来了
    if os.path.exists(_file_path) and os.path.getsize(_file_path) != 0 and not force_dump:
        # 并且 是需要替换的文件
        if name in replaceLuaFiles:
            fo = open(_file_path, "rb")
            data_buf = fo.read()
            fo.close()

            lua_rpc_info["type"] = "replace"
            lua_rpc_info["sz"] = len(data_buf)
            print("reload:", lua_rpc_info)
            script.post(lua_rpc_info, data_buf)
        else:
            # 不做任何操作
            lua_rpc_info["type"] = "noOp"
            script.post(lua_rpc_info)
    else:
        lua_rpc_info["type"] = "dump"
        # 提前创建目录 等待调用 dump_lua 创建文件
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
        script.post(lua_rpc_info)


# dump lua 当 lua_rpc_info.type = dumpLua 时调用
def dump_lua(lua_rpc_info, data: bytes):
    _file_path = file_path(lua_rpc_info)

    if force_dump and os.path.exists(_file_path):
        os.remove(_file_path)

    if not os.path.exists(_file_path) or os.path.getsize(_file_path) == 0:
        fo = open(_file_path, mode="wb")
        fo.write(data)
        fo.close()


if __name__ == '__main__':
    # frida -U 参数
    device = frida.get_usb_device()
    # -f 参数
    f = "com.yhd.hytt"
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
