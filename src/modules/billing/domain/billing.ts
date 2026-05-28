export type BillingProvider =
  | "MERCADOPAGO"
  | "MANUAL";

export type BillingPlan =
  | "BASICO"
  | "PERSONAL"
  | "PROFESIONAL"
  | "EMPRESA";

export type BillingInterval = "MONTHLY";

export type BillingCurrency =
  | "CLP"
  | "USD";

export type BillingSubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED"
  | "FAILED";

export type BillingPaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "AUTHORIZED"
  | "REJECTED"
  | "CANCELED"
  | "REFUNDED"
  | "FAILED";

export type BillingWebhookStatus =
  | "RECEIVED"
  | "PROCESSED"
  | "FAILED"
  | "IGNORED";

export interface BillingCustomer {
  id: string;
  userId: string;
  provider: BillingProvider;
  providerCustomerId: string | null;
  email: string;
  fullName: string | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingSubscription {
  id: string;
  userId: string;
  customerId: string | null;
  provider: BillingProvider;
  providerSubscriptionId: string | null;
  plan: BillingPlan;
  status: BillingSubscriptionStatus;
  currency: BillingCurrency;
  amount: number;
  interval: BillingInterval;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingPayment {
  id: string;
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  provider: BillingProvider;
  providerPaymentId: string | null;
  checkoutId: string | null;
  status: BillingPaymentStatus;
  amount: number;
  currency: BillingCurrency;
  description: string;
  paymentUrl: string | null;
  paidAt: Date | null;
  failedAt: Date | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingWebhookEvent {
  id: string;
  provider: BillingProvider;
  providerEventId: string | null;
  eventType: string;
  status: BillingWebhookStatus;
  payload: string;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface CreateBillingCustomerInput {
  userId: string;
  provider: BillingProvider;
  providerCustomerId?: string | null;
  email: string;
  fullName?: string | null;
  metadata?: string | null;
}

export interface UpsertBillingCustomerInput extends CreateBillingCustomerInput {}

export interface CreateBillingSubscriptionInput {
  userId: string;
  customerId?: string | null;
  provider: BillingProvider;
  providerSubscriptionId?: string | null;
  plan: BillingPlan;
  status?: BillingSubscriptionStatus;
  currency?: BillingCurrency;
  amount: number;
  interval?: BillingInterval;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  metadata?: string | null;
}

export interface UpdateBillingSubscriptionInput {
  id: string;
  providerSubscriptionId?: string | null;
  status?: BillingSubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  canceledAt?: Date | null;
  metadata?: string | null;
}

export interface CreateBillingPaymentInput {
  userId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  provider: BillingProvider;
  providerPaymentId?: string | null;
  checkoutId?: string | null;
  status?: BillingPaymentStatus;
  amount: number;
  currency?: BillingCurrency;
  description: string;
  paymentUrl?: string | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
  metadata?: string | null;
}

export interface UpdateBillingPaymentInput {
  id: string;
  providerPaymentId?: string | null;
  checkoutId?: string | null;
  status?: BillingPaymentStatus;
  paymentUrl?: string | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
  metadata?: string | null;
}

export interface CreateBillingWebhookEventInput {
  provider: BillingProvider;
  providerEventId?: string | null;
  eventType: string;
  status?: BillingWebhookStatus;
  payload: string;
}

export interface UpdateBillingWebhookEventInput {
  id: string;
  status: BillingWebhookStatus;
  processedAt?: Date | null;
  errorMessage?: string | null;
}
