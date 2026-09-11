export async function onRequestGet(c){
  const db = c.env.DB;
  try{
    const d = await db.prepare("SELECT * FROM products ORDER BY id DESC").all();
    return Response.json(d.results);
  }catch(e){
    return Response.json([]);
  }
}
