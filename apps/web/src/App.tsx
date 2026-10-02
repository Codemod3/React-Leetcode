import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProblemsListPage } from "./pages/ProblemsListPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProblemWorkspacePage } from "./pages/ProblemWorkspacePage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { AdminRoute } from "./components/AdminRoute";
import { AdminProblemsPage } from "./pages/admin/AdminProblemsPage";
import { AdminProblemEditorPage } from "./pages/admin/AdminProblemEditorPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/problems" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/problems"
          element={
            <ProtectedRoute>
              <ProblemsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/:slug"
          element={
            <ProtectedRoute>
              <ProblemWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminProblemsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/problems/new"
          element={
            <AdminRoute>
              <AdminProblemEditorPage key="new" />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/problems/:id"
          element={
            <AdminRoute>
              <AdminProblemEditorPage />
            </AdminRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <SubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
