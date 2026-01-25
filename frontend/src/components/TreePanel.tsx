import { Tree } from 'react-arborist'
import { Paper } from '@mui/material'
import { mockTree } from '../mock/treeData'
import type { NodeDetails } from '../types/models'

export default function TreePanel({
  onNodeClick
}: {
  onNodeClick: (d: NodeDetails) => void
}) {
  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto', boxShadow: 3 }}>
      <Tree
        data={mockTree}
        openByDefault
        onSelect={() =>
          onNodeClick({
            attrs: { code: '001', name: 'Node' },
            docs: ['Doc 1', 'Doc 2']
          })
        }
      >
        {({ node, style }) => (
          <div
            style={{
              ...style,
              padding: '4px 8px',
              borderRadius: 4,
              marginBottom: 2,
              cursor: 'pointer',
              backgroundColor: node.isSelected ? '#e3f2fd' : 'transparent',
              transition: '0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = node.isSelected ? '#e3f2fd' : 'transparent')
            }
          >
            {node.data.name}
          </div>
        )}
      </Tree>
    </Paper>
  )
}
