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
import Configuracoes from "./pages/Configuracoes";
import OnboardingOrganization from "./pages/profile/OnboardingOrganization";
import Jurimetria from "./pages/jurimetry";
import { UserService } from "./services/user.service";

/**
 * Componente ProtectedRoute - Verifica se usuário tem organização
 * Se não tiver, redireciona para onboarding
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = UserService.getStoredUser();

  if (!user || !user.organization_id) {
    window.location.href = '/onboarding-organization';
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
        <ProtectedRoute>
          <Layout>
            <Processos />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/novo">
        <ProtectedRoute>
          <Layout>
            <ProcessosNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/:id/editar">
        <ProtectedRoute>
          <Layout>
            <ProcessosEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/:id">
        <ProtectedRoute>
          <Layout>
            <ProcessosView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-action-types"}>
        <ProtectedRoute>
          <Layout>
            <LegalActionTypes />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/novo">
        <ProtectedRoute>
          <Layout>
            <LegalActionTypesNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/:id/editar">
        <ProtectedRoute>
          <Layout>
            <LegalActionTypesEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/:id">
        <ProtectedRoute>
          <Layout>
            <LegalActionTypesView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-action-statuses"}>
        <ProtectedRoute>
          <Layout>
            <LegalActionStatuses />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/novo">
        <ProtectedRoute>
          <Layout>
            <LegalActionStatusesNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/:id/editar">
        <ProtectedRoute>
          <Layout>
            <LegalActionStatusesEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/:id">
        <ProtectedRoute>
          <Layout>
            <LegalActionStatusesView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/jurimetria"}>
        <ProtectedRoute>
          <Layout>
            <Jurimetria />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios"}>
        <ProtectedRoute>
          <Layout>
            <UsuariosList />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/novo"}>
        <ProtectedRoute>
          <Layout>
            <UsuariosNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/:id"}>
        <ProtectedRoute>
          <Layout>
            <UsuariosView />
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
