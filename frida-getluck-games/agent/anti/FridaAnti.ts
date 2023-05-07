/**
 * 一般检测 3 种
 * 检测frida 端口
 * 检测 /proc/self/maps 内存隐射中 frida标识
 * ptrace 标记
 *
 */
import {DebugUtil} from "../game/util/DebugUtil";
import {NativeUtil} from "../basic/NativeUtil";

export namespace FridaAnti {
    import LOGE = DebugUtil.LOGE;
    import LOGD = DebugUtil.LOGD;
    const anti_features: string[] = ["frida", "/tmp"];

    function hasAnti(content: string): boolean {
        let lowerContent = content.toLowerCase();
        let anti_feature = anti_features.filter(anti_fea => lowerContent.indexOf(anti_fea) !== -1).pop();
        return anti_feature != undefined;
    }


    /**
     * 1.基于 open 函数 读取 /proc/self/maps 方式 hook
     * 目前已知open 有
     * open
     * fopen
     * openat
     * 它们都是用于打开文件读取文件数据的
     * 其中 fopen 是标准c规范中 可跨平台调用的,一般都使用这个
     * openat 更加底层是 内核函数 有些会通过它通过 svc 调用
     *
     * 2. 读取 maps 内存映射信息后 会进行 字符串的比较特征
     * 所以我们对字符串的比较字符串的函数 进行 hook 掉
     * strstr 查找子字符串的位置
     * strcmp 比较字符串
     * strncmp
     * strcasecmp
     *
     * 3. 对终止程序进行 hook
     * 如 kill exit abort raise
     *
     * 4. 对读取 文件操作进行 hook
     * 如 read fget fread 等
     */
    export function start() {
        //hook open 是主要的 大部分情况需要用到 /maps
        //目前感觉重定向很有可能实现
        // hook_openat();
        // hook_open();

        //hook cmp
        // hook_strcmp();
        // hook_strncmp();
        // hook_strcasecmp();

        // hook_kill();

        // ------------anti
        //hook substring find
        // hook_strstr_and_anti();

        anti_open();
        // anti_kill();
        // anti_read();

        // anti_read();
    }


    /**
     * openat 是底层系统函数,一般由 syscall 调用
     * 所以我们hook 这个能拿到很多信息
     * @private
     */
    function hook_openat() {
        let openatPtr: NativePointer | null = NativeUtil.open_io.find_real_openat();
        Interceptor.attach(openatPtr!, {
            onEnter: function (args) {
                // let dirfd: number = args[0].readInt();
                let pathname = args[1].readCString();
                // let flags = args[2].readInt();
                // let mode = args[3].readInt();
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}  anti frida [openat]  ${DebugUtil.getLine(16)}`)
                // DebugUtil.LOGW("\n[openat] args1:" + dirfd);
                DebugUtil.LOGW("\n[openat] args2:" + pathname);
                // DebugUtil.LOGW("\n[openat] args3:" + flags);
                // DebugUtil.LOGW("\n[openat] args4:" + mode);
                DebugUtil.logL(`\n${DebugUtil.getLine(16)}${DebugUtil.getLine(16)}`)
            }
        })
    }


    function maps_handle(pathnamestr: string, openat_fun: NativeFunction<number, [number, NativePointer, number]>) {
        DebugUtil.LOGD("anti_maps:" + pathnamestr);
        return -1;
    }

    function thread_handle(pathnamestr: string, openat_fun: NativeFunction<number, [number, NativePointer, number]>) {
        DebugUtil.LOGD("anti_thread:" + pathnamestr);
        return -1;
    }

    function fd_handle(pathnamestr: string, openat_fun: NativeFunction<number, [number, NativePointer, number]>) {
        DebugUtil.LOGD("anti_fd:" + pathnamestr);
        return -1;
    }

    /**
     * 通过修改 open 读取 /proc/self/maps 的值
     * 完成 anti 功能
     * @private
     */
    function anti_open() {
        //prepared fun
        let openatPtr: NativePointer | null = NativeUtil.open_io.find_real_openat();
        let openat_fun = NativeUtil.open_io.openat_fun(openatPtr!);

        Interceptor.replace(openatPtr!, new NativeCallback(function (fd, pathname, flags) {
            const pathnamestr = pathname.readCString();
            if (pathnamestr != null) {
                if (pathnamestr.indexOf("proc") != -1) {
                    if (pathnamestr.indexOf("maps") > 0) return maps_handle(pathnamestr, openat_fun);
                    if (pathnamestr.indexOf("task") > 0) return thread_handle(pathnamestr, openat_fun);
                    if (pathnamestr.indexOf("fd") > 0) return fd_handle(pathnamestr, openat_fun);
                }
            }

            return openat_fun(fd, pathname, flags);

        }, "int", ["int", "pointer", "int"]));
    }


    //------------------------------------str cmp
    function hook_strcmp() {
        const strcmpPtr: NativePointer = Module.findExportByName(null, "strcmp")!;
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    let s1 = args[0].readCString();
                    let s2 = args[1].readCString();
                    if (!s1 || !s2) {
                        return
                    }
                    if (hasAnti(s1) || hasAnti(s2)) {
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}  anti frida [strcmp]  ${DebugUtil.getLine(16)}`)
                        DebugUtil.LOGW("\n [strcmp] args1:" + s1);
                        DebugUtil.LOGW("\n [strcmp] args2:" + s2);
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}${DebugUtil.getLine(16)}`)
                        NativeUtil.pthread.pthread_exit();
                        // Thread.sleep(99999);
                    }
                } catch (e) {
                    //可能参数被释放 或者没有权限访问会出现错误
                }
            }
        })
    }

    function hook_strncmp() {
        const strcmpPtr: NativePointer = Module.findExportByName(null, "strncmp")!;
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    let s1 = args[0].readCString();
                    let s2 = args[1].readCString();
                    let n = args[2].readInt();
                    if (!s1 || !s2) {
                        return
                    }
                    if (hasAnti(s1) || hasAnti(s2)) {
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}  anti frida [strncmp]  ${DebugUtil.getLine(16)}`)
                        DebugUtil.LOGW("\n [strncmp] args1:" + s1);
                        DebugUtil.LOGW("\n [strncmp] args2:" + s2);
                        DebugUtil.LOGW("\n [strncmp] args3:" + n);
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}${DebugUtil.getLine(16)}`)
                        Thread.sleep(99999);
                    }
                } catch (e) {
                    //可能参数被释放 或者没有权限访问会出现错误
                }
            }
        })
    }

    function hook_strcasecmp() {
        const strcmpPtr: NativePointer = Module.findExportByName(null, "strcasecmp")!;
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    let s1 = args[0].readCString();
                    let s2 = args[1].readCString();
                    if (!s1 || !s2) {
                        return
                    }
                    if (hasAnti(s1) || hasAnti(s2)) {
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}  anti frida [strcasecmp]  ${DebugUtil.getLine(16)}`)
                        DebugUtil.LOGW("\n [strcasecmp] args1:" + s1);
                        DebugUtil.LOGW("\n [strcasecmp] args2:" + s2);
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}${DebugUtil.getLine(16)}`)
                        Thread.sleep(99999);
                    }
                } catch (e) {
                    //可能参数被释放 或者没有权限访问会出现错误
                }
            }
        })
    }


    function hook_strstr_and_anti() {
        const strcmpPtr: NativePointer = Module.findExportByName(null, "strstr")!;
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    this.hasFeature = false;
                    let haystack = args[0].readCString();
                    let needle = args[1].readCString();
                    if (!haystack || !needle) {
                        return
                    }
                    if (hasAnti(needle)) {
                        this.hasFeature = true;
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}  anti frida [strstr]  ${DebugUtil.getLine(16)}`)
                        DebugUtil.LOGW("\n [strstr] args1:" + haystack);
                        DebugUtil.LOGW("\n [strstr] args2:" + needle);
                        // DebugUtil.PrintStackTraceN(this.context);
                        DebugUtil.logL(`\n${DebugUtil.getLine(16)}${DebugUtil.getLine(16)}`)
                        //终止这个检测线程
                        NativeUtil.pthread.pthread_exit();
                        // Thread.sleep(99999);
                    }
                } catch (e) {
                    //可能参数被释放 或者没有权限访问会出现错误
                }
            },
            onLeave: function (retval) {
                if (this.hasFeature) {
                    //对于终止不掉的线程还是尝试返回0
                    DebugUtil.LOGW("\n [strstr] hasFeature:" + 0);
                    retval.replace(ptr(0));
                }
            }
        })
    }

    function hook_kill() {
        // void _exit(int status); 退出程序
        let exit_ptr = Module.findExportByName(null, "exit");
        let _exit_ptr = Module.findExportByName(null, "_exit");
        //signal  int kill(pid_t pid, int sig); 发出结束信息
        let kill_ptr = Module.findExportByName(null, "kill");
        //abort cause process termination 发出异常信息终止
        let abort_ptr = Module.findExportByName(null, "abort");
        //send  signal to the caller 向当前程序发出信息
        let raise_ptr = Module.findExportByName(null, "raise");

        DebugUtil.LOGD(`hook kill
         exit ${exit_ptr} 
         _exit:${_exit_ptr}
         kill_ptr:${kill_ptr}
         abort_ptr:${abort_ptr}
         raise_ptr:${raise_ptr}
         `)

        //exit
        Interceptor.attach(exit_ptr!, {
            onEnter: function (args) {
                DebugUtil.LOGW("exit called");
                let status = args[0].readInt();
                DebugUtil.LOGW("exit STATUS:" + status);
            },
            onLeave: function (retval) {

            }
        });
        Interceptor.attach(_exit_ptr!, {
            onEnter: function (args) {
                DebugUtil.LOGW("_exit called");
                let status = args[0].readInt();
                DebugUtil.LOGW("_EXIT STATUS:" + status);
            },
            onLeave: function (retval) {

            }
        });

        //kill
        Interceptor.attach(kill_ptr!, {
            onEnter: function (args) {
                DebugUtil.LOGW("kill called");
                let pid = args[0].readInt();
                let sig = args[1].readInt();
                DebugUtil.LOGW("kill called");
                DebugUtil.LOGW("kill pid:" + pid);
                DebugUtil.LOGW("kill sig:" + sig);
            },
            onLeave: function (retval) {

            }
        });

        // void abort(void);
        Interceptor.attach(abort_ptr!, {
            onEnter: function (args) {
                DebugUtil.LOGW("abort called");
            },
            onLeave: function (retval) {

            }
        });

        // int raise(int sig);
        Interceptor.attach(raise_ptr!, {
            onEnter: function (args) {
                DebugUtil.LOGW("raise called");
                let sig = args[0].readInt();
                DebugUtil.LOGW("raise sig:" + sig);
            },
            onLeave: function (retval) {

            }
        });


    }

    /**
     * 对调用终止程序进行hook
     * @private
     */
    function anti_kill() {
        // void _exit(int status); 退出程序
        let exit_ptr = Module.findExportByName(null, "exit")!;
        let _exit_ptr = Module.findExportByName(null, "_exit")!;
        Interceptor.replace(exit_ptr, new NativeCallback(function (status) {
            DebugUtil.LOGD("anti exit");
        }, "void", ["int"]));
        Interceptor.replace(_exit_ptr, new NativeCallback(function (status) {
            DebugUtil.LOGD("anti _exit");
        }, "void", ["int"]))

        //signal  int kill(pid_t pid, int sig); 发出结束信息
        let kill_ptr = Module.findExportByName(null, "kill")!;
        Interceptor.replace(kill_ptr, new NativeCallback(function (pid, sig) {
            DebugUtil.LOGD("anti kill:" + pid);
            return 0;
        }, "int", ["int", "int"]))

        //abort cause process termination 发出异常信息终止
        //void abort(void);
        let abort_ptr = Module.findExportByName(null, "abort")!;
        Interceptor.replace(abort_ptr, new NativeCallback(function (v) {
            DebugUtil.LOGD("anti abort");
        }, "void", ["void"]))

        //send  signal to the caller 向当前程序发出信息 int raise(int sig);
        let raise_ptr = Module.findExportByName(null, "raise")!;
        Interceptor.replace(raise_ptr, new NativeCallback(function (sig) {
            DebugUtil.LOGD("anti raise");
            return 0;
        }, "int", ["int"]))

    }

    function anti_read() {
        //其中读取函数有 read fread fgets 常见函数

        //ssize_t read(int fd, void *buf, size_t count); 读取指定数量
        let read_ptr = Module.findExportByName(null, "read")!;
        const read_fun = new NativeFunction(read_ptr, "int", ["int", "pointer", "int"]);

        // char *fgets(char *restrict s, int size, FILE *restrict stream); 读取一行
        let fgets = Module.findExportByName(null, "fgets")!;
        const fgets_fun = new NativeFunction(fgets, "pointer", ["pointer", "int", "pointer"]);
        LOGD(`anti read : readptr ${read_ptr}  fgetsptr:${fgets}`);

        /**
         * read 内容太多 容易卡死 放弃。
         * */
        // Interceptor.replace(read_ptr, new NativeCallback(function (fd, buf, count) {
        //     let bytes = read_fun(fd, buf, count);
        //     let readCString = buf.readCString();
        //     if (readCString != null && hasAnti(readCString)) {
        //         DebugUtil.LOGD("READ feature:" + readCString)
        //     }
        //     return bytes;
        // }, "int", ["int", "pointer", "int"]))

        Interceptor.replace(fgets_fun, new NativeCallback(function (s, size, stream) {
            let cs = fgets_fun(s, size, stream);
            let readCString = s.readCString();
            if (readCString != null && hasAnti(readCString)) {
                DebugUtil.LOGD("fgets anti1:" + readCString)
                s.writeUtf8String("");
                // readCString = s.readCString();
                // DebugUtil.LOGD("fgets anti2:" + readCString)
                // pthread_exit()
            }
            return cs;
        }, "pointer", ["pointer", "int", "pointer"]))


    }

    /**
     * 当然还有点剩余东西 ptrace 检测调试
     * fork copy 主进程 到子进程执行
     *
     */

}