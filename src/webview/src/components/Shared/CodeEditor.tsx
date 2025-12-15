import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor, { EditorProps } from '@monaco-editor/react';
import { Box } from '@mui/material';
import { useVsCodeTheme } from '../../hooks/useVsCodeTheme';
import { getVsCodeApi } from '../../utils/vscode';

interface CodeEditorProps extends EditorProps {
    value: string;
    onChange?: (value: string | undefined) => void;
    language?: string;
    readOnly?: boolean;
}

export interface CodeEditorRef {
    paste: () => Promise<void>;
}

const vscode = getVsCodeApi();

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
    ({ value, onChange, language = 'json', readOnly = false, options, ...props }, ref) => {
        const theme = useVsCodeTheme();
        const containerRef = useRef<HTMLDivElement>(null);

        const handlePasteFallback = async () => {
            if (readOnly || !onChange) return;
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    // Determine if we should append, insert, or replace.
                    // Since this is a programmatic paste triggered by external button/event,
                    // and we don't easily have cursor position here without accessing editor instance,
                    // we might default to replacing or appending.
                    // However, the original BodyEditor replaced the content.
                    // Let's stick to replacing for consistency with previous "Paste" button behavior,
                    // OR ideally we get the editor instance and insert at position.
                    // For now, simple replacement as per original code seems safest unless user requested otherwise.
                    onChange(text);
                }
            } catch (e) {
                console.error('Failed to read clipboard', e);
                if (vscode) {
                    vscode.postMessage({ type: 'readClipboard' });
                }
            }
        };

        useImperativeHandle(ref, () => ({
            paste: handlePasteFallback
        }));

        // Handle clipboard data from extension (fallback)
        useEffect(() => {
            const handleMessage = (event: MessageEvent) => {
                const message = event.data;
                if (message.type === 'clipboardData' && !readOnly && onChange) {
                    onChange(message.payload);
                }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }, [onChange, readOnly]);

        return (
            <Box ref={containerRef} sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
                <Editor
                    height="100%"
                    theme={theme}
                    language={language}
                    value={value}
                    onChange={onChange}
                    options={{
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        readOnly,
                        ...options
                    }}
                    {...props}
                />
            </Box>
        );
    }
);

export default CodeEditor;
