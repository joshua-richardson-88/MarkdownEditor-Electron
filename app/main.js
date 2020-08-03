const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs");

// Add a set to track all of the windows
const windows = new Set();

app.on("ready", () => {
  createWindow();
});

// A function to create a new Browser window
const createWindow = (exports.createWindow = () => {
  // Decalres mainWindow at the top level so that it won't be collected as garbage after the "ready" event completes
  let newWindow = new BrowserWindow({
    // hide the window when it's first created
    show: false,
    // allow us to use require in HTML
    webPreferences: {
      nodeIntegration: true,
    },
  });

  //Loads the app/index.html in the main window
  newWindow.webContents.loadURL(`file://${__dirname}/index.html`);

  // Shows the window when the DOM is loaded
  newWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Remove the reference from the windows set when we close the browser window
  newWindow.on("closed", () => {
    windows.delete(newWindow);
    newWindow = null;
  });

  // Add the newly created window to the windows set and then return it
  windows.add(newWindow);
  return newWindow;
});

// Wrapper function for dialog.showOpenDialog
// We assign getFilesFrom user to the exports object to be used in renderer process
// We pass a reference to the window requesting the file
const getFileFromUser = (exports.getFileFromUser = (targetWindow) => {
  // Triggers the OS's Open File dialog box, passing in config arguments
  // Passing in mainWindow allows macOS to display the dialog box as a
  // sheet coming down from the title bar of the window. No effect in
  // Windows or Linux
  const files = dialog.showOpenDialog(targetWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Text Files", extensions: ["txt"] },
      { name: "Markdown Files", extensions: ["md", "markdown"] },
    ],
  });

  // pass the reference to the requesting window, and the file
  if (files) openFile(targetWindow, files[0]);
});

const openFile = (exports.openFile = (targetWindow, file) => {
  const content = fs.readFileSync(file).toString();

  // We send the name of the file and its content to the renderer
  // process over the "file-opened" channel of the requesting window
  targetWindow.webContents.send("file-opened", file, content);
});
