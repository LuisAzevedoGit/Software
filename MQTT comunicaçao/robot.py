from pymongo import MongoClient
from datetime import datetime
import pytz

# 🌍 Timezone Portugal
tz_local = pytz.timezone("Europe/Lisbon")

# 🔌 MongoDB
MONGO_URI = "mongodb://fanuc:fanuc@192.168.100.20:27017/MTLINKi"

print("🔌 A ligar ao MongoDB...")

client = MongoClient(MONGO_URI)

db = client["MTLINKi"]
colecao = db["L1Signal_Pool"]

print("✅ Ligação bem-sucedida!")

# =========================================================
# 📅 DEFINIR INTERVALO (hora Portugal)
# =========================================================

data_inicio_local = tz_local.localize(
    datetime(2026, 5, 22, 8, 0, 0)
)

data_fim_local = tz_local.localize(
    datetime(2026, 5, 22, 18, 0, 0)
)

# 🔄 Converter para UTC para pesquisar MongoDB
data_inicio_utc = data_inicio_local.astimezone(pytz.utc)
data_fim_utc = data_fim_local.astimezone(pytz.utc)

# =========================================================
# 🎯 FILTRO
# =========================================================

filtro = {
    "L1Name": "RobotMH1-1",

    "signalname": "DATA_NumReg3_RobotMH1-1",

    "updatedate": {
        "$gte": data_inicio_utc,
        "$lte": data_fim_utc
    }
}

# =========================================================
# 📥 BUSCAR REGISTOS
# =========================================================

registos = list(
    colecao
    .find(filtro)
    .sort("updatedate", 1)
)

# =========================================================
# 📊 RESULTADOS
# =========================================================

print("\n📊 RESULTADOS")
print("=" * 80)

print(f"Máquina       : RobotMH1-1")
print(f"Sinal         : DATA_NumReg3_RobotMH1-1")
print(f"Data início   : {data_inicio_local}")
print(f"Data fim      : {data_fim_local}")
print(f"Total registos: {len(registos)}")

print("=" * 80)

# =========================================================
# 📘 MOSTRAR REGISTOS
# =========================================================

for doc in registos:

    data_utc = doc.get("updatedate")

    # Converter UTC → Portugal
    data_local = data_utc.replace(
        tzinfo=pytz.utc
    ).astimezone(tz_local)

    print(f"Data  : {data_local.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Valor : {doc.get('value')}")
    print("-" * 80)