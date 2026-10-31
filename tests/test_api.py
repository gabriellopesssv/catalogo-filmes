import pytest
import sys
import os
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, init_db


@pytest.fixture
def client():
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    
    app.config['TESTING'] = True
    
    import app as app_module
    original_db = app_module.DATABASE
    
    app_module.DATABASE = db_path
    
    init_db()
    
    with app.test_client() as client:
        yield client
    
    app_module.DATABASE = original_db
    os.close(db_fd)
    os.unlink(db_path)


def test_index_route(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Cat' in response.data


def test_listar_meus_filmes_vazio(client):
    response = client.get('/api/meus-filmes')
    assert response.status_code == 200
    data = response.get_json()
    assert data == []


def test_adicionar_filme_sucesso(client):
    response = client.post('/api/meus-filmes',
                          json={
                              'tmdb_id': 123,
                              'titulo': 'Test Movie',
                              'ano': 2024,
                              'nota': 8.5
                          })
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] == True


def test_adicionar_filme_duplicado(client):
    client.post('/api/meus-filmes',
                json={
                    'tmdb_id': 123,
                    'titulo': 'Test Movie',
                    'ano': 2024,
                    'nota': 8.5
                })
    
    response = client.post('/api/meus-filmes',
                          json={
                              'tmdb_id': 123,
                              'titulo': 'Test Movie',
                              'ano': 2024,
                              'nota': 8.5
                          })
    assert response.status_code == 409
    data = response.get_json()
    assert 'error' in data


def test_adicionar_filme_nota_invalida(client):
    response = client.post('/api/meus-filmes',
                          json={
                              'tmdb_id': 123,
                              'titulo': 'Test Movie',
                              'ano': 2024,
                              'nota': 15
                          })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data


def test_adicionar_filme_dados_incompletos(client):
    response = client.post('/api/meus-filmes',
                          json={
                              'tmdb_id': 123
                          })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data


def test_remover_filme(client):
    client.post('/api/meus-filmes',
                json={
                    'tmdb_id': 123,
                    'titulo': 'Test Movie',
                    'ano': 2024,
                    'nota': 8.5
                })
    
    response = client.delete('/api/meus-filmes/123')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    
    filmes = client.get('/api/meus-filmes').get_json()
    assert len(filmes) == 0


def test_atualizar_nota(client):
    client.post('/api/meus-filmes',
                json={
                    'tmdb_id': 123,
                    'titulo': 'Test Movie',
                    'ano': 2024,
                    'nota': 5.0
                })
    
    response = client.put('/api/meus-filmes/123/nota',
                          json={'nota': 9.0})
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
