const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs");

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

// Wrapper function for dialog.showOpenDialog
// We assign getFilesFrom user to the exports object to be used in renderer process
const getFileFromUser = (exports.getFileFromUser = () => {
  // Triggers the OS's Open File dialog box, passing in config arguments
  // Passing in mainWindow allows macOS to display the dialog box as a
  // sheet coming down from the title bar of the window. No effect in
  // Windows or Linux
  const files = dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Text Files", extensions: ["txt"] },
      { name: "Markdown Files", extensions: ["md", "markdown"] },
    ],
  });

  if (files) openFile(files[0]);
});

const openFile = (file) => {
  const content = fs.readFileSync(file).toString();

  // We send the name of the file and its content to the renderer
  // process over the "file-opened" channel
  mainWindow.webContents.send("file-opened", file, content);
};
