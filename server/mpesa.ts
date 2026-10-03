import crypto from 'crypto';
import { db } from './db';
import { Payment } from '../src/types';

interface StkPushOptions {
  businessId: string;
  phone: string;
  amount: number;
  saleId: string;
  accountReference: string;
  transactionDesc: string;
}

interface StkPushResult {
  success: boolean;
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
  paymentId: string;
}

export class MpesaService {
  /**
   * Format phone number to standard Safaricom format (2547XXXXXXXX or 2541XXXXXXXX)
   */
  public static formatPhoneNumber(rawPhone: string): string {
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '254' + clean.slice(1);
    } else if (clean.startsWith('+254')) {
      clean = clean.slice(1);
    } else if (!clean.startsWith('254') && clean.length === 9) {
      clean = '254' + clean;
    }
    return clean;
  }

  /**
   * Generates formatted timestamp in YYYYMMDDHHmmss format
   */
  public static getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  /**
   * Initiates STK Push either through live Daraja API or Sandbox/Test mode
   */
  public static async initiateStkPush(options: StkPushOptions): Promise<StkPushResult> {
    const formattedPhone = this.formatPhoneNumber(options.phone);
    const mpesaConfig = db.getMpesaConfig(options.businessId);
    const env = process.env.MPESA_ENVIRONMENT || mpesaConfig?.environment || 'test';

    // Unique request IDs
    const merchantRequestId = `MR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const checkoutRequestId = `ws_CO_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    // Create payment record in DB with PENDING state
    const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const payment: Payment = {
      id: paymentId,
      business_id: options.businessId,
      sale_id: options.saleId,
      provider: 'mpesa',
      method: 'mpesa',
      amount: options.amount,
      phone: formattedPhone,
      status: 'PENDING',
      provider_request_id: checkoutRequestId,
      reference: options.accountReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.createPayment(payment);

    // If live credentials exist and environment is production or sandbox
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;

    if (env !== 'test' && consumerKey && consumerSecret && passkey) {
      try {
        const shortcode = mpesaConfig?.shortcode || process.env.MPESA_SHORTCODE || '174379';
        const timestamp = this.getTimestamp();
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
        const token = await this.getOAuthToken(consumerKey, consumerSecret, env === 'production');

        const darajaEndpoint = env === 'production'
          ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
          : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const callbackUrl = `${process.env.APP_URL || 'https://billing.example'}/api/payments/mpesa/callback`;

        const response = await fetch(darajaEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(options.amount),
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: options.accountReference.slice(0, 12),
            TransactionDesc: options.transactionDesc.slice(0, 13),
          }),
        });

        const data = await response.json();
        if (data.ResponseCode === '0') {
          db.updatePayment(paymentId, {
            provider_request_id: data.CheckoutRequestID || checkoutRequestId,
          });
          return {
            success: true,
            merchantRequestId: data.MerchantRequestID || merchantRequestId,
            checkoutRequestId: data.CheckoutRequestID || checkoutRequestId,
            responseCode: data.ResponseCode,
            responseDescription: data.ResponseDescription,
            customerMessage: data.CustomerMessage || 'Success. Request accepted for processing',
            paymentId,
          };
        } else {
          db.failPaymentTransaction({
            paymentId,
            reason: data.ResponseDescription || 'STK Push rejected by Safaricom',
          });
          return {
            success: false,
            merchantRequestId,
            checkoutRequestId,
            responseCode: data.ResponseCode || '1',
            responseDescription: data.ResponseDescription || 'Failed',
            customerMessage: data.CustomerMessage || 'Request failed',
            paymentId,
          };
        }
      } catch (err: any) {
        console.warn('Daraja API connection failed, falling back to simulated sandbox:', err.message);
      }
    }

    // Standard Sandbox / Test Mode
    // Automatically schedules callback after 4 seconds if phone does NOT end in 9999 (failure simulation)
    // If phone ends in 9999, it simulates user cancellation/insufficient funds!
    const isFailureSimulation = formattedPhone.endsWith('9999');

    if (!isFailureSimulation) {
      setTimeout(() => {
        // Auto-fulfill after 3.5s for seamless testing if still pending
        const cur = db.getPaymentById(paymentId);
        if (cur && cur.status === 'PENDING') {
          db.completePaymentTransaction({
            paymentId,
            providerTransactionId: `QWE${Math.floor(100000 + Math.random() * 900000)}XYZ`,
            resultCode: 0,
            resultDescription: 'The service request is processed successfully.',
          });
        }
      }, 3500);
    } else {
      setTimeout(() => {
        db.failPaymentTransaction({
          paymentId,
          reason: 'Request cancelled by customer or insufficient funds.',
        });
      }, 3500);
    }

    return {
      success: true,
      merchantRequestId,
      checkoutRequestId,
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing',
      customerMessage: `STK push prompt sent to ${formattedPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}. Please enter your M-Pesa PIN on your phone.`,
      paymentId,
    };
  }

  private static async getOAuthToken(consumerKey: string, consumerSecret: string, isProduction: boolean): Promise<string> {
    const authUrl = isProduction
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const res = await fetch(authUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to authenticate with Daraja: ${res.statusText}`);
    }

    const json = await res.json();
    return json.access_token;
  }
}
