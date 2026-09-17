const CONSUMER_KEY = "zsGfFMia7iqTrNT4Ntvy327E2fgERXOZyleCGR9SdOcdRvNp";
const CONSUMER_SECRET = "Q8qYGRj3yvUXQ7vivsNw43aGZwgp9G1sWC4ExMX9HyCuNwG4VdM38sLAWiF4SnGi";
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const SHORTCODE = "174379";

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  if (request.method === "OPTIONS") {
    return new Response(null, { 
      headers: { 
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "POST, OPTIONS", 
        "Access-Control-Allow-Headers": "Content-Type" 
      } 
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Use POST" }), { 
      status: 405, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }

  try {
    const body = await request.json();
    const phone = body.phone;
    const amount = body.amount;
    const customer_name = body.customer_name || body.name || "";
    const items = body.items ? JSON.stringify(body.items) : "";
    
    if (!phone || !amount) {
      return new Response(JSON.stringify({ success: false, error: "Phone and amount required" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    // Generate Order ID
    const orderId = "IKUTHU-" + Math.floor(1000 + Math.random() * 9000);
    
    const baseUrl = "https://sandbox.safaricom.co.ke";
    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { 
      headers: { Authorization: `Basic ${auth}` } 
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ success: false, error: "Token failed" }), { 
        status: 500, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    const date = new Date();
    const timestamp = date.getFullYear().toString() + 
      String(date.getMonth()+1).padStart(2,'0') + 
      String(date.getDate()).padStart(2,'0') + 
      String(date.getHours()).padStart(2,'0') + 
      String(date.getMinutes()).padStart(2,'0') + 
      String(date.getSeconds()).padStart(2,'0');
    
    const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);
    
    const payload = { 
      BusinessShortCode: SHORTCODE, 
      Password: password, 
      Timestamp: timestamp, 
      TransactionType: "CustomerPayBillOnline", 
      Amount: Math.round(amount), 
      PartyA: phone, 
      PartyB: SHORTCODE, 
      PhoneNumber: phone, 
      CallBackURL: "https://ikuthu-collections.pages.dev/api/mpesa/callback", 
      AccountReference: orderId, 
      TransactionDesc: "Ikuthu Order" 
    };

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, { 
      method: "POST", 
      headers: { 
        Authorization: `Bearer ${tokenData.access_token}`, 
        "Content-Type": "application/json" 
      }, 
      body: JSON.stringify(payload) 
    });
    
    const stkData = await stkRes.json();

    if (stkData.ResponseCode === "0") {
      // SAVE ORDER TO D1
      try{
        await db.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_name TEXT, phone TEXT, total REAL, status TEXT, items TEXT, checkout_id TEXT, mpesa_code TEXT, created_at TEXT)").run();
        await db.prepare("INSERT INTO orders (id, customer_name, phone, total, status, items, checkout_id, created_at) VALUES (?,?,?,?,?,?,?,?)")
          .bind(orderId, customer_name, phone, amount, "PENDING", items, stkData.CheckoutRequestID, new Date().toISOString()).run();
      }catch(e){ 
        console.log("DB save error", e.message) 
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        orderId: orderId, 
        CheckoutRequestID: stkData.CheckoutRequestID, 
        message: stkData.CustomerMessage 
      }), { 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: stkData.errorMessage || "STK Failed", details: stkData }), { 
        status: 400, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Server error: " + e.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }
}
