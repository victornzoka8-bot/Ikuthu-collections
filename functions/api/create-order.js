export async function onRequest(context){return handle(context)}
export async function onRequestPost(context){return handle(context)}
async function handle(context){
 try{
  const b = await context.request.json();
  const env = context.env;
  const db = env.ikuthu_db || env.DB;
  const now = new Date().toISOString();
  const id = b.id || 'IKU-'+Math.floor(100000+Math.random()*899999);
  await db.prepare(
    `INSERT OR REPLACE INTO orders (id, name, email, phone, mpesa_phone, address, town, area, landmark, total, subtotal, delivery_fee, payment_method, status, items, checkout_request_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, b.customer_name||'Customer', b.customer_email||'', String(b.phone||'0700000000'), String(b.mpesa_phone||b.phone||'0700000000'), b.address||'', b.town||'', b.area||'', b.landmark||'', parseInt(b.total||0), parseInt(b.subtotal||b.total||0), parseInt(b.delivery_fee||0), b.payment_method||'cod', b.status||'PAID', typeof b.items==='string'?b.items:JSON.stringify(b.items||[]), b.checkout_request_id||'', now, now).run();
  return new Response(JSON.stringify({success:true, id}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
 }catch(e){
  return new Response(JSON.stringify({success:false,error:e.message}),{status:500,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}})
 }
}
