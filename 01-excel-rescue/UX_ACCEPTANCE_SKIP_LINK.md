# P01-F01 · E01 — aceitação de acessibilidade da prévia CSV (Design/UX)

**Escopo:** correção independente dos PRs #69 (link de salto em `try.html` e contorno em `demo.css`) e #71 (teste Chromium). Não representa `BACKEND_READY`, `UX_READY` ou conclusão de E04. Plano: #67. Não alterar regras de limpeza, API ou fixtures.

## Cenário reproduzível — integração antes de merge

1. Registrar os SHAs atuais de `main`, #69 e #71. Inspecionar diffs e preservar a ordem de dependências; montar árvore temporária combinada **sem** alterar `main` e sem force-push.
2. Com Python e Playwright/Chromium instalados conforme o README/PR #71, executar **na árvore combinada**:

   ```sh
   REQUIRE_SKIP_LINK=1 python 01-excel-rescue/check_try_browser.py
   ```

3. Registrar commit/árvore exatos, comando, código de saída, artefatos do teste e URL do workflow. Uma CI verde isolada em #69 ou #71 não substitui essa execução. Se o teste não existir no checkout, a composição está incorreta: falhar fechado.
4. Em Chromium com teclado apenas, iniciar no topo da página: primeiro **Tab** torna visível “Skip to CSV preview”; **Enter** transfere o foco ao `h2#preview-heading[tabindex=-1]`, com contorno perceptível; próximo **Tab** deve seguir para “Try fictional sample”, sem perder foco nem cair em controle oculto.
5. Conferir larguras de viewport **320, 375, 768 e 1280 px**: sem rolagem horizontal do documento, sem texto/controles cortados, link de salto totalmente visível quando focado. Conferir **zoom nativo 200%** separadamente (não equivale a emular viewport).
6. Com leitor de tela, conferir anúncio do link e do título de destino, ordem de leitura e ausência de armadilha de foco. **Não marcar aprovado sem teste humano ou automatizado apropriado registrado.**
7. Regressão: arquivo sintético válido, CSV malformado, seleção vazia, mensagens de status, saída em texto não executável, ausência de requisições externas e nenhuma exposição de dados reais. A política CSP deve permanecer restritiva.

## Critérios de decisão

- **Aprovar revisão UX** apenas com evidência positiva dos itens 2–5 e sem regressões do item 7; registrar separadamente o status do leitor de tela e eventuais ressalvas.
- **Bloquear merge** se teste estrito falhar, CI da árvore combinada não existir, houver conflito, alteração concorrente não reconciliada ou risco alto. `mergeable=true` não basta.
- **Backend** é o único executor de merge, após revisão de SHA, proteção de branch, dependências e CI. Este documento é um roteiro de aceitação, **não** um relatório de teste executado.

## Registro de evidências (preencher após executar)

| Campo | Resultado |
| --- | --- |
| SHA main / #69 / #71 / árvore combinada | PENDENTE |
| Chromium estrito e URL | NÃO EXECUTADO NESTE DOCUMENTO |
| Teclado, 320/375/768/1280 e zoom 200% | PENDENTE |
| Leitor de tela | PENDENTE |
| Regressões, privacidade e CSP | PENDENTE NA ÁRVORE COMBINADA |
| Próximo responsável | Backend — composição, CI e decisão de integração |
