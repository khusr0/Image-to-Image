const input = document.querySelector('#fileInput');
const dropzone = document.querySelector('#dropzone');
const thumbs = document.querySelector('#thumbs');
const promptField = document.querySelector('#prompt');
const countLabel = document.querySelector('#imageCount');
const charCount = document.querySelector('#charCount');
const generateButton = document.querySelector('#generate');
const toast = document.querySelector('#toast');
const keyDialog = document.querySelector('#keyDialog');
const apiKeyInput = document.querySelector('#apiKeyInput');
let files = [];
let previewUrls = [];

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateFiles(incoming) {
  const valid = [...incoming].filter(file => file.type.startsWith('image/'));
  if (!valid.length) return notify('Choose an image file to get started.');
  const remaining = Math.max(0, 8 - files.length);
  if (valid.length > remaining) notify('You can add up to 8 images.');
  files = [...files, ...valid.slice(0, remaining)];
  renderFiles();
}

function renderFiles() {
  previewUrls.forEach(URL.revokeObjectURL);
  previewUrls = [];
  thumbs.replaceChildren();
  files.forEach((file, index) => {
    const url = URL.createObjectURL(file);
    previewUrls.push(url);
    const item = document.createElement('div');
    item.className = 'thumb';
    const img = document.createElement('img');
    img.src = url;
    img.alt = file.name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${file.name}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => { files.splice(index, 1); renderFiles(); });
    item.append(img, remove);
    thumbs.append(item);
  });
  if (files.length < 8 && files.length) {
    const add = document.createElement('button');
    add.className = 'thumb add-more';
    add.type = 'button';
    add.setAttribute('aria-label', 'Add more images');
    add.textContent = '+';
    add.addEventListener('click', () => input.click());
    thumbs.append(add);
  }
  countLabel.textContent = files.length ? `${files.length} of 8 images` : 'Add up to 8 images';
}

input.addEventListener('change', event => {
  updateFiles(event.target.files);
  input.value = '';
});
['dragenter', 'dragover'].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.add('dragging');
}));
['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.remove('dragging');
}));
dropzone.addEventListener('drop', event => updateFiles(event.dataTransfer.files));

promptField.addEventListener('input', () => { charCount.textContent = `${promptField.value.length} / 600`; });
document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => {
  promptField.value = button.dataset.prompt;
  promptField.dispatchEvent(new Event('input'));
  promptField.focus();
}));

function fileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function generateWithGemini(apiKey) {
  const imageParts = await Promise.all(files.map(async file => ({
    inline_data: { mime_type: file.type, data: await fileAsBase64(file) }
  })));
  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: promptField.value.trim() }, ...imageParts] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Gemini request failed. Check your API key and try again.');
  const image = result.candidates?.flatMap(candidate => candidate.content?.parts || []).find(part => part.inlineData?.data);
  if (!image) throw new Error('Gemini returned no image. Try a more specific prompt.');
  return `data:${image.inlineData.mimeType || 'image/png'};base64,${image.inlineData.data}`;
}

generateButton.addEventListener('click', async () => {
  if (!files.length) { notify('Upload at least one image first.'); return; }
  if (!promptField.value.trim()) { promptField.focus(); notify('Add a little direction for your creation.'); return; }
  const apiKey = sessionStorage.getItem('gemini-api-key');
  if (!apiKey) {
    document.querySelector('#keyError').textContent = '';
    document.querySelector('#clearKeyButton').classList.add('hidden');
    keyDialog.showModal();
    apiKeyInput.focus();
    return;
  }
  const empty = document.querySelector('#emptyState');
  const loading = document.querySelector('#loadingState');
  const output = document.querySelector('#generatedState');
  empty.classList.add('hidden');
  output.classList.add('hidden');
  loading.classList.remove('hidden');
  generateButton.disabled = true;
  document.querySelector('#resultMessage').textContent = 'Generating with Gemini…';
  try {
    const dataUrl = await generateWithGemini(apiKey);
    document.querySelector('#outputImage').src = dataUrl;
    loading.classList.add('hidden');
    output.classList.remove('hidden');
    document.querySelector('#resultMessage').textContent = 'Generated with Gemini · Your image is ready';
    document.querySelector('#downloadLink').disabled = false;
    document.querySelector('#regenerate').disabled = false;
    document.querySelector('#downloadButton').onclick = () => download(dataUrl);
    document.querySelector('#downloadLink').onclick = () => download(dataUrl);
  } catch (error) {
    loading.classList.add('hidden');
    empty.classList.remove('hidden');
    const message = error.message || 'Something went wrong. Please try again.';
    document.querySelector('#resultMessage').textContent = `Generation failed · ${message}`;
    notify(message);
  } finally { generateButton.disabled = false; }
});

function download(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gemini-studio-preview.jpg';
  link.click();
}

document.querySelector('#regenerate').addEventListener('click', () => generateButton.click());
document.querySelector('#newProject').addEventListener('click', () => {
  files = []; renderFiles(); promptField.value = ''; promptField.dispatchEvent(new Event('input'));
  document.querySelector('#generatedState').classList.add('hidden');
  document.querySelector('#loadingState').classList.add('hidden');
  document.querySelector('#emptyState').classList.remove('hidden');
  document.querySelector('#downloadLink').disabled = true;
  document.querySelector('#regenerate').disabled = true;
  document.querySelector('#resultMessage').textContent = 'Your generated image will appear here';
});
document.querySelector('#historyButton').addEventListener('click', () => notify('Your recent creations will appear here.'));
function openKeyDialog() {
  document.querySelector('#keyError').textContent = '';
  apiKeyInput.value = '';
  document.querySelector('#clearKeyButton').classList.toggle('hidden', !sessionStorage.getItem('gemini-api-key'));
  keyDialog.showModal();
  apiKeyInput.focus();
}

document.querySelector('#apiKeyButton').addEventListener('click', openKeyDialog);
document.querySelector('#closeKeyDialog').addEventListener('click', () => keyDialog.close());
document.querySelector('#cancelKeyDialog').addEventListener('click', () => keyDialog.close());
document.querySelector('#keyForm').addEventListener('submit', event => {
  event.preventDefault();
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    document.querySelector('#keyError').textContent = 'Enter a Gemini API key to continue.';
    apiKeyInput.focus();
    return;
  }
  sessionStorage.setItem('gemini-api-key', apiKey);
  apiKeyInput.value = '';
  keyDialog.close();
  generateButton.click();
});
document.querySelector('#clearKeyButton').addEventListener('click', () => {
  sessionStorage.removeItem('gemini-api-key');
  keyDialog.close();
  notify('Saved Gemini API key removed from this tab.');
});
