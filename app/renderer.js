const electron = require("electron");
const path = require('path');

const mainProcess = electron.remote.require('./main.js');
const currentWindow = electron.remote.getCurrentWindow();

const marked = require("marked");
const { ipcRenderer } = require("electron");

const markdownView = document.querySelector("#markdown");
const htmlView = document.querySelector("#html");
const newFileButton = document.querySelector("#new-file");
const openFileButton = document.querySelector("#open-file");
const saveMarkdownButton = document.querySelector("#save-markdown");
const revertButton = document.querySelector("#revert");
const saveHtmlButton = document.querySelector("#save-html");
const showFileButton = document.querySelector("#show-file");
const openInDefaultButton = document.querySelector("#open-in-default");

// Global variables for tracking current file
let currentFilePath = null;
let originalContent = '';

// ipcRenderer
// Receiving
// When we receive a file to open
ipcRenderer.on('file-opened', (event, content) => {
  //if the filePath is given
  if (content.path.length > 0) currentFilePath = content.path;
  if (content.text.length > 0) {
    originalContent = content.text;
    renderMarkdownToHtml(content.text);

    // When we open for the first time, the file has not been edited yet
    updateUserInterface(false);
  }
});

// helper function wrapping the marked module
const renderMarkdownToHtml = (markdown) => {
  markdownView.value = markdown;
  htmlView.innerHTML = marked(markdown);
};

// helper function to update the title bar
const updateUserInterface = (isEdited) => {
  let title = 'Markdown Editor';
  if (currentFilePath) title = `${path.basename(currentFilePath)} - ${title}`;
  if (isEdited) title = `${title} (Edited)`
  
  // Set the window properties
  currentWindow.setTitle(title);
  currentWindow.setDocumentEdited(isEdited);

  // Enable buttons based on whether we are in an edited file
  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;
}

// Pass the plain-text to the rendered markdown div
markdownView.addEventListener("keyup", (event) => {
  const currentContent = event.target.value;
  
  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

// Open File Action
openFileButton.addEventListener("click", () => {
  ipcRenderer.send('open-file');
});

// New File Action
newFileButton.addEventListener("click", () => {
  mainProcess.createWindow();
});
