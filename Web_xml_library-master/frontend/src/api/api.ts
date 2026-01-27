// api.ts
import axios from 'axios'

// не трогать
const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// API функции для структур

// это работает - не трогаем
export const uploadStructure = async (file: File, structureId?: number) => {
  const formData = new FormData()
  formData.append('file', file)

  const url = structureId
    ? `/structures/${structureId}/upload/`
    : '/structures/upload/'

  const response = await api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  })

  return response.data
}

// работает - но надо в tree panel впихнуть
export const getStructures = async () => {
  try {
    const response = await api.get('/structures/')
    return response.data.structures || []
  } catch (error) {
    console.error('Error fetching structures:', error)
    return []
  }
}

// работает
export const checkConsistency = async (structureId: number) => {
  try {
    const response = await api.get(`/structures/consistency-check/${structureId}/`)
    return response.data
  } catch (error) {
    console.error('Error checking consistency:', error)
    throw error
  }
}

export const getFolderTree = async (structureId: number) => {
  try {
    const response = await api.get(`/structures/${structureId}/folders/`);
    console.log('Полный ответ API:', response.data);
    console.log('Поле tree:', response.data.tree);
    return response.data.tree || [];  // возвращаем именно nested tree
  } catch (error) {
    console.error('Error fetching folder tree:', error);
    return [];
  }
};

export const testAPI = async () => {
  try {
    const response = await api.get('/structures/test/')
    return response.data
  } catch (error) {
    console.error('API test error:', error)
    throw error
  }
}

// после ввода названия документа страница падает 
export const search_structure = async (query: string) => {
  try {
    const response = await api.get(`/structures/search/?q=${encodeURIComponent(query)}`);
    return response.data; // возвращаем что угодно, что пришло с бэка
  } catch (error) {
    console.error('Ошибка поиска структур:', error);
    return []; // если ошибка — возвращаем пустой массив, чтобы не падало
  }
};

// Функции для документов
export const uploadDocument = async (file: File, structureId: number, force?: boolean) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('structure_id', structureId.toString())
  
  if (force) {
    formData.append('force', 'true')
  }

  const response = await api.post('/documents/upload-single/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  })

  return response.data
}

export const getDocumentFolders = async (documentId: number) => {
  try {
    const response = await api.get(`/documents/${documentId}/folders/`)
    return response.data
  } catch (error) {
    console.error('Error fetching document folders:', error)
    return { folders: [] }
  }
}

export const getDocumentsByFolder = async (folderId: number) => {
  try {
    const response = await api.get(`/documents/folder/${folderId}/`)
    return response.data
  } catch (error) {
    console.error('Error fetching documents by folder:', error)
    return { documents: [] }
  }
}

export const handleDuplicateDecision = async (data: {
  decision: 'rename' | 'overwrite' | 'skip'
  proposed_code?: string
  original_data: any
}) => {
  const response = await api.post('/documents/handle-duplicate/', data)
  return response.data
}

// Единый объект apiService со всеми функциями
export const apiService = {
  // Функции для структур
  uploadStructure,
  getStructures,
  checkConsistency,
  getFolderTree,
  testAPI,
  search_structure,
  
  // Функции для документов
  uploadDocument,
  getDocumentFolders,
  getDocumentsByFolder,
  handleDuplicateDecision
}

export default api