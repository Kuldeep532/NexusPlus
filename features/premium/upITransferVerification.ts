import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';

type SmsCandidate = {
  amountInr: number;
  receiverUpi: string;
  bankReference: string;
  message: string;
  observedAt: string;
};

function headers(token: string) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + token,
    'content-type': 'application/json',
    Accept: 'application/json',
  };
}

export function parseUpiBankCreditSms(message: string): SmsCandidate | null {
  const text = message.replace(/\s+/g, ' ').trim();
  const credit = /(?:credited|credit of|received|received payment)/i.test(text);
  if (!credit) return null;

  const amountMatch =
    text.match(/(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i) ??
    text.match(/(?:credited|received)[^0-9]{0,20}([0-9,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;

  const reference =
    text.match(/(?:UPI\s*(?:Ref(?:erence)?|Txn|Transaction)|RRN|Ref(?:erence)?(?:\s*No)?)[^0-9]*([0-9]{6,})/i)?.[1];
  if (!reference) return null;

  const vpa =
    text.match(/(?:to|from|VPA|UPI)[^\s,;:]*\s*([A-Za-z0-9._-]+@[A-Za-z0-9.-]+)/i)?.[1] ??
    text.match(/([A-Za-z0-9._-]+@[A-Za-z0-9.-]+)/)?.[1] ??
    '';

  return {
    amountInr: Number(amountMatch[1].replace(/,/g, '')),
    receiverUpi: vpa,
    bankReference: reference,
    message: text,
    observedAt: new Date().toISOString(),
  };
}

export async function submitBankCreditSms(orderId: string, candidate: SmsCandidate) {
  const token = await getSupabaseAccessToken();
  if (!token) throw new Error('AUTH_REQUIRED');
  const response = await fetch(
    SUPABASE_URL + '/rest/v1/rpc/submit_bank_credit_notification',
    {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        p_order_id: orderId,
        p_amount_inr: candidate.amountInr,
        p_receiver_upi: candidate.receiverUpi,
        p_bank_reference: candidate.bankReference,
        p_message: candidate.message,
        p_observed_at: candidate.observedAt,
      }),
    },
  );
  if (!response.ok) throw new Error('BANK_SMS_VERIFICATION_FAILED');
  return response.json() as Promise<{ ok: boolean; status: string; orderId?: string }>;
}
