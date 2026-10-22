import http from 'node:http';
import crypto from 'node:crypto';
import Busboy from 'busboy';

const PORT = Number(process.env.PORT || 8080);
const MAX_IMAGE = 8 * 1024 * 1024;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const prompt = `Read this RK DEVELOPERS handwritten labour payment sheet. Return ONLY JSON with keys date, site, phone, labourName, text, rows. rows is an array of objects {category, persons, rate, amount}. Allowed categories: Mason, Female Cooly, Mason Cooly, Tea & Bus, Maestri, Painter, Carpenter, Tile Labour, Electrician, Centering, Advance. Read table cells by position. Do not guess unclear handwriting; use empty string for uncertain fields. Preserve decimal persons such as 2.5. Treat Advance as a deduction and preserve its amount. Do not use the company's printed contact number as the worker phone. text should be a concise transcription of the visible filled-in entries, not blank template rows. Return no markdown.`;
const send=(res,status,obj)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj))};
const equal=(a,b)=>{if(!a||!b)return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)};
function readImage(req){
 return new Promise((resolve,reject)=>{
  let image,tooLarge=false,failed=false;
  const busboy=Busboy({headers:req.headers,limits:{fileSize:MAX_IMAGE,files:1,fields:3,parts:4}});
  busboy.on('file',(field,file,info)=>{
   if(field!=='image'||!['image/jpeg','image/png','image/webp'].includes(info.mimeType)){file.resume();failed=true;return}
   const chunks=[];file.on('data',b=>chunks.push(b));file.on('limit',()=>{tooLarge=true});file.on('end',()=>{if(!tooLarge)image={mimeType:info.mimeType,data:Buffer.concat(chunks).toString('base64')}});
  });
  busboy.on('error',reject);busboy.on('finish',()=>{if(tooLarge)reject(new Error('Image exceeds 8MB'));else if(failed||!image)reject(new Error('Valid image field required'));else resolve(image)});
  req.pipe(busboy);
 });
}
const server=http.createServer(async(req,res)=>{
 if(req.method==='GET'&&req.url==='/health')return send(res,200,{status:'ok',service:'rk-ai-scanner'});
 if(req.method!=='POST'||req.url!=='/scan')return send(res,404,{error:'Not found'});
 const access=process.env.SCANNER_ACCESS_TOKEN||'';
 const bearer=(req.headers.authorization||'').replace(/^Bearer /i,'');
 if(!access||!equal(bearer,access))return send(res,401,{error:'Unauthorized'});
 if(!process.env.GEMINI_API_KEY)return send(res,503,{error:'Gemini API key not configured'});
 try{
  const image=await readImage(req);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),55000);
  let response;
  try{response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(MODEL)+':generateContent',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:prompt},{inline_data:{mime_type:image.mimeType,data:image.data}}]}],generationConfig:{responseMimeType:'application/json',temperature:0.1}})});}finally{clearTimeout(timer)}
  if(!response.ok){console.error('Gemini status',response.status);return send(res,502,{error:'AI provider request failed',providerStatus:response.status})}
  const body=await response.json();const output=body?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
  let parsed;try{parsed=JSON.parse(output)}catch{return send(res,502,{error:'AI returned invalid JSON'})}
  const rows=Array.isArray(parsed.rows)?parsed.rows.slice(0,30).map(r=>({category:String(r.category||''),persons:String(r.persons??''),rate:String(r.rate??''),amount:String(r.amount??'')})):[];
  return send(res,200,{date:String(parsed.date||''),site:String(parsed.site||''),phone:String(parsed.phone||''),labourName:String(parsed.labourName||''),text:String(parsed.text||''),rows});
 }catch(e){console.error('Scan error',e.message);return send(res,/8MB|Valid image/.test(e.message)?400:500,{error:/8MB|Valid image/.test(e.message)?e.message:'Scan failed'})}
});
server.requestTimeout=65000;
server.listen(PORT,'0.0.0.0',()=>console.log('Scanner backend listening on',PORT));
