export async function onRequestPost(context) {
  const { request } = context;
  try {
    const data = await request.json();
    console.log("MPESA CALLBACK:", JSON.stringify(data));
  } catch(e){}
  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), { headers: { "Content-Type": "application/json" } });
}
export async function onRequestGet() {
  return new Response("Callback OK - POST only", { status: 200 });
}
