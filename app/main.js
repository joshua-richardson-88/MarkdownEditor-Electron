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
    // Trigger file dialog here for now
    getFileFromUser();
  });

  //Sets the process back to null when the window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

// Wrapper function for dialog.showOpenDialog
const getFileFromUser = () => {
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

  if (!files) return;

  const file = files[0];

  // Read the file and convert the contents to a string
  const content = fs.readFileSync(file).toString();

  console.log(content);
};
