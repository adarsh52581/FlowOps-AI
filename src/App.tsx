import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { CrowdOpsPage } from './pages/CrowdOpsPage'
import { TranslatorPage } from './pages/TranslatorPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-dvh" style={{ backgroundColor: '#0A0A0A' }}>
        <Routes>
          <Route path="/" element={<CrowdOpsPage />} />
          <Route path="/translator" element={<TranslatorPage />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
