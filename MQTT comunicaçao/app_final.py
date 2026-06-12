from pymongo import MongoClient
from bson.objectid import ObjectId
import json
import time
import os
import paho.mqtt.client as mqtt


#Broker
BROKER = "192.168.100.19"   # Endereço do teu broker Mosquitto
PORT = 1883
TOPIC_TEMPOS = "tesco/tempos"
TOPIC_PROD = "tesco/producao"

# Callback quando o cliente se conecta ao broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Conectado ao broker MQTT com sucesso!")
    else:
        print(f"❌ Falha na conexão ao broker. Código de retorno: {rc}")

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect

mqtt_client.connect(BROKER, PORT, 60)
mqtt_client.loop_start()  # Mantém a conexão ativa em background

# ⚙️ Configuração
MONGO_URI = "mongodb://fanuc:fanuc@192.168.100.20:27017/MTLINKi"
TABELA_TEMPOS = "L1_Pool"
TABELA_PROD = "ProductResult_History"
INTERVALO = 5  # segundos entre verificações

# 🔍 Campos relevantes
projecao_tempos = {
    "_id": 1,
    "L1Name": 1,
    "updatedate": 1,
    "enddate": 1,
    "timespan": 1,
    "value": 1
}

projecao_prod = {
    "_id": 1,
    "enddate": 1,
    "L1Name": 1,
    "productname": 1,
    "productresult": 1,
    "productresult_accumulate": 1,
    "timespan": 1,
    "updatedate": 1,
}

# 🔌 Ligação ao MongoDB
print("🔌 A ligar ao MongoDB...")
client = MongoClient(MONGO_URI)
db = client.MTLINKi
colecao_tempos = db[TABELA_TEMPOS]
colecao_prod = db[TABELA_PROD]
print("✅ Ligação ao MongoDB bem-sucedida!")

# 🧩 Função genérica para monitorizar uma coleção
def monitorizar_colecao(nome, colecao, projecao, ficheiro_id, ultimo_id, topico):
    filtro = {"_id": {"$gt": ultimo_id}} if ultimo_id else {}
    novos = list(colecao.find(filtro, projecao).sort("_id", 1).limit(500))

    if novos:
        for doc in novos:
            ultimo_id = doc["_id"]
            mensagem = json.dumps(doc, default=str)

            print(f"\n📘 Novo registo em {nome}:")
            mqtt_client.publish(topico, mensagem)
            print(f"\n📤 Enviado MQTT → tópico '{topico}'\n{mensagem}")

        # guarda o último id
        with open(ficheiro_id, "w") as f:
            f.write(str(ultimo_id))

    return ultimo_id


# 🔄 Carrega último ID processado (ou None)
def carregar_ultimo_id(ficheiro):
    if os.path.exists(ficheiro):
        with open(ficheiro, "r") as f:
            return ObjectId(f.read().strip())
    return None


ultimo_id_tempos = carregar_ultimo_id("ultimo_id.txt")
ultimo_id_prod = carregar_ultimo_id("ultimo_id_prod.txt")

print("▶️ A monitorizar novas inserções...")

while True:
    try:
        ultimo_id_tempos = monitorizar_colecao(
            "L1_Pool", colecao_tempos, projecao_tempos, "ultimo_id.txt", ultimo_id_tempos, TOPIC_TEMPOS)

        ultimo_id_prod = monitorizar_colecao(
            "ProductResult_History", colecao_prod, projecao_prod, "ultimo_id_prod.txt", ultimo_id_prod, TOPIC_PROD)

        time.sleep(INTERVALO)

    except Exception as e:
        print(f"⚠️ Erro ao consultar: {e}")
        time.sleep(60)
