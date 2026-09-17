export async function onRequest(context){return handle(context)}
export async function onRequestPost(context){return handle(context)}
async function handle(context){
 try{
  const b=await context.request.json();
  const id=b.id||'IKU-'+Math.floor(100000+Math.random()*899999);
  await context.env.DB.prepare("INSERT OR REPLACE INTO orders (id, phone, total, status, mpesa_code, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))").bind(id,String(b.phone||'07'),parseInt(b.total||0),b.status||'PAID',b.mpesa_code||'COD').run();
  return new Response(JSON.stringify({success:true,id}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
 }catch(e){
  return new Response(JSON.stringify({success:false,error:e.message}),{status:500,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
 }
}
