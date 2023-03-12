export namespace Il2CppUtil {
    /**
     *     搜索有点浪费速度。。。 游戏如果能改调试 最好先暂停在hook
     */
    export function getIl2CppLuaClass(clazz: string): Il2Cpp.Class | null {
        //assembly 可以理解成一个 dll
        let assemblies: Il2Cpp.Assembly[] = Il2Cpp.Domain.assemblies;

        function getClass(assembly: Il2Cpp.Assembly, clazz: string): Il2Cpp.Class | null {
            try {
                return assembly.image.class(clazz)
            } catch (e) {
                return null
            }
        }

        let foundClass: Il2Cpp.Class | null = null

        for (let assembly of assemblies) {
            if ((foundClass = getClass(assembly, clazz)) == null) {
                continue
            }
            return foundClass
        }
        console.log("foundClass:", foundClass)
        return null
    }

    export function createByteBuffer(data: ArrayBuffer): Il2Cpp.Array {
        // 虽然 args[1].add(0x10).writeByteArray(data)  这个可以直接写,但得考虑数组大小被限制。最好自己创建
        const byteArray: Il2Cpp.Array = Il2Cpp.Array.from(Il2Cpp.Image.corlib.class("System.Byte"), data.byteLength);

        Il2Cpp.Api._arrayGetElements(byteArray).writeByteArray(data)
        return byteArray
    }

    /**
     * 获取 C# System.array.byte 内部包装的元素数组指针
     * @param pointer
     */
    export function getByteBufferElements(pointer: NativePointer): NativePointer {
        const array = new Il2Cpp.Array(pointer)
        return Il2Cpp.Api._arrayGetElements(array)
    }
}