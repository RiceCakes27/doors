const desktop = document.getElementById('desktop');
const icons = document.getElementById('icons');
const taskbar = document.getElementById('taskbar');

let tempClipboard = [];
let cut = false;

function updateClock() {
    let now = new Date();

    document.getElementById('time').textContent = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    document.getElementById('date').textContent = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
}
//start clock then start updating it every second
updateClock();
setInterval(updateClock, 1000);

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("UIStorage", 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore("styles");
            db.createObjectStore("classes");
            db.createObjectStore("elements");
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

//restore saved stuff
async function restoreStyles() {
    const db = await openDB();

    // Restore styles
    await new Promise(resolve => {
        const tx = db.transaction("styles", "readonly");
        tx.objectStore("styles").openCursor().onsuccess = e => {
            const cursor = e.target.result;
            if (!cursor) return resolve();

            const el = document.querySelector(cursor.key);
            if (el) el.setAttribute("style", cursor.value);
            cursor.continue();
        };
    });

    // Restore classes
    await new Promise(resolve => {
        const tx = db.transaction("classes", "readonly");
        tx.objectStore("classes").openCursor().onsuccess = e => {
            const cursor = e.target.result;
            if (!cursor) return resolve();

            const el = document.querySelector(cursor.key);
            if (el) el.className = cursor.value;
            cursor.continue();
        };
    });

    // Restore user-created elements
    await new Promise(resolve => {
        const tx = db.transaction("elements", "readonly");
        tx.objectStore("elements").openCursor().onsuccess = e => {
            const cursor = e.target.result;
            if (!cursor) return resolve();

            const { parentPath, index, outerHTML } = cursor.value;
            const parent = document.querySelector(parentPath) || document.body;

            const temp = document.createElement("div");
            temp.innerHTML = outerHTML.trim();
            const newEl = temp.firstElementChild;

            const reference = parent.children[index] || null;
            parent.insertBefore(newEl, reference);

            cursor.continue();
        };
    });
};

function getElementPath(el) {
    if (el === document.body) return 'body';

    let path = '';
    while (el && el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) selector += `#${el.id}`;
        path = selector + (path ? ' > ' + path : '');
        el = el.parentNode;
    }
    return 'body > ' + path;
}

//TODO: fix window zIndex ordering
//window zIndex ordering
function setTopWindow(elem) {
    if (elem.classList.contains('minimized')) elem.classList.remove('minimized');
    let allWindows = document.querySelectorAll('.window');
    if (elem.style.zIndex != allWindows.length) {
        elem.style.zIndex = allWindows.length;
        for (let i = 0; i < allWindows.length; i++) {
            if (allWindows[i] !== elem && allWindows[i].style.zIndex > 1) {
                allWindows[i].style.zIndex -= 1;
            }
        }
    }
}

//handles animations and function for taskbar buttons
function createTaskbarButton(el) {
    el.addEventListener('mousedown', () => {
        el.classList.add('pressed');
    });
    switch(el.className.split(' ')[1]) {
        case 'app':
            el.addEventListener('mousedown', () => {
                document.querySelectorAll('.taskbar-icon.active').forEach((icon) => {
                    if (icon !== el) {
                        icon.classList.remove('active');
                    } 
                });
            });
            el.addEventListener('mouseup', (event) => {
                const app = document.getElementById(el.id+'-app');
                //if left or middle click and there is no app open, open app
                if ((event.button === 0 || event.button === 1) && app == null) {
                    openApp(el);
                //if left click and one app open
                } else if (event.button === 0 && document.querySelectorAll('#'+el.id+'-app').length == 1){
                    //reset animation
                    el.classList.remove('maximize', 'minimize');
                    //if app is visible and focused, hide and play minimize animation
                    if (!app.classList.contains('minimized') && el.classList.contains('active')) {
                        el.classList.remove('active');
                        el.classList.add('minimize');
                        app.classList.add('minimized');
                        if (document.querySelectorAll('.fullscreen.minimized').length == document.querySelectorAll('.fullscreen').length) taskbar.classList.remove('acrylic');
                    //if app not visible, show and play maximize animation
                    } else if (app.classList.contains('minimized')) {
                        el.classList.add('active', 'maximize');
                        app.classList.remove('minimized');
                        setTopWindow(app);
                        if (document.querySelectorAll('.fullscreen.minimized').length < document.querySelectorAll('.fullscreen').length) taskbar.classList.add('acrylic');
                    //if app visible but app not focused, "focus" app
                    } else if (!app.classList.contains('minimized')) {
                        el.classList.add('active');
                        setTopWindow(app);
                    }
                //if left click and more than one window open
                } else if (event.button === 0 && document.querySelectorAll('#'+el.id+'-app').length > 1) {
                    //TODO: make a menu for when theres multiple windows
                    console.log('there should be a window so you can select which window to open right now but alas there is not');
                //middle click always opens window
                } else if (event.button === 1) {
                    openApp(el);
                }
            });
        break;
        case 'popup':
            el.addEventListener('mouseup', (event) => {
                if (event.button === 0) {
                    let openMenu = true;
                    document.querySelectorAll('.menu').forEach(menu => {
                        if ((event.target.parentElement.id == 'taskbar-icons' && menu.classList.contains('right')) || (event.target.parentElement.id == 'taskbar' && menu.classList.contains('left'))) {
                            taskbar.classList.add('faketransparency');
                            menu.classList.add('close');
                            setTimeout(() => {
                                menu.remove();
                                taskbar.classList.remove('faketransparency');
                            }, 150);
                            document.getElementById(menu.id.split('-')[0]+'-button').classList.remove('active');
                        }

                        if (menu.id.split('-')[0] == el.id.split('-')[0]) {
                            openMenu = false;
                        }
                    });
                    if (openMenu) {
                        taskbar.classList.add('faketransparency');
                        el.classList.add('active');
                        if (el.parentElement.id == 'taskbar') {
                            document.body.insertAdjacentHTML('afterbegin', '<div id="'+el.id.split('-')[0]+'-menu" class="menu left acrylic"><div class="search-bar"><svg id="search-icon"fill="white"height="15px"width="15px"viewBox="0 0 490.4 490.4" xml:space="preserve"><g><path d="M484.1,454.796l-110.5-110.6c29.8-36.3,47.6-82.8,47.6-133.4c0-116.3-94.3-210.6-210.6-210.6S0,94.496,0,210.796s94.3,210.6,210.6,210.6c50.8,0,97.4-18,133.8-48l110.5,110.5c12.9,11.8,25,4.2,29.2,0C492.5,475.596,492.5,463.096,484.1,454.796zM41.1,210.796c0-93.6,75.9-169.5,169.5-169.5s169.6,75.9,169.6,169.5s-75.9,169.5-169.5,169.5S41.1,304.396,41.1,210.796z"/></g></svg><input/></div></div>');
                            let menu = document.getElementById(el.id.split('-')[0]+'-menu');
                            menu.firstChild.children[1].focus();
                            switch(el.id) {
                                case 'start-button':
                                    menu.firstChild.children[1].placeholder = 'Search for apps, settings, and documents';
                                    menu.firstChild.children[1].id = 'start-search';
                                    menu.insertAdjacentHTML('beforeend', `
                                        <div>
                                            <h5>Pinned</h5>
                                            <div id="allButton" class="button acrylic">
                                                <p>All ></p>
                                            </div>
                                        </div>
                                        <div id="pinnedApps">
                                            <div id="store" class="icon app single-instance" title-data="Microsoft Store">
                                                <img src="assets/store.png" alt="Microsoft Store"/>
                                                <p>Microsoft Store</p>
                                            </div>
                                            <div id="settings" class="icon app single-instance" title-data="Settings">
                                                <img src="assets/settings.png" alt="Settings"/>
                                                <p>Settings</p>
                                            </div>
                                        </div>
                                    `);
                                    document.querySelectorAll('#pinnedApps div').forEach((app) => {
                                        //TODO: add mousedown for animations
                                        app.addEventListener('mouseup', (event) => {
                                            if (event.button === 0) {
                                                openApp(app);
                                                menu.remove();
                                                document.getElementById(menu.id.split('-')[0]+'-button').classList.remove('active');
                                            }
                                        });
                                    });
                                break;
                                case 'search-button':
                                    menu.firstChild.children[1].id = 'search-search';
                                    menu.insertAdjacentHTML('beforeend', '<h5>Recent</h5>');
                                break;
                            }
                        }
                        if (el.parentElement.id == 'taskbar-icons') {
                            document.body.insertAdjacentHTML('afterbegin', '<div id="'+el.id.split('-')[0]+'-menu" class="menu right acrylic"><div/>');
                            let menu = document.getElementById(el.id.split('-')[0]+'-menu');
                            switch(el.id) {
                                case 'controls-button':
                                    //TODO: controls menu
                                break;
                                case 'clock-button':
                                    //TODO: calander and notifs menu
                                break;
                            }
                        }
                        setTimeout(() => {
                            taskbar.classList.remove('faketransparency');
                        }, 150);
                    }
                }
            });
        break;
    }
}

async function createUserIcon(split) {
    let responseText, image, title;

    //make sure split has http(s)://
    let url = split;
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    //get domain from url
    let domainMatch = url.match(/^https?:\/\/([^\/]+)/i);
    let domain = domainMatch ? domainMatch[1] : url;

    //see if site allows connections
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error("Bad response");
        responseText = await response.text();

        image = `https://${domain}/favicon.ico`;

        // Extract title
        const match = responseText.match(/<title>([^<]*)<\/title>/i);
        title = match ? match[1] : split;
    } catch (err) {
        // If site cannot be fetched
        image = 'assets/noicon.png';
        title = split;
    }

    icons.insertAdjacentHTML('beforeend', `<div class="icon app user-created" id="${domain.split('.')[0]}" title-data="${title}" url="${url}"><img src="${image}"/><p>${title}</p></div>`);
    let icon = icons.lastChild;
    createIcon(icon, url);
    return icon;
}

//call to create new app window adds html to body and starts all listeners
function openApp(el, url=el.id) {
    if (el.classList.contains('single-instance') && document.querySelector('#'+el.id+'-app') !== null) {
        if (url.includes('?')) {
            document.querySelector('#'+el.id+'-app').lastElementChild.src = url;
        }
        let tbIcon = document.querySelector('#'+el.id+'.taskbar-icon');
        tbIcon.classList.add('active');
        setTopWindow(document.getElementById(el.id+'-app'));
    } else {
        const appTitle = el.getAttribute('title-data');
        document.body.insertAdjacentHTML('afterbegin','<div id="'+el.id+'-app" class="window"><p>'+appTitle+'</p><div class="window-buttons"><p class="min">-</p><p class="max">◻</p><p class="close">X</p></div><iframe src="'+url+'"></iframe></div>');
        let elem = document.getElementById(el.id+'-app');
        if (document.querySelectorAll('#'+elem.id).length > 1) {
            let elemBounds = elem.getBoundingClientRect();
            let windowCount = document.querySelectorAll('#'+elem.id).length-1;
            elem.style.left = elemBounds.left + windowCount*15 + "px";
            elem.style.top = elemBounds.top + windowCount*15 + "px";
        }
        elem.style.zIndex = document.querySelectorAll('.window').length;
        let taskbarIcon = document.querySelector(`#${el.id}.taskbar-icon`);
        if (taskbarIcon === null) {
            document.getElementById('taskbar-apps').insertAdjacentHTML('beforeend', `
                <div id="${el.id}" class="taskbar-${el.className}" title-data="${appTitle}">
                    <img src="${el.children[0].src}" alt="${appTitle}"/>
                    <div></div>
                </div>
            `);
            taskbarIcon = document.querySelector(`#${el.id}.taskbar-icon`);
            createTaskbarButton(taskbarIcon);
        }
        if (taskbarIcon.classList.contains('active')) {
            //TODO: add visual for multiple windows
        } else {
            //set timeout lets the animation play, there are likely better solutions
            setTimeout(() => {
                taskbarIcon.classList.add('open','active');
            },0);
        }
        //set cursor to appropriate one
        let relativeX, relativeY, borderSize = 5;
        elem.onmousemove = function(e) {
            let rect = elem.getBoundingClientRect();
            relativeX = e.clientX - rect.left, relativeY = e.clientY - rect.top; //the mouse postion on the element
            let cursor = "";

            if(relativeY < borderSize)
                cursor += "n"; //north
            else if(relativeY > rect.height - borderSize)
                cursor += "s"; //south

            if(relativeX < borderSize)
                cursor += "w"; //west
            else if(relativeX > rect.width - borderSize)
                cursor += "e"; //east

            if(cursor)
                elem.style.cursor = cursor + "-resize";
            else
                elem.style.cursor = "auto";
        }

        let dragging = false;
        elem.addEventListener('mousedown', (e) => {
            let elemArea = elem.getBoundingClientRect();
            if (e.target.classList.contains('window') && (!e.target.classList.contains('paned') && !e.target.classList.contains('fullscreen'))) {
                storedBounds = elemArea;
            }
            let y = relativeY, x = relativeX;
            document.querySelectorAll('.taskbar-icon.active').forEach((icon) => {
                icon.classList.remove('active');
            });
            !taskbarIcon.classList.contains('active') ? taskbarIcon.classList.add('active') : '';
            function handleMouseMove(cursor) {
                if (dragging) {
                    //window dragging
                    elem.style.cursor = 'auto';
                    if (cursor.y < taskbar.getBoundingClientRect().top && cursor.y > 0) {
                        elem.style.top = cursor.y-(e.y-elemArea.top)+"px";
                    }
                    if (cursor.x < window.innerWidth && cursor.x > 0) {
                        elem.style.left = cursor.x-(e.x-elemArea.left)+"px";
                    }
                } else {
                    //window resizing
                    if(y < borderSize) {
                        if ((elemArea.height+elemArea.top)-cursor.y > elem.firstChild.offsetHeight + 15) {
                            elem.style.top = cursor.y-(e.y-elemArea.top)+"px";
                            elem.style.height = (elemArea.height+elemArea.top)-cursor.y+"px";
                        }
                    } else if(y > elemArea.height - borderSize) {
                        if (cursor.y-(elemArea.top) > elem.firstChild.offsetHeight + 15) {
                            elem.style.height = cursor.y-(elemArea.top)+"px";
                        }
                    }

                    if(x < borderSize) {
                        if ((elemArea.width+elemArea.left)-cursor.x > elem.firstChild.offsetWidth + elem.children[1].offsetWidth + 15) {
                            elem.style.left = cursor.x-(e.x-elemArea.left)+"px";
                            elem.style.width = (elemArea.width+elemArea.left)-cursor.x+"px";
                        }
                    } else if(x > elemArea.width - borderSize) {
                        if (cursor.x-(elemArea.left) > elem.firstChild.offsetWidth + elem.children[1].offsetWidth + 15) {
                            elem.style.width = cursor.x-(elemArea.left)+"px";
                        }
                    }       
                }
            };
            function noMoreDrag(cursor) {
                let tbTop = taskbar.getBoundingClientRect().top;
                function panes() {
                    elem.style.width = window.innerWidth/2+'px';
                    if (cursor.y < 100) {
                        elem.style.top = 0;
                        elem.style.height = tbTop/2+'px';
                    } else if (cursor.y > tbTop-100) {
                        elem.style.top = tbTop/2+'px';
                        elem.style.height = tbTop/2+'px';
                    } else {
                        elem.style.top = 0;
                        elem.style.height = tbTop+'px';
                    }
                }
                if (cursor.x < 50) {
                    elem.classList.add('paned');
                    elem.style.left = 0;
                    panes();
                } else if (cursor.x > window.innerWidth-50) {
                    elem.classList.add('paned');
                    elem.style.left = window.innerWidth/2+'px';
                    panes();
                } else if (cursor.y < 50) {
                    elem.classList.add('fullscreen');
                    taskbar.classList.add('acrylic');
                    elem.style.left = 0;
                    elem.style.top = 0;
                    elem.style.width = window.innerWidth+'px';
                    elem.style.height = tbTop+'px';
                }

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', noMoreDrag);
                elem.lastChild.style.pointerEvents = 'all';
            };
            if (e.target == elem) {
                setTopWindow(elem);

                //unfullscreen when grab window while fullscreen
                if (elem.classList.contains('fullscreen')) {
                    //would be cool to have the cursor not just put in the middle
                    elem.style.left = (e.x-storedBounds.width/2)+'px';
                    elemArea = elem.getBoundingClientRect();
                }
                if (elem.classList.contains('paned') || elem.classList.contains('fullscreen')) {
                    elem.style.width = storedBounds.width+'px';
                    elem.style.height = storedBounds.height+'px';
                    elem.classList.remove('paned', 'fullscreen');
                }
                //i use TranslucentTB and i have it set up to go acrylic when theres a fullscreen window so yeah thats why this is here
                //if there are no fullscreen windows disable acrylic taskbar
                if (document.querySelectorAll('.fullscreen').length < 1 && taskbar.classList.contains('acrylic')) {
                    taskbar.classList.remove('acrylic');
                }
                //disable pointers events so dragging works better
                elem.lastChild.style.pointerEvents = 'none';
                //tell if the user is dragging or resizing by cursor
                if (elem.style.cursor == 'auto') {
                    dragging = true;
                } else {
                    dragging = false;
                }

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', noMoreDrag);
            }
        });
        //handlers for buttons on app windows
        document.querySelector('#'+elem.id+' .close').addEventListener('click', () => {
            elem.remove(); //close window
            if (document.querySelectorAll('#'+elem.id).length <= 0) {
                if (taskbarIcon.classList.contains('pinned')) {
                    taskbarIcon.classList.remove('active', 'open');
                } else {
                    taskbarIcon.classList.remove('active', 'open');
                    setTimeout(() => {
                        taskbarIcon.remove();
                    }, 100);
                }
            }
            if (document.querySelectorAll('.fullscreen').length < 1 && taskbar.classList.contains('acrylic')) {
                taskbar.classList.remove('acrylic');
            }
        });
        let storedBounds;
        document.querySelector('#'+elem.id+' .max').addEventListener('click', () => {
            if (elem.classList.contains('fullscreen')) {
                elem.classList.remove('fullscreen');
                if (document.querySelectorAll('.fullscreen').length < 1 && taskbar.classList.contains('acrylic')) {
                    taskbar.classList.remove('acrylic');
                }
                elem.style.left = storedBounds.left+'px';
                elem.style.top = storedBounds.top+'px';
                elem.style.width = storedBounds.width+'px';
                elem.style.height = storedBounds.height+'px';
            } else {
                if (!elem.classList.contains('paned')) storedBounds = elem.getBoundingClientRect();
                elem.classList.add('fullscreen');
                taskbar.classList.add('acrylic');
                elem.style.left = 0;
                elem.style.top = 0;
                elem.style.width = window.innerWidth+'px';
                elem.style.height = taskbar.getBoundingClientRect().top+'px';
            }
        });
        document.querySelector('#'+elem.id+' .min').addEventListener('click', () => {
            elem.classList.add('minimized');
            if (document.querySelectorAll('#'+elem.id).length <= 1) {
                taskbarIcon.classList.remove('active');
            }
            taskbarIcon.classList.remove('maximize');
            setTimeout(() => {
                taskbarIcon.classList.add('minimize');
            }, 0);
            if (document.querySelectorAll('.fullscreen.minimized').length == document.querySelectorAll('.fullscreen').length) taskbar.classList.remove('acrylic');
        });
    }
}

//by simple i mean this is so stupid
function openAppSimple(app, name = app, url = undefined) {
    //temporary hopefully
    const template = document.createElement("template");
    template.innerHTML = `<div id="${app}" class="icon app single-instance" title-data="${name}"${url ? `url=${url}` : ''}>
                            <img src="assets/${app}.png">  
                            </div>`;
    openApp(template.content.firstElementChild, url);
}

//handler for desktop icons, double click to open & selection
function createIcon(el, url) {
    let clicks = 0;
    let timeout;
    el.addEventListener('click', (click) => {
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
        if (clicks == 2 && click.target.nodeName !== "TEXTAREA") {
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

(async () => {
    await restoreStyles();
    //add listeners to initial icons
    document.querySelectorAll('.icon').forEach(el => {
        createIcon(el, el.getAttribute('url') !== null ? el.getAttribute('url') : undefined);
    });
})();
//add listeners to initial taskbar icons
document.querySelectorAll('#start-button, #search-button, #taskbar-apps div, #taskbar-icons div').forEach(el => {
    createTaskbarButton(el);
});

function createRclickSubmenu(content, rclick, button) {
    let isStillHoverd = true;
    function mouseleave() {
        isStillHoverd = false;
        button.removeEventListener('mouseleave', mouseleave);
    }
    button.addEventListener('mouseleave', mouseleave);
    return new Promise(resolve => {
        setTimeout(() => {
            if (isStillHoverd) {
                document.body.insertAdjacentHTML('afterbegin', '<div id="rclick" class="sub">'+content+'</div>');
                let sub = document.getElementsByClassName('sub')[0];
                sub.style.top = button.getBoundingClientRect().top-3+"px";
                const rclickBounds = rclick.getBoundingClientRect();
                sub.style.left = rclickBounds.left+rclickBounds.width-2+"px";
                const subBounds = sub.getBoundingClientRect();
                if (subBounds.x + subBounds.width > document.body.getBoundingClientRect().width) {
                    sub.style.left = rclickBounds.left-subBounds.width+2+"px";
                }
                resolve(sub);
            }
        }, 500);
    });
}

document.body.addEventListener('mousedown', (event) => {
    const targetPath = getElementPath(event.target);
    //taskbar icon handler
    if (!targetPath.includes('-app') && !event.target.classList.contains('app')) {
        document.querySelectorAll('#taskbar-apps .taskbar-icon.active').forEach((icon) => {
            icon.classList.remove('active');
        });
    }
    //this deals with certain exceptions in regards to right clicking and i kinda hate it
    //if left or right click (no middle)
    if (event.button == 0 || event.button == 2) {
        //if right clicking on icon prevent it from being deselected
        if (event.button == 2 && event.target.classList[0] == 'icon') return;
        //if the click point was on the right click menu return to prevent deselection
        if (event.target.id == 'rclick' || event.target.parentElement.id == 'rclick') return;

        document.querySelectorAll('.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }
    //drag selection handler
    function handleMouseMove(cursor) {
        //calculate left/top as the minimum, width/height as the absolute difference
        box.style.left = Math.min(event.x, cursor.x) + "px";
        box.style.top = Math.min(event.y, cursor.y) + "px";
        box.style.width = Math.abs(cursor.x - event.x) + "px";
        box.style.height = Math.abs(cursor.y - event.y) + "px";
        //if icons under selection box select them
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
    //handle menus
    if (!targetPath.includes('menu') && !event.target.classList.contains('popup')) {
        document.querySelectorAll('.menu').forEach(el => {
            taskbar.classList.add('faketransparency');
            el.classList.add('close');
            setTimeout(() => {
                el.remove();
                taskbar.classList.remove('faketransparency');
            }, 150);
            document.getElementById(el.id.split('-')[0]+'-button').classList.remove('active');
        });
    }
    //if click was not middle mouse
    if (event.button === 0 || event.button === 2) {
        //remove right click menu
        document.querySelectorAll('#rclick').forEach(el => {
            el.remove();
        });
        //if click was on desktop and not middle mouse
        if (event.target == desktop) {
            //creating the box every time is dumb, would love to fix if i knew how
            document.body.insertAdjacentHTML('afterbegin', '<div id="box"></div>');
            let box = document.getElementById('box')
            box.style.left = event.x+"px";
            box.style.top = event.y+"px";
            //disable iframes to prevent issues
            document.querySelectorAll('iframe').forEach(el => {
                el.style.pointerEvents = 'none';
            });
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', noMoreBox);
        }
    }
});

document.body.addEventListener('mouseup', () => {
    //prevent taskbar icons from staying pressed after user lets go
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
    //if right clicking an icon and its not already selected deselct all else select
    if (e.target.parentElement.id === 'icons') {
        if (!e.target.classList.contains('selected')) {
            document.querySelectorAll('.selected').forEach(el => {
                el.classList.remove('selected');
            });
        }
        e.target.classList.add('selected');
    }

    document.body.insertAdjacentHTML('afterbegin', '<div id="rclick"></div>');
    let rclick = document.getElementById('rclick');
    if (e.target.parentElement.id === 'icons') {
        //if icons are selected add more options to right click menu
        if (document.querySelectorAll('.selected').length > 0) {
            rclick.insertAdjacentHTML('afterbegin', `
                <div id="open"><p><b>Open</b></p></div>
                <div id="print"><p>Print</p></div>
                <div id="copyAsPath"><p>Copy as path</p></div>
                <div id="share"><p>Share</p></div>
                <div id="restore"><p>Restore previous versions</p></div>
                <div></div>
                <div id="sendTo"><p>Send to</p><p>&#59764;</p></div>
                <div></div>
                <div id="cut"><p>Cut</p></div>
                <div id="copy"><p>Copy</p></div>
                <div></div>
                <div id="createShortcut"><p>Create shortcut</p></div>
                <div id="deleteButton"><p>Delete</p></div>
                <div id="rename"><p>Rename</p></div>
                <div></div>
                <div id="properties"><p>Properties</p></div>
            `);
            document.getElementById('open').addEventListener('click', () => {
                openApp(e.target);
                rclick.remove();
            });
            /*document.getElementById('print').addEventListener('click', () => {
                //TODO: printing
                rclick.remove();
            });*/
            document.getElementById('copyAsPath').addEventListener('click', () => {
                const path = location.pathname.split('/')[1] ? '/' + location.pathname.split('/')[1] : '';
                const url = e.target.getAttribute('url');
                navigator.clipboard.writeText(`${location.host+path}/?${url !== null ? url.split('://')[url.split('://').length - 1] : e.target.id+'.url'}`);
                rclick.remove();
            });
            /*document.getElementById('share').addEventListener('click', () => {
                //TODO: make share menu
                rclick.remove();
            });
            document.getElementById('restore').addEventListener('click', () => {
                //TODO: make file restore menu
                rclick.remove();
            });
            document.getElementById('sendTo').addEventListener('click', () => {
                //TODO: make send to menu
                rclick.remove();
            });*/
            document.getElementById('cut').addEventListener('click', () => {
                tempClipboard = [], cut = true;
                document.querySelectorAll('.selected').forEach((selectedItem) => {
                    tempClipboard.push(getElementPath(selectedItem));
                });
                rclick.remove();
            });
            document.getElementById('copy').addEventListener('click', () => {
                tempClipboard = [], cut = false;
                document.querySelectorAll('.selected').forEach((selectedItem) => {
                    tempClipboard.push(getElementPath(selectedItem));
                });
                rclick.remove();
            });
            /*document.getElementById('createShortcut').addEventListener('click', () => {
                //TODO: make creating shortcut functionality
                rclick.remove();
            });*/
            document.getElementById('deleteButton').addEventListener('click', () => {
                document.querySelectorAll('.selected').forEach(el => {
                    el.remove();
                });
                rclick.remove();
            });
            document.getElementById('rename').addEventListener('click', () => {
                e.target.classList.remove('selected');
                e.target.insertAdjacentHTML('beforeend', `<textarea maxlength="228">${e.target.children[1].textContent}</textarea>`);
                e.target.children[1].remove();
                let textinput = e.target.children[1];
                textinput.select();
                function resize() {
                    textinput.style.height = '1em';
                    textinput.style.height = textinput.scrollHeight + "px";
                    //TODO: make renaming textarea width shrink
                    //textinput.style.width = '6ch';
                    //console.log(textinput.scrollWidth);
                    //textinput.style.width = textinput.scrollWidth + "px";
                };
                resize();
                textinput.addEventListener('input', resize);
                textinput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        e.target.insertAdjacentHTML('beforeend', `<p>${textinput.value.trim().length > 0 ? textinput.value : textinput.innerHTML}</p>`);
                        textinput.remove();
                    }
                })
                textinput.addEventListener('focusout', () => {
                    e.target.insertAdjacentHTML('beforeend', `<p>${textinput.value}</p>`);
                    textinput.remove();
                });
                rclick.remove();
            });
            /*document.getElementById('properties').addEventListener('click', () => {
                //TODO: make properties menu
                rclick.remove();
            });*/
        }
    }
    if (e.target.id == 'taskbar') {
        rclick.insertAdjacentHTML('afterbegin', `
            <div id="taskManager"><pre>&#61728</pre><p>Task Manager</p></div>
            <div></div>
            <div id="taskbarSettings"><pre>&#57621</pre><p>Taskbar Settings</p></div>
        `);
        rclick.classList.add('tbRclick','acrylic');
        //TODO: task manager
        document.getElementById('taskbarSettings').addEventListener('click', () => {
            openAppSimple('settings', 'Settings', 'settings/?personalize.taskbar');
            rclick.remove();
        });
    }
    if (e.target == desktop) {
        rclick.insertAdjacentHTML('afterbegin', `
            <div id="view"><p>View</p><p>&#59764;</p></div>
            <div id="sort"><p>Sort by</p><p>&#59764;</p></div>
            <div id="refresh"><p>Refresh</p></div>
            <div></div>
            <div id="paste" ${tempClipboard.length > 0 ? '' : 'disabled'}><p>Paste</p></div>
            <div></div>
            <div id="new"><p>New</p><p>&#59764;</p></div>
            <div></div>
            <div id="displaySettings"><p>Display settings</p></div>
            <div id="personalize"><p>Personalize</p></div>
        `);
        document.querySelectorAll("#rclick div").forEach((el) => {
            el.addEventListener('mouseenter', () => {
                document.querySelectorAll('.sub').forEach((el) => {
                    setTimeout(() => {
                        el.remove();
                    }, 500);
                });
            });
        });
        let view = document.getElementById('view');
        view.addEventListener('mouseenter', async () => {
            let sub = await createRclickSubmenu(`
                <div id="large">${icons.classList.contains('large') ? '<pre>●</pre>' : ''}<p>Large icons</p></div>
                <div id="medium">${icons.classList.contains('medium') ? '<pre>●</pre>' : ''}<p>Medium icons</p></div>
                <div id="small">${icons.classList.contains('small') ? '<pre>●</pre>' : ''}<p>Small icons</p></div>
                <div></div>
                <div id="autoArrange"><pre>&#63372;</pre><p>Auto arrange icons</p></div>
                <div id="alignIcons"><pre>&#63372;</pre><p>Align icons to grid</p></div>
                <div></div>
                <div id="showIcons">${icons.style.display !== 'none' ? '<pre>&#63372;</pre>' : ''}<p>Show desktop icons</p></div>
            `, rclick, view);
            function setIconSize(click) {
                icons.className = click.target.id;
                rclick.remove();
                sub.remove();
            }
            document.getElementById('large').addEventListener('click', setIconSize);
            document.getElementById('medium').addEventListener('click', setIconSize);
            document.getElementById('small').addEventListener('click', setIconSize);
            /*TODO: add auto arrange and align icons here*/
            let showIcons = document.getElementById('showIcons');
            showIcons.addEventListener('click', () => {
                icons.style.display = showIcons.firstChild.nodeName === 'PRE' ? 'none' : 'flex';
                rclick.remove();
                sub.remove();
            });
        });
        let sort = document.getElementById('sort');
        sort.addEventListener('mouseenter', async () => {
            let sub = await createRclickSubmenu(`
                <div id="name"><p>Name</p></div>
                <div id="size"><p>Size</p></div>
                <div id="itemType"><p>Item type</p></div>
                <div id="dateModfified"><p>Date modified</p></div>
            `, rclick, sort);
            /*TODO: add sorting icons here*/
        });
        document.getElementById('refresh').addEventListener('click', () => {
            rclick.remove();
        });
        let paste = document.getElementById('paste');
        if (!paste.hasAttribute('disabled')) {
            paste.addEventListener('click', () => {
                tempClipboard.forEach((entry) => {
                    const og = document.querySelector(entry);
                    const ogText = og.children[1].textContent;
                    const url = og.getAttribute('url') !== null ? og.getAttribute('url') : undefined;
                    const sameUrlElems = document.querySelectorAll(`[url=${url}]`);
                    let copies = '';
                    //this is definitely err not good TODO: fix this
                    sameUrlElems.forEach((element) => {
                        if (cut) {
                            try {
                                document.getElementById(og.id).remove();
                            } catch (error) {
                                //its joever
                            }
                        } else {
                        if (element.children[1].textContent == ogText) {
                            copies += ' - Copy';
                        } else {
                            let copyAmmount = 0;
                            document.querySelectorAll(`[url=${url}] :nth-child(2)`).forEach((text) => {
                                const elemText = text.textContent;
                                if (elemText == ogText || elemText.slice(0, -7) == ogText || elemText.slice(0, -11) == ogText) {
                                    copyAmmount++;
                                }
                            });
                            copies = ` - Copy${copyAmmount == 1 ? '' : ` (${copyAmmount})`}`;
                        }
                        }
                    });
                    icons.insertAdjacentHTML('beforeend', `<div class="icon app selected user-created" id="${og.id}${cut ? '' : sameUrlElems.length}" title-data="${og.getAttribute('title-data')}" ${url !== undefined ? `url="${url}"` : ''}><img src="${og.children[0].src}"/><p>${ogText}${copies}</p></div>`);
                    createIcon(icons.lastChild, url);
                });
                if (cut) {
                    tempClipboard = [];
                    cut = false;
                }
                rclick.remove();
            });
        }
        let newFile = document.getElementById('new');
        newFile.addEventListener('mouseenter', async () => {
            let sub = await createRclickSubmenu(`
                <div id="newFolder"><p>Folder</p></div>
                <div id="newShortcut"><p>Shortcut</p></div>
                <div></div>
                <div id="newBmp"><p>Bitmap image</p></div>
                <div id="newTxt"><p>Text Document</p></div>
                <div id="newZip"><p>Compressed (zipped) Folder</p></div>
            `, rclick, newFile);
            /*TODO: create creating new files functionality*/
        });
        document.getElementById('displaySettings').addEventListener('click', () => {
            openAppSimple('settings', 'Settings', 'settings/?system.display');
            rclick.remove();
        });
        document.getElementById('personalize').addEventListener('click', () => {
            openAppSimple('settings', 'Settings', 'settings/?personalize');
            rclick.remove();
        });
    }
    if (e.target.id == 'start-menu') {
        rclick.insertAdjacentHTML('afterbegin', `
            <div id="startSettings"><pre>&#57621</pre><p>Start Settings</p></div>
        `);
        rclick.classList.add('tbRclick','acrylic');
        document.getElementById('startSettings').addEventListener('click', () => {
            openAppSimple('settings', 'Settings', 'settings/?personalize.start');
            rclick.remove();
            e.target.remove();
        });
    }
    
    if (rclick.innerHTML !== '') {
        //prevent right click menu from going off the screen
        let bodyBounds = document.body.getBoundingClientRect();
        if (e.x+284 > bodyBounds.width) {
            rclick.style.left = e.x-(e.x+284-bodyBounds.width)+'px';
        } else {
            rclick.style.left = e.x+'px';
        }
        let rclickBounds = rclick.getBoundingClientRect();
        let taskbarBounds = taskbar.getBoundingClientRect();
        if (e.y+rclickBounds.height > bodyBounds.height) {
            if (e.y > taskbarBounds.height) {
                rclick.style.top = taskbarBounds.top-rclickBounds.height+'px';
            } else {
                rclick.style.top = e.y-rclickBounds.height+'px';
            }
        } else {
            rclick.style.top = e.y+'px';
        }
    } else {
        rclick.remove();
    }
};
//handles commands received from iframes
window.onmessage = function(e) {
    let split;
    try {
        split = e.data.split(' ');
    } catch {
        return;
    }
    switch(split[0]) {
        case 'makeIcon':
            createUserIcon(split[1]);
        break;
        case 'save':
            (async () => {
                const db = await openDB();

                const tx = db.transaction(["styles", "classes", "elements"], "readwrite");
                const storeStyles = tx.objectStore("styles");
                const storeClasses = tx.objectStore("classes");
                const storeElements = tx.objectStore("elements");

                // Clear old values (critical)
                storeStyles.clear();
                storeClasses.clear();
                storeElements.clear();

                document.querySelectorAll('*').forEach(el => {
                    const path = getElementPath(el);

                    // Save inline styles
                    if (el.hasAttribute("style")) {
                        storeStyles.put(el.getAttribute("style"), path);
                    }

                    //save icon size
                    if (el.id === "icons") {
                        storeClasses.put(el.className, path);
                    }

                    // Save .user-created elements
                    if (el.classList.contains("user-created")) {
                        const parentPath = getElementPath(el).split(' > ').slice(0, -1).join(' > ');
                        const index = getElementPath(el);
                        storeElements.put({
                            parentPath,
                            index,
                            outerHTML: el.outerHTML
                        });
                    }
                });

                await tx.complete;
            })();
        break;
        case 'style':
            //document.getElementById(split[1]).style[split[2]] = split[3];
            document.getElementById(split[1]).style.setProperty(split[2], split[3], split[4]);
        break;
            
    }
};
//url query handler
if (location.search) {
    location.search.split('?').forEach((query) => {
        if (query) {
            if (query.split('.')[1] == 'url') {
                try {
                    openApp(document.getElementById(query.split('.')[0]));
                } catch (error) {
                    openAppSimple(query.split('.')[0]);
                }
            } else if (query.split('.')[1] !== undefined) {
                (async () => {
                    const app = await createUserIcon(query);
                    openApp(app, app.getAttribute('url'));
                })();
            }
        }
    });
}