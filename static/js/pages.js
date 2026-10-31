const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/w500';
const KEY_STORAGE = 'tmdb_api_key';
const FILMES_STORAGE = 'meus_filmes';
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="100%" height="100%" fill="#e5e5e5"/><text x="50%" y="50%" fill="#777" font-family="sans-serif" font-size="32" text-anchor="middle">Sem poster</text></svg>'
);

const $ = (id) => document.getElementById(id);

function getKey() {
    try { return localStorage.getItem(KEY_STORAGE) || ''; } catch (e) { return ''; }
}

function setKey(valor) {
    try {
        if (valor) localStorage.setItem(KEY_STORAGE, valor);
        else localStorage.removeItem(KEY_STORAGE);
    } catch (e) {}
}

function lerMeusFilmes() {
    try {
        const lista = JSON.parse(localStorage.getItem(FILMES_STORAGE) || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        return [];
    }
}

function salvarMeusFilmes(lista) {
    try {
        localStorage.setItem(FILMES_STORAGE, JSON.stringify(lista));
        return true;
    } catch (e) {
        alert('Não foi possível salvar no navegador');
        return false;
    }
}

function validarNota(nota) {
    const n = Number(nota);
    return nota !== '' && nota !== null && !Number.isNaN(n) && n >= 0 && n <= 10;
}

function mostrarLoading() {
    $('loading').classList.remove('hidden');
    $('errorMessage').classList.add('hidden');
}

function esconderLoading() {
    $('loading').classList.add('hidden');
}

function mostrarErro(mensagem) {
    $('errorMessage').textContent = mensagem;
    $('errorMessage').classList.remove('hidden');
}

function esconderErro() {
    $('errorMessage').classList.add('hidden');
}

function atualizarSecaoChave() {
    $('keySection').classList.toggle('hidden', Boolean(getKey()));
}

function marcarAba(indice) {
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === indice));
}

async function tmdb(caminho, params = {}) {
    const key = getKey();
    if (!key) throw new Error('Informe a chave da API TMDB');
    const url = new URL(TMDB_BASE_URL + caminho);
    url.searchParams.set('api_key', key);
    url.searchParams.set('language', 'pt-BR');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.status_message || 'Erro na API TMDB (' + response.status + ')');
    }
    return data;
}

function criarBotao(texto, classe, aoClicar) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn ' + classe;
    botao.textContent = texto;
    botao.addEventListener('click', aoClicar);
    return botao;
}

function renderizarFilmes(filmes, ehMeusFilmes = false) {
    const grid = $('filmesGrid');
    grid.replaceChildren();

    if (!filmes || filmes.length === 0) {
        const vazio = document.createElement('p');
        vazio.style.cssText = 'color: white; text-align: center; grid-column: 1/-1;';
        vazio.textContent = 'Nenhum filme encontrado';
        grid.appendChild(vazio);
        return;
    }

    filmes.forEach((filme) => {
        const tmdbId = filme.id || filme.tmdb_id;
        const titulo = filme.title || filme.titulo || 'Sem título';
        const ano = filme.release_date ? filme.release_date.split('-')[0] : filme.ano;
        const nota = filme.vote_average || filme.nota;
        const posterRaw = filme.poster_path || null;

        const card = document.createElement('div');
        card.className = 'filme-card';

        const img = document.createElement('img');
        img.className = 'filme-poster';
        img.alt = titulo;
        img.src = posterRaw ? TMDB_IMG_URL + posterRaw : PLACEHOLDER;
        img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });

        const info = document.createElement('div');
        info.className = 'filme-info';

        const h3 = document.createElement('h3');
        h3.className = 'filme-titulo';
        h3.textContent = titulo;

        const pAno = document.createElement('p');
        pAno.className = 'filme-ano';
        pAno.textContent = ano || 'N/A';

        const spanNota = document.createElement('span');
        spanNota.className = 'filme-nota';
        spanNota.textContent = '★ ' + (nota ? Number(nota).toFixed(1) : 'N/A');

        info.append(h3, pAno, spanNota);

        const actions = document.createElement('div');
        actions.className = 'filme-actions';

        if (ehMeusFilmes) {
            actions.append(
                criarBotao('Remover', 'btn-remove', () => removerFilme(tmdbId)),
                criarBotao('Avaliar', 'btn-avaliar', () => avaliarFilme(tmdbId))
            );
        } else {
            actions.append(
                criarBotao('Adicionar', 'btn-add', () => adicionarFilme(tmdbId, titulo, ano, posterRaw))
            );
        }

        card.append(img, info, actions);
        grid.appendChild(card);
    });
}

async function mostrarPopulares() {
    marcarAba(0);
    mostrarLoading();
    esconderErro();
    try {
        const data = await tmdb('/movie/popular');
        renderizarFilmes(data.results);
    } catch (error) {
        mostrarErro(error.message);
    } finally {
        esconderLoading();
    }
}

function mostrarMeusFilmes() {
    marcarAba(1);
    esconderErro();
    renderizarFilmes(lerMeusFilmes(), true);
}

async function buscarFilmes() {
    const query = $('searchInput').value.trim();
    if (!query) {
        mostrarErro('Digite um termo para buscar');
        return;
    }
    marcarAba(0);
    mostrarLoading();
    esconderErro();
    try {
        const data = await tmdb('/search/movie', { query });
        renderizarFilmes(data.results);
    } catch (error) {
        mostrarErro(error.message);
    } finally {
        esconderLoading();
    }
}

function adicionarFilme(tmdbId, titulo, ano, posterPath) {
    const lista = lerMeusFilmes();
    if (lista.some((f) => f.tmdb_id === tmdbId)) {
        alert('Filme já adicionado');
        return;
    }
    const anoNum = parseInt(ano, 10);
    lista.unshift({
        tmdb_id: tmdbId,
        titulo,
        ano: Number.isNaN(anoNum) ? null : anoNum,
        nota: 0,
        poster_path: posterPath || null,
        data_adicao: new Date().toISOString()
    });
    if (salvarMeusFilmes(lista)) alert('Filme adicionado com sucesso!');
}

function removerFilme(tmdbId) {
    if (!confirm('Tem certeza que deseja remover este filme?')) return;
    salvarMeusFilmes(lerMeusFilmes().filter((f) => f.tmdb_id !== tmdbId));
    mostrarMeusFilmes();
}

function avaliarFilme(tmdbId) {
    const entrada = prompt('Digite sua nota (0-10):');
    if (entrada === null) return;
    const texto = entrada.trim().replace(',', '.');
    if (!validarNota(texto)) {
        alert('Nota inválida. Digite um número entre 0 e 10.');
        return;
    }
    const lista = lerMeusFilmes();
    const filme = lista.find((f) => f.tmdb_id === tmdbId);
    if (!filme) return;
    filme.nota = parseFloat(texto);
    salvarMeusFilmes(lista);
    mostrarMeusFilmes();
}

function salvarChave() {
    const valor = $('keyInput').value.trim();
    if (!valor) {
        mostrarErro('Cole a chave da API TMDB');
        return;
    }
    setKey(valor);
    $('keyInput').value = '';
    atualizarSecaoChave();
    mostrarPopulares();
}

function trocarChave() {
    setKey('');
    atualizarSecaoChave();
    $('filmesGrid').replaceChildren();
    esconderErro();
}

document.addEventListener('DOMContentLoaded', () => {
    $('searchBtn').addEventListener('click', buscarFilmes);
    $('tabPopulares').addEventListener('click', mostrarPopulares);
    $('tabMeus').addEventListener('click', mostrarMeusFilmes);
    $('keySave').addEventListener('click', salvarChave);
    $('keyReset').addEventListener('click', trocarChave);
    $('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarFilmes();
    });
    $('keyInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') salvarChave();
    });

    atualizarSecaoChave();
    if (getKey()) mostrarPopulares();
});
