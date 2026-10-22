// D1 object adapter. Each write and compare-and-swap is one SQL transaction.
export function d1Storage(db) {
 const stmt=(sql,...args)=>db.prepare(sql).bind(...args);
 return {
  async get(key) {
   const {results}=await stmt(`SELECT o.etag,o.size,o.content_type,c.data FROM tsf_objects o LEFT JOIN tsf_chunks c ON c.object_key=o.key AND c.etag=o.etag WHERE o.key=? ORDER BY c.part`,key).all();
   if(!results.length)return null;
   const row=results[0], bytes=new Uint8Array(row.size);let offset=0;
   for(const chunk of results){if(chunk.data){const data=new Uint8Array(chunk.data);bytes.set(data,offset);offset+=data.length;}}
   if(offset!==row.size)throw Error('Incomplete stored object');
   return {key,etag:row.etag,size:row.size,httpMetadata:{contentType:row.content_type},body:bytes,json:async()=>JSON.parse(new TextDecoder().decode(bytes))};
  },
  async put(key,value,options={}) {
   const bytes=typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value);
   if(bytes.length>5*1024*1024)throw Error('Stored object exceeds 5 MB');
   const etag=crypto.randomUUID(),type=options.httpMetadata?.contentType||'application/json';
   const condition=options.onlyIf;
   let write;
   if(condition?.etagMatches)write=stmt('UPDATE tsf_objects SET etag=?,size=?,content_type=? WHERE key=? AND etag=?',etag,bytes.length,type,key,condition.etagMatches);
   else if(condition?.etagDoesNotMatch==='*')write=stmt('INSERT OR IGNORE INTO tsf_objects(key,etag,size,content_type) VALUES(?,?,?,?)',key,etag,bytes.length,type);
   else write=stmt('INSERT INTO tsf_objects(key,etag,size,content_type) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET etag=excluded.etag,size=excluded.size,content_type=excluded.content_type',key,etag,bytes.length,type);
   const commands=[write];
   commands.push(stmt('DELETE FROM tsf_chunks WHERE object_key=? AND EXISTS(SELECT 1 FROM tsf_objects WHERE key=? AND etag=?)',key,key,etag));
   for(let pos=0,part=0;pos<bytes.length;pos+=262144,part++)commands.push(stmt('INSERT INTO tsf_chunks(object_key,etag,part,data) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM tsf_objects WHERE key=? AND etag=?)',key,etag,part,bytes.slice(pos,pos+262144).buffer,key,etag));
   const result=await db.batch(commands);
   return result[0].meta.changes?{etag}:null;
  },
  async list({prefix='',limit=100,cursor=''}={}) {
   const after=cursor?new TextDecoder().decode(Uint8Array.from(atob(cursor),x=>x.charCodeAt(0))):'';
   const {results}=await stmt('SELECT key,etag,size FROM tsf_objects WHERE key>=? AND key<? AND key>? ORDER BY key LIMIT ?',prefix,prefix+'\uffff',after,limit+1).all();
   const truncated=results.length>limit,objects=results.slice(0,limit);
   return {objects,truncated,cursor:truncated?btoa(String.fromCharCode(...new TextEncoder().encode(objects.at(-1).key))):undefined};
  }
 };
}
