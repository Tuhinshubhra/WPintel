
function show_error(msg){
    var error_html = `
    <div id="error" class="error"">
        <div class="error_head">
          <img src="../images/error.svg" class="error_img">
          <span id="error_header" class="error_header">ERROR</span>
        </div>
        <div class="error_body" id="error_body">
          <span id="error_bodytxt" class="error_bodytxt">` + msg + `</span>
        </div>
    </div>
    `;
    wpintel_debug('triggered show_error function')
    document.getElementById('container').innerHTML = error_html;
}

function show_success(msg){
    var success_html = `
    <div id="success" class="success"">
        <div class="success_head">
            <img src="../images/success_img.svg" class="success_img">
            <span id="success_header" class="success_header">SUCCESS</span>
        </div>
        <div class="success_body" id="success_body">
            <span id="success_bodytxt" class="success_bodytxt">` + msg + `</span>
        </div>
    </div>
    `;
    wpintel_debug('triggered the show_success function');
    document.getElementById('container').innerHTML = success_html;
}

function show_scanning(simage, sname, sstage){
    //<h2>[Step ' + sstage + ' of 8]</h2>
    var prepared = '<div class="wp_check"><img class="wp_chk_stat" src="' + simage + '"><h1>' + sname + '</h1></div>';
    wpintel_debug('Scanning WP: ' + sname);
    document.getElementById('container').innerHTML = prepared;
}

function donate(){
    //Well stating the obvious fact here, building cool tools like this takes time and effort and a cup of tea helps it make better ;)
    wpintel_debug('triggered donate');
    var dhtml = `
    <div class="donate_div">
        <h2>DONATE!</h2>
        <h4>Who are we kidding here lol! people won't even bother clicking on the button but if you did and seriously want to help me out, my bitcoin address is bellow or contact me via twitter for alternate methods!</h4>
        <img src="../images/qr.png"><br>
        Bitcoin Address: <b>14GpkQAEwgfnpLat2exTe8XhogHnf5NSGr</b>
    </div>
    `
    document.getElementById('container').innerHTML = dhtml;
}

function wordpress_not_found(){
    var cnt = `
    <div class="wpnf">
    <center>
    <img src="../images/wordpress_fail.svg" style="width: 156px; filter: drop-shadow(3px 4px 1px #ff3b00)">
    </center>
    <div class="inline_error">Couldn't detect any WordPress installation on this website!</div>
    </div>
    `
    document.getElementById('container').innerHTML = cnt;
}

function wordpress_fond(){
    var asdf = `
    <div id="wordpress_found"">
        <div style="text-align: center;">
            <div class="wordpress_found">
                <!-- <img class="wp_found_img" src="../images/wordpress_success.svg"> --!>
                <h1 class="wp_found_h1">WordPress Detected!</h1>
            </div>
            <button id="version_scan" class="reg_scan">Version & Vulnerabilities</button>
            <button id="theme_scan" class="reg_scan">Themes & Plugins Information</button>
            <button id="user_scan" class="reg_scan">Enumerate Usernames</button>
            <button id="reg_scan" class="reg_scan">Check for User Registration</button>
            <!-- <button id="dir_scan" class="reg_scan">Check for Open Directories</button> !-->
            <button id="path_scan" class="reg_scan">Check for Path Disclosure</button>
        </div>
    </div>
    `;
    document.getElementById('ret_menu').style.display = 'block';
    document.getElementById('container').innerHTML = asdf;
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', trackButtonClick);
    }
}

function show_theme_info(themes_array, plugins_array){
    // write something
}

function show_version_info(version){
    var htmltowrite = `
    <div class="version_info">
        <div class="version_header">VERSION INFORMATION</div>
        <div class="current_version"></div>
        <div class="latest_version"></div>
    </div>
    `
}

function show_themes_and_plugins(url, themes, plugins){
    var theme_count = themes.length;
    var plugin_count = plugins.length;
    var contents = `
    <div class="tp_head">
        <div class="tp_theme">Themes: <span class="theme_count" id="theme_count">` + theme_count + `</span></div>
        <div class="tp_plugin">Plugins: <span class="plugin_count" id="plugin_count">` + plugin_count + `</span></div>
    </div>
    `
    if (themes.length > 0){
        var themes_table = `
        <table class="themes_table">
            <tr>
                <th>Theme</th>
                <th>Link</th>
            </tr>
        `
        for (var i = 0; i < themes.length; i++){
            var theme = themes[i];
            var theme_url = '<a href="' + url + '/wp-content/themes/' + theme + '">' + theme + "</a>";
            themes_table += `
            <tr>
                <td>` + theme + `</td>
                <td>` + theme_url + `</td>
            </tr>`
        }
        themes_table += '</table>'
        contents += themes_table

    } else {
        contents += '<div class="inline_error">No Themes detected</div>'
    }

    if (plugins.length > 0) {
        var plugins_table = `
        <table class="plugins_table">
            <tr>
                <th>plugin</th>
                <th>Link</th>
            </tr>
        `
        for (var i = 0; i < plugins.length; i++){
            var plugin = plugins[i];
            var plugin_url = '<a href="' + url + '/wp-content/plugins/' + plugin + '">' + plugin + "</a>";
            plugins_table += `
            <tr>
                <td>` + plugin + `</td>
                <td>` + plugin_url + `</td>
            </tr>`
        }
        plugins_table += '</table>'
        contents += plugins_table
    } else {
        contents += '<div class="inline_error">No Plugins detected</div>'
    }

    document.getElementById('container').innerHTML = contents;
}

function show_users(userarray){
    var contents = '<div class="users_detected">Usernames Enumerated: ' + userarray.length + '</div>';
    contents += `
    <table class="plugins_table">
        <tr>
            <th>Display Name</th>
            <th>Username</th>
        </tr>
    `
    for (var i=0; i < userarray.length; i++){
        if (userarray[i] !== '||'){
            var slug = userarray[i].split('||')[0]
            var display = userarray[i].split('||')[1]
            contents += `
            <tr>
                <td>` + display + `</td>
                <td>` + slug + `</td>
            </tr>
            `
        }
    }

    contents += '</table>'
    document.getElementById('container').innerHTML = contents;
}

function show_version(version, vulns){
    var lurl = 'https://api.wordpress.org/core/version-check/1.7/';
    wpintel_debug(version);
    fetch(lurl).then((response) => {
        response.text().then((source) => {
            var jsons = JSON.parse(source);
            var latest_version = jsons['offers'][0]['version'];
            var content = `
            <div class="wp_ver_info">
                <div class="cur_ver">Version : ` + version + `</div>
            `
            if (version === latest_version){
                content += '<div class="latest_ver ver_badge">✔ Latest</div>';
            } else {
                content += '<div class="outdated_ver ver_badge">✖ Outdated</div>';
            }

            if (!vulns || vulns === ""){
                content += '<div class="latest_ver ver_badge">ERR</div><br><br><div class="inline_error">There was an error while getting version vulnerabilities!</div>';
            } else {
                vulns = JSON.parse(vulns);
                var wpvulns = vulns[version]['vulnerabilities'];
                if (wpvulns.length > 0){
                    var vulncount = wpvulns.length;
                    content += '<div class="outdated_ver ver_badge">' + vulncount + ' vulns</div>';
                    content += `
                    </div>
                    <table class="plugins_table">
                        <tr>
                            <th>Vulnerability</th>
                            <th>Reference URL</th>
                        </tr>
                    `;
                    for (var i=0; i < vulncount; i++){
                        var title = wpvulns[i]['title']
                        var rurl = '<a href="' + wpvulns[i]['references']['url'] + '">Link</a>';
                        content += `
                        <tr>
                            <td>` + title + `</td>
                            <td>` + rurl + `</td>
                        </tr>       
                        `
                    }
                    content += '</table>'
                } else {
                    content += '<div class="latest_ver ver_badge">0 Vulns</div><br><br><div class="inline_error">This version of WordPress has no public vulnerabilities!</div>';
                }
                
            }
            document.getElementById('container').innerHTML = content;
        });
    });
}

function show_reload(){
    var content = `
    <div class="reload_div">
        <img src="../images/broken-heart.svg" class="broken-heart">
        <h1 style="margin-top: 0px;">Oops!</h1>
        <h4>Something has gone wrong, please reload the page to fix it!</h4>
        <button class="reload_but" id="relaod_but"><img src="../images/refresh.png" class="reload_img"> Reload</button>
    </div>
    `
    document.getElementById('container').innerHTML = content;
}