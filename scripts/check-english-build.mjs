import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';
import assert from 'node:assert/strict';
const root=process.argv[2] || 'dist';
async function files(dir) {const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else if(e.name.endsWith('.html'))out.push(p);}return out;}
function inspect(html){const images=[],links=[],chinese=[];let lang;const walk=(n,skip=false)=>{const a=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));skip=skip||['script','style','code','pre'].includes(n.tagName)||!!a['data-language'];if(n.tagName==='html')lang=a.lang;if(n.tagName==='img')images.push(a.src);if(n.tagName==='a')links.push(a);if(!skip){if(n.nodeName==='#text'&&/\p{Script=Han}/u.test(n.value))chinese.push(n.value);for(const key of ['alt','title','placeholder','aria-label'])if(a[key]&&/\p{Script=Han}/u.test(a[key]))chinese.push(a[key]);}for(const c of n.childNodes||[])walk(c,skip);};walk(parse(html));return {images,links,chinese,lang};}
let count=0;
for(const file of await files(path.join(root,'en'))){const relative=path.relative(path.join(root,'en'),file);const en=inspect(await readFile(file,'utf8'));const zh=inspect(await readFile(path.join(root,relative),'utf8'));assert.equal(en.lang,'en');assert.deepEqual(en.chinese,[],relative);assert.deepEqual(en.images,zh.images,relative);for(const link of en.links){if(link['data-language']||!link.href?.startsWith('/')||link.href.startsWith('//'))continue;assert.ok(link.href.startsWith('/en/'),link.href);}const zhSwitch=en.links.find(a=>a['data-language']==='zh');assert.ok(zhSwitch);assert.equal(decodeURI(zhSwitch.href),'/'+relative.replace(/index\.html$/,''));count++;}
console.log(`Verified ${count} English pages: translated text and attributes, unchanged images, language-aware navigation and matching Chinese pages.`);
