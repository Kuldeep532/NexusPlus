export type CalculatorIntent = 'math' | 'market' | 'investment' | 'personal-finance' | 'currency' | 'salary' | 'unknown';

export type AnalysisRow = { label: string; value: string };

export type CalculatorAnalysis = {
  exactAnswer: string;
  analysis: AnalysisRow[];
  suggestions: string[];
};

export type CurrencyQuote = { base: string; quote: string; rate: number; asOf: string; source: 'live' | 'cache' };
export type MarketQuote = { symbol: string; price: number; changePercent: number; asOf: string; source: 'live' | 'cache' };

export function detectCalculatorIntent(input: string): CalculatorIntent {
  const text = input.toLowerCase();
  if (/(usd|inr|eur|gbp|jpy|aed|currency|exchange rate|convert)/.test(text)) return 'currency';
  if (/(salary|ctc|take home|net pay|gross pay|hra|pf|professional tax)/.test(text)) return 'salary';
  if (/(stock|share|stop loss|target|risk.?reward|pnl|profit and loss|nifty|sensex)/.test(text)) return 'market';
  if (/(sip|mutual fund|lumpsum|lump sum|step.?up|cagr|investment)/.test(text)) return 'investment';
  if (/(gst|income tax|tax|emi|loan|fd|fixed deposit|interest)/.test(text)) return 'personal-finance';
  if (/[+\-*/%^()]|equation|solve|integral|derivative|sin|cos|tan|sqrt|log/.test(text)) return 'math';
  return 'unknown';
}

export function calculateSip(monthly: number, annualRate: number, months: number, stepUpPercent = 0) {
  assertPositive(monthly, 'Monthly SIP');
  assertNonNegative(annualRate, 'Annual return');
  if (!Number.isInteger(months) || months < 1) throw new Error('SIP tenure must be at least 1 month.');
  assertNonNegative(stepUpPercent, 'Step-up percentage');
  let invested = 0;
  let value = 0;
  const monthlyRate = annualRate / 1200;
  for (let month = 1; month <= months; month += 1) {
    const yearIndex = Math.floor((month - 1) / 12);
    const contribution = monthly * Math.pow(1 + stepUpPercent / 100, yearIndex);
    invested += contribution;
    value = (value + contribution) * (1 + monthlyRate);
  }
  return { invested, gains: value - invested, maturity: value };
}

export function calculateLumpsum(principal: number, annualRate: number, years: number) {
  assertPositive(principal, 'Principal');
  assertNonNegative(annualRate, 'Annual return');
  assertPositive(years, 'Tenure');
  const maturity = principal * Math.pow(1 + annualRate / 100, years);
  return { invested: principal, gains: maturity - principal, maturity };
}

export function calculateCagr(initial: number, final: number, years: number) {
  assertPositive(initial, 'Initial value');
  assertPositive(final, 'Final value');
  assertPositive(years, 'Years');
  return (Math.pow(final / initial, 1 / years) - 1) * 100;
}

export function calculateGst(base: number, gstPercent: number, inclusive = false) {
  assertNonNegative(base, 'Base amount');
  assertNonNegative(gstPercent, 'GST rate');
  if (inclusive) {
    const preTax = base / (1 + gstPercent / 100);
    return { taxable: preTax, gst: base - preTax, total: base };
  }
  const gst = base * gstPercent / 100;
  return { taxable: base, gst, total: base + gst };
}

export function calculateLoanRiskReward(entry: number, stopLoss: number, target: number, quantity: number) {
  if (![entry, stopLoss, target].every(Number.isFinite) || quantity <= 0) throw new Error('Enter valid trade values.');
  const riskPerUnit = Math.abs(entry - stopLoss);
  const rewardPerUnit = Math.abs(target - entry);
  if (riskPerUnit === 0) throw new Error('Stop-loss cannot equal entry.');
  return {
    risk: riskPerUnit * quantity,
    reward: rewardPerUnit * quantity,
    ratio: rewardPerUnit / riskPerUnit,
    riskPercent: riskPerUnit / Math.abs(entry) * 100,
    rewardPercent: rewardPerUnit / Math.abs(entry) * 100,
  };
}

export function calculateTradePnl(entry: number, exit: number, quantity: number, side: 'buy' | 'sell' = 'buy') {
  if (![entry, exit].every(Number.isFinite) || quantity <= 0) throw new Error('Enter valid trade values.');
  const pnlPerUnit = side === 'buy' ? exit - entry : entry - exit;
  const pnl = pnlPerUnit * quantity;
  const invested = entry * quantity;
  return { pnl, returnPercent: invested === 0 ? 0 : (pnl / Math.abs(invested)) * 100 };
}

export function calculateSalaryGrossToNet(monthlyGross: number, monthlyTax: number, employeePf: number, otherDeductions = 0, employerContributions = 0) {
  assertNonNegative(monthlyGross, 'Monthly gross');
  assertNonNegative(monthlyTax, 'Monthly tax');
  assertNonNegative(employeePf, 'Employee PF');
  assertNonNegative(otherDeductions, 'Other deductions');
  assertNonNegative(employerContributions, 'Employer contributions');
  const net = monthlyGross - monthlyTax - employeePf - otherDeductions;
  return { netMonthly: net, netAnnual: net * 12, annualCtc: (monthlyGross + employerContributions) * 12 };
}

export function formatIndianNumber(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) throw new Error('Invalid numeric result.');
  return value.toLocaleString('en-IN', { maximumFractionDigits, minimumFractionDigits: 0 });
}

export function buildAnalysisRows(params: { principal?: number; result: number; annualInflationPercent?: number; years?: number; referenceRate?: number }) {
  const rows: AnalysisRow[] = [];
  if (params.principal != null && params.years != null && params.annualInflationPercent != null) {
    const realValue = params.result / Math.pow(1 + params.annualInflationPercent / 100, params.years);
    rows.push({ label: 'Inflation-adjusted value', value: formatIndianNumber(realValue) });
  }
  if (params.referenceRate != null) {
    rows.push({ label: 'Reference-rate gap', value: `${formatIndianNumber(params.result - params.referenceRate)} units` });
  }
  rows.push({ label: 'Primary result', value: formatIndianNumber(params.result) });
  return rows;
}

function assertPositive(value: number, label: string) { if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be greater than zero.`); }
function assertNonNegative(value: number, label: string) { if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be zero or more.`); }
