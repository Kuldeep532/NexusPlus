export type CalculatorMode = 'standard' | 'age' | 'tip-bill' | 'electricity' | 'fixed-deposit' | 'emi' | 'discount' | 'percentage' | 'date-time';

export type StandardOperator = '+' | '-' | '×' | '÷';

export function evaluateStandard(expression: string): number {
  const cleaned = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9+\-*/().%\s]/g, '');
  if (!cleaned.trim()) throw new Error('Enter a calculation.');
  if (/[/]{2,}|[*]{2,}|[+\-]{2,}/.test(cleaned.replace(/\s+/g, ''))) throw new Error('Check the calculation.');
  const safe = cleaned.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  if (!/^[0-9+\-*/().%\s]+$/.test(safe)) throw new Error('Invalid calculation.');
  const value = Function(`"use strict"; return (${safe});`)();
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Calculation is not valid.');
  return value;
}

export function calculateAge(dateOfBirth: Date, asOf = new Date()) {
  if (dateOfBirth > asOf) throw new Error('Birth date cannot be in the future.');
  let years = asOf.getFullYear() - dateOfBirth.getFullYear();
  let months = asOf.getMonth() - dateOfBirth.getMonth();
  let days = asOf.getDate() - dateOfBirth.getDate();
  if (days < 0) {
    months -= 1;
    const previousMonthDays = new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
    days += previousMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export function calculateTipBill(subtotal: number, tipPercent: number, people: number) {
  assertNonNegative(subtotal, 'Bill amount');
  assertNonNegative(tipPercent, 'Tip percentage');
  if (!Number.isInteger(people) || people < 1) throw new Error('People count must be at least 1.');
  const tip = subtotal * tipPercent / 100;
  const total = subtotal + tip;
  return { tip, total, perPerson: total / people };
}

export function calculateElectricity(units: number, fixedCharge: number, energyRate: number, surchargePercent: number) {
  assertNonNegative(units, 'Units');
  assertNonNegative(fixedCharge, 'Fixed charge');
  assertNonNegative(energyRate, 'Rate');
  assertNonNegative(surchargePercent, 'Surcharge');
  const energy = units * energyRate;
  const surcharge = (energy + fixedCharge) * surchargePercent / 100;
  return { energy, surcharge, total: energy + fixedCharge + surcharge };
}

export function calculateFixedDeposit(principal: number, annualRate: number, tenureYears: number, compoundingPerYear: number) {
  assertPositive(principal, 'Principal');
  assertNonNegative(annualRate, 'Interest rate');
  assertPositive(tenureYears, 'Tenure');
  if (!Number.isInteger(compoundingPerYear) || compoundingPerYear < 1) throw new Error('Compounding frequency must be at least 1.');
  const maturity = principal * Math.pow(1 + annualRate / 100 / compoundingPerYear, compoundingPerYear * tenureYears);
  return { interest: maturity - principal, maturity };
}

export function calculateEmi(principal: number, annualRate: number, tenureMonths: number) {
  assertPositive(principal, 'Loan amount');
  assertNonNegative(annualRate, 'Interest rate');
  if (!Number.isInteger(tenureMonths) || tenureMonths < 1) throw new Error('Tenure must be at least 1 month.');
  const monthlyRate = annualRate / 1200;
  if (monthlyRate === 0) {
    return { emi: principal / tenureMonths, interest: 0, totalPayment: principal };
  }
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = principal * monthlyRate * factor / (factor - 1);
  const totalPayment = emi * tenureMonths;
  return { emi, interest: totalPayment - principal, totalPayment };
}

export function calculateDiscount(markedPrice: number, discountPercent: number, taxPercent: number) {
  assertNonNegative(markedPrice, 'Marked price');
  assertNonNegative(discountPercent, 'Discount');
  assertNonNegative(taxPercent, 'Tax');
  const discount = markedPrice * discountPercent / 100;
  const discounted = markedPrice - discount;
  const tax = discounted * taxPercent / 100;
  return { discount, tax, finalPrice: discounted + tax };
}

export function calculatePercentage(value: number, percent: number) {
  return value * percent / 100;
}

function assertNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be zero or more.`);
}

function assertPositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be greater than zero.`);
}
