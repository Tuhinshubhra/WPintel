var DEBUG = true;

function wpintel_debug(msg) {
    if (DEBUG){
        console.log('%c[WPintel DEBUG]%c ' + msg, 'background: #222; color: #bada55', 'background: white; color: black');
    }
}