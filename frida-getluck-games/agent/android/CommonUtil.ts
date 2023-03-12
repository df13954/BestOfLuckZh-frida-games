export namespace CommonUtil {
    import MethodDispatcher = Java.MethodDispatcher;

    export function jhexdum(array: any, len: number = array.length): string {
        let ptr: NativePointer = Memory.alloc(array.length);
        for (let i = 0; i < array.length; i++) {
            ptr.add(i).writeS8(array[i]);
        }
        return hexdump(ptr, {length: len, ansi: false})
    }
    // ------------------- android log
    export function callLog(fun: string,tag: string, msg: string) {
        let Log = Java.use("android.util.Log");
        let lofF:MethodDispatcher = Log[fun];
        let logFun = lofF.overload("java.lang.String", "java.lang.String");
        logFun.call(Log,tag,msg);
    }

    export function logv(tag: string, msg: string) {
        callLog("v",tag,msg);
    }

    export function logd(tag: string, msg: string) {
        callLog("d",tag,msg);
    }

    export function logi(tag: string, msg: string) {
        callLog("i",tag,msg);
    }

    export function logw(tag: string, msg: string) {
       callLog("w",tag,msg);;
    }

    export function loge(tag: string, msg: string) {
        callLog("e",tag,msg);
    }
}