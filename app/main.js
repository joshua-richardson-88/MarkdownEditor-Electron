const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");

// Add a set to track all of the windows
const windows = new Set();

app.on("ready", () => {
  createWindow();
});

// Listen for open-file events, which provide the path of the externally opened file and then passes that file path to our openFile function
app.on('will-finish-launching', () => {
  app.on('open-file', (event, file) => {
    const win = createWindow();
    win.once('ready-to-show', () => {
      win.webContents.send('file-opened', packageFile(file));
    })
  })
})

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

// A function to generate the opened file content
const packageFile = (filePath) => {
  app.addRecentDocument(filePath);
  let content = {
    path: filePath,
    text: fs.readFileSync(filePath).toString()
  };
  return content;
}

// ipcMain functionality
// Receiving
// Open a file 
ipcMain.on('open-file', (event, path) => {
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
      event.reply('file-opened', "");
    } else {
      //otherwise return the contents of the file, and set the file in the OS recently viewed section
      event.reply('file-opened', packageFile(results.filePaths[0]));
    }
  })
  .catch(err => console.log(err));;
});

// Export the file as HTML
ipcMain.on('export-html', (event, content) => {
  dialog.showSaveDialog(event.sender, {
    title: 'Save HTML',
    defaultPath: app.getPath('documents'),
    buttonLabel: 'Save file',
    filters: [
      { name: 'HTML Files', extensions: ['html', 'htm'] }
    ]
  }).then (results => {
    if (results.filePath) {
      fs.writeFileSync(results.filePath, content);
    }
  }).catch(err => console.log(err));
});

ipcMain.on('save-file', (event, path, content) => {
  // if this is a new file, bring up the save file dialog for the user to choose
  if (!path) {
    dialog.showSaveDialog(event.sender, {
      title: 'Save Markdown',
      defaultPath: app.getPath('documents'),
      filters: [
        { name: 'Markdown Files', extensions: ['md', 'markdown'] }
      ]
    }).then( results => {
      if (results.filePath) {
        fs.writeFileSync(results.filePath, content);
        app.addRecentDocument(results.filePath);
      }
    })
  } else {
    //otherwise, save the file
    fs.writeFileSync(path, content);
  }
})