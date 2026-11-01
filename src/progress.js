export const stages = [
 {id:'foundation',name:'自在开口',en:'Find your voice',description:'从日常问候、基础汇报和看病问诊开始，练习把需求说清楚。',ids:['standup','doctor','coffee'],icon:'Ⅰ'},
 {id:'connection',name:'从容应对',en:'Make yourself understood',description:'在购物、租房和工作沟通中，学会询问、确认与澄清。',ids:['grocery','clarify','rental'],icon:'Ⅱ'},
 {id:'confidence',name:'自信交流',en:'Keep the conversation going',description:'协商工作安排、自然点餐、问路换乘，独立应对常见场景。',ids:['manager','restaurant','transit'],icon:'Ⅲ'},
 {id:'fluency',name:'灵活表达',en:'Make your point',description:'表达不同观点、回应客户、融入社区，把语言变成连接。',ids:['feedback','phone','neighbour'],icon:'Ⅳ'}
];
export function stageStatus(index,sessions,assessments,placementStage=0){
 const stage=stages[index];
 const completed=stage.ids.filter(id=>sessions.some(s=>s.id===id)).length;
 const unlocked=stages.slice(0,index).every(s=>stages.indexOf(s)<placementStage||assessments.some(a=>a.stage===s.id&&a.passed));
 const exempt=index<placementStage;
 const passed=assessments.some(a=>a.stage===stage.id&&a.passed);
 const best=Math.max(0,...assessments.filter(a=>a.stage===stage.id).map(a=>a.score));
 return {exempt,completed,total:stage.ids.length,unlocked,passed,best,canTest:unlocked&&completed===stage.ids.length};
}
export function gradeExam(questions,answers){
 const correct=questions.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0);
 const score=Math.round(correct/questions.length*100);
 return {correct,score,passed:score>=80};
}

export function placementLevel(correct){return correct>=7?3:correct>=5?2:correct>=3?1:0;}
