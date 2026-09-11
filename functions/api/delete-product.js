export async function onRequestPost(c){
  const {id} = await c.request.json();
  await c.env.DB.prepare("DELETE FROM products WHERE id=?").bind(id).run();
  return Response.json({ok:true});
}
