# PRD - Gestão de Armazém de Construção Civil
## José Firmino

## 1. Visão Geral do Produto
Sistema de gestão de armazém para construção civil, permitindo o controlo de equipamentos, viaturas, materiais e obras. A aplicação oferece funcionalidades completas de CRUD, sistema de atribuição de recursos a obras com histórico de movimentos, alertas de manutenção por email e capacidade de importação/exportação de dados.

## 2. Requisitos Funcionais

### 2.1 Autenticação
- ✅ Login com email e password (JWT)
- ✅ Registo de novos utilizadores
- ✅ Proteção de rotas

### 2.2 Gestão de Equipamentos
- ✅ CRUD completo (criar, ler, atualizar, eliminar)
- ✅ Campos: código, descrição, marca, modelo, categoria, nº série, estado de conservação, foto
- ✅ Atribuição direta a obras (sem entidade "Locais")
- ✅ Ficha de detalhe com histórico completo de movimentos
- ✅ Botão "Atribuir a Obra" diretamente na listagem
- ✅ Linhas clicáveis para abrir ficha

### 2.3 Gestão de Viaturas
- ✅ CRUD completo
- ✅ Campos: matrícula, marca, modelo, combustível, documento único, apólice de seguro
- ✅ Datas de vistoria e seguro com alertas
- ✅ Atribuição direta a obras
- ✅ Ficha de detalhe com histórico de movimentos e KMs
- ✅ Botão "Atribuir a Obra" diretamente na listagem

### 2.4 Gestão de Materiais
- ✅ CRUD completo
- ✅ Campos: código, descrição, unidade, stock atual, stock mínimo
- ✅ Alerta visual quando stock baixo
- ✅ Botões de Entrada/Saída diretamente na listagem
- ✅ Ficha de detalhe com histórico de movimentos

### 2.5 Gestão de Obras
- ✅ CRUD completo
- ✅ Campos: código, nome, endereço, cliente, estado (Ativa/Concluída/Pausada)
- ✅ Página de detalhe mostrando recursos atribuídos

### 2.6 Sistema de Movimentos
- ✅ Movimentos de Ativos: atribuição e devolução de equipamentos/viaturas
- ✅ Movimentos de Stock: entradas e saídas de materiais
- ✅ Movimentos de Viaturas: registo de quilometragem
- ✅ Validação de dupla atribuição (não permite atribuir recurso já em obra)

### 2.7 Alertas e Notificações
- ✅ Sistema de alertas para vistoria/seguro de viaturas (via Resend)
- ✅ Dashboard com alertas visuais

### 2.8 Import/Export de Dados
- ✅ Exportar dados para Excel (.xlsx)
- ✅ Exportar relatório PDF
- ✅ Importar dados de ficheiro Excel

## 3. Design e Interface

### 3.1 Identidade Visual
- ✅ Logótipo José Firmino
- ✅ Tema escuro (preto #0a0a0a, cinza #262626, laranja #f97316)
- ✅ Tema claro (branco, cinza claro, laranja)
- ✅ Toggle de tema (sol/lua) no header
- ✅ Preferência guardada em localStorage

### 3.2 Layout
- ✅ Menu lateral colapsável
- ✅ Dashboard com estatísticas e alertas
- ✅ Tabelas com pesquisa e ações rápidas (desktop)
- ✅ Cards com ações rápidas (mobile)
- ✅ Formulários em modais

### 3.3 Responsividade
- ✅ Desktop: tabelas completas
- ✅ Tablet: layout adaptado
- ✅ Mobile: cards em vez de tabelas, menu lateral com hamburger

## 4. Arquitetura Técnica

### 4.1 Backend
- **Framework**: FastAPI
- **Base de dados**: MongoDB
- **Autenticação**: JWT
- **Upload de ficheiros**: local /uploads
- **Email**: Resend API

### 4.2 Frontend
- **Framework**: React
- **UI**: Shadcn/UI + TailwindCSS
- **Roteamento**: React Router
- **HTTP**: Axios
- **Notificações**: Sonner (toast)
- **Tema**: Context API + localStorage

### 4.3 Endpoints API
- `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- `/api/equipamentos`, `/api/equipamentos/{id}`
- `/api/viaturas`, `/api/viaturas/{id}`
- `/api/materiais`, `/api/materiais/{id}`
- `/api/obras`, `/api/obras/{id}`
- `/api/movimentos`, `/api/movimentos/atribuir`, `/api/movimentos/devolver`
- `/api/movimentos/stock`, `/api/movimentos/viaturas`
- `/api/export/pdf`, `/api/export/excel`
- `/api/import/excel`
- `/api/alerts/send`
- `/api/summary`

## 5. O Que Foi Implementado (30/01/2026)

### Sessão Atual:
1. ✅ Lançamento direto para obra nas páginas de Equipamentos/Viaturas/Materiais
2. ✅ Ficha de detalhe ao clicar na linha (linhas clicáveis)
3. ✅ Ficha de detalhe para Materiais (nova)
4. ✅ Modo Claro/Escuro com toggle no header
5. ✅ Otimização completa para mobile e tablet
6. ✅ Cards responsivos para mobile em vez de tabelas
7. ✅ Menu lateral responsivo com hamburger para mobile

### Sessão Anterior:
1. ✅ Nova identidade visual com logótipo José Firmino
2. ✅ Tema escuro com cores preto, cinza e laranja
3. ✅ Remoção completa da entidade "Locais"
4. ✅ Associação direta de recursos a "Obras"
5. ✅ Fichas de detalhe para equipamentos com histórico de movimentos
6. ✅ Fichas de detalhe para viaturas com histórico de movimentos e KMs
7. ✅ Sistema de movimentos (atribuir/devolver) com validação
8. ✅ Funcionalidade de Import/Export de dados (Excel e PDF)
9. ✅ Validação de dupla atribuição de recursos

## 6. Credenciais de Teste
- **Email**: test@test.com
- **Password**: test123

## 7. Próximos Passos (Backlog)
- [ ] Dashboard com gráficos de utilização
- [ ] Relatórios personalizáveis por período
- [ ] Códigos de barras/QR codes para equipamentos
- [ ] Notificações push no browser
- [ ] Histórico de manutenções para equipamentos e viaturas
- [ ] App nativa (PWA ou React Native)
