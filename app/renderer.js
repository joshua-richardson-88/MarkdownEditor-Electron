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
const toast = document.querySelector('#toast');

// Global variables for tracking current file
let currentFilePath = null;
let originalContent = '';

// ipcRenderer
// Receiving
// When we receive a file to open
ipcRenderer.on('file-opened', (event, content) => {
  //if the filePath is given
  if (content.path.length > 0) {
    currentFilePath = content.path;
    currentWindow.setRepresentedFilename(content.path);
  }
  if (content.text.length > 0) {
    originalContent = content.text;
    renderMarkdownToHtml(content.text);

    // When we open for the first time, the file has not been edited yet
    updateUserInterface(false);
  }
});

// After a file has been saved
ipcRenderer.on('file-saved', (event, message) => {
  // sets the message for the toast
  toast.innerHTML = `<span>${message.text}</span>`;
  // assigns the color scheme, and makes the toast visible
  toast.classList.toggle(message.status);
  toast.classList.toggle('hide');
  // after 2 seconds, hide the toast and remove any styling
  setTimeout(() => { 
    toast.classList.toggle('hide');
    toast.remove('success', 'error');
  }, 2000);
})

// helper function wrapping the marked module
const renderMarkdownToHtml = (markdown) => {
  markdownView.value = markdown;
  htmlView.innerHTML = marked(markdown);
};

// helper function to update the title bar
const updateUserInterface = (isEdited) => {
  console.log('edited: ' + isEdited);
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
markdownView.addEventListener("input", (event) => {
  const currentContent = event.target.value;

  console.log(currentContent);
  console.log(originalContent);
  
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

// Export the file as HTML Action
saveHtmlButton.addEventListener('click', () => {
  let page = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
      <title>${currentFilePath}</title>
    </head>
    <body>
      ${htmlView.innerHTML}
    </body>
  </html>  
  `;
  ipcRenderer.send('export-html', page);
})

// Save the file
saveMarkdownButton.addEventListener('click', () => {
  // send the content to the main process for saving
  ipcRenderer.send('save-file', currentFilePath, markdownView.value);
  originalContent = markdownView.value;
})

// Revert to previous state action
revertButton.addEventListener('click', () => {
  markdownView.value = originalContent;
  renderMarkdownToHtml(originalContent);
});

document.addEventListener('dragenter', (event) => {
  console.log(event.dataTransfer);
})