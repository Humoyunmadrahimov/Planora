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
        merchant_prepare_id,
        amount,
        action,
        error,
        error_note,
        sign_time,
        sign_string
    } = req.body || {};

    const SECRET_KEY = process.env.CLICK_SECRET_KEY || 'TEST_SECRET_KEY';

    // 1. Action tekshiruvi (Complete uchun action = 1 bo'lishi kerak)
    if (parseInt(action) !== 1) {
        return res.status(200).json({
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: null,
            error: -3,
            error_note: 'Noto‘g‘ri amal (Action must be 1 for Complete)'
        });
    }

    // 2. MD5 imzo tekshiruvi (Test rejimida o'tkazib yuborish mumkin)
    const isTest = !process.env.CLICK_SECRET_KEY || process.env.CLICK_SECRET_KEY === 'TEST_SECRET_KEY';
    if (!isTest && sign_string) {
        const expectedSign = crypto
            .createHash('md5')
            .update(`${click_trans_id}${service_id}${SECRET_KEY}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`)
            .digest('hex');

        if (expectedSign !== sign_string) {
            return res.status(200).json({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: null,
                error: -1,
                error_note: 'MD5 imzo xato (Invalid sign_string)'
            });
        }
    }

    // 3. Agar Click tomonida xatolik bo'lsa
    if (error && parseInt(error) < 0) {
        return res.status(200).json({
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: null,
            error: parseInt(error),
            error_note: error_note || 'Click to‘lovida xatolik yuz berdi'
        });
    }

    const username = merchant_trans_id;
    if (!username) {
        return res.status(200).json({
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: null,
            error: -5,
            error_note: 'Foydalanuvchi ko‘rsatilmadi'
        });
    }

    try {
        const firebaseURL = `https://planora-d4b14-default-rtdb.firebaseio.com/users/${username}.json`;
        const userResp = await fetch(firebaseURL);
        const userData = await userResp.json();

        if (!userData) {
            return res.status(200).json({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: null,
                error: -5,
                error_note: 'Foydalanuvchi topilmadi'
            });
        }

        let transactions = [];
        if (userData.transactions) {
            transactions = Array.isArray(userData.transactions)
                ? userData.transactions
                : Object.values(userData.transactions);
        }
        transactions = transactions.filter(t => t !== null);

        // Tranzaksiyaning avval qo'shilmaganini tekshirish (idempotency)
        const alreadyProcessed = transactions.some(t => t.click_trans_id && String(t.click_trans_id) === String(click_trans_id));
        
        if (!alreadyProcessed) {
            const newTransaction = {
                id: Date.now(),
                type: 'income',
                amount: Number(amount),
                desc: `Click to‘lovi (Tranzaksiya: #${click_trans_id})`,
                date: Date.now(),
                click_trans_id: String(click_trans_id),
                payment_method: 'click'
            };

            transactions.push(newTransaction);

            // Firebase'ga yangilaymiz
            const updateResponse = await fetch(firebaseURL, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions })
            });

            if (!updateResponse.ok) {
                throw new Error('Firebase yangilashda xatolik');
            }
        }

        const merchant_confirm_id = Date.now().toString();

        return res.status(200).json({
            click_trans_id: Number(click_trans_id),
            merchant_trans_id: String(merchant_trans_id),
            merchant_confirm_id: Number(merchant_confirm_id),
            error: 0,
            error_note: 'Success'
        });
    } catch (err) {
        console.error('Click Complete Error:', err);
        return res.status(200).json({
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: null,
            error: -7,
            error_note: 'Tranzaksiyani saqlashda xatolik'
        });
    }
}
