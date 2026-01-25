import { useState, useEffect } from 'react';
import { Tree } from 'react-arborist';
import { Paper, CircularProgress, Alert, Box, Typography } from '@mui/material';
import { getFolderTree } from '../api/api';
import type { TreeNode, NodeDetails } from '../types/models';
import DocumentUpload from './DocumentUpload';

interface TreePanelProps {
  structureId: number;
  onNodeClick: (details: NodeDetails) => void;
}

export default function TreePanel({ structureId, onNodeClick }: TreePanelProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  useEffect(() => {
    if (!structureId) return;

    setLoading(true);
    setError(null);

    getFolderTree(structureId)
      .then((treeFromApi: TreeNode[]) => {
        console.log('Полученное дерево от бэка:', treeFromApi);
        setTreeData(treeFromApi);
      })
      .catch(err => {
        console.error('Ошибка загрузки дерева:', err);
        setError('Не удалось загрузить дерево');
      })
      .finally(() => setLoading(false));
  }, [structureId]);

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (treeData.length === 0) return <Typography p={3}>Нет папок в этой структуре</Typography>;

  return (
    <Paper sx={{ height: '100%', overflow: 'auto', boxShadow: 3 }}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Дерево структуры
        </Typography>
      </Box>

      <Tree
        data={treeData}
        openByDefault={false}          // теперь по умолчанию свёрнуто
        indent={28}
        rowHeight={40}
        onSelect={(nodes) => {
          if (nodes.length > 0) {
            const node = nodes[0].data;
            const folderId = Number(node.id);
            setSelectedFolderId(folderId);

            onNodeClick({
              attrs: {
                code: node.code || '—',
                name: node.name,
                ...(node.attributes || {})
              },
              docs: node.docs || []
            });
          }
        }}
      >
        {({ node, style, ref }: any) => (
          <div
            ref={ref}
            style={{
              ...style,
              padding: '8px 12px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              background: node.isSelected ? '#e8f4fd' : 'white',
              fontWeight: node.data.children?.length ? 600 : 400,
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => node.toggle()} // ← клик по строке раскрывает/закрывает
          >
            {node.data.name}
            {node.data.code && (
              <small style={{ color: '#666', marginLeft: 8 }}>
                ({node.data.code})
              </small>
            )}
          </div>
        )}
      </Tree>

      {selectedFolderId && (
        <Box mt={3} p={2} border={1} borderColor="grey.300" borderRadius={1}>
          <DocumentUpload 
            folderId={selectedFolderId} 
            onSuccess={() => window.location.reload()}
          />
        </Box>
      )}
    </Paper>
  );
}