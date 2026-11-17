# Preenche Vagas (extensão para Chrome/Edge)

Preenche formulários de candidatura com o seu perfil e **para antes do envio**. Você revisa e clica em enviar.

## Sites compatíveis
Greenhouse, Lever, Ashby e Workable. LinkedIn não está incluído nesta versão.

## Instalar
1. Descompacte a pasta.
2. Abra `chrome://extensions`, ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e escolha a pasta `preenche-vagas`.
4. Clique no ícone da extensão, depois em **Editar perfil**, preencha e salve.

## Usar
Abra a página de uma vaga num site compatível e clique em **Preencher candidatura** (canto inferior direito).
- Verde: campo preenchido. Laranja tracejado: obrigatório sem resposta no perfil.
- O painel lista o que foi preenchido, o que falta e o que ficou em branco de propósito.

## O que a extensão nunca faz
- Não clica em enviar, não resolve CAPTCHA, não cria contas.
- Não preenche senha, documentos (CPF, passaporte, SSN) nem perguntas demográficas.
- Não manda dados para servidor nenhum: o perfil fica em `chrome.storage.local`, só no seu navegador.

## Compartilhar com outra pessoa
Cada pessoa instala a extensão e preenche o próprio perfil. **Exportar JSON** / **Importar JSON** serve para backup ou para levar o perfil a outro computador.

## Arquivos
- `rules.js`: perfil padrão e regras que ligam o rótulo de um campo a uma resposta. Para ensinar uma pergunta nova, acrescente uma linha em `RULES` ou use "Respostas personalizadas" no perfil.
- `content.js`: lê a página, preenche e mostra o painel.
- `options.html` / `options.js`: tela do perfil. `popup.html` / `popup.js`: botão da barra.
