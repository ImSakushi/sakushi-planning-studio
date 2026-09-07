import fs from 'node:fs/promises';
const output = new URL('../public/data/',import.meta.url);
const source='https://raw.githubusercontent.com/jsnli/steamappidlist/master/data/';
try {
  const datasets=await Promise.all(['games_appid.json','dlc_appid.json'].map(async name=>{
    const response=await fetch(source+name,{signal:AbortSignal.timeout(60000)});
    if(!response.ok)throw new Error(`${name}: ${response.status}`);
    const rows=await response.json();
    if(!Array.isArray(rows)||rows.length<1000)throw new Error('Incomplete Steam catalogue');
    return rows;
  }));
  const games=new Map();
  for(const row of datasets.flat())if(Number.isSafeInteger(row.appid)&&typeof row.name==='string'&&row.name.trim())games.set(row.appid,row.name);
  await fs.mkdir(output,{recursive:true});
  await fs.writeFile(new URL('games.json',output),JSON.stringify([...games.entries()].sort((a,b)=>a[0]-b[0])));
  await fs.writeFile(new URL('catalogue-meta.json',output),JSON.stringify({source:'https://github.com/jsnli/steamappidlist',updated:new Date().toISOString().slice(0,10),count:games.size},null,2));
  console.log(`Steam catalogue updated: ${games.size} games and DLCs`);
} catch(error) {
  const fallback=JSON.parse(await fs.readFile(new URL('games.json',output),'utf8'));
  if(!Array.isArray(fallback)||fallback.length<1000)throw error;
  console.warn(`Catalogue refresh unavailable (${error.message}); using the checked-in snapshot.`);
}
