import { useState } from 'react'
import { Typography, Button, LinearProgress } from '@mui/material'

export default function UploadForm({ setMessage }: { setMessage: (msg: string) => void }) {
  const [progress, setProgress] = useState(0)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const file = e.target.files[0]

    setProgress(20)
    setTimeout(() => setProgress(100), 500)
    setMessage(`Uploaded: ${file.name}`)
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <Typography variant="subtitle1">
        Upload XML Document
      </Typography>

      <div
        style={{
          border: '2px dashed #1976d2',
          borderRadius: 4,
          flex: 1, // ← РАСТЯГИВАЕТСЯ С СЕРЫМ БЛОКОМ
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1976d2',
          fontWeight: 500,
          cursor: 'pointer',
          backgroundColor: '#fafafa'
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        Drag & Drop your XML files
      </div>

      <input
        id="file-input"
        type="file"
        accept=".xml"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      <Button
        variant="contained"
        onClick={() => document.getElementById('file-input')?.click()}
      >
        Browse Files
      </Button>

      {progress > 0 && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 6, borderRadius: 3 }}
        />
      )}
    </div>
  )
}
