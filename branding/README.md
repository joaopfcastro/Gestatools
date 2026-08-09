# Kit de Identidade Visual Oficial do GestaTools

![Prévia oficial do kit de identidade do GestaTools](./previews/preview-kit-identidade.png)

Todos os arquivos deste pacote são os **assets oficiais, finais e aprovados do GestaTools**.

## Diretrizes de Uso e Preservação

- **Aprovação prévia**: Os arquivos contidos neste kit foram fornecidos e aprovados previamente.
- **Proibição de alteração**: Não devem ser regenerados por inteligência artificial, scripts ou ferramentas automatizadas.
- **Proibição de reprocessamento**: Não devem ser redimensionados, recortados, recomprimidos ou reexportados.
- **Alterações e hashes**: Qualquer alteração na identidade exige o envio de um novo pacote aprovado e a atualização explícita do arquivo `approved-assets.sha256`.
- **Imagem Mestre**: `branding/source/gestatools-icon-master.png` é mantida arquivada como fonte oficial e não é servida em runtime.
- **Produção**: Os arquivos mantidos sob `public/` constituem os assets servidos em produção para PWA, favicons, iOS, Android, Microsoft Tile e Open Graph.

## Estrutura Principal

- `branding/source/gestatools-icon-master.png`: Imagem mestre preservada.
- `branding/previews/preview-kit-identidade.png`: Folha de visualização do kit.
- `public/favicon.ico`: Favicon multirresolução (16, 32, 48px).
- `public/favicon-16x16.png`, `32x32`, `48x48`: Favicons PNG otimizados.
- `public/apple-touch-icon.png`: Ícone principal para iOS/iPadOS (180px).
- `public/android-chrome-192x192.png`, `512x512`: Aliases Android.
- `public/icons/gestatools-v2/`: Ícones do aplicativo e PWA (64px até 1024px).
- `public/icons/gestatools-v2/maskable-*.png`: Arquivos específicos para `purpose="maskable"`.
- `public/social/gestatools-og-1200x630.png`: Imagem oficial Open Graph / WhatsApp / Twitter Card.
- `public/browserconfig.xml`: Configuração para Microsoft Tile (150px).
