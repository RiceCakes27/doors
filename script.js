function updateClock() {
    let now = new Date();

    document.getElementById('time').textContent = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    document.getElementById('date').textContent = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
}
//start clock then start updating it every second
updateClock();
setInterval(updateClock, 1000);

//handles animations and function for all buttons in taskbar
document.querySelectorAll('#start-button, #search-bar, #taskbar-apps div').forEach(el => {
    el.addEventListener('mousedown', () => {
        el.classList.add('pressed');
        switch(el.className.split(' ')[1]) {
            case 'app':
                openApp(el);
                break;
            case 'popup':
                //insert something here
                break;
        }
    });
    el.addEventListener('mouseup',  () => {
        el.classList.remove('pressed');
        el.classList.add('released');
        setTimeout(function() {
            el.classList.remove('released');
        }, 100);
    });
});
//call to create new app window adds html to body and starts all need listeners
function openApp(el, url=el.id) {
    document.body.insertAdjacentHTML('afterbegin','<div id="'+el.id+'-app" class="window"><p>'+el.children[1].textContent+'</p><div class="window-buttons"><p class="max">◻</p><p class="close">X</p></div><iframe src="'+url+'"></iframe></div>');
    let elem = document.getElementById(el.id+'-app');
    elem.style.zIndex = document.querySelectorAll('.window').length;
    elem.addEventListener('mousedown', (e) => {
        let elemArea = elem.getBoundingClientRect();
        //window dragging
        function handleMouseMove(cursor) {
            elem.style.top = cursor.y-(e.y-elemArea.top)+"px";
            elem.style.left = cursor.x-(e.x-elemArea.left)+"px";
        };
        function noMoreDrag() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', noMoreDrag);
            elem.lastChild.style.pointerEvents = 'all';
        };
        //window zIndex ordering
        if (e.target == elem || e.target == elem.firstChild) {
            // ugh this still misorders windows sometimes no clue how to fix
            let allWindows = document.querySelectorAll('.window');
            if (elem.style.zIndex != allWindows.length) {
                elem.style.zIndex = allWindows.length;
                for (i = 0; i < allWindows.length; i++) {
                    if (allWindows[i] !== elem && allWindows[i].style.zIndex > 1) {
                        allWindows[i].style.zIndex -= 1;
                    }
                }
            }

            if (elem.classList.contains('fullscreen')) {
                elem.classList.remove('fullscreen');
                //TO DO: make window return to non full screen size
            }
            if (document.querySelectorAll('.fullscreen').length < 1 && document.getElementById('taskbar').classList.contains('acrylic')) {
                document.getElementById('taskbar').classList.remove('acrylic');
            }
            //disable pointers events so dragging works better
            elem.lastChild.style.pointerEvents = 'none';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', noMoreDrag);
        }
    });
    //handlers for buttons on app windows
    document.querySelector('#'+elem.id+' .close').addEventListener('click', () => {
        elem.remove(); //close window
        if (document.querySelectorAll('.fullscreen').length < 1 && document.getElementById('taskbar').classList.contains('acrylic')) {
            document.getElementById('taskbar').classList.remove('acrylic');
        }
    });
    document.querySelector('#'+elem.id+' .max').addEventListener('click', () => {
        if (elem.classList.contains('fullscreen')) {
            elem.classList.remove('fullscreen');
            if (document.querySelectorAll('.fullscreen').length < 1 && document.getElementById('taskbar').classList.contains('acrylic')) {
                document.getElementById('taskbar').classList.remove('acrylic');
            }
            elem.style.left = null;
            elem.style.top = null;
            elem.style.width = null;
            elem.style.height = null;
        } else {
            elem.classList.add('fullscreen');
            document.getElementById('taskbar').classList.add('acrylic');
            elem.style.left = 0;
            elem.style.top = 0;
            elem.style.width = document.body.getBoundingClientRect().width+'px';
            elem.style.height = document.body.getBoundingClientRect().height+'px';
        }
    });
}
//handler for desktop icons, double click to open & selection
function createIcon(el, url) {
    let clicks = 0;
    let timeout;
    el.addEventListener('click', () => {
        clicks++;
        let oldclicks = clicks;
        timeout = setTimeout(function() {
            if (clicks === oldclicks) {
                clicks = 0;
            }
        }, 500);
        //if no icons selected, select icon otherwise remove selected icons and make selected
        if (document.querySelectorAll('.selected').length < 1) {
            el.classList.add('selected');
        } else {
            document.querySelectorAll('.selected').forEach(el => {
                el.classList.remove('selected');
            });
            el.classList.add('selected');
        }
        //if double click reset timer so double click is required every time to open app
        if (clicks == 2) {
            clicks = 0;
            clearTimeout(timeout);
            switch(el.className.split(' ')[1]) {
                case 'web':
                    //sets location to current doamin + /the id
                    document.location.href = window.location.pathname.replace(/[^/]+$/,'')+el.id;
                    break;
                case 'app':
                    openApp(el, url);
                    break;
            }
        }
    });
}
//add listeners to initial icons
document.querySelectorAll('.icon').forEach(el => {
    createIcon(el);
});

document.body.addEventListener('mousedown', (event) => {
    //this deals with certain exceptions in regards to right clicking and i really hate it
    //if left or right click (no middle)
    if (event.button == 0 || event.button == 2) {
        //if right clicking on icon prevent it from being deselected
        if (event.button == 2 && event.target.classList[0] == 'icon') return;
        //if the click point was on the text of the right click menu return to prevent deselection
        let isRmenu = false;
        document.querySelectorAll('#rclick p').forEach(el => {
            if (event.target == el) isRmenu = true;
        })
        if (isRmenu) return;

        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }
    //drag selection handler
    function handleMouseMove(cursor) {
        // the original click point moves unsure why, would love to fix if i knew how
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
        // if icons under selection box select them
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
    //if click was not middle mouse remove right click menu
    if (event.button !== 1) {
        document.querySelectorAll('#rclick').forEach(el => {
            el.remove();
        });
    }
    //if click was on body and not middle mouse
    if (event.target == document.body && event.button !== 1) {
        //creating the box every time is dumb, would love to fix if i knew how
        document.body.insertAdjacentHTML('afterbegin', '<div id="box"></div>');
        let box = document.getElementById('box')
        box.style.left = event.x+"px";
        box.style.top = event.y+"px";
        //disable ifames to prevent issues
        document.querySelectorAll('iframe').forEach(el => {
            el.style.pointerEvents = 'none';
        });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', noMoreBox);
    }
});

document.body.addEventListener('mouseup', () => {
    //prevent taslbar icons from staying pressed after user lets go
    document.querySelectorAll('.pressed').forEach(el => {
        el.classList.remove('pressed');
        el.classList.add('released');
        setTimeout(function() {
            el.classList.remove('released');
        }, 100);
    });
})
//right click menu handler
document.oncontextmenu = function(e) {
    //stop normal menu
    e.preventDefault();
    //prevent two right click menus at a time
    document.querySelectorAll('#rclick').forEach(el => {
        el.remove();
    });
    //if right clicking an icon select it
    if (e.target.classList[0] == 'icon') {
        e.target.classList.add('selected');
    }
    let items = '<p>placeholder idk</p>';
    document.body.insertAdjacentHTML('afterbegin', '<div id="rclick">'+items+'</div>');
    let rclick = document.getElementById('rclick');
    //if icons are selected add more options to right click menu
    if (document.querySelectorAll('.selected').length > 0) {
        rclick.insertAdjacentHTML('afterbegin', '<p id="destroy">Delete</p>');
        document.getElementById('destroy').addEventListener('click', () => {
            document.querySelectorAll('.selected').forEach(el => {
                el.remove();
            });
            rclick.remove();
        })
    }
    //prevent right click menu from going off the right of the screen
    if (e.x+284 > document.body.getBoundingClientRect().width) {
        rclick.style.left = e.x-(e.x+284-document.body.getBoundingClientRect().width)+'px';
    } else {
        rclick.style.left = e.x+'px';
    }
    //i will add code to prevent it going off the bottom as well at some point
    rclick.style.top = e.y+'px';
};
//handles commands received from iframes
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

        //make sure split[1] has http(s)://
        let url = split[1];
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        //get domain from url
        let domainMatch = url.match(/^https?:\/\/([^\/]+)/i);
        let domain = domainMatch ? domainMatch[1] : url;

        //see if site allows connections
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    response = this.responseText;

                    //get icon from domain
                    image = 'https://' + domain + '/favicon.ico';

                    //get title from html
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
        //keep checking if there is a resonse from the site every 5 milliseconds 
        checkRequest = setInterval(function() {
            if (response != undefined) {
                document.getElementById('icons').insertAdjacentHTML('beforeend', '<div class="icon app" id="'+domain.split('.')[0]+'"><img src="'+image+'"/><p>'+title+'</p></div>');
                createIcon(document.getElementById('icons').lastChild, url);
                clearInterval(checkRequest);
            }
        }), 5;
    }
};