export async function onRequestPost(context) {
  const db = context.env.ikuthu_db || context.env.DB;
  const { id } = await context.request.json();
  if(!id) return new Response(JSON.stringify({success:false}), {status:400});
  await db.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
  return new Response(JSON.stringify({success:true, id}), {headers:{'Content-Type':'application/json'}});
}
