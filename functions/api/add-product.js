export async function onRequestPost(c){
  const b = await c.request.json();
  await c.env.DB.prepare("INSERT INTO products (name, price, image, category, description, images, sizes, stock) VALUES (?,?,?,?,?,?,?,?)").bind(b.name, b.price, b.image, b.category, b.description, b.image, b.sizes, 'In Stock').run();
  return Response.json({ok:true});
}
