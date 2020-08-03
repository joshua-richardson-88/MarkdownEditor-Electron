const { app, BrowserWindow } = require("electron");

// Decalres mainWindow at the top level so that it won't be collected as garbage after the "ready" event completes
let mainWindow = null;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    // hide the window when it's first created
    show: false,
    // allow us to use require in HTML
    webPreferences: {
      nodeIntegration: true,
    },
  });

  //Loads the app/index.html in the main window
  mainWindow.webContents.loadURL(`file://${__dirname}/index.html`);

  // Shows the window when the DOM is loaded
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  //Sets the process back to null when the window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});
