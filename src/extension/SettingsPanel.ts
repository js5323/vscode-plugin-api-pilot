import * as vscode from 'vscode';
import { BasePanel } from './BasePanel';
import { Environment, SettingsPanelMessage } from '../shared/types';

export class SettingsPanel extends BasePanel<SettingsPanelMessage> {
    public static currentPanel: SettingsPanel | undefined;

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (SettingsPanel.currentPanel) {
            SettingsPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'apipilot-settings',
            'Settings',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'dist')],
                retainContextWhenHidden: true
            }
        );

        SettingsPanel.currentPanel = new SettingsPanel(panel, context);
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        super(panel, context);
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, 'settings');
    }

    protected _onDispose() {
        SettingsPanel.currentPanel = undefined;
    }

    protected async _onMessage(message: SettingsPanelMessage) {
        switch (message.type) {
            case 'log': {
                console.log(`Log from SettingsPanel: ${message.value}`);
                break;
            }
            case 'getSettings': {
                const settings: unknown = this._context.globalState.get('apipilot.settings', {
                    general: {
                        timeout: 0,
                        defaultHeaders: [],
                        sslVerification: true,
                        maxResponseSize: 0,
                        autoSave: true
                    },
                    proxy: {
                        useSystemProxy: true,
                        protocol: 'http',
                        host: '',
                        port: '',
                        auth: false,
                        username: '',
                        password: '',
                        bypass: ''
                    },
                    certificates: {
                        ca: [],
                        client: []
                    }
                });

                // Ensure defaults are populated if user has partial settings
                const typedSettings = settings as { general?: { autoSave?: boolean } };
                if (!typedSettings.general) typedSettings.general = {};
                if (typedSettings.general.autoSave === undefined) typedSettings.general.autoSave = true;

                const environments = this._context.globalState.get('apipilot.environments', []);
                const defaultEnvId = this._context.globalState.get('apipilot.defaultEnvId', '');

                this._panel.webview.postMessage({
                    type: 'updateSettings',
                    payload: {
                        settings,
                        environments,
                        defaultEnvId
                    }
                });
                break;
            }
            case 'saveSettings': {
                const { settings, defaultEnvId } = message.payload;
                await this._context.globalState.update('apipilot.settings', settings);
                await this._context.globalState.update('apipilot.defaultEnvId', defaultEnvId);

                vscode.window.showInformationMessage('Settings saved successfully');

                // Notify other parts of the extension if needed
                vscode.commands.executeCommand('apipilot.refreshSidebar');
                break;
            }
            case 'createEnvironment': {
                // For now, we can reuse the EnvironmentPanel or simple input
                // But since we are moving env management to Settings, we might want to handle it here or open a dialog
                // Let's use a simple input for name and create it
                const name = await vscode.window.showInputBox({ prompt: 'Enter environment name' });
                if (name) {
                    const environments = this._context.globalState.get<Environment[]>('apipilot.environments', []);
                    const newEnv: Environment = {
                        id: Date.now().toString(),
                        name,
                        variables: [],
                        isActive: false
                    };
                    environments.push(newEnv);
                    await this._context.globalState.update('apipilot.environments', environments);

                    // Refresh settings view
                    this._panel.webview.postMessage({
                        type: 'updateSettings',
                        payload: {
                            settings: this._context.globalState.get('apipilot.settings'),
                            environments,
                            defaultEnvId: this._context.globalState.get('apipilot.defaultEnvId')
                        }
                    });
                }
                break;
            }
            case 'deleteEnvironment': {
                const envId = message.payload;
                const environments = this._context.globalState.get<Environment[]>('apipilot.environments', []);
                const newEnvs = environments.filter((e) => e.id !== envId);
                await this._context.globalState.update('apipilot.environments', newEnvs);

                // Also clear default if it was deleted
                const defaultEnvId = this._context.globalState.get('apipilot.defaultEnvId');
                if (defaultEnvId === envId) {
                    await this._context.globalState.update('apipilot.defaultEnvId', '');
                }

                this._panel.webview.postMessage({
                    type: 'updateSettings',
                    payload: {
                        settings: this._context.globalState.get('apipilot.settings'),
                        environments: newEnvs,
                        defaultEnvId: this._context.globalState.get('apipilot.defaultEnvId')
                    }
                });
                break;
            }
            case 'editEnvironment': {
                // Open the existing EnvironmentPanel for detailed editing
                // We need to import EnvironmentPanel dynamically or ensuring circular deps are handled
                // But EnvironmentPanel is designed to work standalone.
                // We can send a command to open it.
                const env = message.payload;
                vscode.commands.executeCommand('apipilot.openEnvironment', env);
                break;
            }
            case 'selectFile': {
                const options: vscode.OpenDialogOptions = {
                    canSelectMany: false,
                    openLabel: 'Select',
                    filters: {
                        Certificates: ['crt', 'cer', 'pem', 'key', 'pfx']
                    }
                };
                const fileUri = await vscode.window.showOpenDialog(options);
                if (fileUri && fileUri[0]) {
                    this._panel.webview.postMessage({
                        type: 'fileSelected',
                        payload: fileUri[0].fsPath,
                        context: message.context
                    });
                }
                break;
            }
            case 'importData': {
                // Forward to sidebar or handle here?
                // For now let's say we handled it
                vscode.window.showInformationMessage('Import feature coming soon in Settings');
                break;
            }
            case 'exportData': {
                try {
                    const collections = this._context.globalState.get<unknown[]>('apipilot.collections', []);
                    const exportData = JSON.stringify(collections, null, 2);

                    // Ask user where to save
                    const uri = await vscode.window.showSaveDialog({
                        filters: {
                            JSON: ['json']
                        }
                    });

                    if (uri) {
                        await vscode.workspace.fs.writeFile(uri, new Uint8Array(Buffer.from(exportData, 'utf-8')));
                        vscode.window.showInformationMessage('Data exported successfully');
                    }
                } catch (e) {
                    vscode.window.showErrorMessage(`Export failed: ${e}`);
                }
                break;
            }
        }
    }

    public refresh() {
        const settings = this._context.globalState.get('apipilot.settings', {
            general: {
                timeout: 0,
                defaultHeaders: [],
                sslVerification: true,
                maxResponseSize: 0,
                autoSave: true
            },
            proxy: {
                useSystemProxy: true,
                protocol: 'http',
                host: '',
                port: '',
                auth: false,
                username: '',
                password: '',
                bypass: ''
            },
            certificates: {
                ca: [],
                client: []
            }
        }) as { general?: { autoSave?: boolean } };

        // Ensure defaults are populated if user has partial settings
        if (!settings.general) settings.general = {};
        if (settings.general.autoSave === undefined) settings.general.autoSave = true;

        const environments = this._context.globalState.get('apipilot.environments', []);
        const defaultEnvId = this._context.globalState.get('apipilot.defaultEnvId', '');

        this._panel.webview.postMessage({
            type: 'updateSettings',
            payload: {
                settings,
                environments,
                defaultEnvId
            }
        });
    }
}
