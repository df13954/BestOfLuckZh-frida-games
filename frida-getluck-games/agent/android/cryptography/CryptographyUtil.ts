import {JavaString} from "../../java/JavaUtil";

export namespace CryptographyUtil {
    import Wrapper = Java.Wrapper;

    export function keyToHexStr(key: any) {
        let toStr = ""
        let keyRaw: Wrapper = Java.use(key.$className);

        if (key.$className.indexOf("Key") != -1) {
            let bytes = keyRaw.getEncoded.call(key);
            toStr += byteArraytoHexString(bytes);
        } else if (key.$className.indexOf("Certificate") != -1) {
            let bytes =  key.getPublicKey().getEncoded();
            toStr += "[certificate]" + byteArraytoHexString(bytes);
        }
        return toStr;
    }

    export function toHexStr(input: any, length?: number) {
        let dataStr;
        if (input.length && input.length > 0) {
            //byte[]
            dataStr = byteArraytoHexString(input, length);
        } else if (input.array) {
            //ByteBuffer
            dataStr = byteArraytoHexString(input.array());
        } else {
            dataStr = input.toString();
        }
        return dataStr;
    }


    export function toJavaString(input: any) {
        let dataStr;
        if (input.length && input.length > 0) {
            //byte[]
            dataStr = JavaString.newJavaStringByBArray(input, "utf-8");
        } else if (input.array) {
            //ByteBuffer
            dataStr = JavaString.newJavaStringByBArray(input.array(), "utf-8");
        } else {
            dataStr = input.toString();
        }
        return dataStr;
    }

    function toJsArray(javaArray: any[], length: number = javaArray.length): any[] {
        let toArray: any = [];
        for (let i = 0; i < length; i++) {
            toArray[i] = javaArray[i];
        }
        return toArray;
    }

    var byteArraytoHexString = function (javaArray: any[], length: number = javaArray.length) {
        let byteArray: Array<number> = toJsArray(javaArray, length);
        if (!byteArray) {
            return 'null';
        }
        if (byteArray.map) {
            return byteArray.map(function (byte: number) {
                return ('0' + (byte & 0xFF).toString(16)).slice(-2);
            }).join('');
        } else {
            return byteArray + "";
        }
    }
}