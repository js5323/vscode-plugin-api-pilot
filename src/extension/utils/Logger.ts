import * as vscode from 'vscode';

export class Logger {
    private static _outputChannel: vscode.OutputChannel;

    public static initialize(channelName: string) {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel(channelName);
        }
    }

    public static log(message: string, data?: any) {
        if (!this._outputChannel) {
            console.log(message, data);
            return;
        }

        const timestamp = new Date().toISOString();
        const prefix = '[ApiPilot Debug]';
        let logMessage = `${prefix} [${timestamp}] ${message}`;

        if (data !== undefined) {
            if (typeof data === 'object') {
                try {
                    logMessage += `\n${JSON.stringify(data, null, 2)}`;
                } catch (e) {
                    logMessage += `\n[Circular or Non-Serializable Data]`;
                }
            } else {
                logMessage += ` ${data}`;
            }
        }

        this._outputChannel.appendLine(logMessage);
    }

    public static error(message: string, error?: any) {
        if (!this._outputChannel) {
            console.error(message, error);
            return;
        }

        const timestamp = new Date().toISOString();
        const prefix = '[ApiPilot Error]';
        let logMessage = `${prefix} [${timestamp}] ${message}`;

        if (error) {
            if (error instanceof Error) {
                logMessage += `\n${error.message}\n${error.stack}`;
            } else if (typeof error === 'object') {
                logMessage += `\n${JSON.stringify(error, null, 2)}`;
            } else {
                logMessage += ` ${error}`;
            }
        }

        this._outputChannel.appendLine(logMessage);
        // Also show the channel on error so user sees it
        // this._outputChannel.show(true);
    }

    public static show() {
        this._outputChannel?.show(true);
    }
}
