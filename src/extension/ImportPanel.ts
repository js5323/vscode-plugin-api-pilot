import * as vscode from 'vscode';
import { Importer } from './utils/Importer';
import { Logger } from './utils/Logger';
import { CollectionItem, CollectionFolder } from '../shared/types';

export class ImportPanel {
    public static currentPanel: ImportPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (ImportPanel.currentPanel) {
            ImportPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'apipilot-import',
            'Import Requests',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'dist')],
                retainContextWhenHidden: true
            }
        );

        ImportPanel.currentPanel = new ImportPanel(panel, context);
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = context.extensionUri;
        this._context = context;

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
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
                        console.log(`Log from ImportPanel: ${message.value}`);
                        break;
                    }
                    case 'close': {
                        this.dispose();
                        break;
                    }
                    case 'getCollections': {
                        const collections = this._context.globalState.get('apipilot.collections', []);
                        this._panel.webview.postMessage({
                            type: 'updateCollections',
                            payload: collections
                        });
                        break;
                    }
                    case 'importData': {
                        try {
                            const { collectionId, newCollectionName, content } = message.payload;
                            const importedItems = Importer.parse(content);

                            const collections = this._context.globalState.get<CollectionItem[]>(
                                'apipilot.collections',
                                []
                            );
                            let targetCollection: CollectionItem | undefined;

                            if (newCollectionName) {
                                targetCollection = {
                                    id: Date.now().toString(),
                                    name: newCollectionName,
                                    type: 'folder',
                                    children: []
                                };
                                collections.push(targetCollection);
                            } else {
                                targetCollection = collections.find((c: CollectionItem) => c.id === collectionId);
                            }

                            if (targetCollection) {
                                const targetFolder = targetCollection as CollectionFolder;
                                if (!targetFolder.children) {
                                    targetFolder.children = [];
                                }
                                targetFolder.children.push(...importedItems);

                                await this._context.globalState.update('apipilot.collections', collections);

                                this._panel.webview.postMessage({
                                    type: 'importSuccess'
                                });

                                // Notify Sidebar to refresh
                                vscode.commands.executeCommand('apipilot.refreshSidebar');
                            } else {
                                throw new Error('Target collection not found');
                            }
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            Logger.error(`Import failed: ${errorMessage}`);
                            this._panel.webview.postMessage({
                                type: 'importError',
                                message: errorMessage
                            });
                        }
                        break;
                    }
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        ImportPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const isDev = this._context.extensionMode === vscode.ExtensionMode.Development;

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
				<title>ApiPilot Import</title>
                <script nonce="${nonce}">
                    window.viewType = 'import';
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
