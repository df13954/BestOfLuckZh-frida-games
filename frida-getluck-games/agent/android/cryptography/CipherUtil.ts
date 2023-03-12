import {DebugUtil} from "../../game/util/DebugUtil";
import {CryptographyUtil} from "./CryptographyUtil";

export namespace CipherUtil {
    export function start() {
        hookInit();
        hookUpdate();
        hook_doFinal();
    }

    enum CipherMode {
        ENCRYPT_MODE = 1,
        DECRYPT_MODE = 2,
        // WRAP_MODE = 3,
        // UNWRAP_MODE = 4,
        // PUBLIC_KEY = 1,
        // PRIVATE_KEY = 2,
        // SECRET_KEY = 3
    }

    class HookObj {
        _this: Java.Wrapper

        constructor(_this: Java.Wrapper) {
            this._this = _this;
        }

        getAlgorithm(): string {
            return this._this.getAlgorithm();
        }

        getBlockSize(): number {
            return this._this.getBlockSize();
        }

        getParameters(): number {
            return this._this.getParameters();
        }

        opmode(): number {
            return this._this.opmode.value;
        }

        opmodeNme(): string {
            let opmode_v = this.opmode();
            let name = CipherMode[opmode_v];
            return name;
        }
    }

    function hookInit() {
        let Cipher = Java.use("javax.crypto.Cipher")
        let init: Java.MethodDispatcher = Cipher["init"];
        init.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let key = params[1];
                let messageDigestObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n algorithm: ${messageDigestObj.getAlgorithm()} \n keyType: ${key.$className} \n keyToHex: ${CryptographyUtil.keyToHexStr(key)}`;
                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                method.call(this, ...params);
            }
        })

    }

    function hookUpdate() {
        let Cipher = Java.use("javax.crypto.Cipher")
        let update: Java.MethodDispatcher = Cipher['update'];
        update.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let input = params[0];
                let hookObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = `\n  algorithm: ${hookObj.getAlgorithm()} \n blockSize: ${hookObj.getBlockSize()} \n opmodeNme: ${hookObj.opmodeNme()}`
                    +
                    `\n updateToHex: ${CryptographyUtil.toHexStr(input)} \n updateToString: ${CryptographyUtil.toJavaString(input)}`

                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                method.call(this, ...params);
            }
        })
    }

    function hook_doFinal() {
        let Cipher = Java.use("javax.crypto.Cipher")
        let doFinal: Java.MethodDispatcher = Cipher['doFinal'];
        doFinal.overloads.forEach(method => {
            let methodSign = method.argumentTypes.map(t => t.className);
            method.implementation = function (...params: any[]) {
                let ret = method.call(this, ...params);
                let hookObj = new HookObj(this);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  ${this.$className} ${method.methodName}(${methodSign})${method.returnType.className}  ${DebugUtil.getLine(16)}`)
                let log = ` \n  algorithm: ${hookObj.getAlgorithm()} \n blockSize: ${hookObj.getBlockSize()} \n opmodeNme: ${hookObj.opmodeNme()}`;


                //在这里分两个逻辑
                //doFinal 返回结果是 int 则代表输出在参数里面
                if (method.returnType.className === 'int') {
                    let input = params[0];
                    log += `\n updateToHex: ${CryptographyUtil.toHexStr(input)} \n updateToString: ${CryptographyUtil.toJavaString(input)}`
                    let blen = ret;
                    //ByteBuffer
                    if (input.$className && input.$className.indexOf("ByteBuffer") != -1) {
                        let output = params[1];
                        log += `\n retToHex: ${CryptographyUtil.toHexStr(output)} \n retToString: ${CryptographyUtil.toJavaString(output)}
                            `
                    } else {
                        let output = params[3];
                        if (blen > 0) {
                            log += `\n retToHex ${blen}: ${CryptographyUtil.toHexStr(output, blen)}  \n retToString: ${CryptographyUtil.toJavaString(output)}
                            `
                        }
                    }
                } else {
                    if (params.length != 0) {
                        let input = params[0];
                        log += `\n updateToHex: ${CryptographyUtil.toHexStr(input)} \n updateToString: ${CryptographyUtil.toJavaString(input)}`
                    }
                    log += `\n retToHex: ${CryptographyUtil.toHexStr(ret)} \n retToString: ${CryptographyUtil.toJavaString(ret)}
                            `
                }
                DebugUtil.LOGE(log);
                DebugUtil.PrintStackTrace();
                return ret;

            }
        })
    }
}