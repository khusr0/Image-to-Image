# Image Studio

Image Studio is a small browser-based image-to-image tool. Add reference images, describe the image you want, and send both to Google’s Gemini image-generation API. The generated image appears in the result canvas and can be downloaded.

## Features

- Add up to eight image files using the file picker or drag and drop.
- Preview and remove selected references before generating.
- Describe the desired result in a prompt (up to 600 characters) or start from a prompt suggestion.
- Generate an image with the `gemini-3.1-flash-image` model.
- View the generated image in the canvas, regenerate, and download the result.
- Enter a Gemini API key in the in-app dialog. The key is kept in the current browser tab’s `sessionStorage` and can be removed from the API key dialog.
- Responsive dark interface for desktop and smaller screens.

## Technology

The application is built with browser-native technologies:

- HTML (`index.html`)
- CSS (`style.css`)
- JavaScript (`app.js`)
- The browser Fetch API for Gemini requests, `FileReader` for image encoding, and `sessionStorage` for the session-only API key
- Google Gemini API, called directly from the browser

There is no package manifest, framework, build step, or third-party JavaScript dependency in the repository.

## Requirements

- A modern browser with support for the HTML dialog element, Fetch, FileReader, and `sessionStorage`.
- Python 3 to use the simple local server command below (or another local static HTTP server).
- A Gemini API key with access to the image-generation model used by the app. Create or manage a key in [Google AI Studio](https://aistudio.google.com/apikey).

## Run locally

From the project root, start Python’s built-in static file server:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser. Stop the server with `Ctrl+C` in the terminal when you are done.

To generate an image, add one or more references, enter a prompt, click **Generate**, and enter your Gemini API key when the dialog appears. The key remains available to the current browser tab until that tab’s session ends, or until you remove it using **API key**.

## Configuration and privacy

No environment file or server-side configuration is used. The app sends the prompt and selected image data directly from the browser to Google’s Gemini API at:

```text
https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent
```

The API key is stored in the current tab’s `sessionStorage` and included in the request to Google. This is a client-side demo, not a secure production credential flow: browser storage and requests are accessible to the browser environment. Do not embed a private or shared production key in a public deployment. A production version should make authenticated requests through a protected backend.

## Example images

No example images or screenshots are currently included in the repository.

## Known limitations

- The application calls Gemini directly from the browser. It has no backend, account system, server-side key protection, or usage controls.
- Generation requires a valid API key and network access to Google’s Gemini API. This repository does not include a live API credential, so a real generation cannot be run from the project alone.
- The upload logic accepts image MIME types and limits the selection to eight files. Although the interface mentions a 20 MB per-image limit and lists PNG, JPG, and WEBP, the JavaScript does not enforce a file-size limit or restrict uploads to those formats.
- Recent creation names in the sidebar are static examples. The **Your creations** and **History** controls do not load or save previous generations; History currently displays a placeholder notice.
- There is no automated test suite or project-specific test command in the repository.

## Potential improvements

- Add a backend endpoint to protect API credentials and apply request limits.
- Implement persistent creation history with generated-image metadata and prompt details.
- Enforce upload size and format constraints in the file picker logic and provide clearer validation feedback.
- Add automated tests for upload validation, API error responses, generation states, and download behavior.
- Add representative screenshots and test the interface across browsers and viewport sizes.
