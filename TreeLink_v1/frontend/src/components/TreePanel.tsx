// components/TreePanel.tsx
import { useState, useEffect, useMemo } from 'react';
import { Tree } from 'react-arborist';
import {
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress
} from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import UploadIcon from '@mui/icons-material/Upload';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getFolderTree, getStructures, uploadDocument, getDocumentsByFolder } from '../api/api';
import type { TreeNode, NodeDetails } from '../types/models';

interface TreePanelProps {
  structureId: number;
  onNodeClick: (details: NodeDetails) => void;
}

export default function TreePanel({ structureId, onNodeClick }: TreePanelProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [structures, setStructures] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<{ id: number; name: string; code: string } | null>(null);

  // Состояния для загрузки документов
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentProgress, setDocumentProgress] = useState(0);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  // Состояния для просмотра документов в папке
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [folderDocuments, setFolderDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const memoizedTree = useMemo(() => treeData, [treeData]);

  // Загружаем структуры и дерево папок
  useEffect(() => {
    if (!structureId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Загружаем список структур для выбора
        const structuresList = await getStructures();
        setStructures(structuresList);

        // Загружаем дерево папок
        const treeFromApi = await getFolderTree(structureId);
        console.log('Полученное дерево от бэка:', treeFromApi);
        setTreeData(treeFromApi);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить дерево');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [structureId]);

  // Открытие диалога загрузки документа
  const handleOpenUploadDialog = (folder: any) => {
    setSelectedFolder({
      id: folder.id,
      name: folder.name,
      code: folder.code
    });
    setUploadDialogOpen(true);
    setDocumentError(null);
    setDocumentProgress(0);
    setDocumentFile(null);
  };

  // Обработка выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xml')) {
        setDocumentError('Пожалуйста, выберите файл в формате XML');
        return;
      }
      setDocumentFile(file);
      setDocumentError(null);
    }
  };

  // Загрузка документа
  const handleUploadDocument = async () => {
    if (!documentFile || !selectedFolder) return;

    setDocumentLoading(true);
    setDocumentError(null);
    setDocumentProgress(10);

    try {
      // Симуляция прогресса
      const progressInterval = setInterval(() => {
        setDocumentProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Загружаем документ
      const result = await uploadDocument(documentFile, structureId);

      clearInterval(progressInterval);
      setDocumentProgress(100);

      // Обработка дубликатов
      if (result.duplicate_found) {
        setDocumentError(`Найден дубликат: ${result.message}. Используйте force=true для перезаписи.`);
      } else {
        // Успешная загрузка
        alert(`✅ Документ "${result.document.name}" успешно загружен и прикреплен к папке "${selectedFolder.name}"`);
        setUploadDialogOpen(false);
      }

      setTimeout(() => {
        setDocumentLoading(false);
        setDocumentProgress(0);
      }, 1000);

    } catch (err: any) {
      console.error('Ошибка загрузки документа:', err);
      setDocumentError(err.response?.data?.error || 'Ошибка при загрузке документа');
      setDocumentLoading(false);
      setDocumentProgress(0);
    }
  };

  // Просмотр документов в папке
  const handleViewDocuments = async (folder: any) => {
    setSelectedFolder({
      id: folder.id,
      name: folder.name,
      code: folder.code
    });
    setDocumentsLoading(true);

    try {
      const result = await getDocumentsByFolder(folder.id);
      setFolderDocuments(result.documents || []);
      setDocumentsDialogOpen(true);
    } catch (err) {
      console.error('Ошибка загрузки документов:', err);
      alert('Не удалось загрузить список документов');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Рендер узла дерева с кнопками
  const renderTreeNode = ({ node, style, ref }: any) => {
    const folderData = node.data;

    return (
      <div
        ref={ref}
        style={{
          ...style,
          padding: '8px 16px',
          borderBottom: '1px solid #eee',
          cursor: 'pointer',
          background: node.isSelected ? '#e8f4fd' : 'white',
          fontWeight: folderData.children?.length ? 600 : 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginLeft: node.depth * 40 + 'px',
          width: 'auto',
          minWidth: 'fit-content'
        }}
        onClick={() => {
          node.toggle();
          onNodeClick({
            id: folderData.id,
            name: folderData.name,
            code: folderData.code,
            attributes: folderData.attributes || {}
          });
        }}
      >
        {/* Информация о папке */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflow: 'hidden'
        }}>
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {folderData.name}
            {folderData.code && (
              <small style={{ color: '#666', marginLeft: 8 }}>
                ({folderData.code})
              </small>
            )}
          </span>
        </Box>

        {/* Кнопки действий */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          flexShrink: 0,
          opacity: 0.7,
          '&:hover': { opacity: 1 }
        }}>
          {/* Кнопка просмотра документов */}
          <Tooltip title="Просмотреть документы">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDocuments(folderData);
              }}
            >
              <DescriptionIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Кнопка загрузки документа */}
          <Tooltip title="Загрузить документ в эту папку">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenUploadDialog(folderData);
              }}
            >
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Стрелочка для узлов с детьми */}
          {folderData.children?.length > 0 && (
            <span style={{ color: '#666', marginLeft: 8 }}>
              {node.isOpen ? <ArrowDropDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
            </span>
          )}
        </Box>
      </div>
    );
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (memoizedTree.length === 0) return <Typography p={3}>Нет папок в этой структуре</Typography>;

  return (
    <>
      <Paper sx={{ height: '100%', overflow: 'hidden', boxShadow: 3, width: '100%' }}>
        <Box sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Заголовок с информацией о структуре */}
          <Box sx={{
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6">Дерево структуры</Typography>
            <Typography variant="body2" color="text.secondary">
              Папки: {memoizedTree.length}
            </Typography>
          </Box>

          {/* Контейнер для дерева */}
          <Box sx={{ flex: 1, overflow: 'auto', width: '100%' }}>
            <Tree
              data={memoizedTree}
              openByDefault={false}
              indent={40}
              rowHeight={45}
              width="100%"
            >
              {renderTreeNode}
            </Tree>
          </Box>
        </Box>
      </Paper>

      {/* Диалог загрузки документа */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !documentLoading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Загрузить документ в папку
        </DialogTitle>
        <DialogContent>
          {selectedFolder && (
            <Typography gutterBottom>
              Папка: <strong>{selectedFolder.name}</strong> ({selectedFolder.code})
            </Typography>
          )}

          {documentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {documentError}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <input
              accept=".xml"
              style={{ display: 'none' }}
              id="document-file-input"
              type="file"
              onChange={handleFileSelect}
              disabled={documentLoading}
            />
            <label htmlFor="document-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={documentLoading}
                fullWidth
                sx={{ mb: 2 }}
              >
                {documentFile ? documentFile.name : 'Выберите XML файл'}
              </Button>
            </label>

            {documentFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Размер: {(documentFile.size / 1024).toFixed(2)} KB
              </Typography>
            )}

            {documentLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={documentProgress}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" align="center">
                  Загрузка: {documentProgress}%
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={documentLoading}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadDocument}
            disabled={!documentFile || documentLoading}
            startIcon={<UploadIcon />}
          >
            {documentLoading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра документов в папке */}
      <Dialog
        open={documentsDialogOpen}
        onClose={() => setDocumentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Документы в папке "{selectedFolder?.name}"
        </DialogTitle>
        <DialogContent>
          {documentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : folderDocuments.length === 0 ? (
            <Typography p={2} textAlign="center" color="text.secondary">
              В этой папке пока нет документов
            </Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {folderDocuments.map((doc, index) => (
                <Paper
                  key={doc.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {doc.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Код: {doc.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Размер: {(doc.file_size / 1024).toFixed(2)} KB
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Загружен: {new Date(doc.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ bgcolor: '#e8f5e9', p: 0.5, borderRadius: 0.5 }}>
                      Хэш: {doc.file_hash?.substring(0, 8)}...
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentsDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}