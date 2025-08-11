function updateClock() {
    let now = new Date();

    document.getElementById('time').textContent = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    document.getElementById('date').textContent = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
}

updateClock();
setInterval(updateClock, 1000);
// this is for animations believe it or not
document.querySelectorAll('#start-button, #search-bar, #taskbar-apps div').forEach(el => {
    el.addEventListener('mousedown', () => {
        el.classList.add('pressed');
        openApp(el);
    });
    el.addEventListener('mouseup',  () => {
        el.classList.remove('pressed');
        el.classList.add('released');
        setTimeout(function() {
            el.classList.remove('released');
        }, 100);
    });
});

function openApp(el, url=el.id) {
    // i cant believe this works properly honestly
    document.body.insertAdjacentHTML('afterbegin','<div id="'+el.id+'-app" class="window"><p>'+el.children[1].textContent+'</p><div class="window-buttons"><p class="max">◻</p><p class="close">X</p></div><iframe src="'+url+'"></iframe></div>');
    let elem = document.getElementById(el.id+'-app');
    elem.style.zIndex = document.querySelectorAll('.window').length;
    elem.addEventListener('mousedown', (e) => {
        let elemArea = elem.getBoundingClientRect();
        function handleMouseMove(cursor) {
            elem.style.top = cursor.y-(e.y-elemArea.top)+"px";
            elem.style.left = cursor.x-(e.x-elemArea.left)+"px";
        };
        function noMoreDrag() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', noMoreDrag);
            elem.lastChild.style.pointerEvents = 'all';
        };
        if (e.target == elem || e.target == elem.firstChild) {
            // i made this but i do not know how it works straight up
            // ugh it still misorders windows sometimes
            let allWindows = document.querySelectorAll('.window');
            if (elem.style.zIndex != allWindows.length) {
                elem.style.zIndex = allWindows.length;
                for (i = 0; i < allWindows.length; i++) {
                    if (allWindows[i] !== elem && allWindows[i].style.zIndex > 1) {
                        allWindows[i].style.zIndex -= 1;
                    }
                }
            }

            elem.lastChild.style.pointerEvents = 'none';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', noMoreDrag);
        }
    });
    document.querySelector('#'+elem.id+' .close').addEventListener('click', () => {
        elem.remove();
    });
    document.querySelector('#'+elem.id+' .max').addEventListener('click', () => {
        if (elem.getBoundingClientRect().left === 0 && elem.getBoundingClientRect().top === 0) {
            elem.style.left = null;
            elem.style.top = null;
            elem.style.width = null;
            elem.style.height = null;
            elem.style.borderRadius = null;
            elem.lastChild.style.borderRadius = null;
        } else {
            elem.style.left = 0;
            elem.style.top = 0;
            elem.style.width = document.body.getBoundingClientRect().width+'px';
            elem.style.height = document.body.getBoundingClientRect().height+'px';
            elem.style.borderRadius = '0';
            elem.lastChild.style.borderRadius = '0';
        }
    });
}

function createIcon(el, url) {
    let clicks = 0;
    let timeout;
    el.addEventListener('click', (mouse) => {
        clicks++;
        let oldclicks = clicks;
        timeout = setTimeout(function() {
            if (clicks === oldclicks) {
                clicks = 0;
            }
        }, 500);
        if (document.querySelectorAll('.selected').length < 1) {
            el.classList.add('selected');
        } else {
            document.querySelectorAll('.selected').forEach(el => {
                el.classList.remove('selected');
            });
            el.classList.add('selected');
        }
        if (clicks == 2) {
            clicks = 0;
            clearTimeout(timeout);
            switch(el.className.split(' ')[1]) {
                case 'web':
                    document.location.href = window.location.pathname.replace(/[^/]+$/,'')+el.id;
                    break;
                case 'app':
                    openApp(el, url);
                    break;
            }
        }
    });
}

document.querySelectorAll('.icon').forEach(el => {
    createIcon(el);
});

document.body.addEventListener('mousedown', (event) => {
    // i really hate this
    if (event.button == 0 || event.button == 2) {
        if (event.button == 2 && event.target.classList[0] == 'icon') return;
        let rmenu = false;
        document.querySelectorAll('#rclick p').forEach(el => {
            if (event.target == el) rmenu = true;
        })
        if (rmenu) return;
        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }

    function handleMouseMove(cursor) {
        // the original click point moves unsure why
        if (event.x < cursor.x) {
            box.style.width = cursor.x-event.x+"px";
        } else {
            box.style.left = cursor.x+"px";
            box.style.width = -1*(cursor.x)+event.x+"px";
        }
        if (event.y < cursor.y) {
            box.style.height = cursor.y-event.y+"px";
        } else {
            box.style.top = cursor.y+"px";
            box.style.height = -1*(cursor.y)+event.y+"px";
        }
        let boxArea = box.getBoundingClientRect();
        document.querySelectorAll('.icon').forEach(el => {
            let iconArea = el.getBoundingClientRect();
            let overlap = (boxArea.top <= iconArea.bottom && boxArea.bottom >= iconArea.top && boxArea.left <= iconArea.right && boxArea.right >= iconArea.left);
            if (overlap) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    };
    function noMoreBox() {
        box.remove();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', noMoreBox);
        document.querySelectorAll('iframe').forEach(el => {
            el.style.pointerEvents = 'all';
        });
    };
    if (event.button !== 1) {
        document.querySelectorAll('#rclick').forEach(el => {
            el.remove();
        });
    }
    if (event.target == document.body && event.button !== 1) {
        //creating the box every time is dumb
        document.body.insertAdjacentHTML('afterbegin', '<div id="box"></div>');
        let box = document.getElementById('box')
        box.style.left = event.x+"px";
        box.style.top = event.y+"px";
        document.querySelectorAll('iframe').forEach(el => {
            el.style.pointerEvents = 'none';
        });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', noMoreBox);
    }
});

document.body.addEventListener('mouseup', () => {
    // once again checking for a specific thing every time is dumb
    document.querySelectorAll('.pressed').forEach(el => {
        el.classList.remove('pressed');
        el.classList.add('released');
        setTimeout(function() {
            el.classList.remove('released');
        }, 100);
    });
})

document.oncontextmenu = function(e) {
    e.preventDefault();
    document.querySelectorAll('#rclick').forEach(el => {
        el.remove();
    });
    if (e.target.classList[0] == 'icon') {
        e.target.classList.add('selected');
    }
    let items = '<p>placeholder idk</p>';
    document.body.insertAdjacentHTML('afterbegin', '<div id="rclick">'+items+'</div>');
    let rclick = document.getElementById('rclick');
    if (document.querySelectorAll('.selected').length > 0) {
        rclick.insertAdjacentHTML('afterbegin', '<p id="destroy">Delete</p>');
        document.getElementById('destroy').addEventListener('click', () => {
            document.querySelectorAll('.selected').forEach(el => {
                el.remove();
            });
            rclick.remove();
        })
    }
    if (e.x+284 > document.body.getBoundingClientRect().width) {
        rclick.style.left = e.x-(e.x+284-document.body.getBoundingClientRect().width)+'px';
    } else {
        rclick.style.left = e.x+'px';
    }
    rclick.style.top = e.y+'px';
};

function fetch(url) {
let request = new XMLHttpRequest();
request.onreadystatechange = function () {
    if (this.readyState === 4) {
        if (this.status === 200) {
            document.body.className = 'ok';
            console.log(this.responseText);
        }
    }
};
request.open("GET", url, true);
request.send(null);
}

window.onmessage = function(e) {
    let split;
    try {
        split = e.data.split(' ');
    } catch {
        return;
    }
    if (split[0] == 'makeIcon') {
        let response;
        let image;
        let title;

        // Ensure split[1] has http(s)://
        let url = split[1];
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        // Extract domain from url
        let domainMatch = url.match(/^https?:\/\/([^\/]+)/i);
        let domain = domainMatch ? domainMatch[1] : url;

        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    response = this.responseText;

                    // Use domain for favicon
                    image = 'https://' + domain + '/favicon.ico';
                    
                    let match = response.match(/<title>([^<]*)<\/title>/i);
                    title = match ? match[1] : split[1];
                }  else {
                    response = false;
                    image = 'assets/noicon.png';
                    title = split[1];
                }
            }
        };
        request.open("GET", url, true);
        request.send(null);

        let checkRequest;
        checkRequest = setInterval(function() {
            if (response != undefined) {
                document.getElementById('icons').insertAdjacentHTML('beforeend', '<div class="icon app" id="'+domain.split('.')[0]+'"><img src="'+image+'"/><p>'+title+'</p></div>');
                createIcon(document.getElementById('icons').lastChild, url);
                clearInterval(checkRequest);
            }
        }), 5;
    }

};