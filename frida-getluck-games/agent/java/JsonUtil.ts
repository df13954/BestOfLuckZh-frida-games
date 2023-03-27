/**
 * 基于常见 JSON库 的使用
 * 注意必须存在lib库
 */
export namespace JsonUtil {
    import Wrapper = Java.Wrapper;

    export function toJsonString_fastjson(obj: any): string {
        let JSON = Java.use("com.alibaba.fastjson.JSON");
        let toJSONString = JSON.toJSONString.overload('java.lang.Object');
        console.log(toJSONString)
        return toJSONString.call(JSON, obj)
    }

    export function parseJson_fastjson(json: string, clazz: Wrapper): any {
        let JSON = Java.use("com.alibaba.fastjson.JSON");
        let parseObject = JSON.parseObject.overload('java.lang.String', 'java.lang.Class');
        console.log(parseObject)
        return parseObject.call(JSON, json, clazz)
    }

    export function toJsonString_gson(obj: any): string {
        let JSON = Java.use("com.google.gson.Gson");
        let gsonInstance = gson_instance();
        let toJson = JSON.toJson.overload('java.lang.Object');
        return toJson.call(gsonInstance, obj)
    }

    export function parseJson_gson(json: string, clazz: Wrapper): any {
        let JSON = Java.use("com.google.gson.Gson");
        let gsonInstance = gson_instance();
        let fromJson = JSON.fromJson.overload('java.lang.String', 'java.lang.Class');
        return fromJson.call(gsonInstance, json, clazz)
    }

    export function gson_instance() {
        let gson_wrapper: Wrapper = Java.use("com.google.gson.Gson");
        return gson_wrapper.$new();
    }
}