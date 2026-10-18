"use strict";
(function(){
  const OWNER="grazimirian30-bit";
  const REPO="grazia-babys-site";
  const BRANCH="main";
  const API="https://api.github.com";
  const REMOTE_IMAGES="https://grazimirian.pythonanywhere.com/static/";
  let token=null, doc=null, sha=null, changed=false, products=[], uploads=new Map(), busy=false;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const reais=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const number=v=>Number.isFinite(Number(v))?Number(v):0;
  const clone=v=>JSON.parse(JSON.stringify(v));
  function photo(path){
    const s=String(path||"");
    if(/^https:\/\//i.test(s))return s;
    if(/^imagens\//i.test(s)||/^\.?\//.test(s))return new URL(s,location.href).href;
    if(/^(uploads\/|img\/)/i.test(s))return REMOTE_IMAGES+s;
    if(/^[a-z0-9_.\/-]+$/i.test(s))return REMOTE_IMAGES+s;
    return "";
  }
  function toBase64(text){const bytes=new TextEncoder().encode(text);let str="";for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(str)}
  function fromBase64(text){const raw=atob(String(text||"").replace(/\s/g,""));return new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0)))}
  function showMessage(message,error=false){const el=$("message");el.textContent=message;el.classList.toggle("error",error);el.hidden=false}
  function setBusy(value){busy=value;for(const id of ["loginBtn","saveBtn","saveBottomBtn","addBtn","reloadBtn"])$(id).disabled=value||(id.startsWith("save")&&!changed)}
  function markDirty(){changed=true;$("dirtyNotice").hidden=false;$("lastSync").textContent="Alterações pendentes de publicação.";for(const id of ["saveBtn","saveBottomBtn"])$(id).disabled=busy}
  function clean(){changed=false;uploads.clear();$("dirtyNotice").hidden=true;$("lastSync").textContent="Catálogo sincronizado com o GitHub.";for(const id of ["saveBtn","saveBottomBtn"])$(id).disabled=true}
  function loginInfo(message,error=false){const el=$("loginMessage");el.textContent=message;el.classList.toggle("error",error);el.hidden=!message}
  async function request(method,path,body){
    if(!token)throw new Error("É necessário entrar novamente.");
    let response;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      response=await fetch(API+path,{method,headers:{"Authorization":"Bearer "+token,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store",referrerPolicy:"no-referrer",signal:controller.signal});
    }catch(err){
      if(err.name==="AbortError")throw new Error("A conexão com o GitHub demorou demais. Abra o painel no Chrome e confira a internet.");
      throw new Error("Não foi possível acessar a API do GitHub. Verifique sua conexão e tente abrir o painel no Chrome ou outro navegador.");
    }finally{clearTimeout(timeout)}
    let data={};try{data=await response.json()}catch(e){}
    if(!response.ok){
      const msg=response.status===401?"O GitHub rejeitou esse token: ele pode estar incompleto, inválido ou expirado.":response.status===403?"O GitHub recusou o acesso. Verifique se o token está ativo e tem Contents: Read and write para o repositório grazia-babys-site.":response.status===404?"O GitHub não encontrou esse recurso para o token. Selecione o repositório grazia-babys-site nas configurações do token.":response.status===409||response.status===422?"Conflito de atualização. Atualize o catálogo antes de publicar de novo.":(data.message||"Falha ao comunicar com o GitHub.");
      throw new Error(msg+" (HTTP "+response.status+")");
    }
    return data;
  }
  const contentPath=path=>"/repos/"+OWNER+"/"+REPO+"/contents/"+path.split("/").map(encodeURIComponent).join("/");
  async function loadCatalog(){
    const result=await request("GET",contentPath("catalogo.json")+"?ref="+BRANCH);
    if(result.encoding!=="base64"||!result.sha)throw new Error("O formato do catálogo no GitHub é inesperado.");
    const parsed=JSON.parse(fromBase64(result.content));
    if(!Array.isArray(parsed.produtos))throw new Error("O catálogo não contém uma lista de produtos.");
    doc=parsed;sha=result.sha;products=clone(parsed.produtos);clean();render();
  }
  function status(p){return p.esgotado===true?"sold":p.oculto===true?"hidden":"available"}
  function render(){
    $("statTotal").textContent=products.length;
    $("statSold").textContent=products.filter(p=>p.esgotado===true).length;
    $("statHidden").textContent=products.filter(p=>p.oculto===true).length;
    $("statActive").textContent=products.filter(p=>p.esgotado!==true&&p.oculto!==true).length;
    const q=$("search").value.trim().toLocaleLowerCase("pt-BR"),filter=$("filter").value;
    const filtered=products.filter(p=>{
      const s=[p.nome,p.descricao,p.categoria,p.cor,p.tamanho].join(" ").toLocaleLowerCase("pt-BR");
      return (!q||s.includes(q))&&(filter==="all"||status(p)===filter||(filter==="hidden"&&p.oculto===true));
    });
    const root=$("products");
    root.innerHTML=filtered.length?filtered.map(p=>{
      const sold=p.esgotado===true,hidden=p.oculto===true;
      return '<article class="product-row '+(sold?'sold ':'')+(hidden?'hidden-product':'')+'">'
        +'<div class="thumb">'+(photo(p.imagem_principal)?'<img src="'+esc(photo(p.imagem_principal))+'" alt="" loading="lazy">':'🧸')+'</div>'
        +'<div class="product-info"><h3>'+esc(p.nome||"Peça sem nome")+'</h3>'
        +'<p>'+esc(p.categoria||"Sem categoria")+' · '+esc(p.tamanho||"Tam. a confirmar")+'</p>'
        +'<div class="price">'+reais(p.preco_promocional>0?p.preco_promocional:p.preco)+'</div>'
        +'<div class="pills"><span class="pill '+(sold?'bad':'ok')+'">'+(sold?'Esgotado':'Disponível')+'</span>'
        +(hidden?'<span class="pill gray">Oculto</span>':'')
        +(p.destaque?'<span class="pill">Destaque</span>':'')
        +'</div><div class="product-actions">'
        +'<button type="button" class="ghost" data-action="edit" data-id="'+esc(p.id)+'">Editar</button>'
        +'<button type="button" class="ghost '+(sold?'restore-action':'sold-action')+'" data-action="sold" data-id="'+esc(p.id)+'">'+(sold?'↶ Repor':'✕ Esgotado')+'</button>'
        +'<button type="button" class="ghost" data-action="hide" data-id="'+esc(p.id)+'">'+(hidden?'Mostrar':'Ocultar')+'</button>'
        +'<button type="button" class="ghost" data-action="delete" data-id="'+esc(p.id)+'">Excluir</button>'
        +'</div></div></article>';
    }).join(""):'<p class="empty">Nenhum produto encontrado com estes filtros.</p>';
  }
  function getProduct(id){return products.find(p=>String(p.id)===String(id))}
  function toggleSold(p){if(!p)return;p.esgotado=p.esgotado!==true;if(p.esgotado){p.estoque=0}else if(number(p.estoque)<=0){p.estoque=1}markDirty();render()}
  function toggleHidden(p){if(!p)return;p.oculto=p.oculto!==true;markDirty();render()}
  function deleteProduct(p){
    if(!p||busy)return;
    if(!confirm("Excluir a mercadoria \""+String(p.nome||"sem nome")+"\" do catálogo? A exclusão será publicada apenas quando você clicar em Publicar alterações."))return;
    products=products.filter(item=>String(item.id)!==String(p.id));
    uploads.delete(String(p.id));
    markDirty();render();
    showMessage("Mercadoria removida da lista. Clique em Publicar alterações para confirmar no site.");
  }
  function setForm(p){
    $("editId").value=p?String(p.id):"";
    $("formTitle").textContent=p?"Editar produto":"Cadastrar nova peça";
    $("fName").value=p?.nome||"";$("fPrice").value=p?.preco??"";
    $("fPromo").value=p?.preco_promocional??"";
    $("fCategory").value=p?.categoria||"Outros";
    $("fSize").value=p?.tamanho||"";$("fColor").value=p?.cor||"";
    $("fQty").value=p?.estoque??1;
    $("fDescription").value=p?.descricao||"";
    $("fImage").value=p?.imagem_principal||"";
    $("fFile").value="";
    $("fSold").checked=p?.esgotado===true;
    $("fHidden").checked=p?.oculto===true;
    $("fFeatured").checked=!!p?.destaque;
    $("editorDialog").showModal();
  }
  function closeEditor(){$("editorDialog").close()}
  function applyForm(event){
    event.preventDefault();
    const oldId=$("editId").value;
    const isNew=!oldId;
    const p=isNew?{id:Math.max(0,...products.map(x=>number(x.id)))+1}:getProduct(oldId);
    if(!p)return;
    const name=$("fName").value.trim();
    const price=Number($("fPrice").value),promo=$("fPromo").value===""?null:Number($("fPromo").value);
    if(!name||!Number.isFinite(price)||price<0||promo!==null&&(!Number.isFinite(promo)||promo<0)){showMessage("Confira o nome e os valores do produto.",true);return}
    const file=$("fFile").files[0];
    if(file&&(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>2*1024*1024)){showMessage("A foto deve ser JPG, PNG ou WebP e ter até 2 MB.",true);return}
    p.nome=name;p.preco=price;p.preco_promocional=promo;
    p.categoria=$("fCategory").value;
    p.tamanho=$("fSize").value.trim();
    p.cor=$("fColor").value.trim();
    p.descricao=$("fDescription").value.trim();
    p.imagem_principal=$("fImage").value.trim();
    p.esgotado=$("fSold").checked;p.oculto=$("fHidden").checked;p.destaque=$("fFeatured").checked?1:0;
    p.estoque=Math.max(0,Math.floor(number($("fQty").value)));
    if(p.esgotado)p.estoque=0;
    if(!p.esgotado&&p.estoque===0)p.estoque=1;
    if(isNew){p.slug="peca-"+p.id;p.promocao=0;products.unshift(p)}
    if(file)uploads.set(String(p.id),file);
    markDirty();closeEditor();render();showMessage("Produto atualizado na tela. Use Publicar alterações para atualizar o site.");
  }
  async function uploadPhotos(){
    for(const [id,file] of uploads.entries()){
      const p=getProduct(id);if(!p)continue;
      const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
      const filename="imagens/produtos/"+p.id+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(new Error("Não foi possível ler a foto."));reader.readAsDataURL(file)});
      await request("PUT",contentPath(filename),{message:"foto: atualizar produto "+p.id+" Grazia Babys",content:data,branch:BRANCH});
      p.imagem_principal=filename;
    }
  }
  async function save(){
    if(!changed||busy)return;
    setBusy(true);
    showMessage("Publicando suas alterações no GitHub…");
    try{
      await uploadPhotos();
      const next=clone(doc);next.produtos=products;
      const response=await request("PUT",contentPath("catalogo.json"),{message:"catalogo: atualizar estoque e produtos pelo painel Grazia Babys",content:toBase64(JSON.stringify(next,null,2)+"\n"),sha,branch:BRANCH});
      if(!response.content?.sha)throw new Error("O GitHub não confirmou a atualização.");
      doc=next;sha=response.content.sha;clean();render();
      showMessage("✅ Catálogo salvo no GitHub! O site público será atualizado após a publicação do GitHub Pages.");
    }catch(error){showMessage(error.message||"Não foi possível salvar. Nenhuma alteração foi descartada da tela.",true)}
    finally{setBusy(false)}
  }
  async function enter(event){
    event.preventDefault();if(busy)return;
    const candidate=$("token").value.trim().replace(/^Bearer\s+/i,"");
    if(!candidate){return}
    token=candidate;setBusy(true);
    loginInfo("Verificando seu token com o GitHub…");
    try{
      const user=await request("GET","/user");
      if(String(user.login||"").toLowerCase()!==OWNER.toLowerCase())throw new Error("Este token pertence à conta "+String(user.login||"desconhecida")+". O catálogo pertence à conta "+OWNER+". Gere o token estando conectada à conta correta.");
      loginInfo("Conta confirmada: "+OWNER+". Conferindo a permissão de edição do catálogo…");
      const repository=await request("GET","/repos/"+OWNER+"/"+REPO);
      if(repository.permissions?.push===false)throw new Error("A conta foi identificada, mas esse token está sem permissão de escrita. Edite o token e libere Repository permissions → Contents → Read and write, somente para grazia-babys-site.");
      await loadCatalog();
      $("token").value="";loginInfo("");
      $("loginArea").hidden=true;$("dashboard").hidden=false;$("logoutBtn").hidden=false;
      showMessage("Bem-vinda! Edite as peças e publique no GitHub quando estiver pronta.");
    }catch(error){token=null;loginInfo(error.message||"Não foi possível entrar. Confira a configuração do token.",true)}
    finally{setBusy(false)}
  }
  function exit(){
    if(changed&&!confirm("Existem alterações não publicadas. Deseja sair mesmo assim?"))return;
    token=null;doc=null;sha=null;products=[];uploads.clear();clean();
    $("loginArea").hidden=false;$("dashboard").hidden=true;$("logoutBtn").hidden=true;$("message").hidden=true;
  }
  async function reload(){
    if(changed&&!confirm("Descartar suas alterações não publicadas e recarregar o catálogo do GitHub?"))return;
    setBusy(true);
    try{await loadCatalog();showMessage("Catálogo atualizado com a versão mais recente do GitHub.")}
    catch(err){showMessage(err.message,true)}
    finally{setBusy(false)}
  }
  $("loginForm").addEventListener("submit",enter);
  $("showToken").addEventListener("click",()=>{$("token").type=$("token").type==="password"?"text":"password"});
  $("logoutBtn").addEventListener("click",exit);
  $("saveBtn").addEventListener("click",save);
  $("saveBottomBtn").addEventListener("click",save);
  $("reloadBtn").addEventListener("click",reload);
  $("search").addEventListener("input",render);
  $("filter").addEventListener("change",render);
  $("addBtn").addEventListener("click",()=>setForm(null));
  $("products").addEventListener("click",e=>{
    const button=e.target.closest("button[data-action]");if(!button)return;
    const p=getProduct(button.dataset.id);
    if(button.dataset.action==="edit")setForm(p);
    if(button.dataset.action==="sold")toggleSold(p);
    if(button.dataset.action==="hide")toggleHidden(p);
    if(button.dataset.action==="delete")deleteProduct(p);
  });
  $("productForm").addEventListener("submit",applyForm);
  $("closeModalBtn").addEventListener("click",closeEditor);
  $("cancelModalBtn").addEventListener("click",closeEditor);
  window.addEventListener("beforeunload",e=>{if(changed){e.preventDefault();e.returnValue=""}});
  window.__graziaAdminReady=true;
})();