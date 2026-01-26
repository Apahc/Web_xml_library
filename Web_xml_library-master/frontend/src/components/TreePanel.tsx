import { useState, useEffect, useMemo } from 'react';
import { Tree } from 'react-arborist';
import { Paper, CircularProgress, Alert, Box, Typography } from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getFolderTree } from '../api/api';
import type { TreeNode, NodeDetails } from '../types/models';

interface TreePanelProps {
  structureId: number;
  onNodeClick: (details: NodeDetails) => void;
}

export default function TreePanel({ structureId }: TreePanelProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const memoizedTree = useMemo(() => treeData, [treeData]);

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
  if (memoizedTree.length === 0) return <Typography p={3}>Нет папок в этой структуре</Typography>;

  return (
    <Paper sx={{ height: '100%', overflow: 'hidden', boxShadow: 3, width: '100%' }}> {/* overflow hidden на Paper */}
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Заголовок */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6">Дерево структуры</Typography>
        </Box>

        {/* Контейнер для дерева — занимает всю высоту и ширину */}
        <Box sx={{ flex: 1, overflow: 'auto', width: '100%' }}>
          <Tree
            data={memoizedTree}
            openByDefault={false}
            indent={40}                    // отступ вложенности
            rowHeight={40}
            width="100%"                   // дерево на всю ширину
          >
            {({ node, style, ref }: any) => (
              <div
                ref={ref}
                style={{
                  ...style,
                  padding: '8px 16px',     // внутренние отступы
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: node.isSelected ? '#e8f4fd' : 'white',
                  fontWeight: node.data.children?.length ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginLeft: node.depth * 40 + 'px', // ← отступ слева по уровню (со 2-го уровня виден)
                  width: 'auto',               // не растягиваем узел на всю ширину
                  minWidth: 'fit-content'      // минимум по содержимому
                }}
                onClick={() => node.toggle()}
              >
                {/* Имя + код — занимает всё доступное место слева */}
                <span style={{ 
                  flex: 1, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {node.data.name}
                  {node.data.code && (
                    <small style={{ color: '#666', marginLeft: 8 }}>
                      ({node.data.code})
                    </small>
                  )}
                </span>

                {/* Стрелочка всегда справа, не скроллится */}
                {node.data.children?.length > 0 && (
                  <span style={{ 
                    color: '#666', 
                    marginLeft: 12, 
                    flexShrink: 0 
                  }}>
                    {node.isOpen ? <ArrowDropDownIcon fontSize="small" /> : <ArrowRightIcon fontSize="small" />}
                  </span>
                )}
              </div>
            )}
          </Tree>
        </Box>
      </Box>
    </Paper>
  );
}