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
import ActivitiesPage from "./pages/activities/activities/index";
import ActivityNewPage from "./pages/activities/activities/new";
import ActivityEditPage from "./pages/activities/activities/edit";
import ColumnsManagerPage from "./pages/activities/columns/index";
import Configuracoes from "./pages/Configuracoes";
import OnboardingOrganization from "./pages/profile/OnboardingOrganization";
import Jurimetria from "./pages/jurimetry";
import { UserService } from "./services/user.service";
import { primeiraRotaPermitida, temPermissao, type AcaoPermissao, type ModuloSistema } from "./lib/rbac";

/**
 * Componente ProtectedRoute - Verifica se usuário tem organização
 * Se não tiver, redireciona para onboarding
 */
function ProtectedRoute({
  children,
  modulo,
  acao = "visualizar",
}: {
  children: React.ReactNode;
  modulo?: ModuloSistema;
  acao?: AcaoPermissao;
}) {
  const user = UserService.getStoredUser();

  if (!user || !user.organization_id) {
    window.location.href = "/onboarding-organization";
    return null;
  }

  if (modulo && !temPermissao(modulo, acao)) {
    const destino = primeiraRotaPermitida();
    if (window.location.pathname !== destino) {
      window.location.href = destino;
    }
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Rotas sem Layout (Login) */}
      <Route path={"/login"} component={Login} />
      <Route
        path={"/onboarding-organization"}
        component={OnboardingOrganization}
      />
      <Route path={"/"} component={Login} />
      {/* Rotas com Layout (Dashboard e páginas internas) */}
      <Route path={"/home"}>
        <ProtectedRoute modulo="dashboard">
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/clientes"}>
        <ProtectedRoute modulo="clientes">
          <Layout>
            <ClientsList />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/clientes/novo">
        <ProtectedRoute modulo="clientes" acao="criar">
          <Layout>
            <ClientsNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/clientes/:id/editar">
        <ProtectedRoute modulo="clientes" acao="editar">
          <Layout>
            <ClientsEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/activities"}>
        <ProtectedRoute modulo="atividades">
          <Layout>
            <ActivitiesPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/activities/novo">
        <ProtectedRoute modulo="atividades" acao="criar">
          <Layout>
            <ActivityNewPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/activities/columns-manager">
        <ProtectedRoute modulo="atividades" acao="editar">
          <Layout>
            <ColumnsManagerPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/activities/:id">
        <ProtectedRoute modulo="atividades" acao="editar">
          <Layout>
            <ActivityEditPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-actions"}>
        <ProtectedRoute modulo="processos">
          <Layout>
            <Processos />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/novo">
        <ProtectedRoute modulo="processos" acao="criar">
          <Layout>
            <ProcessosNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/:id/editar">
        <ProtectedRoute modulo="processos" acao="editar">
          <Layout>
            <ProcessosEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-actions/:id">
        <ProtectedRoute modulo="processos">
          <Layout>
            <ProcessosView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-action-types"}>
        <ProtectedRoute modulo="processos">
          <Layout>
            <LegalActionTypes />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/novo">
        <ProtectedRoute modulo="processos" acao="criar">
          <Layout>
            <LegalActionTypesNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/:id/editar">
        <ProtectedRoute modulo="processos" acao="editar">
          <Layout>
            <LegalActionTypesEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-types/:id">
        <ProtectedRoute modulo="processos">
          <Layout>
            <LegalActionTypesView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/legal-action-statuses"}>
        <ProtectedRoute modulo="processos">
          <Layout>
            <LegalActionStatuses />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/novo">
        <ProtectedRoute modulo="processos" acao="criar">
          <Layout>
            <LegalActionStatusesNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/:id/editar">
        <ProtectedRoute modulo="processos" acao="editar">
          <Layout>
            <LegalActionStatusesEdit />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/legal-action-statuses/:id">
        <ProtectedRoute modulo="processos">
          <Layout>
            <LegalActionStatusesView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/jurimetria"}>
        <ProtectedRoute modulo="jurimetria">
          <Layout>
            <Jurimetria />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios"}>
        <ProtectedRoute modulo="usuarios">
          <Layout>
            <UsuariosList />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/novo"}>
        <ProtectedRoute modulo="usuarios" acao="criar">
          <Layout>
            <UsuariosNew />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/:id"}>
        <ProtectedRoute modulo="usuarios">
          <Layout>
            <UsuariosView />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path={"/usuarios/:id/edit"}>
        <ProtectedRoute modulo="usuarios" acao="editar">
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
        <ProtectedRoute modulo="configuracoes">
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
      <ThemeProvider defaultTheme="light">
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
