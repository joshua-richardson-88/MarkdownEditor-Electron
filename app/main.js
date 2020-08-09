const { app, ipcMain } = require("electron");
const path = require('path');
const fs = require("fs");

// Require the windows factory function to track all of the windows
const windows = require('./Window').windows;

// Require the dialog factory function to deal with the various dialogs
const dialog = require('./Dialog').dialog;

const pathToIndex = `file://${__dirname}/index.html`;
const pathToBridge = path.join(__dirname, "renderBridge.js");

// Add a map of all the files we're watching
const openFiles = new Map();

// Supported File Types
const fileTypes = ['md', 'markdown', 'txt'];
const defaultPath = app.getPath('documents');


app.on("ready", () => {
  windows.create(pathToIndex, pathToBridge);
});

// Listen for open-file events, which provide the path of the externally
// opened file and then passes that file path to our openFile function
app.on('will-finish-launching', () => {
  app.on('open-file', (event, file) => {
    const win = windows.create(pathToIndex, pathToBridge);
    win.once('ready-to-show', () => {
      win.webContents.send('file-opened', packageFile(file));
    })
  })
})

// Create a window when application is open and there are no windows
// Also for macOS
app.on("activate", (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) windows.create(pathToIndex, pathToBridge);
});

// Prevent electron from killing app on macOS
app.on("window-all-closed", () => {
  if (process.platform === "darwin") return false;
  // quits the app if it isn't mac
  app.quit();
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
const startWatchingFiles = (event, filePath) => {
  // Closes the existing watcher if there is one
  let currentWindow = windows.getWindow(event);

  // if there are no currently watched files, don't delete them
  if (openFiles.size > 0) stopWatchingFile(currentWindow)

  // create a watcher object, and if it fires a "change" event, send the changes back
  const watcher = fs.watchFile(filePath, (event) => {
    dialog.externalUnsaved(currentWindow)
      .then(user => {
        if (user.response === 0) {
          currentWindow.webContents.send('file-opened', packageFile(filePath))
        }
      })
      .catch(error => console.log(error));
  });

  // Track the watcher so we can stop it later.
  openFiles.set(currentWindow, watcher);
}

const stopWatchingFile = (windowToClose) => {
  if (openFiles.has(windowToClose)) {
    openFiles.get(windowToClose).stop();
    openFiles.delete(windowToClose);
  } else {
    console.log(`The map didn't have the specified window.`);
  }
}

const checkFileAllowed = (filePath) => {
  // get the extension of the file
  let ext = filePath.split('\\').pop().split('.')[1];

  // return whether the filetype is valid or not
  return (fileTypes.includes(ext)) ? true : false;
}

const chooseFile = (currentWindow, event, path = null) => {
  console.log('We either had no unsaved changes, or we are fine with wiping them')
  //check to see if I have a file already in mind
  if (path) {
    console.log('We got a path already')
    if (checkFileAllowed(path)) openFile(event, path);
  } else {
    console.log('We did not have a path to start with')
    // if no pre-determined file, ask the user
    dialog.open(currentWindow)
      .then(results => {
        console.log(`the user chose ${results.filePaths[0]}`)
        // and see if the user chose a valid file
        if (checkFileAllowed(results.filePaths[0])) openFile(event, results.filePaths[0]);
      })
      .catch(error => console.log(error));
  }
};

const openFile = (event, pathToOpen) => {
  // now that we have a filePath in mind, send to DOM 
  // or let the user know they chose the wrong thing
  if (pathToOpen) {
    console.log('the path was valid, send back to dom')
    startWatchingFiles(event, pathToOpen);
    event.reply('file-opened', packageFile(pathToOpen));
  } else {
    console.log('the path was invalid, display error')
    let options = {
      title: 'Invalid File',
      content: 'This application only supports .md, .markdown, and .txt files'
    };
    dialog.error(options);
  }
}

// ipcMain functionality
// Receiving
// Open a file 
ipcMain.on('open-file', (event, path) => {
  console.log(path);
  // Before we open a file, check to see if there is editing done on a file already there
  let currentWindow = windows.getWindow(event);
  let edited = windows.getEdited(currentWindow);

  console.log('An open file call was made.');
  console.log(`We got this path:`);
  console.log(path)

  // if there is an open, edited file - warn the users
  if (edited) {
    console.log('The document has unsaved changes')
    dialog.overwrite(currentWindow)
      .then(user => {
        // if the user chooses to continue, try to open a file
        if (user.response === 0) {
          chooseFile(currentWindow, event, path)
        }
      })
      .catch(err => console.log(err));
  } else {
    chooseFile(currentWindow, event, path);
  }
});

// Export the file as HTML
ipcMain.on('export-html', (event, content) => {
  let currentWindow = windows.getWindow(event);

  dialog.export(currentWindow, defaultPath)
    .then(results => {
      if (results.filePath) {
        fs.writeFileSync(results.filePath, content);
      }
    })
    .catch(err => console.log(err));
});

// Save the markdown to the file path
ipcMain.on('save-file', (event, content) => {
  // get window
  let currentWindow = windows.getWindow(event);
  // if the path property of content is empty, this is a new file
  if (!content.path) {
    dialog.saveNew(currentWindow, defaultPath)
      .then(results => {
        if (results.filePath) {
          fs.writeFileSync(results.filePath, content.text);
          app.addRecentDocument(results.filePath);
        }
        // set the window to not being edited anymore
        windows.setProp(event, 'isEdited', false);

        // send back to renderer that the file saved successfully
        event.reply('file-saved', { text: 'File Saved Successfully', status: 'success' });
      })
      .catch(err => event.reply('file-saved', { text: `File not saved successfully. ${err.message}`, status: 'error' }))
  } else {
    //otherwise, save the file
    fs.writeFileSync(content.path, content.text);
    windows.setProp(event, 'isEdited', false);
    event.reply('file-saved', { text: 'File Saved Successfully', status: 'success' });
  }
});

// Open a new application window
ipcMain.on('create-window', (event, args) => {
  windows.create(pathToIndex, pathToBridge);
});

// Sets the BrowserWindow's edited property
ipcMain.on('set-edited', (event, isEdited) => {
  windows.setProp(event, 'isEdited', isEdited);
});

// Closes a browser window
ipcMain.on('close-window', (event, args) => {
  // collect the window that's closing
  let windowToClose = windows.getWindow(event);

  // figure out if the window has unsaved changes
  let edited = windows.getEdited(windowToClose);

  // if there are unsaved changes, we need to let the user know
  if (edited) {
    dialog.quitUnsaved(windowToClose)
      .then(user => {
        // if the user chooses to quit still, close the window
        if (user.response === 0) {
          windowToClose.destroy()
        }
      })
      .catch(error => console.log(error));
  } else {
    // if the file wasn't edited, close the window
    windowToClose.destroy();
  }
});