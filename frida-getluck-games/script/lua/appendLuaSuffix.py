import os


def changedSuffix(path):
    # 获取路径文件
    files = os.listdir(path)
    print("sep:", os.sep)

    for fileName in files:
        startPath = path + os.sep
        filePath = startPath + fileName
        if os.path.isfile(filePath):
            if fileName.find(".") == -1:
                replaceName = filePath + ".lua"
                print("file:", filePath, " replace:", replaceName)
                os.renames(filePath, replaceName)
        else:
            changedSuffix(filePath)

if __name__ == '__main__':
    # 追加.lua 后缀 有些导出的文件没有 .lua 后缀 用这个脚本可以很方便添加
    path = r"C:\Users\hp\Desktop\gfb-lua\luadump\luaDump"
    changedSuffix(path)
