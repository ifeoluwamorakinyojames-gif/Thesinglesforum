const types={css:'text/css',js:'text/javascript',jpg:'image/jpeg',webp:'image/webp',png:'image/png',ico:'image/x-icon'};
function response(body,status=200,type='application/json',extra={}){return new Response(typeof body==='object'?JSON.stringify(body):body,{status,headers:{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'",...extra}});}
const groupLinksUpdate='growth-links-2026-10-22';
async function state(env){
 const object=await env.BUCKET.get('cms/current.json');
 if(!object)return {data:{revision:0,contentUpdates:[groupLinksUpdate,'director-2026-10-22','section-builder-v1','banner-slides-v1','activity-images-v1','activity-banner-selection-v1'],draft:structuredClone(initial),published:structuredClone(initial)},etag:null};
 const data=await object.json();
 if(!(data.contentUpdates||[]).includes('activity-banner-selection-v1')){
  await env.BUCKET.put('cms/history/'+data.revision+'-'+crypto.randomUUID()+'.json',JSON.stringify(data));
  for(const content of [data.draft,data.published])for(const activity of content.activities.items)if(activity.showOnBanner===undefined)activity.showOnBanner=false;
  data.contentUpdates=[...(data.contentUpdates||[]),'activity-banner-selection-v1'];data.revision++;
  const saved=await env.BUCKET.put('cms/current.json',JSON.stringify(data),{onlyIf:{etagMatches:object.etag}});if(!saved)return state(env);return state(env);
 }

 if(!(data.contentUpdates||[]).includes('activity-images-v1')){
  await env.BUCKET.put('cms/history/'+data.revision+'-'+crypto.randomUUID()+'.json',JSON.stringify(data));
  for(const content of [data.draft,data.published])for(const activity of content.activities.items){if(activity.image===undefined)activity.image='';if(activity.imageAlt===undefined)activity.imageAlt='';}
  data.contentUpdates=[...(data.contentUpdates||[]),'activity-images-v1'];data.revision++;
  const saved=await env.BUCKET.put('cms/current.json',JSON.stringify(data),{onlyIf:{etagMatches:object.etag}});if(!saved)return state(env);return state(env);
 }

 if(!(data.contentUpdates||[]).includes('banner-slides-v1')){
  await env.BUCKET.put('cms/history/'+data.revision+'-'+crypto.randomUUID()+'.json',JSON.stringify(data));
  for(const content of [data.draft,data.published])if(!content.bannerSlides){content.bannerSlides=structuredClone(initial.bannerSlides);content.bannerSlides[0].image=content.hero.image;}
  data.contentUpdates=[...(data.contentUpdates||[]),'banner-slides-v1'];data.revision++;
  const saved=await env.BUCKET.put('cms/current.json',JSON.stringify(data),{onlyIf:{etagMatches:object.etag}});if(!saved)return state(env);return state(env);
 }

 if(!(data.contentUpdates||[]).includes('section-builder-v1')){
  await env.BUCKET.put('cms/history/'+data.revision+'-'+crypto.randomUUID()+'.json',JSON.stringify(data));
  upgradeContent(data.draft);upgradeContent(data.published);data.contentUpdates=[...(data.contentUpdates||[]),'section-builder-v1'];data.revision++;
  const saved=await env.BUCKET.put('cms/current.json',JSON.stringify(data),{onlyIf:{etagMatches:object.etag}});if(!saved)return state(env);return state(env);
 }

 if(!(data.contentUpdates||[]).includes('director-2026-10-22')){
  await env.BUCKET.put('cms/history/'+data.revision+'-'+crypto.randomUUID()+'.json',JSON.stringify(data));
  for(const content of [data.draft,data.published])if(!content.director)content.director=structuredClone(initial.director);
  data.contentUpdates=[...(data.contentUpdates||[]),'director-2026-10-22'];data.revision++;
  const saved=await env.BUCKET.put('cms/current.json',JSON.stringify(data),{onlyIf:{etagMatches:object.etag}});
  if(!saved)return state(env);
  return state(env);
 }

 if(!(data.contentUpdates||[]).includes(groupLinksUpdate)){
  await env.BUCKET.put('cms/history/'+data.revision+'-'+crypto.randomUUID()+'.json',JSON.stringify(data));
  for(const content of [data.draft,data.published])for(const group of content.growthGroups.items){const supplied=initial.growthGroups.items.find(item=>item.title===group.title);if(['Purpose Group','Service Leadership Group','Partnership Group'].includes(group.title)&&!group.whatsappUrl)group.whatsappUrl=supplied.whatsappUrl;}
  data.contentUpdates=[...(data.contentUpdates||[]),groupLinksUpdate];data.revision++;
  const saved=await env.BUCKET.put('cms/current.json',JSON.stringify(data),{onlyIf:{etagMatches:object.etag}});
  if(!saved)return state(env);
  return {data,etag:saved.etag};
 }
 return {data,etag:object.etag};
}
async function json(request,max=4.3*1024*1024){if(!request.headers.get('content-type')?.startsWith('application/json'))throw Object.assign(Error('JSON required'),{status:415});const reader=request.body?.getReader();let size=0,parts=[];if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw Object.assign(Error('Request too large'),{status:413});}parts.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw Object.assign(Error('Invalid JSON'),{status:400});}}
export default {async fetch(request,env){try{const url=new URL(request.url),path=url.pathname;const email=request.headers.get('oai-authenticated-user-email');const authorised=!!env.ADMIN_EMAIL&&!!request.headers.get('oai-authenticated-user-id')&&email?.toLowerCase()===env.ADMIN_EMAIL.toLowerCase();
if(request.method==='POST'&&request.headers.get('origin')!==url.origin)return response({error:'Request origin is not allowed.'},403);
if(path==='/admin'||path==='/preview'||path.startsWith('/api/admin/')){if(!authorised){if(path==='/admin'&&!email)return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2Fadmin',302);return response(path==='/admin'?'Sign in with the authorised administrator ChatGPT account.':{error:'Administrator access required.'},403,path==='/admin'?'text/plain':'application/json');}
if(path==='/admin')return response(adminPage,200,'text/html',{'X-Robots-Tag':'noindex'});
if(path==='/preview')return response(page((await state(env)).data.draft,{preview:true}),200,'text/html',{'X-Robots-Tag':'noindex'});
if(path==='/api/admin/media'&&request.method==='GET'){const cursor=url.searchParams.get('cursor');if(cursor&&cursor.length>2000)return response({error:'Invalid page'},400);const result=await env.BUCKET.list({prefix:'media/',limit:50,...(cursor?{cursor}:{})});return response({items:result.objects.map(item=>({path:'/'+item.key})),cursor:result.truncated?result.cursor:null});}
if(path==='/api/admin/content'&&request.method==='GET')return response((await state(env)).data);
if(path==='/api/admin/content'&&request.method==='POST'){const body=await json(request);if(!Number.isSafeInteger(body.revision)||typeof body.publish!=='boolean')return response({error:'Invalid revision or publish flag'},400);try{validate(body.content);}catch(error){return response({error:error.message},400);}const current=await state(env);if(current.data.revision!==body.revision)return response({error:'Content changed in another session. Reload before saving.'},409);await env.BUCKET.put('cms/history/'+current.data.revision+'-'+crypto.randomUUID()+'.json',JSON.stringify(current.data));const next={revision:current.data.revision+1,contentUpdates:current.data.contentUpdates,draft:body.content,published:body.publish?body.content:current.data.published};const saved=await env.BUCKET.put('cms/current.json',JSON.stringify(next),{onlyIf:current.etag?{etagMatches:current.etag}:{etagDoesNotMatch:'*'}});if(!saved)return response({error:'Content changed in another session. Reload before saving.'},409);return response({revision:next.revision});}
if(path==='/api/admin/media'&&request.method==='POST'){const data=await json(request);const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[data.type];if(!ext||typeof data.data!=='string')return response({error:'JPEG, PNG and WebP only.'},400);let bytes;try{bytes=Uint8Array.from(atob(data.data),x=>x.charCodeAt(0));}catch{return response({error:'Invalid image'},400);}const ascii=(a,b)=>String.fromCharCode(...bytes.slice(a,b));const valid=ext==='jpg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:ext==='png'?[137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x):ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';if(!valid||bytes.length>3*1024*1024)return response({error:'Invalid image or size over 3 MB.'},400);const name=crypto.randomUUID()+'.'+ext;await env.BUCKET.put('media/'+name,bytes,{httpMetadata:{contentType:data.type}});return response({path:'/media/'+name},201);}
return response({error:'Method not allowed'},405);}
if(!['GET','HEAD'].includes(request.method))return response({error:'Method not allowed'},405);
if(path==='/robots.txt')return response('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /preview\nSitemap: '+url.origin+'/sitemap.xml\n',200,'text/plain');
if(path==='/sitemap.xml')return response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+url.origin+'/</loc></url><url><loc>'+url.origin+'/privacy</loc></url></urlset>',200,'application/xml');
if(path==='/'||path==='/privacy')return response(page((await state(env)).data.published,{privacy:path==='/privacy'}),200,'text/html');
if(path.startsWith('/media/')){if(!/^\/media\/[a-z0-9-]+\.(jpg|png|webp)$/.test(path))return response('Not found',404,'text/plain');const obj=await env.BUCKET.get(path.slice(1));if(!obj)return response('Not found',404,'text/plain');return new Response(request.method==='HEAD'?null:obj.body,{headers:{'Content-Type':obj.httpMetadata.contentType,'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=3600'}});}
if(assets[path])return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(assets[path]),x=>x.charCodeAt(0)),{headers:{'Content-Type':types[path.split('.').pop()]||'application/octet-stream','Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff'}});
return response('Not found',404,'text/plain');}catch(error){console.error('Request failed',error.message);return response({error:error.status?error.message:'The server could not complete this request.'},error.status||500);}}};
