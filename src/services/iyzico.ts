// iyzico.ts — Sandbox modunda çalışır, API key gelince canlıya geçer

export type PaymentRequest = {
  amount: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
};

export type PaymentResult = {
  success: boolean;
  paymentId?: string;
  errorMessage?: string;
};

export async function processPayment(req: PaymentRequest): Promise<PaymentResult> {
  const apiKey = process.env.IYZICO_API_KEY;

  // API key yoksa sandbox test modu — gerçek para gitmiyor
  if (!apiKey || apiKey === 'your_iyzico_api_key') {
    console.log(`[iyzico SANDBOX] ₺${req.amount} ödeme simüle ediliyor...`);
    await new Promise(r => setTimeout(r, 500));
    return {
      success: true,
      paymentId: `SANDBOX_${Date.now()}`,
    };
  }

  // Gerçek iyzico API çağrısı
  try {
    const crypto = require('crypto');
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';
    const secretKey = process.env.IYZICO_SECRET_KEY || '';
    const randomKey = Math.random().toString(36).substring(2);

    const hashStr = `${apiKey}${randomKey}${secretKey}${req.amount.toFixed(2)}TRY`;
    const hash = crypto.createHash('sha256').update(hashStr).digest('base64');

    const payload = {
      locale: 'tr',
      conversationId: `${req.studentId}_${Date.now()}`,
      price: req.amount.toFixed(2),
      paidPrice: req.amount.toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId: `SP_${Date.now()}`,
      paymentChannel: 'MOBILE',
      paymentGroup: 'PRODUCT',
      paymentCard: {
        cardHolderName: req.studentName,
        cardNumber: '5528790000000008', // Sandbox test kartı
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        registerCard: '0',
      },
      buyer: {
        id: req.studentId,
        name: req.studentName.split(' ')[0] || 'Ogrenci',
        surname: req.studentName.split(' ').slice(1).join(' ') || 'Kullanici',
        gsmNumber: '+905350000000',
        email: req.studentEmail,
        identityNumber: '74300864791',
        registrationAddress: 'Nisantasi Universitesi, Istanbul',
        ip: '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: { contactName: req.studentName, city: 'Istanbul', country: 'Turkey', address: 'Nisantasi' },
      billingAddress: { contactName: req.studentName, city: 'Istanbul', country: 'Turkey', address: 'Nisantasi' },
      basketItems: [{
        id: 'SHUTTLE_BALANCE',
        name: 'Okul Karti Bakiye Yukleme',
        category1: 'Ulasim',
        itemType: 'VIRTUAL',
        price: req.amount.toFixed(2),
      }],
    };

    const response = await fetch(`${baseUrl}/payment/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `IYZWS ${apiKey}:${hash}`,
        'x-iyzi-rnd': randomKey,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as any;

    if (result.status === 'success') {
      return { success: true, paymentId: result.paymentId };
    }
    return { success: false, errorMessage: result.errorMessage || 'Ödeme başarısız' };
  } catch (err: any) {
    return { success: false, errorMessage: err.message };
  }
}
