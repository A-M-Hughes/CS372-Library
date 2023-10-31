function updateTime() {
    const time = new Date();
    const currentTime = `${time.getHours()}:${time.getMinutes() }:${time.getSeconds()}`;
    document.getElementById("current-time").innerHTML = currentTime;
}

// Update time every second
setInterval(updateTime, 1000);
