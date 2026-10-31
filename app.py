from flask import Flask, render_template, request, jsonify
import sqlite3
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
DATABASE = 'catalogo.db'
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', 'demo_key')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS filmes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tmdb_id INTEGER UNIQUE NOT NULL,
            titulo TEXT NOT NULL,
            ano INTEGER,
            nota REAL DEFAULT 0,
            poster_path TEXT,
            data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DATABASE, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def validar_nota(nota):
    try:
        nota_float = float(nota)
        return 0 <= nota_float <= 10
    except (ValueError, TypeError):
        return False

def formatar_ano(ano):
    try:
        ano_int = int(ano)
        if ano_int < 100:
            return 2000 + ano_int if ano_int < 50 else 1900 + ano_int
        return ano_int
    except (ValueError, TypeError):
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/filmes/populares')
def filmes_populares():
    try:
        response = requests.get(
            f'{TMDB_BASE_URL}/movie/popular',
            params={'api_key': TMDB_API_KEY, 'language': 'pt-BR'}
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/filmes/buscar')
def buscar_filmes():
    query = request.args.get('query', '')
    if not query:
        return jsonify({'error': 'Query vazia'}), 400
    
    try:
        response = requests.get(
            f'{TMDB_BASE_URL}/search/movie',
            params={'api_key': TMDB_API_KEY, 'query': query, 'language': 'pt-BR'}
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/meus-filmes', methods=['GET'])
def listar_meus_filmes():
    conn = get_db_connection()
    filmes = conn.execute('SELECT * FROM filmes ORDER BY data_adicao DESC').fetchall()
    conn.close()
    return jsonify([dict(filme) for filme in filmes])

@app.route('/api/meus-filmes', methods=['POST'])
def adicionar_filme():
    data = request.get_json()
    
    if not data or 'tmdb_id' not in data or 'titulo' not in data:
        return jsonify({'error': 'Dados incompletos'}), 400
    
    tmdb_id = data['tmdb_id']
    titulo = data['titulo']
    ano = formatar_ano(data.get('ano'))
    nota = data.get('nota', 0)
    poster_path = data.get('poster_path', None)
    
    if not validar_nota(nota):
        return jsonify({'error': 'Nota inválida (deve ser entre 0 e 10)'}), 400
    
    try:
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO filmes (tmdb_id, titulo, ano, nota, poster_path) VALUES (?, ?, ?, ?, ?)',
            (tmdb_id, titulo, ano, nota, poster_path)
        )
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Filme já adicionado'}), 409

@app.route('/api/meus-filmes/<int:tmdb_id>', methods=['DELETE'])
def remover_filme(tmdb_id):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM filmes WHERE tmdb_id = ?', (tmdb_id,))
        conn.commit()
        return jsonify({'success': True})
    finally:
        conn.close()

@app.route('/api/meus-filmes/<int:tmdb_id>/nota', methods=['PUT'])
def atualizar_nota(tmdb_id):
    data = request.get_json()
    nota = data.get('nota')
    
    if not validar_nota(nota):
        return jsonify({'error': 'Nota inválida (deve ser entre 0 e 10)'}), 400
    
    conn = get_db_connection()
    try:
        conn.execute('UPDATE filmes SET nota = ? WHERE tmdb_id = ?', (nota, tmdb_id))
        conn.commit()
        return jsonify({'success': True})
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
