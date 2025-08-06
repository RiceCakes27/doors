function updateClock() {
    let now = new Date();

    document.getElementById('time').textContent = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    document.getElementById('date').textContent = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
}

updateClock();
setInterval(updateClock, 1000);

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
    el.addEventListener('click', () => {
        clicks++;
        let oldclicks = clicks;
        setTimeout(function() {
            if (clicks === oldclicks) {
                clicks = 0;
            }
        }, 500);
        if (clicks >= 2) {
            switch(el.className.split(' ')[1]) {
                case 'web':
                    document.location.href = window.location.pathname.replace(/[^/]+$/,'')+el.id;
                    break;
                case 'app':
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