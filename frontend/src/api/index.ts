import axios from 'axios';

// Use environment variable or default to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout and better error handling
  timeout: 10000,
});

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  members: User[];
}

export interface GroupDetails extends Group {
  total_expenses: number;
}

export interface ExpenseSplit {
  user_id: number;
  percentage?: number;
}

export interface ExpenseCreate {
  description: string;
  amount: number;
  paid_by: number;
  split_type: 'equal' | 'percentage';
  splits?: ExpenseSplit[];
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  paid_by: number;
  split_type: 'equal' | 'percentage';
  created_at: string;
  paid_by_user: User;
  splits: {
    id: number;
    user_id: number;
    amount: number;
    percentage?: number;
    user: User;
  }[];
}

export interface Balance {
  user_id: number;
  user_name: string;
  owes: number;
  owed: number;
  net_balance: number;
}

export interface GroupBalance {
  group_id: number;
  group_name: string;
  balances: Balance[];
}

export interface UserBalance {
  user_id: number;
  user_name: string;
  group_balances: GroupBalance[];
  total_net_balance: number;
}

export interface SettlementCreate {
  payer_id: number;
  payee_id: number;
  amount: number;
  description?: string;
}

export interface Settlement {
  id: number;
  group_id: number;
  payer_id: number;
  payee_id: number;
  amount: number;
  description?: string;
  settled_at: string;
  payer: User;
  payee: User;
}

export interface ChatbotResponse {
  response: string;
}

// API exports
export const userAPI = {
  create: (userData: { name: string; email: string }) => api.post<User>('/users/', userData),
  getAll: () => api.get<User[]>('/users/'),
  getById: (userId: number) => api.get<User>(`/users/${userId}`),
  getBalances: (userId: number) => api.get<UserBalance>(`/users/${userId}/balances`),
  delete: (userId: number) => api.delete(`/users/${userId}`)
};

export const groupAPI = {
  create: (groupData: { name: string; description?: string; user_ids: number[] }) => api.post<Group>('/groups/', groupData),
  getAll: () => api.get<Group[]>('/groups/'),
  getById: (id: number) => api.get<GroupDetails>(`/groups/${id}`),
  getBalances: (groupId: number) => api.get<GroupBalance>(`/groups/${groupId}/balances`),
  delete: (groupId: number) => api.delete(`/groups/${groupId}`),
  getExpenses: (groupId: number) => api.get<Expense[]>(`/groups/${groupId}/expenses/`),
  addExpense: (groupId: number, expenseData: ExpenseCreate) => api.post<Expense>(`/groups/${groupId}/expenses/`, expenseData),
  getSettlements: (groupId: number) => api.get<Settlement[]>(`/groups/${groupId}/settlements/`),
  addSettlement: (groupId: number, settlementData: SettlementCreate) => api.post<Settlement>(`/groups/${groupId}/settlements/`, settlementData)
};

export const expenseAPI = {
  update: (expenseId: number, expenseData: ExpenseCreate) => api.put<Expense>(`/expenses/${expenseId}`, expenseData),
  delete: (expenseId: number) => api.delete(`/expenses/${expenseId}`)
};

export const settlementAPI = {
  delete: (settlementId: number) => api.delete(`/settlements/${settlementId}`)
};

export const chatAPI = {
  query: (query: string) => api.post<ChatbotResponse>('/chatbot/', { query })
};

export default api;
