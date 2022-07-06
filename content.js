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

window.chrome.runtime.onMessage.addListener((message) => {
    console.log(message);
    var action = message.action;
    // Only answer to actions.
    if (!action) {
        return;
    }

    // We need to reload to inject the scripts.
    if (action === "pageAction") {
        if (!sessionStorage.getItem(spectorLoadedKey)) {
            sessionStorage.setItem(spectorLoadedKey, "true");
            // Delay for all frames.
            setTimeout(function () { window.location.reload(); }, 50);
            return;
        }
    }
})

document.addEventListener("DOMContentLoaded", function () {
    if (sessionStorage.getItem(spectorLoadedKey)) {
        injectCustomJs("hook.js").then((res) => { });

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
