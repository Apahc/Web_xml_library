import Header from './components/Header'
import UploadForm from './components/UploadForm'
import Messages from './components/Messages'
import XMLStructurePanel from './components/XMLStructurePanel'
import './App.css'

function App() {
  return (
    <>
      <Header />
      <div className="layout">
        {/* Левая четверть: серый фон */}
        <div className="left-block">
          <div className="upload-block">
            <UploadForm setMessage={() => {}} />
          </div>

          <Messages />
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
