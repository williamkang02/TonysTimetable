import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/loginPage';
import ForgotPasswordPage from './pages/forgotPasswordPage'
import ProtectedRoute from './utils/protectedRoute';
import RecoveryPage from './pages/recoveryPage';
import AdminPage from './pages/adminPage';
import SignupPage from './pages/signupPage';
import './styles/timetablePage.css';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/resetpassword" element={<RecoveryPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <ProtectedRoute>
                <SignupPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
  );
};

export default App;