import * as vscode from 'vscode';
import { BasePanel } from './BasePanel';
import { RequestHandler } from './RequestHandler';
import { CodeGenerator } from './utils/CodeGenerator';
import { Logger } from './utils/Logger';
import { ApiRequest, CollectionItem, Environment, Settings, RequestPanelMessage } from '../shared/types';

export class RequestPanel extends BasePanel<RequestPanelMessage> {
    public static currentPanels = new Map<string, RequestPanel>();
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
        super(panel, context);
        this._requestId = request?.id;

        // Calculate folder path
        let folderPath: { id: string; name: string }[] = [];
        if (request && request.id) {
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
            folderPath = findPath(collections, request.id) || [];
        }

        // Inject folderPath into initialData
        if (request) {
            request._folderPath = folderPath;
        }

        let initialDataScript = '';
        if (request) {
            initialDataScript = `window.initialData = ${JSON.stringify(request)};`;
        }

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, 'editor', initialDataScript);
    }

    protected _onDispose() {
        if (this._requestId) {
            RequestPanel.currentPanels.delete(this._requestId);
        }
    }

    protected async _onMessage(message: RequestPanelMessage) {
        Logger.log(`RequestPanel Received Message: ${message.type}`);
        switch (message.type) {
            case 'readClipboard': {
                try {
                    const text = await vscode.env.clipboard.readText();
                    this._panel.webview.postMessage({
                        type: 'clipboardData',
                        payload: text
                    });
                } catch (e) {
                    Logger.error('Failed to read clipboard', e);
                }
                break;
            }
            case 'generateCodeSnippet': {
                try {
                    const { request, language, curlSettings } = message.payload;
                    const code = CodeGenerator.generate(request, language, curlSettings);

                    // If language is curl, copy to clipboard automatically as per user preference often
                    // Or just send back to UI to display in a modal/panel
                    // The previous implementation in SidebarProvider was copying to clipboard.

                    // For now, let's copy to clipboard and notify, as that seems to be the intent
                    await vscode.env.clipboard.writeText(code);
                    vscode.window.showInformationMessage(`${language} snippet copied to clipboard!`);

                    // Also send back if the UI needs to display it
                    this._panel.webview.postMessage({
                        type: 'codeSnippetGenerated',
                        payload: { language, code }
                    });
                } catch (e) {
                    Logger.error(`Failed to generate code: ${e}`);
                    vscode.window.showErrorMessage('Failed to generate code snippet');
                }
                break;
            }
            case 'executeRequest': {
                const payload = message.payload as unknown as { request: ApiRequest; environmentId: string };
                const { request } = payload;
                // Get Settings & Environment
                const settings = this._context.globalState.get<Settings>('apipilot.settings');

                try {
                    Logger.log('Execute Request Command Received');

                    const environments = this._context.globalState.get<Environment[]>('apipilot.environments', []);
                    const activeEnv = environments.find((e) => e.isActive);
                    const variables = activeEnv ? activeEnv.variables : [];

                    Logger.log(`Active Environment: ${activeEnv ? activeEnv.name : 'None'}`);

                    const response = await RequestHandler.makeRequest(request, variables, settings);

                    Logger.log(`Request Execution Completed. Status: ${response.status}`);

                    // Update Global History
                    const history = this._context.globalState.get<unknown[]>('apipilot.history', []);
                    const historyItem = {
                        ...message.payload,
                        id: Date.now().toString(),
                        responseHistory: undefined,
                        response: {
                            status: response.status,
                            statusText: response.statusText,
                            time: Date.now(),
                            size: response.size,
                            duration: response.duration
                        },
                        timestamp: Date.now()
                    };
                    history.unshift(historyItem);
                    if (history.length > 50) history.pop();
                    await this._context.globalState.update('apipilot.history', history);

                    // Notify Sidebar to refresh history
                    vscode.commands.executeCommand('apipilot.refreshHistory');

                    this._panel.webview.postMessage({
                        type: 'response',
                        payload: {
                            status: response.status,
                            statusText: response.statusText,
                            data: response.data,
                            headers: response.headers,
                            duration: response.duration,
                            size: response.size
                        }
                    });
                } catch (e: unknown) {
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    Logger.error(`Request execution failed: ${errorMessage}`);
                    this._panel.webview.postMessage({
                        type: 'error',
                        payload: errorMessage
                    });
                }
                break;
            }
            case 'updateTitle': {
                if (message.value) {
                    this._panel.title = message.value;
                }
                break;
            }
            case 'generateCode': {
                // TODO: Implement code generation
                // const code = CodeGenerator.generate(message.payload.request, message.payload.language);
                // this._panel.webview.postMessage({
                //     type: 'codeGenerated',
                //     payload: code
                // });
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
                const settings = this._context.globalState.get('apipilot.settings', {}) as {
                    general?: { autoSave?: boolean };
                };
                if (!settings.general) settings.general = {};
                if (settings.general.autoSave === undefined) settings.general.autoSave = true;

                this._panel.webview.postMessage({
                    type: 'updateSettings',
                    payload: settings
                });
                break;
            }
        }
    }
}
