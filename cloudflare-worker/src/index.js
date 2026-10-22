const PROMPT = `Extract data from this RK DEVELOPERS handwritten labour payment sheet. Read cells by their table positions, not just text order. Return ONLY JSON: {"date":"","site":"","phone":"","labourName":"","text":"","rows":[{"category":"","persons":"","rate":"","amount":""}]}. Allowed categories: Mason, Female Cooly, Mason Cooly, Tea & Bus, Maestri, Painter, Carpenter, Tile Labour, Electrician, Centering, Advance. Only include filled rows. Preserve decimals such as 2.5. Do not invent unclear values: use empty string. Distinguish the printed company telephone from worker phone; do not use printed company phone. Amount is the written amount for that row. Advance is a deduction. In text, provide clear line-by-line transcription of filled rows using category persons rate, and include header details (Date:, Site:, Labour Name:, Phone:) when confidently read. No markdown.`;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const safe=(v)=>typeof v==="string"?v:"";
const matchToken=(provided,expected)=>{if(!provided||!expected)return false;let diff=provided.length^expected.length;for(let i=0;i<Math.max(provided.length,expected.length);i++)diff|=(provided.charCodeAt(i)||0)^(expected.charCodeAt(i)||0);return diff===0};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==="GET"&&url.pathname==="/health")return json({status:"ok",service:"rk-ai-scanner",provider:"gemini"});
  if(request.method!=="POST"||url.pathname!=="/scan")return json({error:"Not found"},404);
  const auth=request.headers.get("authorization")||"";
  if(!env.SCANNER_ACCESS_TOKEN||!matchToken(auth,"Bearer "+env.SCANNER_ACCESS_TOKEN))return json({error:"Unauthorized"},401);
  if(!env.GEMINI_API_KEY)return json({error:"Gemini key not configured"},503);
  const ct=request.headers.get("content-type")||"";
  if(!ct.toLowerCase().startsWith("multipart/form-data"))return json({error:"Multipart form required"},415);
  const len=Number(request.headers.get("content-length")||0);
  if(len>8*1024*1024+4096)return json({error:"Image too large (max 8MB)"},413);
  try{
   const form=await request.formData();
   const file=form.get("image");
   if(!file||typeof file==="string"||!["image/jpeg","image/png","image/webp"].includes(file.type))return json({error:"JPEG, PNG or WebP image required"},400);
   if(file.size>8*1024*1024)return json({error:"Image too large (max 8MB)"},413);
   const bytes=new Uint8Array(await file.arrayBuffer());
   let binary="";for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
   const base64=btoa(binary);
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
   let upstream;
   try{upstream=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(env.GEMINI_MODEL||"gemini-2.5-flash")+":generateContent",{
    method:"POST",signal:controller.signal,
    headers:{"content-type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
    body:JSON.stringify({contents:[{parts:[{text:PROMPT},{inline_data:{mime_type:file.type,data:base64}}]}],generationConfig:{responseMimeType:"application/json",temperature:0.1}})
   });}finally{clearTimeout(timeout)}
   if(!upstream.ok){console.log("Gemini provider status",upstream.status);return json({error:"Gemini request failed",providerStatus:upstream.status},502)}
   const result=await upstream.json();
   const content=result?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
   let parsed;try{parsed=JSON.parse(content)}catch{return json({error:"Gemini returned invalid JSON"},502)}
   const rows=Array.isArray(parsed.rows)?parsed.rows.slice(0,30).map(r=>({category:safe(r.category),persons:String(r.persons??""),rate:String(r.rate??""),amount:String(r.amount??"")})):[];
   return json({date:safe(parsed.date),site:safe(parsed.site),phone:safe(parsed.phone),labourName:safe(parsed.labourName),text:safe(parsed.text),rows});
  }catch(e){console.log("Scan failed",String(e).slice(0,160));return json({error:"Scan failed. Try a smaller, clearer image."},500)}
 }
};
