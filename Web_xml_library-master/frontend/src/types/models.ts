export interface Structure {
  id: string
  name: string
}

export interface TreeNode {
  id: string;
  name: string;
  code: string | null;
  attributes?: Record<string, any>;
  has_children?: boolean;
  children?: TreeNode[];
  docs?: string[];  // если добавишь позже
  ref: any;
}

export interface NodeDetails {
  attrs: Record<string, string>
  docs: string[]
}

export interface Structure {
  id: string
  name: string
  description: string
}

export interface Folder {
  id: number
  name: string
  code: string | null
  parent_id: number | null
  materialized_path: string
}



// Добавляем тип для документа
export interface Document {
  id: number;
  code: string;
  name: string;
  metadata: Record<string, any>;
  file_path: string;
  file_size: number;
  file_hash: string;
  created_at: string;
  updated_at: string;
}