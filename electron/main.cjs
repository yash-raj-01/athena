const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

let win = null;

function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 700,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
        },
    });

    win.loadURL("http://localhost:5173/");
    win.webContents.openDevTools({ mode: "detach" });
}
ipcMain.handle("full-screen", () => {
    win.kiosk = true;
});

let endTime = null;

ipcMain.handle("start-test", () => {
    endTime = Date.now() + 60 * 60 * 1000;
});

ipcMain.handle("get-time", () => {
    if (!endTime) return 0;
    return Math.max(0, endTime - Date.now());
});

ipcMain.handle("show-rules", async () => {
    const res = await dialog.showMessageBox(win, {
        type: "info",
        title: "Exam rules",
        message: "Please follow these rules:",
        detail: `1. Do not switch tabs or windows\n2. Webcam must remain enabled\n3. Any cheating will result in 0 marks`,
        buttons: ["Cancel", "Accept"],
        defaultId: 1,
    });
    return res.response;
});

const feedDir = path.join(__dirname, "cameraFeed");
if (!fs.existsSync(feedDir)) {
    fs.mkdirSync(feedDir, { recursive: true });
}

ipcMain.handle("save-photo", (_, arrayBuffer) => {
    const filePath = path.join(feedDir, `${Date.now()}.jpeg`);
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
});

app.whenReady().then(() => {
    createWindow();
});
