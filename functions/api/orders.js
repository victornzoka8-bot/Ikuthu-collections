export async function onRequest(context){
  try{
    const db = context.env.DB;
    const { results } = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100").all();
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }catch(e){
    return new Response(JSON.stringify({error:e.message, empty:[]}), {
      status:500,
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*"}
    });
  }
}
export async function onRequestGet(c){ return onRequest(c); }
