import * as vscode from 'vscode';
import { BasePanel } from './BasePanel';
import { ApiExample, ApiRequest, CollectionItem, ExamplePanelMessage } from '../shared/types';

export class ExamplePanel extends BasePanel<ExamplePanelMessage> {
    public static currentPanels = new Map<string, ExamplePanel>();
    private readonly _exampleId?: string;

    public static createOrShow(
        context: vscode.ExtensionContext,
        data?: { example?: ApiExample; id?: string; name?: string } & Record<string, unknown>
    ) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // Handle data being either the example object or { example: ..., parentRequest: ... }
        const example = data?.example || data;

        // If we have an example ID, check if we already have a panel for it
        if (example && example.id) {
            const existingPanel = ExamplePanel.currentPanels.get(example.id as string);
            if (existingPanel) {
                existingPanel._panel.reveal(column);
                return;
            }
        }

        const panel = vscode.window.createWebviewPanel(
            'apipilot-example',
            example ? `${example.name}` : 'Example',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'dist')],
                retainContextWhenHidden: true
            }
        );

        const examplePanel = new ExamplePanel(panel, context, data);

        if (example && example.id) {
            ExamplePanel.currentPanels.set(example.id as string, examplePanel);
        }
    }

    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext,
        data?: { example?: ApiExample; id?: string } & Record<string, unknown>
    ) {
        super(panel, context);

        const example = data?.example || data;
        this._exampleId = example?.id as string | undefined;

        // Calculate path
        const exampleObj = ((data as Record<string, unknown>)?.example || data) as ApiExample;
        let folderPath: { id: string; name: string }[] = [];
        let parentRequestName = '';

        if (exampleObj && exampleObj.id) {
            const collections = this._context.globalState.get<CollectionItem[]>('apipilot.collections', []);

            // Helper to find request containing the example and its path
            const findRequestAndPath = (
                items: CollectionItem[],
                exampleId: string,
                currentPath: { id: string; name: string }[] = []
            ): { request: ApiRequest; path: { id: string; name: string }[] } | null => {
                for (const item of items) {
                    // If item is a request, check its examples
                    if (item.type === 'request') {
                        if (item.examples && item.examples.some((ex: ApiExample) => ex.id === exampleId)) {
                            return { request: item, path: currentPath };
                        }
                    }

                    // If item has children, recurse
                    if (item.type === 'folder' && item.children) {
                        const found = findRequestAndPath(item.children, exampleId, [
                            ...currentPath,
                            { id: item.id, name: item.name }
                        ]);
                        if (found) return found;
                    }
                }
                return null;
            };

            const result = findRequestAndPath(collections, exampleObj.id);
            if (result) {
                folderPath = result.path;
                parentRequestName = result.request.name;
            }
        }

        // Inject path info into data
        const initialData = data ? JSON.parse(JSON.stringify(data)) : {};
        initialData._folderPath = folderPath;
        initialData._parentRequestName = parentRequestName;

        const initialDataScript = initialData ? `window.initialData = ${JSON.stringify(initialData)};` : '';

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, 'example-editor', initialDataScript);
    }

    protected _onDispose() {
        if (this._exampleId) {
            ExamplePanel.currentPanels.delete(this._exampleId);
        }
    }

    protected async _onMessage(message: ExamplePanelMessage) {
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
                console.log(`Log from ExamplePanel: ${message.value}`);
                break;
            }
            case 'openRequest': {
                // Forward openRequest to the main extension logic
                vscode.commands.executeCommand('apipilot.openRequest', message.payload);
                break;
            }
        }
    }
}
