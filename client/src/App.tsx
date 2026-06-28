import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { MapaPage } from './pages/MapaPage'
import { CrearPage } from './pages/CrearPage'
import { PanelPage } from './pages/PanelPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<MapaPage />} />
            <Route path="mapa" element={<MapaPage />} />
            <Route path="crear" element={<CrearPage />} />
            <Route path="panel" element={<PanelPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
