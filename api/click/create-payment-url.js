export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, amount, returnUrl } = req.body || {};

    if (!username || !amount) {
        return res.status(400).json({ error: 'Username va to‘lov summasi kiritilishi shart' });
    }

    const SERVICE_ID = process.env.CLICK_SERVICE_ID || 'TEST_SERVICE_ID';
    const MERCHANT_ID = process.env.CLICK_MERCHANT_ID || 'TEST_MERCHANT_ID';
    const isTest = !process.env.CLICK_SERVICE_ID;

    const baseUrl = 'https://my.click.uz/services/pay';
    const params = new URLSearchParams({
        service_id: SERVICE_ID,
        merchant_id: MERCHANT_ID,
        amount: String(amount),
        transaction_param: String(username)
    });

    if (returnUrl) {
        params.append('return_url', returnUrl);
    }

    const payUrl = `${baseUrl}?${params.toString()}`;

    return res.status(200).json({
        success: true,
        pay_url: payUrl,
        service_id: SERVICE_ID,
        merchant_id: MERCHANT_ID,
        amount: Number(amount),
        username,
        is_test: isTest
    });
}
