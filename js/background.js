chrome.tabs.onUpdated.addListener(function(id, info, tab){
    if (info.status == 'complete' && tab.active) {
        tabUpdated(tab);
      } 
});

chrome.tabs.onActivated.addListener(function(id, info, tab){
    chrome.tabs.query({ currentWindow: true, active: true },
        function (tabArray) {
            if(tabArray[0]){
                tabUpdated(tabArray[0]);
            }
        });
});

function tabUpdated(tab){
    if (!tab) return;
    wpintel_debug('tabUpdated: ' + tab.id);
    window.curtabid = tab.id;
    chrome.pageAction.show(tab.id,
        _=>{
        let e = chrome.runtime.lastError;
        if(e !== undefined){
          wpintel_debug('lastError: ' + tab.id, _, e);
        }
      });
    chrome.webRequest.onHeadersReceived.addListener(
        function(details) {
          var hhs = details.responseHeaders;
          var headers_array = '';
          for (index = 0; index < hhs.length; index++) { 
            var name = hhs[index]['name'];
            var value = hhs[index]['value'];
            var ta = name + "[wival]" + value + "[winew]";
            headers_array += ta;
            // wpintel_debug(ta)
          }
          // wpintel_debug(headers_array);
          window.http_headers = headers_array;
        },
        {urls: ['https://*/*', 'http://*/*'], types: ["main_frame"], tabId: tab.id},
        ['responseHeaders']);
}

function activateIcon(typ, thetab){
    if (!window.curtabid) return;
    wpintel_debug('Triggered activateIcon with type: ' + typ + ' tabid: ' + thetab);
    if (typ == '1'){
        chrome.pageAction.setIcon({
            tabId: thetab,
            path: "../images/active.png"
        });
        chrome.pageAction.setTitle({
            tabId: thetab,
            title: "WordPress Detected! You can now scan the site."
        });
        return;
    }

    chrome.pageAction.setIcon({
        tabId: thetab,
        path: "../images/error.png"
    });
    chrome.pageAction.setTitle({
        tabId: thetab,
        title: "The site doesn't run on WordPress or so does my scan say!"
    });
}

chrome.runtime.onMessage.addListener (
    function (msg, sender, sendResponse) {
        wpintel_debug('Got response from content.js');
        // preparing the variables
        window.sourcecode = msg.site_html;
        window.targeturl = msg.site_url;
        window.iswp = msg.action;
        var senderid = sender.tab.id;
        //window.headers = msg.http_headers;
        wpintel_debug('runtime onmsg sender: ' + sender);
        switch (msg.action)
        {
            case 'yes':
                wpintel_debug('case okay');
				activateIcon('1', senderid);
				return true;
				break;
            case 'no':
                // WordPress check failed via source code let's try with headers
                if (/wp-json/.test(window.http_headers)){
                    window.iswp = 'yes';
                    activateIcon('1', senderid);
                }
                activateIcon('0', senderid)             
                return true;
                break;
            case 'activateIcon':
                // change pageaction icon
                wpintel_debug('activateIcon from popup with id: ' + senderid);
                var icstate = msg.state;
                activateIcon(icstate, senderid);
            default:
                break;
        }
    }
);

chrome.extension.onConnect.addListener(function(port) {
    wpintel_debug("Connection established with popup.js");
    port.onMessage.addListener(function(msg) {
        if (msg == 'sendDetails'){
            var details = ['details', window.curtabid, window.targeturl, window.iswp, window.sourcecode, window.http_headers] // tabID, url, isWP, Source code, Headers
            port.postMessage(details);
        }
        else if(/Redirect/.test(msg)){
            wpintel_debug('redirect block 1 reached');
            var rurl = msg.split('[to]')[1];
            if (/http/.test(rurl) === false){
                rurl = 'http://' + rurl;
            }
            if (rurl != ""){
                wpintel_debug('redirect block 2 reached');
                chrome.tabs.update(
                    {url : rurl}
                )
            }
        }
        else if(msg === 'reloadpage'){
            wpintel_debug('reloading...');
            chrome.tabs.getSelected(null, function(tab) {
                var code = 'window.location.reload();';
                chrome.tabs.executeScript(tab.id, {code: code});
              });
        }
    });
});
