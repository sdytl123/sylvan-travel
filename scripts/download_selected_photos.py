"""Download server-provided, uncropped HD previews from researched Commons records."""
import io
import json
import time
import urllib.parse
from pathlib import Path
from PIL import Image
from collect_destination_photos import OUT, DATA, QUERIES, request, clean, save_manifest

def main():
 records=json.loads((OUT/'图片来源.json').read_text())
 folders={'countries':'01_国家','cities':'02_城市','routes':'03_线路'}
 keys={'countries':('country_id','country_name'),'cities':('city_id','city_name'),'routes':('route_id','route_name')}
 failures=[]
 for kind,rows in DATA.items():
  for row in rows:
   ident,name=row[keys[kind][0]],row[keys[kind][1]]
   choices=json.loads((OUT/'精选配置.json').read_text())
   selected=choices.get(kind+'/'+ident)
   old=next((r for r in records if r['分类']==folders[kind] and r['ID']==ident),None)
   if old and (not selected or selected==old['图片标题']):continue
   cache=OUT/'搜索记录'/f'{kind}-{ident.replace("/","-")}.json'
   if not cache.exists():
    failures.append(kind+'/'+ident);continue
   results=json.loads(cache.read_text());candidates=[]
   for p in results:
    i=(p.get('imageinfo') or [{}])[0];m=i.get('extmetadata',{});license=m.get('LicenseShortName',{}).get('value','').lower()
    w,h=i.get('width',0),i.get('height',1)
    if not any(x in license for x in ('cc by','cc0','public domain')):continue
    if w<1200 or h<800 or not 1.15<=w/h<=2.1:continue
    if not urllib.parse.urlsplit(i.get('url','')).path.lower().endswith(('.jpg','.jpeg','.png')):continue
    if selected and p['title']!=selected:continue
    if any(x in p['title'].lower() for x in ('junk','crab','hotel xian','banner','map','logo')):continue
    if any(r['图片标题']==p['title'] for r in records if r is not old):continue
    candidates.append((p.get('index',100)+abs(w/h-1.5)*2,p,i,m))
   if not candidates:
    print('NO CANDIDATE '+kind+'/'+ident,flush=True);failures.append(kind+'/'+ident);continue
   succeeded=False
   for _,p,i,m in sorted(candidates,key=lambda v:v[0]):
    url=i.get('thumburl')
    if not url:continue
    try:
     with request(url) as response: raw=response.read()
     with Image.open(io.BytesIO(raw)) as image: image.verify()
     with Image.open(io.BytesIO(raw)) as image: w,h=image.size;fmt=image.format
     if w<1200 or h<800:continue
     ext='.png' if fmt=='PNG' else '.jpg'
     rel=Path(folders[kind])/f'{name}__{ident.replace("/","-")}{ext}'
     dest=OUT/rel;dest.parent.mkdir(parents=True,exist_ok=True)
     if old:
      oldfile=OUT/old['本地文件']
      if oldfile.exists():
       backup=Path('/tmp/sylvan-rejected-photos')/old['本地文件'];backup.parent.mkdir(parents=True,exist_ok=True);oldfile.replace(backup)
      records.remove(old)
     dest.write_bytes(raw)
     query,note=QUERIES[kind][ident]
     note=(note+'；' if note else '')+'图库高清缩略版本，未裁剪；原图 '+str(i['width'])+'×'+str(i['height'])
     records.append({'分类':folders[kind],'ID':ident,'名称':name,'本地文件':str(rel),'像素':f'{w} × {h}',
      '宽':w,'高':h,'文件字节':len(raw),'图片标题':p['title'],'来源页面':i['descriptionurl'],'下载链接':url,
      '作者':clean(m.get('Artist',{}).get('value','')),'授权':clean(m.get('LicenseShortName',{}).get('value','')),
      '授权链接':m.get('LicenseUrl',{}).get('value',''),'备注':note,'搜索词':query,'获取日期':'2026-09-27'})
     save_manifest(records); print(f'OK {len(records)}/47 {name} {w}x{h} | {p["title"]}',flush=True)
     succeeded=True;break
    except Exception as e:
     print(f'DOWNLOAD ERROR {name}: {e}',flush=True)
     if 'RATE_LIMITED' in str(e):raise
   if not succeeded:failures.append(kind+'/'+ident)
   time.sleep(8)
 (OUT/'待处理.json').write_text(json.dumps(failures,ensure_ascii=False,indent=2))
 print(f'SAVED {len(records)}; pending {failures}',flush=True)

if __name__=='__main__':main()
