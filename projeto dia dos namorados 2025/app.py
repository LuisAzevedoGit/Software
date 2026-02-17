from flask import Flask, render_template

app = Flask(__name__)

# Dados da história
story_pages = [
    {"title": "O Destino nos Aproximou", "content": "Tudo começou quando nossos caminhos se cruzaram... um encontro que mudou tudo.", "image": "static/images/page1.jpg"},
    {"title": "Nosso Primeiro Momento", "content": "O primeiro encontro foi inesquecível. Desde aquele dia, eu soube que algo especial estava nascendo.", "image": "static/images/page2.jpg"},
    {"title": "Cada Momento é Único", "content": "Entre risadas e abraços, construímos memórias que guardarei para sempre.", "image": "static/images/page3.jpg"},
    {"title": "O Futuro nos Espera", "content": "Mal posso esperar para viver o futuro ao seu lado. O melhor ainda está por vir.", "image": "static/images/page4.jpg"}
]

# Rota principal (menu)
@app.route('/')
def index():
    return render_template('menu.html')  # Exibe o menu principal

# Rota para as páginas da história
@app.route('/page/<int:page_id>')
def story_page(page_id):
    if 0 <= page_id < len(story_pages):
        return render_template('historia.html', page=story_pages[page_id], current_page=page_id, total_pages=len(story_pages))
    else:
        return "Página não encontrada!", 404

# Rota para a galeria
@app.route('/gallery')
def gallery():
    return render_template('gallery.html')

# Rota para o quiz
@app.route("/quiz")
def quiz():
    return render_template("quiz.html")

# Rota para o "scratch"
@app.route("/scratch")
def scratch():
    return render_template("scratch.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=443, debug=True)





#ter atençao ao endereço publico se mudar: 94.60.223.20
#ir ao site https://whatismyipaddress.com/pt/meu-ip
#link: http://94.60.223.20:8080/


#http://89.114.76.27:8081/
