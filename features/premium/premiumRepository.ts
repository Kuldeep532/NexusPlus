import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { APP_API_BASE_URL } from '@/features/api-gateway/apiGatewayClient';
import type { PremiumPlan } from './premiumPlans';

const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';

function assertConfigured() {
  if (!APP_API_BASE_URL || !SUPABASE_KEY) throw new Error('SUPABASE_PREMIUM_NOT_CONFIGURED');
}

async function request<T>(path: string, options?: RequestInit, requireAuth = true): Promise<T> {
  assertConfigured();
  const token = requireAuth ? await getSupabaseAccessToken() : null;
  if (requireAuth && !token) throw new Error('AUTH_REQUIRED');

  const response = await fetch(APP_API_BASE_URL + path, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + (token ?? SUPABASE_KEY),
      Accept: 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) throw new Error('SUPABASE_PREMIUM_REQUEST_' + response.status);
  return response.json() as Promise<T>;
}

async function rpc<T>(name:string, body:Record<string,unknown>):Promise<T>{
  return request<T>('/v1/rpc/'+name,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
}

type PlanRow={plan_id:number;plan_code:string;plan_name:string;tier_level:number;description:string|null;price_inr:number|string;duration_days:number;blocks_ads:boolean;unlocks_premium_features:boolean;included_credits?:number;};
export type PremiumCatalogPlan=PremiumPlan&{code:string;tierLevel:number;durationDays:number;blocksAds:boolean;unlocksPremiumFeatures:boolean;description:string;includedCredits:number;};

type BundleRow={
  bundle_id:number;
  bundle_code:string;
  bundle_name:string;
  duration_days:number;
  price_inr:number|string;
  included_credits:number;
  tier_level:number;
  blocks_ads:boolean;
  unlocks_premium_features:boolean;
  description:string|null;
};

export async function getActivePremiumPlans():Promise<PremiumCatalogPlan[]>{
  const [baseRows, bundleRows] = await Promise.all([
    request<PlanRow[]>('/v1/table/subscription_plans?select=plan_id,plan_code,plan_name,tier_level,description,price_inr,duration_days,blocks_ads,unlocks_premium_features,included_credits&is_active=eq.true&order=tier_level.asc,duration_days.asc',undefined,false),
    request<BundleRow[]>('/v1/table/subscription_credit_bundles?select=bundle_id,bundle_code,bundle_name,duration_days,price_inr,included_credits,tier_level,blocks_ads,unlocks_premium_features,description&is_active=eq.true&order=price_inr.asc',undefined,false).catch(() => []),
  ]);
  const base = baseRows.map(r=>({id:String(r.plan_id),name:r.plan_name,amount:Number(r.price_inr),code:r.plan_code,tierLevel:r.tier_level,durationDays:r.duration_days,blocksAds:r.blocks_ads,unlocksPremiumFeatures:r.unlocks_premium_features,description:r.description??'',includedCredits:Number(r.included_credits??0)}));
  const bundles = bundleRows.map(r=>({id:'bundle:' + String(r.bundle_id),name:r.bundle_name,amount:Number(r.price_inr),code:r.bundle_code,tierLevel:r.tier_level,durationDays:r.duration_days,blocksAds:r.blocks_ads,unlocksPremiumFeatures:r.unlocks_premium_features,description:r.description??'',includedCredits:Number(r.included_credits)}));
  return [...base, ...bundles].sort((a,b)=>a.amount-b.amount);
}

export async function createSubscriptionBundleOrder(bundleCode:string){
  return rpc<{orderId:string;productType:string;planCode:string;amountInr:number;includedCredits:number;durationDays:number;upiId:string;receiverName:string;provider:string;status:string}>(
    'create_subscription_bundle_order',
    {p_bundle_code:bundleCode},
  );
}

export type PremiumEntitlement={status:string|null;planCode:string|null;planName:string|null;tierLevel:number;expiresAt:string|null;blocksAds:boolean;unlocksPremiumFeatures:boolean;productScope:'nexus_plus';};
export async function getMyPremiumEntitlement():Promise<PremiumEntitlement>{
  const rows=await rpc<PremiumEntitlement[]>('get_my_premium_entitlement',{});
  return Array.isArray(rows)?(rows[0]??{status:null,planCode:null,planName:null,tierLevel:1,expiresAt:null,blocksAds:false,unlocksPremiumFeatures:false,productScope:'nexus_plus'}):rows;
}
export async function getMyAiCreditBalance():Promise<number>{return rpc<number>('get_my_ai_credit_balance',{});}
export type AiCreditPlan={id:string;code:string;name:string;credits:number;amount:number;tagline:string;};
export async function getActiveAiCreditPlans():Promise<AiCreditPlan[]>{
  const rows=await request<Array<{credit_plan_id:number;plan_code:string;plan_name:string;credits_offered:number;price_inr:number|string;tagline:string|null;}>>('/v1/table/credit_plans?select=credit_plan_id,plan_code,plan_name,credits_offered,price_inr,tagline&is_active=eq.true&order=credits_offered.asc',undefined,false);
  return rows.map(r=>({id:String(r.credit_plan_id),code:r.plan_code,name:r.plan_name,credits:r.credits_offered,amount:Number(r.price_inr),tagline:r.tagline??''}));
}
export type PaymentSettings={upiId:string;receiverName:string;instructions:string;provider:string;};
export async function getPaymentSettings():Promise<PaymentSettings>{
  const rows=await request<Array<{setting_key:string;setting_value:string}>>('/v1/table/payment_settings?select=setting_key,setting_value&is_active=eq.true');
  const m=Object.fromEntries(rows.map(r=>[r.setting_key,r.setting_value]));
  if(!m.upi_id)throw new Error('PAYMENT_NOT_CONFIGURED');
  return{upiId:m.upi_id,receiverName:m.payment_receiver_name??'Nexus Plus',instructions:m.payment_instructions??'Complete the UPI payment. Nexus Plus will verify the bank/payment notification automatically.',provider:m.payment_provider??'upi_sms'};
}
export async function createPaymentOrder(productType:'PREMIUM'|'AI_CREDITS',planCode:string){return rpc<{orderId:string;amountInr:number;upiId:string;receiverName:string;provider:string;status:string}>('create_payment_order',{p_product_type:productType,p_plan_code:planCode});}
export async function submitPaymentReference(_orderId:string,_reference:string){throw new Error('MANUAL_UTR_NOT_REQUIRED');}
export type PremiumFeatureCatalogRow={feature_code:string;feature_name:string;access_type:'FREE'|'CREDIT_BASED'|'PREMIUM_ONLY';min_tier:number;credit_cost:number;is_active:boolean;description:string|null;};
export async function getPremiumFeatureCatalog():Promise<PremiumFeatureCatalogRow[]>{return request<PremiumFeatureCatalogRow[]>('/v1/table/premium_feature_catalog?select=feature_code,feature_name,access_type,min_tier,credit_cost,is_active,description&is_active=eq.true&order=feature_code.asc');}
export async function adminSetPremiumFeature(input:Omit<PremiumFeatureCatalogRow,'feature_name'>){return rpc('admin_set_premium_feature',{p_feature_code:input.feature_code,p_access_type:input.access_type,p_min_tier:input.min_tier,p_credit_cost:input.credit_cost,p_is_active:input.is_active,p_description:input.description??null});}
export async function adminListPendingOrders(){return rpc<Array<{order_id:string;user_id:string;product_type:string;plan_code:string;amount_inr:number|string;upi_id:string;status:string;payment_reference:string|null;created_at:string}>>('admin_list_pending_orders',{});}
export async function adminVerifyPayment(orderId:string,approved:boolean,reference?:string){return rpc('admin_verify_payment',{p_order_id:orderId,p_approved:approved,p_payment_reference:reference??null});}
export async function canPurchaseCreditTopup():Promise<boolean>{return rpc<boolean>('can_purchase_credit_topup',{});}
