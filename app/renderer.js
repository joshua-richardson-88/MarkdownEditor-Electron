const electron = require("electron");
const fs = require('fs');

const dialog = electron.remote.dialog;
const mainProcess = electron.remote.require('./main.js')

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
  }
});

// helper function wrapping the marked module
const renderMarkdownToHtml = (markdown) => {
  markdownView.value = markdown;
  htmlView.innerHTML = marked(markdown);
};

// Pass the plain-text to the rendered markdown div
markdownView.addEventListener("keyup", (event) => {
  const currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
});

// Open File Action
openFileButton.addEventListener("click", () => {
  ipcRenderer.send('open-file');
});

// New File Action
newFileButton.addEventListener("click", () => {
  mainProcess.createWindow();
});
