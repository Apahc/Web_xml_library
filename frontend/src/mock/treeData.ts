import type { TreeNode } from '../types/models'

export const mockTree: TreeNode[] = [
  {
    id: '1',
    name: 'Root',
    children: [
      {
        id: '2',
        name: 'Child',
        children: [
          { id: '3', name: 'Subchild' }
        ]
      }
    ]
  }
]
