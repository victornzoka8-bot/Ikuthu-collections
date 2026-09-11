const CONSUMER_KEY = "cGCc6U0MOA3Ow8PJhcJQbeRVlyVzCAOwZ0FxmhmFT3aLOjaQ";
const CONSUMER_SECRET = "rgCP6yRN2dV0boxQP9FT1vEV0FJBS9ULVgF8PmtA1DhZbK1WcYD9q27F68TcwXUN";
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const SHORTCODE = "174379";

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Use POST" }), { status: 405, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
  try {
    const body = await request.json();
    const phone = body.phone;
    const amount = body.amount;
    const accountRef = body.accountRef || "IKUTHU";
    if (!phone || !amount) {
      return new Response(JSON.stringify({ success: false, error: "Phone and amount required" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    const baseUrl = "https://sandbox.safaricom.co.ke";
    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
    const tokenText = await tokenRes.text();
    let tokenData; try { tokenData = JSON.parse(tokenText); } catch(e) { tokenData = {}; }
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ success: false, error: "Token failed - check keys", details: tokenText }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    const date = new Date();
    const timestamp = date.getFullYear().toString() + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0') + String(date.getHours()).padStart(2,'0') + String(date.getMinutes()).padStart(2,'0') + String(date.getSeconds()).padStart(2,'0');
    const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);
    const payload = { BusinessShortCode: SHORTCODE, Password: password, Timestamp: timestamp, TransactionType: "CustomerPayBillOnline", Amount: Math.round(amount), PartyA: phone, PartyB: SHORTCODE, PhoneNumber: phone, CallBackURL: "https://ikuthu-collections.pages.dev/api/mpesa/callback", AccountReference: accountRef, TransactionDesc: "Ikuthu Order" };
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, { method: "POST", headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const stkText = await stkRes.text();
    let stkData; try { stkData = JSON.parse(stkText); } catch(e) { return new Response(JSON.stringify({ success: false, error: "STK returned non-JSON", details: stkText }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
    if (stkData.ResponseCode === "0") {
      return new Response(JSON.stringify({ success: true, CheckoutRequestID: stkData.CheckoutRequestID, message: stkData.CustomerMessage }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    } else {
      return new Response(JSON.stringify({ success: false, error: stkData.errorMessage || stkData.ResponseDescription || "STK Failed", details: stkData }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: "Server error: " + e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
