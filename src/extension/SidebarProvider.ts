import * as vscode from 'vscode';
import { RequestHandler } from './RequestHandler';
import { RequestPanel } from './RequestPanel';
import { ExamplePanel } from './ExamplePanel';
import { EnvironmentPanel } from './EnvironmentPanel';
import { ImportPanel } from './ImportPanel';
import { SettingsPanel } from './SettingsPanel';
import { Logger } from './utils/Logger';
import { Importer } from './utils/Importer';
import { Exporter } from './utils/Exporter';
import { CodeGenerator } from './utils/CodeGenerator';
import { HistoryItem, ApiRequest, CollectionItem, Environment, ApiExample, CollectionFolder } from '../shared/types';

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    private _disposables: vscode.Disposable[] = [];

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._extensionUri = _context.extensionUri;
    }

    private readonly _extensionUri: vscode.Uri;

    public refreshHistory() {
        this._view?.webview.postMessage({
            type: 'updateHistory',
            payload: this._context.globalState.get('apipilot.history', [])
        });
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async (data) => {
                switch (data.type) {
                    case 'executeRequest': {
                        try {
                            Logger.log(`Executing request: ${JSON.stringify(data.payload)}`);
                            const response = await RequestHandler.makeRequest(data.payload);

                            // Save to history
                            const history = this._context.globalState.get<HistoryItem[]>('apipilot.history', []);
                            const historyItem: HistoryItem = {
                                ...data.payload,
                                id: Date.now().toString(), // New ID for history item
                                responseHistory: undefined, // History items don't need history of history
                                response: {
                                    status: response.status,
                                    statusText: response.statusText,
                                    time: Date.now(),
                                    size: response.size
                                },
                                timestamp: Date.now()
                            };
                            history.unshift(historyItem); // Add to top
                            if (history.length > 50) history.pop(); // Limit history size
                            await this._context.globalState.update('apipilot.history', history);

                            webviewView.webview.postMessage({
                                type: 'executeResponse',
                                payload: response
                            });

                            webviewView.webview.postMessage({
                                type: 'updateHistory',
                                payload: history
                            });
                        } catch (error) {
                            Logger.error(`Error executing request: ${error}`);
                            webviewView.webview.postMessage({
                                type: 'executeResponse',
                                payload: { error: String(error) }
                            });
                        }
                        break;
                    }
                    case 'openSettings': {
                        SettingsPanel.createOrShow(this._context);
                        break;
                    }
                    case 'getHistory': {
                        const history = this._context.globalState.get<HistoryItem[]>('apipilot.history', []);
                        webviewView.webview.postMessage({
                            type: 'updateHistory',
                            payload: history
                        });
                        break;
                    }
                    case 'clearHistory': {
                        await this._context.globalState.update('apipilot.history', []);
                        webviewView.webview.postMessage({
                            type: 'updateHistory',
                            payload: []
                        });
                        break;
                    }
                    case 'exportCollection': {
                        const collection = data.payload;
                        try {
                            // Step 1: Select Swagger Version
                            const version = await vscode.window.showQuickPick(['3.0.0', '2.0'], {
                                placeHolder: 'Select Swagger/OpenAPI Version',
                                title: 'Export Configuration'
                            });
                            if (!version) return; // User cancelled

                            // Step 2: Select Format
                            const format = await vscode.window.showQuickPick(['YAML', 'JSON'], {
                                placeHolder: 'Select Export Format',
                                title: 'Export Configuration'
                            });
                            if (!format) return; // User cancelled

                            const fileExt = format.toLowerCase() === 'yaml' ? 'yaml' : 'json';
                            const yamlContent = Exporter.exportToSwagger(
                                collection,
                                fileExt as 'yaml' | 'json',
                                version as '3.0.0' | '2.0'
                            );

                            const uri = await vscode.window.showSaveDialog({
                                filters: {
                                    [format]: [fileExt]
                                },
                                saveLabel: `Export Swagger (${version})`
                            });

                            if (uri) {
                                await vscode.workspace.fs.writeFile(
                                    uri,
                                    new Uint8Array(Buffer.from(yamlContent, 'utf8'))
                                );
                                vscode.window.showInformationMessage('Collection exported successfully!');
                            }
                        } catch (e) {
                            vscode.window.showErrorMessage(`Export failed: ${e}`);
                        }
                        break;
                    }
                    case 'generateCodeSnippet': {
                        const { request, language } = data.payload;
                        const snippet = CodeGenerator.generate(request, language);
                        webviewView.webview.postMessage({
                            type: 'codeSnippetGenerated',
                            payload: snippet
                        });
                        break;
                    }
                    case 'parseCurl': {
                        try {
                            Logger.log(`Parsing cURL: ${data.value}`);
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
                            Logger.error(`Error parsing cURL: ${e}`);
                            vscode.window.showErrorMessage('Error parsing cURL: ' + e);
                        }
                        break;
                    }
                    case 'onInfo': {
                        if (!data.value) {
                            return;
                        }
                        Logger.log(`Info from Webview: ${data.value}`);
                        vscode.window.showInformationMessage(data.value);
                        break;
                    }
                    case 'onError': {
                        if (!data.value) {
                            return;
                        }
                        Logger.error(`Error from Webview: ${data.value}`);
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
                    case 'updateExample': {
                        const { requestId, example } = data.payload;
                        const collections = this._context.globalState.get(
                            'apipilot.collections',
                            []
                        ) as CollectionItem[];

                        const updateInTree = (items: CollectionItem[]): boolean => {
                            for (const item of items) {
                                if (item.id === requestId && item.type === 'request') {
                                    if ((item as ApiRequest).examples) {
                                        const idx = (item as ApiRequest).examples!.findIndex(
                                            (e: ApiExample) => e.id === example.id
                                        );
                                        if (idx !== -1) {
                                            (item as ApiRequest).examples![idx] = example;
                                            return true;
                                        }
                                    }
                                }
                                if (item.type === 'folder') {
                                    const folder = item as CollectionFolder;
                                    if (folder.children && updateInTree(folder.children)) return true;
                                }
                            }
                            return false;
                        };

                        if (updateInTree(collections)) {
                            await this._context.globalState.update('apipilot.collections', collections);
                            vscode.window.showInformationMessage('Example updated successfully');
                            this.refresh();
                        }
                        break;
                    }
                    case 'openEnvironmentEditor': {
                        EnvironmentPanel.createOrShow(this._context, data.payload);
                        break;
                    }
                    case 'openImport': {
                        ImportPanel.createOrShow(this._context);
                        break;
                    }
                    case 'log': {
                        Logger.log(`Log from Webview: ${data.value}`);
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
                    case 'backupData': {
                        try {
                            const collections = this._context.globalState.get('apipilot.collections', []);
                            const environments = this._context.globalState.get('apipilot.environments', []);
                            const settings = this._context.globalState.get('apipilot.settings', {});
                            const history = this._context.globalState.get('apipilot.history', []);

                            const backup = {
                                version: 1,
                                timestamp: Date.now(),
                                data: {
                                    collections,
                                    environments,
                                    settings,
                                    history
                                }
                            };

                            const uri = await vscode.window.showSaveDialog({
                                filters: { JSON: ['json'] },
                                saveLabel: 'Backup ApiPilot Data'
                            });

                            if (uri) {
                                await vscode.workspace.fs.writeFile(
                                    uri,
                                    new Uint8Array(Buffer.from(JSON.stringify(backup, null, 2), 'utf8'))
                                );
                                vscode.window.showInformationMessage('Backup created successfully!');
                            }
                        } catch (e) {
                            vscode.window.showErrorMessage(`Backup failed: ${e}`);
                        }
                        break;
                    }
                    case 'restoreData': {
                        try {
                            const { content, mode } = data.payload; // mode: 'overwrite' | 'merge'
                            const backup = JSON.parse(content);

                            if (!backup.data) {
                                throw new Error('Invalid backup file format');
                            }

                            if (mode === 'overwrite') {
                                await this._context.globalState.update(
                                    'apipilot.collections',
                                    backup.data.collections || []
                                );
                                await this._context.globalState.update(
                                    'apipilot.environments',
                                    backup.data.environments || []
                                );
                                await this._context.globalState.update('apipilot.settings', backup.data.settings || {});
                                await this._context.globalState.update('apipilot.history', backup.data.history || []);
                            } else {
                                // Merge Logic
                                const currentCollections = this._context.globalState.get<CollectionItem[]>(
                                    'apipilot.collections',
                                    []
                                );
                                const currentEnvironments = this._context.globalState.get<Environment[]>(
                                    'apipilot.environments',
                                    []
                                );

                                // Simple append for collections
                                const newCollections = [...currentCollections, ...(backup.data.collections || [])];

                                // Dedup environments by ID
                                const newEnvironments = [...currentEnvironments];
                                (backup.data.environments || []).forEach((env: Environment) => {
                                    if (!newEnvironments.find((e) => e.id === env.id)) {
                                        newEnvironments.push(env);
                                    }
                                });

                                await this._context.globalState.update('apipilot.collections', newCollections);
                                await this._context.globalState.update('apipilot.environments', newEnvironments);

                                // Merge settings
                                const currentSettings = this._context.globalState.get('apipilot.settings', {});
                                await this._context.globalState.update('apipilot.settings', {
                                    ...currentSettings,
                                    ...(backup.data.settings || {})
                                });

                                // Merge history
                                const currentHistory = this._context.globalState.get<HistoryItem[]>(
                                    'apipilot.history',
                                    []
                                );
                                const newHistory = [...currentHistory];
                                (backup.data.history || []).forEach((item: HistoryItem) => {
                                    if (!newHistory.find((h) => h.id === item.id)) {
                                        newHistory.push(item);
                                    }
                                });
                                newHistory.sort((a, b) => b.timestamp - a.timestamp);
                                await this._context.globalState.update('apipilot.history', newHistory);
                            }

                            this.refresh();
                            this.refreshHistory();
                            vscode.window.showInformationMessage('Restore completed successfully!');
                            webviewView.webview.postMessage({ type: 'restoreSuccess' });
                        } catch (e) {
                            vscode.window.showErrorMessage(`Restore failed: ${e}`);
                            webviewView.webview.postMessage({ type: 'restoreError', message: String(e) });
                        }
                        break;
                    }
                    case 'moveItem': {
                        const { itemId, targetFolderId } = data.payload;
                        const collections = this._context.globalState.get<CollectionItem[]>('apipilot.collections', []);

                        let itemToMove: CollectionItem | null = null;
                        const remove = (items: CollectionItem[]): boolean => {
                            for (let i = 0; i < items.length; i++) {
                                if (items[i].id === itemId) {
                                    itemToMove = items[i];
                                    items.splice(i, 1);
                                    return true;
                                }
                                if (items[i].type === 'folder') {
                                    const folder = items[i] as CollectionFolder;
                                    if (folder.children && remove(folder.children)) return true;
                                }
                            }
                            return false;
                        };

                        if (remove(collections) && itemToMove) {
                            // Update parentId
                            (itemToMove as CollectionItem).parentId = targetFolderId || undefined;

                            if (!targetFolderId) {
                                collections.push(itemToMove);
                            } else {
                                const add = (items: CollectionItem[]): boolean => {
                                    for (const item of items) {
                                        if (item.id === targetFolderId && item.type === 'folder') {
                                            const folder = item as CollectionFolder;
                                            if (!folder.children) folder.children = [];
                                            folder.children.push(itemToMove!);
                                            return true;
                                        }
                                        if (item.type === 'folder') {
                                            const folder = item as CollectionFolder;
                                            if (folder.children && add(folder.children)) return true;
                                        }
                                    }
                                    return false;
                                };
                                if (!add(collections)) {
                                    // Fallback to root if target not found
                                    collections.push(itemToMove);
                                }
                            }
                            await this._context.globalState.update('apipilot.collections', collections);
                            this.refresh();
                        }
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
                    case 'importData': {
                        try {
                            const { collectionId, newCollectionName, content, mode } = data.payload;
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

                                if (mode === 'overwrite') {
                                    targetFolder.children = importedItems;
                                } else {
                                    // Merge with rename strategy
                                    const existingNames = new Set(
                                        targetFolder.children.map((c: CollectionItem) => c.name)
                                    );
                                    importedItems.forEach((item: CollectionItem) => {
                                        let newName = item.name;
                                        let counter = 1;
                                        while (existingNames.has(newName)) {
                                            newName = `${item.name} (${counter})`;
                                            counter++;
                                        }
                                        item.name = newName;
                                        existingNames.add(newName);
                                        targetFolder.children!.push(item);
                                    });
                                }

                                await this._context.globalState.update('apipilot.collections', collections);

                                webviewView.webview.postMessage({
                                    type: 'importSuccess'
                                });

                                // Also update the collections view
                                webviewView.webview.postMessage({
                                    type: 'updateCollections',
                                    payload: collections
                                });
                            } else {
                                throw new Error('Target collection not found');
                            }
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            Logger.error(`Import failed: ${errorMessage}`);
                            webviewView.webview.postMessage({
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
            scriptUri = 'http://127.0.0.1:5173/src/main.tsx';
            // In dev mode, styles are usually injected by Vite, but we might need reset
            styleResetUri = 'http://127.0.0.1:5173/src/index.css';
        } else {
            scriptUri = webview
                .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'dist', 'assets', 'index.js'))
                .toString();
            styleResetUri = webview
                .asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'dist', 'assets', 'index.css'))
                .toString();
        }

        Logger.log(`Mode: ${isDev ? 'Development' : 'Production'}`);
        Logger.log(`Script URI: ${scriptUri}`);

        const nonce = getNonce();

        const csp = isDev
            ? `default-src 'none'; connect-src ${webview.cspSource} https: http://127.0.0.1:5173 ws://127.0.0.1:5173 data:; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline' http://127.0.0.1:5173; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-eval' http://127.0.0.1:5173; font-src ${webview.cspSource} https: data:;`
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
                        import RefreshRuntime from "http://127.0.0.1:5173/@react-refresh"
                        RefreshRuntime.injectIntoGlobalHook(window)
                        window.$RefreshReg$ = () => {}
                        window.$RefreshSig$ = () => (type) => type
                        window.__vite_plugin_react_preamble_installed__ = true
                    </script>
                    <script type="module" nonce="${nonce}" src="http://127.0.0.1:5173/@vite/client"></script>
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
