# 🛠️ Sistema de Gestão de Checklists de Manutenção

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

## 🗂️ Estrutura da base de dados
Database manutencao:

Tabela registos:
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

Tabela ordens:
CREATE TABLE ordens(
id INT AUTO_INCREMENT PRIMARY KEY,
checklist_id VARCHAR(50),
nome_maquina VARCHAR(100),
descricao VARCHAR(100),
reparacoes_json JSON,
criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
concluido BOOLEAN
);


