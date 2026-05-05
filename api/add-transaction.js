export default async function handler(req, res) {
    // CORS headers for preflight requests
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, type, amount, desc } = req.body;

    if (!username || !type || !amount) {
        return res.status(400).json({ error: 'Missing parameters: username, type, and amount are required' });
    }

    const firebaseURL = `https://planora-d4b14-default-rtdb.firebaseio.com/users/${username}.json`;

    try {
        // Fetch current user data from Firebase
        const response = await fetch(firebaseURL);
        const userData = await response.json();

        if (!userData) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        // Transactions might be an array or an object in Firebase depending on how it was saved
        let transactions = [];
        if (userData.transactions) {
            transactions = Array.isArray(userData.transactions) 
                ? userData.transactions 
                : Object.values(userData.transactions);
        }
        
        // Remove nulls if any
        transactions = transactions.filter(t => t !== null);

        const newTransaction = {
            id: Date.now(),
            type: type, // 'income' or 'expense'
            amount: Number(amount),
            desc: desc || (type === 'income' ? 'Qo\'shimcha kirim' : 'Boshqa xarajat'),
            date: Date.now()
        };

        transactions.push(newTransaction);

        // Update user data back to Firebase
        const updateResponse = await fetch(firebaseURL, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transactions })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update database');
        }

        res.status(200).json({ success: true, message: 'Transaction added successfully!', data: newTransaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
