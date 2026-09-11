const CONSUMER_KEY = "HHRp5YPAmRyrojqEBJE2I0AFgpHpKk1012haKDdLsalP3r26";
const CONSUMER_SECRET = "enBawZ3dGN2IJREhmhNJM1xsDKNRRalVDTNfdXA0uXtHDOFiKCfA94akf3IPLzM";
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const SHORTCODE = "174379";
const ENV = "sandbox";

export async function onRequestPost(context) {
  const { request } = context;
  try {
    const { phone, amount, accountRef } = await request.json();
    if (!phone ||!amount) {
      return new Response(JSON.stringify({ success: false, error: "Phone and amount required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const baseUrl = ENV === "live"? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
    const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ success: false, error: "Token failed", details: tokenData }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
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
      AccountReference: accountRef || "IKUTHU",
      TransactionDesc: "Ikuthu Order"
    };
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const stkData = await stkRes.json();
    if (stkData.ResponseCode === "0") {
      return new Response(JSON.stringify({ success: true, CheckoutRequestID: stkData.CheckoutRequestID, message: stkData.CustomerMessage }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    } else {
      return new Response(JSON.stringify({ success: false, error: stkData.ResponseDescription || stkData.errorMessage, details: stkData }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
