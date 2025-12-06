import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button
} from '@mui/material';
import { getVsCodeApi } from '../utils/vscode';

// Acquire the VS Code API
const vscode = getVsCodeApi();

interface CurlImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CurlImportDialog({ open, onClose }: CurlImportDialogProps) {
  const [curlCommand, setCurlCommand] = useState('');

  const handleImport = () => {
      if (!curlCommand.trim()) return;
      
      // Send to extension for parsing
      vscode.postMessage({
        type: 'parseCurl',
        value: curlCommand
      });
      
      onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import cURL</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="curl"
          label="Paste cURL command here"
          type="text"
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          value={curlCommand}
          onChange={(e) => setCurlCommand(e.target.value)}
          placeholder="curl -X POST https://example.com/api..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleImport} variant="contained">Import</Button>
      </DialogActions>
    </Dialog>
  );
}
