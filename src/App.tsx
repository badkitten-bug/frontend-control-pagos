import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';

// Lazy load pages
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const VehicleList = lazy(() => import('./pages/vehicles/VehicleList').then(m => ({ default: m.VehicleList })));
const ClientList = lazy(() => import('./pages/clients/ClientList').then(m => ({ default: m.ClientList })));
const ContractList = lazy(() => import('./pages/contracts/ContractList').then(m => ({ default: m.ContractList })));
const ContractDetail = lazy(() => import('./pages/contracts/ContractDetail').then(m => ({ default: m.ContractDetail })));
const PaymentRegister = lazy(() => import('./pages/payments/PaymentRegister').then(m => ({ default: m.PaymentRegister })));
const ArrearsReport = lazy(() => import('./pages/reports/ArrearsReport').then(m => ({ default: m.ArrearsReport })));
const TrafficLightReport = lazy(() => import('./pages/reports/TrafficLightReport').then(m => ({ default: m.TrafficLightReport })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900">
    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
