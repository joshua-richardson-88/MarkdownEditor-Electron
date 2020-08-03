const { remote, ipcRenderer } = require("electron");
const mainProcess = remote.require("./main.js");
const currentWindow = remote.getCurrentWindow();

const marked = require("marked");

const markdownView = document.querySelector("#markdown");
const htmlView = document.querySelector("#html");
const newFileButton = document.querySelector("#new-file");
const openFileButton = document.querySelector("#open-file");
const saveMarkdownButton = document.querySelector("#save-markdown");
const revertButton = document.querySelector("#revert");
const saveHtmlButton = document.querySelector("#save-html");
const showFileButton = document.querySelector("#show-file");
const openInDefaultButton = document.querySelector("#open-in-default");

// ipcRenderer channels
// Sending

// Receiving
// When a file is opened, render the file as markdown
ipcRenderer.on("file-opened", (event, file, content) => {
  markdownView.value = content;
  renderMarkdownToHtml(content);
});

// helper function wrapping the marked module
const renderMarkdownToHtml = (markdown) => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

// Pass the plain-text to the rendered markdown div
markdownView.addEventListener("keyup", (event) => {
  const currentContent = event.target.value;
  renderMarkdownToHtml(currentContent);
});

// Open File Action
openFileButton.addEventListener("click", () => {
  mainProcess.getFileFromUser(currentWindow);
});
