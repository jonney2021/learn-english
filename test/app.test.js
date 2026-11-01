import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, evaluateSpeech } from '../src/data.js';
import { server } from '../server.js';

test('all twelve lessons have valid comprehension answers and useful speaking prompts',()=>{
 assert.equal(lessons.length,12);assert.equal(new Set(lessons.map(l=>l.id)).size,12);
 for(const lesson of lessons){assert.ok(lesson.dialogue.length>=4);assert.ok(lesson.answer>=0&&lesson.answer<lesson.options.length);assert.ok(lesson.prompt.length>20);assert.ok(lesson.response.length>20);assert.ok(evaluateSpeech(lesson.response,lesson).matched.length>=2);}
});
test('speaking hints are case insensitive and do not report absent keywords',()=>{
 const result=evaluateSpeech('I have finished the DRAFT and I need HELP.',lessons[0]);
 assert.deepEqual(result.matched,['draft','help']);assert.equal(result.total,4);
 assert.equal(evaluateSpeech('',lessons[0]).matched.length,0);
});
test('server serves app assets and rejects private files and missing resources',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
 const base=`http://127.0.0.1:${server.address().port}`;
 const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/Northstar/);
 for(const url of ['/src/app.js','/src/data.js','/src/style.css'])assert.equal((await fetch(base+url)).status,200);
 for(const url of ['/.git/config','/package.json','/missing.js','/%2e%2e%2fpackage.json'])assert.equal((await fetch(base+url)).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

import {stages,stageStatus,gradeExam} from '../src/progress.js';
test('stages cover every lesson once and require learning plus previous exam pass',()=>{
 assert.deepEqual(stages.flatMap(s=>s.ids).sort(),lessons.map(l=>l.id).sort());
 const sessions=stages[0].ids.map(id=>({id}));
 assert.equal(stageStatus(0,[],[]).canTest,false);
 assert.equal(stageStatus(0,sessions,[]).canTest,true);
 assert.equal(stageStatus(1,lessons.map(l=>({id:l.id})),[]).canTest,false);
 assert.equal(stageStatus(1,lessons.map(l=>({id:l.id})),[{stage:stages[0].id,passed:true,score:83}]).canTest,true);
 assert.equal(stageStatus(1,sessions,[{stage:stages[0].id,passed:true,score:83}]).canTest,false);
});
test('assessment needs five of six correct and failure does not unlock next stage',()=>{
 const questions=Array.from({length:6},()=>({answer:1}));
 assert.deepEqual(gradeExam(questions,[1,1,1,1,1,0]),{correct:5,score:83,passed:true});
 assert.equal(gradeExam(questions,[1,1,1,1,0,0]).passed,false);
 assert.equal(stageStatus(1,[],[{stage:stages[0].id,passed:false,score:67}]).unlocked,false);
});

import {placementLevel} from '../src/progress.js';
test('placement boundaries select all four starting stages without fabricating exam passes',()=>{
 assert.deepEqual([0,2,3,4,5,6,7,8].map(placementLevel),[0,0,1,1,2,2,3,3]);
 const status=stageStatus(3,[],[],3);
 assert.equal(status.unlocked,true);assert.equal(status.passed,false);assert.equal(status.canTest,false);
 assert.equal(stageStatus(0,[],[],3).exempt,true);
});
