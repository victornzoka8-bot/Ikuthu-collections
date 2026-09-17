export async function onRequest(context){
  const { request, env } = context;
  const db = env.DB;
  if(request.method === "OPTIONS"){
    return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
  }
  try{
    const body = await request.json();
    const { id, status } = body;
    if(!id || !status){
      return new Response(JSON.stringify({success:false, error:"id and status required"}),{status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    }
    await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
    return new Response(JSON.stringify({success:true, message:`Order ${id} updated to ${status}`}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }catch(e){
    return new Response(JSON.stringify({success:false, error:e.message}),{status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}
