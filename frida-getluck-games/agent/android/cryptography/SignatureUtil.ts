import {CryptographyUtil} from "./CryptographyUtil";
import {DebugUtil} from "../../game/util/DebugUtil";

export namespace SignatureUtil {

    export function start() {
        hookUpdate();
        hook_initSign();
        hook_initVerify();
        hook_sign();
        hook_verify();
    }

    enum SignatureState {
        UNINITIALIZED = 0,
        SIGN = 2,
        VERIFY = 3,
    }

    class HookObj {
        _this: Java.Wrapper

        constructor(_this: Java.Wrapper) {
            this._this = _this;
        }

        getAlgorithm(): string {
            return this._this.getAlgorithm();
        }

        getParameters(): any {
            return this._this.getParameters();
        }

        state(): number {
            return this._this.state.value;
        }

        stateName(): string {
            let state = this.state();
            return SignatureState[state];
        }

    }

    function hookUpdate() {
        let Signature = Java.use("java.security.Signature")
        let update: Java.MethodDispatcher = Signature['update'];
        update.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let input = params[0];
                let hookObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `signature update(${methodSign})>>
                            algorithm: ${hookObj.getAlgorithm()} 
                            stateName: ${hookObj.stateName()}
                            updateToHex: ${CryptographyUtil.toHexStr(input)} 
                            updateToString: ${CryptographyUtil.toJavaString(input)}`

                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                method.call(this, ...params);
            }
        })
    }

    function hook_initSign() {
        let Signature = Java.use("java.security.Signature")
        let initSign: Java.MethodDispatcher = Signature['initSign'];
        initSign.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let input = params[0];
                let hookObj = new HookObj(this);

                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n algorithm: ${hookObj.getAlgorithm()} \n stateName: ${hookObj.stateName()} \n key: ${CryptographyUtil.keyToHexStr(input)}`

                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                method.call(this, ...params);
            }
        })
    }

    function hook_initVerify() {
        let Signature = Java.use("java.security.Signature")
        let initVerify: Java.MethodDispatcher = Signature['initVerify'];
        initVerify.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let input = params[0];
                let hookObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n algorithm: ${hookObj.getAlgorithm()} \n stateName: ${hookObj.stateName()} \n verify: ${CryptographyUtil.toHexStr(input)}`

                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                method.call(this, ...params);
            }
        })
    }

    function hook_sign() {
        let Signature = Java.use("java.security.Signature")
        let sign: Java.MethodDispatcher = Signature['sign'];
        sign.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let ret = method.call(this, ...params);
                let hookObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n algorithm: ${hookObj.getAlgorithm()} \n stateName: ${hookObj.stateName()}`
                if (method.argumentTypes.length == 0) {
                    log += `\n signRet:${CryptographyUtil.toHexStr(ret)}`;
                } else if (method.returnType.className == "int") {
                    let input = params[0];
                    let len = ret;
                    if (len > 0) {
                        log += `\n signRet:${CryptographyUtil.toHexStr(input, len)}`;
                    }
                }


                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                return ret;
            }
        })
    }

    function hook_verify() {
        let Signature = Java.use("java.security.Signature")
        let verify: Java.MethodDispatcher = Signature['verify'];
        verify.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let ret = method.call(this, ...params);
                let hookObj = new HookObj(this);

                let signature = params[0];
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n algorithm: ${hookObj.getAlgorithm()} \n stateName: ${hookObj.stateName()}` +
                    `\n signature: ${CryptographyUtil.toHexStr(signature)}
                            `
                log += `\n signRet:${ret}`;

                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                return ret;
            }
        })
    }

}