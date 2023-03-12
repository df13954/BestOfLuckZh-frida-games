import {DebugUtil} from "../../game/util/DebugUtil";
import {CryptographyUtil} from "./CryptographyUtil";

export namespace MessageDigest {
    export function start() {
        hookUpdate();
        hookDigest();
    }

    class MessageDigestObj {
        _this: Java.Wrapper

        constructor(_this: Java.Wrapper) {
            this._this = _this;
        }

        getAlgorithm(): string {
            return this._this.getAlgorithm();
        }

        getDigestLength(): number {
            return this._this.getDigestLength();
        }
    }

    function hookUpdate() {
        let MessageDigest: Java.Wrapper = Java.use("java.security.MessageDigest");
        let update: Java.MethodDispatcher = MessageDigest["update"];
        update.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let input = params[0];
                let messageDigestObj = new MessageDigestObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `algorithm: ${messageDigestObj.getAlgorithm()} \n updateToHex: ${CryptographyUtil.toHexStr(input)}`
                    + `\n updateToString: ${CryptographyUtil.toJavaString(input)}
                `
                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                method.call(this, ...params);
            }
        })
    }

    function hookDigest() {
        let MessageDigest: Java.Wrapper = Java.use("java.security.MessageDigest");
        let digest: Java.MethodDispatcher = MessageDigest["digest"];
        digest.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let ret = method.call(this, ...params);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let messageDigestObj = new MessageDigestObj(this);

                let log = `\n algorithm: ${messageDigestObj.getAlgorithm()}`
                if (method.returnType.className === "int") {
                    let buf = params[0];
                    let len = ret;
                    if (len > 0) {
                        log += `\n digestRetHex:${CryptographyUtil.toHexStr(buf, len)}`
                    }
                } else {
                    if (ret) {
                        log += `\n digestRetHex:${CryptographyUtil.toHexStr(ret)}`
                    }
                }

                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                return ret;
            }
        })
    }
}