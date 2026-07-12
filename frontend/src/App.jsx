import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/budgets" element={<Budgets />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;