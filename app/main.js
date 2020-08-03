const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");

// Add a set to track all of the windows
const windows = new Set();

app.on("ready", () => {
  createWindow();
});

// Create a window when application is open and there are no windows
// Also for macOS
app.on("activate", (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) createWindow();
});

// Prevent electron from killing app on macOS
app.on("window-all-closed", () => {
  if (process.platform === "darwin") return false;
  // quits the app if it isn't mac
  app.quit();
});

// A function to create a new Browser window
const createWindow = (exports.createWindow = () => {
  let x, y;

  // Gets the browser window that is currently active
  const currentWindow = BrowserWindow.getFocusedWindow();

  // if there is a current window, get its positions and move down and to the right
  if (currentWindow) {
    const [currentWindowX, currentWindowY] = currentWindow.getPosition();
    x = currentWindowX + 25;
    y = currentWindowY + 25;
  }

  let newWindow = new BrowserWindow({
    x, // set the position of the window
    y,
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
    newWindow.show();
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
const getFileForUser = (targetWindow) => {
  // Triggers the OS's Open File dialog box, passing in config arguments
  // Passing in mainWindow allows macOS to display the dialog box as a
  // sheet coming down from the title bar of the window. No effect in
  // Windows or Linux
  const files = dialog.showOpenDialog(targetWindow, {
    title: "Choose a markdown file to open",
    defaultPath: "C:\\",
    buttonLabel: "Choose File",
    properties: ["openFile"],
    filters: [
      { name: "Text Files", extensions: ["txt"] },
      { name: "Markdown Files", extensions: ["md", "markdown"] },
    ],
  });

  // pass the reference to the requesting window, and the file
  console.log(files);
  if (files) openFile(targetWindow, files[0]);
};

const openFile = exports.openFile = (targetWindow, file) => {
  const content = fs.readFileSync(file).toString();

  // We send the name of the file and its content to the renderer
  // process over the "file-opened" channel of the requesting window
  targetWindow.send("file-opened", file, content);
};


// ipcMain functionality
// Receiving
ipcMain.on('open-file', (event, path) => {
  // showOpenDialog returns a promise - pass in the window for macOS sheets displaying
  // pass in parameters
  dialog.showOpenDialog(event.sender, {
    title: "Choose a markdown file to open",
    defaultPath: "C:\\Users\\jrichardson\\Documents\\Programming\\Full Stack\\Electron in Motion",
    buttonLabel: "Choose File",
    properties: ["openFile"],
    filters: [
      { name: "Text Files", extensions: ["txt"] },
      { name: "Markdown Files", extensions: ["md", "markdown"] },
    ],
  })
  .then(results => {
    // if the user cancelled the window, return nothing
    if (results.canceled) {
      event.reply('file-opened', '');
    } else {
      //otherwise return the text for the markdown
    event.reply('file-opened', fs.readFileSync(results.filePaths[0]).toString());
    }
  })
  .catch(err => console.log(err));
});