// App.tsx
import { useState } from 'react'
import Header from './components/Header'
import UploadForm from './components/UploadForm'
import DocumentUploadForm from './components/DocumentUploadForm' // НОВЫЙ КОМПОНЕНТ
import Messages from './components/Messages'
import XMLStructurePanel from './components/XMLStructurePanel'
import TreePanelProps from './components/TreePanel'
import { Tabs, Tab, Box } from '@mui/material' // ДОБАВЛЯЕМ TABS
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [selectedStructureId, setSelectedStructureId] = useState<number | null>(null)
  const [tabValue, setTabValue] = useState(0) // Для переключения между вкладками

  return (
    <>
      <Header />

      {/* Tabs для переключения между загрузкой структур и документов */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Структуры" />
          <Tab label="Документы" />
        </Tabs>
      </Box>

      <div className="layout">
        {/* Левая четверть — загрузка + сообщения */}
        <div className="left-block">
          <div className="upload-block">
            {tabValue === 0 ? (
              // Вкладка для загрузки структур
              <UploadForm setMessage={setMessage} />
            ) : (
              // Вкладка для загрузки документов
              <DocumentUploadForm setMessage={setMessage} />
            )}
          </div>

          <Messages message={message} />
        </div>

        {/* Правая половина — дерево выбранной структуры */}
        <div className="right-block">
          {/* Список структур */}
          <XMLStructurePanel
            onSelectStructure={(id) => setSelectedStructureId(id)}
          />

          {selectedStructureId ? (
            <TreePanelProps
              structureId={selectedStructureId}
              onNodeClick={() => {}}
            />
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
              Выберите структуру слева, чтобы увидеть дерево папок
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App