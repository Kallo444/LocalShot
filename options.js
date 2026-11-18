const $ = id => document.getElementById(id);
const DEFAULTS = { folder:"LocalShot", format:"jpeg", delayMs:500, filenamePattern:"{title}_{date}", hideSticky:true, saveAs:false };
chrome.storage.local.get({settings:DEFAULTS}, ({settings}) => {
  const s={...DEFAULTS,...settings};
  $("folder").value=s.folder; $("format").value=s.format; $("delay").value=String(s.delayMs);
  $("pattern").value=s.filenamePattern; $("sticky").checked=s.hideSticky; $("saveAs").checked=s.saveAs;
});
$("save").addEventListener("click",async()=>{
  const folder=$("folder").value.trim().replace(/\\/g,"/").replace(/\.\./g,"");
  await chrome.storage.local.set({settings:{folder,format:$("format").value,delayMs:Number($("delay").value),filenamePattern:$("pattern").value.trim()||"{title}_{date}",hideSticky:$("sticky").checked,saveAs:$("saveAs").checked}});
  $("status").textContent="Saved";
  setTimeout(()=>$("status").textContent="",1600);
});
