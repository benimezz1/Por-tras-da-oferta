/* Cliente da conta C4: dados ficticios de jogo, consentimento exposto no login.
 * O token aleatorio vive somente na aba; nenhuma senha e persistida/exportada. */
(function(root){
 "use strict";
 const SESSION_KEY="pto-c4-game-session-v1";
 const rawBase=document.querySelector('meta[name="c4-mcp-origin"]')?.getAttribute('content')||"";
 // Ajuste VITE_C4_MCP_ORIGIN no deploy quando o MCP usa outro dominio.
 const fallback="https://mcp.portrasdaoferta.workers.dev";
 const allowed=/^https:\/\/[^/]+\/?$/.test(rawBase)||/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/?$/.test(rawBase);
 const base=allowed?rawBase.replace(/\/$/,""):fallback;
 const endpoint=path=>base+"/api/c4/client/"+path;
 let active=null;
 function readSaved(){
  try{
   const doc=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
   if(!doc||typeof doc.token!=="string"||!doc.usuario?.id||
       !/^[a-zA-Z0-9_-]{20,}$/.test(doc.token)||
       Date.parse(doc.expiresEm||"")<=Date.now())return null;
   return doc;
  }catch{return null;}
 }
 active=readSaved();
 function clear(){active=null;try{sessionStorage.removeItem(SESSION_KEY);}catch{}}
 function store(value){
  if(!value?.token||!value?.usuario?.id||!value?.usuario?.username)
   throw Error("Resposta de login inválida do servidor.");
  active={token:value.token,usuario:value.usuario,expiresEm:value.expiresEm};
  sessionStorage.setItem(SESSION_KEY,JSON.stringify(active));
  return active.usuario;
 }
 function account(){return active?.usuario||null;}
 async function call(path,data,authenticated=false){
  const headers={"Accept":"application/json"};
  if(data!==undefined)headers["Content-Type"]="application/json";
  if(authenticated){
   if(!active?.token)throw Error("Sua sessão expirou. Entre novamente para enviar o percurso.");
   headers.Authorization="Bearer "+active.token;
  }
  const options={method:data===undefined?"GET":"POST",headers,credentials:"omit",
    mode:"cors",cache:"no-store"};
  if(data!==undefined)options.body=JSON.stringify(data);
  const controller=new AbortController();
  options.signal=controller.signal;
  const timer=setTimeout(()=>controller.abort(),12000);
  let response;
  try{response=await fetch(endpoint(path),options);}
  catch{throw Error("Não foi possível conectar ao MCP. Confira sua internet e a configuração do servidor.");}
  finally{clearTimeout(timer);}
  let result;
  try{
   if(!response.headers.get("content-type")?.includes("application/json"))
    throw Error("Tipo de resposta inesperado");
   result=await response.json();
  }catch{throw Error("O servidor MCP não retornou uma resposta JSON válida.");}
  if(!response.ok){
   if(authenticated&&response.status===401)clear();
   throw Error(result?.erro||("Falha de comunicação com MCP ("+response.status+")."));
  }
  return result;
 }
 async function login(username,password,kind="login"){
  if(!/^[a-zA-Z0-9_.-]{3,24}$/.test(username))
   throw Error("Use um apelido de 3 a 24 caracteres, sem espaços.");
  if(typeof password!=="string"||password.length<10||password.length>128)
   throw Error("A senha precisa ter de 10 a 128 caracteres.");
  const result=await call(kind==="signup"?"signup":"login",{username,password});
  return store(result);
 }
 async function validate(){
  if(!active)return null;
  try{
   const result=await call("me",undefined,true);
   if(result?.usuario?.id!==active?.usuario?.id){clear();return null;}
   return active.usuario;
  }catch(e){if(!active)return null;throw e;}
 }
 async function complete(payload){return call("complete",payload,true);}
 async function logout(){
  const credential=active?.token;
  clear();
  if(credential){
   try{
    await fetch(endpoint("logout"),{method:"POST",mode:"cors",credentials:"omit",keepalive:true,
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+credential},body:"{}"});
   }catch{}
  }
 }
 root.PorTrasContaC4=Object.freeze({login,validate,complete,logout,account,clear,base});
})(typeof window!=="undefined"?window:globalThis);
