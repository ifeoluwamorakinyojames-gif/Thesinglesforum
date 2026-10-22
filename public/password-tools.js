const encodeSecret = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export async function generateAdminSecrets(password) {
 if(typeof password!=='string'||password.length<16||password.length>256)throw Error('Choose a password between 16 and 256 characters.');
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const hash=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256);
 return {hash:'pbkdf2-sha256:100000:'+encodeSecret(salt)+':'+encodeSecret(hash),session:encodeSecret(crypto.getRandomValues(new Uint8Array(32)))};
}
if(typeof document!=='undefined'){
 const form=document.querySelector('form'),status=document.querySelector('#status'),output=document.querySelector('#output'),password=document.querySelector('#password'),confirm=document.querySelector('#confirm');
 form.addEventListener('submit',async event=>{
  event.preventDefault();output.hidden=true;document.querySelector('#hash').value='';document.querySelector('#session').value='';
  if(!isSecureContext||!crypto.subtle){status.textContent='Open this page over HTTPS in Chrome.';return;}
  if(password.value!==confirm.value){status.textContent='The two passwords must match.';return;}
  const button=form.querySelector('button');button.disabled=true;status.textContent='Generating on your phone…';
  try{const values=await generateAdminSecrets(password.value);document.querySelector('#hash').value=values.hash;document.querySelector('#session').value=values.session;password.value='';confirm.value='';output.hidden=false;status.textContent='Ready. Your password has not been sent or saved. Add both values to Cloudflare as runtime Secrets.';}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
 for(const button of document.querySelectorAll('[data-copy]'))button.addEventListener('click',async()=>{const field=document.getElementById(button.dataset.copy);try{await navigator.clipboard.writeText(field.value);status.textContent='Copied '+button.dataset.copy+'. Paste it into the matching Cloudflare Secret.';}catch{field.focus();field.select();status.textContent='Long-press the selected value and choose Copy.';}});
 document.querySelector('#clear').addEventListener('click',()=>{password.value='';confirm.value='';document.querySelector('#hash').value='';document.querySelector('#session').value='';output.hidden=true;status.textContent='Values cleared. Any copied value may remain in your clipboard.';});
}
