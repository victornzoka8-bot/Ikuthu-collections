export async function onRequestGet(c){
  const db = c.env.DB;
  const url = new URL(c.request.url);
  const id = url.searchParams.get("id");
  const phone = url.searchParams.get("phone");

  try{
    let query, params;
    if(id){
      query = "SELECT * FROM orders WHERE id =?";
      params = [id];
    } else if(phone){
      query = "SELECT * FROM orders WHERE phone =? ORDER BY created_at DESC";
      params = [phone];
    } else {
      return Response.json({error: "Provide?id=ORDER_ID or?phone=NUMBER"}, {status: 400});
    }

    const d = await db.prepare(query).bind(...params).all();
    return Response.json(d.results);
  }catch(e){
    return Response.json({error: e.message}, {status: 500});
  }
}
