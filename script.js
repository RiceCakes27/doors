const desktop = document.getElementById('desktop');
const icons = document.getElementById('icons');
const taskbar = document.getElementById('taskbar');

function updateClock() {
    let now = new Date();

    document.getElementById('time').textContent = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    document.getElementById('date').textContent = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
}
//start clock then start updating it every second
updateClock();
setInterval(updateClock, 1000);

//restore saved stuff
const styles = JSON.parse(localStorage.getItem('savedStyles') || '{}');
const classes = JSON.parse(localStorage.getItem('savedClasses') || '{}');
const userCreated = JSON.parse(localStorage.getItem('savedUserCreated') || '[]');

// Restore styles
for (const [path, style] of Object.entries(styles)) {
    const el = document.querySelector(path);
    if (el) el.setAttribute('style', style);
}

// Restore classes
for (const [path, className] of Object.entries(classes)) {
    const el = document.querySelector(path);
    if (el) el.className = className;
}

// Restore user-created elements
userCreated.forEach(item => {
    const parentPath = item.path.split(' > ').slice(0, -1).join(' > ');
    const parent = document.querySelector(parentPath) || document.body;
    const temp = document.createElement('div');
    temp.innerHTML = item.outerHTML;
    parent.appendChild(temp.firstElementChild);
});

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

//handles animations and function for taskbar buttons
function createTaskbarButton(el) {
    el.addEventListener('mousedown', () => {
        el.classList.add('pressed');
    });
    switch(el.className.split(' ')[1]) {
        case 'app':
            el.addEventListener('mouseup', (event) => {
                if ((event.button === 0 || event.button === 1) && document.querySelectorAll('#'+el.id+'-app').length == 0) {
                    openApp(el);
                } else if (event.button === 0 && document.querySelectorAll('#'+el.id+'-app').length == 1){
                    document.getElementById(el.id+'-app').style.display = document.getElementById(el.id+'-app').style.display == 'none' ? 'block' : 'none';
                    el.classList.contains('active') ? el.classList.remove('active') : el.classList.add('active');
                } else if (event.button === 1) {
                    openApp(el);
                }
                //will need to make a menu for when theres multiple windows
            });
        break;
        case 'popup':
            el.addEventListener('mouseup', (event) => {
                if (event.button === 0) {
                    let openMenu = true;
                    document.querySelectorAll('.menu').forEach(menu => {
                        menu.remove();
                        document.getElementById(menu.id.split('-')[0]+'-button').classList.remove('active');
                        if (menu.id.split('-')[0] == el.id.split('-')[0]) {
                            openMenu = false;
                        }
                    });
                    if (openMenu) {
                        el.classList.add('active');
                        if (el.parentElement.id == 'taskbar') {
                            document.body.insertAdjacentHTML('afterbegin', '<div id="'+el.id.split('-')[0]+'-menu" class="menu left acrylic"><div class="search-bar"><svg id="search-icon"fill="white"height="15px"width="15px"viewBox="0 0 490.4 490.4" xml:space="preserve"><g><path d="M484.1,454.796l-110.5-110.6c29.8-36.3,47.6-82.8,47.6-133.4c0-116.3-94.3-210.6-210.6-210.6S0,94.496,0,210.796s94.3,210.6,210.6,210.6c50.8,0,97.4-18,133.8-48l110.5,110.5c12.9,11.8,25,4.2,29.2,0C492.5,475.596,492.5,463.096,484.1,454.796zM41.1,210.796c0-93.6,75.9-169.5,169.5-169.5s169.6,75.9,169.6,169.5s-75.9,169.5-169.5,169.5S41.1,304.396,41.1,210.796z"/></g></svg><input/></div></div>');
                            let menu = document.getElementById(el.id.split('-')[0]+'-menu');
                            menu.firstChild.children[1].focus();
                            switch(el.id) {
                                case 'start-button':
                                    menu.firstChild.children[1].placeholder = 'Search for apps, settings, and documents';
                                    menu.insertAdjacentHTML('beforeend', `
                                        <div>
                                            <h5>Pinned</h5>
                                            <div id="allButton" class="button acrylic">
                                                <p>All ></p>
                                            </div>
                                        </div>
                                        <div id="pinnedApps">
                                            <div id="store" class="icon app" title-data="Microsoft Store">
                                                <img src="assets/store.png" alt="Microsoft Store"/>
                                                <p>Microsoft Store</p>
                                            </div>
                                            <div id="settings" class="icon app" title-data="Settings">
                                                <img src="assets/settings.png" alt="Settings"/>
                                                <p>Settings</p>
                                            </div>
                                        </div>
                                    `);
                                    document.querySelectorAll('#pinnedApps div').forEach((app) => {
                                        //add mousedown for animations
                                        app.addEventListener('mouseup', (event) => {
                                            if (event.button === 0) {
                                                openApp(app);
                                                menu.remove();
                                            }
                                        });
                                    });
                                break;
                                case 'search-button':
                                    menu.insertAdjacentHTML('beforeend', '<h5>Recent</h5>');
                                break;
                            }
                        }
                        if (el.parentElement.id == 'taskbar-icons') {
                            document.body.insertAdjacentHTML('afterbegin', '<div id="'+el.id.split('-')[0]+'-menu" class="menu right acrylic"><div/>');
                            let menu = document.getElementById(el.id.split('-')[0]+'-menu');
                            switch(el.id) {
                                case 'controls-button':
                                    //insert stuff
                                break;
                                case 'clock-button':
                                    //insert whatever
                                break;
                            }
                        }
                    }
                }
            });
        break;
    }
}
//add listeners to initial taskbar icons
document.querySelectorAll('#start-button, #search-button, #taskbar-apps div, #taskbar-icons div').forEach(el => {
    createTaskbarButton(el);
});

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
    const appTitle = el.getAttribute('title-data');
    document.body.insertAdjacentHTML('afterbegin','<div id="'+el.id+'-app" class="window"><p>'+appTitle+'</p><div class="window-buttons"><p class="min">-</p><p class="max">◻</p><p class="close">X</p></div><iframe src="'+url+'"></iframe></div>');
    let elem = document.getElementById(el.id+'-app');
    elem.style.zIndex = document.querySelectorAll('.window').length;
    let taskbarIcon = document.querySelector(`#${el.id}.taskbar-icon`);
    if (taskbarIcon === null) {
        document.getElementById('taskbar-apps').insertAdjacentHTML('beforeend', `
            <div id="${el.id}" class="taskbar-icon app" title-data="${appTitle}">
                <img src="${el.children[0].src}" alt="${appTitle}"/>
                <div></div>
            </div>
        `);
        taskbarIcon = document.querySelector(`#${el.id}.taskbar-icon`);
        createTaskbarButton(taskbarIcon);
    }
    if (taskbarIcon.classList.contains('active')) {
        //add visual for multiple windows
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
        let y = relativeY, x = relativeX;
        document.querySelectorAll('.taskbar-icon.active').forEach((icon) => {
            icon.classList.remove('active');
        });
        !taskbarIcon.classList.contains('active') ? taskbarIcon.classList.add('active') : '';
        //window dragging
        function handleMouseMove(cursor) {
            if (dragging) {
                elem.style.cursor = 'auto';
                elem.style.top = cursor.y-(e.y-elemArea.top)+"px";
                elem.style.left = cursor.x-(e.x-elemArea.left)+"px";
            } else {
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
        function noMoreDrag() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', noMoreDrag);
            elem.lastChild.style.pointerEvents = 'all';
        };

        if (e.target == elem || e.target == elem.firstChild) {
            //ugh this still misorders windows sometimes no clue how to fix
            //window zIndex ordering
            let allWindows = document.querySelectorAll('.window');
            if (elem.style.zIndex != allWindows.length) {
                elem.style.zIndex = allWindows.length;
                for (let i = 0; i < allWindows.length; i++) {
                    if (allWindows[i] !== elem && allWindows[i].style.zIndex > 1) {
                        allWindows[i].style.zIndex -= 1;
                    }
                }
            }
            //unfullscreen when grab window while fullscreen
            if (elem.classList.contains('fullscreen')) {
                elem.classList.remove('fullscreen');
                //TO DO: make window return to non full screen position and size
                //elem.style.width = storedBounds.width+'px';
                //elem.style.height = storedBounds.height+'px';
                //elem.style.left = e.x+'px';
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
                taskbarIcon.remove();
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
            storedBounds = elem.getBoundingClientRect();
            elem.classList.add('fullscreen');
            taskbar.classList.add('acrylic');
            elem.style.left = 0;
            elem.style.top = 0;
            elem.style.width = document.body.getBoundingClientRect().width+'px';
            elem.style.height = document.body.getBoundingClientRect().height+'px';
        }
    });
    document.querySelector('#'+elem.id+' .min').addEventListener('click', () => {
        elem.style.display = 'none';
        if (document.querySelectorAll('#'+elem.id).length <= 1) {
            taskbarIcon.classList.remove('active');
        }
    });
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
//add listeners to initial icons
document.querySelectorAll('.icon').forEach(el => {
    createIcon(el, el.getAttribute('url') !== null ? el.getAttribute('url') : undefined);
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
    //taskbar icon handler
    if (!event.target.classList.contains('window') && !event.target.classList.contains('taskbar-icon')) {
        document.querySelectorAll('.taskbar-icon.active').forEach((icon) => {
            icon.classList.remove('active');
        });
    }
    //this deals with certain exceptions in regards to right clicking and i really hate it
    //if left or right click (no middle)
    if (event.button == 0 || event.button == 2) {
        //if right clicking on icon prevent it from being deselected
        if (event.button == 2 && event.target.classList[0] == 'icon') return;
        //if the click point was on the right click menu return to prevent deselection
        let isRmenu = false;
        document.querySelectorAll('#rclick, #rclick div').forEach(el => {
            if (event.target == el) isRmenu = true;
        })
        if (isRmenu) return;

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
    if (!event.target.classList.contains('popup')) {
        document.querySelectorAll('.menu').forEach(el => {
            let menuArea = el.getBoundingClientRect();
            let overlap = (event.y <= menuArea.bottom && event.y >= menuArea.top && event.x <= menuArea.right && event.x >= menuArea.left);
            if (!overlap) {
                el.remove();
                document.getElementById(el.id.split('-')[0]+'-button').classList.remove('active');
            }
        });
    }
    //if click was not middle mouse
    if (event.button === 0 || event.button === 2) {
        //remove right click menu
        document.querySelectorAll('#rclick').forEach(el => {
            el.remove();
        });
        //if click was on body and not middle mouse
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
                <div id="sendTo"><p>Send to</p><p>></p></div>
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
                //do something here not sure honestley
                rclick.remove();
            });*/
            document.getElementById('copyAsPath').addEventListener('click', () => {
                const path = location.pathname.split('/')[1] ? '/' + location.pathname.split('/')[1] : '';
                const url = e.target.getAttribute('url');
                navigator.clipboard.writeText(`${location.host+path}/?${url !== null ? url.split('://')[url.split('://').length - 1] : e.target.id+'.url'}`);
                rclick.remove();
            });
            /*document.getElementById('share').addEventListener('click', () => {
                //maybe open a share menu
                rclick.remove();
            });
            document.getElementById('restore').addEventListener('click', () => {
                //im probably not going to add this functionality
                rclick.remove();
            });
            document.getElementById('sendTo').addEventListener('click', () => {
                //do something here not sure yet
                rclick.remove();
            });
            document.getElementById('cut').addEventListener('click', () => {
                //cut here
                rclick.remove();
            });
            document.getElementById('copy').addEventListener('click', () => {
                //copy here
                rclick.remove();
            });
            document.getElementById('createShortcut').addEventListener('click', () => {
                //do something here not sure yet
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
                    //dont know how to make the width shrink currently
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
                //do something here mabye
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
        //add the listeners later
    }
    if (e.target == desktop) {
        rclick.insertAdjacentHTML('afterbegin', `
            <div id="view"><p>View</p><p>></p></div>
            <div id="sort"><p>Sort by</p><p>></p></div>
            <div id="refresh"><p>Refresh</p></div>
            <div></div>
            <div id="paste"><p>Paste</p></div>
            <div></div>
            <div id="new"><p>New</p><p>></p></div>
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
                <div id="autoArrange"><pre>✓</pre><p>Auto arrange icons</p></div>
                <div id="alignIcons"><pre>✓</pre><p>Align icons to grid</p></div>
                <div></div>
                <div id="showIcons">${icons.style.display !== 'none' ? '<pre>✓</pre>' : ''}<p>Show desktop icons</p></div>
            `, rclick, view);
            function setIconSize(click) {
                icons.className = click.target.id;
                rclick.remove();
                sub.remove();
            }
            document.getElementById('large').addEventListener('click', setIconSize);
            document.getElementById('medium').addEventListener('click', setIconSize);
            document.getElementById('small').addEventListener('click', setIconSize);
            /*insert other listeners*/
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
            /*insert listeners here*/
        });
        document.getElementById('refresh').addEventListener('click', () => {
            rclick.remove();
        });
        /*insert paste listener here*/
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
            /*insert listeners here*/
        });
        /*insert more listeners here*/  
    }
    if (e.target.id == 'start-menu') {
        rclick.insertAdjacentHTML('afterbegin', `
            <div id="startSettings"><pre>&#57621</pre><p>Start Settings</p></div>
        `);
        rclick.classList.add('tbRclick','acrylic');
        /*insert listeners here*/
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
            const styles = {};
            const classes = {};
            const userCreated = [];

            document.body.querySelectorAll('*').forEach(el => {
                // Save inline styles
                if (el.hasAttribute('style')) {
                    styles[getElementPath(el)] = el.getAttribute('style');
                }

                // Save .user-created elements completely
                if (el.classList.contains('user-created')) {
                    userCreated.push({
                        path: getElementPath(el),
                        outerHTML: el.outerHTML
                    });
                }
            });

            // Save #desktop class
            classes['#icons'] = document.getElementById('icons').className;

            localStorage.setItem('savedStyles', JSON.stringify(styles));
            localStorage.setItem('savedClasses', JSON.stringify(classes));
            localStorage.setItem('savedUserCreated', JSON.stringify(userCreated));
        break;
        case 'reset':
            localStorage.removeItem('savedStyles');
            localStorage.removeItem('savedClasses');
            localStorage.removeItem('savedUserCreated');
        break;
    }
};
//this should be improved later
if (location.search) {
    location.search.split('?').forEach((query) => {
        if (query) {
            if (query.split('.')[1] == 'url') {
                openApp(document.getElementById(query.split('.')[0]));
            } else {
                (async () => {
                    const app = await createUserIcon(query);
                    openApp(app, app.getAttribute('url'));
                })();
            }
        }
    })
}