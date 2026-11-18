const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanFilenamePart, normalizeFolder, buildFilename, getScrollPositions, normalizeSettings } = require("../utils.js");

test("filename parts remove filesystem-reserved characters", () => {
  assert.equal(cleanFilenamePart('A/B:C*D?"E<>|'), "A-B-C-D-E-");
});
test("folder normalisation removes traversal segments", () => {
  assert.equal(normalizeFolder("../Screenshots//./Work/../../Safe"), "Screenshots/Work/Safe");
});
test("filename builder applies title, date, type and extension", () => {
  assert.equal(buildFilename({ title:"Example: Page", pattern:"{title}_{date}_{type}", date:"2026-11-18", type:"full", format:"jpeg", folder:"LocalShot" }), "LocalShot/Example- Page_2026-11-18_full.jpg");
});
test("scroll positions cover the end of the page without duplicates", () => {
  const positions=getScrollPositions(2500,800,80);
  assert.equal(positions.at(-1),1700);
  assert.equal(new Set(positions).size,positions.length);
  assert.ok(positions.every((value,index)=>index===0||value>positions[index-1]));
});
test("short pages produce one scroll position", () => {
  assert.deepEqual(getScrollPositions(500,800),[0]);
});
test("settings are bounded and default to JPEG", () => {
  const settings=normalizeSettings({delayMs:99999,format:"gif",folder:"../a//b"},{delayMs:500,format:"jpeg",folder:"LocalShot",filenamePattern:"{title}_{date}",hideSticky:true,saveAs:false});
  assert.equal(settings.delayMs,3000);
  assert.equal(settings.format,"jpeg");
  assert.equal(settings.folder,"a/b");
});
