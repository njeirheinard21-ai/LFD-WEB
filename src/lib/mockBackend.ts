// Simulated Backend using LocalStorage for Preview Purposes
// (Since Firebase provisioning encountered an error)

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role?: string;
}

export interface Subscription {
  userId: string;
  status: 'active' | 'expired' | 'none';
  planType: 'weekly' | 'monthly' | 'yearly' | 'none';
  startDate: string | null;
  expiryDate: string | null;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockBackend = {
  async register(data: any) {
    await delay(800);
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    if (users.find((u: any) => u.email === data.email)) {
      throw new Error('Email already exists');
    }
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...data
    };
    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    
    // Initialize subscription
    const sub: Subscription = {
      userId: newUser.id,
      status: 'none',
      planType: 'none',
      startDate: null,
      expiryDate: null
    };
    const subs = JSON.parse(localStorage.getItem('mock_subs') || '[]');
    subs.push(sub);
    localStorage.setItem('mock_subs', JSON.stringify(subs));

    localStorage.setItem('mock_currentUser', JSON.stringify(newUser));
    return newUser;
  },

  async login(email: string, password: string) {
    await delay(800);
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    localStorage.setItem('mock_currentUser', JSON.stringify(user));
    return user;
  },

  async logout() {
    await delay(400);
    localStorage.removeItem('mock_currentUser');
  },

  getCurrentUser() {
    const user = localStorage.getItem('mock_currentUser');
    return user ? JSON.parse(user) : null;
  },

  async getSubscription(userId: string): Promise<Subscription> {
    await delay(400);
    const subs = JSON.parse(localStorage.getItem('mock_subs') || '[]');
    let sub = subs.find((s: any) => s.userId === userId);
    
    if (!sub) {
      sub = { userId, status: 'none', planType: 'none', startDate: null, expiryDate: null };
    }

    // Check expiry
    if (sub.status === 'active' && sub.expiryDate) {
      if (new Date() > new Date(sub.expiryDate)) {
        sub.status = 'expired';
        this.updateSubscription(sub);
      }
    }
    return sub;
  },

  async updateSubscription(sub: Subscription) {
    const subs = JSON.parse(localStorage.getItem('mock_subs') || '[]');
    const index = subs.findIndex((s: any) => s.userId === sub.userId);
    if (index >= 0) {
      subs[index] = sub;
    } else {
      subs.push(sub);
    }
    localStorage.setItem('mock_subs', JSON.stringify(subs));
  },

  async processPayment(userId: string, planType: 'weekly' | 'monthly' | 'yearly') {
    await delay(1500); // Simulate payment processing
    
    const startDate = new Date();
    const expiryDate = new Date();
    
    if (planType === 'weekly') {
      expiryDate.setDate(expiryDate.getDate() + 7);
    } else if (planType === 'monthly') {
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const newSub: Subscription = {
      userId,
      status: 'active',
      planType,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString()
    };

    await this.updateSubscription(newSub);
    return newSub;
  }
};
