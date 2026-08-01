# Base CID-10/SIGTAP do GestaTools

## Competência
07/2026 (Julho de 2026)

## Fonte
Tabela Unificada SIGTAP - DATASUS / Ministério da Saúde

## Arquivos e Estrutura Gerada
- `/public/data/clinical-codes/manifest.json`: Manifesto da base publicada com a competência ativa.
- `/public/data/clinical-codes/202607/cids.json`: Catálogo de CIDs-10 (diagnósticos).
- `/public/data/clinical-codes/202607/procedures.json`: Catálogo de Procedimentos SIGTAP (10 dígitos).
- `/public/data/clinical-codes/202607/relations.json`: Relações oficiais CID-10 ↔ SIGTAP.

## Estatísticas da Competência 07/2026
- **CIDs-10 cadastrados**: 85
- **Procedimentos SIGTAP cadastrados**: 25
- **Relações oficiais mapeadas**: 71

## Procedimento de Atualização Mensal
1. Baixar o arquivo da competência oficial no portal SIGTAP/DATASUS: `https://sigtap.datasus.gov.br/tabela-unificada/app/download.jsp`.
2. Descompactar os arquivos de layout e dados em uma pasta local.
3. Executar o comando de build:
   ```bash
   npm run codes:build -- --input "./caminho/para/sigtap" --competence "202608"
   ```
4. Verificar as contagens geradas no terminal.
5. Executar os testes automatizados:
   ```bash
   npm run test
   ```
6. Executar a verificação de tipos e compilação:
   ```bash
   npm run lint
   npm run build
   ```
7. Validar manualmente uma amostra de CIDs e Procedimentos no SIGTAP Web.

## Limitações e Isenção de Responsabilidade
- As relações exibidas correspondem rigorosamente aos dados oficiais disponibilizados pelo DATASUS para a competência informada.
- A consulta é exclusivamente para apoio à decisão clínica e administrativa, não substituindo normas e autorizações específicas do gestor de saúde local.
