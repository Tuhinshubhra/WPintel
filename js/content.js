function DOMtoString(document_root) {
    var html = '',
        node = document_root.firstChild;
    while (node) {
        switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            html += node.outerHTML;
            break;
        case Node.TEXT_NODE:
            html += node.nodeValue;
            break;
        case Node.CDATA_SECTION_NODE:
            html += '<![CDATA[' + node.nodeValue + ']]>';
            break;
        case Node.COMMENT_NODE:
            html += '<!--' + node.nodeValue + '-->';
            break;
        case Node.DOCUMENT_TYPE_NODE:
            // (X)HTML documents are identified by public identifiers
            html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
            break;
        }
        node = node.nextSibling;
    }
    return html;
}
window.onload=function(){
    var domain = window.location.hostname
    wpintel_debug("page load! domain: " + domain);
    var wpdetected = false;
    var srcNodeList = document.querySelectorAll('[src],[href]');
    for (var i = 0; i < srcNodeList.length; ++i) {
    var item = srcNodeList[i];
        if(item.getAttribute('src') !== null){
            var testel = item.getAttribute('src');
        }
        if(item.getAttribute('href') !== null){
            var testel = item.getAttribute('href');
        }
        var re = new RegExp('(http://|https://|)('+domain+'|/|)(.*?)wp-(content|include)')
        if (testel.match(re)){
            wpdetected = true;
            break;
        }
    }
    if (wpdetected === true)
    {
        wpintel_debug('WordPress Detected');
        window.iswp = 'yes';
        window.sourcecode = new XMLSerializer().serializeToString(document);
        window.targeturl = window.location.href;
        chrome.runtime.sendMessage({
            action: 'yes', 
            site_url: window.location.href, 
            site_html: new XMLSerializer().serializeToString(document), 
            //http_headers: headers
        });
    }
    else
    {
        wpintel_debug('WordPress NOT Detected');
        window.iswp = 'no';
        window.sourcecode = new XMLSerializer().serializeToString(document);
        window.targeturl = window.location.href;
	    chrome.runtime.sendMessage({
            action: 'no', 
            site_url: window.location.href, 
            site_html: new XMLSerializer().serializeToString(document), 
            //http_headers: headers
        });
    }

    
    
}
// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
    if ((msg.from === 'popup') && (msg.subject === 'sendDetails')) {
      wpintel_debug('Connection from popup.js');
      var responsep = [window.iswp, window.targeturl, window.sourcecode];
      response(responsep);
    }
  });