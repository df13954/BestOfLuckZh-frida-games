import {Il2CppUtil} from "./util/Il2CppUtil";
import {DebugUtil} from "./util/DebugUtil";

export const il2cppSoName: string = "libil2cpp.so"
export const libxluaSoName: string = "libxlua.so"
export const libcocos2SoName: string = "libcocos2dlua.so"
export const libtoluaSoName: string = "libtolua.so"


/**
 *  @Author 倒霉的ZH
 */
export namespace UnityLua {

    import whenSoOpen = DebugUtil.whenSoOpen;

    //避免重复加载
    let il2cpp_init: boolean = false
    let libxlua_init: boolean = false
    let libcocos_init: boolean = false
    let libtolua_init: boolean = false

    // 拦截 dlopen 函数 , 判断 libil2cpp.so 加载完成在做事情
    export function start() {

        setImmediate(() => {
            //对与 i2cpp.perform() 本身就自带监控加载 没必要在 open 函数判断
            onIl2cppInit();

            whenSoOpen(path => {
                /*
                   * 需要什么就放开注释
                   */
                if (path.indexOf(libxluaSoName) != -1) {
                    console.log("path:" + path);
                    let xluaModule: Module = Process.findModuleByName(libxluaSoName)!;
                    // xluaInit(xluaModule);
                }

                if (path.indexOf(libcocos2SoName) != -1) {
                    console.log("path:" + path);
                    let module: Module = Process.findModuleByName(libcocos2SoName)!;
                    // libcocosInit(module);
                }

                if (path.indexOf(libtoluaSoName) != -1) {
                    console.log("path:" + path);
                    let module: Module = Process.findModuleByName(libtoluaSoName)!;
                    // libtoluaInit(module);
                }
            })

        })
    }

    function onIl2cppInit() {
        if (il2cpp_init)
            return

        il2cpp_init = true
        console.log("start!");
        /**
         * 对于 il2Cpp 来说 关系如下
         *  Il2CppDomain 程序结构 =>  Il2CppDomain =》 assemblies (Image) => Class  => (Field | Method)
         */
        //hook "il2cpp_init" 等待初始化完成  调用砸门的回调
        Il2Cpp.perform(() => {
            let loadbuffer_method: Il2Cpp.Method = Il2CppUtil.getIl2CppLuaClass("XLua.LuaDLL.Lua")!.method("xluaL_loadbuffer");
            console.log("il2cpp_xlua_loadbuffer:", loadbuffer_method)
            //method.virtualAddress 实际内存位置  method.handle 只是 基于so 的位置
            luaRLoadBufferExport(Il2Cpp.module, loadbuffer_method.virtualAddress, "il2cppXLua/", new Il2CppLoadBufferParams())
        })


    }


    /**
     * 如果有 il2cpp 就不建议直接使用 xlua.so 因为 与 il2cpp重复了
     * @param xluaModule
     * @private
     */
    function xluaInit(xluaModule: Module) {
        if (libxlua_init)
            return

        libxlua_init = true
        luaRLoadBufferExport(xluaModule, "luaL_loadbufferx", "xlua/")
        // luaRLoadBufferExport(xluaModule, "xluaL_loadbuffer", "xluadump/")
    }

    function libcocosInit(libcocosModule: Module) {
        if (libcocos_init)
            return

        libcocos_init = true
        luaRLoadBufferExport(libcocosModule, "luaL_loadbufferx", "libcocos/")
    }

    function libtoluaInit(module: Module) {
        if (libtolua_init)
            return

        libtolua_init = true
        luaRLoadBufferExport(module, "luaL_loadbufferx", "tolua/")
    }

    /**
     * 兼容 il2Cpp.so 和 xlua.so
     */
    interface LoadBufferParamsExtractor {
        getName(args: InvocationArguments): string;

        getBuffer(args: InvocationArguments): NativePointer;

        getSize(args: InvocationArguments): number;

        setSize(args: InvocationArguments, len: number): void;

        setBuffer(args: InvocationArguments, data: ArrayBuffer): void;
    }

    /**
     XLua_LuaDLL_Lua__xluaL_loadbuffer(
     intptr_t L,
     System_Byte_array *buff,
     int32_t size,
     System_String_o *name,
     const MethodInfo *method)
     */
    class Il2CppLoadBufferParams implements LoadBufferParamsExtractor {

        setBuffer(args: InvocationArguments, data: ArrayBuffer): void {
            args[1] = Il2CppUtil.createByteBuffer(data).handle
        }

        setSize(args: InvocationArguments, len: number): void {
            args[2] = ptr(len)
        }

        getBuffer(args: InvocationArguments): NativePointer {
            return Il2CppUtil.getByteBufferElements(args[1]);
        }

        getName(args: InvocationArguments): string {
            //读取  System.string 内部 il2cpp_string_chars 指针 才能获取 字符串
            // 也就是 偏移 0xc 的地方 64 位可能有差异
            return new Il2Cpp.String(args[3]).content!;
        }

        getSize(args: InvocationArguments): number {
            //长度就是system.array
            return args[2].toInt32();
        }
    }

    /**
     * int luaL_loadbufferx (lua_State *L,
     *                       const char *buff,
     *                       size_t sz,
     *                       const char *name,
     *                       const char *mode);
     */
    class DefaultLoadBufferParams implements LoadBufferParamsExtractor {
        getBuffer(args: InvocationArguments): NativePointer {
            return args[1];
        }

        getName(args: InvocationArguments): string {
            return args[3].readCString()!;
        }

        getSize(args: InvocationArguments): number {
            return args[2].toInt32();
        }

        setBuffer(args: InvocationArguments, data: ArrayBuffer): void {
            // args[1].writeByteArray(data)
        }


        setSize(args: InvocationArguments, len: number): void {
            args[2] = ptr(len)
        }


    }

    interface LuaRpcInfo {
        type: string,   //rpc 类型
        path: string,   //lua 路径
        name: string,   //lua 文件名称
        sz: number,     //lua 数据大小
        dumpDir: string //dump 路径
    }

    function luaRLoadBufferExport(soModule: Module | null, fun: string | NativePointer, dumpDir: string, paramsExtractor: LoadBufferParamsExtractor = new DefaultLoadBufferParams()) {
        let loadbufferx: NativePointer


        if (typeof fun === 'string') {
            let funName: string = fun as string
            if (soModule == null) {
                loadbufferx = Module.findExportByName(null, funName)!
            } else {
                loadbufferx = soModule.findExportByName(funName)!;
            }
        } else {
            let funOffset = fun as NativePointer;
            loadbufferx = funOffset;
        }

        console.log("load So:", JSON.stringify(soModule), "fun:", fun)
        Interceptor.attach(loadbufferx, {
            onEnter: function (args) {
                let name: string = paramsExtractor.getName(args);
                //包含空格一般不是文件
                if (name.indexOf(" ") == -1) {

                    let path: string = name.substring(0, name.lastIndexOf("/"))
                    let buff = paramsExtractor.getBuffer(args)
                    let sz = paramsExtractor.getSize(args);

                    let askReload: LuaRpcInfo = {
                        type: "askReload",  //询问是否reload lua
                        path,
                        name,
                        sz,
                        dumpDir
                    }

                    // console.error(Thread.backtrace(this.context).map(DebugSymbol.fromAddress).join("\n"))

                    send(askReload)

                    recv((message: LuaRpcInfo, data) => {
                        if (message.type == "replace") {
                            console.log(`replace: ${JSON.stringify(message)} byteLength:${data?.byteLength}`)
                            paramsExtractor.setSize(args, message.sz)
                            paramsExtractor.setBuffer(args, data!)
                        } else if (message.type == "dump") {
                            console.log(`dump: ${JSON.stringify(message)}`)
                            askReload.type = "dumpLua"
                            send(askReload, buff.readByteArray(sz))
                        }
                    }).wait()
                } else {
                    let sz = paramsExtractor.getSize(args);
                    console.log("other:", name, "size:", sz)
                }
            }
        })
    }


}
