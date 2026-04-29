export const PRICING = {
  weekly: {
    id: 'weekly',
    name: 'Weekly',
    amount: 3000,
    currency: 'XAF',
    period: 'week',
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    amount: 10000,
    currency: 'XAF',
    period: 'month',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    amount: 100000,
    currency: 'XAF',
    period: 'year',
  }
};

export const formatPrice = (amount: number, currency: string = 'XAF') => {
  return `${amount.toLocaleString()} ${currency}`;
};
