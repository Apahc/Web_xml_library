import { useState } from 'react'
import { Typography, TextField, List, ListItem, ListItemButton, ListItemText } from '@mui/material'
import type { TreeNode, NodeDetails } from '../types/models'
import { mockTree } from '../mock/treeData'

export default function XMLStructurePanel() {
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null)

  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
      .map((n) => ({
        ...n,
        children: n.children ? filterTree(n.children) : undefined
      }))
  }

  const filteredTree = filterTree(mockTree)

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode({
      attrs: { code: node.id, name: node.name },
      docs: [`Document for ${node.name}`]
    })
  }

  const renderTree = (nodes: TreeNode[], level = 0) => {
    return (
      <List dense disablePadding>
        {nodes.map((node) => (
          <div key={node.id}>
            <ListItem disablePadding>
              <ListItemButton
                sx={{ pl: 2 + level * 2 }}
                onClick={() => handleNodeClick(node)}
                selected={selectedNode?.attrs.code === node.id}
              >
                <ListItemText primary={node.name} />
              </ListItemButton>
            </ListItem>
            {node.children && renderTree(node.children, level + 1)}
          </div>
        ))}
      </List>
    )
  }

  return (
    <div style={{ padding: 16 }}> {/* просто div без Paper */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search XML files"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 1 }}
      />

      <Typography variant="subtitle1" gutterBottom>
        XML Structure
      </Typography>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {renderTree(filteredTree)}
      </div>

      {selectedNode && (
        <div style={{ padding: 8, marginTop: 16, backgroundColor: '#f5f7fa', borderRadius: 4 }}>
          <Typography variant="subtitle2">Node Attributes</Typography>
          <Typography variant="body2">Attributes:</Typography>
          <pre>{JSON.stringify(selectedNode.attrs, null, 2)}</pre>
          <Typography variant="body2">Linked Documents:</Typography>
          <List dense>
            {selectedNode.docs.map((doc) => (
              <ListItem key={doc}>
                <ListItemText primary={doc} />
              </ListItem>
            ))}
          </List>
        </div>
      )}
    </div>
  )
}