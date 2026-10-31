# Catálogo de Filmes Colaborativo

Aplicação web para descobrir filmes, adicionar aos favoritos e avaliar.

**Stack Tecnológica:**
- **Backend:** Flask (Python 3.14)
- **Banco de dados:** SQLite (persistência real em arquivo)
- **API externa:** TMDB (The Movie Database)
- **Testes:** pytest
- **CI/CD:** GitHub Actions
- **Containerização:** Docker

## 🚀 Como Executar

### Localmente

1. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

2. **Configure a API Key do TMDB (opcional):**
```bash
# Crie uma conta em https://www.themoviedb.org/ e obtenha sua API key
export TMDB_API_KEY=sua_api_key_aqui
```

3. **Execute a aplicação:**
```bash
python app.py
```

4. **Acesse no navegador:**
```
http://localhost:5000
```

### Com Docker

1. **Construa a imagem:**
```bash
docker build -t catalogo-filmes .
```

2. **Execute o container:**
```bash
docker run -p 5000:5000 -e TMDB_API_KEY=sua_api_key_aqui catalogo-filmes
```

3. **Acesse no navegador:**
```
http://localhost:5000
```

## 🧪 Rodar Testes

```bash
pytest -v
```

## 📁 Estrutura do Projeto

```
catalogo-filmes/
├── app.py                      # Aplicação Flask principal
├── requirements.txt            # Dependências Python
├── Dockerfile                  # Configuração Docker
├── pytest.ini                  # Configuração do pytest
├── .github/
│   └── workflows/
│       └── ci.yml             # Workflow do GitHub Actions
├── templates/
│   └── index.html             # Página principal
├── static/
│   ├── css/
│   │   └── style.css          # Estilos
│   └── js/
│       └── app.js             # Lógica frontend
└── tests/
    ├── test_utils.py          # Testes de funções auxiliares
    └── test_api.py            # Testes da API
```

## 🔧 Funcionalidades

- **Filmes Populares:** Lista filmes populares da API TMDB
- **Busca:** Busque filmes por título
- **Meus Filmes:** Adicione filmes à sua lista pessoal
- **Avaliação:** Avalie filmes com notas de 0 a 10
- **Persistência:** Todos os dados são salvos em banco SQLite local

## 🔄 Fluxo de Trabalho (CI/CD)

Este projeto demonstra o fluxo profissional de desenvolvimento com Pull Requests e Integração Contínua.

### Branch Protection na main

Configure as seguintes regras de proteção no GitHub:

1. Vá em **Settings → Branches → Add branch ruleset**
2. Selecione a branch `main`
3. Ative:
   - ✅ **Require a pull request before merging** (1 aprovação)
   - ✅ **Require status checks to pass before merging** (selecione o check de testes após o primeiro run)

### Ciclo de Trabalho

```bash
# 1. Atualize sua cópia local da main
git checkout main
git pull origin main

# 2. Crie sua branch de funcionalidade
git checkout -b feature/nova-funcionalidade

# 3. Trabalhe: edite, teste localmente, e faça commits
git add .
git commit -m "Adiciona nova funcionalidade"

# 4. Envie a branch para o GitHub
git push -u origin feature/nova-funcionalidade
```

### Teste de Fogo

Para demonstrar que a proteção funciona:

1. Crie uma branch: `git checkout -b test/break-ci`
2. Modifique um teste para quebrar propositalmente
3. Faça commit e push
4. Abra uma PR
5. **Resultado esperado:** O GitHub bloqueará o merge porque os testes falharam
6. Capture um print desta tela (evidência)
7. Conserte o teste e faça novo commit
8. Com o check verde, o merge será permitido

## 📊 Testes Automatizados

O projeto inclui **12 testes automatizados** que verificam:

### Testes de Funções Auxiliares (test_utils.py)
- ✅ Validação de notas válidas (0-10)
- ✅ Rejeição de notas inválidas (< 0 ou > 10)
- ✅ Formatação de anos com 4 dígitos
- ✅ Formatação de anos com 2 dígitos (assumindo século)
- ✅ Tratamento de anos inválidos

### Testes da API (test_api.py)
- ✅ Rota principal retorna HTML
- ✅ Listar filmes quando não há nenhum
- ✅ Adicionar filme com sucesso
- ✅ Rejeitar duplicatas de filmes
- ✅ Rejeitar notas inválidas
- ✅ Rejeitar dados incompletos
- ✅ Remover filme
- ✅ Atualizar nota de filme

## 🐳 Docker Hub

Para publicar a imagem no Docker Hub:

```bash
# Faça login no Docker Hub
docker login

# Tag da imagem
docker tag catalogo-filmes seu-usuario/catalogo-filmes:v1.0

# Push para o Docker Hub
docker push seu-usuario/catalogo-filmes:v1.0
```

## 🔑 Configuração da API TMDB

Para usar a API TMDB de verdade:

1. Crie uma conta em https://www.themoviedb.org/
2. Vá em Settings → API → Create a new key
3. Copie a API key
4. Defina a variável de ambiente:
   ```bash
   export TMDB_API_KEY=sua_key_aqui
   ```
5. Ou passe como argumento no Docker:
   ```bash
   docker run -p 5000:5000 -e TMDB_API_KEY=sua_key_aqui catalogo-filmes
   ```

**Nota:** Sem uma API key real, a aplicação funcionará em modo demonstração mas poderá retornar erros da API.

## 📝 Autores

Gabriel Lopes da Silva - Matrícula 22611427
Enzo Rodrigues Nascimento - Matrícula 22612071
Lucas Vicente - lucas.vicente@sempreceub.com

## 📚 Documentação Adicional

- [Flask Documentation](https://flask.palletsprojects.com/)
- [TMDB API Documentation](https://developers.themoviedb.org/)
- [pytest Documentation](https://docs.pytest.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
