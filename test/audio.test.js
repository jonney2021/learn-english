import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { lessons } from '../src/data.js';
import { LessonAudio } from '../src/audio-player.js';

class FakeAudio {
 constructor(url){this.url=url;this.paused=true;this.listeners={};}
 addEventListener(type,fn){this.listeners[type]=fn;}
 async play(){this.paused=false;this.listeners.playing?.();}
 pause(){this.paused=true;}
 removeAttribute(){}
 load(){}
}
test('audio controller supports pause, resume, speed, replacement and suppresses stale events',async()=>{
 const audios=[],states=[];
 const player=new LessonAudio({createAudio:url=>{const a=new FakeAudio(url);audios.push(a);return a;},onState:s=>states.push(s)});
 await player.play('doctor');assert.match(audios[0].url,/audio\/doctor-dialogue.mp3$/);
 assert.equal(audios[0].paused,false);assert.equal(audios[0].preservesPitch,true);
 await player.play('doctor');assert.equal(audios[0].paused,true);
 await player.play('doctor');assert.equal(audios[0].paused,false);assert.equal(audios.length,1);
 player.setRate(.75);assert.equal(audios[0].playbackRate,.75);
 await player.play('coffee','phrase');assert.equal(audios[0].paused,true);assert.equal(player.key,'coffee-phrase');
 audios[0].listeners.ended();assert.equal(player.key,'coffee-phrase');
 audios[1].listeners.ended();assert.equal(player.key,null);
});
test('failed audio playback reports an error and does not silently use robotic speech',async()=>{
 let failures=0;
 const player=new LessonAudio({createAudio:url=>{const a=new FakeAudio(url);a.play=async()=>{throw Error('offline');};return a;},onError:()=>failures++});
 await player.play('doctor');assert.equal(failures,1);assert.equal(player.current,null);
});
test('all lessons have matching dialogue and phrase assets with verified hashes',async()=>{
 const root=new URL('../audio/',import.meta.url);
 const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(Object.keys(manifest.assets).length,lessons.length);
 for(const lesson of lessons){
  const item=manifest.assets[lesson.id];assert.deepEqual(item.source,{dialogue:lesson.dialogue,phrase:lesson.phrase});
  for(const type of ['dialogue','phrase']){
   const asset=item[type];const data=await readFile(new URL(asset.file,root));
   assert.ok(data.length>2000);assert.ok(asset.duration>.5);
   assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256);
  }
 }
});
