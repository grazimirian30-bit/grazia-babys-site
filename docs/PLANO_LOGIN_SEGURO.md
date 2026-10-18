# Login administrativo seguro — Grazia Babys

## Estado atual
- A vitrine é estática (GitHub Pages).
- O painel `admin.html` usa um token pessoal do GitHub no navegador para editar `catalogo.json`.
- Não inserir senha, token GitHub, service_role ou chave privada em HTML/JavaScript público.

## Arquitetura proposta
1. Supabase Auth: login por e-mail/senha, recuperação de senha e sessão.
2. Backend/Edge Function autenticado: validar JWT no servidor e verificar se o usuário pertence à lista de administradores (por UUID, mantida no servidor).
3. Backend realiza operações de leitura/escrita autorizadas no GitHub usando token de escopo mínimo armazenado exclusivamente como segredo no servidor.
4. Restringir métodos, caminhos permitidos (`catalogo.json` e `imagens/produtos/`), tamanho/tipo de imagens, validar catálogo e limitar requisições.
5. Não aceitar owner/repo/path arbitrários enviados pelo navegador. Proteger contra conflitos de SHA.
6. Manter a vitrine pública e o catálogo atual; só substituir o fluxo de autenticação e publicação do painel depois de testar em ambiente separado.

## Dependências para ativação
- Identificar projeto Supabase que será usado e configurar URL/chave pública.
- Configurar administrador no Supabase Auth, com e-mail verificado e MFA recomendado.
- Configurar segredo de GitHub no backend com acesso apenas a `grazia-babys-site` e permissão Contents read/write.
- Definir URL do backend, CORS restrito ao domínio oficial e políticas de acesso.
- Testar login válido/inválido, logout, recuperação, acesso não administrador, publicação e falhas de rede.

## Implantação segura
Não publicar alteração no painel principal até que backend e autenticação estejam prontos e testados. Nunca enviar senhas ou tokens pelo chat.
