let scanBuffer = '';
let scanTimeout;

document.getElementById('rfid-input').addEventListener('keydown', (event) => {
    // Ignore special keys
    if (event.key.length === 1) {
        scanBuffer += event.key; 
    }

    // Reset timer
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
        if (scanBuffer) {
            console.log("Scanned RFID:", scanBuffer); // ✅ will always log
            processStudentId(scanBuffer);
            scanBuffer = ''; // reset
        }
    }, 200); // 200ms = end of scan
});
