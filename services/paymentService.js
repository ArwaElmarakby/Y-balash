// services/paymentService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.processPayout = async (seller, amount, cardToken) => {
  try {
    // 1. إنشاء مستلم الدفع (Seller كـ Stripe Connect Account)
    const account = await stripe.accounts.create({
      type: 'express',
      email: seller.email,
      business_type: 'individual',
      individual: {
        first_name: seller.firstName,
        last_name: seller.lastName,
        email: seller.email
      }
    });

    // 2. ربط البطاقة بالمستلم
    const externalAccount = await stripe.accounts.createExternalAccount(
      account.id,
      { external_account: cardToken }
    );

    // 3. تنفيذ عملية السحب
    const payout = await stripe.payouts.create({
      amount: amount * 100, // تحويل المبلغ إلى سنتات
      currency: 'egp',
      destination: externalAccount.id,
      statement_descriptor: 'Yabalash Payout'
    });

    return {
      success: true,
      payoutId: payout.id,
      amount: payout.amount / 100,
      status: payout.status
    };
  } catch (error) {
    console.error('Stripe Payout Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};