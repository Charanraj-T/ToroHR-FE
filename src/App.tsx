import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
