import {DebugUtil} from "../../game/util/DebugUtil";

export namespace OKHttp3Hook {

    import Wrapper = Java.Wrapper;
    import MethodDispatcher = Java.MethodDispatcher;

    export function start() {
        hook_realCall_enqueue();
    }

    /**
     * 一般okhttp3 都是 enqueue 异步执行 所以只用hook这个查看发请求的栈就可以了
     * @private
     */
    function hook_realCall_enqueue() {
        let RealCall: Wrapper = Java.use('okhttp3.internal.connection.RealCall');
        let enqueue: MethodDispatcher = RealCall["enqueue"];
        enqueue.overloads[0].implementation = function (responseCallback: any) {
            DebugUtil.logL(`\n ${DebugUtil.getLine(16)} ${this.$className} ${enqueue.methodName} ${DebugUtil.getLine(16)}`)
            DebugUtil.PrintStackTrace();
            this.enqueue(responseCallback);
        }
    }
}