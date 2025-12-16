import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 주문 정보 타입
export interface Order {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  order_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_key?: string;
  created_at: string;
  paid_at?: string;
}

// 주문 정보 조회
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

// 주문 상태 업데이트
export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'], 
  paymentKey?: string
): Promise<boolean> {
  const updateData: Partial<Order> = { status };
  
  if (paymentKey) {
    updateData.payment_key = paymentKey;
  }
  
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    return false;
  }

  return true;
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 주문 정보 타입
export interface Order {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  order_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_key?: string;
  created_at: string;
  paid_at?: string;
}

// 주문 정보 조회
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

// 주문 상태 업데이트
export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'], 
  paymentKey?: string
): Promise<boolean> {
  const updateData: Partial<Order> = { status };
  
  if (paymentKey) {
    updateData.payment_key = paymentKey;
  }
  
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    return false;
  }

  return true;
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 주문 정보 타입
export interface Order {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  order_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_key?: string;
  created_at: string;
  paid_at?: string;
}

// 주문 정보 조회
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

// 주문 상태 업데이트
export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'], 
  paymentKey?: string
): Promise<boolean> {
  const updateData: Partial<Order> = { status };
  
  if (paymentKey) {
    updateData.payment_key = paymentKey;
  }
  
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    return false;
  }

  return true;
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 주문 정보 타입
export interface Order {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  order_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_key?: string;
  created_at: string;
  paid_at?: string;
}

// 주문 정보 조회
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

// 주문 상태 업데이트
export async function updateOrderStatus(
  orderId: string, 
  status: Order['status'], 
  paymentKey?: string
): Promise<boolean> {
  const updateData: Partial<Order> = { status };
  
  if (paymentKey) {
    updateData.payment_key = paymentKey;
  }
  
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order:', error);
    return false;
  }

  return true;
}















