import {DebugUtil} from "../../game/util/DebugUtil";

export namespace WebViewHook {
    export function start() {
        Java.perform(() => {
            setWebContentsDebuggingEnabledHook();
        });
    }

    export function setWebContentsDebuggingEnabledHook() {
        let WebView = Java.use("android.webkit.WebView")
        WebView.setWebContentsDebuggingEnabled.overload("boolean").implementation = function (enabled: boolean) {
            DebugUtil.LOGD("intercepted setWebContentsDebuggingEnabled...:" + enabled)
            this.setWebContentsDebuggingEnabled(true);
        }
    }

    export function setWebContentsDebuggingEnabledInvoke() {
        Java.perform(() => {
            Java.scheduleOnMainThread(() => {
                let WebView = Java.use("android.webkit.WebView");
                let setWebContentsDebuggingEnabledMethod = WebView.setWebContentsDebuggingEnabled.overload("boolean");
                setWebContentsDebuggingEnabledMethod.call(WebView, true);
            })
        })

    }

}