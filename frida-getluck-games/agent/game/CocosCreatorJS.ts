import {DebugUtil} from "./util/DebugUtil";

export const soName: string = "libcocos2djs.so"


/**
 *  @Author GetLuck
 */
export namespace CocosCreatorJS {
    // 拦截 dlopen 函数 ,
    export function start() {
        setImmediate(() => {
            DebugUtil.whenSoOpen(path => {
                if (path.indexOf(soName) != -1) {
                    console.log("path:", path)
                    hookScriptEngine_evalString()
                }
            })

        })
    }

    interface EvalStringParam {
        script(args: InvocationArguments): ArrayBuffer;

        length(args: InvocationArguments): number;

        fileName(args: InvocationArguments): string | null;
    }

    class EvalStringParamDefault implements EvalStringParam {
        fileName(args: InvocationArguments): string | null {
            return args[4].readCString();
        }

        length(args: InvocationArguments): number {
            let len = args[2].toInt32();
            //修复长度
            if (len < 0) len = args[1].readCString()?.length!
            return len;
        }

        script(args: InvocationArguments): ArrayBuffer {
            let len = this.length(args)
            let readByteArray: ArrayBuffer | null;
            readByteArray = args[1].readByteArray(len);
            return readByteArray!
        }

    }

    interface RpcInfo {
        type: string,
        fileName: string,
        length: number
    }

    function hookScriptEngine_evalString(evalStringParam: EvalStringParam = new EvalStringParamDefault()) {
        let module: Module = Process.findModuleByName(soName)!;
        //_ZN2se12ScriptEngine10evalStringEPKciPNS_5ValueES2_
        // let evalString: NativePointer | null = module.findExportByName("_ZN2se12ScriptEngine10evalStringEPKclPNS_5ValueES2_")

        // 兼容 arm arm64
        let moduleExportDetail: ModuleExportDetails | undefined = module.enumerateExports()
            .filter(moduleExportDetail => moduleExportDetail.name.indexOf("Engine10evalString") != -1)
            .pop();

        let evalString: NativePointer = moduleExportDetail!.address;

        console.log("evalString", evalString)
        let evalStringFun = new NativeFunction(evalString!, 'bool', ['pointer', 'pointer', 'pointer', 'pointer', "pointer"])

        console.log("arm:", Process.arch)
        let i = 0;
        /*
        __int64 __fastcall se::ScriptEngine::evalString(
        se::ScriptEngine *this,
        const char *s,
        unsigned __int64 a3,
        se::Value *a4,
        char *a5)
         */
        let nativeCallback = new NativeCallback(function (_this, _script, _length, _ret, _fileName) {
            let args: InvocationArguments = [_this, _script, _length, _ret, _fileName]

            let obj: string | null;
            let fileName: string = (obj = evalStringParam.fileName(args)) != null ? obj! : `java-${i++}.js`
            let length = evalStringParam.length(args);
            let script: ArrayBuffer = evalStringParam.script(args);


            let askReload: RpcInfo = {
                type: "askReload",  //询问是否reload lua
                fileName,
                length
            }
            send(askReload, script)

            let new_script = _script
            let new_length = _length
            recv((message: RpcInfo, data) => {
                if (message.type == "replace") {
                    new_script = Memory.alloc(message.length);
                    new_script.writeByteArray(data!)
                    new_length = ptr(message.length)
                    console.log(`replace: ${message.fileName} byteLength:${message.length}`)
                } else if (message.type == "dump") {
                    // console.log(`dump: ${message.fileName} byteLength:${message.length}`)
                }
            }).wait()
            let v = evalStringFun(_this, new_script, new_length, _ret, _fileName)
            return v
        }, "bool", ['pointer', 'pointer', 'pointer', 'pointer', "pointer"]);

        Interceptor.replace(evalString!, nativeCallback)

        let runScriptPtr: NativePointer | null;
        let moduleExportDetails = module.enumerateExports();
        for (let moduleExportDetail of moduleExportDetails) {
            if (moduleExportDetail.name.indexOf("runScript") != -1 && moduleExportDetail.name.indexOf("ScriptEngine") != -1) {
                console.log("runScript:", moduleExportDetail.name)
                runScriptPtr = moduleExportDetail.address
            }
        }
        /*
            哎 这也是无奈之举 我不知道为什么 如果不进行上层 attach.runScript
            replace.evalString  就没办法全部拦截到
            如果有人知道原因 希望可以告诉我
         */
        Interceptor.attach(runScriptPtr!, {
            onEnter: function (args) {
                this.filePath = args[1].readCString();
                console.log(`jsb_run_script: ${this.filePath}`)
            }
        })
    }


}