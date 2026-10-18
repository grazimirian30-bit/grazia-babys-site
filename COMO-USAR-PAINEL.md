# Painel administrativo da Grazia Babys

Acesse **https://graziababys.com.br/admin.html** (depois que o GitHub Pages publicar a atualização).

Este é um site estático no GitHub Pages: não existe senha administrativa guardada no repositório. As alterações são autorizadas pela API do GitHub por meio de um **token pessoal com permissões restritas**.

## Primeiro acesso

1. Entre na conta GitHub que é dona do repositório \`grazimirian30-bit/grazia-babys-site\`.
2. Abra https://github.com/settings/personal-access-tokens/new e crie um token *Fine-grained personal access token*.
3. Em *Resource owner*, escolha \`grazimirian30-bit\`.
4. Em *Repository access*, escolha *Only select repositories* e selecione **grazia-babys-site**.
5. Em *Repository permissions*, defina **Contents: Read and write**. Não conceda outras permissões desnecessárias.
6. Defina uma data de validade curta ou adequada ao seu uso; quando o token expirar, crie outro.
7. Cole o token no painel e clique em **Entrar no painel**.

**Segurança:** o token só fica na memória da aba enquanto você está usando o painel. Não o envie por WhatsApp, prints ou chat, nem coloque o token no código, no repositório ou em capturas de tela. Use apenas o endereço certo do seu domínio.

## Gerenciar peças

- Clique em **Esgotado** para bloquear a consulta de uma roupa vendida na vitrine; clique **Repor** para reativar.
- Clique em **Editar** para mudar nome, descrição, tamanho, cor, preço, preço promocional, estoque e categoria.
- **Ocultar** remove a roupa da vitrine sem apagar seus dados; **Mostrar** faz ela reaparecer.
- **Nova peça** cadastra outra roupa. Ao escolher uma imagem JPG, PNG ou WebP de até 2 MB, ela será adicionada ao próprio repositório quando publicar.
- Após as edições, clique em **Publicar alterações**. Isso cria commits no GitHub (arquivo \`catalogo.json\` e fotos novas) e o site é atualizado pelo GitHub Pages.

**Importante:** o status de esgotado usa uma marcação explícita, e não simplesmente o campo \`estoque=0\`: muitas peças legadas do catálogo estavam com estoque numérico zero antes desta atualização. A nova marcação evita tornar vários itens esgotados sem revisão.

O endereço \`/admin.html\` mostra uma tela de autenticação para visitantes, mas só a conta GitHub dona do repositório, com token autorizado, consegue abrir o painel e fazer alterações. Não há senha ou token gravado no HTML do site.
