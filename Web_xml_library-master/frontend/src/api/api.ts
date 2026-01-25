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

// API функции

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

// вот это не работает , хотя на бэке вроде норм прописан алгоритм
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

// это создано чтоб работало с xmlStructurePanel
export const apiService = {
  uploadStructure,
  getStructures,
  checkConsistency,
  getFolderTree,
  testAPI
}

export default api

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