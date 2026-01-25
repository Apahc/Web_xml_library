export interface Structure {
  id: string
  name: string
}

export interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
}

export interface NodeDetails {
  attrs: Record<string, string>
  docs: string[]
}
