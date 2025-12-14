import * as vscode from 'vscode';

export abstract class BasePanel<T extends { type: string }> {
    protected readonly _panel: vscode.WebviewPanel;
    protected readonly _extensionUri: vscode.Uri;
    protected readonly _context: vscode.ExtensionContext;
    protected _disposables: vscode.Disposable[] = [];

    protected constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = context.extensionUri;
        this._context = context;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage((message: T) => this._onMessage(message), null, this._disposables);
    }

    public dispose() {
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }

        this._onDispose();
    }

    protected _onDispose() {
        // Override in subclasses if needed to clean up static references
    }

    protected abstract _onMessage(message: T): void;

    protected _getHtmlForWebview(webview: vscode.Webview, viewType: string, extraScripts: string = ''): string {
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

        const nonce = this._getNonce();

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
				<title>ApiPilot</title>
                <script nonce="${nonce}">
                    window.viewType = '${viewType}';
                    ${extraScripts}
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

    protected _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
