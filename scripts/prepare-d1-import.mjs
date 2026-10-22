// Generate an offline SQL import; never commits content or writes to a live database.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
if(!args.includes('--directory')||!args.includes('--output'))throw Error('Use --directory <backup> --output <private-file.sql>');
const directory=resolve(option('--directory')),output=resolve(option('--output'));
const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const sql=[await readFile('migrations/0001_storage.sql','utf8'),
 // Deliberately fail if any existing content is present; never overwrite a used database.
 'CREATE TABLE tsf_import_guard (empty INTEGER CHECK(empty=0));',
 'INSERT INTO tsf_import_guard SELECT COUNT(*) FROM tsf_objects;'];
for(const object of [...manifest.objects].sort((a,b)=>Number(a.key==='cms/current.json')-Number(b.key==='cms/current.json'))){
 if(!/^(?:media\/[a-z0-9-]+\.(jpg|png|webp)|cms\/current\.json|cms\/history\/[a-zA-Z0-9_.-]+\.json)$/.test(object.key))throw Error('Invalid backup key');
 const bytes=await readFile(join(directory,object.key));
 if(createHash('sha256').update(bytes).digest('hex')!==object.sha256)throw Error('Backup checksum mismatch');
 const etag=object.sha256,type=object.key.startsWith('cms/')?'application/json':object.contentType;
 sql.push(`INSERT INTO tsf_objects VALUES(${quote(object.key)},${quote(etag)},${bytes.length},${quote(type||'application/octet-stream')});`);
 for(let offset=0,part=0;offset<bytes.length;offset+=32768,part++)sql.push(`INSERT INTO tsf_chunks VALUES(${quote(object.key)},${quote(etag)},${part},X'${bytes.subarray(offset,offset+32768).toString('hex')}');`);
}
sql.push('DROP TABLE tsf_import_guard;');
await writeFile(output,sql.join('\n'),{flag:'wx',mode:0o600});
console.log('Verified '+manifest.objects.length+' objects; created private SQL import. No remote changes made.');
