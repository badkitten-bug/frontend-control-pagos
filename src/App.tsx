import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/Dashboard';
import { VehicleList } from './pages/vehicles/VehicleList';
import { ContractList } from './pages/contracts/ContractList';
import { ContractDetail } from './pages/contracts/ContractDetail';
import { PaymentRegister } from './pages/payments/PaymentRegister';
import { ArrearsReport } from './pages/reports/ArrearsReport';
import { TrafficLightReport } from './pages/reports/TrafficLightReport';
import { Settings } from './pages/Settings';
import { ClientList } from './pages/clients/ClientList';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/contracts" element={<ContractList />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/payments" element={<PaymentRegister />} />
            <Route path="/reports" element={<ArrearsReport />} />
            <Route path="/reports/traffic-light" element={<TrafficLightReport />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
