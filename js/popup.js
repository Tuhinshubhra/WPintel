function wait(delay) {
    return new Promise(function(resolve) {
        setTimeout(resolve, delay);
    });
}

var port = chrome.extension.connect({
    name: "WPintel connection"
});

function setdetails(info){
    // wpintel_debug('Content from content.js: ' + info);
    window.detailstate = true;
    try {
        if (info[1].endsWith('/')){
            // strip '/' from url
            window.targeturl = info[1].replace(/.$/,"");
        } else {
            window.targeturl = info[1];
        }
        window.sourcecode = info[2];
        window.parsedsrc = new DOMParser().parseFromString(window.sourcecode, 'text/html');
        window.isWP = info[0];
        detectHome(window.sourcecode, window.targeturl, window.parsedsrc)
    } catch(err){
        wpintel_debug('Something wrong with what content.js sent: ' + err);
    }
    
}

function detectHome(source, url, parsed){
    // need to fix a way to fucking separate the shit -- what did i mean by this? even idk!
    // anyways let's get all hrefs and srcs from a and links
    var domain = url.split('//')[1].split('/')[0]
    var homeurl = '';
    var phrefs = [];
    
    var srcNodeList = parsed.querySelectorAll('[src],[href]');
    for (var i = 0; i < srcNodeList.length; ++i) {
    var item = srcNodeList[i];
        if(item.getAttribute('src') !== null){
            var testel = item.getAttribute('src');
        }
        if(item.getAttribute('href') !== null){
            var testel = item.getAttribute('href');
        }
        if (testel){
            phrefs.push(testel)
        } 
    }
    window.alllinks = phrefs;
    for (i=0; i < phrefs.length; i++){
        var href_to_test = phrefs[i];
        if (!href_to_test){
            wpintel_debug('Skipping null href');
        } else {
            if (href_to_test.match(/wp-(content|include)/)){
                var re = new RegExp('(http://|https://)' + domain + '(.*?)\/wp-(content|include)');
                try{
                    var homeurl = href_to_test.match(re)[1] + domain + href_to_test.match(re)[2]
                    wpintel_debug('Target Home from src: ' + homeurl);
                    break;
                } catch(err){
                    wpintel_debug('Error while matching href: ' + href_to_test)
                }
                
            } else if (url.match(/\?p=/)){
                var homeurl = url.match(/http(s|):\/\/(.*?)\/\?p=/)
                homeurl = 'http' + homeurl[1] + '://' + homeurl[2]
                wpintel_debug('Target Home from p: ' + homeurl);
                break;
            }
        }
    }
    
    if (homeurl !== '' && homeurl.match(domain)){
        window.url = url;
        window.targeturl = homeurl;
        return true;
    } else {
        var homeurl = url.match(/^(?:\w+\:\/\/)?([^\/]+)(.*)$/)[1]
        wpintel_debug('Target Home raw: ' + homeurl);
        window.url = url;
        window.targeturl = 'http://' + homeurl;
        return true;
    }
}

function getDetails(){
    // Communication with background.js
    port.postMessage('sendDetails');

    // Communication with content.js
    chrome.tabs.query({
        active: true,
        currentWindow: true
        }, function (tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {from: 'popup', subject: 'sendDetails'},
            setdetails);
        });
}
port.onMessage.addListener(function(msg) {
    if (msg[0] === 'details'){
        // assign details that we got from backgroud
        // msg = [details, tabID, url, isWP, Source code, Headers]
        wpintel_debug('got details form back');
        window.tabID = msg[1];
        if (window.isWP !== 'yes'){
            // if wordpress is detected via http headers
            wpintel_debug('setting isWP to ture by httph: ' + msg[3])
            window.isWP = msg[3];
        }
        window.http_headers = msg[5];
    }
});


document.addEventListener("DOMContentLoaded", function(event) {

    // Get all the information from background.js
    getDetails();
    setTimeout(main, 500);

    // okay let's begin
    function main(){
        if (typeof window.detailstate !== 'undefined'){
            // Set the target placeholder value
            if (window.targeturl !== undefined){
                document.getElementById('target').value = window.targeturl;
            } else {
                document.getElementById('target').value = "Reload or Enter Manually";
                show_reload();
                //var bgPage = chrome.extension.getBackgroundPage();
                //bgPage.activateIcon('0');
                /**chrome.runtime.sendMessage({
                    action: 'activateIcon', 
                    state: '0', 
                    //http_headers: headers
                });*/
                return false;
            }
            // Check WordPress
            if (window.isWP === 'yes'){
                wpintel_debug('WordPress installation detected');
                //var bgPage = chrome.extension.getBackgroundPage();
                //bgPage.activateIcon('1');
                /**chrome.runtime.sendMessage({
                    action: 'activateIcon', 
                    state: '1', 
                    //http_headers: headers
                });*/
                wordpress_fond();

                document.addEventListener('click', function(e){
                    if (e.target && e.target.id == 'path_scan'){
                        wpintel_debug('Path disclosure check');
                        check_path(window.targeturl);
                    }
                    else if (e.target && e.target.id == 'version_scan'){
                        wpintel_debug('clicked on start scan');
                        check_version(window.sourcecode, window.parsedsrc, window.targeturl);
                    }
                    else if (e.target && e.target.id == 'theme_scan'){
                        wpintel_debug('Themes and plugin check');
                        check_theme(window.alllinks, window.parsedsrc);
                    }
                    else if (e.target && e.target.id == 'reg_scan'){
                        wpintel_debug('User registration status check');
                        check_reg(window.targeturl);
                    }
                    else if (e.target && e.target.id == 'user_scan'){
                        wpintel_debug('Username Enumeration');
                        check_users(window.targeturl);
                    }
                })
            } else {
                /**chrome.runtime.sendMessage({
                    action: 'activateIcon', 
                    state: '0', 
                    //http_headers: headers
                });*/
                wpintel_debug('WordPress installation not detected');
                wordpress_not_found();
            }
        } else {
                /**chrome.runtime.sendMessage({
                    action: 'activateIcon', 
                    state: '0', 
                    //http_headers: headers
                });*/
            wpintel_debug('window.detailstate not set');
            show_error('<b>Oops!!!</b><br>Something went wrong.. try refreshing the page');
        }
    }


 
});
document.addEventListener('click',function(e){
    if(e.target && e.target.id== 'change_target'){
        wpintel_debug('Target Changed')
        var rurl = document.getElementById('target').value;
        if (rurl !== "" && rurl !== "Reload or Enter Manually"){
            port.postMessage("Redirect[to]" + rurl);
            window.close();
        }
    }
    else if(e.target && e.target.id== 'ret_menu'){
        wordpress_fond();
    }
    else if(e.target && e.target.id== 'donate_but'){
        donate();
    }
 })

 $(document).ready(function(){
    $('body').on('click', 'a', function(){
      chrome.tabs.create({url: $(this).attr('href')});
      return false;
    });
    document.querySelector('body').addEventListener('click', function(event) {
        if (event.target.id === 'relaod_but') {
            wpintel_debug('Pressed the reload button');
            chrome.tabs.reload(window.tabID);
            window.close();
        }
      });
 });

var _AnalyticsCode = 'UA-62536809-6';
const version = chrome.runtime.getManifest().version
var _gaq = _gaq || [];
_gaq.push(['_setAccount', _AnalyticsCode]);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();
function trackButtonClick(e) {
  _gaq.push(['_trackEvent', e.target.id, 'clicked', 'Ext version: ' + version]);
}
document.addEventListener('DOMContentLoaded', function () {
  var buttons = document.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', trackButtonClick);
  }
});