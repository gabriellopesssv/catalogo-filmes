const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/';
const DEFAULT_KEY = '074ef574a68ce45d00d55a7e35f2da6a';
const KEY_STORAGE = 'tmdb_api_key';
const FILMES_STORAGE = 'meus_filmes';
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="100%" height="100%" fill="#2a2138"/><text x="50%" y="50%" fill="#aa9fbf" font-family="sans-serif" font-size="30" text-anchor="middle">Sem poster</text></svg>'
);

const state = { modo: 'populares', query: '', req: 0, toastTimer: null, avaliando: null };

const $ = (id) => document.getElementById(id);

function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
}

function plural(n, singular, pluralTxt) {
    return n + ' ' + (n === 1 ? singular : pluralTxt);
}

function getKey() {
    try { return localStorage.getItem(KEY_STORAGE) || DEFAULT_KEY; } catch (e) { return DEFAULT_KEY; }
}

function setKey(valor) {
    try {
        if (valor) localStorage.setItem(KEY_STORAGE, valor);
        else localStorage.removeItem(KEY_STORAGE);
    } catch (e) {}
}

function lerMeus() {
    try {
        const lista = JSON.parse(localStorage.getItem(FILMES_STORAGE) || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        return [];
    }
}

function salvarMeus(lista) {
    try {
        localStorage.setItem(FILMES_STORAGE, JSON.stringify(lista));
        return true;
    } catch (e) {
        toast('Não foi possível salvar neste navegador');
        return false;
    }
}

function validarNota(nota) {
    const n = Number(nota);
    return nota !== '' && nota !== null && !Number.isNaN(n) && n >= 0 && n <= 10;
}

function atualizarContagem() {
    $('contagem').textContent = lerMeus().length;
}

function toast(msg, acao, aoAcao) {
    $('toastMsg').textContent = msg;
    const botao = $('toastAcao');
    botao.hidden = !acao;
    botao.textContent = acao || '';
    botao.onclick = () => {
        esconderToast();
        if (aoAcao) aoAcao();
    };
    $('toast').hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(esconderToast, acao ? 6000 : 3000);
}

function esconderToast() {
    $('toast').hidden = true;
}

function mostrarAlerta(mensagem, tentarDeNovo) {
    const caixa = $('alerta');
    caixa.replaceChildren(el('span', '', mensagem));
    if (tentarDeNovo) {
        const botao = el('button', 'btn btn-quiet', 'Tentar de novo');
        botao.type = 'button';
        botao.addEventListener('click', tentarDeNovo);
        caixa.appendChild(botao);
    }
    caixa.hidden = false;
}

function esconderAlerta() {
    $('alerta').hidden = true;
}

async function tmdb(caminho, params = {}) {
    const url = new URL(TMDB_BASE_URL + caminho);
    url.searchParams.set('api_key', getKey());
    url.searchParams.set('language', 'pt-BR');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        throw new Error('Sem conexão com a TMDB. Verifique a internet e tente de novo.');
    }
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
        throw new Error('A TMDB recusou a chave da API. Troque a chave no rodapé.');
    }
    if (!response.ok) {
        throw new Error(data.status_message || 'A TMDB retornou o erro ' + response.status + '.');
    }
    return data;
}

function urlImagem(caminho, tamanho) {
    return caminho ? TMDB_IMG_URL + tamanho + caminho : PLACEHOLDER;
}

function definirModo(modo, query) {
    state.modo = modo;
    state.query = query || '';
    $('tabPopulares').setAttribute('aria-current', String(modo !== 'meus'));
    $('tabMeus').setAttribute('aria-current', String(modo === 'meus'));
    if (modo === 'populares') {
        $('tituloSecao').textContent = 'Populares agora';
        $('subSecao').textContent = 'Os filmes mais vistos no TMDB neste momento.';
        $('searchInput').value = '';
    } else if (modo === 'busca') {
        $('tituloSecao').textContent = 'Resultados para “' + state.query + '”';
        $('subSecao').textContent = '';
    } else {
        $('tituloSecao').textContent = 'Sua lista';
        $('subSecao').textContent = '';
    }
}

function mostrarEsqueleto(comHero) {
    $('hero').replaceChildren();
    if (comHero) $('hero').appendChild(el('div', 'esqueleto esqueleto-hero'));
    const grade = $('filmesGrid');
    grade.replaceChildren();
    for (let i = 0; i < 12; i++) {
        grade.appendChild(el('div', 'esqueleto esqueleto-poster'));
    }
}

function limparConteudo() {
    $('hero').replaceChildren();
    $('filmesGrid').replaceChildren();
}

function marcarNaLista(botao) {
    botao.disabled = true;
    botao.textContent = 'Na sua lista';
    botao.classList.remove('btn-primary');
    botao.classList.add('btn-quiet');
}

function adicionarFilme(dados, botao) {
    const lista = lerMeus();
    if (lista.some((f) => f.tmdb_id === dados.tmdbId)) {
        marcarNaLista(botao);
        toast('Este filme já está na sua lista');
        return;
    }
    const anoNum = parseInt(dados.ano, 10);
    lista.unshift({
        tmdb_id: dados.tmdbId,
        titulo: dados.titulo,
        ano: Number.isNaN(anoNum) ? null : anoNum,
        nota: 0,
        poster_path: dados.posterPath || null,
        data_adicao: new Date().toISOString()
    });
    if (salvarMeus(lista)) {
        marcarNaLista(botao);
        atualizarContagem();
        toast('Adicionado à sua lista');
    }
}

function removerFilme(tmdbId) {
    const lista = lerMeus();
    const indice = lista.findIndex((f) => f.tmdb_id === tmdbId);
    if (indice < 0) return;
    const [removido] = lista.splice(indice, 1);
    if (!salvarMeus(lista)) return;
    mostrarMeus();
    toast('Filme removido da lista', 'Desfazer', () => {
        const atual = lerMeus();
        atual.splice(Math.min(indice, atual.length), 0, removido);
        salvarMeus(atual);
        if (state.modo === 'meus') mostrarMeus();
        else atualizarContagem();
    });
}

function avaliarFilme(tmdbId) {
    const filme = lerMeus().find((f) => f.tmdb_id === tmdbId);
    if (!filme) return;
    state.avaliando = tmdbId;
    $('ratingFilme').textContent = filme.titulo;
    $('ratingInput').value = filme.nota ? filme.nota : '';
    $('ratingRange').value = filme.nota || 0;
    $('ratingErro').hidden = true;
    $('ratingDialog').showModal();
    $('ratingInput').focus();
}

function salvarNota(evento) {
    evento.preventDefault();
    const valor = $('ratingInput').value.trim().replace(',', '.');
    if (!validarNota(valor)) {
        $('ratingErro').textContent = 'Digite um número de 0 a 10.';
        $('ratingErro').hidden = false;
        return;
    }
    const lista = lerMeus();
    const filme = lista.find((f) => f.tmdb_id === state.avaliando);
    if (!filme) {
        $('ratingDialog').close();
        return;
    }
    filme.nota = parseFloat(valor);
    if (salvarMeus(lista)) {
        $('ratingDialog').close();
        mostrarMeus();
        toast('Nota salva');
    }
}

function criarCard(filme, ehMeus) {
    const tmdbId = filme.id || filme.tmdb_id;
    const titulo = filme.title || filme.titulo || 'Sem título';
    const ano = filme.release_date ? filme.release_date.split('-')[0] : filme.ano;
    const nota = filme.vote_average || filme.nota;
    const posterRaw = filme.poster_path || null;

    const card = el('article', 'filme');

    const poster = el('div', 'poster');
    const img = document.createElement('img');
    img.alt = 'Poster de ' + titulo;
    img.loading = 'lazy';
    img.src = urlImagem(posterRaw, 'w342');
    img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });
    poster.appendChild(img);

    if (ehMeus) {
        if (nota) {
            const chip = el('span', 'chip', '★ ' + Number(nota).toFixed(1));
            chip.title = 'Sua nota';
            poster.appendChild(chip);
        } else {
            poster.appendChild(el('span', 'chip chip-vazio', 'Sem nota'));
        }
    } else if (nota) {
        const chip = el('span', 'chip', '★ ' + Number(nota).toFixed(1));
        chip.title = 'Nota média no TMDB';
        poster.appendChild(chip);
    }

    const acoes = el('div', 'filme-acoes');
    if (ehMeus) {
        const avaliar = el('button', 'btn btn-quiet', nota ? 'Mudar nota' : 'Avaliar');
        avaliar.type = 'button';
        avaliar.addEventListener('click', () => avaliarFilme(tmdbId));
        const remover = el('button', 'btn btn-perigo', 'Remover');
        remover.type = 'button';
        remover.addEventListener('click', () => removerFilme(tmdbId));
        acoes.append(avaliar, remover);
    } else {
        const adicionar = el('button', 'btn btn-primary', 'Adicionar à lista');
        adicionar.type = 'button';
        if (lerMeus().some((f) => f.tmdb_id === tmdbId)) marcarNaLista(adicionar);
        adicionar.addEventListener('click', () => adicionarFilme({ tmdbId, titulo, ano, posterPath: posterRaw }, adicionar));
        acoes.appendChild(adicionar);
    }

    card.append(poster, el('h3', 'filme-titulo', titulo), el('p', 'filme-ano', ano || 'Ano não informado'), acoes);
    return card;
}

function renderGrade(filmes, ehMeus, vazio) {
    const grade = $('filmesGrid');
    grade.replaceChildren();
    if (!filmes || filmes.length === 0) {
        const caixa = el('div', 'vazio');
        caixa.append(el('h2', '', vazio.titulo), el('p', '', vazio.texto));
        if (vazio.acao) {
            const botao = el('button', 'btn btn-primary', vazio.acao);
            botao.type = 'button';
            botao.addEventListener('click', vazio.aoAcao);
            caixa.appendChild(botao);
        }
        grade.appendChild(caixa);
        return;
    }
    filmes.forEach((f) => grade.appendChild(criarCard(f, ehMeus)));
}

function renderHero(filme) {
    const host = $('hero');
    host.replaceChildren();
    if (!filme) return;

    const tmdbId = filme.id;
    const titulo = filme.title || 'Sem título';
    const ano = filme.release_date ? filme.release_date.split('-')[0] : '';

    const secao = el('section', 'hero');
    secao.setAttribute('aria-label', 'Filme em destaque');

    const fundo = document.createElement('img');
    fundo.className = 'hero-img';
    fundo.alt = '';
    fundo.addEventListener('load', () => fundo.classList.add('pronto'));
    fundo.src = urlImagem(filme.backdrop_path, 'w1280');

    const corpo = el('div', 'hero-corpo');
    const fatos = el('div', 'hero-fatos');
    if (filme.vote_average) fatos.appendChild(el('span', 'fato fato-nota', '★ ' + filme.vote_average.toFixed(1)));
    if (ano) fatos.appendChild(el('span', 'fato', ano));

    const botao = el('button', 'btn btn-primary', 'Adicionar à lista');
    botao.type = 'button';
    if (lerMeus().some((f) => f.tmdb_id === tmdbId)) marcarNaLista(botao);
    botao.addEventListener('click', () => adicionarFilme({ tmdbId, titulo, ano, posterPath: filme.poster_path }, botao));

    corpo.append(fatos, el('h2', 'hero-titulo', titulo));
    if (filme.overview) corpo.appendChild(el('p', 'hero-sinopse', filme.overview));
    corpo.appendChild(botao);

    secao.append(fundo, corpo);
    host.appendChild(secao);
}

async function mostrarPopulares() {
    const req = ++state.req;
    definirModo('populares');
    esconderAlerta();
    mostrarEsqueleto(true);
    try {
        const data = await tmdb('/movie/popular');
        if (req !== state.req) return;
        const resultados = data.results || [];
        const destaque = resultados.find((f) => f.backdrop_path);
        renderHero(destaque);
        renderGrade(resultados.filter((f) => f !== destaque), false, {
            titulo: 'Nada por aqui',
            texto: 'A TMDB não retornou filmes agora. Tente de novo em instantes.',
            acao: 'Tentar de novo',
            aoAcao: mostrarPopulares
        });
    } catch (error) {
        if (req !== state.req) return;
        limparConteudo();
        mostrarAlerta(error.message, mostrarPopulares);
    }
}

async function buscarFilmes(query) {
    const req = ++state.req;
    definirModo('busca', query);
    esconderAlerta();
    mostrarEsqueleto(false);
    try {
        const data = await tmdb('/search/movie', { query });
        if (req !== state.req) return;
        const resultados = data.results || [];
        $('subSecao').textContent = plural(resultados.length, 'filme encontrado', 'filmes encontrados');
        renderHero(null);
        renderGrade(resultados, false, {
            titulo: 'Nenhum resultado',
            texto: 'Confira a grafia ou tente outro título.',
            acao: 'Ver populares',
            aoAcao: mostrarPopulares
        });
    } catch (error) {
        if (req !== state.req) return;
        limparConteudo();
        mostrarAlerta(error.message, () => buscarFilmes(query));
    }
}

function mostrarMeus() {
    state.req++;
    definirModo('meus');
    esconderAlerta();
    renderHero(null);
    const lista = lerMeus();
    $('subSecao').textContent = lista.length
        ? plural(lista.length, 'filme salvo', 'filmes salvos') + ' neste navegador.'
        : '';
    atualizarContagem();
    renderGrade(lista, true, {
        titulo: 'Sua lista está vazia',
        texto: 'Adicione filmes pela aba Populares ou por uma busca.',
        acao: 'Ver populares',
        aoAcao: mostrarPopulares
    });
}

function aoBuscar(evento) {
    evento.preventDefault();
    const query = $('searchInput').value.trim();
    if (!query) {
        toast('Digite um título para buscar');
        return;
    }
    buscarFilmes(query);
}

function abrirChave() {
    try { $('keyInput').value = localStorage.getItem(KEY_STORAGE) || ''; } catch (e) { $('keyInput').value = ''; }
    $('keyDialog').showModal();
    $('keyInput').focus();
}

function recarregarModo() {
    if (state.modo === 'busca') buscarFilmes(state.query);
    else if (state.modo === 'meus') mostrarMeus();
    else mostrarPopulares();
}

function salvarChave(evento) {
    evento.preventDefault();
    setKey($('keyInput').value.trim());
    $('keyDialog').close();
    toast('Chave atualizada');
    recarregarModo();
}

function usarChavePadrao() {
    setKey('');
    $('keyDialog').close();
    toast('Usando a chave padrão');
    recarregarModo();
}

document.addEventListener('DOMContentLoaded', () => {
    $('tabPopulares').addEventListener('click', mostrarPopulares);
    $('tabMeus').addEventListener('click', mostrarMeus);
    $('searchForm').addEventListener('submit', aoBuscar);
    $('keyOpen').addEventListener('click', abrirChave);
    $('keyForm').addEventListener('submit', salvarChave);
    $('keyPadrao').addEventListener('click', usarChavePadrao);
    $('ratingForm').addEventListener('submit', salvarNota);
    $('ratingCancelar').addEventListener('click', () => $('ratingDialog').close());
    $('ratingRange').addEventListener('input', () => { $('ratingInput').value = $('ratingRange').value; });
    $('ratingInput').addEventListener('input', () => {
        const n = parseFloat($('ratingInput').value);
        if (!Number.isNaN(n)) $('ratingRange').value = n;
    });

    atualizarContagem();
    mostrarPopulares();
});
