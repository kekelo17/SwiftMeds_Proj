/**
 * Campay integration — Cameroon mobile money (MTN MoMo / Orange Money) collections.
 * Docs: https://documenter.getpostman.com/view/4845251/RWar9Mwf
 *
 * Server-only. Never import this from a client component.
 */

const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || 'https://campay.net/api';

interface CampayTokenResponse {
  token: string;
}

interface CollectPaymentInput {
  amount: number;
  phone: string; // format: 6XXXXXXXX (no country code) or 2376XXXXXXXX, Campay accepts local format
  description: string;
  externalReference: string;
}

interface CampayCollectResponse {
  reference: string;
  ussd_code?: string;
  operator?: string;
  status?: string;
}

interface CampayTransactionStatus {
  reference: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  amount?: string;
  operator?: string;
  external_reference?: string;
}

async function getCampayToken(): Promise<string> {
  const res = await fetch(`${CAMPAY_BASE_URL}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.CAMPAY_USERNAME,
      password: process.env.CAMPAY_PASSWORD,
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.non_field_errors?.[0] || 'Failed to authenticate with Campay');
  return (data as CampayTokenResponse).token;
}

/** Initiates a "collect" request — sends a USSD payment prompt to the user's phone. */
export async function initiateCampayCollection(input: CollectPaymentInput): Promise<CampayCollectResponse> {
  const token = await getCampayToken();
  const res = await fetch(`${CAMPAY_BASE_URL}/collect/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(Math.round(input.amount)),
      currency: 'XAF',
      from: input.phone,
      description: input.description,
      external_reference: input.externalReference,
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.non_field_errors?.[0] || data?.message || 'Failed to initiate payment');
  return data;
}

/** Polls Campay for the current status of a transaction by its reference. */
export async function getCampayTransactionStatus(reference: string): Promise<CampayTransactionStatus> {
  const token = await getCampayToken();
  const res = await fetch(`${CAMPAY_BASE_URL}/transaction/${reference}/`, {
    headers: { Authorization: `Token ${token}` },
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to fetch transaction status');
  return data;
}

/** Pays out to a pharmacy's mobile money account (commission settlement). */
export async function initiateCampayPayout(input: CollectPaymentInput): Promise<CampayCollectResponse> {
  const token = await getCampayToken();
  const res = await fetch(`${CAMPAY_BASE_URL}/withdraw/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(Math.round(input.amount)),
      currency: 'XAF',
      to: input.phone,
      description: input.description,
      external_reference: input.externalReference,
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.non_field_errors?.[0] || 'Failed to initiate payout');
  return data;
}
