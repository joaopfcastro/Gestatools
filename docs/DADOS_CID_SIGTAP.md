# Base CID-10 e SIGTAP do GestaTools

## Competência Ativa
**07/2026** (Julho de 2026)

## Fonte de Dados
Tabela Unificada SIGTAP — DATASUS / Ministério da Saúde (Arquivos TXT de largura fixa em ISO-8859-1 / Latin1).

---

## Arquivos e Estrutura do Catálogo

```
/public/data/clinical-codes/
  ├── manifest.json              # Manifesto V2 com versão, hashes SHA-256 e tamanhos
  └── 202607/
      ├── cids.json              # Lista de CIDs-10 (código, descrição, busca normalizada)
      ├── procedures.json        # Lista de procedimentos SIGTAP (10 dígitos, nome, grupo, subgrupo, forma)
      └── relations.json         # Relações oficiais CID-10 ↔ SIGTAP (com indicação ST_PRINCIPAL)
```

### Formato do Manifesto V2 (`manifest.json`)
```json
{
  "schemaVersion": 2,
  "competence": "202607",
  "competenceLabel": "07/2026",
  "generatedAt": "2026-08-01T14:00:00.000Z",
  "source": "SIGTAP/DATASUS",
  "basePath": "/data/clinical-codes/202607",
  "sourceFiles": [
    "tb_cid.txt",
    "tb_procedimento.txt",
    "rl_procedimento_cid.txt"
  ],
  "counts": {
    "cids": 85,
    "procedures": 25,
    "relations": 71
  },
  "sizes": {
    "cids": 11200,
    "procedures": 9800,
    "relations": 6500
  },
  "hashes": {
    "cids": "a1b2c3...",
    "procedures": "d4e5f6...",
    "relations": "789abc..."
  },
  "files": {
    "cids": "cids.json",
    "procedures": "procedures.json",
    "relations": "relations.json"
  }
}
```

---

## Histórico de Acessos Recentes ("Recentes")

- **Chave de armazenamento**: `gestatools_clinical_codes_recent_v1`
- **Armazenamento**: `localStorage` exclusivo do navegador do usuário.
- **Limite**: Até 10 itens recentes por aba (10 CIDs recentes e 10 Procedimentos recentes).
- **Garantia de Privacidade**: O histórico de buscas e acessos é **100% privado e estritamente local no dispositivo**.
- **Regras**:
  - Nunca é enviado para qualquer servidor, API de terceiros, Google Analytics ou serviço externo.
  - Exibido automaticamente ao abrir a ferramenta quando o campo de busca estiver vazio.
  - Itens recentemente consultados recebem selo/destaque visual ("Recente") nos resultados de busca.
  - O usuário pode limpar seu histórico individualmente por aba ou totalmente a qualquer momento.

---

## Pipeline de Importação Oficial e Validação

### 1. Requisitos dos Arquivos do SIGTAP
A pasta de entrada informada via `--input` deve conter obrigatoriamente os seguintes arquivos (com suporte a maiúsculas/minúsculas):
- `tb_cid_layout.txt` e `tb_cid.txt`
- `tb_procedimento_layout.txt` e `tb_procedimento.txt`
- `rl_procedimento_cid_layout.txt` e `rl_procedimento_cid.txt`

### 2. Comandos de Processamento
Para importar uma nova competência completa em modo estrito para produção:
```bash
npm run codes:build -- --strict --input "/caminho/para/sigtap_202608" --competence "202608"
```

Para validar a integridade dos arquivos gerados:
```bash
npm run codes:validate -- --competence "202608"
```

### 3. Validações Automáticas
O pipeline de build e o validador rejeitam automaticamente conjuntos de dados que apresentarem:
- Ausência de arquivos obrigatórios ou erros de codificação Latin1.
- Contagem zerada ou suspeitamente pequena (< 500 CIDs ou < 200 procedimentos sem o flag explicito `--allow-sample-data`).
- Inconsistência entre as contagens reais dos JSONs e do manifesto.
- Mismatches nos hashes SHA-256.
- Relações órfãs (CID ou procedimento inexistente no catálogo).
- Códigos duplicados ou registros malformados.

### 4. Suíte de Testes do Projeto
Antes de publicar uma nova versão:
```bash
npm run test
npm run lint
npm run build
```

---

## Limitações e Isenção de Responsabilidade
- As relações e descrições exibidas correspondem rigorosamente aos dados oficiais disponibilizados pelo DATASUS para a competência indicada.
- Esta consulta serve de apoio técnico e clínico aos profissionais de saúde, não substituindo normativas regionais do gestor local do SUS.

