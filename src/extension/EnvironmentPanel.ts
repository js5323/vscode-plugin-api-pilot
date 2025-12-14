import * as vscode from 'vscode';
import { BasePanel } from './BasePanel';
import { SettingsPanel } from './SettingsPanel';
import { Environment, EnvironmentPanelMessage } from '../shared/types';

export class EnvironmentPanel extends BasePanel<EnvironmentPanelMessage> {
    public static currentPanels = new Map<string, EnvironmentPanel>();
    private readonly _environmentId?: string;

    public static createOrShow(context: vscode.ExtensionContext, environment?: Environment) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we have an environment ID, check if we already have a panel for it
        if (environment && environment.id) {
            const existingPanel = EnvironmentPanel.currentPanels.get(environment.id);
            if (existingPanel) {
                existingPanel._panel.reveal(column);
                existingPanel._panel.webview.postMessage({
                    type: 'updateEnvironment',
                    payload: environment
                });
                return;
            }
        }

        const panel = vscode.window.createWebviewPanel(
            'apipilot-environment',
            environment ? `${environment.name}` : 'New Environment',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'webview', 'dist')],
                retainContextWhenHidden: true
            }
        );

        const environmentPanel = new EnvironmentPanel(panel, context, environment);

        if (environment && environment.id) {
            EnvironmentPanel.currentPanels.set(environment.id, environmentPanel);
        }
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, environment?: Environment) {
        super(panel, context);
        this._environmentId = environment?.id;

        const initialDataScript = environment ? `window.initialData = ${JSON.stringify(environment)};` : '';
        this._panel.webview.html = this._getHtmlForWebview(
            this._panel.webview,
            'environment-editor',
            initialDataScript
        );
    }

    protected _onDispose() {
        if (this._environmentId) {
            EnvironmentPanel.currentPanels.delete(this._environmentId);
        }
    }

    protected async _onMessage(message: EnvironmentPanelMessage) {
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
                console.log(`Log from EnvironmentPanel: ${message.value}`);
                break;
            }
            case 'saveEnvironment': {
                const updatedEnv = message.payload;
                const environments = this._context.globalState.get<Environment[]>('apipilot.environments', []);

                const index = environments.findIndex((e) => e.id === updatedEnv.id);
                if (index !== -1) {
                    environments[index] = updatedEnv;
                } else {
                    environments.push(updatedEnv);
                }

                await this._context.globalState.update('apipilot.environments', environments);

                // Small delay to ensure state is propagated
                setTimeout(() => {
                    vscode.commands.executeCommand('apipilot.refreshSidebar');
                    SettingsPanel.currentPanel?.refresh();
                }, 100);

                this._panel.webview.postMessage({ type: 'onInfo', value: 'Environment saved' });
                break;
            }
            case 'getSettings': {
                const settings: unknown = this._context.globalState.get('apipilot.settings', {});
                const typedSettings = settings as { general?: { autoSave?: boolean } };
                if (!typedSettings.general) typedSettings.general = {};
                if (typedSettings.general.autoSave === undefined) typedSettings.general.autoSave = true;

                this._panel.webview.postMessage({
                    type: 'updateSettings',
                    payload: settings
                });
                break;
            }
        }
    }
}
