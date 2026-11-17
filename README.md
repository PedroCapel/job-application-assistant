# Job Application Assistant

Duas ferramentas para quem está procurando emprego e cansou de preencher o mesmo formulário dezenas de vezes:

1. **Skill para o Claude** (`skill/`): o Claude lê as vagas, faz a triagem pelo seu perfil e preenche candidaturas no seu navegador.
2. **Extensão para Chrome/Edge** (`extension/`): preenche formulários de candidatura com o seu perfil e para antes do envio.

As duas partem da mesma ideia: você descreve **uma vez** quem é, o que procura e como responde às perguntas de sempre. O envio final e as decisões sensíveis continuam com você.

> **English summary.** A Claude skill and a Chrome extension that fill in job applications from a reusable profile (targets, screening rules, answer bank, documents). Neither one solves CAPTCHAs, types passwords or ID numbers, or invents experience. The extension never clicks submit. Docs are in Portuguese.

## 1. Skill para o Claude

Arquivo: [`skill/job-application-assistant/SKILL.md`](skill/job-application-assistant/SKILL.md)

O que ela faz:
- Monta ou lê o seu perfil (modelo em [`skill/perfil_candidaturas.exemplo.md`](skill/perfil_candidaturas.exemplo.md)).
- Lê os requisitos de cada vaga **antes** de aplicar e pula o que não combina.
- Responde às perguntas de triagem pelo banco de respostas e pergunta só o que for novo.
- Gera uma carta de apresentação por vaga, quando o formulário tem campo para isso.
- Entrega um relatório: o que foi enviado, o que ficou pronto esperando seu clique, o que foi pulado e por quê.

Como instalar: no Claude, crie uma skill nova e cole o conteúdo do `SKILL.md` (ou envie a pasta `skill/job-application-assistant`). É preciso ter o Claude in Chrome ativo para ele operar o navegador.

## 2. Extensão "Preenche Vagas"

Pasta: [`extension/`](extension/) (instruções em [`extension/README.md`](extension/README.md))

- Funciona em Greenhouse, Lever, Ashby e Workable.
- Preenche texto, menus, faixas de anos, sim/não, anexa o currículo e cola a carta com empresa e cargo.
- Mostra um painel com o que preencheu, o que falta e o que deixou em branco de propósito.
- O perfil fica só no seu navegador (`chrome.storage.local`). Nada é enviado a servidor nenhum.

Instalar: `chrome://extensions` → ativar **Modo do desenvolvedor** → **Carregar sem compactação** → escolher a pasta `extension`.

Testar a lógica de preenchimento (precisa de Python e Playwright):

```bash
pip install playwright && playwright install chromium
python extension/test/run.py
```

## Limites, de propósito

- **Não** resolve nem contorna CAPTCHA ou verificação anti-robô. Onde o site barra, o formulário fica pronto e você clica.
- **Não** digita senha, CPF, passaporte, SSN nem dados bancários.
- **Não** preenche perguntas demográficas opcionais.
- **Não** inventa experiência: se o perfil não tem a resposta, o campo fica para você.
- A extensão **nunca** clica em enviar.

## Aviso sobre o LinkedIn

Os termos de uso do LinkedIn proíbem automação de ações na plataforma, e contas podem ser restringidas por isso. A extensão não atua no LinkedIn. A skill pode operar o Easy Apply no seu próprio navegador, a seu pedido e sob sua responsabilidade. Use com moderação e revise o que é enviado em seu nome.

## Estado do projeto

Primeira versão. A skill nasceu de uma rodada real de candidaturas; a extensão passou em testes num formulário simulado e ainda precisa de validação em mais sites reais. Relatos de formulários que não preenchem direito são bem-vindos nas issues, de preferência com o endereço da vaga e o nome do campo.

## Licença

MIT. Veja [`LICENSE`](LICENSE).
