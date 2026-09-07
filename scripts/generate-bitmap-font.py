from fontTools.ttLib import TTFont
from PIL import Image, ImageFont, ImageDraw
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];path=root/'public/fonts/DeterminationMono.ttf'
tt=TTFont(path);cmap=tt.getBestCmap();chars=sorted(c for c in cmap if c>=32)
meta={}
for size in range(12,33):
 font=ImageFont.truetype(str(path),size,layout_engine=ImageFont.Layout.BASIC)
 atlas=Image.new('RGBA',(640,48*((len(chars)+15)//16)),(255,255,255,0));glyphs={}
 for i,code in enumerate(chars):
  tile=Image.new('1',(40,48));ImageDraw.Draw(tile).text((4,36),chr(code),font=font,fill=1,anchor='ls')
  bbox=tile.getbbox();advance=tt['hmtx'][cmap[code]][0]*size/tt['head'].unitsPerEm
  if bbox:
   x,y,w,h=bbox[0],bbox[1],bbox[2]-bbox[0],bbox[3]-bbox[1];tx=(i%16)*40;ty=(i//16)*48
   sprite=Image.new('RGBA',(w,h),'white');sprite.putalpha(tile.crop(bbox).convert('L'));atlas.paste(sprite,(tx,ty))
   glyphs[chr(code)]=[tx,ty,w,h,x-4,y-36,advance]
  else:glyphs[chr(code)]=[0,0,0,0,0,0,advance]
 atlas.save(root/f'public/fonts/bitmap/{size}.png',optimize=True);meta[str(size)]=glyphs
(root/'lib/bitmap-font.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')))
print('Generated 21 monochrome atlases from the original regular (400) font.')
