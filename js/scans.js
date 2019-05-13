async function check_path(url){
    show_scanning('../images/gathering.svg', 'Looking for Path Disclosure..', '8');
    var rss_url = url + '/wp-includes/rss.php';
    fetch(rss_url).then((response) => {
        response.text().then((content) => {
            try {
                var path = content.match(/<b>\/(.*?)wp-includes\/rss.php<\/b/)[1];
                path = '/' + path;
                wpintel_debug('Path detected: ' + path);
                show_success(path);
                return true;
            } catch (err) {
                wpintel_debug('Error getting path: ' + err)
                show_error('path not detected!');
                return false;
            }
        }).catch(() => {
            show_error('path not detected!');
            wpintel_debug('response.text catch');
            return false;
        });
    }).catch(() => {
        show_error('path not detected!');
        wpintel_debug('fetch catch');
        return false;
    });
}

async function check_users(url){
    show_scanning('../images/users.svg', 'Acquiring Usernames...', '7');
    var json_url = url + '/wp-json/wp/v2/users';
    window.wordpress_users = [];
    
    fetch(json_url).then((response) => {
        response.text().then((content) => {
            if (/slug/.test(content)){
                var json_content = JSON.parse(content);
                for (var i=0; i < json_content.length; i++){
                    try {
                        var user = json_content[i]['slug'];
                        wpintel_debug('Enumerated username: ' + user);
                        user += '||' + json_content[i]['name']
                        window.wordpress_users.push(user);
                    } catch (err) {
                        wpintel_debug('Error getting user slug: ' + err);
                    }
                }
                if (window.wordpress_users.length > 0){
                    show_users(window.wordpress_users);
                    return true;
                } else {
                    show_error('No usernames could be enumerated!');
                    return false;
                }
            } else {
                wpintel_debug('no "slug" in json content');
                show_error('No usernames could be enumerated!');
                return false;
            }
        })
    }).catch((err) => {
        wpintel_debug('Something went wrong while getting json content: ' + err);
        show_error('No usernames could be enumerated!');
        return false;
    })
}

async function check_reg(url){
    show_scanning('../images/reg.svg', 'Probing User Registration...', '5');
    var reg_url = url + '/wp-login.php?action=register';
    wpintel_debug('Registration URL: ' + reg_url);
    var reg_source = await getregsrc(reg_url);

    async function getregsrc(url){
        fetch(url).then((response) => {
            response.text().then((source) => {
                wpintel_debug('got registration source');
                if (/<form/.test(source)){
                    if (/Registration confirmation will be emailed to you/.test(source) || /value="Register"/.test(source) || /id="user_email"/.test(source)){
                        var reg_ahref = '<a href="' + reg_url + '" class="reg_button">REGISTER HERE</a>'
                        show_success('User registration is <b>enabled</b> in this site.<br><br>' + reg_ahref);
                        return true;
                    } else {
                        show_error('User registration disabled!');
                        wpintel_debug('No valid registration element found');
                        return false;
                    }
                } else {
                    show_error('User registration disabled!');
                    return false;
                }
            });
        });
    }
}


async function check_theme(alllinks, parsed_source){
    show_scanning('../images/themes.svg', 'Getting Theme Information...', '2');
    var links = parsed_source.getElementsByTagName('link');
    window.wordpress_themes = [];
    window.wordpress_plugins = [];
    window.theme_detected = false;
    window.plugins_detected = false;
    var docheck = await check(alllinks);
    var result = await showResult();

    async function check(alllinks){
        for (var i = 0; i < alllinks.length; i++){
            var href = alllinks[i];
            wpintel_debug('Testing link: ' + href);
            if (/wp-content\/themes/.test(href)){
                try {
                    var theme = href.match(/wp-content\/themes\/(.*?)\//)[1];
                    // check if theme already detected
                    if (window.wordpress_themes.indexOf(theme) > -1){
                        // duplicate detected
                    } else {
                        window.wordpress_themes.push(theme);
                        wpintel_debug('Detected theme: ' + theme);
                        window.theme_detected = true;
                    }
                    
                    //show_success(String(window.wordpress_themes.length) + ' WordPress theme(s) detected');
                    //return true;
                } catch (err) {
                    wpintel_debug('Error: ' + err + ' while detecting theme from url: ' + href);
                    // show_error('WordPress theme could not be detected');
                }
            } else if (/wp-content\/plugins/.test(href)) {
                try {
                    var plugin = href.match(/wp-content\/plugins\/(.*?)\//)[1];
                    if (window.wordpress_plugins.indexOf(plugin) > -1){}else{
                        wpintel_debug('Detected plugin: ' + plugin);
                        window.wordpress_plugins.push(plugin);
                        window.plugins_detected = true;
                    }
                    
                } catch (err){
                    wpintel_debug('Error: ' + err + ' while detecting plugin from url: ' + href);
                }
            }
        }
    }
    
    async function showResult(){
        if (window.theme_detected || window.plugins_detected){
            show_themes_and_plugins(window.targeturl, window.wordpress_themes, window.wordpress_plugins);
        } else {
            show_error('WPintel could not detect any themes or plugins');
            return false;
        }
    }
}


function check_version(source_string, parsed_source, url){
    show_scanning('../images/version.svg', 'Getting WordPress Version...', '1');
    var var_detected = false;
    window.wordpress_version = '0';
    new Promise(function (resolve, reject){
        // the generator meta tag check
        wpintel_debug('checking version via generator meta tag');
        try {
            var generator_version = parsed_source.querySelector("meta[name='generator']").getAttribute("content");
            if (/WordPress/.test(generator_version)){
                var version = generator_version.match(/WordPress (.*)/)[1];
                window.wordpress_version = version;
                resolve(true);
            } else {
                wpintel_debug('version detection using generator failed');
                reject(true);
            }
        } catch(err) {
            wpintel_debug('error with generator meta tag: ' + err);
            reject(true);
        }
    }).then(() => {
        // version detected via generator meta tag
        check_vuln(window.wordpress_version)
        wpintel_debug('Version: ' + wordpress_version + ' detected via generator meta tag');
        return true;
    }).catch(() => {
        new Promise((resolve, reject) => {
           if (/wp-emoji-release\.min\.js\?ver/.test(source_string)){
               var version = source_string.match(/wp-emoji-release\.min\.js\?ver=(.*?)"/)[1];
               window.wordpress_version = version;
               resolve(true);
           } else {
               wpintel_debug('Version detection via wp-emoji failed!');
               reject(true);
           }
        }).then(() => {
            // version detected via generator meta tag
            check_vuln(window.wordpress_version)
            wpintel_debug('Version: ' + wordpress_version + ' detected via wp-emoji');
            return true;
        }).catch(() => {
            new Promise(function (resovle, reject){
                // feed version check
                wpintel_debug('triggered feed_version function: ' + url);
                var feed_url = url + '/feed/';
                fetch(feed_url).then(function (response){
                    response.text().then((source) => {
                        new Promise(function(resolve, reject){
                            try {
                                // wpintel_debug(source);
                                var version = source.match(/<generator>https:\/\/wordpress.org\/\?v=(.*?)<\/generator>/)[1];
                                window.wordpress_version = version;
                                wpintel_debug('feed: ' + version);
                                resolve(true);
                            } catch(err){
                                wpintel_debug('version detection via feeds failed: ' + err);
                                reject(true);
                            } 
                        }).then(() => {
                            // version detected via feed
                            check_vuln(window.wordpress_version)
                            wpintel_debug('Version: ' + wordpress_version + ' detected via /feed/');
                            return true;
                        }).catch(() => {reject(true)});     
                    });
                }).catch(() => {
                    // the fetch had some issues
                    wpintel_debug('fetch caught exception for feed');
                    reject(true);
                });
            }).then(() => {
                // version detected via feed
                //check_vuln(window.wordpress_version)
                //wpintel_debug('Version: ' + wordpress_version + ' detected via /feed/');
                return true;
            }).catch(() => {
                new Promise(function(resolve, reject){
                    // atom version check
                    wpintel_debug('triggered atom_version function: ' + url);
                    var atom_url = url + '/feed/atom';
                    fetch(atom_url).then(function(response){
                        response.text().then((source) => {
                            new Promise(function(resolve, reject){
                                try {
                                    var version = source.match(/version="(.*?)">WordPress/)[1];
                                    window.wordpress_version = version;
                                    wpintel_debug('atom: ' + version);
                                    resolve(true);
                                } catch(err) {
                                    wpintel_debug('Error detecting version via atom feed: ' + err);
                                    reject(true);
                                }
                            }).then(() => {
                                // version detection successful via atom
                                check_vuln(window.wordpress_version)
                                wpintel_debug('Version: ' + wordpress_version + ' detected via /feed/atom/');
                                return true;
                            }).catch(() => {reject(true)});;
                        });
                    }).catch(() => {
                        // catch for fetch for atom
                        wpintel_debug('fetch caught exception for atom');
                        reject(true);
                    });
                }).then(() => {
                    // version detection successful via atom
                    //check_vuln(window.wordpress_version)
                    //wpintel_debug('Version: ' + wordpress_version + ' detected via /feed/atom/');
                    return true;
                }).catch(() => {
                    new Promise(function(resolve, reject){
                        wpintel_debug('triggered opml_version function: ' + url);
                        var opml_url = url + '/wp-links-opml.php';
                        fetch(opml_url).then(function(response){
                            response.text().then((source) => {
                                new Promise(function(resolve, reject){
                                    try {
                                        var version = source.match(/generator="WordPress\/(.*?)"/)[1];
                                        window.wordpress_version = version;
                                        wpintel_debug('opml: ' + version);
                                        resolve(true);
                                    } catch(err) {
                                        wpintel_debug('Error detecting version from opml source: ' + err);
                                        reject(true);
                                    }
                                }).then(() => {
                                    check_vuln(window.wordpress_version)
                                    wpintel_debug('Version: ' + wordpress_version + ' detected via wp-links-opml.php');
                                    return true;
                                }).catch(() => {reject(true)});;
                            });
                        }).catch(() => {
                            // catch for fetch for opml
                            wpintel_debug('fetch caught exception for atom');
                            reject(true);
                        });
                    }).then(() => {
                        //check_vuln(window.wordpress_version)
                        //wpintel_debug('Version: ' + wordpress_version + ' detected via wp-links-opml.php');
                        return true;
                    }).catch(() => {
                        show_error('<b>Oops!!!</b><br>WordPress version could not be detected!');
                        return false;
                    });
                });
            });
        });
   });
}

function check_vuln(version){
    show_scanning('../images/crawl_vuln.svg', 'Checking for Version Vulnerabilities...', '4');
    var vuln_ver = version.split(".").join("");
    var vuln_url = 'https://wpvulndb.com/api/v2/wordpresses/' + vuln_ver;
    wpintel_debug('wpvuln url: ' + vuln_url);
    fetch(vuln_url).then((response) => {
        response.text().then((source) => {
            wpintel_debug('got version info from wpvulndb successfully');
            show_version(version, source);
        }).catch(() => {
            wpintel_debug('wpvulndb catch 1');
            show_version(version, false);
        })
    }).catch((err) => {
        wpintel_debug('wpvulndb catch 2: ' + err);
        show_version(version, false);
    })
}
