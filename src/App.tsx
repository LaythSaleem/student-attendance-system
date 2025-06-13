import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useMinimalAuth";
import { Toaster } from "sonner";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import AdminLoginPage from "./pages/AdminLoginPage.tsx";
import TeacherLoginPage from "./pages/TeacherLoginPage.tsx";

console.log('🚀 App.tsx is executing');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/teacher-login" element={<TeacherLoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
