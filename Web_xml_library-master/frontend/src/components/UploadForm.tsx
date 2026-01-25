import { useState } from 'react'
import {
  Typography,
  Button,
  LinearProgress,
  Alert,
  Box,
  CircularProgress
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { uploadStructure } from '../api/api'

interface UploadFormProps {
  setMessage: (msg: string) => void
  structureId?: number
}

export default function UploadForm({ setMessage, structureId }: UploadFormProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Обработчик выбора файла
  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Проверка формата
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Пожалуйста, выберите файл в формате XML')
      return
    }

    setError(null)
    setUploading(true)
    setProgress(10)

    try {
      // Симуляция прогресса для UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Отправка файла на сервер
      const result = await uploadStructure(file, structureId)

      clearInterval(progressInterval)
      setProgress(100)

      // Обработка ответа
      if (result.duplicate) {
        setMessage(`⚠️ ${result.message}`)
      } else {
        setMessage(`✅ Структура "${result.structure_name}" успешно загружена. Обработано папок: ${result.folders_processed}`)
      }

      // Сброс состояния через 2 секунды
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 2000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.response?.data?.error || 'Ошибка при загрузке файла')
      setUploading(false)
      setProgress(0)
    }
  }

  // Обработчик input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Сброс значения для возможности повторной загрузки
    e.target.value = ''
  }

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      <Typography variant="h6" gutterBottom>
        {structureId ? 'Обновить структуру' : 'Загрузить новую структуру'}
      </Typography>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 1 }}
        >
          {error}
        </Alert>
      )}

      {/* Drag & Drop область */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
          borderRadius: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dragActive ? '#f0f7ff' : '#fafafa',
          cursor: uploading ? 'default' : 'pointer',
          transition: 'all 0.2s',
          '&:hover': !uploading ? {
            backgroundColor: '#f0f7ff',
            borderColor: '#1976d2'
          } : {},
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={uploading ? undefined : () => document.getElementById('file-input')?.click()}
      >
        {uploading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1">
              Загрузка {progress}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Пожалуйста, подождите...
            </Typography>
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
            <Typography variant="body1" align="center" gutterBottom>
              Перетащите XML файл сюда
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              или нажмите для выбора файла
            </Typography>
          </>
        )}

        {/* Progress bar поверх drag area */}
        {uploading && progress > 0 && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4
            }}
          />
        )}
      </Box>

      {/* Скрытый input */}
      <input
        id="file-input"
        type="file"
        accept=".xml"
        style={{ display: 'none' }}
        onChange={handleFileInput}
        disabled={uploading}
      />

      {/* Кнопки */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={uploading}
          startIcon={<CloudUploadIcon />}
          sx={{ flex: 1 }}
        >
          {uploading ? 'Загрузка...' : 'Выбрать файл'}
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            setError(null)
            setProgress(0)
            setUploading(false)
          }}
          disabled={!uploading && !error}
        >
          Сброс
        </Button>
      </Box>

      {/* Инструкция */}
      <Typography variant="caption" color="text.secondary">
        Поддерживаемый формат: XML. Максимальный размер: 10MB
      </Typography>
    </Box>
  )
}