import { Typography, Box } from '@mui/material'

export default function Messages() {
  const successMessages = [
    'XML file uploaded successfully. (Timestamp: 2026-01-24 12:00:00)',
    'XML structure validated and saved. (Timestamp: 2026-01-24 12:01:00)'
  ]
  const errorMessages: string[] = []

  return (
    <div className="messages-block">
      <Typography variant="subtitle1" gutterBottom>
        Messages
      </Typography>

      {successMessages.map((msg, idx) => (
        <Box
          key={idx}
          sx={{
            backgroundColor: '#d9ecff',
            padding: 1,
            borderRadius: 1,
            mb: 1
          }}
        >
          <Typography variant="body2">{msg}</Typography>
        </Box>
      ))}

      {errorMessages.map((msg, idx) => (
        <Box
          key={idx}
          sx={{
            backgroundColor: '#ffd6d6',
            padding: 1,
            borderRadius: 1,
            mb: 1
          }}
        >
          <Typography variant="body2">{msg}</Typography>
        </Box>
      ))}
    </div>
  )
}
