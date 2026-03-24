# 🛠️ Sistema de Monitorização de Produção via MQTT

## 🏢 Empresa
- Tesco - Componentes para Automóveis, Lda.

## 👨‍💻 Desenvolvimento do Projeto
- Luís Azevedo — Engenheiro Informático  
- Ricardo Carvalho — Engenheiro do departamento de produção, Líder de projeto Shopfloor  

## 📝 Autor da Documentação
- Luís Azevedo  

---

## 📌 Descrição

Este projeto consiste num serviço de monitorização em tempo real que liga uma base de dados industrial (MongoDB) a um sistema de comunicação MQTT.

O sistema deteta automaticamente novos registos de produção e tempos de máquina, enviando esses dados para um broker MQTT, permitindo a sua utilização em dashboards, sistemas de análise ou outras aplicações industriais.

O principal objetivo é garantir uma comunicação rápida, desacoplada e escalável entre sistemas industriais.

---

## 🎯 Objetivo

- Monitorizar dados de produção em tempo real  
- Integrar sistemas industriais com MQTT  
- Reduzir a latência no acesso à informação  
- Permitir consumo de dados por múltiplos sistemas (dashboards, APIs, etc.)  
- Garantir persistência do estado (último registo processado)  

---

## ⚙️ Como funciona

1. O sistema liga-se ao **MongoDB (MTLINKi)**  
2. Liga-se ao **broker MQTT (Mosquitto)**  
3. Carrega o último `_id` processado (para evitar duplicados)  
4. A cada intervalo de tempo:
   - Consulta novos registos nas coleções:
     - `L1_Pool` (tempos)
     - `ProductResult_History` (produção)
5. Para cada novo registo:
   - Converte o documento para JSON  
   - Publica no respetivo tópico MQTT:
     - `tesco/tempos`
     - `tesco/producao`
6. Atualiza o último `_id` processado em ficheiro local  
7. Repete o processo continuamente  

---

## 🧰 Tecnologias Utilizadas

### 🔹 Backend
- Python 3

### 🔹 Base de Dados
- MongoDB

### 🔹 Comunicação
- MQTT (Mosquitto)

### 🔹 Bibliotecas Python
- pymongo → ligação ao MongoDB  
- paho-mqtt → comunicação MQTT  
- bson → manipulação de ObjectId  
- json → serialização de dados  
- time → controlo de intervalos  
- os → gestão de ficheiros  

---

## 🚀 Funcionalidades

### 📡 Monitorização em Tempo Real
- Deteção automática de novos registos  
- Consulta incremental baseada em `_id`  
- Evita duplicação de dados  

---

### 📤 Integração com MQTT
- Publicação automática de mensagens  
- Separação por tópicos:
  - `tesco/tempos`
  - `tesco/producao`  
- Comunicação leve e eficiente  

---

### 💾 Persistência de Estado
- Guarda do último `_id` processado em ficheiro  
- Continuidade após reinício do sistema  
- Evita reprocessamento de dados  

---

### ⚠️ Gestão de Erros
- Tratamento de exceções durante consultas  
- Retry automático após falha  
- Logs no terminal para diagnóstico  

---

## 🗂️ Estrutura da Base de Dados

Base de dados: `MTLINKi`

---

### 📋 Coleção `L1_Pool`
Armazena dados relacionados com tempos de máquina.

Campos utilizados:

- `_id` → Identificador único  
- `L1Name` → Nome da máquina  
- `updatedate` → Data de atualização  
- `enddate` → Data de fim  
- `timespan` → Duração  
- `value` → Valor do registo  

---

### 🏭 Coleção `ProductResult_History`
Armazena dados de produção.

Campos utilizados:

- `_id` → Identificador único  
- `enddate` → Data de fim  
- `L1Name` → Nome da máquina  
- `productname` → Nome do produto  
- `productresult` → Resultado da produção  
- `productresult_accumulate` → Produção acumulada  
- `timespan` → Tempo associado  
- `updatedate` → Data de atualização  

---

## 💻 Arquitetura do Sistema

MongoDB (MTLINKi)
│
▼
Script Python (Monitorização)
│
▼
Broker MQTT (Mosquitto)
│
▼
Consumidores (Dashboards, APIs, Sistemas externos)



---

## ⚙️ Configuração

### 🔌 MQTT Broker
- IP: `192.168.100.19`  
- Porta: `1883`  

### 🗄️ MongoDB
- URI: `mongodb://fanuc:fanuc@192.168.100.20:27017/MTLINKi`  

### ⏱️ Intervalo de Monitorização
- 5 segundos  

---

## 📁 Ficheiros de Estado

- `ultimo_id.txt` → último registo da coleção `L1_Pool`  
- `ultimo_id_prod.txt` → último registo da coleção `ProductResult_History`  

---

## 💻 Infraestrutura

Este serviço é executado num ambiente interno da empresa, integrado com:

- Servidor MongoDB industrial (MTLINKi)  
- Broker MQTT Mosquitto  
- Rede interna da fábrica  

---

## ⚠️ Considerações

- O sistema depende da disponibilidade da rede interna  
- Em caso de falha no MongoDB ou MQTT, o sistema tenta recuperar automaticamente  
- A utilização de `_id` garante ordem cronológica dos registos  

