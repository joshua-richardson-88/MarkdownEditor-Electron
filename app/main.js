const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require('path');
const fs = require("fs");

// Add a set to track all of the windows
const windows = new Set();

// Add a map of all the files we're watching
const openFiles = new Map();


app.on("ready", () => {
  createWindow();
});

// Listen for open-file events, which provide the path of the externally
// opened file and then passes that file path to our openFile function
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
    // set up for security
    webPreferences: {
      nodeIntegration: false, // default, but good to ensure
      contextIsolation: true, // protect against prototype pollution attacks
      enableRemoteModule: false, // don't allow remote 
      preload: path.join(__dirname, "renderBridge.js") // use a preloaded script
    },
  });

  //Loads the app/index.html in the main window
  newWindow.webContents.loadURL(`file://${__dirname}/index.html`);

  // Shows the window when the DOM is loaded
  newWindow.once("ready-to-show", () => {
    newWindow.show();
  });

  // This is triggered once the X is clicked on the window, but before it
  // has actually closed
  newWindow.on('close', (event) => {
    event.preventDefault();

    // figure out if this window has edits
    let edited = getWindowEdited(newWindow);

    // if it has, then ...
    if (edited) {
      // warn the user about closing an edited document
      const result = dialog.showMessageBox(newWindow, {
        type: 'warning',
        title: 'Quit with Unsaved Changes?',
        message: 'Your changes will be lost if you do not save.',
        noLink: true, 
        buttons: [
          'Quit Without Saving',
          'Cancel'
        ],
        defaultId: 0,
        cancelId: 1
      })
      .then(results => {
        // if the user chooses to continue, then close the window
        if (results.response === 0) {
          newWindow.destroy(); // this passes to closed() event below
        }
      });

      // and if the user clicked cancel, then prevent 
      // the window from closing
      if (result === 1) event.preventDefault();
    } else {
      // then we prevented it from closing, so manually do it now
      newWindow.destroy();
    }
  })

  // Handles the cleanup after a user closed the browser window
  newWindow.on("closed", (event) => {
    windows.delete(newWindow); // remove the window from the set
    stopWatchingFile(newWindow); // stop listening for changes in the file
    newWindow = null; // and clears the browser window from memory
  });

  // Add the newly created window to the windows set and then return it
  windows.add({window: newWindow, isEdited: false });
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

// A function to watch for changes in open files
const startWatchingFiles = (targetWindow, filePath) => {
  // Closes the existing watcher if there is one
  stopWatchingFile(targetWindow);

  // create a watcher object, and if it fires a "change" event, send the changes back
  const watcher = fs.watchFile(filePath, (event) => {
    targetWindow.reply('file-opened', packageFile(filePath));
  });

  // Track the watcher so we can stop it later.
  openFiles.set(targetWindow, watcher);
}

const stopWatchingFile = (targetWindow) => {
  // Check if we have a watcher running for this window
  if (openFiles.has(targetWindow)) {
    // Stop the watcher object from listening for changes
    openFiles.get(targetWindow).stop();
    // Delete the watcher from our list of watchers
    openFiles.delete(targetWindow);
  }
}

const setWindowEdited = (event, {key, value}) => {
  let currentWindow = BrowserWindow.fromWebContents(event.sender);

  for (const window of windows) {
    if (currentWindow === window.window) {
      if (window.hasOwnProperty(key)) {
        window[key] = value;
      }
    }
  }
}

const getWindowEdited = (windowToFind) => {
  for (const window of windows) {
    if (windowToFind === window.window) {
      return window.isEdited
    }
  }
}

const openFile = async (event, path) => {
  dialog.showOpenDialog(event.sender, {
    title: "Choose a markdown file to open",
    defaultPath: "C:\\Users\\jrichardson\\Documents\\Programming\\Full Stack\\Electron in Motion",
    buttonLabel: "Choose File",
    properties: ["openFile"],
    filters: [
      { name: "Text Files", extensions: ["txt"] },
      { name: "Markdown Files", extensions: ["md", "markdown"] },
    ],
  }).then(result => return result)
}

// ipcMain functionality
// Receiving
// Open a file 
ipcMain.on('open-file', (event, path) => {
  let file = await openFile(event);
  console.log(file);

  /*dialog.showOpenDialog(event.sender, {
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

        // start watching for external changes on the file
        startWatchingFiles(event, results.filePaths[0]);

        //otherwise return the contents of the file, and set the file in the OS recently viewed section
        event.reply('file-opened', packageFile(results.filePaths[0]));
      }
    })
    .catch(err => console.log(err));;
  */
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
  }).then(results => {
    if (results.filePath) {
      fs.writeFileSync(results.filePath, content);
    }
  }).catch(err => console.log(err));
});

// Save the markdown to the file path
ipcMain.on('save-file', (event, content) => {
  // if this is a new file, bring up the save file dialog for 
  // the user to choose
  if (!content.path) {
    dialog.showSaveDialog(event.sender, {
      title: 'Save Markdown',
      defaultPath: app.getPath('documents'),
      filters: [
        { name: 'Markdown Files', extensions: ['md', 'markdown'] }
      ]
    }).then(results => {
      if (results.filePath) {
        fs.writeFileSync(results.filePath, content.text);
        app.addRecentDocument(results.filePath);
      }
      // set the window to not being edited anymore
      setWindowEdited(event, { isEdited: false });
      event.reply('file-saved', { text: 'File Saved Successfully', status: 'success' });
    }).catch(err => event.reply('file-saved', { text: `File not saved successfully. ${err.message}`, status: 'error' }))
  } else {
    //otherwise, save the file
    fs.writeFileSync(content.path, content.text);
    setWindowEdited(event, false);
    event.reply('file-saved', { text: 'File Saved Successfully', status: 'success' });
  }
});

// Open a new application window
ipcMain.on('create-window', (event, args) => {
  createWindow();
});

// Sets the BrowserWindow's edited property
ipcMain.on('set-edited', (event, isEdited) => {
  setWindowEdited(event, isEdited);
});