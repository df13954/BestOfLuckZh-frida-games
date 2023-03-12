import {CryptographyUtil} from "./CryptographyUtil";
import {DebugUtil} from "../../game/util/DebugUtil";

export namespace MacHook {
    export function start() {
        hookInit();
        hookUpdate();
        hook_doFinal();
    }

    class HookObj {
        _this: Java.Wrapper

        constructor(_this: Java.Wrapper) {
            this._this = _this;
        }

        getAlgorithm(): string {
            return this._this.getAlgorithm();
        }

        getMacLength(): number {
            return this._this.getMacLength();
        }
    }

    function hookInit() {
        let Mac = Java.use("javax.crypto.Mac")
        let init: Java.MethodDispatcher = Mac["init"];
        init.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let key = params[0];
                let messageDigestObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                {
                    let log = `\n algorithm: ${messageDigestObj.getAlgorithm()} \n keyType: ${key.$className}`
                        + ` \n keyToHex: ${CryptographyUtil.keyToHexStr(key)}`;
                    DebugUtil.LOGE(log);
                    DebugUtil.PrintStackTrace();
                    method.call(this, ...params);
                }
            }
        })

    }

    function hookUpdate() {
        let Mac = Java.use("javax.crypto.Mac")
        let update: Java.MethodDispatcher = Mac['update'];
        update.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let input = params[0];
                let hookObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n update algorithm: ${hookObj.getAlgorithm()} \n updateToHex: ${CryptographyUtil.toHexStr(input)}`
                    + `\n updateToString: ${CryptographyUtil.toJavaString(input)}`

                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                method.call(this, ...params);
            }
        })
    }

    function hook_doFinal() {
        let Mac = Java.use("javax.crypto.Mac")
        let doFinal: Java.MethodDispatcher = Mac['doFinal'];
        doFinal.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let ret = method.call(this, ...params);
                let hookObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n algorithm: ${hookObj.getAlgorithm()}`;

                if (method.returnType.className === 'void') {
                    let finalRet = params[0];
                    log += `\n retToHex: ${CryptographyUtil.toHexStr(finalRet)} retToString: ${CryptographyUtil.toJavaString(finalRet)}`
                } else {
                    if (params.length != 0) {
                        let input = params[0];
                        log += `\n updateToHex: ${CryptographyUtil.toHexStr(input)} \n updateToString: ${CryptographyUtil.toJavaString(input)}`
                    }
                    log += `\n retToHex: ${CryptographyUtil.toHexStr(ret)} \n retToString: ${CryptographyUtil.toJavaString(ret)}`
                }
                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                return ret;

            }
        })
    }

}