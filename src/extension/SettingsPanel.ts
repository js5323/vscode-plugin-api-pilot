import * as vscode from 'vscode';
import { Logger } from './utils/Logger';

export class SettingsPanel {
    public static currentPanel: SettingsPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

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
        this._panel = panel;
        this._extensionUri = context.extensionUri;
        this._context = context;

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'log': {
                        console.log(`Log from SettingsPanel: ${message.value}`);
                        break;
                    }
                    case 'getSettings': {
                        const settings: any = this._context.globalState.get('apipilot.settings', {
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
                            const environments = this._context.globalState.get<any[]>('apipilot.environments', []);
                            const newEnv = {
                                id: Date.now().toString(),
                                name,
                                variables: []
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
                        const environments = this._context.globalState.get<any[]>('apipilot.environments', []);
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
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        SettingsPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public refresh() {
        const settings: any = this._context.globalState.get('apipilot.settings', {
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
				<title>ApiPilot Settings</title>
                <script nonce="${nonce}">
                    window.viewType = 'settings';
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
