"""Download attributed Commons photo candidates; preserve original image bytes."""
import csv
import html
import json
import re
import time
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '素材库' / '目的地配图_2026-09-27'
DATA = json.loads((OUT / '表格数据快照.json').read_text())
UA = 'SylvanTravelImageResearch/1.0 (photo sourcing for sylvantravel.com)'
# Country/category illustrations are explicitly identified, not visitor statistics.
QUERIES = {
 'countries': {
  'australia': ('Sydney Opera House Harbour Bridge', '国家代表图：悉尼港'),
  'newzealand': ('Milford Sound Mitre Peak', '国家代表图：米尔福德峡湾'),
  'china': ('Great Wall Mutianyu', '国家代表图：慕田峪长城'),
  'japan': ('Mount Fuji Lake Kawaguchi', '国家代表图：富士山与河口湖'),
  'usa': ('Grand Canyon South Rim', '国家代表图：大峡谷'),
  'thailand': ('Grand Palace Bangkok panorama', '国家代表图：曼谷大皇宫'),
  'others': ('Bora Bora lagoon', '分类示意图：波拉波拉岛，不代表全部目的地'),
 },
 'cities': {
  'melbourne': ('Melbourne skyline Yarra River', ''),
  'sydney': ('Sydney Harbour skyline', ''),
  'adelaide': ('Adelaide skyline River Torrens', ''),
  'gold coast': ('Gold Coast Surfers Paradise beach skyline', ''),
  'au others': ('Cairns Esplanade lagoon', '分类示意图：凯恩斯'),
  'beijing': ('Forbidden City Beijing panorama', ''),
  'shanghai': ('Shanghai Pudong skyline Bund', ''),
  "xi'an": ('Xian Bell Tower', ''),
  'sanya': ('Sanya Yalong Bay beach', ''),
  'cn others': ('Guilin Li River landscape', '分类示意图：桂林漓江'),
  'bali': ('Bali Ulun Danu Bratan temple', ''),
  'fiji': ('Fiji Mamanuca islands beach', ''),
  'maldives': ('Maldives island aerial', ''),
  'ot others': ('Singapore Marina Bay skyline', '分类示意图：新加坡'),
  'auckland': ('Auckland skyline harbour', ''),
  'queenstown': ('Queenstown Lake Wakatipu', ''),
  'newyork': ('New York Manhattan skyline', ''),
  'losangeles': ('Los Angeles downtown skyline', ''),
  'hawaii': ('Waikiki Diamond Head beach', ''),
  'bangkok': ('Bangkok Wat Arun river', ''),
  'phuket': ('Phuket Kata beach', ''),
  'tokyo': ('Tokyo skyline Tokyo Tower', ''),
  'kyoto': ('Kyoto Kiyomizu dera temple', ''),
  'osaka': ('Osaka Castle', ''),
 },
 'routes': {
  'mel-transfer': ('Melbourne Airport terminal exterior', '接送机主题图：机场，不代表具体车型或接送服务'),
  'mel-city': ('Flinders Street Station Melbourne', ''),
  'mel-ocean': ('Twelve Apostles Great Ocean Road', ''),
  'mel-phillip': ('Phillip Island Nobbies', '菲利普岛海岸；不承诺企鹅现场照片'),
  'mel-wine': ('Yarra Valley vineyard', ''),
  'syd-transfer': ('Sydney Airport international terminal exterior', '接送机主题图：机场，不代表具体车型或接送服务'),
  'syd-city': ('Sydney Opera House', ''),
  'syd-bluemt': ('Three Sisters Blue Mountains Echo Point', ''),
  'syd-kiama': ('Wollongong lighthouse harbour', '按 route_name 卧龙岗配图；ID 含 kiama，不据此改为凯阿马'),
  'adl-transfer': ('Adelaide Airport terminal', '接送机主题图：机场，不代表具体车型或接送服务'),
  'adl-kangroo': ('Remarkable Rocks Kangaroo Island', ''),
  'adl-barossa': ('Barossa Valley vineyard', ''),
  'adl-pinklake': ('Lake Bumbunga pink', '暂按南澳 Bumbunga Lake 配图；粉湖具体地点待确认'),
  'bj-3days': ('Temple of Heaven Beijing', '路线代表景点，不代表全部行程'),
  'sh-3days': ('Shanghai Bund waterfront', '路线代表景点，不代表全部行程'),
  'xa-3days': ('Xian city wall', '路线代表景点，不代表全部行程'),
 }
}

def request(url):
 for attempt in range(3):
  try:
   return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40)
  except urllib.error.HTTPError as e:
   if e.code == 429:
    delay=int(e.headers.get('Retry-After','600'))
    if delay <= 45 and attempt < 2:
     print(f'Rate limit: waiting {delay+1}s',flush=True)
     time.sleep(delay+1)
     continue
    raise RuntimeError('RATE_LIMITED retry-after=' + str(delay)) from e
   if attempt == 2: raise
   time.sleep(2 + attempt * 3)
  except Exception:
   if attempt == 2: raise
   time.sleep(2 + attempt * 3)

def clean(value):
 return html.unescape(re.sub('<[^>]+>', '', value or '')).strip()

def search(query):
 params = {'action':'query','format':'json','generator':'search','gsrsearch':query+' filetype:bitmap',
  'gsrnamespace':6,'gsrlimit':12,'prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':1600}
 with request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)) as response:
  data = json.load(response)
 return list(data.get('query',{}).get('pages',{}).values())

def save_manifest(records):
 (OUT/'图片来源.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
 if records:
  with (OUT/'图片来源.csv').open('w',encoding='utf-8-sig',newline='') as f:
   writer=csv.DictWriter(f,fieldnames=list(records[0]));writer.writeheader();writer.writerows(records)
 cards=[]
 for r in records:
  esc=lambda key:html.escape(str(r.get(key,'')))
  cards.append(f'<article><img loading="lazy" src="{urllib.parse.quote(r["本地文件"])}"><h2>{esc("名称")}</h2><p>{esc("分类")} · {esc("像素")} · {esc("授权")}</p><p>{esc("备注")}</p><p>{esc("图片标题")}</p><p>作者：{esc("作者")}</p><a href="{esc("来源页面")}">原始来源及授权</a></article>')
 (OUT/'图片预览.html').write_text('<!doctype html><html lang="zh"><meta charset="utf-8"><title>旅游素材预览</title><style>body{font:16px system-ui;background:#f5f5f2;margin:32px;color:#233142}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}article{background:white;padding:16px;border-radius:12px}img{width:100%;height:220px;object-fit:contain}h2{font-size:20px}p{overflow-wrap:anywhere;font-size:13px;line-height:1.6}</style><h1>旅游素材候选图</h1><p>原图未裁剪。使用前请遵循各图片来源页面的授权与署名要求。</p><main>'+''.join(cards)+'</main></html>')

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 manifest=OUT/'图片来源.json'
 records=json.loads(manifest.read_text()) if manifest.exists() else []
 used={r['下载链接'] for r in records}
 done={(r['分类'],r['ID']) for r in records}
 folders={'countries':'01_国家','cities':'02_城市','routes':'03_线路'}
 keys={'countries':('country_id','country_name'),'cities':('city_id','city_name'),'routes':('route_id','route_name')}
 failures=[]
 for kind,rows in DATA.items():
  idkey,namekey=keys[kind]
  for row in rows:
   ident,name=row[idkey],row[namekey]
   if (folders[kind],ident) in done and '--prepare' not in sys.argv: continue
   query,note=QUERIES[kind][ident]
   try:
    cache=OUT/'搜索记录'/f'{kind}-{ident.replace("/","-")}.json'
    if '--prepare' in sys.argv and cache.exists(): continue
    results=search(query)
    (OUT/'搜索记录').mkdir(exist_ok=True)
    (OUT/'搜索记录'/f'{kind}-{ident.replace("/","-")}.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    if '--prepare' in sys.argv:
     print(f'SEARCH {kind}/{ident}: {len(results)} results',flush=True)
     time.sleep(5)
     continue
    candidates=[]
    for p in results:
     i=(p.get('imageinfo') or [{}])[0];meta=i.get('extmetadata',{})
     license=meta.get('LicenseShortName',{}).get('value','')
     if not any(v in license.lower() for v in ('cc by','cc0','public domain')): continue
     w,h=i.get('width',0),i.get('height',0)
     if w<1200 or h<800 or not 1.15<=w/h<=2.4 or i.get('size',0)>35000000: continue
     if not urllib.parse.urlsplit(i.get('url','')).path.lower().endswith(('.jpg','.jpeg','.png')): continue
     if i['url'] in used: continue
     score=p.get('index',100)+abs(w/h-1.5)*2
     candidates.append((score,p,i,meta))
    if not candidates: raise ValueError('No eligible landscape photo found')
    errors=[]
    for _,p,i,meta in sorted(candidates,key=lambda x:x[0]):
     try:
      ext=Path(urllib.parse.urlsplit(i['url']).path).suffix.lower()
      rel=Path(folders[kind])/f'{name}__{ident.replace("/","-")}{ext}'
      dest=OUT/rel; dest.parent.mkdir(parents=True,exist_ok=True)
      with request(i['url']) as response: raw=response.read()
      dest.write_bytes(raw)
      with Image.open(dest) as im: im.verify()
      with Image.open(dest) as im: w,h=im.size
      record={'分类':folders[kind],'ID':ident,'名称':name,'本地文件':str(rel),'像素':f'{w} × {h}',
       '宽':w,'高':h,'文件字节':len(raw),'图片标题':p['title'],'来源页面':i['descriptionurl'],'下载链接':i['url'],
       '作者':clean(meta.get('Artist',{}).get('value','')),'授权':clean(meta.get('LicenseShortName',{}).get('value','')),
       '授权链接':meta.get('LicenseUrl',{}).get('value',''),'备注':note,'搜索词':query,'获取日期':'2026-09-27'}
      records.append(record);used.add(i['url']);save_manifest(records)
      print(f'OK {len(records)}/47 {name}: {w}x{h} | {p["title"]}',flush=True)
      break
     except Exception as e:
      if 'RATE_LIMITED' in str(e): raise
      errors.append(str(e))
    else: raise RuntimeError('; '.join(errors))
   except Exception as e:
    if 'RATE_LIMITED' in str(e):
     print(str(e),flush=True)
     raise
    failures.append({'分类':kind,'ID':ident,'名称':name,'错误':str(e)})
    print(f'FAIL {name}: {e}',flush=True)
   time.sleep(.5)
 (OUT/'待处理.json').write_text(json.dumps(failures,ensure_ascii=False,indent=2))
 print(f'Complete: {len(records)} saved, {len(failures)} pending',flush=True)

if __name__=='__main__': main()
