import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import { TokenExpirationAlert } from "./components/TokenExpirationAlert";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard";
import Register from "./pages/auth/Register";
import Profile from "./pages/profile/Profile";
import ClientsList from "./pages/clients/index";
import ClientsNew from "./pages/clients/new";
import ClientsEdit from "./pages/clients/edit";
import Processos from "./pages/legal-actions";
import ProcessosNew from "./pages/legal-actions/new";
import ProcessosEdit from "./pages/legal-actions/edit";
import ProcessosView from "./pages/legal-actions/view";
import LegalActionTypes from "./pages/legal-action-types";
import LegalActionTypesNew from "./pages/legal-action-types/new";
import LegalActionTypesEdit from "./pages/legal-action-types/edit";
import LegalActionTypesView from "./pages/legal-action-types/view";
import LegalActionStatuses from "./pages/legal-action-statuses";
import LegalActionStatusesNew from "./pages/legal-action-statuses/new";
import LegalActionStatusesEdit from "./pages/legal-action-statuses/edit";
import LegalActionStatusesView from "./pages/legal-action-statuses/view";
import UsuariosList from "./pages/users/index";
import UsuariosNew from "./pages/users/new";
import UsuariosView from "./pages/users/view";
import UsuariosEdit from "./pages/users/edit";
import Configuracoes from "./pages/Configuracoes";
import OnboardingOrganization from "./pages/profile/OnboardingOrganization";
import Jurimetria from "./pages/jurimetry";
import { UserService } from "./services/user.service";
import { UserRole } from "./lib/rbac";

/**
 * Componente ProtectedRoute - Verifica se usuário tem organização
 * Se não tiver, redireciona para onboarding
 */
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const user = UserService.getStoredUser();
  const userRole = user?.role;

  if (!user || !user.organization_id) {
    window.location.href = '/onboarding-organization';
    return null;
  }

  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    window.location.href = '/home';
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Rotas sem Layout (Login/Register) */}
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/onboarding-organization"} component={OnboardingOrganization} />
      <Route path={"/"} component={Login} />
      
      {/* Rotas com Layout (Dashboard e páginas internas) */}
      <Route path={"/home"}>
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/clientes"}>
        <ProtectedRoute>
          <Layout>
            <ClientsList />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/clientes/novo">
        <ProtectedRoute>
          <Layout>
            <ClientsNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/clientes/:id/editar">
        <ProtectedRoute>
          <Layout>
            <ClientsEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-actions"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <Processos />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/novo">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <ProcessosNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/:id/editar">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <ProcessosEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/:id">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <ProcessosView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-action-types"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionTypes />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/novo">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionTypesNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/:id/editar">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionTypesEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/:id">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionTypesView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-action-statuses"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionStatuses />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/novo">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionStatusesNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/:id/editar">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionStatusesEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/:id">
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <LegalActionStatusesView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/jurimetria"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER", "VIEWER"]}>
          <Layout>
            <Jurimetria />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER"]}>
          <Layout>
            <UsuariosList />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/novo"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER"]}>
          <Layout>
            <UsuariosNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/:id"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER", "MEMBER"]}>
          <Layout>
            <UsuariosView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/:id/edit"}>
        <ProtectedRoute allowedRoles={["ADMIN", "OWNER"]}>
          <Layout>
            <UsuariosEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/profile"}>
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/configuracoes">
        <ProtectedRoute>
          <Layout>
            <Configuracoes />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      {/* Rotas de erro */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <TokenExpirationAlert />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
