import {DebugUtil} from "../game/util/DebugUtil";

export namespace JavaUtil {
    import MethodDispatcher = Java.MethodDispatcher;

    export function getFieldObject(instance: any, fieldName: string, className = "") {
        console.log("getFieldObjectgetFieldObjectgetFieldObjectgetFieldObject")

        var clazz = Java.use(className ? className : instance.getClass().getName());

        // var fields = clazz.class.getDeclaredFields();
        // fields.forEach(function (field: any) {//依次打印字段的类型、名称、值
        //     console.log("field type is: " + (field.getType()))
        //     console.log("field name is: " + (field.getName()))
        // })
        let Field = clazz.class.getDeclaredField(fieldName);
        Field.setAccessible(true)
        let Object = Field.get(instance)
        return Object
    }

    export function setFieldObject(instance: any, fieldName: string, value: any, className = "") {

        var clazz = Java.use(className ? className : instance.getClass().getName());
        let Field = clazz.class.getDeclaredField(fieldName);
        Field.setAccessible(true)
        Field.set(instance, value)
    }

    export function setFieldInt(instance: any, fieldName: string, value: number, className = "") {
        var clazz = Java.use(className ? className : instance.getClass().getName());


        let Field = clazz.class.getDeclaredField(fieldName);
        Field.setAccessible(true)
        Field.setInt(instance, value)
    }

    export function setFieldLong(instance: any, fieldName: string, value: number, className = "") {

        var clazz = Java.use(className ? className : instance.getClass().getName());

        let Field = clazz.class.getDeclaredField(fieldName);
        Field.setAccessible(true)
        Field.setLong(instance, value)
    }

    export function doEnumerateClasses(callback: (name: string) => void) {
        Java.enumerateLoadedClasses({
            onMatch: function (className) {
                callback(className);
            },
            onComplete: function () {

            }
        })
    }

    /**
     * 为了解决混淆 没有办法 只能根据 类 + 方法参数类型 被迫搜索 其关键方法
     * @private
     */
    export function getMethods(fridaClass: Java.Wrapper): Array<string> {
        let members = fridaClass.$ownMembers;
        let methods = members.filter(m => Object.prototype.toString.call(fridaClass[m]) === '[object Function]')
        return methods
    }

    export function getMethodsByArgsType(fridaClass: Java.Wrapper, ...argTypes: string[]): Java.Method[] {
        let methods = getMethods(fridaClass);
        let javaMethods: Java.Method[] = [];

        for (let method of methods) {
            let methodDispatcher: MethodDispatcher = fridaClass[method];

            methodDispatcher.overloads.forEach(m => {

                let argumentTypes = m.argumentTypes;
                if (argumentTypes.length == argTypes.length) {
                    if (argTypes.length == 0) {
                        javaMethods.push(m)
                        return
                    }

                    let argClassNames: string[] = m.argumentTypes.map(t => t.className!);
                    if (Array.prototype.toString.call(argTypes) == Array.prototype.toString.call(argClassNames)) {
                        javaMethods.push(m)
                    }
                }

            })
        }

        return javaMethods
    }

}

export namespace JavaString {
    export function newJavaStringByBArray(bArray: any[], charsetStr: string) {
        const JavaString = Java.use('java.lang.String');
        const Charset = Java.use('java.nio.charset.Charset');
        const charset = Charset.forName(charsetStr);
        const StringNew = JavaString.$new.overload('[B', 'java.nio.charset.Charset');
        return StringNew.call(JavaString, bArray, charset);
    }
}