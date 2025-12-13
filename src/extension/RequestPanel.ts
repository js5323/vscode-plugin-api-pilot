import * as vscode from 'vscode';
import { RequestHandler } from './RequestHandler';
import { Logger } from './utils/Logger';
import { CodeGenerator } from './utils/CodeGenerator';
import { ApiRequest, CollectionItem, CollectionFolder, Environment } from '../webview/src/types';

export class RequestPanel {
    public static currentPanels = new Map<string, RequestPanel>();
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];
    private readonly _requestId?: string;

    public static createOrShow(context: vscode.ExtensionContext, request?: ApiRequest) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we have a request ID, check if we already have a panel for it
        if (request && request.id) {
            const existingPanel = RequestPanel.currentPanels.get(request.id);
            if (existingPanel) {
                existingPanel._panel.reveal(column);
                existingPanel._panel.webview.postMessage({
                    type: 'updateRequest',
                    payload: request
                });
                return;
            }
        }

        const panel = vscode.window.createWebviewPanel(
            'apipilot-request',
            request ? `${request.name}` : 'New Request',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'dist')],
                retainContextWhenHidden: true
            }
        );

        const requestPanel = new RequestPanel(panel, context, request);

        if (request && request.id) {
            RequestPanel.currentPanels.set(request.id, requestPanel);
        }
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, request?: ApiRequest) {
        this._panel = panel;
        this._extensionUri = context.extensionUri;
        this._context = context;
        this._requestId = request?.id;

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, request);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'executeRequest': {
                        try {
                            Logger.log('Execute Request Command Received');

                            const environments = this._context.globalState.get<Environment[]>(
                                'apipilot.environments',
                                []
                            );
                            const activeEnv = environments.find((e) => e.isActive);
                            const variables = activeEnv ? activeEnv.variables : [];

                            Logger.log(`Active Environment: ${activeEnv ? activeEnv.name : 'None'}`);

                            const response = await RequestHandler.makeRequest(message.payload, variables);

                            Logger.log(`Request Execution Completed. Status: ${response.status}`);

                            this._panel.webview.postMessage({
                                type: 'executeResponse',
                                payload: response
                            });
                        } catch (error: any) {
                            Logger.error('Unexpected Error in RequestPanel:', error);
                            this._panel.webview.postMessage({
                                type: 'executeResponse',
                                payload: {
                                    status: 0,
                                    statusText: 'Error',
                                    data: error.message || 'An unexpected error occurred',
                                    headers: {},
                                    duration: 0,
                                    size: 0
                                }
                            });
                        }
                        break;
                    }
                    case 'updateTitle': {
                        this._panel.title = message.value;
                        break;
                    }
                    case 'generateCodeSnippet': {
                        const { request, language } = message.payload;
                        const snippet = CodeGenerator.generate(request, language);
                        this._panel.webview.postMessage({
                            type: 'codeSnippetGenerated',
                            payload: snippet
                        });
                        break;
                    }
                    case 'onInfo': {
                        if (!message.value) return;
                        vscode.window.showInformationMessage(message.value);
                        break;
                    }
                    case 'onError': {
                        if (!message.value) return;
                        vscode.window.showErrorMessage(message.value);
                        break;
                    }
                    case 'log': {
                        console.log(`Log from RequestPanel: ${message.value}`);
                        break;
                    }
                    case 'selectFile': {
                        const context = message.context;
                        const options: vscode.OpenDialogOptions = {
                            canSelectMany: false,
                            openLabel: 'Select',
                            canSelectFiles: true,
                            canSelectFolders: false
                        };

                        vscode.window.showOpenDialog(options).then((fileUri) => {
                            if (fileUri && fileUri[0]) {
                                this._panel.webview.postMessage({
                                    type: 'fileSelected',
                                    payload: fileUri[0].fsPath,
                                    context: context
                                });
                            }
                        });
                        break;
                    }
                    case 'saveRequest': {
                        const updatedRequest = message.payload as ApiRequest;
                        const collections = this._context.globalState.get<CollectionItem[]>('apipilot.collections', []);

                        const updateInTree = (items: CollectionItem[]): boolean => {
                            for (let i = 0; i < items.length; i++) {
                                if (items[i].id === updatedRequest.id) {
                                    items[i] = updatedRequest;
                                    return true;
                                }
                                const item = items[i];
                                if (item.type === 'folder' && item.children) {
                                    if (updateInTree(item.children)) return true;
                                }
                            }
                            return false;
                        };

                        const found = updateInTree(collections);
                        if (found) {
                            await this._context.globalState.update('apipilot.collections', collections);
                            vscode.commands.executeCommand('apipilot.refreshSidebar');
                            // If not auto-saving (or if we want to give feedback), show info.
                            // But usually auto-save is silent. We can send a 'saved' message back if needed.
                            this._panel.webview.postMessage({ type: 'onInfo', value: 'Request saved' });
                        } else {
                            this._panel.webview.postMessage({
                                type: 'onError',
                                value: 'Could not find request to save'
                            });
                        }
                        break;
                    }
                    case 'getSettings': {
                        const settings: any = this._context.globalState.get('apipilot.settings', {});
                        if (!settings.general) settings.general = {};
                        if (settings.general.autoSave === undefined) settings.general.autoSave = true;

                        this._panel.webview.postMessage({
                            type: 'updateSettings',
                            payload: settings
                        });
                        break;
                    }
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        if (this._requestId) {
            RequestPanel.currentPanels.delete(this._requestId);
        }
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, initialData?: ApiRequest) {
        const isDev = this._context.extensionMode === vscode.ExtensionMode.Development;

        // Calculate folder path
        let folderPath: { id: string; name: string }[] = [];
        if (initialData && initialData.id) {
            const collections = this._context.globalState.get<CollectionItem[]>('apipilot.collections', []);
            const findPath = (
                items: CollectionItem[],
                targetId: string,
                currentPath: { id: string; name: string }[] = []
            ): { id: string; name: string }[] | null => {
                for (const item of items) {
                    if (item.id === targetId) {
                        return currentPath;
                    }
                    if (item.type === 'folder' && item.children) {
                        const found = findPath(item.children, targetId, [
                            ...currentPath,
                            { id: item.id, name: item.name }
                        ]);
                        if (found) return found;
                    }
                }
                return null;
            };
            folderPath = findPath(collections, initialData.id) || [];
        }

        // Inject folderPath into initialData
        if (initialData) {
            initialData._folderPath = folderPath;
        }

        let scriptUri = '';
        let styleResetUri = '';

        if (isDev) {
            scriptUri = 'http://localhost:5173/src/main.tsx';
            styleResetUri = 'http://localhost:5173/src/index.css';
        } else {
            scriptUri = webview
                .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'dist', 'assets', 'index.js'))
                .toString();
            styleResetUri = webview
                .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'dist', 'assets', 'index.css'))
                .toString();
        }

        const nonce = getNonce();

        const initialDataScript = initialData ? `window.initialData = ${JSON.stringify(initialData)};` : '';

        const csp = isDev
            ? `default-src 'none'; connect-src ${webview.cspSource} https: http://localhost:5173 ws://localhost:5173 data:; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline' http://localhost:5173; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval' http://localhost:5173 blob:; worker-src blob:; font-src ${webview.cspSource} https: data:;`
            : `default-src 'none'; connect-src ${webview.cspSource} https: data:; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval' blob:; worker-src blob:; font-src ${webview.cspSource} https: data:;`;

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="${csp}">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				${!isDev ? `<link href="${styleResetUri}" rel="stylesheet">` : ''}
				<title>ApiPilot Request</title>
                <script nonce="${nonce}">
                    window.viewType = 'editor';
                    ${initialDataScript}
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

                     // Override console.log
                    const originalLog = console.log;
                    console.log = function(...args) {
                        originalLog.apply(console, args);
                        if (vscode) {
                            vscode.postMessage({ type: 'log', value: args.join(' ') });
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
