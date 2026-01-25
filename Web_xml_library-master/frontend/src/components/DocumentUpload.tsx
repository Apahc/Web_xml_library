import { useState } from 'react';
import { Button, LinearProgress, Alert, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

interface DocumentUploadProps {
  folderId: number;
  onSuccess: () => void;
}

export default function DocumentUpload({ folderId, onSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId.toString());

    try {
      await axios.post('/api/documents/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
      });
      onSuccess();
    } catch (err) {
      setError('Ошибка загрузки: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1 }}>
      <input type="file" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} disabled={uploading} />
      {uploading && <LinearProgress variant="determinate" value={progress} />}
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" startIcon={<CloudUploadIcon />} disabled={uploading}>
        Загрузить документ
      </Button>
    </Box>
  );
}