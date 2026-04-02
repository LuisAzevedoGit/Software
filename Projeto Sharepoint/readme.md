# 🛠️ Sistema de Monitorização de Produção via MQTT
## 🏢 Empresa
Tesco - Componentes para Automóveis, Lda.
## 👨‍💻 Desenvolvimento do Projeto
- Luís Azevedo — Engenheiro Informático, Project Manager
- Ricardo Silva — Manager departamento de compras, Project Manager
- ITGest - Equipa Desenvolvimento do Software
- Hydra.IT - Equipa Desenvolvimento do Software
## 📝 Autor da Documentação
Luís Azevedo
## 📌 Descrição

Este projeto consiste na implementação de um **Portal Intranet Corporativo** baseado em **Microsoft SharePoint Online**, integrado no ecossistema Microsoft 365.

A solução foi desenvolvida em parceria com a Hydra IT, com o objetivo de centralizar a comunicação interna, melhorar a gestão documental e promover a colaboração entre departamentos.

A intranet funciona como um ponto único de acesso à informação da empresa, permitindo uma organização estruturada de conteúdos, processos e documentos.

---

## 🎯 Objetivo

- Centralizar a informação interna  
- Melhorar a comunicação entre equipas  
- Implementar gestão documental estruturada  
- Automatizar processos internos  
- Promover colaboração e partilha de conhecimento  
- Ter mais controlo de permissões de acesso à documentação

## 🚀 Funcionalidades

### 🌐 Portal Intranet
- Página principal com notícias e comunicados  
- Acesso rápido a áreas e departamentos  
- Pesquisa global de conteúdos    

---

### 📁 Gestão Documental
- Bibliotecas documentais por departamento  
- Controlo de versões  
- Gestão de permissões  
- Metadados normalizados  
- Ciclo de vida dos documentos:
  - Rascunho  
  - Em revisão  
  - Aprovado  
  - Obsoleto  

---

### 🔄 Automatização de Processos
- Fluxos de aprovação com vários niveis de aprovação
- Notificações automáticas  
- Gestão de pedidos internos  
- Rastreabilidade de processos  

---

---

### 🗄️ Gestão de Arquivo
- Organização de documentos históricos  
- Políticas de retenção  
- Classificação documental  
- Suporte a auditorias  

---

### 📊 Comunicação Interna
- Publicação de notícias  
- Anúncios e eventos  

---

## 🧰 Tecnologias Utilizadas

### 🔹 Plataforma
- Microsoft 365
- Sharepoint Online
---

## ⚙️ Características Técnicas

- Solução Cloud
- Acesso via browser e dispositivos móveis  
- Integração nativa com Microsoft 365  
- Segurança empresarial (MFA, permissões)  
- Conformidade com RGPD  

---

## 📊 Benefícios

- Redução da dispersão de informação  
- Acesso rápido a documentos  
- Melhoria da comunicação interna  
- Maior controlo e segurança da informação  

---

## 🧩 Estrutura da Solução

### 🏠 Intranet Global
- Portal principal da empresa  
- Acesso centralizado a conteúdos  

### 🏭 Departamentos
- Engenharia  
- Qualidade  
- Outros departamentos  

### 📁 Gestão Documental
- Bibliotecas organizadas por área  
- Controlo e versionamento  

### 🔄 Processos
- Aprovações  
- Workflows automatizados  

### 🗄️ Arquivo
- Documentação histórica  
- Gestão de retenção  



### Estrutura de pastas Engenharia

```sql
Engenharia
│
├── Desenhos Internos
│ ├── Registo de Desenhos Internos
│ └── Produção em Massa
│
├── Desenhos Externos
│ ├── Cotação
│ └── Produção em Massa
│
└── Vendas
├── Registo de Desenhos Externos
└── Desenhos Cotados
 ```

### Estrutura de pastas Qualidade

```sql
Sistema documental
│
├── Gestao da qualidade
│ ├── Açoes corretivas e preventivas
│ └── Auditorias
| └── Gestao de Reclamaçoes
| └── Avaliaçoes
| └── Indicadores de desempenho
| └── Processos
| └── Documentos sistema de gestão
| └── Circulos da qualidade
| └── Normas e requisitos
| └── Organigrama
| └── Planos de contigencia
| └── PSB - Product Safety Representative
| └── Certificados
| └── Gestão de Fornecedores
|
│
├── Documentaçao de produto e processo produtivo
│ ├── Clitentes
│ └── FMEA´s
│ └── PPAP´s

 ```


---







## 🧩 Estrutura da Solução

### 🏠 Intranet Corporativa
- Portal central de acesso à informação  
- Notícias, comunicados e destaques institucionais  
- Links rápidos para aplicações internas  
- Pesquisa global integrada  

---

### 🏭 Portal Engenharia
Gestão de documentação técnica:

- Desenhos técnicos (internos e externos)  
- Projetos  
- Documentação de suporte técnico  

Classificação baseada em:
- Cliente  
- Projeto  
- Família  
- Modelo  

✔ Workflow de aprovação (3 níveis)  
✔ Controlo de versões  
✔ Publicação controlada  

---

### 📋 Portal Qualidade
Gestão do Sistema de Gestão:

- Políticas  
- Procedimentos  
- Instruções  
- Auditorias  
- Reclamações  
- Avaliação de fornecedores  

✔ Revisões periódicas  
✔ Conformidade normativa  
✔ Histórico de alterações  

---

### 📁 Área Comum (Documentos Aprovados)
- Documentos finais aprovados  
- Acesso em modo leitura  
- Disponível para toda a organização  

---

### ⚙️ Área de Administração
- Gestão de metadados  
- Configuração de workflows  
- Gestão de permissões  
- Parametrização global  

---

## 🔄 Workflows Documentais

### 🔹 Engenharia (3 níveis)
1. Submissão  
2. Validação técnica  
3. Aprovação (Direção)  
4. Publicação automática  

---

### 🔹 Qualidade (2-3 níveis)
1. Submissão  
2. Validação Qualidade  
3. Aprovação final  
4. Publicação  

---

### 📊 Estados Documentais

- Rascunho  
- Em Aprovação  
- Aprovado  
- Obsoleto  

---

## 🧠 Modelo de Dados e ECM

A solução segue um modelo de **Enterprise Content Management (ECM)** baseado em:

### 📋 Metadados Estruturados
- Classificação independente de pastas  
- Pesquisa avançada  
- Organização escalável  

---

### 📁 Content Types
- Desenhos Técnicos  
- Procedimentos  
- Políticas  
- Auditorias  
- Avaliações  

---

### 🔢 Codificação Documental
- Geração automática de códigos  
- Normalização de nomenclaturas  
- Consistência organizacional  

---

### 📊 Estruturas Base
- Clientes  
- Projetos  
- Produtos  
- Fornecedores  
- Departamentos  

---

## 🔍 Pesquisa e Acesso à Informação

- Pesquisa global no SharePoint  
- Filtros por:
  - Cliente  
  - Projeto  
  - Tipo documental  
  - Estado  
- Localização rápida de documentos  

---

## 🔔 Notificações e Alertas

Sistema automatizado com:

- Submissão de documentos  
- Aprovação / rejeição  
- Alteração de estado  
- Publicação de versões  
- Alertas de revisão periódica  
- Processos pendentes  



---

### Princípios

- Separação rascunho vs publicado  
- Acesso por grupos  
- Segregação por departamento  
- Controlo ao nível de site, biblioteca e documento  
- Auditoria de acessos  

---

## 🧰 Tecnologias Utilizadas

- Microsoft 365  
- SharePoint Online  

---

## ⚙️ Metodologia do Projeto

### 📌 Fases

1. Levantamento de requisitos  
2. Business Blueprint (documento base)  
3. Implementação técnica  
4. Testes e validação  
5. Formação  
6. Go-Live  
7. Suporte  

---

## ⏱️ Planeamento

- Levantamento: concluído em Fevereiro 2026  
- Implementação: Fevereiro – Março 2026  
- Go-Live: Março 2026  
- Suporte pós Go-Live: 5 dias  

---

## 📊 Benefícios

- Centralização da informação  
- Redução de erros e duplicação  
- Aumento da produtividade  
- Melhor comunicação interna  
- Rastreabilidade completa  
- Suporte a auditorias e conformidade  

---

## ⚠️ Considerações

- Dependente do licenciamento Microsoft 365  
- Necessidade de envolvimento dos utilizadores  
- Integrações externas fora do âmbito inicial  
- Plataforma preparada para evolução  

---


## ⚙️ Metodologia do Projeto

O projeto foi desenvolvido com uma abordagem **ágil e iterativa**, garantindo entregas contínuas e validação constante.

### 📌 Fases do Projeto

1. **Diagnóstico**
   - Levantamento de requisitos  
   - Análise de processos  

2. **Design**
   - Definição da arquitetura  
   - Criação de protótipos  

3. **Implementação**
   - Desenvolvimento incremental  
   - Configuração da plataforma  

4. **Testes & Validação**
   - Testes funcionais  
   - Ajustes finais  

5. **Formação**
   - Formação de utilizadores  
   - Transferência de conhecimento  

6. **Go-Live & Suporte**
   - Entrada em produção  
   - Suporte pós implementação  

---

## ⏱️ Cronograma

- Início: Fevereiro 2026  
- Go-Live: Abril 2026  
- Suporte pós Go-Live: 5 dias  

---

## Criar grupos e Adicionar users

- Início: Fevereiro 2026  
- Go-Live: Abril 2026  
- Suporte pós Go-Live: 5 dias  

---
## 🔐 Gestão de Utilizadores e Permissões

A gestão de permissões no SharePoint é fundamental para garantir a segurança da informação e o acesso adequado aos conteúdos. Esta secção descreve como criar grupos, atribuir permissões e gerir heranças.

---

## 👥 Criação de Grupos

Para uma gestão eficiente, é recomendado utilizar **grupos de utilizadores** em vez de permissões individuais.

### 📌 Passos:

1. Aceder ao portal SharePoint  
2. Ir a **Settings (⚙️)**  
3. Selecionar **Site Permissions**  
4. Clicar em **Advanced permissions settings**  
5. Selecionar **Create Group**  
6. Definir:
   - Nome do grupo  
   - **Group Owner** → Boa prática: grupo de IT ou administração da plataforma  
7. Atribuir o nível de permissões pretendido  
8. Guardar  

---

## 🔑 Tipos de Permissões

O SharePoint disponibiliza diferentes níveis de permissões:

- **Full Control** → Controlo total sobre o site  
- **Design** → Permite editar estrutura, conteúdos e aprovar itens  
- **Edit** → Permite criar e editar listas e documentos  
- **Contribute** → Permite adicionar e editar conteúdos  
- **Read** → Apenas leitura  
- **Restricted View** → Visualização apenas no browser (sem download)  

---

## ➕ Adicionar Utilizadores a um Grupo

1. Aceder a:
   - Settings → Site Permissions → Advanced permissions  
2. Selecionar o grupo pretendido  
3. Clicar em **New**  
4. Introduzir o nome ou email do utilizador  
5. Confirmar  

---

## 🔄 Herança de Permissões

Por defeito, o SharePoint utiliza um modelo de **herança de permissões**:

- As permissões atribuídas a um nível superior propagam-se automaticamente para os níveis inferiores  
- Isto inclui:
  - Sites  
  - Bibliotecas  
  - Pastas  
  - Documentos  

### 📌 Exemplo (Engenharia)
```sql
Engenharia
│
├── Desenhos Internos
│ ├── Registo de Desenhos Internos
│ └── Produção em Massa
│
├── Desenhos Externos
│ ├── Cotação
│ └── Produção em Massa
│
└── Vendas
├── Registo de Desenhos Externos
└── Desenhos Cotados
 ```


👉 Se um grupo tiver **Full Control** em `Desenhos Internos`, então terá automaticamente as mesmas permissões em:
- Registo de Desenhos Internos  
- Produção em Massa  

---

## ✂️ Quebrar a Herança de Permissões

Em alguns casos, é necessário definir permissões específicas num nível inferior.

### 📌 Quando usar:
- Restringir acesso a determinadas áreas  
- Alterar nível de permissões de um grupo  
- Isolar informação sensível  

---

### ⚙️ Exemplo Prático

Pretende-se que um grupo tenha apenas **Restricted View** na pasta `Produção em Massa`, apesar de ter permissões superiores no nível acima.

### 📌 Passos:

1. Aceder à biblioteca:
   - **Desenhos Internos → Produção em Massa**  
2. Ir a **Settings (⚙️)**  
3. Selecionar **List Permissions**  
4. Clicar em **Stop inheriting permissions**  
5. Selecionar o grupo pretendido  
6. Clicar em **Edit User Permissions**  
7. Escolher o nível:
   - **Restricted View**  
8. Guardar  

---

## 🧩 Gestão Avançada

Após quebrar a herança, é possível:

- Adicionar novos grupos específicos  
- Remover grupos existentes  
- Definir permissões independentes do nível superior  

---

## ⚠️ Boas Práticas

- Utilizar **grupos** em vez de permissões individuais  
- Minimizar a quebra de herança (para evitar complexidade)  
- Definir claramente:
  - Quem pode editar  
  - Quem pode apenas consultar  
- Usar **Restricted View** para conteúdos sensíveis  
- Documentar sempre alterações de permissões  

---
## ⚠️ Considerações

- Solução dependente do Microsoft 365  
- Licenciamento necessário para utilizadores  
- Projeto executado maioritariamente de forma remota
- Assinar acordo de confidencialidade antes do inicio de desenvolvimento.

---

## 📌 Conclusão

Este projeto representa um passo importante na **transformação digital da organização**, permitindo uma gestão mais eficiente da informação, melhor comunicação interna e maior produtividade das equipas.
