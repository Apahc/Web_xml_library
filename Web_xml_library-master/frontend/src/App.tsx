import { useState } from 'react'
import Header from './components/Header'
import UploadForm from './components/UploadForm'
import Messages from './components/Messages'
import XMLStructurePanel from './components/XMLStructurePanel'
import TreePanelProps from './components/TreePanel'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [selectedStructureId, setSelectedStructureId] = useState<number | null>(null)

  return (
    <>
      <Header />
      <div className="layout">
        {/* Левая четверть — загрузка + сообщения + список структур */}
        <div className="left-block">
          <div className="upload-block">
            <UploadForm setMessage={setMessage} />
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
            <TreePanelProps structureId={selectedStructureId} onNodeClick={function (): void {
              throw new Error('Function not implemented.')
            } } />
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