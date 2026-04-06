from pymongo import MongoClient

# ⚙️ Configuração MongoDB
MONGO_URI = "mongodb://fanuc:fanuc@192.168.100.20:27017/MTLINKi"
tabela_grupos1 = "Tag_Setting"

print("🔌 A ligar ao MongoDB...")
client = MongoClient(MONGO_URI)
db = client.MTLINKi

colecao = db[tabela_grupos1]
print("✅ Ligação ao MongoDB bem-sucedida!\n")

# Função simplificada
def mostrar_tags(colecao):

    documentos = list(colecao.find().sort("TagName", 1))

    if not documentos:
        print("⚠️ Nenhum registo encontrado.\n")
        return

    for doc in documentos:
        tag = doc.get("TagName", "SEM_NOME")
        maquinas = doc.get("L1Names", [])

        print(f"\n 🏷️  TagName: {tag}")
        print(" 🖥️  Máquinas associadas:")
        for m in maquinas:
            print(f"   - {m}")


# 📤 Mostrar tags e máquinas
mostrar_tags(colecao)
