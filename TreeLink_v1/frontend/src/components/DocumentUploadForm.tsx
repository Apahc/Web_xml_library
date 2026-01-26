// components/DocumentUploadForm.tsx
import { useState } from 'react'
import {
  Typography,
  Button,
  LinearProgress,
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { uploadDocument, getStructures } from '../api/api'

interface DocumentUploadFormProps {
  setMessage: (msg: string) => void
}

export default function DocumentUploadForm({ setMessage }: DocumentUploadFormProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedStructureId, setSelectedStructureId] = useState<number>('')
  const [structures, setStructures] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [duplicateData, setDuplicateData] = useState<any>(null)
  const [newCode, setNewCode] = useState('')

  // Загружаем список структур при монтировании
  useState(() => {
    const loadStructures = async () => {
      const structuresList = await getStructures()
      setStructures(structuresList)
      if (structuresList.length > 0) {
        setSelectedStructureId(structuresList[0].id)
      }
    }
    loadStructures()
  }, [])

  const handleDuplicateDecision = async (decision: 'rename' | 'overwrite' | 'skip') => {
    try {
      if (decision === 'rename') {
        if (!newCode.trim()) {
          setError('Введите новый код документа')
          return
        }
        // Здесь нужно отправить запрос с новым кодом
        // Для простоты пока просто закроем диалог
        setDialogOpen(false)
        setError(null)
        return
      }

      if (decision === 'overwrite') {
        // Повторно загружаем с force=true
        setDialogOpen(false)
        if (duplicateData?.file) {
          await handleFileSelect(duplicateData.file, true)
        }
        return
      }

      if (decision === 'skip') {
        setDialogOpen(false)
        setUploading(false)
        setProgress(0)
        setMessage('Загрузка отменена')
        return
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при обработке дубликата')
    }
  }

  // Обработчик выбора файла
  const handleFileSelect = async (file: File, force = false) => {
    if (!file) return

    // Проверка формата
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Пожалуйста, выберите файл в формате XML')
      return
    }

    if (!selectedStructureId) {
      setError('Пожалуйста, выберите структуру')
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
      const result = await uploadDocument(file, selectedStructureId, force)

      clearInterval(progressInterval)
      setProgress(100)

      // Обработка ответа - проверка на дубликаты
      if (result.duplicate_found) {
        // Сохраняем данные для повторной попытки
        setDuplicateData({
          file,
          duplicates: result.duplicates,
          file_hash: result.file_hash
        })
        setDialogOpen(true)
        setNewCode(result.proposed_code || '')
      } else {
        // Успешная загрузка
        setMessage(`✅ Документ "${result.document.name}" успешно загружен. Код: ${result.document.code}`)
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
    <>
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h6" gutterBottom>
          Загрузить документ
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

        {/* Выбор структуры */}
        <FormControl fullWidth size="small">
          <InputLabel>Структура</InputLabel>
          <Select
            value={selectedStructureId}
            label="Структура"
            onChange={(e) => setSelectedStructureId(e.target.value)}
            disabled={uploading}
          >
            {structures.map((structure) => (
              <MenuItem key={structure.id} value={structure.id}>
                {structure.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
          onClick={uploading ? undefined : () => document.getElementById('doc-file-input')?.click()}
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
                Перетащите XML документ сюда
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                или нажмите для выбора файла
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Файл должен содержать: doc_number, title, folder_code
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
          id="doc-file-input"
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
            onClick={() => document.getElementById('doc-file-input')?.click()}
            disabled={uploading || !selectedStructureId}
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
          Формат: XML. Документ будет прикреплен к папке, указанной в поле folder_code
        </Typography>
      </Box>

      {/* Диалог для обработки дубликатов */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Найден дубликат документа</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Документ с таким кодом или содержимым уже существует:
          </Typography>

          {duplicateData?.duplicates?.map((dup: any, index: number) => (
            <Box key={index} sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Код:</strong> {dup.code}
              </Typography>
              <Typography variant="body2">
                <strong>Название:</strong> {dup.name}
              </Typography>
              <Typography variant="body2">
                <strong>Хэш:</strong> {dup.file_hash?.substring(0, 16)}...
              </Typography>
              <Typography variant="body2" color={dup.is_same_hash ? 'error' : 'inherit'}>
                {dup.is_same_hash ? '✓ Совпадает хэш' : '✓ Совпадает код'}
              </Typography>
            </Box>
          ))}

          <Typography gutterBottom sx={{ mt: 2 }}>
            Выберите действие:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => handleDuplicateDecision('overwrite')}
              color="warning"
            >
              Перезаписать существующий документ
            </Button>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Новый код"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={() => handleDuplicateDecision('rename')}
              >
                Загрузить с новым кодом
              </Button>
            </Box>

            <Button
              variant="outlined"
              onClick={() => handleDuplicateDecision('skip')}
            >
              Пропустить загрузку
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}