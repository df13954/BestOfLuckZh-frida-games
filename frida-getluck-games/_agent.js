(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonUtil = void 0;
var CommonUtil;
(function (CommonUtil) {
    function jhexdum(array, len = array.length) {
        let ptr = Memory.alloc(array.length);
        for (let i = 0; i < array.length; i++) {
            ptr.add(i).writeS8(array[i]);
        }
        return hexdump(ptr, { length: len, ansi: false });
    }
    CommonUtil.jhexdum = jhexdum;
    function callLog(fun, tag, msg) {
        let Log = Java.use("android.util.Log");
        let lofF = Log[fun];
        let logFun = lofF.overload("java.lang.String", "java.lang.String");
        logFun.call(Log, tag, msg);
    }
    CommonUtil.callLog = callLog;
    function logv(tag, msg) {
        callLog("v", tag, msg);
    }
    CommonUtil.logv = logv;
    function logd(tag, msg) {
        callLog("d", tag, msg);
    }
    CommonUtil.logd = logd;
    function logi(tag, msg) {
        callLog("i", tag, msg);
    }
    CommonUtil.logi = logi;
    function logw(tag, msg) {
        callLog("w", tag, msg);
        ;
    }
    CommonUtil.logw = logw;
    function loge(tag, msg) {
        callLog("e", tag, msg);
    }
    CommonUtil.loge = loge;
})(CommonUtil = exports.CommonUtil || (exports.CommonUtil = {}));
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewHook = void 0;
const DebugUtil_1 = require("../../game/util/DebugUtil");
var WebViewHook;
(function (WebViewHook) {
    function start() {
        Java.perform(() => {
            setWebContentsDebuggingEnabledHook();
        });
    }
    WebViewHook.start = start;
    function setWebContentsDebuggingEnabledHook() {
        let WebView = Java.use("android.webkit.WebView");
        WebView.setWebContentsDebuggingEnabled.overload("boolean").implementation = function (enabled) {
            DebugUtil_1.DebugUtil.LOGD("intercepted setWebContentsDebuggingEnabled...:" + enabled);
            this.setWebContentsDebuggingEnabled(true);
        };
    }
    WebViewHook.setWebContentsDebuggingEnabledHook = setWebContentsDebuggingEnabledHook;
    function setWebContentsDebuggingEnabledInvoke() {
        Java.perform(() => {
            Java.scheduleOnMainThread(() => {
                let WebView = Java.use("android.webkit.WebView");
                let setWebContentsDebuggingEnabledMethod = WebView.setWebContentsDebuggingEnabled.overload("boolean");
                setWebContentsDebuggingEnabledMethod.call(WebView, true);
            });
        });
    }
    WebViewHook.setWebContentsDebuggingEnabledInvoke = setWebContentsDebuggingEnabledInvoke;
})(WebViewHook = exports.WebViewHook || (exports.WebViewHook = {}));
},{"../../game/util/DebugUtil":7}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FridaAnti = void 0;
const DebugUtil_1 = require("../game/util/DebugUtil");
const NativeUtil_1 = require("../basic/NativeUtil");
var FridaAnti;
(function (FridaAnti) {
    var LOGD = DebugUtil_1.DebugUtil.LOGD;
    const anti_features = ["frida", "/tmp"];
    function hasAnti(content) {
        let lowerContent = content.toLowerCase();
        let anti_feature = anti_features.filter(anti_fea => lowerContent.indexOf(anti_fea) !== -1).pop();
        return anti_feature != undefined;
    }
    function start() {
        anti_open();
    }
    FridaAnti.start = start;
    function hook_openat() {
        let openatPtr = NativeUtil_1.NativeUtil.open_io.find_real_openat();
        Interceptor.attach(openatPtr, {
            onEnter: function (args) {
                let pathname = args[1].readCString();
                DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}  anti frida [openat]  ${DebugUtil_1.DebugUtil.getLine(16)}`);
                DebugUtil_1.DebugUtil.LOGW("\n[openat] args2:" + pathname);
                DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}${DebugUtil_1.DebugUtil.getLine(16)}`);
            }
        });
    }
    function maps_handle(pathnamestr, tag = "") {
        let io_redirect = true;
        if (io_redirect) {
            const insure_path = `/data/data/${NativeUtil_1.NativeUtil.proc.self_cmdline()}/files`;
            const maps_path = `${insure_path}/maps`;
            const content = NativeUtil_1.NativeUtil.proc.self_maps();
            NativeUtil_1.NativeUtil.stdlib.system_shell(`mkdir -p ${insure_path}`);
            DebugUtil_1.DebugUtil.LOGW("to_maps_file:" + maps_path);
            DebugUtil_1.DebugUtil.LOGD(tag + " anti_maps:" + pathnamestr + " io_redirect =>" + maps_path);
            let to_maps_file = new File(maps_path, "w");
            content.split("\n").map(v => {
                if (v.indexOf("/tmp") === -1) {
                    to_maps_file.write(v + "\n");
                }
            });
            to_maps_file.close();
            return NativeUtil_1.NativeUtil.open_io.open(maps_path, NativeUtil_1.NativeUtil.open_io.fcntl._O_RDONLY);
        }
        DebugUtil_1.DebugUtil.LOGD(tag + " anti_maps:" + pathnamestr);
        return -1;
    }
    function thread_handle(pathnamestr, tag = "") {
        DebugUtil_1.DebugUtil.LOGD(tag + " anti_thread:" + pathnamestr);
        NativeUtil_1.NativeUtil.pthread.pthread_exit();
        return -1;
    }
    function fd_handle(pathnamestr, tag = "") {
        DebugUtil_1.DebugUtil.LOGD(tag + " anti_fd:" + pathnamestr);
        return -1;
    }
    function status_handle(pathnamestr, tag = "") {
        DebugUtil_1.DebugUtil.LOGD(tag + " anti_status:" + pathnamestr);
        NativeUtil_1.NativeUtil.pthread.pthread_exit();
        return -1;
    }
    function root_handle(pathnamestr, tag = "") {
        DebugUtil_1.DebugUtil.LOGD(tag + " anti_root:" + pathnamestr);
        return -1;
    }
    function anti_for_openpath(pathname, defaultCall) {
        const pathnamestr = pathname.readCString();
        if (pathnamestr != null) {
            if (pathnamestr.indexOf("proc") != -1) {
                if (pathnamestr.indexOf("maps") > 0)
                    return maps_handle(pathnamestr);
                if (pathnamestr.indexOf("task") > 0 && pathnamestr.indexOf("stat") > 0)
                    return thread_handle(pathnamestr);
                if (pathnamestr.indexOf("fd") > 0)
                    return fd_handle(pathnamestr);
            }
            if (pathnamestr.indexOf("/su") != -1)
                return root_handle(pathnamestr);
        }
        return defaultCall();
    }
    function anti_open() {
        let openatPtr = NativeUtil_1.NativeUtil.open_io.find_real_openat();
        let openat_fun = NativeUtil_1.NativeUtil.open_io.openat_fun(openatPtr);
        Interceptor.replace(openatPtr, new NativeCallback(function (fd, pathname, flags) {
            return anti_for_openpath(pathname, () => openat_fun(fd, pathname, flags));
        }, "int", ["int", "pointer", "int"]));
    }
    function anti_syscall_openat() {
        let syscallPtr = NativeUtil_1.NativeUtil.unistd.get_syscall_call_ptr();
        let syscallFun = NativeUtil_1.NativeUtil.unistd.get_syscall_call_function();
        function handle_openat(args, sysFun) {
            return anti_for_openpath(args[2], () => sysFun.apply(null, args));
            ;
        }
        if (Process.arch === "arm64") {
            DebugUtil_1.DebugUtil.LOGD("anti_syscall_openat start arm64...");
            Interceptor.replace(syscallPtr, new NativeCallback(function (sysSign, arg1, arg2, arg3, arg4, arg5, arg6) {
                if (sysSign === NativeUtil_1.NativeUtil.unistd.syscall_asm.__NR_openat) {
                    DebugUtil_1.DebugUtil.LOGW("syscall openat arm64");
                    return handle_openat([...arguments], syscallFun);
                }
                return syscallFun(sysSign, arg1, arg2, arg3, arg4, arg5, arg6);
            }, "int", ["int", "pointer", "pointer", "pointer", "pointer", "pointer", "pointer"]));
        }
        else {
            DebugUtil_1.DebugUtil.LOGD("anti_syscall_openat start arm32...");
            Interceptor.replace(syscallPtr, new NativeCallback(function (sysSign, arg1, arg2, arg3) {
                if (sysSign === NativeUtil_1.NativeUtil.unistd.syscall_asm.__NR_openat) {
                    DebugUtil_1.DebugUtil.LOGW("syscall openat arm32");
                    return handle_openat([...arguments], syscallFun);
                }
                return syscallFun(sysSign, arg1, arg2, arg3);
            }, "int", ["int", "pointer", "pointer", "pointer"]));
        }
    }
    function hook_strcmp() {
        const strcmpPtr = Module.findExportByName("libc.so", "strcmp");
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    let s1 = args[0].readCString();
                    let s2 = args[1].readCString();
                    if (!s1 || !s2) {
                        return;
                    }
                    if (hasAnti(s1) || hasAnti(s2)) {
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}  anti frida [strcmp]  ${DebugUtil_1.DebugUtil.getLine(16)}`);
                        DebugUtil_1.DebugUtil.LOGW("\n [strcmp] args1:" + s1);
                        DebugUtil_1.DebugUtil.LOGW("\n [strcmp] args2:" + s2);
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}${DebugUtil_1.DebugUtil.getLine(16)}`);
                        NativeUtil_1.NativeUtil.pthread.pthread_exit();
                    }
                }
                catch (e) {
                }
            }
        });
    }
    function hook_strncmp() {
        const strcmpPtr = Module.findExportByName("libc.so", "strncmp");
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    let s1 = args[0].readCString();
                    let s2 = args[1].readCString();
                    let n = args[2].readInt();
                    if (!s1 || !s2) {
                        return;
                    }
                    if (hasAnti(s1) || hasAnti(s2)) {
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}  anti frida [strncmp]  ${DebugUtil_1.DebugUtil.getLine(16)}`);
                        DebugUtil_1.DebugUtil.LOGW("\n [strncmp] args1:" + s1);
                        DebugUtil_1.DebugUtil.LOGW("\n [strncmp] args2:" + s2);
                        DebugUtil_1.DebugUtil.LOGW("\n [strncmp] args3:" + n);
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}${DebugUtil_1.DebugUtil.getLine(16)}`);
                        Thread.sleep(99999);
                    }
                }
                catch (e) {
                }
            }
        });
    }
    function hook_strcasecmp() {
        const strcmpPtr = Module.findExportByName(null, "strcasecmp");
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    let s1 = args[0].readCString();
                    let s2 = args[1].readCString();
                    if (!s1 || !s2) {
                        return;
                    }
                    if (hasAnti(s1) || hasAnti(s2)) {
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}  anti frida [strcasecmp]  ${DebugUtil_1.DebugUtil.getLine(16)}`);
                        DebugUtil_1.DebugUtil.LOGW("\n [strcasecmp] args1:" + s1);
                        DebugUtil_1.DebugUtil.LOGW("\n [strcasecmp] args2:" + s2);
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}${DebugUtil_1.DebugUtil.getLine(16)}`);
                        Thread.sleep(99999);
                    }
                }
                catch (e) {
                }
            }
        });
    }
    function hook_strstr_and_anti() {
        const strcmpPtr = Module.findExportByName(null, "strstr");
        Interceptor.attach(strcmpPtr, {
            onEnter: function (args) {
                try {
                    this.hasFeature = false;
                    let haystack = args[0].readCString();
                    let needle = args[1].readCString();
                    if (!haystack || !needle) {
                        return;
                    }
                    if (hasAnti(needle)) {
                        this.hasFeature = true;
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}  anti frida [strstr]  ${DebugUtil_1.DebugUtil.getLine(16)}`);
                        DebugUtil_1.DebugUtil.LOGW("\n [strstr] args1:" + haystack);
                        DebugUtil_1.DebugUtil.LOGW("\n [strstr] args2:" + needle);
                        DebugUtil_1.DebugUtil.logL(`\n${DebugUtil_1.DebugUtil.getLine(16)}${DebugUtil_1.DebugUtil.getLine(16)}`);
                        NativeUtil_1.NativeUtil.pthread.pthread_exit();
                    }
                }
                catch (e) {
                }
            },
            onLeave: function (retval) {
                if (this.hasFeature) {
                    DebugUtil_1.DebugUtil.LOGW("\n [strstr] hasFeature:" + 0);
                    retval.replace(ptr(0));
                }
            }
        });
    }
    function hook_kill() {
        let exit_ptr = Module.findExportByName(null, "exit");
        let _exit_ptr = Module.findExportByName(null, "_exit");
        let kill_ptr = Module.findExportByName(null, "kill");
        let abort_ptr = Module.findExportByName(null, "abort");
        let raise_ptr = Module.findExportByName(null, "raise");
        DebugUtil_1.DebugUtil.LOGD(`hook kill
         exit ${exit_ptr} 
         _exit:${_exit_ptr}
         kill_ptr:${kill_ptr}
         abort_ptr:${abort_ptr}
         raise_ptr:${raise_ptr}
         `);
        Interceptor.attach(exit_ptr, {
            onEnter: function (args) {
                DebugUtil_1.DebugUtil.LOGW("exit called");
                let status = args[0].readInt();
                DebugUtil_1.DebugUtil.LOGW("exit STATUS:" + status);
            },
            onLeave: function (retval) {
            }
        });
        Interceptor.attach(_exit_ptr, {
            onEnter: function (args) {
                DebugUtil_1.DebugUtil.LOGW("_exit called");
                let status = args[0].readInt();
                DebugUtil_1.DebugUtil.LOGW("_EXIT STATUS:" + status);
            },
            onLeave: function (retval) {
            }
        });
        Interceptor.attach(kill_ptr, {
            onEnter: function (args) {
                DebugUtil_1.DebugUtil.LOGW("kill called");
                let pid = args[0].readInt();
                let sig = args[1].readInt();
                DebugUtil_1.DebugUtil.LOGW("kill called");
                DebugUtil_1.DebugUtil.LOGW("kill pid:" + pid);
                DebugUtil_1.DebugUtil.LOGW("kill sig:" + sig);
            },
            onLeave: function (retval) {
            }
        });
        Interceptor.attach(abort_ptr, {
            onEnter: function (args) {
                DebugUtil_1.DebugUtil.LOGW("abort called");
            },
            onLeave: function (retval) {
            }
        });
        Interceptor.attach(raise_ptr, {
            onEnter: function (args) {
                DebugUtil_1.DebugUtil.LOGW("raise called");
                let sig = args[0].readInt();
                DebugUtil_1.DebugUtil.LOGW("raise sig:" + sig);
            },
            onLeave: function (retval) {
            }
        });
    }
    function anti_kill() {
        let exit_ptr = Module.findExportByName(null, "exit");
        let _exit_ptr = Module.findExportByName(null, "_exit");
        Interceptor.replace(exit_ptr, new NativeCallback(function (status) {
            DebugUtil_1.DebugUtil.LOGD("anti exit");
        }, "void", ["int"]));
        Interceptor.replace(_exit_ptr, new NativeCallback(function (status) {
            DebugUtil_1.DebugUtil.LOGD("anti _exit");
        }, "void", ["int"]));
        let kill_ptr = Module.findExportByName(null, "kill");
        Interceptor.replace(kill_ptr, new NativeCallback(function (pid, sig) {
            DebugUtil_1.DebugUtil.LOGD("anti kill:" + pid);
            return 0;
        }, "int", ["int", "int"]));
        let abort_ptr = Module.findExportByName(null, "abort");
        Interceptor.replace(abort_ptr, new NativeCallback(function (v) {
            DebugUtil_1.DebugUtil.LOGD("anti abort");
        }, "void", ["void"]));
        let raise_ptr = Module.findExportByName(null, "raise");
        Interceptor.replace(raise_ptr, new NativeCallback(function (sig) {
            DebugUtil_1.DebugUtil.LOGD("anti raise");
            return 0;
        }, "int", ["int"]));
    }
    function anti_read() {
        let read_ptr = Module.findExportByName(null, "read");
        const read_fun = new NativeFunction(read_ptr, "int", ["int", "pointer", "int"]);
        let fgets = Module.findExportByName(null, "fgets");
        const fgets_fun = new NativeFunction(fgets, "pointer", ["pointer", "int", "pointer"]);
        LOGD(`anti read : readptr ${read_ptr}  fgetsptr:${fgets}`);
        Interceptor.replace(fgets_fun, new NativeCallback(function (s, size, stream) {
            let cs = fgets_fun(s, size, stream);
            let readCString = s.readCString();
            if (readCString != null && hasAnti(readCString)) {
                DebugUtil_1.DebugUtil.LOGD("fgets anti1:" + readCString);
                s.writeUtf8String("");
            }
            return cs;
        }, "pointer", ["pointer", "int", "pointer"]));
    }
})(FridaAnti = exports.FridaAnti || (exports.FridaAnti = {}));
},{"../basic/NativeUtil":4,"../game/util/DebugUtil":7}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeUtil = void 0;
const DebugUtil_1 = require("../game/util/DebugUtil");
var NativeUtil;
(function (NativeUtil) {
    let unistd;
    (function (unistd) {
        let syscall_asm;
        (function (syscall_asm) {
            syscall_asm[syscall_asm["__NR_openat"] = 56] = "__NR_openat";
            syscall_asm[syscall_asm["__NR_close"] = 57] = "__NR_close";
            syscall_asm[syscall_asm["__NR_vhangup"] = 58] = "__NR_vhangup";
            syscall_asm[syscall_asm["__NR_pipe2"] = 59] = "__NR_pipe2";
            syscall_asm[syscall_asm["__NR_quotactl"] = 60] = "__NR_quotactl";
            syscall_asm[syscall_asm["__NR_getdents64"] = 61] = "__NR_getdents64";
            syscall_asm[syscall_asm["__NR3264_lseek"] = 62] = "__NR3264_lseek";
            syscall_asm[syscall_asm["__NR_read"] = 63] = "__NR_read";
            syscall_asm[syscall_asm["__NR_write"] = 64] = "__NR_write";
        })(syscall_asm = unistd.syscall_asm || (unistd.syscall_asm = {}));
        function getpid() {
            const getpid_ptr = Module.findExportByName("libc.so", "getpid");
            const getpid_fun = new NativeFunction(getpid_ptr, "int", []);
            return getpid_fun();
        }
        unistd.getpid = getpid;
        function get_syscall_call_ptr() {
            let syscallPtr = Module.findExportByName("libc.so", "syscall");
            return syscallPtr;
        }
        unistd.get_syscall_call_ptr = get_syscall_call_ptr;
        function get_syscall_call_function() {
            const syscallPtr = get_syscall_call_ptr();
            let syscallFun = null;
            if (Process.arch === "arm64") {
                syscallFun = new NativeFunction(syscallPtr, "int", ["int", "pointer", "pointer", "pointer", "pointer", "pointer", "pointer"]);
            }
            else if (Process.arch === "arm") {
                syscallFun = new NativeFunction(syscallPtr, "int", ["int", "pointer", "pointer", "pointer"]);
            }
            return syscallFun;
        }
        unistd.get_syscall_call_function = get_syscall_call_function;
    })(unistd = NativeUtil.unistd || (NativeUtil.unistd = {}));
    let stdlib;
    (function (stdlib) {
        function system_shell(command) {
            const system_ptr = Module.findExportByName("libc.so", "system");
            const system_fun = new NativeFunction(system_ptr, "int", ["pointer"]);
            let commandStr = Memory.allocUtf8String(command);
            return system_fun(commandStr);
        }
        stdlib.system_shell = system_shell;
    })(stdlib = NativeUtil.stdlib || (NativeUtil.stdlib = {}));
    let stat;
    (function (stat) {
        stat.S_IRWXU = 0o700;
        stat.S_IRUSR = 0o0400;
        stat.S_IWUSR = 0o0200;
        stat.S_IXUSR = 0o0100;
        stat.S_IRWXG = 0o0070;
        stat.S_IRGRP = 0o0040;
        stat.S_IWGRP = 0o0020;
        stat.S_IXGRP = 0o0010;
        stat.S_IRWXO = 0o0007;
        stat.S_IROTH = 0o0004;
        stat.S_IWOTH = 0o0002;
        stat.S_IXOTH = 0o0001;
        stat.ACCESSPERMS = (stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO);
        stat.DEFFILEMODE = (stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP | stat.S_IROTH | stat.S_IWOTH);
    })(stat = NativeUtil.stat || (NativeUtil.stat = {}));
    let open_io;
    (function (open_io) {
        let fcntl;
        (function (fcntl) {
            fcntl[fcntl["_O_RDONLY"] = 0] = "_O_RDONLY";
            fcntl[fcntl["_O_WRONLY"] = 1] = "_O_WRONLY";
            fcntl[fcntl["_O_RDWR"] = 2] = "_O_RDWR";
            fcntl[fcntl["_O_APPEND"] = 8] = "_O_APPEND";
            fcntl[fcntl["_O_CREAT"] = 256] = "_O_CREAT";
            fcntl[fcntl["_O_BINARY"] = 32768] = "_O_BINARY";
            fcntl[fcntl["AT_FDCWD"] = -100] = "AT_FDCWD";
            fcntl[fcntl["_O_TRUNC"] = 512] = "_O_TRUNC";
            fcntl[fcntl["_O_ACCMODE"] = 3] = "_O_ACCMODE";
            fcntl[fcntl["creat"] = 769] = "creat";
        })(fcntl = open_io.fcntl || (open_io.fcntl = {}));
        function open(path, flags = fcntl._O_ACCMODE, model = 0) {
            let open_ptr = Module.findExportByName("libc.so", "open");
            let open_fun = new NativeFunction(open_ptr, "int", ["pointer", "int", "int"]);
            let path_ptr = Memory.allocUtf8String(path);
            return open_fun(path_ptr, flags, model);
        }
        open_io.open = open;
        function find_real_openat() {
            let openatPtr = null;
            let module = Module.load("libc.so");
            for (const symbol of module.enumerateSymbols()) {
                if (symbol.name.indexOf("__openat") != -1) {
                    openatPtr = symbol.address;
                    break;
                }
            }
            if (openatPtr == null) {
                DebugUtil_1.DebugUtil.LOGE("not found __open");
            }
            return openatPtr;
        }
        open_io.find_real_openat = find_real_openat;
        function openat_fun(openatPtr) {
            const openat_fun = new NativeFunction(openatPtr, "int", ["int", "pointer", "int"]);
            return openat_fun;
        }
        open_io.openat_fun = openat_fun;
        function read(fd, distBuf, _MaxCharCount) {
            let read_ptr = Module.findExportByName("libc.so", "read");
            let read_fun = new NativeFunction(read_ptr, "int", ["int", "pointer", "int"]);
            return read_fun(fd, distBuf, _MaxCharCount);
        }
        open_io.read = read;
        function readStr(fd, len = 0x528) {
            let buffer = Memory.alloc(len);
            read(fd, buffer, len);
            return buffer.readCString();
        }
        open_io.readStr = readStr;
        function close(fd) {
            let close_ptr = Module.findExportByName("libc.so", "close");
            let close_fun = new NativeFunction(close_ptr, "int", ["int"]);
            return close_fun(fd);
        }
        open_io.close = close;
    })(open_io = NativeUtil.open_io || (NativeUtil.open_io = {}));
    let pthread;
    (function (pthread) {
        function pthread_exit() {
            let pthread_exitPtr = Module.findExportByName("libc.so", "pthread_exit");
            let pthread_exitFun = new NativeFunction(pthread_exitPtr, "void", ["pointer"]);
            pthread_exitFun(ptr(0));
        }
        pthread.pthread_exit = pthread_exit;
    })(pthread = NativeUtil.pthread || (NativeUtil.pthread = {}));
    let proc;
    (function (proc) {
        function self_cmdline() {
            const path = "/proc/self/cmdline";
            const fd = open_io.open(path, open_io.fcntl._O_RDONLY);
            let str = open_io.readStr(fd);
            open_io.close(fd);
            return str;
        }
        proc.self_cmdline = self_cmdline;
        function self_maps() {
            const path = "/proc/self/maps";
            const fd = open_io.open(path, open_io.fcntl._O_RDONLY);
            const count = 8192;
            let stringBuffer = "";
            let buff = Memory.alloc(count);
            try {
                while (open_io.read(fd, buff, count) > 0) {
                    stringBuffer += buff.readCString();
                }
            }
            finally {
                open_io.close(fd);
            }
            return stringBuffer;
        }
        proc.self_maps = self_maps;
    })(proc = NativeUtil.proc || (NativeUtil.proc = {}));
})(NativeUtil = exports.NativeUtil || (exports.NativeUtil = {}));
},{"../game/util/DebugUtil":7}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cocos2dx3Hook = void 0;
var Cocos2dx3Hook;
(function (Cocos2dx3Hook) {
    var baseUtil = `(function () {
    window.getTypeName = function (obj) {
        return Object.prototype.toString.call(obj);
    }

    window.mapToObj = function (map) {
        var tmpObj = {};
        let entries = map.entries();
        for (var item of entries) {
            tmpObj[item[0]] = item[1];
        }
        return tmpObj;
    }

    //避免循环引用
    window.jsonStringify = function (obj) {
        const seen = new Set();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]'
                }
                seen.add(value); // 将当前对象加入 Set 中
            }

            return value;
        });
    }
    window.toObjJson = function (obj, jsonStore = new Map(), record = "root", set = new Set(), maxDepth = 4) {
        if (obj === Object.prototype
            || obj === Object.prototype.constructor
            || obj === Function.prototype
            || obj === Function.prototype.constructor
            || obj === Array.prototype
            || obj === Array.prototype.constructor
            || set.has(obj)
            || (window.isWrapperProxy && window.isWrapperProxy(obj))
        ) {
            return;
        }

        set.add(obj);

        var depth = record.split(".");
        var isRoot = !depth || depth.length == 1;

        if (depth && depth.length > maxDepth) {
            return;
        }

        var thisType = window.getTypeName(obj);
        if (isRoot) {
            jsonStore.set("thisType", thisType)
        }


        var key = record;
        var v = obj;
        if (thisType == "[object Function]") {
            var funStr = "function " + v.name + "(args:" + v.length + "){ }";
            jsonStore.set(key, funStr);
        } else if (thisType == "[object Object]") {
            var propertyNames = Object.getOwnPropertyNames(obj);
            for (let propertyName of propertyNames) {
                if (obj.hasOwnProperty(propertyName)) {
                    toObjJson(obj[propertyName], jsonStore, record + "." + propertyName, set)
                }
            }
        } else if (obj == null) {
            jsonStore.set(key, "Null")
        } else {
            jsonStore.set(key, v);
        }

        //function 可能是构造函数  Object 也有可能是实例
        if (thisType == "[object Function]" || thisType == "[object Object]") {
            var prototype = Object.getPrototypeOf(obj);
            toObjJson(prototype, jsonStore, record + ".super", set)

            prototype = obj.prototype
            toObjJson(prototype, jsonStore, record + ".class", set)
        }


        if (isRoot) {
            return window.jsonStringify(window.mapToObj(jsonStore));
        }
        return;
    }
})();`;
    var hookContent = `var cc = cc || {};
(function () {
    console.log = console.log || log;


    window.applyBeforeHandlers = [];
    window.constructBeforeHandlers = [];
    window.getBeforeHandlers = [];

    window.applyAfterHandlers = [];
    window.constructAfterHandlers = [];
    window.getAfterHandlers = [];


    window.proxyEntry = function (type, args) {

        if (type === "apply") {
            for (let handler of window.applyBeforeHandlers) {
                handler(args);
            }
        } else if (type === "construct") {
            for (let handler of window.constructBeforeHandlers) {
                handler(args);
            }
        } else if (type === "get") {
            for (let handler of window.getBeforeHandlers) {
                handler(args);
            }
        }
    };


    window.getLeaveApplyHandler = function () {
        return [];
    }

    window.proxyLeave = function (type, args, ret) {

        if (type === "apply") {
            for (let handler of window.applyAfterHandlers) {
                ret = handler(args, ret);
            }
        } else if (type === "construct") {
            for (let handler of window.constructAfterHandlers) {
                ret = handler(args, ret);
            }
        } else if (type === "get") {
            for (let handler of window.getAfterHandlers) {
                ret = handler(args, ret);
            }
        }

        return ret;
    };

    window.proxyWrapper = function (obj) {
        //多层代理可能导致不可控的情况发生
        if (window.isWrapperProxy(obj)) {
            return obj;
        }
        var proxyObj = new Proxy(obj, {
            construct: function (target, argArray, newTarget) {
                window.proxyEntry("construct", arguments);
                var args = [null].concat(argArray);
                var tmpFun = (Function.prototype.bind.apply(target, args));
                var tmp = new tmpFun();
                try {
                    var ret = window.proxyLeave("construct", arguments, tmp);
                    return ret;
                } catch (e) {
                    log("[proxy log] error construct " + e.message)
                    log("[proxy log] error apply stack" + e.stack)
                }
                return tmp;
            },
            apply: function (target, thisArg, argArray) {
                window.proxyEntry("apply", arguments);
                var tmp = target.apply(thisArg, argArray);
                try {
                    var ret = window.proxyLeave("apply", arguments, tmp);
                    return ret;
                } catch (e) {
                    log("[proxy log] error apply " + e.message)
                    log("[proxy log] error apply stack" + e.stack)
                }
                return tmp;
            },
            get: function (target, p, receiver) {
                window.proxyEntry("get", arguments);
                var tmp = target[p];
                if (p == "_raw") {
                    //避免后续 处理器 处理
                    return tmp;
                }
                try {
                    var ret = window.proxyLeave("get", arguments, tmp);
                    return ret;
                } catch (e) {
                    log("[proxy log] error get " + e.message)
                    log("[proxy log] error get stack" + e.stack)
                }
                return tmp;
            }
        });
        proxyObj["_raw"] = obj;
        return proxyObj;
    };

    window.isWrapperProxy = function (obj) {
        let typeName = typeof obj;
        if (!obj || !(typeName == "function" || typeName == "object")) {
            return false;
        }
        return ("_raw" in obj) && (obj["_raw"] != obj);
    }
    window.getRawObject = function (obj) {
        if (window.isWrapperProxy(obj)) {
            return obj["_raw"];
        }
        return obj;
    }
})();`;
    var dumpRoot = `(function () {
    window.exist_dumps = new Set();
    window.dumpRoot = function () {
        let keys = Object.keys(window);
        for (let prop of keys) {
            try {
                let tmp = window[prop];
                if (!exist_dumps.has(tmp)) {
                    exist_dumps.add(tmp);
                    var root = new Map();
                    root.set("rootProp", prop);
                    var dumpJson = window.toObjJson(window[prop], root);
                    if (dumpJson != null) {
                        log("dumpRoot:" + dumpJson)
                    }
                }

            } catch (e) {
                log("[dumpError]:" + e.toString() + e.stack);
            }
        }
    }
})();`;
    var hookCCGameRun = `(function () {
    window.backCCGameRun = cc.game.run;
    cc.game.run = function (){
        log("cc.game.run before>>>>>>>>>>>>>>")
        window.backCCGameRun.apply(cc.game,arguments);
        cc.Class.extend = window.proxyWrapper(cc.Class.extend);
        log("cc.game.run after>>>>>>>>>>>>>>")
    }
})();`;
    var CClassExtendConstructHandler = `(function () {
    window.applyAfterHandlers.push(function (args, ret) {
        if(ret instanceof Object){
            if (ret && ("extend" in ret)) {
                var isCCClass = ret.extend === cc.Class.extend;
                if (isCCClass) {
                    //包装 ccclass 注意 这个是 extend 创建的类 只是包装类
                    ret = window.proxyWrapper(ret);
                }
            }
        }

        return ret;
    });
})();`;
    var DefaultCClassInstanceHandler = `(function () {
    //目前只有针对实例dump window 下所有 绑定对象
    //对于已经dump 过的 会忽略  如果内置被改变过 可能 不会更新
    //您可以自由修改 dumpRoot 逻辑完成 自定义dump
    window.constructAfterHandlers.push(function (args, ret) {
        window.dumpRoot();
        return ret;
    });
})();`;
    var hookContents = [baseUtil, hookContent, dumpRoot];
    var hookCCGame = [hookCCGameRun];
    var hookCCClass = [CClassExtendConstructHandler, DefaultCClassInstanceHandler];
    function getHookContents() {
        return new JSHookBuilder()
            .hookCCGame()
            .ccClassConstructHandler()
            .proxyWindowPrototypeFunctionHandler("charManager", "createAllChar")
            .proxyWindowPrototypeFunctionHandler("tiledManager", "judgeIsCheat")
            .proxyWindowPrototypeFunctionHandler("charManager", "getEntity")
            .proxyWindowObjectFunctionHandler("pomelo", "newRequest")
            .custom(`
          (function () {
    //debug getEntity 后属性增强
    window.applyAfterHandlers.push(function (args, ret) {
        let target = args[0];
        let thisArg = args[1];
        let argArray = args[2];

        let windowClassName = "charManager";
        let prototypeFunName = "getEntity";
        if (window.hasOwnProperty(windowClassName)) {
            let windowClass = window[windowClassName]
            if (thisArg instanceof windowClass) {
                try {
                    let isPrototypeFun = window.getRawObject(windowClass.prototype[prototypeFunName]) === window.getRawObject(target);
                    if (isPrototypeFun && thisArg.hasOwnProperty("allChars")) {
                        let allChars = thisArg["allChars"];
                        // log("[proxy log] addAttributeByAll allChars:" + window.toObjJson(allChars));
                        if (allChars.length > 0) {
                            if(!window.hasOwnProperty("charManagerInstance") || window["charManagerInstance"]!==thisArg){
                                log("[proxy log] getEntity isPrototypeFun:" + isPrototypeFun);

                                //对于对一次 allChars == 0 那么进行初始化
                                //用于还原数据
                                window.cheatRestoreFuns = [];
                                //对于特殊情况的 如 baseAttribute attack 的还原
                                window.baseGetAttrHandles = [];
                                window["charManagerInstance"] = thisArg;
                                for (let allChar of allChars) {
                                    if (allChar.hasOwnProperty("cMo")) {
                                        let cMo = allChar["cMo"];
                                        // log("[proxy log] Antiwear " + (cMo instanceof window["Antiwear"]));
                                        // log("[proxy log] Antiwear setEncryptProperty:" + ("setEncryptProperty" in cMo));
                                        // log("[proxy log] Antiwear defineEncryptGetterSetter:" + ("defineEncryptGetterSetter" in cMo));
                                        let lastAttr = cMo["lastAttr"];
                                        let baseAttr = cMo["baseAttr"];
                                        cMo["baseAttr"] = window.proxyWrapper(baseAttr);

                                        let hpNow = cMo.getEncryptProperty("hpNow");
                                        let mpNow = cMo.getEncryptProperty("mpNow");
                                        let hpMax = lastAttr.getEncryptProperty("hpMax");
                                        let mpMax = lastAttr.getEncryptProperty("mpMax");
                                        let attack = lastAttr.getEncryptProperty("attack");
                                        let reHP = lastAttr.getEncryptProperty("reHP");
                                        let reMP = lastAttr.getEncryptProperty("reMP");

                                        log("[proxy log] hpMax:" + hpMax)
                                        log("[proxy log] mpMax:" + mpMax)
                                        log("[proxy log] hpNow:" + hpNow)
                                        log("[proxy log] mpNow:" + mpNow)
                                        log("[proxy log] attack:" + attack)
                                        log("[proxy log] reHP:" + reHP)
                                        log("[proxy log] reMP:" + reMP)

                                        let multiple = 20;
                                        let expand = 20;

                                        cMo.setEncryptProperty("hpNow", hpNow * multiple);
                                        cMo.setEncryptProperty("mpNow", mpNow * multiple);

                                        baseAttr.setEncryptProperty("attack", attack * expand);

                                        lastAttr.setEncryptProperty("hpMax", hpMax * multiple);
                                        lastAttr.setEncryptProperty("mpMax", mpMax * multiple);
                                        // lastAttr.setEncryptProperty("reHP", reHP * multiple + 100);
                                        // lastAttr.setEncryptProperty("reMP", reMP * multiple + 100);

                                        let cheatRestoreFun = function () {
                                            cMo.setEncryptProperty("hpNow", hpNow);
                                            cMo.setEncryptProperty("mpNow", mpNow);

                                            baseAttr.setEncryptProperty("attack", attack);

                                            lastAttr.setEncryptProperty("hpMax", hpMax);
                                            lastAttr.setEncryptProperty("mpMax", mpMax);
                                            lastAttr.setEncryptProperty("reHP", reHP);
                                            lastAttr.setEncryptProperty("reMP", reMP);
                                            log("[proxy log] hpMax restore:" + hpMax)
                                            log("[proxy log] mpMax restore:" + mpMax)
                                            log("[proxy log] hpNow restore:" + hpNow)
                                            log("[proxy log] mpNow restore:" + mpNow)
                                            log("[proxy log] attack restore:" + attack)
                                            log("[proxy log] reHP restore:" + reHP)
                                            log("[proxy log] reMP restore:" + reMP)
                                        };
                                        // window.setTimeout(cheatRestoreFun, 10000);
                                        //这个用于在 isCheat 中 还原
                                        window.cheatRestoreFuns.push(cheatRestoreFun);
                                        //这个在 tiledManager.prototype.judgeGameOver 中还原
                                        window.baseGetAttrHandles.push(function (target, p, receiver) {
                                            let baseAttr1 = baseAttr === target;

                                            if (baseAttr1) {
                                                let locationStack = new Error().stack;
                                                if (locationStack.indexOf("judgeGameOver") != -1) {
                                                    log("[proxy log] judgeGameOver baseAttr1:" + baseAttr1);
                                                    log("[proxy log] judgeGameOver baseAttr property:" + p);
                                                    log("[proxy log] judgeGameOver baseAttr stack" + locationStack);
                                                    if (p === "attack") {
                                                        baseAttr.setEncryptProperty("attack", attack);
                                                    }
                                                }
                                            }
                                        });
                                        // cMo.baseAttr.setEncryptProperty("attack",9999);
                                        // log("[proxy log] find cMo" + window.toObjJson(cMo));

                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    log("[proxy log] error " + e.message)
                    log("[proxy log] error stack" + e.stack)
                }
            }
        }
        return ret;
    });
})();
            `)
            .custom(`(function () {
    //debug
    window.getBeforeHandlers.push(function (args) {
        let target = args[0];
        let p = args[1];
        let receiver = args[2];

        if (window.baseGetAttrHandles && window.baseGetAttrHandles.length > 0) {
            for (let baseGetAttrHandle of window.baseGetAttrHandles) {
                baseGetAttrHandle.call(null,target,p,receiver);
            }
        }
    });
})();`)
            .custom(`(function () {
    //debug
    window.applyAfterHandlers.push(function (args, ret) {
        let target = args[0];
        let thisArg = args[1];
        let argArray = args[2];

        let windowClassName = "tiledManager";
        let prototypeFunName = "judgeIsCheat";

        if (window.hasOwnProperty(windowClassName)) {
            let windowClass = window[windowClassName]
            if (thisArg instanceof windowClass) {
                try {
                    let isPrototypeFun = window.getRawObject(windowClass.prototype[prototypeFunName]) === window.getRawObject(target);
                    log("[proxy log]  tiledManager " + prototypeFunName + ":" + isPrototypeFun)
                    if (isPrototypeFun) {
                        log("[proxy log]  tiledManager " + prototypeFunName + " ret:" + ret);
                        return false;
                    }
                } catch (e) {
                    log("[proxy log] error " + e.message)
                    log("[proxy log] error stack" + e.stack)
                }
            }
        }

        return ret;
    });
})();`)
            .custom(`(function () {
    //debug
    window.applyBeforeHandlers.push(function (args) {
        let target = args[0];
        let thisArg = args[1];
        let argArray = args[2];

        let windowClassName = "tiledManager";
        let prototypeFunName = "judgeIsCheat";

        if (window.hasOwnProperty(windowClassName)) {
            let windowClass = window[windowClassName]
            if (thisArg instanceof windowClass) {
                try {
                    let isPrototypeFun = window.getRawObject(windowClass.prototype[prototypeFunName]) === window.getRawObject(target);
                    log("[proxy log]  tiledManager before: " + prototypeFunName + ":" + isPrototypeFun)
                    if (isPrototypeFun) {
                        if (window.cheatRestoreFuns && window.cheatRestoreFuns.length > 0) {
                            for (let cheatRestoreFun of window.cheatRestoreFuns) {
                                cheatRestoreFun.call();
                            }
                        }
                    }
                } catch (e) {
                    log("[proxy log] error " + e.message)
                    log("[proxy log] error stack" + e.stack)
                }
            }
        }

    });
})();`)
            .getHooks();
    }
    Cocos2dx3Hook.getHookContents = getHookContents;
    class JSHookBuilder {
        hooks = [];
        constructor() {
            this.hooks = this.hooks.concat(hookContents);
        }
        hookCCGame() {
            this.hooks = this.hooks.concat(hookCCGame);
            return this;
        }
        ccClassConstructHandler() {
            this.hooks = this.hooks.concat(CClassExtendConstructHandler);
            return this;
        }
        consoleLogTail() {
            let script = `(function () {
                            window.applyAfterHandlers.push(function (args, ret) {
                                if (!window.hasOwnProperty("backConsoleLog")) {
                                    window.backConsoleLog = console.log || cc.log;
                                    console.log = function () {
                                        window.backConsoleLog.apply(null, arguments);
                                        log("[console tail]" + new Error().stack);
                                    }
                                    cc.log = console.log;
                                }
                                return ret;
                            });
                        })();`;
            this.hooks.push(script);
            return this;
        }
        dumpHandler() {
            this.hooks = this.hooks.concat(DefaultCClassInstanceHandler);
            return this;
        }
        proxyObjectCreateHandler() {
            let script = `
            (function(){
               window.constructAfterHandlers.push(function (args, ret) {
                    //这个判断 可以检测到 原型链中
                    if (!window.isWrapperProxy(Object.create)) {
                        Object.create = window.proxyWrapper(Object.create);
                        log("[proxy log] proxyWrapper >>>>>>>>>>>Object.create")
                    }
                    return ret;
                });
            })();
            `;
            this.hooks.push(script);
            return this;
        }
        proxyObjectCreateWindowClassHandler(windowProp) {
            let script = `
            (function(){
                    window.applyAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let thisArg = args[1];
                        let argArray = args[2];
                        //Object.create
                        if (window.getRawObject(target) == window.getRawObject(Object.create)) {
                            log("[proxy log] proxy obj for 2222222222:");
                            let proxyClass = "${windowProp}";
                            let prototype = argArray[0];
                            if ((proxyClass in window)) {
                               log("[proxy log] proxy obj for 》》》》》》》》》:");
                            }
                        }
                        return ret;
                    });
            })();
            `;
            this.hooks.push(script);
            return this;
        }
        proxyWindowClassHandler(windowProp) {
            let script = `
            (function(){
                window.constructAfterHandlers.push(function (args, ret) {
                    let proxyClass = "${windowProp}";
                    //这个判断 可以检测到 原型链中
                    if (proxyClass in window) {
                        if (!window.isWrapperProxy(window[proxyClass])) {
                            log("[proxy log]proxy class>>>>>>>>>>>>>>>>>>>>>>>>>>>>>:" + proxyClass);
                            let _raw = window[proxyClass];
                            window[proxyClass] = window.proxyWrapper(_raw);
                        }
                    }
                    return ret;
                });
            })();
            `;
            this.hooks.push(script);
            return this;
        }
        proxyWindowObjectFunctionHandler(windowProp, propertyFunName) {
            let script = `(function () {
    window.constructAfterHandlers.push(function (args, ret) {
        let proxyClass = "${windowProp}";
        let propertyFunName = "${propertyFunName}";
        try {
            if (proxyClass in window) {
                if (window[proxyClass] != null) {
                    if (propertyFunName in (window[proxyClass])) {
                        let propertyFun = window[proxyClass][propertyFunName];
                        if (!window.isWrapperProxy(propertyFun)) {
                            log("[proxy log] proxy object fun: " + proxyClass + " function " + propertyFunName + "()")
                            window[proxyClass][propertyFunName] = window.proxyWrapper(propertyFun);
                        }
                    }
                }
            }
        } catch (e) {
            log("[proxy log] ${windowProp}  ${propertyFunName} error " + e.message)
            log("[proxy log] ${windowProp} ${propertyFunName} error stack" + e.stack)
        }
        return ret;
    });
})();`;
            this.hooks.push(script);
            return this;
        }
        proxyWindowPrototypeFunctionHandler(windowProp, prototypeFun) {
            let script = `(function () {
    window.constructAfterHandlers.push(function (args, ret) {
        let proxyClass = "${windowProp}";
        let prototypeFun = "${prototypeFun}";
        try {
            if (proxyClass in window) {
                if (window[proxyClass] != null) {
                    if (prototypeFun in (window[proxyClass].prototype)) {
                        let prototypeObj = window[proxyClass].prototype;
                        if (!window.isWrapperProxy(prototypeObj[prototypeFun])) {
                            log("[proxy log] proxy prototype: " + proxyClass + " function " + prototypeFun + "()")
                            prototypeObj[prototypeFun] = window.proxyWrapper(prototypeObj[prototypeFun]);
                        }
                    }
                }
            }
        } catch (e) {
            log("[proxy log] ${windowProp}  ${prototypeFun} error " + e.message)
            log("[proxy log] ${windowProp} ${prototypeFun} error stack" + e.stack)
        }
        return ret;
    });
})();
            `;
            this.hooks.push(script);
            return this;
        }
        proxyFunctionHandler() {
            let script = `
                (function(){
                    window.getAfterHandlers.push(function (args, ret) {
                        if (Object.prototype.toString.call(ret) === "[object Function]") {
                            return window.proxyWrapper(ret);
                        }
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script);
            return this;
        }
        logProxyGetHandler(windowClassName = "") {
            let script = `
                (function(){
                    window.getAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let p = args[1];
                        let receiver = args[2];
                
                        let windowProxyName = "${windowClassName}";
                        if (!windowProxyName || (windowProxyName in window
                            && (window.getRawObject(window[windowProxyName]) === window.getRawObject(target)))) {
                            try {
                                log("[proxy log] get target:" + window.toObjJson(window.getRawObject(target)));
                                log("[proxy log] get p:" + p.toString());
                                log("[proxy log] get stack:" + new Error().stack)
                            } catch (e) {
                                log("error:" + e.toString())
                            }
                        }
                
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script);
            return this;
        }
        logProxyApplyHandler(windowClassName = "") {
            let script = `
                (function(){
                    window.applyAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let thisArg = args[1];
                        let argArray = args[2];
                
                        try {
                            log("[proxy log] apply:"
                                + window.toObjJson(window.getRawObject(target)));
                            log("[proxy log] apply ret:"
                                + window.toObjJson(window.getRawObject(ret)));    
                            log("[proxy log] apply this:"
                                + window.toObjJson(window.getRawObject(thisArg)));
                            log("[proxy log] apply stack:"
                                + new Error().stack);    
                        } catch (e) {
                            log("[proxy log] apply error:" + e.message)
                            log("[proxy log] apply error:" + e.stack)
                        }
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script);
            return this;
        }
        logProxyConstructHandler(windowClassName = "") {
            let script = `
                (function(){
                     window.constructAfterHandlers.push(function (args, ret) {
                        let target = args[0];
                        let argArray = args[1];
                        let newTarget = args[2];
                        
                         try {
                            log("[proxy log] construct ret:"
                                + window.toObjJson(window.getRawObject(ret)));    
                        } catch (e) {
                            log("[proxy log] construct error target:"
                                + window.toObjJson(window.getRawObject(target)));
                            log("[proxy log] construct error:" + e.message)
                            log("[proxy log] construct error:" + e.stack)
                        }
                        return ret;
                    });
                })();
             `;
            this.hooks.push(script);
            return this;
        }
        custom(...js) {
            this.hooks.push(...js);
            return this;
        }
        getHooks() {
            return this.hooks;
        }
    }
    Cocos2dx3Hook.JSHookBuilder = JSHookBuilder;
})(Cocos2dx3Hook = exports.Cocos2dx3Hook || (exports.Cocos2dx3Hook = {}));
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cocos2dxjs = exports.soName = void 0;
const DebugUtil_1 = require("./util/DebugUtil");
const Cocos2dx3Hook_1 = require("./Cocos2dx3Hook");
const CommonUtil_1 = require("../android/CommonUtil");
exports.soName = "libcocos2djs.so";
var Cocos2dxjs;
(function (Cocos2dxjs) {
    var LOGE = DebugUtil_1.DebugUtil.LOGE;
    var LogColor = DebugUtil_1.DebugUtil.LogColor;
    var libcocos2djsModule;
    const bridgeAndroidLog = false;
    function start() {
        if (bridgeAndroidLog) {
            console.error = (message) => {
                CommonUtil_1.CommonUtil.loge("frida", message);
            };
            DebugUtil_1.DebugUtil.LOG = (str, type = LogColor.WHITE) => {
                CommonUtil_1.CommonUtil.logd("frida", str);
            };
            console.log = (message) => {
                CommonUtil_1.CommonUtil.logd("frida", message);
            };
        }
        console.log("start Cocos2dxjs!");
        DebugUtil_1.DebugUtil.whenSoOpen((path) => {
            if (path.includes(exports.soName)) {
                console.error(path);
                _run();
            }
        });
    }
    Cocos2dxjs.start = start;
    function _run() {
        get_libcocos2djsModule();
        hook_js_log();
        hook_ScriptingCore_runScript();
        hook_requireScript();
    }
    function get_libcocos2djsModule() {
        if (!libcocos2djsModule) {
            libcocos2djsModule = Process.findModuleByName(exports.soName);
        }
        return libcocos2djsModule;
    }
    function start_hook_cocos2dxjs_for_javabridge() {
        Java.perform(() => {
            let hookContents = Cocos2dx3Hook_1.Cocos2dx3Hook.getHookContents();
            hookContents.forEach(script => {
                let evalRet = call_Cocos2dxJavascriptJavaBridge_evalString(script);
                DebugUtil_1.DebugUtil.LOGE("evalRet:" + evalRet);
            });
        });
    }
    Cocos2dxjs.start_hook_cocos2dxjs_for_javabridge = start_hook_cocos2dxjs_for_javabridge;
    function start_hook_cocos2dxjs() {
        let hookContents = Cocos2dx3Hook_1.Cocos2dx3Hook.getHookContents();
        hookContents.forEach(script => {
            let evalRet = call_ScriptingCore_evalString(script);
            DebugUtil_1.DebugUtil.LOGW("-----------------------------evalRet:" + evalRet);
        });
    }
    Cocos2dxjs.start_hook_cocos2dxjs = start_hook_cocos2dxjs;
    function getScriptingCoreInstance() {
        let ScriptingCoreInstancePtr = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore11getInstanceEv");
        let ScriptingCoreInstanceFun = new NativeFunction(ScriptingCoreInstancePtr, "pointer", []);
        return ScriptingCoreInstanceFun();
    }
    function hook_js_log() {
        let module = libcocos2djsModule;
        let js_log = module.findExportByName("_Z6js_logPKcz");
        console.log("js_log_pointer:" + js_log);
        Interceptor.attach(js_log, {
            onEnter: function (args) {
                let log_info = args[1];
                let log_str = log_info.readCString();
                const dump_prefix = "dumpRoot:";
                const proxy_prefix = "[proxy log]";
                const console_tail = "[console tail]";
                if (log_str?.startsWith(dump_prefix)) {
                    let dump_log = log_str?.substring(dump_prefix.length);
                    let rpc_msg = {
                        "type": "dump",
                        "dump_log": dump_log
                    };
                    send(rpc_msg);
                }
                else if (log_str?.startsWith(proxy_prefix)) {
                    DebugUtil_1.DebugUtil.LOGD(log_str);
                }
                else if (log_str?.startsWith(console_tail)) {
                    DebugUtil_1.DebugUtil.LOGG(log_str);
                }
                else {
                    console.log("js log:" + log_str);
                }
            }
        });
    }
    Cocos2dxjs.hook_js_log = hook_js_log;
    function call_ScriptingCore_evalString(content, scriptingCoreInstance) {
        let ScriptingCore_evalString_ptr = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore10evalStringEPKc");
        let ScriptingCore_evalString_fun = new NativeFunction(ScriptingCore_evalString_ptr, "bool", ["pointer", "pointer"]);
        scriptingCoreInstance = scriptingCoreInstance || getScriptingCoreInstance();
        const contentPointer = Memory.allocUtf8String(content);
        let ret = ScriptingCore_evalString_fun(scriptingCoreInstance, contentPointer);
        return ret;
    }
    function call_Cocos2dxJavascriptJavaBridge_evalString(content) {
        let Cocos2dxJavascriptJavaBridge_evalString_ptr = get_libcocos2djsModule().findExportByName("Java_org_cocos2dx_lib_Cocos2dxJavascriptJavaBridge_evalString");
        let Cocos2dxJavascriptJavaBridge_evalString_fun = new NativeFunction(Cocos2dxJavascriptJavaBridge_evalString_ptr, "int", ["pointer", "pointer", "pointer"]);
        let env = Java.vm.getEnv();
        let jniString = env.newStringUtf(content);
        return Cocos2dxJavascriptJavaBridge_evalString_fun(env, ptr(0), jniString);
    }
    function hook_ScriptingCore_runScript() {
        let ScriptingCore_runScript_ptr = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore9runScriptERKSs");
        Interceptor.attach(ScriptingCore_runScript_ptr, {
            onEnter: function (args) {
                this.path = args[1].readPointer().readCString();
                if (this.path == "main.js") {
                    start_hook_cocos2dxjs();
                }
                console.log("ScriptingCore_runScript_ptr:", this.path);
            },
            onLeave: function () {
            }
        });
    }
    function hookScriptingCoreStart() {
        let ScriptingCoreStart_ptr = get_libcocos2djsModule().findExportByName("_ZN13ScriptingCore5startEv");
        let ScriptingCoreStart_fun = new NativeFunction(ScriptingCoreStart_ptr, "int", ["pointer"]);
        let ScriptingCoreStart_Callback = new NativeCallback(function (_this) {
            let ret = ScriptingCoreStart_fun(_this);
            console.log("ScriptingCoreStart_Callback after");
            return ret;
        }, "int", ["pointer"]);
        Interceptor.replace(ScriptingCoreStart_ptr, ScriptingCoreStart_Callback);
    }
    function hook_requireScript() {
        let requireScript_ptr = get_libcocos2djsModule()
            .findExportByName("_ZN13ScriptingCore13requireScriptEPKcN2JS6HandleIP8JSObjectEEP9JSContextNS2_13MutableHandleINS2_5ValueEEE");
        let requireScript_fun = new NativeFunction(requireScript_ptr, "bool", ["pointer", "pointer", "pointer", "pointer", "pointer"]);
        Interceptor.attach(requireScript_fun, {
            onEnter: function (args) {
                this.path = args[1].readCString();
            },
            onLeave: function () {
                LOGE("hook_requireScript:" + this.path);
            }
        });
    }
})(Cocos2dxjs = exports.Cocos2dxjs || (exports.Cocos2dxjs = {}));
},{"../android/CommonUtil":1,"./Cocos2dx3Hook":5,"./util/DebugUtil":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugUtil = void 0;
var DebugUtil;
(function (DebugUtil) {
    DebugUtil.logL = console.log;
    let LogColor;
    (function (LogColor) {
        LogColor[LogColor["WHITE"] = 0] = "WHITE";
        LogColor[LogColor["RED"] = 1] = "RED";
        LogColor[LogColor["YELLOW"] = 3] = "YELLOW";
        LogColor[LogColor["C31"] = 31] = "C31";
        LogColor[LogColor["C32"] = 32] = "C32";
        LogColor[LogColor["C33"] = 33] = "C33";
        LogColor[LogColor["C34"] = 34] = "C34";
        LogColor[LogColor["C35"] = 35] = "C35";
        LogColor[LogColor["C36"] = 36] = "C36";
        LogColor[LogColor["C41"] = 41] = "C41";
        LogColor[LogColor["C42"] = 42] = "C42";
        LogColor[LogColor["C43"] = 43] = "C43";
        LogColor[LogColor["C44"] = 44] = "C44";
        LogColor[LogColor["C45"] = 45] = "C45";
        LogColor[LogColor["C46"] = 46] = "C46";
        LogColor[LogColor["C90"] = 90] = "C90";
        LogColor[LogColor["C91"] = 91] = "C91";
        LogColor[LogColor["C92"] = 92] = "C92";
        LogColor[LogColor["C93"] = 93] = "C93";
        LogColor[LogColor["C94"] = 94] = "C94";
        LogColor[LogColor["C95"] = 95] = "C95";
        LogColor[LogColor["C96"] = 96] = "C96";
        LogColor[LogColor["C97"] = 97] = "C97";
        LogColor[LogColor["C100"] = 100] = "C100";
        LogColor[LogColor["C101"] = 101] = "C101";
        LogColor[LogColor["C102"] = 102] = "C102";
        LogColor[LogColor["C103"] = 103] = "C103";
        LogColor[LogColor["C104"] = 104] = "C104";
        LogColor[LogColor["C105"] = 105] = "C105";
        LogColor[LogColor["C106"] = 106] = "C106";
        LogColor[LogColor["C107"] = 107] = "C107";
    })(LogColor = DebugUtil.LogColor || (DebugUtil.LogColor = {}));
    let linesMap = new Map();
    DebugUtil.getLine = (length, fillStr = "-") => {
        if (length == 0)
            return "";
        let key = length + "|" + fillStr;
        if (linesMap.get(key) != null)
            return linesMap.get(key);
        for (var index = 0, tmpRet = ""; index < length; index++)
            tmpRet += fillStr;
        linesMap.set(key, tmpRet);
        return tmpRet;
    };
    DebugUtil.LOG = (str, type = LogColor.WHITE) => {
        switch (type) {
            case LogColor.WHITE:
                DebugUtil.logL(str);
                break;
            case LogColor.RED:
                console.error(str);
                break;
            case LogColor.YELLOW:
                console.warn(str);
                break;
            default:
                DebugUtil.logL("\x1b[" + type + "m" + str + "\x1b[0m");
                break;
        }
    };
    DebugUtil.LOGW = (msg) => DebugUtil.LOG(msg, LogColor.YELLOW);
    DebugUtil.LOGE = (msg) => DebugUtil.LOG(msg, LogColor.RED);
    DebugUtil.LOGG = (msg) => DebugUtil.LOG(msg, LogColor.C32);
    DebugUtil.LOGD = (msg) => DebugUtil.LOG(msg, LogColor.C36);
    DebugUtil.LOGO = (msg) => DebugUtil.LOG(msg, LogColor.C33);
    DebugUtil.LOGM = (msg) => DebugUtil.LOG(msg, LogColor.C92);
    DebugUtil.LOGH = (msg) => DebugUtil.LOG(msg, LogColor.C96);
    DebugUtil.LOGZ = (msg) => DebugUtil.LOG(msg, LogColor.C90);
    DebugUtil.PrintStackTrace = () => DebugUtil.LOG(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()), LogColor.C36);
    DebugUtil.PrintStackTraceN = (ctx, retText = false, slice = 24, reverse = false) => {
        let tmpText = "";
        if (reverse) {
            tmpText = Thread.backtrace(ctx, Backtracer.ACCURATE)
                .slice(0, slice)
                .reverse()
                .map(DebugSymbol.fromAddress).join("\n");
        }
        else {
            tmpText = Thread.backtrace(ctx, Backtracer.ACCURATE)
                .slice(0, slice)
                .map(DebugSymbol.fromAddress).join("\n");
        }
        return !retText ? DebugUtil.LOGD(tmpText) : tmpText;
    };
    DebugUtil.GetStackTrace = () => Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new());
    DebugUtil.GetStackTraceN = (ctx, level = 12) => {
        return Thread.backtrace(ctx, Backtracer.ACCURATE)
            .slice(0, level)
            .map(frame => DebugSymbol.fromAddress(frame))
            .join("\n");
    };
    function whenSoOpen(performer) {
        const VERSION = Java.use('android.os.Build$VERSION');
        let dlopenFuncName = "android_dlopen_ext";
        if (VERSION.SDK_INT.value <= 23) {
            dlopenFuncName = "dlopen";
        }
        console.log("selectOpen:", dlopenFuncName, "version:", VERSION.SDK_INT.value);
        let dlopen = Module.findExportByName(null, dlopenFuncName);
        let listener;
        const callback = {
            onEnter: function (args) {
                this.path = args[0].readCString();
            },
            onLeave: function () {
                performer(this.path);
            }
        };
        if (dlopen != null) {
            listener = Interceptor.attach(dlopen, callback);
        }
    }
    DebugUtil.whenSoOpen = whenSoOpen;
})(DebugUtil = exports.DebugUtil || (exports.DebugUtil = {}));
},{}],8:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("frida-il2cpp-bridge");
const Cocos2dxjs_1 = require("./game/Cocos2dxjs");
const FridaAnti_1 = require("./anti/FridaAnti");
const WebViewHook_1 = require("./android/https/WebViewHook");
function main() {
    FridaAnti_1.FridaAnti.start();
}
setImmediate(() => {
    main();
});
globalThis.start_hook_cocos2dxjs = Cocos2dxjs_1.Cocos2dxjs.start_hook_cocos2dxjs_for_javabridge;
globalThis.setWebContentsDebuggingEnabledInvoke = WebViewHook_1.WebViewHook.setWebContentsDebuggingEnabledInvoke;
}).call(this)}).call(this,require("timers").setImmediate)

},{"./android/https/WebViewHook":2,"./anti/FridaAnti":3,"./game/Cocos2dxjs":6,"frida-il2cpp-bridge":37,"timers":43}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
function cache(target, name, descriptor) {
    var getter = descriptor.get;
    if (!getter)
        throw new TypeError("Getter property descriptor expected");
    descriptor.get = function () {
        var value = getter.call(this);
        Object.defineProperty(this, name, {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            writable: false,
            value: value
        });
        return value;
    };
}
exports.cache = cache;

},{}],10:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.distance = exports.closest = void 0;
var peq = new Uint32Array(0x10000);
var myers_32 = function (a, b) {
    var n = a.length;
    var m = b.length;
    var lst = 1 << (n - 1);
    var pv = -1;
    var mv = 0;
    var sc = n;
    var i = n;
    while (i--) {
        peq[a.charCodeAt(i)] |= 1 << i;
    }
    for (i = 0; i < m; i++) {
        var eq = peq[b.charCodeAt(i)];
        var xv = eq | mv;
        eq |= ((eq & pv) + pv) ^ pv;
        mv |= ~(eq | pv);
        pv &= eq;
        if (mv & lst) {
            sc++;
        }
        if (pv & lst) {
            sc--;
        }
        mv = (mv << 1) | 1;
        pv = (pv << 1) | ~(xv | mv);
        mv &= xv;
    }
    i = n;
    while (i--) {
        peq[a.charCodeAt(i)] = 0;
    }
    return sc;
};
var myers_x = function (b, a) {
    var n = a.length;
    var m = b.length;
    var mhc = [];
    var phc = [];
    var hsize = Math.ceil(n / 32);
    var vsize = Math.ceil(m / 32);
    for (var i = 0; i < hsize; i++) {
        phc[i] = -1;
        mhc[i] = 0;
    }
    var j = 0;
    for (; j < vsize - 1; j++) {
        var mv_1 = 0;
        var pv_1 = -1;
        var start_1 = j * 32;
        var vlen_1 = Math.min(32, m) + start_1;
        for (var k = start_1; k < vlen_1; k++) {
            peq[b.charCodeAt(k)] |= 1 << k;
        }
        for (var i = 0; i < n; i++) {
            var eq = peq[a.charCodeAt(i)];
            var pb = (phc[(i / 32) | 0] >>> i) & 1;
            var mb = (mhc[(i / 32) | 0] >>> i) & 1;
            var xv = eq | mv_1;
            var xh = ((((eq | mb) & pv_1) + pv_1) ^ pv_1) | eq | mb;
            var ph = mv_1 | ~(xh | pv_1);
            var mh = pv_1 & xh;
            if ((ph >>> 31) ^ pb) {
                phc[(i / 32) | 0] ^= 1 << i;
            }
            if ((mh >>> 31) ^ mb) {
                mhc[(i / 32) | 0] ^= 1 << i;
            }
            ph = (ph << 1) | pb;
            mh = (mh << 1) | mb;
            pv_1 = mh | ~(xv | ph);
            mv_1 = ph & xv;
        }
        for (var k = start_1; k < vlen_1; k++) {
            peq[b.charCodeAt(k)] = 0;
        }
    }
    var mv = 0;
    var pv = -1;
    var start = j * 32;
    var vlen = Math.min(32, m - start) + start;
    for (var k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] |= 1 << k;
    }
    var score = m;
    for (var i = 0; i < n; i++) {
        var eq = peq[a.charCodeAt(i)];
        var pb = (phc[(i / 32) | 0] >>> i) & 1;
        var mb = (mhc[(i / 32) | 0] >>> i) & 1;
        var xv = eq | mv;
        var xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb;
        var ph = mv | ~(xh | pv);
        var mh = pv & xh;
        score += (ph >>> (m - 1)) & 1;
        score -= (mh >>> (m - 1)) & 1;
        if ((ph >>> 31) ^ pb) {
            phc[(i / 32) | 0] ^= 1 << i;
        }
        if ((mh >>> 31) ^ mb) {
            mhc[(i / 32) | 0] ^= 1 << i;
        }
        ph = (ph << 1) | pb;
        mh = (mh << 1) | mb;
        pv = mh | ~(xv | ph);
        mv = ph & xv;
    }
    for (var k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] = 0;
    }
    return score;
};
var distance = function (a, b) {
    if (a.length < b.length) {
        var tmp = b;
        b = a;
        a = tmp;
    }
    if (b.length === 0) {
        return a.length;
    }
    if (a.length <= 32) {
        return myers_32(a, b);
    }
    return myers_x(a, b);
};
exports.distance = distance;
var closest = function (str, arr) {
    var min_distance = Infinity;
    var min_index = 0;
    for (var i = 0; i < arr.length; i++) {
        var dist = distance(str, arr[i]);
        if (dist < min_distance) {
            min_distance = dist;
            min_index = i;
        }
    }
    return arr[min_index];
};
exports.closest = closest;

},{}],11:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const versioning_1 = __importDefault(require("versioning"));
const console_1 = require("../utils/console");
class Il2CppApi {
    constructor() { }
    static get _alloc() {
        return this.r("il2cpp_alloc", "pointer", ["size_t"]);
    }
    static get _arrayGetElements() {
        return this.r("il2cpp_array_get_elements", "pointer", ["pointer"]);
    }
    static get _arrayGetLength() {
        return this.r("il2cpp_array_length", "uint32", ["pointer"]);
    }
    static get _arrayNew() {
        return this.r("il2cpp_array_new", "pointer", ["pointer", "uint32"]);
    }
    static get _assemblyGetImage() {
        return this.r("il2cpp_assembly_get_image", "pointer", ["pointer"]);
    }
    static get _classForEach() {
        return this.r("il2cpp_class_for_each", "void", ["pointer", "pointer"]);
    }
    static get _classFromName() {
        return this.r("il2cpp_class_from_name", "pointer", ["pointer", "pointer", "pointer"]);
    }
    static get _classFromSystemType() {
        return this.r("il2cpp_class_from_system_type", "pointer", ["pointer"]);
    }
    static get _classFromType() {
        return this.r("il2cpp_class_from_type", "pointer", ["pointer"]);
    }
    static get _classGetActualInstanceSize() {
        return this.r("il2cpp_class_get_actual_instance_size", "int32", ["pointer"]);
    }
    static get _classGetArrayClass() {
        return this.r("il2cpp_array_class_get", "pointer", ["pointer", "uint32"]);
    }
    static get _classGetArrayElementSize() {
        return this.r("il2cpp_class_array_element_size", "int", ["pointer"]);
    }
    static get _classGetAssemblyName() {
        return this.r("il2cpp_class_get_assemblyname", "pointer", ["pointer"]);
    }
    static get _classGetBaseType() {
        return this.r("il2cpp_class_enum_basetype", "pointer", ["pointer"]);
    }
    static get _classGetDeclaringType() {
        return this.r("il2cpp_class_get_declaring_type", "pointer", ["pointer"]);
    }
    static get _classGetElementClass() {
        return this.r("il2cpp_class_get_element_class", "pointer", ["pointer"]);
    }
    static get _classGetFieldFromName() {
        return this.r("il2cpp_class_get_field_from_name", "pointer", ["pointer", "pointer"]);
    }
    static get _classGetFields() {
        return this.r("il2cpp_class_get_fields", "pointer", ["pointer", "pointer"]);
    }
    static get _classGetFlags() {
        return this.r("il2cpp_class_get_flags", "int", ["pointer"]);
    }
    static get _classGetImage() {
        return this.r("il2cpp_class_get_image", "pointer", ["pointer"]);
    }
    static get _classGetInstanceSize() {
        return this.r("il2cpp_class_instance_size", "int32", ["pointer"]);
    }
    static get _classGetInterfaces() {
        return this.r("il2cpp_class_get_interfaces", "pointer", ["pointer", "pointer"]);
    }
    static get _classGetMethodFromName() {
        return this.r("il2cpp_class_get_method_from_name", "pointer", ["pointer", "pointer", "int"]);
    }
    static get _classGetMethods() {
        return this.r("il2cpp_class_get_methods", "pointer", ["pointer", "pointer"]);
    }
    static get _classGetName() {
        return this.r("il2cpp_class_get_name", "pointer", ["pointer"]);
    }
    static get _classGetNamespace() {
        return this.r("il2cpp_class_get_namespace", "pointer", ["pointer"]);
    }
    static get _classGetNestedClasses() {
        return this.r("il2cpp_class_get_nested_types", "pointer", ["pointer", "pointer"]);
    }
    static get _classGetParent() {
        return this.r("il2cpp_class_get_parent", "pointer", ["pointer"]);
    }
    static get _classGetRank() {
        return this.r("il2cpp_class_get_rank", "int", ["pointer"]);
    }
    static get _classGetStaticFieldData() {
        return this.r("il2cpp_class_get_static_field_data", "pointer", ["pointer"]);
    }
    static get _classGetValueSize() {
        return this.r("il2cpp_class_value_size", "int32", ["pointer", "pointer"]);
    }
    static get _classGetType() {
        return this.r("il2cpp_class_get_type", "pointer", ["pointer"]);
    }
    static get _classHasReferences() {
        return this.r("il2cpp_class_has_references", "bool", ["pointer"]);
    }
    static get _classInit() {
        return this.r("il2cpp_runtime_class_init", "void", ["pointer"]);
    }
    static get _classIsAbstract() {
        return this.r("il2cpp_class_is_abstract", "bool", ["pointer"]);
    }
    static get _classIsAssignableFrom() {
        return this.r("il2cpp_class_is_assignable_from", "bool", ["pointer", "pointer"]);
    }
    static get _classIsBlittable() {
        return this.r("il2cpp_class_is_blittable", "bool", ["pointer"]);
    }
    static get _classIsEnum() {
        return this.r("il2cpp_class_is_enum", "bool", ["pointer"]);
    }
    static get _classIsGeneric() {
        return this.r("il2cpp_class_is_generic", "bool", ["pointer"]);
    }
    static get _classIsInflated() {
        return this.r("il2cpp_class_is_inflated", "bool", ["pointer"]);
    }
    static get _classIsInterface() {
        return this.r("il2cpp_class_is_interface", "bool", ["pointer"]);
    }
    static get _classIsSubclassOf() {
        return this.r("il2cpp_class_is_subclass_of", "bool", ["pointer", "pointer", "bool"]);
    }
    static get _classIsValueType() {
        return this.r("il2cpp_class_is_valuetype", "bool", ["pointer"]);
    }
    static get _domainAssemblyOpen() {
        return this.r("il2cpp_domain_assembly_open", "pointer", ["pointer", "pointer"]);
    }
    static get _domainGet() {
        return this.r("il2cpp_domain_get", "pointer", []);
    }
    static get _domainGetAssemblies() {
        return this.r("il2cpp_domain_get_assemblies", "pointer", ["pointer", "pointer"]);
    }
    static get _fieldGetModifier() {
        return this.r("il2cpp_field_get_modifier", "pointer", ["pointer"]);
    }
    static get _fieldGetClass() {
        return this.r("il2cpp_field_get_parent", "pointer", ["pointer"]);
    }
    static get _fieldGetFlags() {
        return this.r("il2cpp_field_get_flags", "int", ["pointer"]);
    }
    static get _fieldGetName() {
        return this.r("il2cpp_field_get_name", "pointer", ["pointer"]);
    }
    static get _fieldGetOffset() {
        return this.r("il2cpp_field_get_offset", "int32", ["pointer"]);
    }
    static get _fieldGetStaticValue() {
        return this.r("il2cpp_field_static_get_value", "void", ["pointer", "pointer"]);
    }
    static get _fieldGetType() {
        return this.r("il2cpp_field_get_type", "pointer", ["pointer"]);
    }
    static get _fieldIsLiteral() {
        return this.r("il2cpp_field_is_literal", "bool", ["pointer"]);
    }
    static get _fieldIsStatic() {
        return this.r("il2cpp_field_is_static", "bool", ["pointer"]);
    }
    static get _fieldIsThreadStatic() {
        return this.r("il2cpp_field_is_thread_static", "bool", ["pointer"]);
    }
    static get _fieldSetStaticValue() {
        return this.r("il2cpp_field_static_set_value", "void", ["pointer", "pointer"]);
    }
    static get _free() {
        return this.r("il2cpp_free", "void", ["pointer"]);
    }
    static get _gcCollect() {
        return this.r("il2cpp_gc_collect", "void", ["int"]);
    }
    static get _gcCollectALittle() {
        return this.r("il2cpp_gc_collect_a_little", "void", []);
    }
    static get _gcDisable() {
        return this.r("il2cpp_gc_disable", "void", []);
    }
    static get _gcEnable() {
        return this.r("il2cpp_gc_enable", "void", []);
    }
    static get _gcGetHeapSize() {
        return this.r("il2cpp_gc_get_heap_size", "int64", []);
    }
    static get _gcGetMaxTimeSlice() {
        return this.r("il2cpp_gc_get_max_time_slice_ns", "int64", []);
    }
    static get _gcGetUsedSize() {
        return this.r("il2cpp_gc_get_used_size", "int64", []);
    }
    static get _gcHandleGetTarget() {
        return this.r("il2cpp_gchandle_get_target", "pointer", ["uint32"]);
    }
    static get _gcHandleFree() {
        return this.r("il2cpp_gchandle_free", "void", ["uint32"]);
    }
    static get _gcHandleNew() {
        return this.r("il2cpp_gchandle_new", "uint32", ["pointer", "bool"]);
    }
    static get _gcHandleNewWeakRef() {
        return this.r("il2cpp_gchandle_new_weakref", "uint32", ["pointer", "bool"]);
    }
    static get _gcIsDisabled() {
        return this.r("il2cpp_gc_is_disabled", "bool", []);
    }
    static get _gcIsIncremental() {
        return this.r("il2cpp_gc_is_incremental", "bool", []);
    }
    static get _gcSetMaxTimeSlice() {
        return this.r("il2cpp_gc_set_max_time_slice_ns", "void", ["int64"]);
    }
    static get _gcStartIncrementalCollection() {
        return this.r("il2cpp_gc_start_incremental_collection", "void", []);
    }
    static get _gcStartWorld() {
        return this.r("il2cpp_start_gc_world", "void", []);
    }
    static get _gcStopWorld() {
        return this.r("il2cpp_stop_gc_world", "void", []);
    }
    static get _getCorlib() {
        return this.r("il2cpp_get_corlib", "pointer", []);
    }
    static get _imageGetAssembly() {
        return this.r("il2cpp_image_get_assembly", "pointer", ["pointer"]);
    }
    static get _imageGetClass() {
        return this.r("il2cpp_image_get_class", "pointer", ["pointer", "uint"]);
    }
    static get _imageGetClassCount() {
        return this.r("il2cpp_image_get_class_count", "uint32", ["pointer"]);
    }
    static get _imageGetName() {
        return this.r("il2cpp_image_get_name", "pointer", ["pointer"]);
    }
    static get _init() {
        return this.r("il2cpp_init", "void", []);
    }
    static get _livenessAllocateStruct() {
        return this.r("il2cpp_unity_liveness_allocate_struct", "pointer", ["pointer", "int", "pointer", "pointer", "pointer"]);
    }
    static get _livenessCalculationBegin() {
        return this.r("il2cpp_unity_liveness_calculation_begin", "pointer", ["pointer", "int", "pointer", "pointer", "pointer", "pointer"]);
    }
    static get _livenessCalculationEnd() {
        return this.r("il2cpp_unity_liveness_calculation_end", "void", ["pointer"]);
    }
    static get _livenessCalculationFromStatics() {
        return this.r("il2cpp_unity_liveness_calculation_from_statics", "void", ["pointer"]);
    }
    static get _livenessFinalize() {
        return this.r("il2cpp_unity_liveness_finalize", "void", ["pointer"]);
    }
    static get _livenessFreeStruct() {
        return this.r("il2cpp_unity_liveness_free_struct", "void", ["pointer"]);
    }
    static get _memorySnapshotCapture() {
        return this.r("il2cpp_capture_memory_snapshot", "pointer", []);
    }
    static get _memorySnapshotFree() {
        return this.r("il2cpp_free_captured_memory_snapshot", "void", ["pointer"]);
    }
    static get _memorySnapshotGetClasses() {
        return this.r("il2cpp_memory_snapshot_get_classes", "pointer", ["pointer", "pointer"]);
    }
    static get _memorySnapshotGetGCHandles() {
        return this.r("il2cpp_memory_snapshot_get_gc_handles", ["uint32", "pointer"], ["pointer"]);
    }
    static get _memorySnapshotGetRuntimeInformation() {
        return this.r("il2cpp_memory_snapshot_get_information", ["uint32", "uint32", "uint32", "uint32", "uint32", "uint32"], ["pointer"]);
    }
    static get _methodGetModifier() {
        return this.r("il2cpp_method_get_modifier", "pointer", ["pointer"]);
    }
    static get _methodGetClass() {
        return this.r("il2cpp_method_get_class", "pointer", ["pointer"]);
    }
    static get _methodGetFlags() {
        return this.r("il2cpp_method_get_flags", "uint32", ["pointer", "pointer"]);
    }
    static get _methodGetFromReflection() {
        return this.r("il2cpp_method_get_from_reflection", "pointer", ["pointer"]);
    }
    static get _methodGetName() {
        return this.r("il2cpp_method_get_name", "pointer", ["pointer"]);
    }
    static get _methodGetObject() {
        return this.r("il2cpp_method_get_object", "pointer", ["pointer", "pointer"]);
    }
    static get _methodGetParameterCount() {
        return this.r("il2cpp_method_get_param_count", "uint8", ["pointer"]);
    }
    static get _methodGetParameterName() {
        return this.r("il2cpp_method_get_param_name", "pointer", ["pointer", "uint32"]);
    }
    static get _methodGetParameters() {
        return this.r("il2cpp_method_get_parameters", "pointer", ["pointer", "pointer"]);
    }
    static get _methodGetParameterType() {
        return this.r("il2cpp_method_get_param", "pointer", ["pointer", "uint32"]);
    }
    static get _methodGetPointer() {
        return this.r("il2cpp_method_get_pointer", "pointer", ["pointer"]);
    }
    static get _methodGetReturnType() {
        return this.r("il2cpp_method_get_return_type", "pointer", ["pointer"]);
    }
    static get _methodIsExternal() {
        return this.r("il2cpp_method_is_external", "bool", ["pointer"]);
    }
    static get _methodIsGeneric() {
        return this.r("il2cpp_method_is_generic", "bool", ["pointer"]);
    }
    static get _methodIsInflated() {
        return this.r("il2cpp_method_is_inflated", "bool", ["pointer"]);
    }
    static get _methodIsInstance() {
        return this.r("il2cpp_method_is_instance", "bool", ["pointer"]);
    }
    static get _methodIsSynchronized() {
        return this.r("il2cpp_method_is_synchronized", "bool", ["pointer"]);
    }
    static get _monitorEnter() {
        return this.r("il2cpp_monitor_enter", "void", ["pointer"]);
    }
    static get _monitorExit() {
        return this.r("il2cpp_monitor_exit", "void", ["pointer"]);
    }
    static get _monitorPulse() {
        return this.r("il2cpp_monitor_pulse", "void", ["pointer"]);
    }
    static get _monitorPulseAll() {
        return this.r("il2cpp_monitor_pulse_all", "void", ["pointer"]);
    }
    static get _monitorTryEnter() {
        return this.r("il2cpp_monitor_try_enter", "bool", ["pointer", "uint32"]);
    }
    static get _monitorTryWait() {
        return this.r("il2cpp_monitor_try_wait", "bool", ["pointer", "uint32"]);
    }
    static get _monitorWait() {
        return this.r("il2cpp_monitor_wait", "void", ["pointer"]);
    }
    static get _objectGetClass() {
        return this.r("il2cpp_object_get_class", "pointer", ["pointer"]);
    }
    static get _objectGetVirtualMethod() {
        return this.r("il2cpp_object_get_virtual_method", "pointer", ["pointer", "pointer"]);
    }
    static get _objectInit() {
        return this.r("il2cpp_runtime_object_init_exception", "void", ["pointer", "pointer"]);
    }
    static get _objectNew() {
        return this.r("il2cpp_object_new", "pointer", ["pointer"]);
    }
    static get _objectGetSize() {
        return this.r("il2cpp_object_get_size", "uint32", ["pointer"]);
    }
    static get _objectUnbox() {
        return this.r("il2cpp_object_unbox", "pointer", ["pointer"]);
    }
    static get _resolveInternalCall() {
        return this.r("il2cpp_resolve_icall", "pointer", ["pointer"]);
    }
    static get _stringChars() {
        return this.r("il2cpp_string_chars", "pointer", ["pointer"]);
    }
    static get _stringLength() {
        return this.r("il2cpp_string_length", "int32", ["pointer"]);
    }
    static get _stringNew() {
        return this.r("il2cpp_string_new", "pointer", ["pointer"]);
    }
    static get _stringSetLength() {
        return this.r("il2cpp_string_set_length", "void", ["pointer", "int32"]);
    }
    static get _valueBox() {
        return this.r("il2cpp_value_box", "pointer", ["pointer", "pointer"]);
    }
    static get _threadAttach() {
        return this.r("il2cpp_thread_attach", "pointer", ["pointer"]);
    }
    static get _threadCurrent() {
        return this.r("il2cpp_thread_current", "pointer", []);
    }
    static get _threadGetAllAttachedThreads() {
        return this.r("il2cpp_thread_get_all_attached_threads", "pointer", ["pointer"]);
    }
    static get _threadIsVm() {
        return this.r("il2cpp_is_vm_thread", "bool", ["pointer"]);
    }
    static get _threadDetach() {
        return this.r("il2cpp_thread_detach", "void", ["pointer"]);
    }
    static get _typeGetName() {
        return this.r("il2cpp_type_get_name", "pointer", ["pointer"]);
    }
    static get _typeGetObject() {
        return this.r("il2cpp_type_get_object", "pointer", ["pointer"]);
    }
    static get _typeGetTypeEnum() {
        return this.r("il2cpp_type_get_type", "int", ["pointer"]);
    }
    static get _typeIsByReference() {
        return this.r("il2cpp_type_is_byref", "bool", ["pointer"]);
    }
    static get _typeIsPrimitive() {
        return this.r("il2cpp_type_is_primitive", "bool", ["pointer"]);
    }
    /** @internal */
    static get cModule() {
        if (versioning_1.default.lt(Il2Cpp.unityVersion, "5.3.0") || versioning_1.default.gte(Il2Cpp.unityVersion, "2022.2.0")) {
            (0, console_1.warn)(`current Unity version ${Il2Cpp.unityVersion} is not supported, expect breakage`);
        }
        const offsetsFinderCModule = new CModule(`\
#include <stdint.h>

#define OFFSET_OF(name, type) \
    int16_t name (char * p,\
                  type e)\
    {\
        for (int16_t i = 0; i < 512; i++) if (* ((type *) p + i) == e) return i;\
        return -1;\
    }

OFFSET_OF (offset_of_int32, int32_t)
OFFSET_OF (offset_of_pointer, void *)
            `);
        const offsetOfInt32 = new NativeFunction(offsetsFinderCModule.offset_of_int32, "int16", ["pointer", "int32"]);
        const offsetOfPointer = new NativeFunction(offsetsFinderCModule.offset_of_pointer, "int16", ["pointer", "pointer"]);
        const SystemString = Il2Cpp.Image.corlib.class("System.String");
        const SystemDateTime = Il2Cpp.Image.corlib.class("System.DateTime");
        const SystemReflectionModule = Il2Cpp.Image.corlib.class("System.Reflection.Module");
        SystemDateTime.initialize();
        SystemReflectionModule.initialize();
        const DaysToMonth365 = (SystemDateTime.tryField("daysmonth") ??
            SystemDateTime.tryField("DaysToMonth365") ??
            SystemDateTime.field("s_daysToMonth365")).value;
        const FilterTypeName = SystemReflectionModule.field("FilterTypeName").value;
        const FilterTypeNameMethodPointer = FilterTypeName.field("method_ptr").value;
        const FilterTypeNameMethod = FilterTypeName.field("method").value;
        const source = `\
#include <stdint.h>
#include <string.h>


typedef struct _Il2CppObject Il2CppObject;
typedef enum _Il2CppTypeEnum Il2CppTypeEnum;
typedef struct _Il2CppReflectionMethod Il2CppReflectionMethod;
typedef struct _Il2CppManagedMemorySnapshot Il2CppManagedMemorySnapshot;
typedef struct _Il2CppMetadataType Il2CppMetadataType;


struct _Il2CppObject
{
    void * class;
    void * monitor;
};

enum _Il2CppTypeEnum
{
    IL2CPP_TYPE_END = 0x00,
    IL2CPP_TYPE_VOID = 0x01,
    IL2CPP_TYPE_BOOLEAN = 0x02,
    IL2CPP_TYPE_CHAR = 0x03,
    IL2CPP_TYPE_I1 = 0x04,
    IL2CPP_TYPE_U1 = 0x05,
    IL2CPP_TYPE_I2 = 0x06,
    IL2CPP_TYPE_U2 = 0x07,
    IL2CPP_TYPE_I4 = 0x08,
    IL2CPP_TYPE_U4 = 0x09,
    IL2CPP_TYPE_I8 = 0x0a,
    IL2CPP_TYPE_U8 = 0x0b,
    IL2CPP_TYPE_R4 = 0x0c,
    IL2CPP_TYPE_R8 = 0x0d,
    IL2CPP_TYPE_STRING = 0x0e,
    IL2CPP_TYPE_PTR = 0x0f,
    IL2CPP_TYPE_BYREF = 0x10,
    IL2CPP_TYPE_VALUETYPE = 0x11,
    IL2CPP_TYPE_CLASS = 0x12,
    IL2CPP_TYPE_VAR = 0x13,
    IL2CPP_TYPE_ARRAY = 0x14,
    IL2CPP_TYPE_GENERICINST = 0x15,
    IL2CPP_TYPE_TYPEDBYREF = 0x16,
    IL2CPP_TYPE_I = 0x18,
    IL2CPP_TYPE_U = 0x19,
    IL2CPP_TYPE_FNPTR = 0x1b,
    IL2CPP_TYPE_OBJECT = 0x1c,
    IL2CPP_TYPE_SZARRAY = 0x1d,
    IL2CPP_TYPE_MVAR = 0x1e,
    IL2CPP_TYPE_CMOD_REQD = 0x1f,
    IL2CPP_TYPE_CMOD_OPT = 0x20,
    IL2CPP_TYPE_INTERNAL = 0x21,
    IL2CPP_TYPE_MODIFIER = 0x40,
    IL2CPP_TYPE_SENTINEL = 0x41,
    IL2CPP_TYPE_PINNED = 0x45,
    IL2CPP_TYPE_ENUM = 0x55
};

struct _Il2CppReflectionMethod
{
    Il2CppObject object;
    void * method;
    void * name;
    void * reftype;
};

struct _Il2CppManagedMemorySnapshot
{
    struct Il2CppManagedHeap
    {
        uint32_t section_count;
        void * sections;
    } heap;
    struct Il2CppStacks
    {
        uint32_t stack_count;
        void * stacks;
    } stacks;
    struct Il2CppMetadataSnapshot
    {
        uint32_t type_count;
        Il2CppMetadataType * types;
    } metadata_snapshot;
    struct Il2CppGCHandles
    {
        uint32_t tracked_object_count;
        Il2CppObject ** pointers_to_objects;
    } gc_handles;
    struct Il2CppRuntimeInformation
    {
        uint32_t pointer_size;
        uint32_t object_header_size;
        uint32_t array_header_size;
        uint32_t array_bounds_offset_in_header;
        uint32_t array_size_offset_in_header;
        uint32_t allocation_granularity;
    } runtime_information;
    void * additional_user_information;
};

struct _Il2CppMetadataType
{
    uint32_t flags;
    void * fields;
    uint32_t field_count;
    uint32_t statics_size;
    uint8_t * statics;
    uint32_t base_or_element_type_index;
    char * name;
    const char * assembly_name;
    uint64_t type_info_address;
    uint32_t size;
};


#define THREAD_STATIC_FIELD_OFFSET -1;

#define FIELD_ATTRIBUTE_FIELD_ACCESS_MASK 0x0007
#define FIELD_ATTRIBUTE_COMPILER_CONTROLLED 0x0000
#define FIELD_ATTRIBUTE_PRIVATE 0x0001
#define FIELD_ATTRIBUTE_FAM_AND_ASSEM 0x0002
#define FIELD_ATTRIBUTE_ASSEMBLY 0x0003
#define FIELD_ATTRIBUTE_FAMILY 0x0004
#define FIELD_ATTRIBUTE_FAM_OR_ASSEM 0x0005
#define FIELD_ATTRIBUTE_PUBLIC 0x0006

#define FIELD_ATTRIBUTE_STATIC 0x0010
#define FIELD_ATTRIBUTE_LITERAL 0x0040

#define METHOD_ATTRIBUTE_MEMBER_ACCESS_MASK 0x0007
#define METHOD_ATTRIBUTE_COMPILER_CONTROLLED 0x0000
#define METHOD_ATTRIBUTE_PRIVATE 0x0001
#define METHOD_ATTRIBUTE_FAM_AND_ASSEM 0x0002
#define METHOD_ATTRIBUTE_ASSEMBLY 0x0003
#define METHOD_ATTRIBUTE_FAMILY 0x0004
#define METHOD_ATTRIBUTE_FAM_OR_ASSEM 0x0005
#define METHOD_ATTRIBUTE_PUBLIC 0x0006

#define METHOD_ATTRIBUTE_STATIC 0x0010
#define METHOD_IMPL_ATTRIBUTE_INTERNAL_CALL 0x1000
#define METHOD_IMPL_ATTRIBUTE_SYNCHRONIZED 0x0020


static const char * (*il2cpp_class_get_name) (void *) = (void *) ${this._classGetName};
static int (*il2cpp_field_get_flags) (void *) = (void *) ${this._fieldGetFlags};
static size_t (*il2cpp_field_get_offset) (void *) = (void *) ${this._fieldGetOffset};
static uint32_t (*il2cpp_method_get_flags) (void *, uint32_t *) = (void *) ${this._methodGetFlags};
static char * (*il2cpp_type_get_name) (void *) = (void *) ${this._typeGetName};
static Il2CppTypeEnum (*il2cpp_type_get_type_enum) (void *) = (void *) ${this._typeGetTypeEnum};
static void (*il2cpp_free) (void * pointer) = (void *) ${this._free};


void
il2cpp_string_set_length (int32_t * string,
                          int32_t length)
{
    *(string + ${offsetOfInt32(Il2Cpp.String.from("vfsfitvnm"), 9)}) = length;
}

void *
il2cpp_array_get_elements (int32_t * array)
{ 
    return array + ${offsetOfInt32(DaysToMonth365, 31) - 1};
}

uint8_t
il2cpp_type_is_byref (void * type)
{   
    char * name;
    char last_char;

    name = il2cpp_type_get_name (type);
    last_char = name[strlen (name) - 1];

    il2cpp_free (name);
    return last_char == '&';
}

uint8_t
il2cpp_type_is_primitive (void * type)
{
    Il2CppTypeEnum type_enum;

    type_enum = il2cpp_type_get_type_enum (type);

    return ((type_enum >= IL2CPP_TYPE_BOOLEAN && 
        type_enum <= IL2CPP_TYPE_R8) || 
        type_enum == IL2CPP_TYPE_I || 
        type_enum == IL2CPP_TYPE_U
    );
}

int32_t
il2cpp_class_get_actual_instance_size (int32_t * class)
{
    return *(class + ${offsetOfInt32(SystemString, SystemString.instanceSize - 2)});
}

uint8_t
il2cpp_class_get_rank (void * class)
{
    uint8_t rank;
    const char * name;
    
    rank = 0;
    name = il2cpp_class_get_name (class);

    for (uint16_t i = strlen (name) - 1; i > 0; i--)
    {
        char c = name[i];

        if (c == ']') rank++;
        else if (c == '[' || rank == 0) break;
        else if (c == ',') rank++;
        else break;
    }

    return rank;
}

const char *
il2cpp_field_get_modifier (void * field)
{   
    int flags;

    flags = il2cpp_field_get_flags (field);

    switch (flags & FIELD_ATTRIBUTE_FIELD_ACCESS_MASK) {
        case FIELD_ATTRIBUTE_PRIVATE:
            return "private";
        case FIELD_ATTRIBUTE_FAM_AND_ASSEM:
            return "private protected";
        case FIELD_ATTRIBUTE_ASSEMBLY:
            return "internal";
        case FIELD_ATTRIBUTE_FAMILY:
            return "protected";
        case FIELD_ATTRIBUTE_FAM_OR_ASSEM:
            return "protected internal";
        case FIELD_ATTRIBUTE_PUBLIC:
            return "public";
    }

    return "";
}

uint8_t
il2cpp_field_is_literal (void * field)
{
    return (il2cpp_field_get_flags (field) & FIELD_ATTRIBUTE_LITERAL) != 0;
}

uint8_t
il2cpp_field_is_static (void * field)
{
    return (il2cpp_field_get_flags (field) & FIELD_ATTRIBUTE_STATIC) != 0;
}

uint8_t
il2cpp_field_is_thread_static (void * field)
{
    return il2cpp_field_get_offset (field) == THREAD_STATIC_FIELD_OFFSET;
}

const char *
il2cpp_method_get_modifier (void * method)
{
    uint32_t flags;

    flags = il2cpp_method_get_flags (method, NULL);

    switch (flags & METHOD_ATTRIBUTE_MEMBER_ACCESS_MASK) {
        case METHOD_ATTRIBUTE_PRIVATE:
            return "private";
        case METHOD_ATTRIBUTE_FAM_AND_ASSEM:
            return "private protected";
        case METHOD_ATTRIBUTE_ASSEMBLY:
            return "internal";
        case METHOD_ATTRIBUTE_FAMILY:
            return "protected";
        case METHOD_ATTRIBUTE_FAM_OR_ASSEM:
            return "protected internal";
        case METHOD_ATTRIBUTE_PUBLIC:
            return "public";
    }

    return "";
}

void *
il2cpp_method_get_from_reflection (const Il2CppReflectionMethod * method)
{
    return method->method;
}

void *
il2cpp_method_get_pointer (void ** method)
{
    return * (method + ${offsetOfPointer(FilterTypeNameMethod, FilterTypeNameMethodPointer)});
}

uint8_t
il2cpp_method_is_external (void * method)
{
    uint32_t implementation_flags;

    il2cpp_method_get_flags (method, &implementation_flags);

    return (implementation_flags & METHOD_IMPL_ATTRIBUTE_INTERNAL_CALL) != 0;
}

uint8_t
il2cpp_method_is_synchronized (void * method)
{
    uint32_t implementation_flags;

    il2cpp_method_get_flags (method, &implementation_flags);

    return (implementation_flags & METHOD_IMPL_ATTRIBUTE_SYNCHRONIZED) != 0;
}

uintptr_t
il2cpp_memory_snapshot_get_classes (const Il2CppManagedMemorySnapshot * snapshot,
                                    Il2CppMetadataType ** iter)
{
    const int zero;
    const void * null;

    if (iter != NULL && snapshot->metadata_snapshot.type_count > zero)
    {
        if (*iter == null)
        {
            *iter = snapshot->metadata_snapshot.types;
            return (uintptr_t) (*iter)->type_info_address;
        }
        else
        {
            Il2CppMetadataType * metadata_type = *iter + 1;

            if (metadata_type < snapshot->metadata_snapshot.types + snapshot->metadata_snapshot.type_count)
            {
                *iter = metadata_type;
                return (uintptr_t) (*iter)->type_info_address;
            }
        }
    }
    return 0;
}

struct Il2CppGCHandles
il2cpp_memory_snapshot_get_gc_handles (const Il2CppManagedMemorySnapshot * snapshot)
{
    return snapshot->gc_handles;
}

struct Il2CppRuntimeInformation
il2cpp_memory_snapshot_get_information (const Il2CppManagedMemorySnapshot * snapshot)
{
    return snapshot->runtime_information;
}
        `;
        offsetsFinderCModule.dispose();
        return new CModule(source);
    }
    /** @internal */
    static r(exportName, retType, argTypes) {
        const exportPointer = Il2Cpp.module.findExportByName(exportName) ?? this.cModule[exportName];
        if (exportPointer == null) {
            (0, console_1.raise)(`cannot resolve export ${exportName}`);
        }
        return new NativeFunction(exportPointer, retType, argTypes);
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_alloc", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_arrayGetElements", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_arrayGetLength", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_arrayNew", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_assemblyGetImage", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classForEach", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classFromName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classFromSystemType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classFromType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetActualInstanceSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetArrayClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetArrayElementSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetAssemblyName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetBaseType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetDeclaringType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetElementClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetFieldFromName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetFields", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetFlags", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetImage", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetInstanceSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetInterfaces", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetMethodFromName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetMethods", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetNamespace", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetNestedClasses", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetParent", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetRank", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetStaticFieldData", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetValueSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classGetType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classHasReferences", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classInit", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsAbstract", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsAssignableFrom", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsBlittable", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsEnum", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsGeneric", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsInflated", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsInterface", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsSubclassOf", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_classIsValueType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_domainAssemblyOpen", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_domainGet", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_domainGetAssemblies", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldGetModifier", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldGetClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldGetFlags", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldGetName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldGetOffset", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldGetStaticValue", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldGetType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldIsLiteral", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldIsStatic", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldIsThreadStatic", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_fieldSetStaticValue", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_free", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcCollect", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcCollectALittle", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcDisable", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcEnable", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcGetHeapSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcGetMaxTimeSlice", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcGetUsedSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcHandleGetTarget", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcHandleFree", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcHandleNew", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcHandleNewWeakRef", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcIsDisabled", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcIsIncremental", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcSetMaxTimeSlice", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcStartIncrementalCollection", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcStartWorld", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_gcStopWorld", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_getCorlib", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_imageGetAssembly", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_imageGetClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_imageGetClassCount", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_imageGetName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_init", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_livenessAllocateStruct", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_livenessCalculationBegin", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_livenessCalculationEnd", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_livenessCalculationFromStatics", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_livenessFinalize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_livenessFreeStruct", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_memorySnapshotCapture", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_memorySnapshotFree", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_memorySnapshotGetClasses", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_memorySnapshotGetGCHandles", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_memorySnapshotGetRuntimeInformation", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetModifier", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetFlags", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetFromReflection", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetObject", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetParameterCount", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetParameterName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetParameters", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetParameterType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetPointer", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodGetReturnType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodIsExternal", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodIsGeneric", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodIsInflated", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodIsInstance", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_methodIsSynchronized", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_monitorEnter", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_monitorExit", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_monitorPulse", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_monitorPulseAll", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_monitorTryEnter", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_monitorTryWait", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_monitorWait", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_objectGetClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_objectGetVirtualMethod", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_objectInit", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_objectNew", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_objectGetSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_objectUnbox", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_resolveInternalCall", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_stringChars", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_stringLength", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_stringNew", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_stringSetLength", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_valueBox", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_threadAttach", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_threadCurrent", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_threadGetAllAttachedThreads", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_threadIsVm", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_threadDetach", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_typeGetName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_typeGetObject", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_typeGetTypeEnum", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_typeIsByReference", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "_typeIsPrimitive", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppApi, "cModule", null);
Il2Cpp.Api = Il2CppApi;

},{"../utils/console":38,"decorator-cache-getter":9,"versioning":44}],12:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const versioning_1 = __importDefault(require("versioning"));
const console_1 = require("../utils/console");
const native_wait_1 = require("../utils/native-wait");
/** */
class Il2CppBase {
    constructor() { }
    /** @internal Gets the Il2Cpp module name. */
    static get moduleName() {
        switch (Process.platform) {
            case "linux":
                try {
                    const _ = Java.androidVersion;
                    return "libil2cpp.so";
                }
                catch (e) {
                    return "GameAssembly.so";
                }
            case "windows":
                return "GameAssembly.dll";
            case "darwin":
                try {
                    return "UnityFramework";
                }
                catch (e) {
                    return "GameAssembly.dylib";
                }
        }
        (0, console_1.raise)(`${Process.platform} is not supported yet`);
    }
    /** */
    static get applicationDataPath() {
        const get_persistentDataPath = this.internalCall("UnityEngine.Application::get_persistentDataPath", "pointer", []);
        return new Il2Cpp.String(get_persistentDataPath()).content;
    }
    /** */
    static get applicationIdentifier() {
        const get_identifier = this.internalCall("UnityEngine.Application::get_identifier", "pointer", []) ??
            this.internalCall("UnityEngine.Application::get_bundleIdentifier", "pointer", []);
        return get_identifier ? new Il2Cpp.String(get_identifier()).content : null;
    }
    /** Gets the version of the application */
    static get applicationVersion() {
        const get_version = this.internalCall("UnityEngine.Application::get_version", "pointer", []);
        return get_version ? new Il2Cpp.String(get_version()).content : null;
    }
    /** Gets the attached threads. */
    static get attachedThreads() {
        if (Il2Cpp.currentThread == null) {
            (0, console_1.raise)("only Il2Cpp threads can invoke Il2Cpp.attachedThreads");
        }
        const array = [];
        const sizePointer = Memory.alloc(Process.pointerSize);
        const startPointer = Il2Cpp.Api._threadGetAllAttachedThreads(sizePointer);
        const size = sizePointer.readInt();
        for (let i = 0; i < size; i++) {
            array.push(new Il2Cpp.Thread(startPointer.add(i * Process.pointerSize).readPointer()));
        }
        return array;
    }
    /** Gets the current attached thread, if any. */
    static get currentThread() {
        const handle = Il2Cpp.Api._threadCurrent();
        return handle.isNull() ? null : new Il2Cpp.Thread(handle);
    }
    /** Gets the Il2Cpp module as a Frida module. */
    static get module() {
        return Process.getModuleByName(this.moduleName);
    }
    /** Gets the Unity version of the current application. */
    static get unityVersion() {
        const get_unityVersion = this.internalCall("UnityEngine.Application::get_unityVersion", "pointer", []);
        if (get_unityVersion == null) {
            (0, console_1.raise)("couldn't determine the Unity version, please specify it manually");
        }
        return new Il2Cpp.String(get_unityVersion()).content;
    }
    /** @internal */
    static get unityVersionIsBelow201830() {
        return versioning_1.default.lt(this.unityVersion, "2018.3.0");
    }
    /** Allocates the given amount of bytes. */
    static alloc(size = Process.pointerSize) {
        return Il2Cpp.Api._alloc(size);
    }
    /** Dumps the application. */
    static dump(fileName, path) {
        fileName = fileName ?? `${Il2Cpp.applicationIdentifier ?? "unknown"}_${Il2Cpp.applicationVersion ?? "unknown"}.cs`;
        const destination = `${path ?? Il2Cpp.applicationDataPath}/${fileName}`;
        const file = new File(destination, "w");
        for (const assembly of Il2Cpp.Domain.assemblies) {
            (0, console_1.inform)(`dumping ${assembly.name}...`);
            for (const klass of assembly.image.classes) {
                file.write(`${klass}\n\n`);
            }
        }
        file.flush();
        file.close();
        (0, console_1.ok)(`dump saved to ${destination}`);
    }
    /** Frees memory. */
    static free(pointer) {
        return Il2Cpp.Api._free(pointer);
    }
    /** @internal Waits for Unity and Il2Cpp native libraries to be loaded and initialized. */
    static async initialize() {
        if (Process.platform == "darwin") {
            let il2cppModuleName = Process.findModuleByAddress(Module.findExportByName(null, "il2cpp_init") ?? NULL)?.name;
            if (il2cppModuleName == undefined) {
                il2cppModuleName = await (0, native_wait_1.forModule)("UnityFramework", "GameAssembly.dylib");
            }
            Reflect.defineProperty(Il2Cpp, "moduleName", { value: il2cppModuleName });
        }
        else {
            await (0, native_wait_1.forModule)(this.moduleName);
        }
        if (Il2Cpp.Api._getCorlib().isNull()) {
            await new Promise(resolve => {
                const interceptor = Interceptor.attach(Il2Cpp.Api._init, {
                    onLeave() {
                        interceptor.detach();
                        setImmediate(resolve);
                    }
                });
            });
        }
    }
    /** */
    static installExceptionListener(targetThread = "current") {
        const threadId = Process.getCurrentThreadId();
        return Interceptor.attach(Il2Cpp.module.getExportByName("__cxa_throw"), function (args) {
            if (targetThread == "current" && this.threadId != threadId) {
                return;
            }
            (0, console_1.inform)(new Il2Cpp.Object(args[0].readPointer()));
        });
    }
    /** */
    static internalCall(name, retType, argTypes) {
        const handle = Il2Cpp.Api._resolveInternalCall(Memory.allocUtf8String(name));
        return handle.isNull() ? null : new NativeFunction(handle, retType, argTypes);
    }
    /** Schedules a callback on the Il2Cpp initializer thread. */
    static scheduleOnInitializerThread(block) {
        return new Promise(resolve => {
            const listener = Interceptor.attach(Il2Cpp.Api._threadCurrent, () => {
                const currentThreadId = Il2Cpp.currentThread?.id;
                if (currentThreadId != undefined && currentThreadId == Il2Cpp.attachedThreads[0].id) {
                    listener.detach();
                    const result = block();
                    setImmediate(() => resolve(result));
                }
            });
        });
    }
    /** Attaches the caller thread to Il2Cpp domain and executes the given block.  */
    static async perform(block) {
        await this.initialize();
        let thread = this.currentThread;
        const isForeignThread = thread == null;
        if (thread == null) {
            thread = Il2Cpp.Domain.attach();
        }
        try {
            const result = block();
            return result instanceof Promise ? await result : result;
        }
        catch (e) {
            globalThis.console.log(e);
            throw e;
        }
        finally {
            if (isForeignThread) {
                thread.detach();
            }
        }
    }
    /** Creates a new `Il2Cpp.Tracer` instance. */
    static trace() {
        return new Il2Cpp.Tracer();
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppBase, "applicationDataPath", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppBase, "applicationIdentifier", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppBase, "applicationVersion", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppBase, "module", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppBase, "unityVersion", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppBase, "unityVersionIsBelow201830", null);
Reflect.set(globalThis, "Il2Cpp", Il2CppBase);

}).call(this)}).call(this,require("timers").setImmediate)

},{"../utils/console":38,"../utils/native-wait":40,"decorator-cache-getter":9,"timers":43,"versioning":44}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Filtering utilities. */
class Il2CppFiltering {
    constructor() { }
    /** Creates a filter which includes `element`s whose type can be assigned to `klass` variables. */
    static Is(klass) {
        return (element) => {
            if (element instanceof Il2Cpp.Class) {
                return klass.isAssignableFrom(element);
            }
            else {
                return klass.isAssignableFrom(element.class);
            }
        };
    }
    /** Creates a filter which includes `element`s whose type corresponds to `klass` type. */
    static IsExactly(klass) {
        return (element) => {
            if (element instanceof Il2Cpp.Class) {
                return element.equals(klass);
            }
            else {
                return element.class.equals(klass);
            }
        };
    }
}
Il2Cpp.Filtering = Il2CppFiltering;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./base");
require("./api");
require("./filtering");
require("./runtime");
require("./tracer");
require("./structs/array");
require("./structs/assembly");
require("./structs/class");
require("./structs/domain");
require("./structs/field");
require("./structs/gc");
require("./structs/gc-handle");
require("./structs/image");
require("./structs/memory-snapshot");
require("./structs/method");
require("./structs/object");
require("./structs/parameter");
require("./structs/pointer");
require("./structs/reference");
require("./structs/string");
require("./structs/thread");
require("./structs/type");
require("./structs/type-enum");
require("./structs/value-type");

},{"./api":11,"./base":12,"./filtering":13,"./runtime":15,"./structs/array":16,"./structs/assembly":17,"./structs/class":18,"./structs/domain":19,"./structs/field":20,"./structs/gc":22,"./structs/gc-handle":21,"./structs/image":23,"./structs/memory-snapshot":24,"./structs/method":25,"./structs/object":26,"./structs/parameter":27,"./structs/pointer":28,"./structs/reference":29,"./structs/string":30,"./structs/thread":31,"./structs/type":33,"./structs/type-enum":32,"./structs/value-type":34,"./tracer":35}],15:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
/** */
class Il2CppRuntime {
    constructor() { }
    /** Gets the allocation granularity. */
    static get allocationGranularity() {
        return this.information[5];
    }
    /** Gets the size of the Il2CppArray struct. */
    static get arrayHeaderSize() {
        return this.information[2];
    }
    /** @internal */
    static get information() {
        const snapshot = Il2Cpp.MemorySnapshot.capture();
        try {
            return Il2Cpp.Api._memorySnapshotGetRuntimeInformation(snapshot);
        }
        finally {
            Il2Cpp.Api._memorySnapshotFree(snapshot);
        }
    }
    /** Gets the pointer size. */
    static get pointerSize() {
        return this.information[0];
    }
    /** Gets the size of the Il2CppObject struct. */
    static get objectHeaderSize() {
        return this.information[1];
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppRuntime, "information", null);
Il2Cpp.Runtime = Il2CppRuntime;

},{"decorator-cache-getter":9}],16:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const console_1 = require("../../utils/console");
const native_struct_1 = require("../../utils/native-struct");
/** Represents a `Il2CppArraySize`. */
class Il2CppArray extends native_struct_1.NativeStruct {
    /** @internal */
    static from(klass, lengthOrElements) {
        const length = typeof lengthOrElements == "number" ? lengthOrElements : lengthOrElements.length;
        const array = new Il2Cpp.Array(Il2Cpp.Api._arrayNew(klass, length));
        if (Array.isArray(lengthOrElements)) {
            array.elements.write(lengthOrElements);
        }
        return array;
    }
    /** @internal Gets a pointer to the first element of the current array. */
    get elements() {
        return new Il2Cpp.Pointer(Il2Cpp.Api._arrayGetElements(this), this.elementType);
    }
    /** Gets the size of the object encompassed by the current array. */
    get elementSize() {
        return this.elementType.class.arrayElementSize;
    }
    /** Gets the type of the object encompassed by the current array. */
    get elementType() {
        return this.object.class.type.class.baseType;
    }
    /** Gets the total number of elements in all the dimensions of the current array. */
    get length() {
        return Il2Cpp.Api._arrayGetLength(this);
    }
    /** Gets the encompassing object of the current array. */
    get object() {
        return new Il2Cpp.Object(this);
    }
    /** Gets the element at the specified index of the current array. */
    get(index) {
        if (index < 0 || index >= this.length) {
            (0, console_1.raise)(`cannot get element at index ${index}: array length is ${this.length}`);
        }
        return this.elements.get(index);
    }
    /** Sets the element at the specified index of the current array. */
    set(index, value) {
        if (index < 0 || index >= this.length) {
            (0, console_1.raise)(`cannot get element at index ${index}: array length is ${this.length}`);
        }
        this.elements.set(index, value);
    }
    /** */
    toString() {
        return this.isNull() ? "null" : `[${this.elements.read(this.length, 0)}]`;
    }
    /** Iterable. */
    *[Symbol.iterator]() {
        for (let i = 0; i < this.length; i++) {
            yield this.elements.get(i);
        }
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppArray.prototype, "elements", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppArray.prototype, "elementSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppArray.prototype, "elementType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppArray.prototype, "length", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppArray.prototype, "object", null);
Il2Cpp.Array = Il2CppArray;

},{"../../utils/console":38,"../../utils/native-struct":39,"decorator-cache-getter":9}],17:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const native_struct_1 = require("../../utils/native-struct");
const utils_1 = require("../../utils/utils");
/** Represents a `Il2CppAssembly`. */
let Il2CppAssembly = class Il2CppAssembly extends native_struct_1.NonNullNativeStruct {
    /** Gets the image of this assembly. */
    get image() {
        return new Il2Cpp.Image(Il2Cpp.Api._assemblyGetImage(this));
    }
    /** Gets the name of this assembly. */
    get name() {
        return this.image.name.replace(".dll", "");
    }
    /** Gets the encompassing object of the current assembly. */
    get object() {
        return Il2Cpp.Image.corlib.class("System.Reflection.Assembly").method("Load").invoke(Il2Cpp.String.from(this.name));
    }
};
__decorate([
    decorator_cache_getter_1.cache
], Il2CppAssembly.prototype, "image", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppAssembly.prototype, "name", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppAssembly.prototype, "object", null);
Il2CppAssembly = __decorate([
    utils_1.cacheInstances
], Il2CppAssembly);
Il2Cpp.Assembly = Il2CppAssembly;

},{"../../utils/native-struct":39,"../../utils/utils":41,"decorator-cache-getter":9}],18:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const console_1 = require("../../utils/console");
const native_struct_1 = require("../../utils/native-struct");
const utils_1 = require("../../utils/utils");
/** Represents a `Il2CppClass`. */
let Il2CppClass = class Il2CppClass extends native_struct_1.NonNullNativeStruct {
    /** Gets the actual size of the instance of the current class. */
    get actualInstanceSize() {
        return Il2Cpp.Api._classGetActualInstanceSize(this);
    }
    /** Gets the array class which encompass the current class. */
    get arrayClass() {
        return new Il2Cpp.Class(Il2Cpp.Api._classGetArrayClass(this, 1));
    }
    /** Gets the size of the object encompassed by the current array class. */
    get arrayElementSize() {
        return Il2Cpp.Api._classGetArrayElementSize(this);
    }
    /** Gets the name of the assembly in which the current class is defined. */
    get assemblyName() {
        return Il2Cpp.Api._classGetAssemblyName(this).readUtf8String();
    }
    /** Gets the class that declares the current nested class. */
    get declaringClass() {
        const handle = Il2Cpp.Api._classGetDeclaringType(this);
        return handle.isNull() ? null : new Il2Cpp.Class(handle);
    }
    /** Gets the encompassed type of this array, reference, pointer or enum type. */
    get baseType() {
        const handle = Il2Cpp.Api._classGetBaseType(this);
        return handle.isNull() ? null : new Il2Cpp.Type(handle);
    }
    /** Gets the class of the object encompassed or referred to by the current array, pointer or reference class. */
    get elementClass() {
        const handle = Il2Cpp.Api._classGetElementClass(this);
        return handle.isNull() ? null : new Il2Cpp.Class(handle);
    }
    /** Gets the fields of the current class. */
    get fields() {
        return Array.from((0, utils_1.nativeIterator)(this, Il2Cpp.Api._classGetFields, Il2Cpp.Field));
    }
    /** Gets the flags of the current class. */
    get flags() {
        return Il2Cpp.Api._classGetFlags(this);
    }
    /** Gets the amount of generic parameters of this generic class. */
    get genericParameterCount() {
        if (!this.isGeneric) {
            return 0;
        }
        return this.type.object.method("GetGenericArguments").invoke().length;
    }
    /** Determines whether the GC has tracking references to the current class instances. */
    get hasReferences() {
        return !!Il2Cpp.Api._classHasReferences(this);
    }
    /** Determines whether ther current class has a valid static constructor. */
    get hasStaticConstructor() {
        const staticConstructor = this.tryMethod(".cctor");
        return staticConstructor != null && !staticConstructor.virtualAddress.isNull();
    }
    /** Gets the image in which the current class is defined. */
    get image() {
        return new Il2Cpp.Image(Il2Cpp.Api._classGetImage(this));
    }
    /** Gets the size of the instance of the current class. */
    get instanceSize() {
        return Il2Cpp.Api._classGetInstanceSize(this);
    }
    /** Determines whether the current class is abstract. */
    get isAbstract() {
        return !!Il2Cpp.Api._classIsAbstract(this);
    }
    /** Determines whether the current class is blittable. */
    get isBlittable() {
        return !!Il2Cpp.Api._classIsBlittable(this);
    }
    /** Determines whether the current class is an enumeration. */
    get isEnum() {
        return !!Il2Cpp.Api._classIsEnum(this);
    }
    /** Determines whether the current class is a generic one. */
    get isGeneric() {
        return !!Il2Cpp.Api._classIsGeneric(this);
    }
    /** Determines whether the current class is inflated. */
    get isInflated() {
        return !!Il2Cpp.Api._classIsInflated(this);
    }
    /** Determines whether the current class is an interface. */
    get isInterface() {
        return !!Il2Cpp.Api._classIsInterface(this);
    }
    /** Determines whether the current class is a value type. */
    get isValueType() {
        return !!Il2Cpp.Api._classIsValueType(this);
    }
    /** Gets the interfaces implemented or inherited by the current class. */
    get interfaces() {
        return Array.from((0, utils_1.nativeIterator)(this, Il2Cpp.Api._classGetInterfaces, Il2Cpp.Class));
    }
    /** Gets the methods implemented by the current class. */
    get methods() {
        return Array.from((0, utils_1.nativeIterator)(this, Il2Cpp.Api._classGetMethods, Il2Cpp.Method));
    }
    /** Gets the name of the current class. */
    get name() {
        return Il2Cpp.Api._classGetName(this).readUtf8String();
    }
    /** Gets the namespace of the current class. */
    get namespace() {
        return Il2Cpp.Api._classGetNamespace(this).readUtf8String();
    }
    /** Gets the classes nested inside the current class. */
    get nestedClasses() {
        return Array.from((0, utils_1.nativeIterator)(this, Il2Cpp.Api._classGetNestedClasses, Il2Cpp.Class));
    }
    /** Gets the class from which the current class directly inherits. */
    get parent() {
        const handle = Il2Cpp.Api._classGetParent(this);
        return handle.isNull() ? null : new Il2Cpp.Class(handle);
    }
    /** Gets the rank (number of dimensions) of the current array class. */
    get rank() {
        return Il2Cpp.Api._classGetRank(this);
    }
    /** Gets a pointer to the static fields of the current class. */
    get staticFieldsData() {
        return Il2Cpp.Api._classGetStaticFieldData(this);
    }
    /** Gets the size of the instance - as a value type - of the current class. */
    get valueSize() {
        return Il2Cpp.Api._classGetValueSize(this, NULL);
    }
    /** Gets the type of the current class. */
    get type() {
        return new Il2Cpp.Type(Il2Cpp.Api._classGetType(this));
    }
    /** Allocates a new object of the current class. */
    alloc() {
        return new Il2Cpp.Object(Il2Cpp.Api._objectNew(this));
    }
    /** Gets the field identified by the given name. */
    field(name) {
        return this.tryField(name);
    }
    /** Builds a generic instance of the current generic class. */
    inflate(...classes) {
        if (!this.isGeneric) {
            (0, console_1.raise)(`cannot inflate class ${this.type.name}: it has no generic parameters`);
        }
        if (this.genericParameterCount != classes.length) {
            (0, console_1.raise)(`cannot inflate class ${this.type.name}: it needs ${this.genericParameterCount} generic parameter(s), not ${classes.length}`);
        }
        const types = classes.map(klass => klass.type.object);
        const typeArray = Il2Cpp.Array.from(Il2Cpp.Image.corlib.class("System.Type"), types);
        const inflatedType = this.type.object.method("MakeGenericType", 1).invoke(typeArray);
        return new Il2Cpp.Class(Il2Cpp.Api._classFromSystemType(inflatedType));
    }
    /** Calls the static constructor of the current class. */
    initialize() {
        Il2Cpp.Api._classInit(this);
    }
    /** Determines whether an instance of `other` class can be assigned to a variable of the current type. */
    isAssignableFrom(other) {
        return !!Il2Cpp.Api._classIsAssignableFrom(this, other);
    }
    /** Determines whether the current class derives from `other` class. */
    isSubclassOf(other, checkInterfaces) {
        return !!Il2Cpp.Api._classIsSubclassOf(this, other, +checkInterfaces);
    }
    /** Gets the method identified by the given name and parameter count. */
    method(name, parameterCount = -1) {
        return this.tryMethod(name, parameterCount);
    }
    /** Gets the nested class with the given name. */
    nested(name) {
        return this.tryNested(name);
    }
    /** Allocates a new object of the current class and calls its default constructor. */
    new() {
        const object = this.alloc();
        const exceptionArray = Memory.alloc(Process.pointerSize);
        Il2Cpp.Api._objectInit(object, exceptionArray);
        const exception = exceptionArray.readPointer();
        if (!exception.isNull()) {
            (0, console_1.raise)(new Il2Cpp.Object(exception).toString());
        }
        return object;
    }
    /** Gets the field with the given name. */
    tryField(name) {
        const handle = Il2Cpp.Api._classGetFieldFromName(this, Memory.allocUtf8String(name));
        return handle.isNull() ? null : new Il2Cpp.Field(handle);
    }
    /** Gets the method with the given name and parameter count. */
    tryMethod(name, parameterCount = -1) {
        const handle = Il2Cpp.Api._classGetMethodFromName(this, Memory.allocUtf8String(name), parameterCount);
        return handle.isNull() ? null : new Il2Cpp.Method(handle);
    }
    /** Gets the nested class with the given name. */
    tryNested(name) {
        return this.nestedClasses.find(e => e.name == name);
    }
    /** */
    toString() {
        const inherited = [this.parent].concat(this.interfaces);
        return `\
// ${this.assemblyName}
${this.isEnum ? `enum` : this.isValueType ? `struct` : this.isInterface ? `interface` : `class`} \
${this.type.name}\
${inherited ? ` : ${inherited.map(e => e?.type.name).join(`, `)}` : ``}
{
    ${this.fields.join(`\n    `)}
    ${this.methods.join(`\n    `)}
}`;
    }
    /** Executes a callback for every defined class. */
    static enumerate(block) {
        const callback = new NativeCallback(function (klass, _) {
            block(new Il2Cpp.Class(klass));
        }, "void", ["pointer", "pointer"]);
        return Il2Cpp.Api._classForEach(callback, NULL);
    }
};
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "actualInstanceSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "arrayClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "arrayElementSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "assemblyName", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "declaringClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "baseType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "elementClass", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "fields", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "flags", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "genericParameterCount", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "hasReferences", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "hasStaticConstructor", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "image", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "instanceSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "isAbstract", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "isBlittable", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "isEnum", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "isGeneric", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "isInflated", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "isInterface", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "isValueType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "interfaces", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "methods", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "name", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "namespace", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "nestedClasses", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "parent", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "rank", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "staticFieldsData", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "valueSize", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppClass.prototype, "type", null);
__decorate([
    (0, utils_1.levenshtein)("fields")
], Il2CppClass.prototype, "field", null);
__decorate([
    (0, utils_1.levenshtein)("methods")
], Il2CppClass.prototype, "method", null);
__decorate([
    (0, utils_1.levenshtein)("nestedClasses")
], Il2CppClass.prototype, "nested", null);
Il2CppClass = __decorate([
    utils_1.cacheInstances
], Il2CppClass);
Il2Cpp.Class = Il2CppClass;

},{"../../utils/console":38,"../../utils/native-struct":39,"../../utils/utils":41,"decorator-cache-getter":9}],19:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const utils_1 = require("../../utils/utils");
/** Represents a `Il2CppDomain`. */
class Il2CppDomain {
    constructor() { }
    /** Gets the assemblies that have been loaded into the execution context of the application domain. */
    static get assemblies() {
        const sizePointer = Memory.alloc(Process.pointerSize);
        const startPointer = Il2Cpp.Api._domainGetAssemblies(this, sizePointer);
        const count = sizePointer.readInt();
        const array = new Array(count);
        for (let i = 0; i < count; i++) {
            array[i] = new Il2Cpp.Assembly(startPointer.add(i * Process.pointerSize).readPointer());
        }
        if (count == 0) {
            for (const assemblyObject of this.object.method("GetAssemblies").overload().invoke()) {
                const assemblyName = assemblyObject.method("GetSimpleName").invoke().content;
                if (assemblyName != null) {
                    array.push(this.assembly(assemblyName));
                }
            }
        }
        return array;
    }
    /** Gets the application domain handle. */
    static get handle() {
        return Il2Cpp.Api._domainGet();
    }
    /** Gets the encompassing object of the application domain. */
    static get object() {
        return Il2Cpp.Image.corlib.class("System.AppDomain").method("get_CurrentDomain").invoke();
    }
    /** Opens and loads the assembly with the given name. */
    static assembly(name) {
        return this.tryAssembly(name);
    }
    /** Attached a new thread to the application domain. */
    static attach() {
        return new Il2Cpp.Thread(Il2Cpp.Api._threadAttach(this));
    }
    /** Opens and loads the assembly with the given name. */
    static tryAssembly(name) {
        const handle = Il2Cpp.Api._domainAssemblyOpen(this, Memory.allocUtf8String(name));
        return handle.isNull() ? null : new Il2Cpp.Assembly(handle);
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppDomain, "assemblies", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppDomain, "handle", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppDomain, "object", null);
__decorate([
    (0, utils_1.levenshtein)("assemblies")
], Il2CppDomain, "assembly", null);
Il2Cpp.Domain = Il2CppDomain;

},{"../../utils/utils":41,"decorator-cache-getter":9}],20:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const console_1 = require("../../utils/console");
const native_struct_1 = require("../../utils/native-struct");
const utils_1 = require("../utils");
/** Represents a `FieldInfo`. */
class Il2CppField extends native_struct_1.NonNullNativeStruct {
    /** Gets the class in which this field is defined. */
    get class() {
        return new Il2Cpp.Class(Il2Cpp.Api._fieldGetClass(this));
    }
    /** Gets the flags of the current field. */
    get flags() {
        return Il2Cpp.Api._fieldGetFlags(this);
    }
    /** Determines whether this field value is known at compile time. */
    get isLiteral() {
        return !!Il2Cpp.Api._fieldIsLiteral(this);
    }
    /** Determines whether this field is static. */
    get isStatic() {
        return !!Il2Cpp.Api._fieldIsStatic(this);
    }
    /** Determines whether this field is thread static. */
    get isThreadStatic() {
        return !!Il2Cpp.Api._fieldIsThreadStatic(this);
    }
    /** Gets the access modifier of this field. */
    get modifier() {
        return Il2Cpp.Api._fieldGetModifier(this).readUtf8String();
    }
    /** Gets the name of this field. */
    get name() {
        return Il2Cpp.Api._fieldGetName(this).readUtf8String();
    }
    /** Gets the offset of this field, calculated as the difference with its owner virtual address. */
    get offset() {
        return Il2Cpp.Api._fieldGetOffset(this);
    }
    /** Gets the type of this field. */
    get type() {
        return new Il2Cpp.Type(Il2Cpp.Api._fieldGetType(this));
    }
    /** Gets the value of this field. */
    get value() {
        const handle = Memory.alloc(Process.pointerSize);
        Il2Cpp.Api._fieldGetStaticValue(this.handle, handle);
        return (0, utils_1.read)(handle, this.type);
    }
    /** Sets the value of this field. Thread static or literal values cannot be altered yet. */
    set value(value) {
        if (this.isThreadStatic || this.isLiteral) {
            (0, console_1.raise)(`cannot modify the value of field ${this.name}: is thread static or literal`);
        }
        const handle = Memory.alloc(Process.pointerSize);
        (0, utils_1.write)(handle, value, this.type);
        Il2Cpp.Api._fieldSetStaticValue(this.handle, handle);
    }
    /** */
    toString() {
        return `\
${this.isThreadStatic ? `[ThreadStatic] ` : ``}\
${this.isStatic ? `static ` : ``}\
${this.type.name} \
${this.name}\
${this.isLiteral ? ` = ${this.type.class.isEnum ? (0, utils_1.read)(this.value.handle, this.type.class.baseType) : this.value}` : ``};\
${this.isThreadStatic || this.isLiteral ? `` : ` // 0x${this.offset.toString(16)}`}`;
    }
    /** @internal */
    withHolder(instance) {
        let valueHandle = instance.handle.add(this.offset);
        if (instance instanceof Il2Cpp.ValueType) {
            valueHandle = valueHandle.sub(Il2Cpp.Runtime.objectHeaderSize);
        }
        return new Proxy(this, {
            get(target, property) {
                if (property == "value") {
                    return (0, utils_1.read)(valueHandle, target.type);
                }
                return Reflect.get(target, property);
            },
            set(target, property, value) {
                if (property == "value") {
                    (0, utils_1.write)(valueHandle, value, target.type);
                    return true;
                }
                return Reflect.set(target, property, value);
            }
        });
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "class", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "flags", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "isLiteral", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "isStatic", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "isThreadStatic", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "name", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "offset", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppField.prototype, "type", null);
Reflect.set(Il2Cpp, "Field", Il2CppField);

},{"../../utils/console":38,"../../utils/native-struct":39,"../utils":36,"decorator-cache-getter":9}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Represents a GCHandle. */
class Il2CppGCHandle {
    handle;
    /** @internal */
    constructor(handle) {
        this.handle = handle;
    }
    /** Gets the object associated to this handle. */
    get target() {
        const handle = Il2Cpp.Api._gcHandleGetTarget(this.handle);
        return handle.isNull() ? null : new Il2Cpp.Object(handle);
    }
    /** Frees this handle. */
    free() {
        return Il2Cpp.Api._gcHandleFree(this.handle);
    }
}
Il2Cpp.GC.Handle = Il2CppGCHandle;

},{}],22:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const versioning_1 = __importDefault(require("versioning"));
/** Garbage collector utility functions. */
class Il2CppGC {
    constructor() { }
    /** Gets the heap size in bytes. */
    static get heapSize() {
        return Il2Cpp.Api._gcGetHeapSize();
    }
    /** Determines whether the garbage collector is disabled. */
    static get isEnabled() {
        return !Il2Cpp.Api._gcIsDisabled();
    }
    /** Determines whether the garbage collector is incremental. */
    static get isIncremental() {
        return !!Il2Cpp.Api._gcIsIncremental();
    }
    /** Gets the number of nanoseconds the garbage collector can spend in a collection step. */
    static get maxTimeSlice() {
        return Il2Cpp.Api._gcGetMaxTimeSlice();
    }
    /** Gets the used heap size in bytes. */
    static get usedHeapSize() {
        return Il2Cpp.Api._gcGetUsedSize();
    }
    /** Enables or disables the garbage collector. */
    static set isEnabled(value) {
        value ? Il2Cpp.Api._gcEnable() : Il2Cpp.Api._gcDisable();
    }
    /** Sets the number of nanoseconds the garbage collector can spend in a collection step. */
    static set maxTimeSlice(nanoseconds) {
        Il2Cpp.Api._gcSetMaxTimeSlice(nanoseconds);
    }
    /** Returns the heap allocated objects of the specified class. This variant reads GC descriptors. */
    static choose(klass) {
        const matches = [];
        const callback = (objects, size, _) => {
            for (let i = 0; i < size; i++) {
                matches.push(new Il2Cpp.Object(objects.add(i * Process.pointerSize).readPointer()));
            }
        };
        const chooseCallback = new NativeCallback(callback, "void", ["pointer", "int", "pointer"]);
        if (versioning_1.default.gte(Il2Cpp.unityVersion, "2021.2.0")) {
            const realloc = (handle, size) => {
                if (!handle.isNull() && size.compare(0) == 0) {
                    Il2Cpp.free(handle);
                    return NULL;
                }
                else {
                    return Il2Cpp.alloc(size);
                }
            };
            const reallocCallback = new NativeCallback(realloc, "pointer", ["pointer", "size_t", "pointer"]);
            const state = Il2Cpp.Api._livenessAllocateStruct(klass.handle, 0, chooseCallback, NULL, reallocCallback);
            Il2Cpp.Api._livenessCalculationFromStatics(state);
            Il2Cpp.Api._livenessFinalize(state);
            Il2Cpp.Api._livenessFreeStruct(state);
        }
        else {
            const onWorld = new NativeCallback(() => { }, "void", []);
            const state = Il2Cpp.Api._livenessCalculationBegin(klass.handle, 0, chooseCallback, NULL, onWorld, onWorld);
            Il2Cpp.Api._livenessCalculationFromStatics(state);
            Il2Cpp.Api._livenessCalculationEnd(state);
        }
        return matches;
    }
    /** Forces a garbage collection of the specified generation. */
    static collect(generation) {
        Il2Cpp.Api._gcCollect(generation < 0 ? 0 : generation > 2 ? 2 : generation);
    }
    /** Forces a garbage collection. */
    static collectALittle() {
        Il2Cpp.Api._gcCollectALittle();
    }
    /** Resumes all the previously stopped threads. */
    static startWorld() {
        return Il2Cpp.Api._gcStartWorld();
    }
    /** Performs an incremental garbage collection. */
    static startIncrementalCollection() {
        return Il2Cpp.Api._gcStartIncrementalCollection();
    }
    /** Stops all threads which may access the garbage collected heap, other than the caller. */
    static stopWorld() {
        return Il2Cpp.Api._gcStopWorld();
    }
}
Reflect.set(Il2Cpp, "GC", Il2CppGC);

},{"versioning":44}],23:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const native_struct_1 = require("../../utils/native-struct");
const utils_1 = require("../../utils/utils");
/** Represents a `Il2CppImage`. */
let Il2CppImage = class Il2CppImage extends native_struct_1.NonNullNativeStruct {
    /** Gets the COR library. */
    static get corlib() {
        return new Il2Cpp.Image(Il2Cpp.Api._getCorlib());
    }
    /** Gets the assembly in which the current image is defined. */
    get assembly() {
        return new Il2Cpp.Assembly(Il2Cpp.Api._imageGetAssembly(this));
    }
    /** Gets the amount of classes defined in this image. */
    get classCount() {
        return Il2Cpp.Api._imageGetClassCount(this);
    }
    /** Gets the classes defined in this image. */
    get classes() {
        if (Il2Cpp.unityVersionIsBelow201830) {
            const types = this.assembly.object.method("GetTypes").invoke(false);
            // On Unity 5.3.8f1, getting System.Reflection.Emit.OpCodes type name
            // without iterating all the classes first somehow blows things up at
            // app startup, hence the `Array.from`.
            return Array.from(types).map(e => new Il2Cpp.Class(Il2Cpp.Api._classFromSystemType(e)));
        }
        else {
            return Array.from(Array(this.classCount), (_, i) => new Il2Cpp.Class(Il2Cpp.Api._imageGetClass(this, i)));
        }
    }
    /** Gets the name of this image. */
    get name() {
        return Il2Cpp.Api._imageGetName(this).readUtf8String();
    }
    /** Gets the class with the specified name defined in this image. */
    class(name) {
        return this.tryClass(name);
    }
    /** Gets the class with the specified name defined in this image. */
    tryClass(name) {
        const dotIndex = name.lastIndexOf(".");
        const classNamespace = Memory.allocUtf8String(dotIndex == -1 ? "" : name.slice(0, dotIndex));
        const className = Memory.allocUtf8String(name.slice(dotIndex + 1));
        const handle = Il2Cpp.Api._classFromName(this, classNamespace, className);
        return handle.isNull() ? null : new Il2Cpp.Class(handle);
    }
};
__decorate([
    decorator_cache_getter_1.cache
], Il2CppImage.prototype, "assembly", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppImage.prototype, "classCount", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppImage.prototype, "classes", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppImage.prototype, "name", null);
__decorate([
    (0, utils_1.levenshtein)("classes", e => (e.namespace ? `${e.namespace}.${e.name}` : e.name))
], Il2CppImage.prototype, "class", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppImage, "corlib", null);
Il2CppImage = __decorate([
    utils_1.cacheInstances
], Il2CppImage);
Il2Cpp.Image = Il2CppImage;

},{"../../utils/native-struct":39,"../../utils/utils":41,"decorator-cache-getter":9}],24:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const native_struct_1 = require("../../utils/native-struct");
const utils_1 = require("../../utils/utils");
/** Represents a `Il2CppManagedMemorySnapshot`. */
class Il2CppMemorySnapshot extends native_struct_1.NonNullNativeStruct {
    /** Captures a memory snapshot. */
    static capture() {
        return new Il2Cpp.MemorySnapshot();
    }
    /** Creates a memory snapshot with the given handle. */
    constructor(handle = Il2Cpp.Api._memorySnapshotCapture()) {
        super(handle);
    }
    /** Gets any initialized class. */
    get classes() {
        return Array.from((0, utils_1.nativeIterator)(this, Il2Cpp.Api._memorySnapshotGetClasses, Il2Cpp.Class));
    }
    /** Gets the objects tracked by this memory snapshot. */
    get objects() {
        const array = [];
        const [count, start] = Il2Cpp.Api._memorySnapshotGetGCHandles(this);
        for (let i = 0; i < count; i++) {
            array.push(new Il2Cpp.Object(start.add(i * Process.pointerSize).readPointer()));
        }
        return array;
    }
    /** Frees this memory snapshot. */
    free() {
        Il2Cpp.Api._memorySnapshotFree(this);
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMemorySnapshot.prototype, "classes", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMemorySnapshot.prototype, "objects", null);
Il2Cpp.MemorySnapshot = Il2CppMemorySnapshot;

},{"../../utils/native-struct":39,"../../utils/utils":41,"decorator-cache-getter":9}],25:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const console_1 = require("../../utils/console");
const native_struct_1 = require("../../utils/native-struct");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../utils");
/** Represents a `MethodInfo`. */
class Il2CppMethod extends native_struct_1.NonNullNativeStruct {
    /** Gets the class in which this method is defined. */
    get class() {
        return new Il2Cpp.Class(Il2Cpp.Api._methodGetClass(this));
    }
    /** Gets the flags of the current method. */
    get flags() {
        return Il2Cpp.Api._methodGetFlags(this, NULL);
    }
    /** Gets the implementation flags of the current method. */
    get implementationFlags() {
        const implementationFlagsPointer = Memory.alloc(Process.pointerSize);
        Il2Cpp.Api._methodGetFlags(this, implementationFlagsPointer);
        return implementationFlagsPointer.readU32();
    }
    /** */
    get fridaSignature() {
        const types = [];
        for (const parameter of this.parameters) {
            types.push(parameter.type.fridaAlias);
        }
        if (!this.isStatic || Il2Cpp.unityVersionIsBelow201830) {
            types.unshift("pointer");
        }
        if (this.isInflated) {
            types.push("pointer");
        }
        return types;
    }
    /** Gets the amount of generic parameters of this generic method. */
    get genericParameterCount() {
        if (!this.isGeneric) {
            return 0;
        }
        return this.object.method("GetGenericArguments").invoke().length;
    }
    /** Determines whether this method is external. */
    get isExternal() {
        return !!Il2Cpp.Api._methodIsExternal(this);
    }
    /** Determines whether this method is generic. */
    get isGeneric() {
        return !!Il2Cpp.Api._methodIsGeneric(this);
    }
    /** Determines whether this method is inflated (generic with a concrete type parameter). */
    get isInflated() {
        return !!Il2Cpp.Api._methodIsInflated(this);
    }
    /** Determines whether this method is static. */
    get isStatic() {
        return !Il2Cpp.Api._methodIsInstance(this);
    }
    /** Determines whether this method is synchronized. */
    get isSynchronized() {
        return !!Il2Cpp.Api._methodIsSynchronized(this);
    }
    /** Gets the access modifier of this method. */
    get modifier() {
        return Il2Cpp.Api._methodGetModifier(this).readUtf8String();
    }
    /** Gets the name of this method. */
    get name() {
        return Il2Cpp.Api._methodGetName(this).readUtf8String();
    }
    /** @internal */
    get nativeFunction() {
        return new NativeFunction(this.virtualAddress, this.returnType.fridaAlias, this.fridaSignature);
    }
    /** Gets the encompassing object of the current method. */
    get object() {
        return new Il2Cpp.Object(Il2Cpp.Api._methodGetObject(this, NULL));
    }
    /** Gets the amount of parameters of this method. */
    get parameterCount() {
        return Il2Cpp.Api._methodGetParameterCount(this);
    }
    /** Gets the parameters of this method. */
    get parameters() {
        return Array.from(Array(this.parameterCount), (_, i) => {
            const parameterName = Il2Cpp.Api._methodGetParameterName(this, i).readUtf8String();
            const parameterType = Il2Cpp.Api._methodGetParameterType(this, i);
            return new Il2Cpp.Parameter(parameterName, i, new Il2Cpp.Type(parameterType));
        });
    }
    /** Gets the relative virtual address (RVA) of this method. */
    get relativeVirtualAddress() {
        return this.virtualAddress.sub(Il2Cpp.module.base);
    }
    /** Gets the return type of this method. */
    get returnType() {
        return new Il2Cpp.Type(Il2Cpp.Api._methodGetReturnType(this));
    }
    /** Gets the virtual address (VA) to this method. */
    get virtualAddress() {
        return Il2Cpp.Api._methodGetPointer(this);
    }
    /** Replaces the body of this method. */
    set implementation(block) {
        const startIndex = +!this.isStatic | +Il2Cpp.unityVersionIsBelow201830;
        const callback = (...args) => {
            const parameters = this.parameters.map((e, i) => (0, utils_2.fromFridaValue)(args[i + startIndex], e.type));
            return (0, utils_2.toFridaValue)(block.call(this.isStatic ? this.class : new Il2Cpp.Object(args[0]), ...parameters));
        };
        try {
            Interceptor.replace(this.virtualAddress, new NativeCallback(callback, this.returnType.fridaAlias, this.fridaSignature));
        }
        catch (e) {
            switch (e.message) {
                case "access violation accessing 0x0":
                    (0, console_1.raise)(`cannot implement method ${this.name}: it has a NULL virtual address`);
                case `unable to intercept function at ${this.virtualAddress}; please file a bug`:
                    (0, console_1.warn)(`cannot implement method ${this.name}: it may be a thunk`);
                    break;
                case "already replaced this function":
                    (0, console_1.warn)(`cannot implement method ${this.name}: already replaced by a thunk`);
                    break;
                default:
                    throw e;
            }
        }
    }
    /** Creates a generic instance of the current generic method. */
    inflate(...classes) {
        if (!this.isGeneric) {
            (0, console_1.raise)(`cannot inflate method ${this.name}: it has no generic parameters`);
        }
        if (this.genericParameterCount != classes.length) {
            (0, console_1.raise)(`cannot inflate method ${this.name}: it needs ${this.genericParameterCount} generic parameter(s), not ${classes.length}`);
        }
        const types = classes.map(klass => klass.type.object);
        const typeArray = Il2Cpp.Array.from(Il2Cpp.Image.corlib.class("System.Type"), types);
        const inflatedMethodObject = this.object.method("MakeGenericMethod", 1).invoke(typeArray);
        return new Il2Cpp.Method(Il2Cpp.Api._methodGetFromReflection(inflatedMethodObject));
    }
    /** Invokes this method. */
    invoke(...parameters) {
        if (!this.isStatic) {
            (0, console_1.raise)(`cannot invoke a non-static method ${this.name}: must be invoked throught a Il2Cpp.Object, not a Il2Cpp.Class`);
        }
        return this.invokeRaw(NULL, ...parameters);
    }
    /** @internal */
    invokeRaw(instance, ...parameters) {
        const allocatedParameters = parameters.map(utils_2.toFridaValue);
        if (!this.isStatic || Il2Cpp.unityVersionIsBelow201830) {
            allocatedParameters.unshift(instance);
        }
        if (this.isInflated) {
            allocatedParameters.push(this.handle);
        }
        try {
            const returnValue = this.nativeFunction(...allocatedParameters);
            return (0, utils_2.fromFridaValue)(returnValue, this.returnType);
        }
        catch (e) {
            if (e == null) {
                (0, console_1.raise)("an unexpected native function exception occurred, this is due to parameter types mismatch");
            }
            switch (e.message) {
                case "bad argument count":
                    (0, console_1.raise)(`cannot invoke method ${this.name}: it needs ${this.parameterCount} parameter(s), not ${parameters.length}`);
                case "expected a pointer":
                case "expected number":
                case "expected array with fields":
                    (0, console_1.raise)(`cannot invoke method ${this.name}: parameter types mismatch`);
            }
            throw e;
        }
    }
    /** Gets the overloaded method with the given parameter types. */
    overload(...parameterTypes) {
        const result = this.tryOverload(...parameterTypes);
        if (result != undefined)
            return result;
        (0, console_1.raise)(`cannot find overloaded method ${this.name}(${parameterTypes})`);
    }
    /** Gets the parameter with the given name. */
    parameter(name) {
        return this.tryParameter(name);
    }
    /** Restore the original method implementation. */
    revert() {
        Interceptor.revert(this.virtualAddress);
        Interceptor.flush();
    }
    /** Gets the overloaded method with the given parameter types. */
    tryOverload(...parameterTypes) {
        return this.class.methods.find(e => e.name == this.name &&
            e.parameterCount == parameterTypes.length &&
            e.parameters.every((e, i) => e.type.name == parameterTypes[i]));
    }
    /** Gets the parameter with the given name. */
    tryParameter(name) {
        return this.parameters.find(e => e.name == name);
    }
    /** */
    toString() {
        return `\
${this.isStatic ? `static ` : ``}\
${this.returnType.name} \
${this.name}\
(${this.parameters.join(`, `)});\
${this.virtualAddress.isNull() ? `` : ` // 0x${this.relativeVirtualAddress.toString(16).padStart(8, `0`)}`}`;
    }
    /** @internal */
    withHolder(instance) {
        return new Proxy(this, {
            get(target, property) {
                switch (property) {
                    case "invoke":
                        return target.invokeRaw.bind(target, instance.handle);
                    case "inflate":
                    case "overload":
                    case "tryOverload":
                        return function (...args) {
                            return target[property](...args)?.withHolder(instance);
                        };
                }
                return Reflect.get(target, property);
            }
        });
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "class", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "flags", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "implementationFlags", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "fridaSignature", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "genericParameterCount", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "isExternal", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "isGeneric", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "isInflated", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "isStatic", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "isSynchronized", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "name", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "nativeFunction", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "object", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "parameterCount", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "parameters", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "relativeVirtualAddress", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "returnType", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppMethod.prototype, "virtualAddress", null);
__decorate([
    (0, utils_1.levenshtein)("parameters")
], Il2CppMethod.prototype, "parameter", null);
Reflect.set(Il2Cpp, "Method", Il2CppMethod);

},{"../../utils/console":38,"../../utils/native-struct":39,"../../utils/utils":41,"../utils":36,"decorator-cache-getter":9}],26:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const native_struct_1 = require("../../utils/native-struct");
/** Represents a `Il2CppObject`. */
class Il2CppObject extends native_struct_1.NativeStruct {
    /** Gets the class of this object. */
    get class() {
        return new Il2Cpp.Class(Il2Cpp.Api._objectGetClass(this));
    }
    /** Gets the size of the current object. */
    get size() {
        return Il2Cpp.Api._objectGetSize(this);
    }
    /** Acquires an exclusive lock on the current object. */
    enter() {
        return Il2Cpp.Api._monitorEnter(this);
    }
    /** Release an exclusive lock on the current object. */
    exit() {
        return Il2Cpp.Api._monitorExit(this);
    }
    /** Gets the field with the given name. */
    field(name) {
        return this.class.field(name).withHolder(this);
    }
    /** Gets the method with the given name. */
    method(name, parameterCount = -1) {
        return this.class.method(name, parameterCount).withHolder(this);
    }
    /** Notifies a thread in the waiting queue of a change in the locked object's state. */
    pulse() {
        return Il2Cpp.Api._monitorPulse(this);
    }
    /** Notifies all waiting threads of a change in the object's state. */
    pulseAll() {
        return Il2Cpp.Api._monitorPulseAll(this);
    }
    /** Creates a reference to this object. */
    ref(pin) {
        return new Il2Cpp.GC.Handle(Il2Cpp.Api._gcHandleNew(this, +pin));
    }
    /** Gets the correct virtual method from the given virtual method. */
    virtualMethod(method) {
        return new Il2Cpp.Method(Il2Cpp.Api._objectGetVirtualMethod(this, method)).withHolder(this);
    }
    /** Attempts to acquire an exclusive lock on the current object. */
    tryEnter(timeout) {
        return !!Il2Cpp.Api._monitorTryEnter(this, timeout);
    }
    /** Gets the field with the given name. */
    tryField(name) {
        return this.class.tryField(name)?.withHolder(this);
    }
    /** Gets the field with the given name. */
    tryMethod(name, parameterCount = -1) {
        return this.class.tryMethod(name, parameterCount)?.withHolder(this);
    }
    /** Releases the lock on an object and attempts to block the current thread until it reacquires the lock. */
    tryWait(timeout) {
        return !!Il2Cpp.Api._monitorTryWait(this, timeout);
    }
    /** */
    toString() {
        return this.isNull() ? "null" : this.method("ToString").invoke().content ?? "null";
    }
    /** Unboxes the value type out of this object. */
    unbox() {
        return new Il2Cpp.ValueType(Il2Cpp.Api._objectUnbox(this), this.class.type);
    }
    /** Releases the lock on an object and blocks the current thread until it reacquires the lock. */
    wait() {
        return Il2Cpp.Api._monitorWait(this);
    }
    /** Creates a weak reference to this object. */
    weakRef(trackResurrection) {
        return new Il2Cpp.GC.Handle(Il2Cpp.Api._gcHandleNewWeakRef(this, +trackResurrection));
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppObject.prototype, "class", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppObject.prototype, "size", null);
Il2Cpp.Object = Il2CppObject;

},{"../../utils/native-struct":39,"decorator-cache-getter":9}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Represents a `ParameterInfo`. */
class Il2CppParameter {
    /** Name of this parameter. */
    name;
    /** Position of this parameter. */
    position;
    /** Type of this parameter. */
    type;
    constructor(name, position, type) {
        this.name = name;
        this.position = position;
        this.type = type;
    }
    /** */
    toString() {
        return `${this.type.name} ${this.name}`;
    }
}
Il2Cpp.Parameter = Il2CppParameter;

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const native_struct_1 = require("../../utils/native-struct");
/** */
class Il2CppPointer extends native_struct_1.NativeStruct {
    type;
    constructor(handle, type) {
        super(handle);
        this.type = type;
    }
    /** Gets the element at the given index. */
    get(index) {
        return (0, utils_1.read)(this.handle.add(index * this.type.class.arrayElementSize), this.type);
    }
    /** Reads the given amount of elements starting at the given offset. */
    read(length, offset = 0) {
        const values = new Array(length);
        for (let i = 0; i < length; i++) {
            values[i] = this.get(i + offset);
        }
        return values;
    }
    /** Sets the given element at the given index */
    set(index, value) {
        (0, utils_1.write)(this.handle.add(index * this.type.class.arrayElementSize), value, this.type);
    }
    /** */
    toString() {
        return this.handle.toString();
    }
    /** Writes the given elements starting at the given index. */
    write(values, offset = 0) {
        for (let i = 0; i < values.length; i++) {
            this.set(i + offset, values[i]);
        }
    }
}
Il2Cpp.Pointer = Il2CppPointer;

},{"../../utils/native-struct":39,"../utils":36}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const native_struct_1 = require("../../utils/native-struct");
const console_1 = require("../../utils/console");
/** Represent a parameter passed by reference. */
class Il2CppReference extends native_struct_1.NativeStruct {
    type;
    constructor(handle, type) {
        super(handle);
        this.type = type;
    }
    /** Gets the element referenced by the current reference. */
    get value() {
        return (0, utils_1.read)(this.handle, this.type);
    }
    /** Sets the element referenced by the current reference. */
    set value(value) {
        (0, utils_1.write)(this.handle, value, this.type);
    }
    /** */
    toString() {
        return this.isNull() ? "null" : `->${this.value}`;
    }
    /** Creates a reference to the specified value. */
    static to(value, type) {
        const handle = Memory.alloc(Process.pointerSize);
        switch (typeof value) {
            case "boolean":
                return new Il2Cpp.Reference(handle.writeS8(+value), Il2Cpp.Image.corlib.class("System.Boolean").type);
            case "number":
                switch (type?.typeEnum) {
                    case 5 /* U1 */:
                        return new Il2Cpp.Reference(handle.writeU8(value), type);
                    case 4 /* I1 */:
                        return new Il2Cpp.Reference(handle.writeS8(value), type);
                    case 3 /* Char */:
                    case 7 /* U2 */:
                        return new Il2Cpp.Reference(handle.writeU16(value), type);
                    case 6 /* I2 */:
                        return new Il2Cpp.Reference(handle.writeS16(value), type);
                    case 9 /* U4 */:
                        return new Il2Cpp.Reference(handle.writeU32(value), type);
                    case 8 /* I4 */:
                        return new Il2Cpp.Reference(handle.writeS32(value), type);
                    case 11 /* U8 */:
                        return new Il2Cpp.Reference(handle.writeU64(value), type);
                    case 10 /* I8 */:
                        return new Il2Cpp.Reference(handle.writeS64(value), type);
                    case 12 /* R4 */:
                        return new Il2Cpp.Reference(handle.writeFloat(value), type);
                    case 13 /* R8 */:
                        return new Il2Cpp.Reference(handle.writeDouble(value), type);
                }
            case "object":
                if (value instanceof Il2Cpp.ValueType || value instanceof Il2Cpp.Pointer) {
                    return new Il2Cpp.Reference(handle.writePointer(value), value.type);
                }
                else if (value instanceof Il2Cpp.Object) {
                    return new Il2Cpp.Reference(handle.writePointer(value), value.class.type);
                }
                else if (value instanceof Il2Cpp.String || value instanceof Il2Cpp.Array) {
                    return new Il2Cpp.Reference(handle.writePointer(value), value.object.class.type);
                }
                else if (value instanceof NativePointer) {
                    switch (type?.typeEnum) {
                        case 25 /* UnsignedNativeInteger */:
                        case 24 /* NativeInteger */:
                            return new Il2Cpp.Reference(handle.writePointer(value), type);
                    }
                }
                else if (value instanceof Int64) {
                    return new Il2Cpp.Reference(handle.writeS64(value), Il2Cpp.Image.corlib.class("System.Int64").type);
                }
                else if (value instanceof UInt64) {
                    return new Il2Cpp.Reference(handle.writeU64(value), Il2Cpp.Image.corlib.class("System.UInt64").type);
                }
            default:
                (0, console_1.raise)(`don't know how to create a reference to ${value} using type ${type?.name}`);
        }
    }
}
Il2Cpp.Reference = Il2CppReference;

},{"../../utils/console":38,"../../utils/native-struct":39,"../utils":36}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const native_struct_1 = require("../../utils/native-struct");
/** Represents a `Il2CppString`. */
class Il2CppString extends native_struct_1.NativeStruct {
    /** Gets the content of this string. */
    get content() {
        return Il2Cpp.Api._stringChars(this).readUtf16String(this.length);
    }
    /** Sets the content of this string. */
    set content(value) {
        Il2Cpp.Api._stringChars(this).writeUtf16String(value ?? "");
        Il2Cpp.Api._stringSetLength(this, value?.length ?? 0);
    }
    /** Gets the length of this string. */
    get length() {
        return Il2Cpp.Api._stringLength(this);
    }
    /** Gets the encompassing object of the current string. */
    get object() {
        return new Il2Cpp.Object(this);
    }
    /** */
    toString() {
        return this.isNull() ? "null" : `"${this.content}"`;
    }
    /** Creates a new string with the specified content. */
    static from(content) {
        return new Il2Cpp.String(Il2Cpp.Api._stringNew(Memory.allocUtf8String(content || "")));
    }
}
Il2Cpp.String = Il2CppString;

},{"../../utils/native-struct":39}],31:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const console_1 = require("../../utils/console");
const native_struct_1 = require("../../utils/native-struct");
/** Represents a `Il2CppThread`. */
class Il2CppThread extends native_struct_1.NativeStruct {
    /** @internal */
    static get idOffset() {
        const handle = ptr(Il2Cpp.currentThread.internal.field("thread_id").value.toString());
        const currentThreadId = Process.getCurrentThreadId();
        for (let i = 0; i < 1024; i++) {
            const candidate = handle.add(i).readS32();
            if (candidate == currentThreadId) {
                return i;
            }
        }
        (0, console_1.raise)(`couldn't determine the offset for a native thread id value`);
    }
    /** Gets the native id of the current thread. */
    get id() {
        return ptr(this.internal.field("thread_id").value.toString()).add(Il2Cpp.Thread.idOffset).readS32();
    }
    /** @internal Gets the encompassing internal object (System.Threding.InternalThreead) of the current thread. */
    get internal() {
        const internalThread = this.object.tryField("internal_thread")?.value;
        return internalThread ? internalThread : this.object;
    }
    /** Determines whether the current thread is the garbage collector finalizer one. */
    get isFinalizer() {
        return !Il2Cpp.Api._threadIsVm(this);
    }
    /** Gets the encompassing object of the current thread. */
    get object() {
        return new Il2Cpp.Object(this);
    }
    /** @internal */
    get staticData() {
        return this.internal.field("static_data").value;
    }
    /** @internal */
    get synchronizationContext() {
        const get_ExecutionContext = this.object.tryMethod("GetMutableExecutionContext") || this.object.method("get_ExecutionContext");
        let synchronizationContext = get_ExecutionContext.invoke().tryMethod("get_SynchronizationContext")?.invoke();
        if (synchronizationContext == null) {
            const SystemThreadingSynchronizationContext = Il2Cpp.Image.corlib.class("System.Threading.SynchronizationContext");
            for (let i = 0; i < 16; i++) {
                try {
                    const candidate = new Il2Cpp.Object(this.staticData
                        .add(Process.pointerSize * i)
                        .readPointer()
                        .readPointer());
                    if (candidate.class.isSubclassOf(SystemThreadingSynchronizationContext, false)) {
                        synchronizationContext = candidate;
                        break;
                    }
                }
                catch (e) { }
            }
        }
        if (synchronizationContext == null) {
            (0, console_1.raise)("couldn't retrieve the SynchronizationContext for this thread.");
        }
        return synchronizationContext;
    }
    /** Detaches the thread from the application domain. */
    detach() {
        return Il2Cpp.Api._threadDetach(this);
    }
    /** Schedules a callback on the current thread. */
    schedule(block, delayMs = 0) {
        const threadId = this.id;
        const GetDisplayName = Il2Cpp.Image.corlib.class("Mono.Runtime").method("GetDisplayName");
        const SendOrPostCallback = Il2Cpp.Image.corlib.class("System.Threading.SendOrPostCallback").alloc();
        SendOrPostCallback.method(".ctor").invoke(NULL, GetDisplayName.handle);
        const Post = this.synchronizationContext.method("Post");
        return new Promise(resolve => {
            const listener = Interceptor.attach(GetDisplayName.virtualAddress, function () {
                if (this.threadId == threadId) {
                    listener.detach();
                    const result = block();
                    setImmediate(() => resolve(result));
                }
            });
            setTimeout(() => Post.invoke(SendOrPostCallback, NULL), delayMs);
        });
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppThread.prototype, "internal", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppThread.prototype, "object", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppThread.prototype, "staticData", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppThread.prototype, "synchronizationContext", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppThread, "idOffset", null);
Il2Cpp.Thread = Il2CppThread;

}).call(this)}).call(this,require("timers").setImmediate)

},{"../../utils/console":38,"../../utils/native-struct":39,"decorator-cache-getter":9,"timers":43}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],33:[function(require,module,exports){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorator_cache_getter_1 = require("decorator-cache-getter");
const native_struct_1 = require("../../utils/native-struct");
/** Represents a `Il2CppType`. */
class Il2CppType extends native_struct_1.NonNullNativeStruct {
    /** Gets the class of this type. */
    get class() {
        return new Il2Cpp.Class(Il2Cpp.Api._classFromType(this));
    }
    /** */
    get fridaAlias() {
        if (this.isByReference) {
            return "pointer";
        }
        switch (this.typeEnum) {
            case 1 /* Void */:
                return "void";
            case 2 /* Boolean */:
                return "bool";
            case 3 /* Char */:
                return "uchar";
            case 4 /* I1 */:
                return "int8";
            case 5 /* U1 */:
                return "uint8";
            case 6 /* I2 */:
                return "int16";
            case 7 /* U2 */:
                return "uint16";
            case 8 /* I4 */:
                return "int32";
            case 9 /* U4 */:
                return "uint32";
            case 10 /* I8 */:
                return "int64";
            case 11 /* U8 */:
                return "uint64";
            case 12 /* R4 */:
                return "float";
            case 13 /* R8 */:
                return "double";
            case 17 /* ValueType */:
                return getValueTypeFields(this);
            case 24 /* NativeInteger */:
            case 25 /* UnsignedNativeInteger */:
            case 15 /* Pointer */:
            case 14 /* String */:
            case 29 /* SingleDimensionalZeroLowerBoundArray */:
            case 20 /* Array */:
                return "pointer";
            case 18 /* Class */:
            case 28 /* Object */:
            case 21 /* GenericInstance */:
                return this.class.isValueType ? getValueTypeFields(this) : "pointer";
            default:
                return "pointer";
        }
    }
    /** Determines whether this type is passed by reference. */
    get isByReference() {
        return !!Il2Cpp.Api._typeIsByReference(this);
    }
    /** Determines whether this type is primitive. */
    get isPrimitive() {
        return !!Il2Cpp.Api._typeIsPrimitive(this);
    }
    /** Gets the name of this type. */
    get name() {
        const handle = Il2Cpp.Api._typeGetName(this);
        try {
            return handle.readUtf8String();
        }
        finally {
            Il2Cpp.free(handle);
        }
    }
    /** Gets the encompassing object of the current type. */
    get object() {
        return new Il2Cpp.Object(Il2Cpp.Api._typeGetObject(this));
    }
    /** Gets the type enum of the current type. */
    get typeEnum() {
        return Il2Cpp.Api._typeGetTypeEnum(this);
    }
    /** */
    toString() {
        return this.name;
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Il2CppType.prototype, "class", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppType.prototype, "fridaAlias", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppType.prototype, "isByReference", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppType.prototype, "isPrimitive", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppType.prototype, "name", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppType.prototype, "object", null);
__decorate([
    decorator_cache_getter_1.cache
], Il2CppType.prototype, "typeEnum", null);
function getValueTypeFields(type) {
    const instanceFields = type.class.fields.filter(f => !f.isStatic);
    return instanceFields.length == 0 ? ["char"] : instanceFields.map(f => f.type.fridaAlias);
}
Reflect.set(Il2Cpp, "Type", Il2CppType);

},{"../../utils/native-struct":39,"decorator-cache-getter":9}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const native_struct_1 = require("../../utils/native-struct");
/** Value type class utility. */
class Il2CppValueType extends native_struct_1.NativeStruct {
    type;
    constructor(handle, type) {
        super(handle);
        this.type = type;
    }
    /** Boxes the current value type in a object. */
    box() {
        return new Il2Cpp.Object(Il2Cpp.Api._valueBox(this.type.class, this));
    }
    /** Gets the field with the given name. */
    field(name) {
        return this.type.class.field(name).withHolder(this);
    }
    /** */
    toString() {
        return this.isNull() ? "null" : this.box().toString();
    }
}
Il2Cpp.ValueType = Il2CppValueType;

},{"../../utils/native-struct":39}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = require("../utils/console");
const utils_1 = require("./utils");
/** Tracing utilities. */
class Il2CppTracer {
    /** @internal */
    targets = [];
    /** @internal */
    #assemblies;
    /** @internal */
    #classes;
    /** @internal */
    #methods;
    /** @internal */
    #assemblyFilter;
    /** @internal */
    #classFilter;
    /** @internal */
    #methodFilter;
    /** @internal */
    #parameterFilter;
    domain() {
        return this;
    }
    assemblies(...assemblies) {
        this.#assemblies = assemblies;
        return this;
    }
    classes(...classes) {
        this.#classes = classes;
        return this;
    }
    methods(...methods) {
        this.#methods = methods;
        return this;
    }
    filterAssemblies(filter) {
        this.#assemblyFilter = filter;
        return this;
    }
    filterClasses(filter) {
        this.#classFilter = filter;
        return this;
    }
    filterMethods(filter) {
        this.#methodFilter = filter;
        return this;
    }
    filterParameters(filter) {
        this.#parameterFilter = filter;
        return this;
    }
    and() {
        const filterMethod = (method) => {
            if (this.#parameterFilter == undefined) {
                this.targets.push(method);
                return;
            }
            for (const parameter of method.parameters) {
                if (this.#parameterFilter(parameter)) {
                    this.targets.push(method);
                    break;
                }
            }
        };
        const filterMethods = (values) => {
            for (const method of values) {
                filterMethod(method);
            }
        };
        const filterClass = (klass) => {
            if (this.#methodFilter == undefined) {
                filterMethods(klass.methods);
                return;
            }
            for (const method of klass.methods) {
                if (this.#methodFilter(method)) {
                    filterMethod(method);
                }
            }
        };
        const filterClasses = (values) => {
            for (const klass of values) {
                filterClass(klass);
            }
        };
        const filterAssembly = (assembly) => {
            if (this.#classFilter == undefined) {
                filterClasses(assembly.image.classes);
                return;
            }
            for (const klass of assembly.image.classes) {
                if (this.#classFilter(klass)) {
                    filterClass(klass);
                }
            }
        };
        const filterAssemblies = (assemblies) => {
            for (const assembly of assemblies) {
                filterAssembly(assembly);
            }
        };
        const filterDomain = (domain) => {
            if (this.#assemblyFilter == undefined) {
                filterAssemblies(domain.assemblies);
                return;
            }
            for (const assembly of domain.assemblies) {
                if (this.#assemblyFilter(assembly)) {
                    filterAssembly(assembly);
                }
            }
        };
        this.#methods
            ? filterMethods(this.#methods)
            : this.#classes
                ? filterClasses(this.#classes)
                : this.#assemblies
                    ? filterAssemblies(this.#assemblies)
                    : filterDomain(Il2Cpp.Domain);
        this.#assemblies = undefined;
        this.#classes = undefined;
        this.#methods = undefined;
        this.#assemblyFilter = undefined;
        this.#classFilter = undefined;
        this.#methodFilter = undefined;
        this.#parameterFilter = undefined;
        return this;
    }
    attach(mode = "full") {
        let count = 0;
        for (const target of this.targets) {
            if (target.virtualAddress.isNull()) {
                continue;
            }
            const offset = `\x1b[2m0x${target.relativeVirtualAddress.toString(16).padStart(8, `0`)}\x1b[0m`;
            const fullName = `${target.class.type.name}.\x1b[1m${target.name}\x1b[0m`;
            if (mode == "detailed") {
                const startIndex = +!target.isStatic | +Il2Cpp.unityVersionIsBelow201830;
                const callback = (...args) => {
                    const thisParameter = target.isStatic ? undefined : new Il2Cpp.Parameter("this", -1, target.class.type);
                    const parameters = thisParameter ? [thisParameter].concat(target.parameters) : target.parameters;
                    (0, console_1.inform)(`\
${offset} ${`│ `.repeat(count++)}┌─\x1b[35m${fullName}\x1b[0m(\
${parameters.map(e => `\x1b[32m${e.name}\x1b[0m = \x1b[31m${(0, utils_1.fromFridaValue)(args[e.position + startIndex], e.type)}\x1b[0m`).join(`, `)});`);
                    const returnValue = target.nativeFunction(...args);
                    (0, console_1.inform)(`\
${offset} ${`│ `.repeat(--count)}└─\x1b[33m${fullName}\x1b[0m\
${returnValue == undefined ? `` : ` = \x1b[36m${(0, utils_1.fromFridaValue)(returnValue, target.returnType)}`}\x1b[0m;`);
                    return returnValue;
                };
                try {
                    target.revert();
                    const nativeCallback = new NativeCallback(callback, target.returnType.fridaAlias, target.fridaSignature);
                    Interceptor.replace(target.virtualAddress, nativeCallback);
                }
                catch (e) { }
            }
            else {
                try {
                    Interceptor.attach(target.virtualAddress, {
                        onEnter: () => (0, console_1.inform)(`${offset} ${`│ `.repeat(count++)}┌─\x1b[35m${fullName}\x1b[0m`),
                        onLeave: () => (0, console_1.inform)(`${offset} ${`│ `.repeat(--count)}└─\x1b[33m${fullName}\x1b[0m${count == 0 ? `\n` : ``}`)
                    });
                }
                catch (e) { }
            }
        }
    }
}
Il2Cpp.Tracer = Il2CppTracer;

},{"../utils/console":38,"./utils":36}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFridaValue = exports.fromFridaValue = exports.write = exports.read = void 0;
const console_1 = require("../utils/console");
const native_struct_1 = require("../utils/native-struct");
/** @internal */
function read(pointer, type) {
    switch (type.typeEnum) {
        case 2 /* Boolean */:
            return !!pointer.readS8();
        case 4 /* I1 */:
            return pointer.readS8();
        case 5 /* U1 */:
            return pointer.readU8();
        case 6 /* I2 */:
            return pointer.readS16();
        case 7 /* U2 */:
            return pointer.readU16();
        case 8 /* I4 */:
            return pointer.readS32();
        case 9 /* U4 */:
            return pointer.readU32();
        case 3 /* Char */:
            return pointer.readU16();
        case 10 /* I8 */:
            return pointer.readS64();
        case 11 /* U8 */:
            return pointer.readU64();
        case 12 /* R4 */:
            return pointer.readFloat();
        case 13 /* R8 */:
            return pointer.readDouble();
        case 24 /* NativeInteger */:
        case 25 /* UnsignedNativeInteger */:
            return pointer.readPointer();
        case 15 /* Pointer */:
            return new Il2Cpp.Pointer(pointer.readPointer(), type.class.baseType);
        case 17 /* ValueType */:
            return new Il2Cpp.ValueType(pointer, type);
        case 28 /* Object */:
        case 18 /* Class */:
            return new Il2Cpp.Object(pointer.readPointer());
        case 21 /* GenericInstance */:
            return type.class.isValueType ? new Il2Cpp.ValueType(pointer, type) : new Il2Cpp.Object(pointer.readPointer());
        case 14 /* String */:
            return new Il2Cpp.String(pointer.readPointer());
        case 29 /* SingleDimensionalZeroLowerBoundArray */:
        case 20 /* Array */:
            return new Il2Cpp.Array(pointer.readPointer());
    }
    (0, console_1.raise)(`read: "${type.name}" (${type.typeEnum}) has not been handled yet. Please file an issue!`);
}
exports.read = read;
/** @internal */
function write(pointer, value, type) {
    switch (type.typeEnum) {
        case 2 /* Boolean */:
            return pointer.writeS8(+value);
        case 4 /* I1 */:
            return pointer.writeS8(value);
        case 5 /* U1 */:
            return pointer.writeU8(value);
        case 6 /* I2 */:
            return pointer.writeS16(value);
        case 7 /* U2 */:
            return pointer.writeU16(value);
        case 8 /* I4 */:
            return pointer.writeS32(value);
        case 9 /* U4 */:
            return pointer.writeU32(value);
        case 3 /* Char */:
            return pointer.writeU16(value);
        case 10 /* I8 */:
            return pointer.writeS64(value);
        case 11 /* U8 */:
            return pointer.writeU64(value);
        case 12 /* R4 */:
            return pointer.writeFloat(value);
        case 13 /* R8 */:
            return pointer.writeDouble(value);
        case 24 /* NativeInteger */:
        case 25 /* UnsignedNativeInteger */:
        case 15 /* Pointer */:
        case 17 /* ValueType */:
        case 14 /* String */:
        case 28 /* Object */:
        case 18 /* Class */:
        case 29 /* SingleDimensionalZeroLowerBoundArray */:
        case 20 /* Array */:
        case 21 /* GenericInstance */:
            if (value instanceof Il2Cpp.ValueType) {
                Memory.copy(pointer, value.handle, type.class.valueSize);
                return pointer;
            }
            return pointer.writePointer(value);
    }
    (0, console_1.raise)(`write: "${type.name}" (${type.typeEnum}) has not been handled yet. Please file an issue!`);
}
exports.write = write;
/** @internal */
function fromFridaValue(value, type) {
    if (Array.isArray(value)) {
        return arrayToValueType(type, value);
    }
    else if (value instanceof NativePointer) {
        if (type.isByReference) {
            return new Il2Cpp.Reference(value, type);
        }
        switch (type.typeEnum) {
            case 15 /* Pointer */:
                return new Il2Cpp.Pointer(value, type.class.baseType);
            case 14 /* String */:
                return new Il2Cpp.String(value);
            case 18 /* Class */:
            case 21 /* GenericInstance */:
            case 28 /* Object */:
                return new Il2Cpp.Object(value);
            case 29 /* SingleDimensionalZeroLowerBoundArray */:
            case 20 /* Array */:
                return new Il2Cpp.Array(value);
            default:
                return value;
        }
    }
    else if (type.typeEnum == 2 /* Boolean */) {
        return !!value;
    }
    else {
        return value;
    }
}
exports.fromFridaValue = fromFridaValue;
/** @internal */
function toFridaValue(value) {
    if (typeof value == "boolean") {
        return +value;
    }
    else if (value instanceof Il2Cpp.ValueType) {
        return valueTypeToArray(value);
    }
    else {
        return value;
    }
}
exports.toFridaValue = toFridaValue;
function valueTypeToArray(value) {
    const instanceFields = value.type.class.fields.filter(f => !f.isStatic);
    return instanceFields.length == 0
        ? [value.handle.readU8()]
        : instanceFields
            .map(field => field.withHolder(value).value)
            .map(value => value instanceof Il2Cpp.ValueType
            ? valueTypeToArray(value)
            : value instanceof native_struct_1.NativeStruct
                ? value.handle
                : typeof value == "boolean"
                    ? +value
                    : value);
}
function arrayToValueType(type, nativeValues) {
    function iter(type, startOffset = 0) {
        const arr = [];
        for (const field of type.class.fields) {
            if (!field.isStatic) {
                const offset = startOffset + field.offset - Il2Cpp.Runtime.objectHeaderSize;
                if (field.type.typeEnum == 17 /* ValueType */ ||
                    (field.type.typeEnum == 21 /* GenericInstance */ && field.type.class.isValueType)) {
                    arr.push(...iter(field.type, offset));
                }
                else {
                    arr.push([field.type.typeEnum, offset]);
                }
            }
        }
        if (arr.length == 0) {
            arr.push([5 /* U1 */, 0]);
        }
        return arr;
    }
    const valueType = Memory.alloc(type.class.valueSize);
    nativeValues = nativeValues.flat(Infinity);
    const typesAndOffsets = iter(type);
    for (let i = 0; i < nativeValues.length; i++) {
        const value = nativeValues[i];
        const [typeEnum, offset] = typesAndOffsets[i];
        const pointer = valueType.add(offset);
        switch (typeEnum) {
            case 2 /* Boolean */:
                pointer.writeS8(value);
                break;
            case 4 /* I1 */:
                pointer.writeS8(value);
                break;
            case 5 /* U1 */:
                pointer.writeU8(value);
                break;
            case 6 /* I2 */:
                pointer.writeS16(value);
                break;
            case 7 /* U2 */:
                pointer.writeU16(value);
                break;
            case 8 /* I4 */:
                pointer.writeS32(value);
                break;
            case 9 /* U4 */:
                pointer.writeU32(value);
                break;
            case 3 /* Char */:
                pointer.writeU16(value);
                break;
            case 10 /* I8 */:
                pointer.writeS64(value);
                break;
            case 11 /* U8 */:
                pointer.writeU64(value);
                break;
            case 12 /* R4 */:
                pointer.writeFloat(value);
                break;
            case 13 /* R8 */:
                pointer.writeDouble(value);
                break;
            case 24 /* NativeInteger */:
            case 25 /* UnsignedNativeInteger */:
            case 15 /* Pointer */:
            case 29 /* SingleDimensionalZeroLowerBoundArray */:
            case 20 /* Array */:
            case 14 /* String */:
            case 28 /* Object */:
            case 18 /* Class */:
            case 21 /* GenericInstance */:
                pointer.writePointer(value);
                break;
            default:
                (0, console_1.warn)(`arrayToValueType: defaulting ${typeEnum} to pointer`);
                pointer.writePointer(value);
                break;
        }
    }
    return new Il2Cpp.ValueType(valueType, type);
}

},{"../utils/console":38,"../utils/native-struct":39}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./il2cpp");

},{"./il2cpp":14}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inform = exports.ok = exports.warn = exports.raise = void 0;
/** @internal */
function raise(message) {
    throw `\x1B[0m\x1B[38;5;9mil2cpp\x1B[0m: ${message}`;
}
exports.raise = raise;
/** @internal */
function warn(message) {
    globalThis.console.log(`\x1B[38;5;11mil2cpp\x1B[0m: ${message}`);
}
exports.warn = warn;
/** @internal */
function ok(message) {
    globalThis.console.log(`\x1B[38;5;10mil2cpp\x1B[0m: ${message}`);
}
exports.ok = ok;
/** @internal */
function inform(message) {
    globalThis.console.log(`\x1B[38;5;12mil2cpp\x1B[0m: ${message}`);
}
exports.inform = inform;

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonNullNativeStruct = exports.NativeStruct = void 0;
/** Scaffold class. */
class NativeStruct {
    handle;
    constructor(handleOrWrapper) {
        if (handleOrWrapper instanceof NativePointer) {
            this.handle = handleOrWrapper;
        }
        else {
            this.handle = handleOrWrapper.handle;
        }
    }
    equals(other) {
        return this.handle.equals(other.handle);
    }
    isNull() {
        return this.handle.isNull();
    }
}
exports.NativeStruct = NativeStruct;
/** Scaffold class whom pointer cannot be null. */
class NonNullNativeStruct extends NativeStruct {
    constructor(handle) {
        super(handle);
        if (handle.isNull()) {
            throw new Error(`Handle for "${this.constructor.name}" cannot be NULL.`);
        }
    }
}
exports.NonNullNativeStruct = NonNullNativeStruct;

},{}],40:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forModule = void 0;
const decorator_cache_getter_1 = require("decorator-cache-getter");
const versioning_1 = __importDefault(require("versioning"));
class Target {
    stringEncoding;
    address;
    constructor(responsible, name, stringEncoding) {
        this.stringEncoding = stringEncoding;
        this.address = Module.findExportByName(responsible, name) ?? NULL;
    }
    static get targets() {
        function info() {
            switch (Process.platform) {
                case "linux":
                    try {
                        if (versioning_1.default.gte(Java.androidVersion, "12")) {
                            return [null, ["__loader_dlopen", "utf8"]];
                        }
                        else {
                            return ["libdl.so", ["dlopen", "utf8"], ["android_dlopen_ext", "utf8"]];
                        }
                    }
                    catch (e) {
                        return [null, ["dlopen", "utf8"]];
                    }
                case "darwin":
                    return ["libdyld.dylib", ["dlopen", "utf8"]];
                case "windows":
                    const ll = "LoadLibrary";
                    return ["kernel32.dll", [`${ll}W`, "utf16"], [`${ll}ExW`, "utf16"], [`${ll}A`, "ansi"], [`${ll}ExA`, "ansi"]];
            }
        }
        const [responsible, ...targets] = info();
        return targets.map(([name, encoding]) => new Target(responsible, name, encoding)).filter(target => !target.address.isNull());
    }
    readString(pointer) {
        switch (this.stringEncoding) {
            case "utf8":
                return pointer.readUtf8String();
            case "utf16":
                return pointer.readUtf16String();
            case "ansi":
                return pointer.readAnsiString();
        }
    }
}
__decorate([
    decorator_cache_getter_1.cache
], Target, "targets", null);
/** @internal */
function forModule(...moduleNames) {
    return new Promise(resolve => {
        for (const moduleName of moduleNames) {
            const module = Process.findModuleByName(moduleName);
            if (module != null) {
                resolve(moduleName);
                return;
            }
        }
        const interceptors = Target.targets.map(target => Interceptor.attach(target.address, {
            onEnter(args) {
                this.modulePath = target.readString(args[0]) ?? "";
            },
            onLeave(returnValue) {
                if (returnValue.isNull())
                    return;
                for (const moduleName of moduleNames) {
                    if (!this.modulePath.endsWith(moduleName))
                        continue;
                    setImmediate(() => interceptors.forEach(i => i.detach()));
                    resolve(moduleName);
                }
            }
        }));
    });
}
exports.forModule = forModule;

}).call(this)}).call(this,require("timers").setImmediate)

},{"decorator-cache-getter":9,"timers":43,"versioning":44}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levenshtein = exports.cacheInstances = exports.nativeIterator = void 0;
const fastest_levenshtein_1 = require("fastest-levenshtein");
const console_1 = require("./console");
/** @internal */
function* nativeIterator(holder, nativeFunction, Class) {
    const iterator = Memory.alloc(Process.pointerSize);
    let handle;
    while (!(handle = nativeFunction(holder, iterator)).isNull()) {
        yield new Class(handle);
    }
}
exports.nativeIterator = nativeIterator;
/** @internal */
function cacheInstances(Class) {
    const instanceCache = new Map();
    return new Proxy(Class, {
        construct(Target, argArray) {
            const handle = argArray[0].toUInt32();
            if (!instanceCache.has(handle)) {
                instanceCache.set(handle, new Target(argArray[0]));
            }
            return instanceCache.get(handle);
        }
    });
}
exports.cacheInstances = cacheInstances;
/** @internal */
function levenshtein(candidatesKey, nameGetter = e => e.name) {
    return function (_, propertyKey, descriptor) {
        const original = descriptor.value;
        descriptor.value = function (key, ...args) {
            const result = original.call(this, key, ...args);
            if (result != null)
                return result;
            const closestMatch = (0, fastest_levenshtein_1.closest)(key, this[candidatesKey].map(nameGetter));
            (0, console_1.raise)(`couldn't find ${propertyKey} ${key} in ${this.name}${closestMatch ? `, did you mean ${closestMatch}?` : ``}`);
        };
    };
}
exports.levenshtein = levenshtein;

},{"./console":38,"fastest-levenshtein":10}],42:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],43:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":42,"timers":43}],44:[function(require,module,exports){
/**
 * Semantic Version Number
 * @author 闲耘 <hotoo.cn@gmail.com>
 *
 * @usage
 *    var version = new Versioning("1.2.3")
 *    version > 1
 *    version.eq(1)
 */


// Semantic Versioning Delimiter.
var delimiter = ".";

var Version = function(version){
  this._version = String(version);
};

function compare(v1, v2, complete){
  v1 = String(v1);
  v2 = String(v2);
  if(v1 === v2){return 0;}
  var v1s = v1.split(delimiter);
  var v2s = v2.split(delimiter);
  var len = Math[complete ? "max" : "min"](v1s.length, v2s.length);
  for(var i=0; i<len; i++){
    v1s[i] = "undefined"===typeof v1s[i] ? 0 : parseInt(v1s[i], 10);
    v2s[i] = "undefined"===typeof v2s[i] ? 0 : parseInt(v2s[i], 10);
    if(v1s[i] > v2s[i]){return 1;}
    if(v1s[i] < v2s[i]){return -1;}
  }
  return 0;
}

Version.compare = function(v1, v2){
  return compare(v1, v2, true);
};

/**
 * @param {String} v1.
 * @param {String} v2.
 * @return {Boolean} true if v1 equals v2.
 *
 *    Version.eq("6.1", "6"); // true.
 *    Version.eq("6.1.2", "6.1"); // true.
 */
Version.eq = function(v1, v2, strict){
  return compare(v1, v2, strict) === 0;
};

/**
 * @param {String} v1.
 * @param {String} v2.
 * @return {Boolean} return true
 */
Version.gt = function(v1, v2){
  return compare(v1, v2, true) > 0;
};

Version.gte = function(v1, v2){
  return compare(v1, v2, true) >= 0;
};

Version.lt = function(v1, v2){
  return compare(v1, v2, true) < 0;
};

Version.lte = function(v1, v2){
  return compare(v1, v2, true) <= 0;
};

Version.prototype = {
  // new Version("6.1").eq(6); // true.
  // new Version("6.1.2").eq("6.1"); // true.
  eq: function(version){
    return Version.eq(this._version, version);
  },

  gt: function(version){
    return Version.gt(this._version, version);
  },

  gte: function(version){
    return Version.gte(this._version, version);
  },

  lt: function(version){
    return Version.lt(this._version, version);
  },

  lte: function(version){
    return Version.lte(this._version, version);
  },

  valueOf: function(){
    return parseFloat(
      this._version.split(delimiter).slice(0, 2).join(delimiter),
      10);
  },

  /**
   * XXX: ""+ver 调用的转型方法是 valueOf，而不是 toString，这个有点悲剧。
   * 只能使用 String(ver) 或 ver.toString() 方法。
   * @param {Number} precision, 返回的版本号精度。默认返回完整版本号。
   * @return {String}
   */
  toString: function(precision){
    return "undefined" === typeof precision ? this._version :
      this._version.split(delimiter).slice(0, precision).join(delimiter);
  }
};


module.exports = Version;

},{}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhZ2VudC9hbmRyb2lkL0NvbW1vblV0aWwudHMiLCJhZ2VudC9hbmRyb2lkL2h0dHBzL1dlYlZpZXdIb29rLnRzIiwiYWdlbnQvYW50aS9GcmlkYUFudGkudHMiLCJhZ2VudC9iYXNpYy9OYXRpdmVVdGlsLnRzIiwiYWdlbnQvZ2FtZS9Db2NvczJkeDNIb29rLnRzIiwiYWdlbnQvZ2FtZS9Db2NvczJkeGpzLnRzIiwiYWdlbnQvZ2FtZS91dGlsL0RlYnVnVXRpbC50cyIsImFnZW50L2luZGV4LnRzIiwibm9kZV9tb2R1bGVzL2RlY29yYXRvci1jYWNoZS1nZXR0ZXIvZGlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0ZXN0LWxldmVuc2h0ZWluL21vZC5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL2FwaS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9maWx0ZXJpbmcuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3J1bnRpbWUuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL2FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWlsMmNwcC1icmlkZ2UvZGlzdC9pbDJjcHAvc3RydWN0cy9hc3NlbWJseS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3N0cnVjdHMvY2xhc3MuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL2RvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3N0cnVjdHMvZmllbGQuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL2djLWhhbmRsZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3N0cnVjdHMvZ2MuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL2ltYWdlLmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWlsMmNwcC1icmlkZ2UvZGlzdC9pbDJjcHAvc3RydWN0cy9tZW1vcnktc25hcHNob3QuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL21ldGhvZC5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3N0cnVjdHMvb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWlsMmNwcC1icmlkZ2UvZGlzdC9pbDJjcHAvc3RydWN0cy9wYXJhbWV0ZXIuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL3BvaW50ZXIuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL3JlZmVyZW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3N0cnVjdHMvc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWlsMmNwcC1icmlkZ2UvZGlzdC9pbDJjcHAvc3RydWN0cy90aHJlYWQuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L2lsMmNwcC9zdHJ1Y3RzL3R5cGUtZW51bS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3N0cnVjdHMvdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3N0cnVjdHMvdmFsdWUtdHlwZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3RyYWNlci5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvaWwyY3BwL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWlsMmNwcC1icmlkZ2UvZGlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvdXRpbHMvY29uc29sZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvdXRpbHMvbmF0aXZlLXN0cnVjdC5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1pbDJjcHAtYnJpZGdlL2Rpc3QvdXRpbHMvbmF0aXZlLXdhaXQuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtaWwyY3BwLWJyaWRnZS9kaXN0L3V0aWxzL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3ZlcnNpb25pbmcvdmVyc2lvbmluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztBQ0FBLElBQWlCLFVBQVUsQ0FxQzFCO0FBckNELFdBQWlCLFVBQVU7SUFHdkIsU0FBZ0IsT0FBTyxDQUFDLEtBQVUsRUFBRSxNQUFjLEtBQUssQ0FBQyxNQUFNO1FBQzFELElBQUksR0FBRyxHQUFrQixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUs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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3B1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlHQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIn0=
