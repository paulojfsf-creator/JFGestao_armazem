# PRD - Gestão de Armazém de Construção Civil

## Problema Original
Criar uma aplicação de gestão de armazém de construção civil, com controlo de máquinas, equipamentos, ferramentas, viaturas, material, para determinadas obras, com resumos.

## User Personas
- **Gestor de Armazém**: Controla inventário, regista entradas/saídas de recursos
- **Responsável de Obra**: Visualiza recursos atribuídos às suas obras
- **Administrador**: Gestão completa do sistema, exportação de relatórios

## Core Requirements
- Autenticação JWT (login/registo)
- CRUD de recursos: Máquinas, Equipamentos, Ferramentas, Viaturas, Materiais
- CRUD de Obras
- Atribuição de recursos a obras
- Alertas de manutenção para máquinas e viaturas
- Resumos/Dashboard com estatísticas
- Exportação de relatórios (PDF/Excel)

## What's Been Implemented (Dezembro 2025)

### Backend (FastAPI + MongoDB)
- ✅ Autenticação JWT com bcrypt
- ✅ Endpoints CRUD para todas as entidades
- ✅ Sistema de atribuição de recursos a obras
- ✅ Alertas de manutenção automáticos
- ✅ Exportação PDF (reportlab)
- ✅ Exportação Excel (openpyxl)
- ✅ Summary endpoint com estatísticas

### Frontend (React + Tailwind + Shadcn/UI)
- ✅ Página de Login/Registo
- ✅ Dashboard com resumos e alertas
- ✅ Páginas CRUD: Máquinas, Equipamentos, Ferramentas, Viaturas, Materiais
- ✅ Gestão de Obras
- ✅ Detalhe de Obra com recursos atribuídos
- ✅ Página de Relatórios
- ✅ Sidebar responsiva
- ✅ Design Swiss/Industrial

## Prioritized Backlog

### P0 (Critical) - DONE
- ✅ MVP completo e funcional

### P1 (High Priority)
- Sistema de notificações por email para alertas de manutenção
- Histórico de movimentações de recursos
- Filtros e pesquisa avançada nas listagens
- Upload de fotos para recursos

### P2 (Medium Priority)
- Dashboard com gráficos (usando Recharts)
- Sistema de códigos de barras/QR codes
- Relatórios personalizáveis
- Multi-idioma

### P3 (Low Priority)
- App móvel
- Integração com sistemas ERP
- Auditoria de alterações

## Technical Stack
- **Backend**: FastAPI, MongoDB, Motor, JWT, bcrypt
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI, Axios
- **Export**: reportlab (PDF), openpyxl (Excel)

## Next Tasks
1. Adicionar filtros nas tabelas de recursos
2. Implementar pesquisa global
3. Dashboard com gráficos de utilização
4. Sistema de notificações
