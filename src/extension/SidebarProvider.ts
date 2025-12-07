import * as vscode from 'vscode';
import { RequestHandler } from './RequestHandler';
import { RequestPanel } from './RequestPanel';
import { ExamplePanel } from './ExamplePanel';
import { EnvironmentPanel } from './EnvironmentPanel';

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    private _outputChannel: vscode.OutputChannel;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._extensionUri = _context.extensionUri;
        this._outputChannel = vscode.window.createOutputChannel('ApiPilot Debug');
    }

    private readonly _extensionUri: vscode.Uri;

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        this._outputChannel.appendLine('resolveWebviewView called');

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'executeRequest': {
                    try {
                        this._outputChannel.appendLine(`Executing request: ${JSON.stringify(data.payload)}`);
                        const response = await RequestHandler.makeRequest(data.payload);
                        webviewView.webview.postMessage({
                            type: 'executeResponse',
                            payload: response
                        });
                    } catch (error) {
                        this._outputChannel.appendLine(`Error executing request: ${error}`);
                        webviewView.webview.postMessage({
                            type: 'executeResponse',
                            payload: { error: String(error) }
                        });
                    }
                    break;
                }
                case 'parseCurl': {
                    try {
                        this._outputChannel.appendLine(`Parsing cURL: ${data.value}`);
                        // Mock parsing for now
                        const mockParsed = {
                            method: 'GET',
                            url: 'https://example.com',
                            headers: {},
                            body: null
                        };

                        webviewView.webview.postMessage({
                            type: 'parseCurlSuccess',
                            payload: mockParsed
                        });
                    } catch (e) {
                        this._outputChannel.appendLine(`Error parsing cURL: ${e}`);
                        vscode.window.showErrorMessage('Error parsing cURL: ' + e);
                    }
                    break;
                }
                case 'onInfo': {
                    if (!data.value) {
                        return;
                    }
                    this._outputChannel.appendLine(`Info from Webview: ${data.value}`);
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case 'onError': {
                    if (!data.value) {
                        return;
                    }
                    this._outputChannel.appendLine(`Error from Webview: ${data.value}`);
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
                case 'createRequest': {
                    vscode.commands.executeCommand('apipilot.createRequest');
                    break;
                }
                case 'openRequest': {
                    RequestPanel.createOrShow(this._context, data.payload);
                    break;
                }
                case 'openExample': {
                    ExamplePanel.createOrShow(this._context, data.payload);
                    break;
                }
                case 'openEnvironmentEditor': {
                    EnvironmentPanel.createOrShow(this._context, data.payload);
                    break;
                }
                case 'log': {
                    this._outputChannel.appendLine(`Log from Webview: ${data.value}`);
                    break;
                }
                case 'getCollections': {
                    const collections = this._context.globalState.get('apipilot.collections', []);
                    webviewView.webview.postMessage({
                        type: 'updateCollections',
                        payload: collections
                    });
                    break;
                }
                case 'saveCollections': {
                    await this._context.globalState.update('apipilot.collections', data.payload);
                    break;
                }
                case 'getEnvironments': {
                    const envs = this._context.globalState.get('apipilot.environments', []);
                    webviewView.webview.postMessage({
                        type: 'updateEnvironments',
                        payload: envs
                    });
                    break;
                }
                case 'saveEnvironments': {
                    await this._context.globalState.update('apipilot.environments', data.payload);
                    break;
                }
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    public refresh() {
        if (this._view) {
            const collections = this._context.globalState.get('apipilot.collections', []);
            this._view.webview.postMessage({
                type: 'updateCollections',
                payload: collections
            });

            const environments = this._context.globalState.get('apipilot.environments', []);
            this._view.webview.postMessage({
                type: 'updateEnvironments',
                payload: environments
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const isDev = this._context.extensionMode === vscode.ExtensionMode.Development;

        let scriptUri = '';
        let styleResetUri = '';

        if (isDev) {
            scriptUri = 'http://localhost:5173/src/main.tsx';
            // In dev mode, styles are usually injected by Vite, but we might need reset
            styleResetUri = 'http://localhost:5173/src/index.css';
        } else {
            scriptUri = webview
                .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'dist', 'assets', 'index.js'))
                .toString();
            styleResetUri = webview
                .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'dist', 'assets', 'index.css'))
                .toString();
        }

        this._outputChannel.appendLine(`Mode: ${isDev ? 'Development' : 'Production'}`);
        this._outputChannel.appendLine(`Script URI: ${scriptUri}`);

        const nonce = getNonce();

        const csp = isDev
            ? `default-src 'none'; connect-src ${webview.cspSource} https: http://localhost:5173 ws://localhost:5173 data:; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline' http://localhost:5173; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval' http://localhost:5173; font-src ${webview.cspSource} https: data:;`
            : `default-src 'none'; connect-src ${webview.cspSource} https: data:; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval'; font-src ${webview.cspSource} https: data:;`;

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="${csp}">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				${!isDev ? `<link href="${styleResetUri}" rel="stylesheet">` : ''}
				<title>ApiPilot</title>
                <script nonce="${nonce}">
                    window.viewType = 'sidebar';
                </script>
                <script nonce="${nonce}">
                    // Acquire API once and store globally
                    try {
                        const vscode = acquireVsCodeApi();
                        window.vscode = vscode;
                    } catch (e) {
                        console.error("Failed to acquire vscode api", e);
                    }

                    const vscode = window.vscode;
                    
                    // Override console.log to send messages to extension
                    const originalLog = console.log;
                    console.log = function(...args) {
                        originalLog.apply(console, args);
                        if (vscode) {
                            vscode.postMessage({ type: 'log', value: args.join(' ') });
                        }
                    };

                    const originalError = console.error;
                    console.error = function(...args) {
                        originalError.apply(console, args);
                        if (vscode) {
                            vscode.postMessage({ type: 'onError', value: args.join(' ') });
                        }
                    };
                </script>
                ${
                    isDev
                        ? `
                    <script type="module" nonce="${nonce}">
                        import RefreshRuntime from "http://localhost:5173/@react-refresh"
                        RefreshRuntime.injectIntoGlobalHook(window)
                        window.$RefreshReg$ = () => {}
                        window.$RefreshSig$ = () => (type) => type
                        window.__vite_plugin_react_preamble_installed__ = true
                    </script>
                    <script type="module" nonce="${nonce}" src="http://localhost:5173/@vite/client"></script>
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                `
                        : `
                    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
                `
                }
			</head>
			<body>
				<div id="root"></div>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
