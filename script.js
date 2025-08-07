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
    });
    el.addEventListener('mouseup',  () => {
        el.classList.remove('pressed');
        el.classList.add('released');
        setTimeout(function() {
            el.classList.remove('released');
        }, 100);
    });
});

document.querySelectorAll('.icon').forEach(el => {
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
        if (document.querySelectorAll('.active').length < 1) {
            el.classList.add('active');
        } else {
            document.querySelectorAll('.active').forEach(el => {
                el.classList.remove('active');
            });
            el.classList.add('active');
        }
        if (clicks == 2) {
            clicks = 0;
            clearTimeout(timeout);
            switch(el.className.split(' ')[1]) {
                case 'web':
                    document.location.href = window.location.pathname.replace(/[^/]+$/,'')+el.id;
                    break;
                case 'app':
                    // i cant believe this works properly honestly
                    document.body.insertAdjacentHTML('afterbegin','<div id="'+el.id+'" class="window"><p>'+el.children[1].textContent+'</p><div class="window-buttons"><p class="close">X</p></div><iframe src="'+el.id+'"></iframe></div>');
                    document.getElementById(el.id).style.zIndex = document.querySelectorAll('#'+el.id).length;
                    document.querySelector('#'+el.id+' .close').addEventListener('click', () => {
                        document.getElementById(el.id).remove();
                    });
                    break;
            }
        }
    });
});

document.body.addEventListener('mousedown', (event) => {
    // i dont like checking for very specific things every click but what else can i do
    document.querySelectorAll('.active').forEach(el => {
        el.classList.remove('active');
    });

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
        document.querySelectorAll('.icon').forEach(el => {
            let boxArea = box.getBoundingClientRect();
            let iconArea = el.getBoundingClientRect();
            var overlap = (boxArea.top <= iconArea.bottom && boxArea.bottom >= iconArea.top && boxArea.left <= iconArea.right && boxArea.right >= iconArea.left);
            if (overlap) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    };
    function noMoreBox() {
        box.remove();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', noMoreBox);
    };
    if (event.y < window.innerHeight-48) {
        //creating the box every time is dumb
        document.body.insertAdjacentHTML('afterbegin', '<div id="box"></div>');
        let box = document.getElementById('box')
        box.style.left = event.x+"px";
        box.style.top = event.y+"px";
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