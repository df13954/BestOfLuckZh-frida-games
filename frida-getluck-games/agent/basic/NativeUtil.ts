import {DebugUtil} from "../game/util/DebugUtil";

export namespace NativeUtil {
    export namespace unistd {
        export enum syscall_asm {
            __NR_openat = 56,
            __NR_close = 57,
            __NR_vhangup = 58,
            __NR_pipe2 = 59,
            __NR_quotactl = 60,
            __NR_getdents64 = 61,
            __NR3264_lseek = 62,
            __NR_read = 63,
            __NR_write = 64
        }

        export function getpid(): number {
            const getpid_ptr = Module.findExportByName("libc.so", "getpid")!;
            const getpid_fun = new NativeFunction(getpid_ptr, "int", []);
            return getpid_fun();
        }

        export function get_syscall_call_ptr() {
            let syscallPtr = Module.findExportByName("libc.so", "syscall")!;
            return syscallPtr;
        }

        export function get_syscall_call_function(): NativeFunction<any, any> | null {
            const syscallPtr = get_syscall_call_ptr();

            let syscallFun = null;
            if (Process.arch === "arm64") {
                syscallFun = new NativeFunction(syscallPtr, "int", ["int", "pointer", "pointer", "pointer", "pointer", "pointer", "pointer"]);
            } else if (Process.arch === "arm") {
                syscallFun = new NativeFunction(syscallPtr, "int", ["int", "pointer", "pointer", "pointer"]);
            }
            return syscallFun;
        }
    }
    export namespace stdlib {
        export function system_shell(command: string): number {
            const system_ptr = Module.findExportByName("libc.so", "system")!;
            const system_fun = new NativeFunction(system_ptr, "int", ["pointer"]);
            let commandStr = Memory.allocUtf8String(command);
            return system_fun(commandStr);
        }
    }
    export namespace stat {
        //use
        export const S_IRWXU = 0o700;
        export const S_IRUSR = 0o0400;
        export const S_IWUSR = 0o0200;
        export const S_IXUSR = 0o0100;
        //group
        export const S_IRWXG = 0o0070;
        export const S_IRGRP = 0o0040;
        export const S_IWGRP = 0o0020;
        export const S_IXGRP = 0o0010;
        export const S_IRWXO = 0o0007;
        //other
        export const S_IROTH = 0o0004;
        export const S_IWOTH = 0o0002;
        export const S_IXOTH = 0o0001;
        export const ACCESSPERMS = (S_IRWXU | S_IRWXG | S_IRWXO) /* 0777 */
        export const DEFFILEMODE = (S_IRUSR | S_IWUSR | S_IRGRP | S_IWGRP | S_IROTH | S_IWOTH) /* 0666 */
    }
    export namespace open_io {
        export enum fcntl {
            _O_RDONLY = 0x0000,
            _O_WRONLY = 0x0001,
            _O_RDWR = 0x0002,
            _O_APPEND = 0x0008,
            _O_CREAT = 0x0100,
            _O_BINARY = 0x8000,
            AT_FDCWD = -100,
            _O_TRUNC = 0x0200,
            _O_ACCMODE = (_O_RDONLY | _O_WRONLY | _O_RDWR),
            creat = _O_CREAT | _O_TRUNC | _O_WRONLY
        }

        export function open(path: string, flags: number = fcntl._O_ACCMODE, model: number = 0): number {
            let open_ptr = Module.findExportByName("libc.so", "open");
            let open_fun = new NativeFunction(open_ptr!, "int", ["pointer", "int", "int"]);

            let path_ptr = Memory.allocUtf8String(path);
            return open_fun(path_ptr, flags, model);
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

        export function openat_fun(openatPtr: NativePointer): NativeFunction<number, [number, NativePointer, number]> {
            const openat_fun = new NativeFunction(openatPtr, "int", ["int", "pointer", "int"]);
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
            const fd = open_io.open(path, open_io.fcntl._O_RDONLY);
            let str = open_io.readStr(fd);
            open_io.close(fd);
            return str;
        }

        export function self_maps(): string {
            const path = "/proc/self/maps"
            const fd = open_io.open(path, open_io.fcntl._O_RDONLY);
            const count = 8192;

            let stringBuffer = "";
            let buff = Memory.alloc(count);
            try {
                while (open_io.read(fd, buff, count) > 0) {
                    stringBuffer += buff.readCString()!;
                }
            } finally {
                open_io.close(fd);
            }
            return stringBuffer
        }
    }
}