# 🛠️ Sistema de Gestão de Checklists de Manutenção
## Empresa Tesco - Componentes para Automóveis, Lda. 
## Autor do documento: Luís Azevedo
## Desenvolvimento do projeto: Luís Azevedo, engenheiro informático e ainda, o engenheiro e lider da equipa de manutenção, Rui Martins
---
## 📌 Descrição

Este projeto consiste numa aplicação web para gestão de checklists de manutenção industrial, permitindo registar, acompanhar e gerir intervenções em máquinas de forma simples e eficiente. 

O sistema foi desenvolvido com o objetivo de digitalizar processos que normalmente são feitos em papel, aumentando a organização, rastreabilidade e produtividade das equipas de manutenção.

---

## 🎯 Objetivo

- Centralizar o registo de manutenções
- Automatizar o cálculo de próximas intervenções
- Facilitar a criação de ordens de trabalho
- Melhorar o controlo e histórico das máquinas

---

## ⚙️ Como funciona

1. O utilizador seleciona uma **categoria e máquina**
2. Preenche uma **checklist de manutenção**
3. Define o estado de cada tarefa:
   - Realizado
   - Reparação não urgente
   - Reparação urgente
   - [Vazio] -> Não realizado
4. O sistema calcula automaticamente a **próxima verificação**, cujo o estado seja igual a "Realizado". Por outro lado, se for alguma outra opção essas mesma tarefas são adicionadas automaticamente as "ordens de trabalho". 
5. Pode adicionar:
   - 📝 Relatório
   - 📎 Anexos (imagens/documentos)
   - ✍️ Assinatura
6. A checklist é guardada na base de dados
7. Pode posteriormente:
   - 🔍 Consultar checklists
   - ✏️ Editar
   - 🗑️ Eliminar
   - 🛠️ Gerir ordens de trabalho

---

## 🧰 Tecnologias Utilizadas

### 🔹 Frontend
- HTML5
- CSS3
- JavaScript (Vanilla JS)

### 🔹 Backend
- Node.js
- Express.js

### 🔹 Base de Dados
- MySQL

### 🔹 Outras Bibliotecas
- Multer → upload de ficheiros
- Moment.js → manipulação de datas
- JSON → armazenamento de dados estruturados

---

## 🚀 Funcionalidades

### ✅ Gestão de Checklists
- Criação de checklists por máquina
- Organização por grupos de tarefas
- Estados de manutenção (status)
- Cálculo automático de próxima verificação

---

### 📎 Gestão de Anexos
- Upload de múltiplos ficheiros
- Visualização de imagens diretamente no sistema
- Download de documentos
- Remoção e atualização de anexos

---

### ✍️ Assinaturas
- Captura de assinatura digital
- Associação à checklist

---

### 🔍 Consulta de Registos
- Visualização de checklists guardadas
- Filtro por:
  - ID
  - Máquina
- Paginação de resultados

---

### ✏️ Edição de Checklists
- Alteração de estados
- Atualização de datas
- Adição/remoção de anexos
- Eliminar a checklist, com confirmação antes de eliminar

---


### 🛠️ Ordens de Trabalho
- Criação baseada em checklists
- Gestão de reparações, atribuição de data e responsavel.
- Marcação de tarefas como concluídas

---

## 🗂️ Estrutura da Base de Dados

Base de dados: `manutencao`

---

### 📋 Tabela `registos`
Armazena todas as checklists preenchidas pelos utilizadores.

```sql
CREATE TABLE registos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maquina VARCHAR(50),
    nome VARCHAR(50),
    data_registro DATETIME NOT NULL,
    acoes JSON,
    relatorio TEXT,
    assinatura LONGTEXT,
    anexos JSON
);
```
Descrição dos campos:

id → Identificador único da checklist
maquina → ID da máquina
nome → Nome da máquina
data_registro → Data e hora do registo
acoes → Lista de ações da checklist (JSON)
relatorio → Observações do utilizador
assinatura → Assinatura digital (base64)
anexos → Lista de ficheiros anexados (JSON)


### 🛠️ Tabela ordens

Armazena ordens de trabalho geradas a partir das checklists.

```sql
CREATE TABLE ordens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id VARCHAR(50),
    nome_maquina VARCHAR(100),
    descricao VARCHAR(100),
    reparacoes_json JSON,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    concluido BOOLEAN
);
```

### 💻 Hardware e Infraestrutura

Este projeto foi implementado numa Máquina Virtual (VM) hospedada num servidor da empresa: Tesco - Componentes para Automóveis, Lda.

### ⚙️ Configuração da VM

A VM foi configurada pelo Engenheiro Informático Luís Azevedo, incluindo:

- Atribuição de recursos necessários (storage, cpu, ram,...) atraves do VMware® vSphere
- Instalação do sistema operativo Windows
- Configuração inicial do ambiente
- Integração no domínio da empresa
- Configuração de IP estático (rede interna)
- Configuração de DNS
- Atualizações do sistema operativo

🧰 Software Instalado
- Visual Studio Code
- MySQL Server 8.0
- Node.js
 
