import crypto from 'crypto';

export default async function handler(req, res) {
    // CORS sozlamalari
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: -8, error_note: 'Method Not Allowed' });
    }

    const {
        click_trans_id,
        service_id,
        click_paydoc_id,
        merchant_trans_id,
        amount,
        action,
        error,
        error_note,
        sign_time,
        sign_string
    } = req.body || {};

    const SECRET_KEY = process.env.CLICK_SECRET_KEY || 'TEST_SECRET_KEY';

    // 1. Action va parametrlar tekshiruvi (Prepare uchun action = 0 bo'lishi kerak)
    if (parseInt(action) !== 0) {
        return res.status(200).json({
            click_trans_id,
            merchant_trans_id,
            merchant_prepare_id: null,
            error: -3,
            error_note: 'Noto‘g‘ri amal (Action must be 0 for Prepare)'
        });
    }

    // 2. MD5 imzo tekshiruvi (Test rejimida o'tkazib yuborish mumkin)
    const isTest = !process.env.CLICK_SECRET_KEY || process.env.CLICK_SECRET_KEY === 'TEST_SECRET_KEY';
    if (!isTest && sign_string) {
        const expectedSign = crypto
            .createHash('md5')
            .update(`${click_trans_id}${service_id}${SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`)
            .digest('hex');

        if (expectedSign !== sign_string) {
            return res.status(200).json({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: null,
                error: -1,
                error_note: 'MD5 imzo xato (Invalid sign_string)'
            });
        }
    }

    // 3. Foydalanuvchi (merchant_trans_id bu foydalanuvchi username yoki IDsi) bazada bormi?
    const username = merchant_trans_id;
    if (!username) {
        return res.status(200).json({
            click_trans_id,
            merchant_trans_id,
            merchant_prepare_id: null,
            error: -5,
            error_note: 'Foydalanuvchi ko‘rsatilmadi'
        });
    }

    try {
        const firebaseURL = `https://planora-d4b14-default-rtdb.firebaseio.com/users/${username}.json`;
        const response = await fetch(firebaseURL);
        const userData = await response.json();

        if (!userData) {
            return res.status(200).json({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: null,
                error: -5,
                error_note: 'Foydalanuvchi topilmadi'
            });
        }

        // Prepare ID yaratamiz (Unique ID)
        const merchant_prepare_id = Date.now().toString();

        // Muvaffaqiyatli javob
        return res.status(200).json({
            click_trans_id: Number(click_trans_id),
            merchant_trans_id: String(merchant_trans_id),
            merchant_prepare_id: Number(merchant_prepare_id),
            error: 0,
            error_note: 'Success'
        });
    } catch (err) {
        console.error('Click Prepare Error:', err);
        return res.status(200).json({
            click_trans_id,
            merchant_trans_id,
            merchant_prepare_id: null,
            error: -7,
            error_note: 'Ma‘lumotlar bazasida xatolik'
        });
    }
}
