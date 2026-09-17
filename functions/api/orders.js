export async function onRequestGet(c){
  const db = c.env.DB;
  try{
    const d = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
    return Response.json(d.results);
  }catch(e){
    return Response.json({error: e.message}, {status: 500});
  }
}
