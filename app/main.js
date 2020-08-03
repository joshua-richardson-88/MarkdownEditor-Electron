const { app, BrowserWindow } = require("electron");

// Decalres mainWindow at the top level so that it won't be collected as garbage after the "ready" event completes
let mainWindow = null;

app.on("ready", () => {
  // Creates a new browser window and sets nodeIntegration to true
  // so that we can use node modules in the renderer process
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });

  //Loads the app/index.html in the main window
  mainWindow.webContents.loadURL(`file://${__dirname}/index.html`);

  //Sets the process back to null when the window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});
