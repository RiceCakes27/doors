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
            document.body.insertAdjacentHTML('afterbegin','<iframe src="'+el.id+'"></iframe>')
            //document.getElementById('iframe').src = el.id;
            //document.getElementById('iframe').style.display = 'block';
            //document.location.href = window.location.pathname.replace(/[^/]+$/,'')+el.id;
        }
    });
});