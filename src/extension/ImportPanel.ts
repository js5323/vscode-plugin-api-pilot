import * as vscode from 'vscode';
import { BasePanel } from './BasePanel';
import { Importer } from './utils/Importer';
import { Logger } from './utils/Logger';
import { CollectionItem, CollectionFolder, ImportPanelMessage } from '../shared/types';

export class ImportPanel extends BasePanel<ImportPanelMessage> {
    public static currentPanel: ImportPanel | undefined;

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
        super(panel, context);
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, 'import');
    }

    protected _onDispose() {
        ImportPanel.currentPanel = undefined;
    }

    protected async _onMessage(message: ImportPanelMessage) {
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

                    const collections = this._context.globalState.get<CollectionItem[]>('apipilot.collections', []);
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
    }
}
