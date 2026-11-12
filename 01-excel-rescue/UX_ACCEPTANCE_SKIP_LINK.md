# P01-F01 · E01 — aceitação de acessibilidade da prévia CSV (Design/UX)

**Escopo:** correção independente dos PRs #69 (link de salto em `try.html` e contorno em `demo.css`) e #71 (teste Chromium). Não representa `BACKEND_READY`, `UX_READY` ou conclusão de E04. Plano: #67. Não alterar regras de limpeza, API ou fixtures.

## Cenário reproduzível — integração antes de merge

1. Registrar os SHAs atuais de `main`, #69 e #71. Inspecionar diffs e preservar a ordem de dependências; montar árvore temporária combinada **sem** alterar `main` e sem force-push.
2. Com Python e Playwright/Chromium instalados conforme o README/PR #71, executar **na árvore combinada**:

   ```sh
   REQUIRE_SKIP_LINK=1 python 01-excel-rescue/check_try_browser.py
   ```

3. Registrar commit/árvore exatos, comando, código de saída, artefatos do teste e URL do workflow. Uma CI verde isolada em #69 ou #71 não substitui essa execução. O workflow do #71 executa o script **sem** `REQUIRE_SKIP_LINK=1`; configurar a variável na árvore combinada ou registrar execução estrita separada. Se o teste não existir no checkout, a composição está incorreta: falhar fechado.
4. Em Chromium com teclado apenas, iniciar no topo da página: primeiro **Tab** torna visível “Skip to CSV preview”; **Enter** transfere o foco ao `h2#preview-heading[tabindex=-1]`, com contorno perceptível; próximo **Tab** deve seguir para “Try fictional sample”, sem perder foco nem cair em controle oculto.
5. **Cobertura observada no HEAD do PR #71 (`de64a55d`):** o código já verifica que o Tab seguinte alcança exatamente o botão “Try fictional sample” e inclui **320, 375, 768 e 1280 px**. Essa cobertura é **estática, não evidência de execução no novo SHA nem na árvore combinada**. Conferir os resultados efetivos antes de aprovar. Conferir larguras de viewport **320, 375, 768 e 1280 px**: sem rolagem horizontal do documento, sem texto/controles cortados, link de salto totalmente visível quando focado. Conferir **zoom nativo 200%** separadamente (não equivale a emular viewport).
6. Com leitor de tela, conferir anúncio do link e do título de destino, ordem de leitura e ausência de armadilha de foco. **Não marcar aprovado sem teste humano ou automatizado apropriado registrado.**
7. Regressão: arquivo sintético válido, CSV malformado, seleção vazia, mensagens de status, saída em texto não executável, ausência de requisições externas e nenhuma exposição de dados reais. A política CSP deve permanecer restritiva.

## Critérios de decisão

- **Aprovar revisão UX** apenas com evidência positiva dos itens 2–5 e sem regressões do item 7; registrar separadamente o status do leitor de tela e eventuais ressalvas.
- **Bloquear merge** se teste estrito falhar, CI da árvore combinada não existir, houver conflito, alteração concorrente não reconciliada ou risco alto. `mergeable=true` não basta.
- **Backend** é o único executor de merge, após revisão de SHA, proteção de branch, dependências e CI. Este documento é um roteiro de aceitação, **não** um relatório de teste executado.

## Registro de evidências (preencher após executar)

| Campo | Resultado |
| --- | --- |
| SHA main / #69 / #71 / árvore combinada | Base observada `a3fa19f`; #69 `35cf16f2e3067fa3ecdc9c58efca3321ae3fa6d1`; #71 `de64a55d6bf58a9c1e492932f6a0e278daa383b2`; árvore combinada PENDENTE (reconsultar antes de integrar) |
| Chromium estrito e URL | NÃO EXECUTADO na árvore combinada; Chromium isolado do #71 [sucesso](https://github.com/WellingtonMax/freelance-solutions-portfolio/actions/runs/43041117570), sem `REQUIRE_SKIP_LINK=1` |
| Teclado, 320/375/768/1280 e zoom 200% | HEAD #71 inclui asserções de destino exato do Tab e 320/375/768/1280; execução no HEAD e árvore combinada NÃO COMPROVADA; zoom nativo 200% NÃO COBERTO |
| Leitor de tela | PENDENTE |
| Regressões, privacidade e CSP | PENDENTE NA ÁRVORE COMBINADA |
| Próximo responsável | Backend — composição, CI e decisão de integração |
