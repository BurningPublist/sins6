import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import FlowList from './pages/FlowList'
import FlowEditor from './pages/FlowEditor'
import ExecutionList from './pages/ExecutionList'
import TemplateList from './pages/TemplateList'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/flows" replace />} />
          <Route path="flows" element={<FlowList />} />
          <Route path="flows/:id/edit" element={<FlowEditor />} />
          <Route path="flows/new" element={<FlowEditor />} />
          <Route path="executions" element={<ExecutionList />} />
          <Route path="templates" element={<TemplateList />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App