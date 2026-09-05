import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingFallback } from './components/LoadingFallback';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layouts
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));
const TeknisiLayout = lazy(() => import('./layouts/TeknisiLayout').then(module => ({ default: module.TeknisiLayout })));

// Admin Pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then(module => ({ default: module.Dashboard })));
const DashboardInventaris = lazy(() => import('./pages/admin/DashboardInventaris').then(module => ({ default: module.DashboardInventaris })));
const Pelanggan = lazy(() => import('./pages/admin/Pelanggan').then(module => ({ default: module.Pelanggan })));
const LoginAdmin = lazy(() => import('./pages/admin/LoginAdmin').then(module => ({ default: module.LoginAdmin })));
const AsetGudang = lazy(() => import('./pages/admin/AsetGudang').then(module => ({ default: module.AsetGudang })));
const AsetMasuk = lazy(() => import('./pages/admin/AsetMasuk').then(module => ({ default: module.AsetMasuk })));
const AsetKeluar = lazy(() => import('./pages/admin/AsetKeluar').then(module => ({ default: module.AsetKeluar })));
const PengaturanAI = lazy(() => import('./pages/admin/PengaturanAI').then(module => ({ default: module.PengaturanAI })));
const PengaturanPenugasan = lazy(() => import('./pages/admin/PengaturanPenugasan').then(module => ({ default: module.PengaturanPenugasan })));
const PesanPelanggan = lazy(() => import('./pages/admin/PesanPelanggan').then(module => ({ default: module.PesanPelanggan })));
const OrderPelanggan = lazy(() => import('./pages/admin/OrderPelanggan').then(module => ({ default: module.OrderPelanggan })));
const PenugasanTeknisi = lazy(() => import('./pages/admin/PenugasanTeknisi').then(module => ({ default: module.PenugasanTeknisi })));
const ManajemenAkun = lazy(() => import('./pages/admin/ManajemenAkun').then(module => ({ default: module.ManajemenAkun })));
const MonitoringAset = lazy(() => import('./pages/admin/MonitoringAset').then(module => ({ default: module.MonitoringAset })));
const MonitoringRusak = lazy(() => import('./pages/admin/MonitoringRusak').then(module => ({ default: module.MonitoringRusak })));
const PemetaanODP = lazy(() => import('./pages/admin/PemetaanODP').then(module => ({ default: module.PemetaanODP })));

// Teknisi Pages
const LoginTeknisi = lazy(() => import('./pages/teknisi/LoginTeknisi').then(module => ({ default: module.LoginTeknisi })));
const PetaODP = lazy(() => import('./pages/teknisi/PetaODP').then(module => ({ default: module.PetaODP })));
const TugasSaya = lazy(() => import('./pages/teknisi/TugasSaya').then(module => ({ default: module.TugasSaya })));
const RiwayatTugas = lazy(() => import('./pages/teknisi/RiwayatTugas').then(module => ({ default: module.RiwayatTugas })));


// Documentation Page
const DokumentasiAlur = lazy(() => import('./pages/DokumentasiAlur').then(module => ({ default: module.DokumentasiAlur })));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster 
        position="top-center" 
        containerStyle={{
          zIndex: 99999,
          top: 20
        }}
        toastOptions={{
          duration: 3500,
          style: {
            zIndex: 99999,
            background: '#152C4A',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 600,
            borderRadius: '10px',
            padding: '10px 16px',
            boxShadow: '0 10px 25px -5px rgba(21, 44, 74, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: "'Inter', sans-serif",
            maxWidth: '420px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#064E3B',
              color: '#ECFDF5',
              border: '1px solid #059669',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#7F1D1D',
              color: '#FEF2F2',
              border: '1px solid #DC2626',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* Public Documentation Routes for Testing Team */}
          <Route path="/panduan" element={<DokumentasiAlur />} />
          <Route path="/dokumentasi" element={<DokumentasiAlur />} />

          {/* Default route redirects to login */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<LoginAdmin />} />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard-inventaris" element={<DashboardInventaris />} />
            <Route path="pelanggan" element={<Pelanggan />} />
            <Route path="order-pelanggan" element={<OrderPelanggan />} />
            <Route path="penugasan" element={<PenugasanTeknisi />} />
            <Route path="pengaturan-penugasan" element={<PengaturanPenugasan />} />
            <Route path="akun" element={<ManajemenAkun />} />
            <Route path="pemetaan" element={<PemetaanODP />} />
            <Route path="aset-gudang" element={<AsetGudang />} />
            <Route path="aset-masuk" element={<AsetMasuk />} />
            <Route path="aset-keluar" element={<AsetKeluar />} />
            <Route path="pesan" element={<PesanPelanggan />} />
            <Route path="pengaturan-ai" element={<PengaturanAI />} />
            <Route path="monitoring-aset" element={<MonitoringAset />} />
            <Route path="monitoring-rusak" element={<MonitoringRusak />} />
            <Route path="panduan" element={<DokumentasiAlur />} />
            <Route path="dokumentasi" element={<DokumentasiAlur />} />
          </Route>

          {/* Teknisi Routes */}
          <Route path="/teknisi/login" element={<LoginTeknisi />} />
          <Route path="/teknisi" element={
            <ProtectedRoute role="teknisi">
              <TeknisiLayout />
            </ProtectedRoute>
          }>
            <Route path="peta-odp" element={<PetaODP />} />
            <Route path="tugas" element={<TugasSaya />} />
            <Route path="riwayat" element={<RiwayatTugas />} />
            <Route path="panduan" element={<DokumentasiAlur />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
