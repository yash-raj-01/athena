const { BrowserWindow, app, ipcMain, dialog } = require("electron");

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

app.whenReady().then(() => {
    createWindow();
});
