import axios from 'axios'

export const api = axios.create({ baseURL: 'http://localhost:8000' })

export const getStructures = async () => {
  return [{ id: '1', name: 'Test structure' }]
}

export const uploadStructure = async (file: File, overwrite = false) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/structure', formData, { params: { overwrite } })
}
