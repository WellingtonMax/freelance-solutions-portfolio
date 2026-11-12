# P01-F01 · E01 — aceitação de acessibilidade da prévia CSV (Design/UX)

**Escopo:** registro de aceitação pós-integração da correção E01 (PR #74, que substituiu #69 e #71). Este documento não introduz nova funcionalidade nem representa `BACKEND_READY`, `UX_READY` ou conclusão de E04. Plano: #67. Não alterar regras de limpeza, API ou fixtures.

## Integração realizada — evidência de 12/11/2026

O Backend integrou via squash o PR [#74](https://github.com/WellingtonMax/freelance-solutions-portfolio/pull/74) em `main`, commit `401f55d783b3a6b85921b9100b999a55ee1ca71c`. Os PRs #69 (Design) e #71 (Frontend) foram encerrados como substituídos, **não** devem ser aplicados novamente. O comentário de integração do Backend no #74 registra conferência de blobs e logs da árvore combinada, incluindo `REQUIRE_SKIP_LINK=1 python 01-excel-rescue/check_try_browser.py` com PASS em 320, 375, 768 e 1280 px.

Evidências de CI no head combinado `2fa9a73a9363dd511685942eb020258c046d9740`: [Chromium estrito](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001191), [Chromium UX](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001203), [Python](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001243), [CodeQL](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001176). São evidências do PR integrado, **não** de nova execução nesta correção documental nem certificação de acessibilidade.

**Limitações abertas:** zoom **nativo** 200% e leitor de tela ainda não possuem evidência; ações de workflow referenciadas por versão, não SHA imutável. A integração corrige uma regressão de E01, mas **não** equivale a `BACKEND_READY`, `UX_READY`, E04 concluída ou produto comercialmente pronto.

## Roteiro de regressão reproduzível após integração

1. Em checkout da `main` contendo o squash `401f55d`, instalar dependências Playwright/Chromium descritas no README e executar `REQUIRE_SKIP_LINK=1 python 01-excel-rescue/check_try_browser.py`.
2. Confirmar primeiro Tab no link de salto, Enter focando `h2#preview-heading` e Tab seguinte no botão “Try fictional sample”. Conferir ausência de rolagem horizontal em 320/375/768/1280 px.
3. Com zoom **nativo** de 200%, conferir visualmente ordem de leitura, contorno, truncamento e alcance de controles; registrar navegador, SO, captura e resultado. Em leitor de tela, verificar anúncio de link, destino e estados de feedback; registrar tecnologia e resultado. **Não declarar aprovado sem executar.**
4. Revalidar amostras sintéticas, entrada HTML hostil exibida como texto, erro/limpeza de resultados anteriores, CSP e ausência de chamadas externas inesperadas. Não usar dados reais.

## Critérios de decisão

- **Aprovar revisão UX** apenas após registrar evidência positiva do roteiro de regressão acima (passos 1–4), inclusive foco, larguras, segurança e privacidade; documentar separadamente o resultado do zoom nativo de 200% e do leitor de tela, sem transformar pendências em aprovação.
- **Bloquear merge de alterações futuras** se o teste estrito falhar, a CI do SHA proposto não existir, houver conflito, alteração concorrente não reconciliada ou risco alto. `mergeable=true` não basta; a integração histórica do #74 não autoriza merges subsequentes.
- **Backend** é o único executor de merge, após revisão de SHA, proteção de branch, dependências e CI. Este documento é um roteiro de aceitação, **não** um relatório de teste executado.

## Registro factual (atualizado após o merge)

| Campo | Evidência / lacuna |
| --- | --- |
| Árvore combinada / integração | PR #74 head `2fa9a73a9363dd511685942eb020258c046d9740`; squash na main `401f55d783b3a6b85921b9100b999a55ee1ca71c` |
| Chromium estrito | [Execução 43138001191](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001191), sucesso; Backend confirmou log com `REQUIRE_SKIP_LINK=1` e PASS 320/375/768/1280 |
| Outras regressões | [Chromium UX](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001203), [Python](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001243), [CodeQL](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43138001176): sucesso no head combinado |
| Zoom 200% / leitor de tela | **Não verificados**; aceitação manual ainda necessária |
| Estado da funcionalidade | Correção de regressão E01 **integrada**; sem `BACKEND_READY` / `UX_READY` / certificação comercial |
| Próximo responsável | Backend: contrato E02 e handoff `BACKEND_READY`; Design/UX: E04 apenas depois do gate, ou regressões independentes |
