export async function onRequest(context){
  return new Response(JSON.stringify({ResultCode:0,ResultDesc:"Accepted"}),{headers:{"Content-Type":"application/json"}});
}
