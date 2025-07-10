import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your page components
import StartPage from './pages/StartPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Import your PROTECTED page components
import DashboardPage from './pages/DashboardPage';
import SelectAddressPage from './pages/SelectAddressPage';
import AddAddressPage from './pages/AddAddressPage';
import ChangeAddressPage from './pages/ChangeAddressPage';
import UpdateWorkerDetailsPage from './pages/UpdateWorkerDetailsPage'; 
import WorkerProfilePage from './pages/WorkerProfilePage';
// Import the ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute'; // Adjust path if needed
import ChangeEmailPage from './pages/ChangeEmailPage'; 
function App() {
  return (
    <Router>
      <Routes>
        {/* ====================================================== */}
        {/* PUBLIC ROUTES (Anyone can access these)                */}
        {/* ====================================================== */}
        <Route path="/" element={<StartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* ✅ CORRECT: These must be public for logged-out users */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />


        {/* ====================================================== */}
        {/* PROTECTED ROUTES (Only logged-in users can access)   */}
        {/* ====================================================== */}
        {/* This single ProtectedRoute element now guards all its children */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/select-address" element={<SelectAddressPage />} />
          <Route path="/add-address" element={<AddAddressPage />} />
          <Route path="/change-address" element={<ChangeAddressPage />} />
          <Route path="/update-worker-details" element={<UpdateWorkerDetailsPage />} /> 
          <Route path="/worker-profile/:workerId" element={<WorkerProfilePage />} />
          <Route path="/change-email" element={<ChangeEmailPage />} />
          {/* Add future protected routes here, e.g., for updating worker details */}
          {/* <Route path="/update-worker-details" element={<UpdateWorkerDetailsPage />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;