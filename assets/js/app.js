const DATA_URL = "data/creatures.json";
const SAVE_KEY = "mcri_v1_save";
const defaultState = () => ({
  name:"見習研究員", level:1, xp:0, rp:120, discovered:["MCRI-001"], interactions:0,
  affection:{"MCRI-001":0}, logs:["研究員檔案已建立。","MCRI-001 影噬已加入初始觀察名單。"],
  interactionLogs:[], missions:{"discover":false,"interact":false,"scan":false,"event":false},
  claimed:[], eventCount:0, lastSaved:null, energy:5, samples:0, explorationData:0, researchProgress:{}, exploreLogs:[], explorationCount:0
});
let state = loadState(), creatures = [], selectedFilter="全部", selectedCreature="MCRI-001", activeLab="MCRI-001";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function loadState(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s?{...defaultState(),...s}:defaultState()}catch(e){return defaultState()}}
function saveState(silent=false){state.lastSaved=new Date().toISOString();localStorage.setItem(SAVE_KEY,JSON.stringify(state));$("#saveStatus").textContent="已存檔："+new Date().toLocaleTimeString("zh-TW");renderStats();if(!silent)toast("研究紀錄已儲存。")}
function log(msg){state.logs.unshift(new Date().toLocaleString("zh-TW")+"｜"+msg);state.logs=state.logs.slice(0,12);renderLogs()}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2300)}
function levelFromXp(xp){return Math.min(30,Math.floor(xp/100)+1)}
function addRewards(xp=0,rp=0){state.xp+=xp;state.rp+=rp;const old=state.level;state.level=levelFromXp(state.xp);if(state.level>old){toast(`研究員升級！目前 LV.${state.level}`);log(`研究員升級至 LV.${state.level}`)}}
function getCreature(id){return creatures.find(c=>c.id===id)}
function imagePath(c){return `assets/creatures/${c.id.toLowerCase()}.png`}
function dangerText(n){return ["低","中","高","極高","未知"][n-1]||"未知"}
function renderStats(){
 const discovered=state.discovered.length;
 $("#heroDiscovered").textContent=`${discovered} / ${creatures.length||12}`;$("#heroResearch").textContent=`${state.rp} RP`;$("#heroLevel").textContent=`LV.${String(state.level).padStart(2,"0")}`;
 $("#researcherName").textContent=state.name;$("#profileLevel").textContent=`LV.${String(state.level).padStart(2,"0")}`;$("#profileXp").textContent=`${state.xp%100} / 100 EXP`;$("#xpBar").style.width=`${state.xp%100}%`;
 $("#profileDiscovered").textContent=discovered;$("#profileInteractions").textContent=state.interactions;$("#profileRp").textContent=state.rp;
 $("#homeResearcherName").textContent=state.name;
 $("#homeResearcherLevel").textContent=`LV.${String(state.level).padStart(2,"0")} / ${state.level>1?"RESEARCHER":"TRAINEE"}`;
 $("#homeXpText").textContent=`${state.xp%100} / 100 EXP`;
 $("#homeXpBar").style.width=`${state.xp%100}%`;
 $("#homeDiscoverCount").textContent=discovered;
 $("#homeRpCount").textContent=state.rp;
 $("#homeInteractionCount").textContent=state.interactions;

}
function renderGrid(){
 const q=$("#creatureSearch").value.trim().toLowerCase();
 const list=creatures.filter(c=>(selectedFilter==="全部"||c.category===selectedFilter||selectedFilter==="未知"&&c.category==="未知")&&[c.name,c.english,c.id,c.category,...c.abilities].join(" ").toLowerCase().includes(q));
 $("#creatureGrid").innerHTML=list.map(c=>{const found=state.discovered.includes(c.id);return `<button class="creature-card ${selectedCreature===c.id?"selected":""}" data-id="${c.id}"><img src="${imagePath(c)}" alt="${c.name}"><b>${found?c.name:"未解鎖生命體"}</b><small>${c.id}</small><div class="card-meta"><span class="rarity">${c.rarity}</span><span class="danger-dots">${"●".repeat(c.danger)}${"○".repeat(5-c.danger)}</span></div></button>`}).join("")||'<p class="muted">沒有符合條件的研究資料。</p>';
 $$(".creature-card").forEach(b=>b.addEventListener("click",()=>selectCreature(b.dataset.id)));
}
function selectCreature(id){selectedCreature=id;const c=getCreature(id);if(!c)return;const found=state.discovered.includes(id);const research=state.researchProgress?.[id]||0;
 $("#creatureDetail").innerHTML=`<img class="detail-art" src="${imagePath(c)}" alt="${c.name}"><div class="detail-content"><div class="detail-title"><div><small>${c.id} / ${c.english}</small><h3>${found?c.name:"未解鎖生命體"}</h3></div><span class="rarity">${c.rarity}</span></div><div class="detail-tags"><span class="tag">${c.category}</span><span class="tag">危險等級：${dangerText(c.danger)}</span><span class="tag">${found?"已發現":"尚未發現"}</span></div><p class="detail-desc">${found?c.desc:"目前資料遭到加密。完成探索任務後可解鎖完整檔案。"}</p><h4>已知能力</h4><ul>${(found&&research>=40?c.abilities:["資料尚未解密","等待研究進度提升"]).map(a=>`<li>${a}</li>`).join("")}</ul><h4>棲息環境</h4><p class="detail-desc">${found&&research>=70?c.habitat:"資料加密中"}</p><h4>研究員備註</h4><p class="detail-desc">${found&&research>=100?c.secret:"完成 100% 研究進度後解鎖。"}</p><button class="btn btn-primary discover-btn" id="detailAction">${found?"前往互動實驗室":"標記為已發現（測試）"}</button></div>`;
 $("#detailAction").addEventListener("click",()=>{if(!found){state.discovered.push(id);addRewards(20,10);state.missions.discover=state.discovered.length>=3;log(`新發現生物：${c.name}`);renderAll();toast(`已解鎖 ${c.name}`)}else{activeLab=id;$("#labSelect").value=id;renderLab();location.hash="#lab"}});
 renderGrid();
}
function renderMissions(){
 const defs=[["discover","初次接觸","發現至少 3 種不同生物","+50 RP · +30 EXP",state.discovered.length>=3],["interact","建立信任","與生物互動 3 次"," +30 RP · +20 EXP",state.interactions>=3],["scan","資料採集","完成 2 次生物掃描","+40 RP · +25 EXP",state.interactionLogs.filter(x=>x.includes("掃描")).length>=2],["event","異常處置","完成 1 次異常事件選擇","+60 RP · +40 EXP",state.eventCount>=1]];
 $("#missionList").innerHTML=defs.map(([id,title,desc,reward,done])=>`<div class="mission-item ${done?"done":""}"><span class="mission-check">${done?"✓":"○"}</span><div class="mission-copy"><b>${title}</b><small>${desc}</small></div><span class="mission-reward">${state.claimed.includes(id)?"已領取":reward}</span><button class="btn btn-secondary" data-claim="${id}" ${!done||state.claimed.includes(id)?"disabled":""}>領取</button></div>`).join("");
 const done=defs.filter(d=>d[4]).length;$("#missionCount").textContent=`${done} / ${defs.length}`;$("#missionProgress").style.width=`${done/defs.length*100}%`;
 $$("[data-claim]").forEach(b=>b.addEventListener("click",()=>claimMission(b.dataset.claim)));
}
function claimMission(id){const rewards={discover:[30,50],interact:[20,30],scan:[25,40],event:[40,60]};if(state.claimed.includes(id))return;const def={discover:state.discovered.length>=3,interact:state.interactions>=3,scan:state.interactionLogs.filter(x=>x.includes("掃描")).length>=2,event:state.eventCount>=1};if(!def[id])return;state.claimed.push(id);addRewards(...rewards[id]);log(`領取任務獎勵：${id}`);renderAll();saveState(true);toast("任務獎勵已領取。")}
function renderLab(){
 const c=getCreature(activeLab)||creatures[0];$("#labImage").src=imagePath(c);$("#labImage").alt=c.name;$("#labId").textContent=c.id;$("#labName").textContent=c.name;
 const affection=state.affection[c.id]||0;$("#affectionValue").textContent=`${affection} / 100`;$("#affectionBar").style.width=`${affection}%`;
 $("#labMood").textContent=affection>70?"牠似乎已經非常信任你。":affection>30?"牠正在逐漸習慣你的存在。":"牠正安靜地觀察你。";
 $("#labSelect").innerHTML=creatures.filter(x=>state.discovered.includes(x.id)).map(x=>`<option value="${x.id}" ${x.id===activeLab?"selected":""}>${x.name}｜${x.id}</option>`).join("");
 $("#interactionLog").innerHTML=state.interactionLogs.slice(0,5).map(x=>`<li>${x}</li>`).join("")||"<li>尚無互動紀錄。</li>";
}
function interact(action){
 const c=getCreature(activeLab);if(!state.discovered.includes(c.id)){toast("尚未發現這隻生物。");return}
 const affection=state.affection[c.id]||0;let gain=0,msg="";
 if(action==="feed"){gain=8;msg=`你提供了適合 ${c.name} 的食物。牠看起來很滿意。`}
 if(action==="pet"){gain=6;msg=`你輕輕靠近 ${c.name}。牠沒有躲開，信任似乎增加了。`}
 if(action==="observe"){gain=2;msg=`觀察完成：${c.name} 的行為與已知紀錄大致相符。`}
 if(action==="scan"){gain=3;addRewards(8,15);msg=`掃描完成：取得 ${c.name} 的生物數據，獲得 15 RP。`}
 state.affection[c.id]=Math.min(100,affection+gain);state.interactions++;state.interactionLogs.unshift(`${new Date().toLocaleTimeString("zh-TW")}｜${c.name}：${msg}`);state.interactionLogs=state.interactionLogs.slice(0,12);
 state.missions.interact=state.interactions>=3;log(`${c.name}｜${msg}`);$("#labFeedback").textContent=msg;renderAll();saveState(true);
}
const events=[
 {title:"第四收容區訊號異常",text:"監控系統偵測到 MCRI-005 無面者的生命訊號出現在兩個位置。收容艙畫面卻顯示牠仍然站在原地。",choices:["立即封鎖第四收容區","調閱所有監控錄影","透過廣播與無面者溝通"],results:["收容區已封鎖。但系統顯示，你封鎖的是第三收容區。","錄影中出現一名與你外貌完全相同的人，時間戳記是明天。","廣播傳出你的聲音：「不要相信正在操作控制台的人。」"]},
 {title:"未知樣本自發發光",text:"樣本保存櫃中的晶體在無供電狀態下持續發光，並在玻璃內側留下了新的符號。",choices:["取出樣本進行分析","隔離整個保存櫃","拍攝符號並比對檔案"],results:["分析儀器顯示：樣本內部有規律的脈衝，像是在回應某個訊號。","隔離程序完成，但保存櫃的門從內側被敲了三下。","資料庫找到相似符號，來源欄位卻標示為「研究員本人」。"]},
 {title:"夜間走廊出現第二道影子",text:"夜間巡檢攝影機拍到一名研究員經過走廊，但影子比本人多出一個。",choices:["前往現場確認","切換紅外線攝影","通知值班主管"],results:["走廊空無一人，地面卻留有尚未乾涸的腳印。","紅外線畫面中只有影子，沒有人體熱源。","主管回覆：「今晚研究所沒有安排任何人值班。」"]}
];
function openEvent(){
 const e=events[Math.floor(Math.random()*events.length)];$("#eventTitle").textContent=e.title;$("#eventText").textContent=e.text;$("#eventResult").classList.add("hidden");
 $("#eventChoices").innerHTML=e.choices.map((x,i)=>`<button data-choice="${i}">${String.fromCharCode(65+i)}. ${x}</button>`).join("");
 $$("#eventChoices button").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.choice);$("#eventResult").textContent=e.results[i];$("#eventResult").classList.remove("hidden");$("#eventChoices").innerHTML="";state.eventCount++;state.missions.event=true;addRewards(15,20);log(`異常事件處置：${e.title}｜${e.results[i]}`);renderAll();saveState(true)}));
 $("#eventModal").classList.add("show");
}

const regions={
 forest:{name:"暗影森林",desc:"霧氣覆蓋的森林，適合初期探索與基礎觀察。",risk:1,unlock:1,pool:["暗影系","變異系","未知"]},
 facility:{name:"廢棄研究區",desc:"失去電力的研究設施，可能找到舊研究紀錄與機械異常。",risk:2,unlock:1,pool:["機械系","變異系","未知"]},
 abyss:{name:"深淵區域",desc:"深層未知生態，稀有樣本與高危生物出沒。",risk:3,unlock:2,pool:["深海系","異界系","未知"]},
 rift:{name:"異次元裂縫",desc:"空間不穩定，遭遇內容可能違反常理。",risk:4,unlock:3,pool:["異界系","神話系","未知"]}
};
let selectedRegion="forest", currentEncounter=null;
function researchStage(p){return p>=100?"完整研究":p>=70?"部分解密":p>=40?"分析中":p>=20?"觀察中":p>0?"初次遭遇":"未知"}
function renderExploration(){
 const energy=Math.max(0,Number(state.energy??5));$("#exploreEnergy").textContent=`${energy} / 5`;$("#exploreRp").textContent=state.rp;$("#exploreSamples").textContent=state.samples||0;$("#exploreData").textContent=state.explorationData||0;
 $$(".region-card").forEach(card=>{const key=card.dataset.region,rg=regions[key];card.classList.toggle("selected",key===selectedRegion);const locked=state.level<rg.unlock;card.classList.toggle("locked",locked);card.disabled=locked;const small=card.querySelector("small");if(small)small.textContent=locked?`LOCKED · LV.${rg.unlock} 解鎖`:rg.risk===1?"LOW RISK · 初始區域":rg.risk===2?"MEDIUM RISK · 已開放":rg.risk===3?"HIGH RISK · LV.2":"ANOMALY · LV.3";});
 const r=regions[selectedRegion];$("#regionTitle").textContent=r.name;$("#regionDesc").textContent=r.desc;
 $("#exploreAction").disabled=energy<=0;$("#exploreAction").textContent=energy<=0?"能量耗盡":"開始探索 ↗";
 $("#exploreLog").innerHTML=(state.exploreLogs||[]).slice(0,6).map(x=>`<li>${escapeHtml(x)}</li>`).join("")||"<li>尚未進行探索。</li>";
 const arr=creatures.map(c=>({c,p:state.researchProgress?.[c.id]||0})).filter(x=>state.discovered.includes(x.c.id));
 $("#researchProgressList").innerHTML=arr.map(({c,p})=>`<div class="research-row"><div class="research-row-title"><b>${c.name}</b><small>${c.id} · ${researchStage(p)}</small><strong>${p}%</strong></div><div class="progress-track"><i style="width:${p}%"></i></div><button class="btn btn-secondary research-action" data-research="${c.id}" ${p>=100||state.rp<25||(state.samples||0)<1?"disabled":""}>${p>=100?"研究完成":"分析樣本 · 25 RP + 1 樣本"}</button></div>`).join("")||"<p class='muted'>尚無研究對象。請先探索並發現生物。</p>";
 $$("[data-research]").forEach(b=>b.addEventListener("click",()=>analyzeCreature(b.dataset.research)));
}
function pickEncounter(region){
 const types=["creature","trace","sample","event","hazard"];let type=types[Math.floor(Math.random()*types.length)];if(region.risk>=3&&Math.random()<.18)type="rare";
 if(type==="creature"||type==="rare"){let pool=creatures.filter(c=>region.pool.includes(c.category));if(!pool.length)pool=creatures;const creature=pool[Math.floor(Math.random()*pool.length)];return {type,creature,title:type==="rare"?"稀有生命訊號":"生物遭遇",desc:`探測器發現 ${creature.name}（${creature.id}）的生命反應。目標行為尚未完全確認，請選擇調查方式。`,choices:["靜默觀察","使用掃描器","接近並採樣","安全撤退"]};}
 if(type==="trace")return {type,title:"未知痕跡",desc:"地面與周遭設備出現不明痕跡。訊號微弱，但似乎能追蹤到附近異常活動。",choices:["記錄痕跡","分析訊號","追蹤來源","返回研究所"]};
 if(type==="sample")return {type,title:"可採集樣本",desc:"發現一處可採集的異常材料，樣本狀態穩定。",choices:["小心採集","快速收集","掃描材料","放棄採集"]};
 if(type==="event")return {type,title:"區域異常事件",desc:"探索區域突然出現異常波動，設備讀數短暫失真。",choices:["保持距離觀察","啟動設備掃描","嘗試穩定異常","撤離區域"]};
 return {type,title:"環境危險",desc:"環境危險訊號升高。研究員可嘗試處理風險，或立即撤退。",choices:["部署防護裝置","掃描危險來源","冒險深入","撤退"]};
}
function startExploration(){if(state.energy<=0){toast("探索能量不足。請返回研究所休整。");return}const r=regions[selectedRegion];state.energy--;state.explorationCount=(state.explorationCount||0)+1;currentEncounter=pickEncounter(r);
 const e=currentEncounter;const creature=e.creature;
 $("#encounterBox").innerHTML=`<div class="encounter-card ${e.type==='rare'?'rare-encounter':''}"><div class="encounter-type">${e.type==='rare'?'✦ RARE SIGNAL':'⚠ FIELD ENCOUNTER'} · ${r.name}</div><h3>${e.title}</h3><p>${escapeHtml(e.desc)}</p>${creature?`<div class="encounter-creature"><img src="${imagePath(creature)}" alt="${creature.name}"><div><b>${creature.name}</b><small>${creature.id} · ${creature.category}</small><span>危險等級 ${dangerText(creature.danger)}</span></div></div>`:""}<div class="encounter-choices">${e.choices.map((ch,i)=>`<button class="btn btn-secondary" data-exchoice="${i}">${ch}</button>`).join("")}</div><div id="encounterResult" class="encounter-result hidden"></div></div>`;
 $$("[data-exchoice]").forEach(b=>b.addEventListener("click",()=>resolveEncounter(Number(b.dataset.exchoice))));
 log(`進入${r.name}探索，遭遇：${e.title}`);renderAll();saveState(true);
}
function resolveEncounter(choice){if(!currentEncounter)return;const e=currentEncounter,r=regions[selectedRegion],c=e.creature;let xp=10+Math.floor(Math.random()*12),rp=8+Math.floor(Math.random()*15),sample=0,data=0,progress=0,msg="";
 if(c){if(choice===0){progress=18;data=1;msg=`觀察完成，取得 ${c.name} 的行為情報。`;}else if(choice===1){progress=28;data=2;rp+=8;msg=`掃描完成，獲得 ${c.name} 生物數據。`;}else if(choice===2){progress=35;sample=1;data=1;rp+=12;msg=`成功採集 ${c.name} 的樣本，但遭遇風險增加。`;if(Math.random()<.22){xp=Math.max(5,xp-6);msg+=` 探索受到干擾，部分 EXP 減少。`}}else{progress=5;msg="已安全撤退，保留少量現場情報。";rp=Math.floor(rp/2);xp=Math.floor(xp/2)}
 if(!state.discovered.includes(c.id)){state.discovered.push(c.id);progress+=12;msg+=` 新生物發現：${c.name} 已加入圖鑑。`;state.missions.discover=state.discovered.length>=3;}
 state.researchProgress[c.id]=Math.min(100,(state.researchProgress[c.id]||0)+progress);
 }else{if(e.type==="sample"){if(choice===0||choice===1){sample=choice===0?1:2;data=1;progress=5;msg=`採集成功，獲得 ${sample} 份異常樣本。`;}else if(choice===2){data=2;rp+=12;msg="分析完成，獲得材料數據與研究點數。";}else msg="你放棄採集並安全離開。";}else if(e.type==="trace"){if(choice===0){data=1;progress=8;msg="痕跡已記錄，取得探索資料。";}else if(choice===1){data=2;rp+=10;msg="訊號分析完成，資料已上傳研究所。";}else if(choice===2){data=2;sample=1;msg="成功追蹤到來源，並取得少量樣本。";}else msg="你停止追蹤並返回。";}else if(e.type==="event"){if(choice===0){data=1;msg="保持距離，觀察到異常波動逐漸消退。";}else if(choice===1){data=2;rp+=12;msg="掃描資料揭示異常波動的部分規律。";}else if(choice===2){data=1;sample=1;rp+=16;msg="異常被暫時穩定，取得一份特殊樣本。";}else msg="已撤離異常區域。";}else{if(choice===0){sample=1;data=1;msg="防護裝置成功部署，取得安全樣本。";}else if(choice===1){data=2;rp+=8;msg="危險來源已定位，風險資訊加入資料庫。";}else{if(Math.random()<.4){sample=1;rp+=20;msg="冒險深入成功，取得稀有材料！";}else{xp=Math.max(0,xp-8);msg="環境干擾導致探索受挫，但仍取得少量資料。";}}}}
 if(e.type==="rare"){sample+=1;rp+=15;progress+=12;msg+=" 稀有訊號額外獎勵已發放。";}
 state.samples=(state.samples||0)+sample;state.explorationData=(state.explorationData||0)+data;state.energy=Math.min(5,state.energy);addRewards(xp,rp);state.missions.event=state.eventCount>=1;
 const result=`${msg} 獲得 ${xp} EXP、${rp} RP${sample?`、${sample} 樣本`:""}${data?`、${data} 探索資料`:""}${progress?`。研究進度 +${progress}%`:""}`;
 const resultEl=$("#encounterResult");if(resultEl){resultEl.textContent=result;resultEl.classList.remove("hidden");} $$("[data-exchoice]").forEach(b=>b.disabled=true);
 state.exploreLogs.unshift(`${new Date().toLocaleTimeString("zh-TW")}｜${regions[selectedRegion].name}：${e.title} — ${msg}`);state.exploreLogs=state.exploreLogs.slice(0,10);log(result);currentEncounter=null;renderAll();saveState(true);toast("探索成果已記錄。");
}
function restExploration(){state.energy=5;log("返回研究所休整，探索能量已補充。" );renderAll();saveState(true);toast("探索能量已恢復。");}


function analyzeCreature(id){const progress=state.researchProgress[id]||0;if(progress>=100){toast("此生物已完成研究。");return}if(state.rp<25||state.samples<1){toast("分析需要 25 RP 與 1 份樣本。");return}state.rp-=25;state.samples--;state.researchProgress[id]=Math.min(100,progress+20);const c=getCreature(id);log(`研究分析：${c?.name||id}，研究進度 ${state.researchProgress[id]}%。`);renderAll();saveState(true);toast(state.researchProgress[id]>=100?`${c.name} 完整研究已解鎖！`:`${c.name} 研究進度提升。`)}

function renderLogs(){$("#recordLog").innerHTML=state.logs.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderAll(){renderStats();renderGrid();renderMissions();renderLab();renderExploration();renderLogs()}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mcri-research-save.json";a.click();URL.revokeObjectURL(a.href);toast("存檔備份已匯出。")}

function activateView(rawHash){
  let id=(rawHash||"#home").replace("#","");
  if(!id || id==="guide") id="home";
  const allowed=["home","exploration","database","missions","incident","lab","records","settings"];
  if(!allowed.includes(id)) id="home";
  $$(".page-section").forEach(s=>s.classList.toggle("active-view",s.id===id));
  $$(".nav-link").forEach(a=>{
    const href=a.getAttribute("href");
    a.classList.toggle("active", href==="#"+id || (id==="home" && href==="#guide"));
  });
  document.body.dataset.currentView=id;
  window.scrollTo({top:0,behavior:"instant"});
}

function setup(){
 $("#creatureSearch").addEventListener("input",renderGrid);
 $$("#categoryFilters button").forEach(b=>b.addEventListener("click",()=>{$$("#categoryFilters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");selectedFilter=b.dataset.filter;renderGrid()}));
 $("#labSelect").addEventListener("change",e=>{activeLab=e.target.value;renderLab()});
 $$(".interaction-btn").forEach(b=>b.addEventListener("click",()=>interact(b.dataset.action)));
 $("#startResearch").addEventListener("click",()=>{location.hash="#exploration";toast("野外探索終端已開啟。")});
 $("#continueBtn").addEventListener("click",()=>{location.hash="#records";toast("已載入目前瀏覽器的研究紀錄。")});
 $("#saveNow").addEventListener("click",()=>saveState());$("#exportSave").addEventListener("click",exportSave);
 $("#importSave").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!data||!Array.isArray(data.discovered))throw Error("invalid");state={...defaultState(),...data};saveState(true);renderAll();toast("存檔匯入成功。")}catch(err){toast("存檔格式不正確，無法匯入。")}e.target.value=""});
 $("#resetSave").addEventListener("click",()=>{if(confirm("確定要重置所有研究進度？建議先匯出備份。")){state=defaultState();saveState(true);renderAll();toast("研究進度已重置。")}});
 $("#editName").addEventListener("click",()=>{const n=prompt("請輸入研究員名稱（最多 16 個字）",state.name);if(n&&n.trim()){state.name=n.trim().slice(0,16);log("研究員名稱已更新。");renderAll();saveState(true)}});
 $("#claimAll").addEventListener("click",()=>{["discover","interact","scan","event"].forEach(claimMission);renderAll()});
 $("#settingsBtn").addEventListener("click",()=>location.hash="#settings");
 $("#triggerEvent").addEventListener("click",openEvent);
 $$(".region-card").forEach(card=>card.addEventListener("click",()=>{selectedRegion=card.dataset.region;renderExploration()}));
 $("#exploreAction").addEventListener("click",startExploration);$("#restExplore").addEventListener("click",restExploration);
 $("#closeEvent").addEventListener("click",()=>$("#eventModal").classList.remove("show"));
 $("#eventModal").addEventListener("click",e=>{if(e.target.id==="eventModal")e.currentTarget.classList.remove("show")});
 $("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
 $$("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
 window.addEventListener("hashchange",()=>activateView(location.hash));
 activateView(location.hash);
 $("#reduceMotion").addEventListener("change",e=>document.body.classList.toggle("reduce-motion",e.target.checked));
 $("#soundToggle").addEventListener("change",()=>toast("音效功能將於後續版本加入。"));
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){const id=e.target.id;$$(".nav-link").forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+id))}}),{rootMargin:"-25% 0px -65% 0px"});
 $$(".page-section").forEach(s=>observer.observe(s));
}
async function init(){try{const r=await fetch(DATA_URL);if(!r.ok)throw Error("data load");creatures=await r.json()}catch(e){toast("生物資料載入失敗，請使用本機伺服器或 GitHub Pages 開啟。");return}setup();renderAll();if(!state.lastSaved){saveState(true)}}
document.addEventListener("DOMContentLoaded",init);
