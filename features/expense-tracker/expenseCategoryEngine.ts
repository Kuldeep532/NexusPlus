import type { ExpenseCategory, ExpenseCategorySuggestion } from './expenseTrackerTypes';

const RULES: Array<{ category: ExpenseCategory; patterns: RegExp[] }> = [
  { category: 'groceries', patterns: [/grocery/i, /grocer/i, /supermarket/i, /mart/i, /reliance\s*smart/i, /dmart/i, /bigbasket/i] },
  { category: 'tea-coffee', patterns: [/tea/i, /coffee/i, /cafe/i, /chai/i, /starbucks/i, /chaayos/i] },
  { category: 'food-dining', patterns: [/restaurant/i, /food/i, /pizza/i, /swiggy/i, /zomato/i, /domino/i, /mcdonald/i, /kfc/i] },
  { category: 'fuel', patterns: [/petrol/i, /diesel/i, /fuel/i, /indianoil/i, /bharat\s*petroleum/i, /hpcl/i] },
  { category: 'transport', patterns: [/uber/i, /ola/i, /rapido/i, /metro/i, /irctc/i, /transport/i] },
  { category: 'shopping', patterns: [/amazon/i, /flipkart/i, /myntra/i, /mall/i, /shopping/i] },
  { category: 'bills-utilities', patterns: [/electric/i, /water\s*bill/i, /gas\s*bill/i, /broadband/i, /airtel/i, /jio/i, /vodafone/i, /vi/i] },
  { category: 'healthcare', patterns: [/hospital/i, /clinic/i, /pharmacy/i, /medical/i, /apollo/i, /medplus/i] },
  { category: 'education', patterns: [/school/i, /college/i, /university/i, /course/i, /udemy/i, /coursera/i] },
  { category: 'entertainment', patterns: [/netflix/i, /spotify/i, /movie/i, /cinema/i, /bookmyshow/i, /youtube/i] },
  { category: 'subscriptions', patterns: [/subscription/i, /membership/i, /prime/i, /icloud/i, /google\s*one/i] },
  { category: 'travel', patterns: [/hotel/i, /airbnb/i, /makemytrip/i, /booking\.com/i, /flight/i] },
  { category: 'personal-care', patterns: [/salon/i, /barber/i, /spa/i, /beauty/i] },
  { category: 'electronics', patterns: [/croma/i, /reliance\s*digital/i, /electronics/i, /laptop/i, /mobile/i] },
  { category: 'fees-charges', patterns: [/fee/i, /charge/i, /convenience/i, /late\s*fee/i] },
  { category: 'cash-withdrawal', patterns: [/atm/i, /cash\s*withdraw/i] },
];

function cleanMerchantText(input: string | null): string | null {
  if (!input) return null;
  const value = input.replace(/\s+/g, ' ').trim().slice(0, 120);
  return value || null;
}

export function suggestExpenseCategory(merchantText: string | null): ExpenseCategorySuggestion {
  const merchantName = cleanMerchantText(merchantText);
  if (!merchantName) return { category: 'other', merchantName: null, confidence: 0 };

  let best: ExpenseCategorySuggestion = { category: 'other', merchantName, confidence: 0 };
  for (const rule of RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(merchantName));
    if (matched) {
      best = { category: rule.category, merchantName, confidence: 0.88 };
      break;
    }
  }
  return best;
}

export function resolveSavedCategory(suggestion: ExpenseCategorySuggestion): ExpenseCategorySuggestion {
  if (suggestion.confidence >= 0.8) return suggestion;
  return { ...suggestion, category: 'other', confidence: suggestion.confidence };
}
