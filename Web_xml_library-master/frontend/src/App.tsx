import { useState } from 'react'
import Header from './components/Header'
import UploadForm from './components/UploadForm'
import Messages from './components/Messages'
import XMLStructurePanel from './components/XMLStructurePanel'
import './App.css'

function App() {
  const [message, setMessage] = useState('')

  return (
    <>
      <Header />
      <div className="layout">
        {/* Левая четверть */}
        <div className="left-block">
          <div className="upload-block">
            <UploadForm setMessage={setMessage} />
          </div>

          <Messages message={message} />
        </div>

        {/* Правая половина */}
        <div className="right-block">
          <XMLStructurePanel />
        </div>
      </div>
    </>
  )
}

export default App