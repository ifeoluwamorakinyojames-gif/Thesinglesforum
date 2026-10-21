import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {initial,validate} from './content.mjs';
export function createStore(dir){
 const file=join(dir,'content.json');let queue=Promise.resolve();
 async function read(){try{const state=JSON.parse(await readFile(file,'utf8'));for(const content of [state.published,state.draft]){content.growthGroups?.items?.forEach((group,i)=>{if(group.whatsappUrl===undefined)group.whatsappUrl=initial.growthGroups.items[i]?.whatsappUrl||'';});}validate(state.published);validate(state.draft);return state;}catch(e){if(e.code!=='ENOENT')throw e;return {revision:0,published:structuredClone(initial),draft:structuredClone(initial)};}}
 async function save(content,revision,publish=false){const op=queue.then(async()=>{const current=await read();if(revision!==current.revision){const e=Error('Content changed in another session. Reload before saving.');e.status=409;throw e;}validate(content);await mkdir(join(dir,'history'),{recursive:true});await writeFile(join(dir,'history',`${current.revision}-${randomUUID()}.json`),JSON.stringify(current));const state={revision:current.revision+1,published:publish?content:current.published,draft:content};const tmp=join(dir,`.content-${randomUUID()}.tmp`);await writeFile(tmp,JSON.stringify(state),{mode:0o600});await rename(tmp,file);return state;});queue=op.catch(()=>{});return op;}
 return {read,save};
}
