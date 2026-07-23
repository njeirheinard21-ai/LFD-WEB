export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface Subscription {
  userId: string;
  status: 'active' | 'expired' | 'pending';
  planType: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  expiryDate: string;
}
