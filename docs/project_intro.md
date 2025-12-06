# ApiPilot - VS Code API Client

## 1. Project Overview
**ApiPilot** is a powerful, integrated API client for Visual Studio Code, designed to replace external tools like Postman. It allows developers to test, debug, and manage HTTP requests directly within their code editor, improving productivity by reducing context switching.

**Icon Path**: `docs/icon.png`

## 2. Technology Stack
The project will leverage modern web technologies to ensure a responsive and maintainable codebase:

-   **Host Environment**: Visual Studio Code Extension API
-   **Language**: TypeScript (Strict mode recommended)
-   **UI Framework**: React (Latest version)
-   **Build Tool**: Vite (For bundling the Webview code)
-   **Component Library**: Material UI (MUI) v5/v6
-   **State Management**: React Context or Zustand (optional, depending on complexity)
-   **HTTP Client**: Axios or native Node.js `fetch` (handled in the Extension process to avoid CORS issues)
-   **Utils**: `curl-to-json` or similar for cURL import parsing.

## 3. Architecture
The extension follows a standard VS Code Webview architecture:

1.  **Extension Host (Main Process)**:
    -   Responsible for interacting with VS Code APIs (commands, storage, file system).
    -   Performs the actual HTTP requests to bypass browser CORS restrictions enforced in the Webview.
    -   Manages persistent data (History, Collections) using `globalState` or local files.
    -   Exposes a `WebviewPanel` to render the React application.

2.  **Webview (Renderer Process)**:
    -   A Single Page Application (SPA) built with Vite + React + MUI.
    -   Communicates with the Extension Host via the `acquireVsCodeApi()` messaging system (`postMessage`).
    -   Renders the UI for request composition and response visualization.

## 4. Core Features & Requirements

### 4.1 Request Composer
-   **Method Selection**: Dropdown to select HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS).
-   **URL Input**: Text field for the API endpoint.
-   **Tabs/Sections**:
    -   **Params**: Key-value pairs for Query Parameters.
    -   **Headers**: Key-value pairs for Request Headers.
    -   **Body**: Support for:
        -   Raw (JSON, Text, HTML, XML) - with syntax highlighting.
        -   Form-data (multipart).
        -   x-www-form-urlencoded.
    -   **Auth**: Basic Auth, Bearer Token.

### 4.2 Response Viewer
-   **Status Bar**: Show HTTP Status Code, Request Duration (ms), and Response Size.
-   **Body Viewer**:
    -   JSON/XML syntax highlighting.
    -   Collapsible/Expandable JSON nodes.
    -   Preview mode for HTML/Images.
-   **Headers**: List of response headers.

### 4.3 Data Management & Tools
-   **Import/Export**:
    -   **Import via cURL**: Paste a cURL command to auto-populate request details (Method, URL, Headers, Body).
    -   **Export**: Copy current request as cURL.
    -   (Optional) Postman Collection Import/Export.
-   **History**: Auto-save recent requests.
-   **Collections**: Group requests into folders/collections for organized testing.
-   **Environment Variables**: (Optional Phase 2) Support {{variable}} syntax in URLs and bodies.

## 5. Directory Structure Proposal

```
root
├── .vscode/                # VS Code launch configurations
├── docs/                   # Documentation
│   ├── project_intro.md    # This file
│   └── icon.png            # Extension Icon
├── src/
│   ├── extension/          # Extension Host Code
│   │   ├── main.ts         # Entry point (activate)
│   │   ├── SidebarProvider.ts
│   │   └── RequestHandler.ts # Logic to make HTTP requests
│   └── webview/            # React App (UI)
│       ├── src/
│       │   ├── components/ # MUI Components (RequestPanel, ResponsePanel, etc.)
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       └── vite.config.ts  # Vite configuration for Webview
├── package.json            # Main extension package.json
├── tsconfig.json
└── README.md
```

## 6. Development Workflow for AI
1.  **Initialization**: Set up the VS Code extension scaffold and the Vite React app structure.
2.  **UI Implementation**: Build the React UI using MUI components (Grid, TextField, Button, Tabs).
3.  **Communication Bridge**: Implement `postMessage` handlers in both Extension and Webview to pass request data.
4.  **Request Logic**: Implement the Node.js HTTP request handler in the Extension side.
5.  **Tools Implementation**: Add cURL parsing logic for import functionality.
6.  **State Persistence**: Implement saving/loading history and collections.

## 7. Key Implementation Details
-   **CORS Handling**: DO NOT make requests from the React app directly. Send the request details to the Extension Host, execute it using Node.js (e.g., `axios` or `node-fetch`), and send the response back to the Webview.
-   **Styling**: Use MUI's theming system to adapt to VS Code's light/dark/high-contrast themes. Monitor `document.body.classList` or VS Code CSS variables (e.g., `--vscode-editor-background`).

This document serves as the blueprint for the "ApiPilot" VS Code extension development.
