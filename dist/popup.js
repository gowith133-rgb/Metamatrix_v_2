document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.getElementById('terminal-output');
    
    function printLog(message) {
        const line = document.createElement('div');
        line.className = 'line';
        line.textContent = `> ${message}`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    printLog("Initializing sovereign cortex...");

    // Request telemetry from background.js
    chrome.runtime.sendMessage({ action: "getTelemetry" }, (response) => {
        if (response && response.data) {
            response.data.forEach((msg, index) => {
                setTimeout(() => {
                    printLog(msg);
                }, (index + 1) * 600); // Stagger the output for a terminal effect
            });
        } else {
            printLog("ERROR: Connection to Nexus background worker failed.");
        }
    });
});
