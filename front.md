# 🔐 Sistema de Roles e Permissões - Frontend Implementation Guide

## Visão Geral do Sistema

O backend implementou um sistema completo de roles com isolamento de dados por organização e por usuário. O frontend deve validar e respeitar essas permissões para melhor UX.

---

## 📋 Roles Disponíveis

### 1. **ADMIN**
- Acesso total a tudo
- Vê todos os dados da organização
- Pode convidar usuários com qualquer role
- Pode gerenciar processos e jurimetria

### 2. **OWNER**
- Mesmo acesso que ADMIN
- Identificado como criador da organização
- Pode convidar usuários com qualquer role

### 3. **MEMBER**
- Acesso total a criação/edição/deleção
- **Vê APENAS seus dados** (clientes, processos, etc que criou)
- Pode acessar processos e jurimetria
- Não pode convidar ou gerenciar convites

### 4. **VIEWER**
- Acesso **somente leitura** (sem criar/editar/deletar)
- **Vê APENAS seus dados**
- Pode acessar processos e jurimetria
- Não pode convidar ou gerenciar convites

### 5. **ASSISTANT**
- Acesso total a criação/edição/deleção (de clientes)
- **Vê APENAS seus dados**
- **NÃO pode acessar processos e jurimetria**
- **NÃO pode treinar modelos de ML**
- Não pode convidar ou gerenciar convites

---

## 🎯 Matriz de Permissões por Endpoint

| Endpoint | ADMIN | OWNER | MEMBER | VIEWER | ASSISTANT | Dados Visíveis |
|----------|-------|-------|--------|--------|-----------|---|
| **CLIENTES** |
| `POST /clients` | ✅ | ✅ | ✅ | ❌ 403 | ✅ | - |
| `GET /clients` | ✅ | ✅ | ✅ | ✅ | ✅ | Total / Seus |
| `GET /clients/{id}` | ✅ | ✅ | ✅ | ✅ | ✅ | Total / Seus |
| `PUT /clients/{id}` | ✅ | ✅ | ✅ | ❌ 403 | ✅ | Total / Seus |
| `DELETE /clients/{id}` | ✅ | ✅ | ✅ | ❌ 403 | ✅ | Total / Seus |
| **PROCESSOS** |
| `POST /legal-actions` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| `GET /legal-actions` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | Total / Seus |
| `GET /legal-actions/{id}` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | Total / Seus |
| `PUT /legal-actions/{id}` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | Total / Seus |
| `DELETE /legal-actions/{id}` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | Total / Seus |
| **TIPOS & STATUS** |
| `POST /legal-action-types` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| `GET /legal-action-types` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| `POST /legal-action-statuses` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| `GET /legal-action-statuses` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| **JURIMETRIA** |
| `POST /jurimetria/previsao-tempo/*` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| **MACHINE LEARNING** |
| `POST /ml/train` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| **DATAJUD** |
| `POST /integracao/datajud/batch/processos` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | - |
| **DASHBOARD** |
| `GET /dashboard/stats` | ✅ | ✅ | ✅ | ✅ | ❌ 403 | Total / Seus |
| **ORGANIZAÇÕES** |
| `POST /organizations` | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | - |
| `GET /organizations` | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| `PUT /organizations` | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | - |
| **CONVITES** |
| `POST /invitations` | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | - |
| `GET /invitations` | ✅ | ✅ | ❌ 403 | ❌ 403 | ❌ 403 | - |
| **USUÁRIOS** |
| `POST /users/register` | ❌ Auth | ❌ Auth | ❌ Auth | ❌ Auth | ❌ Auth | - |
| `GET /users/me` | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| `GET /users` | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| `PUT /users/{id}` | ✅ | ✅ | ✅ | ❌ 403 | ✅ | Próprio / Admin |
| `DELETE /users/{id}` | ✅ | ✅ | ✅ | ❌ 403 | ✅ | Próprio / Admin |

---

## 🎨 Frontend - O Que Implementar

### 1. **Após Login - Obter Role do Usuário**

```javascript
// 1. Fazer login
const loginResponse = await api.post('/auth/login', credentials);
localStorage.setItem('token', loginResponse.access_token);

// 2. Buscar dados do usuário com role
const userResponse = await api.get('/users/me');
const userRole = userResponse.role; // 'admin', 'owner', 'member', 'viewer', 'assistant'
localStorage.setItem('userRole', userRole);

// 3. Usar em toda a aplicação
const currentRole = localStorage.getItem('userRole');
```

---

### 2. **Componentes - Esconder Baseado na Role**

#### A. Menu Lateral
```javascript
const menuItems = [
  { label: 'Dashboard', route: '/dashboard', roles: ['admin', 'owner', 'member', 'viewer', 'assistant'] },
  { label: 'Clientes', route: '/clients', roles: ['admin', 'owner', 'member', 'viewer', 'assistant'] },
  { label: 'Processos', route: '/legal-actions', roles: ['admin', 'owner', 'member', 'viewer'] }, // Assistant não vê
  { label: 'Jurimetria', route: '/jurimetria', roles: ['admin', 'owner', 'member', 'viewer'] }, // Assistant não vê
  { label: 'Previsões', route: '/predictions', roles: ['admin', 'owner', 'member', 'viewer'] }, // Assistant não vê
  { label: 'ML & Treino', route: '/ml', roles: ['admin', 'owner', 'member', 'viewer'] }, // Assistant não vê
  { label: 'Usuários', route: '/users', roles: ['admin', 'owner', 'member'] },
  { label: 'Convites', route: '/invitations', roles: ['admin', 'owner'] },
  { label: 'Organizações', route: '/organizations', roles: ['admin', 'owner'] },
];

function renderMenu(currentRole) {
  return menuItems
    .filter(item => item.roles.includes(currentRole))
    .map(item => <MenuItem key={item.route} to={item.route}>{item.label}</MenuItem>);
}
```

#### B. Botões de Ação
```javascript
// Clientes
{userRole !== 'viewer' && (
  <>
    <button onClick={handleCreate}>Criar Cliente</button>
    <button onClick={handleEdit}>Editar</button>
    <button onClick={handleDelete}>Deletar</button>
  </>
)}

// Processos (hidden para assistant)
{!['assistant'].includes(userRole) && (
  <>
    <button onClick={handleCreateProcess}>Novo Processo</button>
    <button onClick={handleEditProcess}>Editar Processo</button>
  </>
)}

// Convites (only admin/owner)
{['admin', 'owner'].includes(userRole) && (
  <button onClick={handleInviteUser}>Convidar Usuário</button>
)}
```

#### C. Abas de Navegação
```javascript
const tabs = [
  { label: 'Cliente', value: 'client', roles: ['admin', 'owner', 'member', 'viewer', 'assistant'] },
  { label: 'Processos', value: 'processes', roles: ['admin', 'owner', 'member', 'viewer'] },
  { label: 'Jurimetria', value: 'jurimetry', roles: ['admin', 'owner', 'member', 'viewer'] },
  { label: 'Documentos', value: 'documents', roles: ['admin', 'owner', 'member', 'viewer', 'assistant'] },
];

function renderTabs(currentRole) {
  return tabs
    .filter(tab => tab.roles.includes(currentRole))
    .map(tab => <Tab key={tab.value} label={tab.label} value={tab.value} />);
}
```

---

### 3. **Tratamento de Erros 403**

```javascript
// Interceptor de requisições
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Mostrar toast
      toast.error(
        error.response.data?.detail || 
        'Você não tem permissão para realizar esta ação'
      );
      
      // Não fazer request novamente
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);
```

---

### 4. **Modal de Convidar - Select de Roles**

```javascript
function InviteModal() {
  const rolesOptions = [
    { value: 'admin', label: 'Administrador - Acesso total' },
    { value: 'member', label: 'Membro - Vê apenas seus dados' },
    { value: 'viewer', label: 'Visualizador - Apenas leitura' },
    { value: 'assistant', label: 'Assistente - Sem processos/jurimetria' },
  ];

  // Only show roles that current user can assign
  const allowedRoles = ['admin', 'owner'].includes(currentRole)
    ? rolesOptions
    : [];

  return (
    <select name="role">
      {allowedRoles.map(role => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}
```

---

### 5. **Filtros e Dados Automáticos**

```javascript
// Não precisa fazer nada especial!
// O backend já filtra automaticamente baseado na role

// Se for MEMBER com id=5:
// GET /clients → retorna apenas clientes com user_id=5

// Se for ADMIN:
// GET /clients → retorna todos os clientes da organização

// Frontend consome a resposta normalmente
const response = await api.get('/clients');
const clients = response.data.clients; // Já vem filtrado!
```

---

### 6. **Profile/Settings do Usuário**

```javascript
function UserProfile() {
  const user = await api.get('/users/me');

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Nome: {user.full_name}</p>
      <p>Role: <Badge>{user.role}</Badge></p>
      <p>Organização: {user.organization?.name}</p>
    </div>
  );
}
```

---

## ⚠️ Erros HTTP Esperados

### 400 Bad Request
```json
{
  "detail": "Email já registrado"
}
```

### 403 Forbidden
```json
// VIEWER tenta criar
{
  "detail": "Visualizadores apenas leem dados, não podem criar, editar ou deletar."
}

// ASSISTANT tenta acessar processos
{
  "detail": "Assistentes não têm permissão para acessar processos e jurimetria."
}

// MEMBER tenta acessar outro cliente
{
  "detail": "Cliente não encontrado"  // Esconde que existe
}

// NÃO pode convidar
{
  "detail": "Apenas administradores ou proprietários podem convidar."
}
```

### 404 Not Found
```json
{
  "detail": "Cliente não encontrado"
}
```

---

## 🔄 Fluxos de Uso

### Fluxo 1: Admin Cria Uma Novo Member
```
1. Admin clica em "Convidar Usuário"
2. Preenche email e seleciona role "member"
3. Backend envia convite
4. Novo membro recebe email
5. Membro faz login
6. Membro acessa dados, mas vê apenas seus clientes/processos
```

### Fluxo 2: Member Tenta Editar Cliente De Outro Member
```
1. Member A vê apenas seus 5 clientes (filtro automático)
2. Member A tenta acessar /clients/999 (de outro member)
3. Backend retorna 404 (como se não existisse)
4. Frontend mostra "Cliente não encontrado"
```

### Fluxo 3: Viewer Tenta Criar Cliente
```
1. Viewer acessa tela de clientes
2. Frontend não mostra botão "Criar Cliente" (baseado na role)
3. Se Viewer tentar fazer POST via console:
   - Backend retorna 403
   - Frontend mostra toast: "Você não tem permissão"
```

### Fluxo 4: Assistant Tenta Acessar Aba de Processos
```
1. Assistant faz login
2. Menu lateral não mostra "Processos"
3. Se Assistant tentar acessar URL diretamente /legal-actions:
   - GET /legal-actions retorna 403
   - Frontend redireciona para /forbidden ou home
```

---

## ✅ Checklist de Implementação

- [ ] Armazenar role do usuário após login (`localStorage.setItem('userRole', role)`)
- [ ] Implementar função `canAccess(role, feature)` reutilizável
- [ ] Esconder menu items baseado na role
- [ ] Esconder botões de criar/editar/deletar para VIEWER
- [ ] Esconder abas de Processos/Jurimetria/ML para ASSISTANT
- [ ] Esconder menu de Usuários/Convites para MEMBER/VIEWER/ASSISTANT
- [ ] Tratar erro 403 com toast amigável
- [ ] Adicionar Select de Roles no modal de convites
- [ ] Validar permissões em páginas protegidas (redirect se não autorizado)
- [ ] Mostrar breadcrumb/aviso: "Você vê apenas seus dados" para MEMBER/VIEWER
- [ ] Teste: MEMBER tentando acessar dados de outro MEMBER (deve retornar 404)
- [ ] Teste: VIEWER tentando criar (botão escondido + 403 se tentar)
- [ ] Teste: ASSISTANT tentando acessar processos (abas escondidas + 403)
- [ ] Mostrar role na página de perfil do usuário
- [ ] Logout ao receber 401 (token expirado)

---

## 📚 Referência Rápida - Permissões por Role

```
ADMIN/OWNER:
  ✅ Tudo (criar, editar, deletar, convidar)
  ✅ Ver todos os dados da organização
  📊 Dashboard com dados completos

MEMBER:
  ✅ Criar, editar, deletar (clientes, processos, etc)
  👁️ Ver apenas seus dados
  ❌ Não pode convidar
  📊 Dashboard com apenas seus dados

VIEWER:
  ❌ Não pode criar, editar, deletar
  👁️ Ver apenas seus dados
  ❌ Não pode convidar
  📊 Dashboard com apenas seus dados

ASSISTANT:
  ✅ Criar, editar, deletar (clientes apenas)
  👁️ Ver apenas seus dados
  ❌ Não pode acessar processos/jurimetria
  ❌ Não pode treinar modelos
  ❌ Não pode convidar
```

---

## 🎯 Dicas Importantes

1. **Isolamento por Organização é Automático** - Todo endpoint filtra por `organization_id`
2. **Isolamento por Usuário é Automático** - Para MEMBER/VIEWER/ASSISTANT, o backend já filtra
3. **Frontend não precisa fazer filtros de dados** - Backend é responsável
4. **Frontend é responsável por UX** - Esconder botões, abas, menus baseado em roles
5. **Sempre tratar 403** - Usuários podem tentar acessar via console/devtools
6. **Role vem no JWT/GET /users/me** - Use como fonte da verdade

---

**Desenvolvido em: Março 2026**
**Sistema: Nomos API - Role Based Access Control**
