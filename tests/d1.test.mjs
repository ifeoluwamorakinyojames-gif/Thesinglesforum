import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {d1Storage} from '../worker/d1-storage.mjs';
async function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec(await readFile('migrations/0001_storage.sql','utf8'));
 const db={prepare(query){return {bind(...args){args=args.map(x=>x instanceof ArrayBuffer?new Uint8Array(x):x);return {async all(){return {results:sql.prepare(query).all(...args)};},run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}};}};}};},async batch(commands){sql.exec('BEGIN');try{const results=commands.map(x=>x.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
 return {sql,bucket:d1Storage(db),db};
}
test('D1 preserves a 3 MB image and conditional updates atomically',async()=>{
 const {bucket,sql}=await fixture();const data=new Uint8Array(3*1024*1024);crypto.getRandomValues(data.subarray(0,65536));data.set([1,2,3],data.length-3);
 const first=await bucket.put('media/test.jpg',data,{httpMetadata:{contentType:'image/jpeg'},onlyIf:{etagDoesNotMatch:'*'}});
 const obj=await bucket.get('media/test.jpg');assert.deepEqual(obj.body,data);assert.equal(obj.httpMetadata.contentType,'image/jpeg');
 assert.equal(await bucket.put('media/test.jpg','bad',{onlyIf:{etagMatches:'stale'}}),null);
 assert.equal(await bucket.put('media/test.jpg','bad',{onlyIf:{etagDoesNotMatch:'*'}}),null);
 assert.deepEqual((await bucket.get('media/test.jpg')).body,data);
 assert(await bucket.put('media/test.jpg','{}',{onlyIf:{etagMatches:first.etag}}));assert.deepEqual(await(await bucket.get('media/test.jpg')).json(),{});
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM tsf_chunks').get().n,1);sql.close();
});
test('D1 paginates only matching keys without duplicates',async()=>{
 const {bucket,sql}=await fixture();for(const key of ['cms/current.json','media/a.jpg','media/b.jpg','media/c.jpg'])await bucket.put(key,'{}');
 const first=await bucket.list({prefix:'media/',limit:2});assert.equal(first.truncated,true);assert.deepEqual(first.objects.map(x=>x.key),['media/a.jpg','media/b.jpg']);
 const second=await bucket.list({prefix:'media/',limit:2,cursor:first.cursor});assert.equal(second.truncated,false);assert.deepEqual(second.objects.map(x=>x.key),['media/c.jpg']);assert.equal(await bucket.get('missing'),null);sql.close();
});
