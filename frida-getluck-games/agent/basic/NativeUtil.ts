import {DebugUtil} from "../game/util/DebugUtil";

export namespace NativeUtil {

    export namespace open_io {
        export enum fcntl {
            _O_RDONLY = 0x0000,
            _O_WRONLY = 0x0001,
            _O_RDWR = 0x0002,
            _O_APPEND = 0x0008,
            _O_CREAT = 0x0100,
            _O_BINARY = 0x8000,
            _O_ACCMODE = (_O_RDONLY | _O_WRONLY | _O_RDWR)
        }

        export function open(path: string, flags: number = fcntl._O_ACCMODE): number {
            let open_ptr = Module.findExportByName("libc.so", "open");
            let open_fun = new NativeFunction(open_ptr!, "int", ["pointer", "int"]);

            let path_ptr = Memory.allocUtf8String(path);
            return open_fun(path_ptr, flags);
        }

        export function find_real_openat(): NativePointer | null {
            let openatPtr: NativePointer | null = null;

            let module = Module.load("libc.so");
            for (const symbol of module.enumerateSymbols()) {
                if (symbol.name.indexOf("__openat") != -1) {
                    openatPtr = symbol.address;
                    break;
                }
            }

            if (openatPtr == null) {
                DebugUtil.LOGE("not found __open");
            }
            return openatPtr;
        }
        export function openat_fun(openatPtr:NativePointer):NativeFunction<number, [number,NativePointer,number]>{
            const openat_fun =  new NativeFunction(openatPtr,"int",["int","pointer","int"]);
            return openat_fun;
        }

        export function read(fd: number, distBuf: NativePointer, _MaxCharCount: number): number {
            let read_ptr = Module.findExportByName("libc.so", "read");
            let read_fun = new NativeFunction(read_ptr!, "int", ["int", "pointer", "int"]);

            return read_fun(fd, distBuf, _MaxCharCount);
        }

        export function readStr(fd: number, len: number = 0x528): string {
            let buffer = Memory.alloc(len);
            read(fd, buffer, len);
            return buffer.readCString()!;
        }

        export function close(fd: number): number {
            let close_ptr = Module.findExportByName("libc.so", "close");
            let close_fun = new NativeFunction(close_ptr!, "int", ["int"]);

            return close_fun(fd);
        }
    }

    export namespace pthread {
        export function pthread_exit() {
            let pthread_exitPtr: NativePointer = Module.findExportByName("libc.so", "pthread_exit")!;
            let pthread_exitFun = new NativeFunction(pthread_exitPtr, "void", ["pointer"]);
            pthread_exitFun(ptr(0));
        }
    }


    export namespace proc {
        export function self_cmdline(): string {
            const path = "/proc/self/cmdline";
            const fd = open_io.open(path);
            let str = open_io.readStr(fd);
            open_io.close(fd);
            return str;
        }
    }
}