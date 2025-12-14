import {
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getVsCodeApi } from '../../utils/vscode';
import { Environment } from '../../types';

const vscode = getVsCodeApi();

interface EnvironmentTabProps {
    defaultEnvId: string;
    setDefaultEnvId: (id: string) => void;
    environments: Environment[];
}

export const EnvironmentTab = ({ defaultEnvId, setDefaultEnvId, environments }: EnvironmentTabProps) => (
    <Stack spacing={3}>
        <FormControl fullWidth>
            <InputLabel>Default Environment</InputLabel>
            <Select value={defaultEnvId} label="Default Environment" onChange={(e) => setDefaultEnvId(e.target.value)}>
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                {environments.map((env) => (
                    <MenuItem key={env.id} value={env.id}>
                        {env.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>

        <Divider />

        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Environments</Typography>
            <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={() => vscode.postMessage({ type: 'createEnvironment' })}
            >
                Create New
            </Button>
        </Box>

        <List>
            {environments.map((env) => (
                <ListItem
                    key={env.id}
                    divider
                    secondaryAction={
                        <Stack direction="row" spacing={1}>
                            <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => vscode.postMessage({ type: 'editEnvironment', payload: env })}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => vscode.postMessage({ type: 'deleteEnvironment', payload: env.id })}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Stack>
                    }
                >
                    <ListItemText primary={env.name} secondary={`${env.variables?.length || 0} variables`} />
                </ListItem>
            ))}
        </List>
    </Stack>
);
