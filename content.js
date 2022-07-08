const spectorLoadedKey = "spectorLoadedKey";
const injectCustomJs = (jsPath) => {
    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('charset', 'utf-8');
        script.src = chrome.extension.getURL(jsPath);
        script.onload = () => {
            document.querySelector("html").removeChild(script);
            resolve();
        }
        script.onerror = (e) => {
            document.querySelector("html").removeChild(script);
            console.warn(e);
            reject(e);
        }
        document.querySelector("html").appendChild(script);
    })

}

window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    var action = message.action;
    if (action === "pageAction") {
        if (!sessionStorage.getItem(spectorLoadedKey)) {
            sessionStorage.setItem(spectorLoadedKey, "true");
            // Delay for all frames.
            setTimeout(function () { window.location.reload(); }, 50);
        }
    }
    sendResponse({ status: "ok" })
})

injectCustomJs("hook.js").then((res) => {
    console.log("inject script file success!")
});

document.addEventListener("DOMContentLoaded", function () {
    if (sessionStorage.getItem(spectorLoadedKey)) {
        sendMessage({ present: 2 }, function (response) {
            frameId = response.frameId;
        });
    } else {
        sendMessage({ present: 1 }, function (response) {
            frameId = response.frameId;
        });

    }
});

var uniqueId = new Date().getTime() + Math.abs(Math.random() * 1000000);
function sendMessage(message, cb) {
    message["uniqueId"] = uniqueId;
    window.chrome.runtime.sendMessage(message, function (response) {
        if (cb) {
            cb(response);
        }
    });
};
