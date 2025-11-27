import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GestaoProvider } from './contexts/GestaoContext';
import { DirectorateProvider } from './contexts/DirectorateContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import GestaoEstrategica from './pages/GestaoEstrategica';
import Administracao from './pages/Administracao';
import Pessoas from './pages/Pessoas';
import Placeholder from './pages/Placeholder';
import { FormBuilder } from './components/pessoas/FormBuilder';
import { FormFiller } from './components/pessoas/FormFiller';
import { FormResponses } from './components/pessoas/FormResponses';

function App() {
  return (
    <AuthProvider>
      <DirectorateProvider>
        <GestaoProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/gestao-estrategica" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gestao-estrategica"
                element={
                  <ProtectedRoute>
                    <GestaoEstrategica />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/administracao"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Administracao />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pessoas"
                element={
                  <ProtectedRoute>
                    <Pessoas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pessoas/criar"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <FormBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pessoas/editar/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <FormBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pessoas/responder/:id"
                element={
                  <ProtectedRoute>
                    <FormFiller />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pessoas/respostas/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <FormResponses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comites"
                element={
                  <ProtectedRoute>
                    <Placeholder title="Comitês" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contratos-tic"
                element={
                  <ProtectedRoute>
                    <Placeholder title="Contratos TIC" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/proad-acervo"
                element={
                  <ProtectedRoute>
                    <Placeholder title="PROAD - Acervo" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financeira/*"
                element={
                  <ProtectedRoute>
                    <Placeholder title="Diretoria Financeira" />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </GestaoProvider>
      </DirectorateProvider>
    </AuthProvider>
  );
}

export default App;