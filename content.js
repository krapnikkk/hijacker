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

injectCustomJs("hook.js").then((res)=>{});