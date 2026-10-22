import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
const assets={};for(const name of (await readdir('public')).sort()){const data=await readFile('public/'+name);assets['/'+name]=data.toString('base64');}
Object.assign(assets,JSON.parse(await readFile('worker/favicon-assets.json','utf8')));
assets['/admin.js']=(await readFile('worker/admin.js')).toString('base64');
const content=(await readFile('src/content.mjs','utf8')).replaceAll('export ','');
const topics=(await readFile('worker/youtube-topics.mjs','utf8')).replace('export ','');
const render=(await readFile('src/render.mjs','utf8')).replace("import {escape as e} from './content.mjs';","const e=escape;").replace("import {youtubeTopics} from '../worker/youtube-topics.mjs';",'').replaceAll('export ','');
const admin=(await readFile('worker/admin.mjs','utf8')).replaceAll('export ','');
const standaloneAuth=(await readFile('worker/standalone-auth.mjs','utf8'));
const runtime=await readFile('worker/runtime.js','utf8');
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',[content,topics,render,admin,standaloneAuth,'const assets='+JSON.stringify(assets)+';',runtime].join('\n'));
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log('Built hosted editor and homepage.');
