import {mkdir,writeFile,access} from 'node:fs/promises';
import {initial,validate} from '../src/content.mjs';
import {page} from '../src/render.mjs';
validate(initial);for(const path of ['/logo.jpg','/hero.webp','/bible.webp','/study.webp','/speaker.webp','/prayer.webp','/skills.webp','/worship.webp'])await access(new URL('../public'+path,import.meta.url));await mkdir(new URL('../dist',import.meta.url),{recursive:true});await writeFile(new URL('../dist/index.html',import.meta.url),page(initial));console.log('Validated content and assets; generated homepage snapshot. Runtime: npm start.');
