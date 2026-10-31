let modoAtual = 'populares';

function mostrarLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('errorMessage').classList.add('hidden');
}

function esconderLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function mostrarErro(mensagem) {
    document.getElementById('errorMessage').textContent = mensagem;
    document.getElementById('errorMessage').classList.remove('hidden');
}

function esconderErro() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function renderizarFilmes(filmes, ehMeusFilmes = false) {
    const grid = document.getElementById('filmesGrid');
    grid.innerHTML = '';

    if (!filmes || filmes.length === 0) {
        grid.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">Nenhum filme encontrado</p>';
        return;
    }

    filmes.forEach(filme => {
        const tmdbId = filme.id || filme.tmdb_id;
        const titulo = filme.title || filme.titulo;
        const ano = filme.release_date ? filme.release_date.split('-')[0] : filme.ano;
        const nota = filme.vote_average || filme.nota;
        const posterPath = filme.poster_path 
            ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
            : 'https://via.placeholder.com/500x750?text=Sem+Poster';
        const posterPathRaw = filme.poster_path || null;

        const card = document.createElement('div');
        card.className = 'filme-card';
        card.innerHTML = `
            <img src="${posterPath}" alt="${titulo}" class="filme-poster" onerror="this.src='https://via.placeholder.com/500x750?text=Sem+Poster'">
            <div class="filme-info">
                <h3 class="filme-titulo">${titulo}</h3>
                <p class="filme-ano">${ano || 'N/A'}</p>
                <span class="filme-nota">★ ${nota ? nota.toFixed(1) : 'N/A'}</span>
            </div>
            <div class="filme-actions">
                ${ehMeusFilmes 
                    ? `<button class="btn btn-remove" onclick="removerFilme(${tmdbId})">Remover</button>
                       <button class="btn btn-avaliar" onclick="avaliarFilme(${tmdbId})">Avaliar</button>`
                    : `<button class="btn btn-add" onclick="adicionarFilme(${tmdbId}, '${titulo.replace(/'/g, "\\'")}', ${ano}, '${posterPathRaw || ''}')">Adicionar</button>`
                }
            </div>
        `;
        grid.appendChild(card);
    });
}

async function mostrarPopulares() {
    modoAtual = 'populares';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab')[0].classList.add('active');
    
    mostrarLoading();
    esconderErro();
    
    try {
        const response = await fetch('/api/filmes/populares');
        const data = await response.json();
        
        if (response.ok) {
            renderizarFilmes(data.results);
        } else {
            mostrarErro(data.error || 'Erro ao buscar filmes populares');
        }
    } catch (error) {
        mostrarErro('Erro de conexão com a API');
    } finally {
        esconderLoading();
    }
}

async function mostrarMeusFilmes() {
    modoAtual = 'meus-filmes';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab')[1].classList.add('active');
    
    mostrarLoading();
    esconderErro();
    
    try {
        const response = await fetch('/api/meus-filmes');
        const data = await response.json();
        
        if (response.ok) {
            renderizarFilmes(data, true);
        } else {
            mostrarErro(data.error || 'Erro ao buscar seus filmes');
        }
    } catch (error) {
        mostrarErro('Erro de conexão');
    } finally {
        esconderLoading();
    }
}

async function buscarFilmes() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        mostrarErro('Digite um termo para buscar');
        return;
    }
    
    mostrarLoading();
    esconderErro();
    
    try {
        const response = await fetch(`/api/filmes/buscar?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (response.ok) {
            renderizarFilmes(data.results);
        } else {
            mostrarErro(data.error || 'Erro na busca');
        }
    } catch (error) {
        mostrarErro('Erro de conexão');
    } finally {
        esconderLoading();
    }
}

async function adicionarFilme(tmdbId, titulo, ano, posterPath) {
    try {
        const response = await fetch('/api/meus-filmes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tmdb_id: tmdbId, titulo: titulo, ano: ano, poster_path: posterPath })
        });
        
        if (response.ok) {
            alert('Filme adicionado com sucesso!');
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao adicionar filme');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
}

async function removerFilme(tmdbId) {
    if (!confirm('Tem certeza que deseja remover este filme?')) return;
    
    try {
        const response = await fetch(`/api/meus-filmes/${tmdbId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            mostrarMeusFilmes();
        } else {
            alert('Erro ao remover filme');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
}

async function avaliarFilme(tmdbId) {
    const nota = prompt('Digite sua nota (0-10):');
    
    if (nota === null) return;
    
    const notaFloat = parseFloat(nota);
    
    if (isNaN(notaFloat) || notaFloat < 0 || notaFloat > 10) {
        alert('Nota inválida. Digite um número entre 0 e 10.');
        return;
    }
    
    try {
        const response = await fetch(`/api/meus-filmes/${tmdbId}/nota`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nota: notaFloat })
        });
        
        if (response.ok) {
            mostrarMeusFilmes();
        } else {
            alert('Erro ao atualizar nota');
        }
    } catch (error) {
        alert('Erro de conexão');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    mostrarPopulares();
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarFilmes();
    });
});
