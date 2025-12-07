# ApiPilot Project Instructions

## Overview

ApiPilot is a VS Code extension for API testing and management, similar to Postman but integrated into VS Code. It consists of a Webview-based UI (React) and an Extension backend (Node.js).

## Project Structure

- `src/extension`: VS Code extension source code (Node.js/TypeScript).
- `src/webview`: React application for the UI.
    - `src/webview/src/pages`: Main views (Sidebar, RequestEditor, etc.).
    - `src/webview/src/components`: Reusable UI components.

## Recent Changes

- **Theme Synchronization**: Implemented `useVsCodeTheme` hook to sync Monaco Editor background with VS Code theme.
- **Logging**: Unified logging to "ApiPilot Debug" output channel, removing duplicate channels.
- **Refactoring**: Split `RequestEditor` into `RequestConfig` and `ResponseViewer` for better maintainability.

## Development Workflow

1.  **Webview**: Run `npm run build` in `src/webview` to rebuild the UI.
2.  **Extension**: Run F5 in VS Code to launch the extension development host.

## Current Tasks

1.  **Import Feature**: Implement a full-page Import feature supporting:
    - Target Collection selection/creation.
    - Multi-line text input.
    - File Drag & Drop.
    - Auto-detection of format (OpenAPI, Swagger, cURL, Postman).
    - Creation of requests and folders in the selected collection.
