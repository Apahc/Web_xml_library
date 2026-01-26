import { Paper, Typography, IconButton } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'

interface MessagesProps {
  message: string
}

export default function Messages({ message }: MessagesProps) {
  return (
    <Paper
      sx={{
        p: 2,
        height: '200px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 1
      }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Сообщения
        </Typography>
        {message && (
          <IconButton
            size="small"
            onClick={() => window.location.reload()}
            title="Очистить"
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        {message ? (
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message}
          </div>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Сообщения появятся здесь...
          </Typography>
        )}
      </div>
    </Paper>
  )
}