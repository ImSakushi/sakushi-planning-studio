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

# The source outlines use a 75-unit pixel grid. Sample that grid directly,
# without FreeType hinting, for exact integer enlargement of schedule labels.
from math import floor, ceil
native_atlas=Image.new('RGBA',(256,24*((len(chars)+15)//16)),(255,255,255,0))
native_glyphs={}
for i,code in enumerate(chars):
 coords,ends,flags=tt['glyf'][cmap[code]].getCoordinates(tt['glyf'])
 assert all(flag & 1 for flag in flags), 'Native pixel glyphs must have straight contours'
 advance=tt['hmtx'][cmap[code]][0]/75
 if not coords:
  native_glyphs[chr(code)]=[0,0,0,0,0,0,advance];continue
 xmin=floor(min(x for x,y in coords)/75);xmax=ceil(max(x for x,y in coords)/75)
 ymin=floor(min(y for x,y in coords)/75);ymax=ceil(max(y for x,y in coords)/75)
 contours=[];start=0
 for end in ends:contours.append(list(coords[start:end+1]));start=end+1
 sprite=Image.new('RGBA',(xmax-xmin,ymax-ymin),(255,255,255,0))
 for row in range(sprite.height):
  for col in range(sprite.width):
   px=(xmin+col+.5)*75;py=(ymax-row-.5)*75;inside=False
   for contour in contours:
    for a,b in zip(contour,contour[1:]+contour[:1]):
     if (a[1]>py)!=(b[1]>py) and px < (b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0]:inside=not inside
   if inside:sprite.putpixel((col,row),(255,255,255,255))
 tx=(i%16)*16;ty=(i//16)*24
 assert sprite.width<=16 and sprite.height<=24
 native_atlas.paste(sprite,(tx,ty))
 native_glyphs[chr(code)]=[tx,ty,sprite.width,sprite.height,xmin,-ymax,advance]
native_atlas.save(root/'public/fonts/bitmap/0.png',optimize=True)
meta['0']=native_glyphs
(root/'lib/bitmap-font.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')))
print('Generated native 75-unit grid atlas for exact 2× schedule text.')
