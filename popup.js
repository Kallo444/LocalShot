const statusEl=document.getElementById("status");
const buttons=[...document.querySelectorAll("button[data-mode]")];
buttons.forEach(button=>button.addEventListener("click",async()=>{
  buttons.forEach(b=>b.disabled=true);
  const mode=button.dataset.mode;
  statusEl.textContent=mode==="area"?"Select an area on the page…":"Capturing…";
  try{
    const result=await chrome.runtime.sendMessage({type:"CAPTURE",mode});
    if(!result?.ok)throw new Error(result?.error||"Capture failed.");
    statusEl.textContent="Saved: "+result.filename;
    loadHistory();
  }catch(e){statusEl.textContent=e.message||"Could not capture this page.";}
  finally{buttons.forEach(b=>b.disabled=false);}
}));
async function loadHistory(){
  const {history=[]}=await chrome.storage.local.get({history:[]});
  const el=document.getElementById("history");
  el.innerHTML="";
  if(!history.length){el.textContent="No screenshots yet.";return;}
  history.slice(0,5).forEach(item=>{
    const div=document.createElement("div");div.className="item";
    div.textContent=item.name+" · "+new Date(item.time).toLocaleString();
    el.appendChild(div);
  });
}
loadHistory();
