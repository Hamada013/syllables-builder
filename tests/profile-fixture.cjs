module.exports=async context=>context.addInitScript(()=>{
 if(!localStorage.getItem('syllables-builder-v1'))localStorage.setItem('syllables-builder-v1',JSON.stringify({schema:1,active:'taffaha-qa',children:[{id:'taffaha-qa',name:'اختبار',role:'child'}]}));
});
