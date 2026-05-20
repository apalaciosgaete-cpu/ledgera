import { prisma } from "@/lib/prisma";

import type {
  BillingCustomer,
  BillingPayment,
  BillingProvider,
  BillingSubscription,
  BillingWebhookEvent,
  CreateBillingCustomerInput,
  CreateBillingPaymentInput,
  CreateBillingSubscriptionInput,
  CreateBillingWebhookEventInput,
  UpdateBillingPaymentInput,
  UpdateBillingSubscriptionInput,
  UpdateBillingWebhookEventInput,
  UpsertBillingCustomerInput,
} from "@/modules/billing/domain/billing";

function mapBillingCustomer(row: {
  id: string;
  userId: string;
  provider: string;
  providerCustomerId: string | null;
  email: string;
  fullName: string | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BillingCustomer {
  return {
    id: row.id,
    userId: row.userId,
    provider: row.provider as BillingCustomer["provider"],
    providerCustomerId: row.providerCustomerId,
    email: row.email,
    fullName: row.fullName,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBillingSubscription(row: {
  id: string;
  userId: string;
  customerId: string | null;
  provider: string;
  providerSubscriptionId: string | null;
  plan: string;
  status: string;
  currency: string;
  amount: number;
  interval: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BillingSubscription {
  return {
    id: row.id,
    userId: row.userId,
    customerId: row.customerId,
    provider: row.provider as BillingSubscription["provider"],
    providerSubscriptionId: row.providerSubscriptionId,
    plan: row.plan as BillingSubscription["plan"],
    status: row.status as BillingSubscription["status"],
    currency: row.currency as BillingSubscription["currency"],
    amount: row.amount,
    interval: row.interval as BillingSubscription["interval"],
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    canceledAt: row.canceledAt,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBillingPayment(row: {
  id: string;
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  provider: string;
  providerPaymentId: string | null;
  checkoutId: string | null;
  status: string;
  amount: number;
  currency: string;
  description: string;
  paymentUrl: string | null;
  paidAt: Date | null;
  failedAt: Date | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BillingPayment {
  return {
    id: row.id,
    userId: row.userId,
    customerId: row.customerId,
    subscriptionId: row.subscriptionId,
    provider: row.provider as BillingPayment["provider"],
    providerPaymentId: row.providerPaymentId,
    checkoutId: row.checkoutId,
    status: row.status as BillingPayment["status"],
    amount: row.amount,
    currency: row.currency as BillingPayment["currency"],
    description: row.description,
    paymentUrl: row.paymentUrl,
    paidAt: row.paidAt,
    failedAt: row.failedAt,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBillingWebhookEvent(row: {
  id: string;
  provider: string;
  providerEventId: string | null;
  eventType: string;
  status: string;
  payload: string;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}): BillingWebhookEvent {
  return {
    id: row.id,
    provider: row.provider as BillingWebhookEvent["provider"],
    providerEventId: row.providerEventId,
    eventType: row.eventType,
    status: row.status as BillingWebhookEvent["status"],
    payload: row.payload,
    processedAt: row.processedAt,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
  };
}

export async function createBillingCustomer(
  input: CreateBillingCustomerInput,
): Promise<BillingCustomer> {
  const customer = await prisma.billingCustomer.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      providerCustomerId: input.providerCustomerId ?? null,
      email: input.email,
      fullName: input.fullName ?? null,
      metadata: input.metadata ?? null,
    },
  });

  return mapBillingCustomer(customer);
}

export async function upsertBillingCustomer(
  input: UpsertBillingCustomerInput,
): Promise<BillingCustomer> {
  const customer = await prisma.billingCustomer.upsert({
    where: {
      userId_provider: {
        userId: input.userId,
        provider: input.provider,
      },
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      providerCustomerId: input.providerCustomerId ?? null,
      email: input.email,
      fullName: input.fullName ?? null,
      metadata: input.metadata ?? null,
    },
    update: {
      providerCustomerId: input.providerCustomerId ?? undefined,
      email: input.email,
      fullName: input.fullName ?? null,
      metadata: input.metadata ?? null,
    },
  });

  return mapBillingCustomer(customer);
}

export async function getBillingCustomerByUserAndProvider(input: {
  userId: string;
  provider: BillingProvider;
}): Promise<BillingCustomer | null> {
  const customer = await prisma.billingCustomer.findUnique({
    where: {
      userId_provider: {
        userId: input.userId,
        provider: input.provider,
      },
    },
  });

  if (!customer) return null;

  return mapBillingCustomer(customer);
}

export async function createBillingSubscription(
  input: CreateBillingSubscriptionInput,
): Promise<BillingSubscription> {
  const subscription = await prisma.billingSubscription.create({
    data: {
      userId: input.userId,
      customerId: input.customerId ?? null,
      provider: input.provider,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
      plan: input.plan,
      status: input.status ?? "PENDING",
      currency: input.currency ?? "CLP",
      amount: input.amount,
      interval: input.interval ?? "MONTHLY",
      currentPeriodStart: input.currentPeriodStart ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      metadata: input.metadata ?? null,
    },
  });

  return mapBillingSubscription(subscription);
}

export async function getLatestBillingSubscriptionByUserId(
  userId: string,
): Promise<BillingSubscription | null> {
  const subscription = await prisma.billingSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) return null;

  return mapBillingSubscription(subscription);
}

export async function getBillingSubscriptionByProviderId(input: {
  provider: BillingProvider;
  providerSubscriptionId: string;
}): Promise<BillingSubscription | null> {
  const subscription = await prisma.billingSubscription.findFirst({
    where: {
      provider: input.provider,
      providerSubscriptionId: input.providerSubscriptionId,
    },
  });

  if (!subscription) return null;

  return mapBillingSubscription(subscription);
}

export async function updateBillingSubscription(
  input: UpdateBillingSubscriptionInput,
): Promise<BillingSubscription> {
  const subscription = await prisma.billingSubscription.update({
    where: { id: input.id },
    data: {
      providerSubscriptionId: input.providerSubscriptionId ?? undefined,
      status: input.status ?? undefined,
      currentPeriodStart: input.currentPeriodStart ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd ?? undefined,
      canceledAt: input.canceledAt ?? undefined,
      metadata: input.metadata ?? undefined,
    },
  });

  return mapBillingSubscription(subscription);
}

export async function createBillingPayment(
  input: CreateBillingPaymentInput,
): Promise<BillingPayment> {
  const payment = await prisma.billingPayment.create({
    data: {
      userId: input.userId,
      customerId: input.customerId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      provider: input.provider,
      providerPaymentId: input.providerPaymentId ?? null,
      checkoutId: input.checkoutId ?? null,
      status: input.status ?? "PENDING",
      amount: input.amount,
      currency: input.currency ?? "CLP",
      description: input.description,
      paymentUrl: input.paymentUrl ?? null,
      paidAt: input.paidAt ?? null,
      failedAt: input.failedAt ?? null,
      metadata: input.metadata ?? null,
    },
  });

  return mapBillingPayment(payment);
}

export async function getBillingPaymentById(
  id: string,
): Promise<BillingPayment | null> {
  const payment = await prisma.billingPayment.findUnique({
    where: { id },
  });

  if (!payment) return null;

  return mapBillingPayment(payment);
}

export async function getBillingPaymentByProviderPaymentId(input: {
  provider: BillingProvider;
  providerPaymentId: string;
}): Promise<BillingPayment | null> {
  const payment = await prisma.billingPayment.findFirst({
    where: {
      provider: input.provider,
      providerPaymentId: input.providerPaymentId,
    },
  });

  if (!payment) return null;

  return mapBillingPayment(payment);
}

export async function getBillingPaymentByCheckoutId(input: {
  provider: BillingProvider;
  checkoutId: string;
}): Promise<BillingPayment | null> {
  const payment = await prisma.billingPayment.findFirst({
    where: {
      provider: input.provider,
      checkoutId: input.checkoutId,
    },
  });

  if (!payment) return null;

  return mapBillingPayment(payment);
}

export async function listBillingPaymentsByUserId(
  userId: string,
): Promise<BillingPayment[]> {
  const payments = await prisma.billingPayment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return payments.map(mapBillingPayment);
}

export async function updateBillingPayment(
  input: UpdateBillingPaymentInput,
): Promise<BillingPayment> {
  const payment = await prisma.billingPayment.update({
    where: { id: input.id },
    data: {
      providerPaymentId: input.providerPaymentId ?? undefined,
      checkoutId: input.checkoutId ?? undefined,
      status: input.status ?? undefined,
      paymentUrl: input.paymentUrl ?? undefined,
      paidAt: input.paidAt ?? undefined,
      failedAt: input.failedAt ?? undefined,
      metadata: input.metadata ?? undefined,
    },
  });

  return mapBillingPayment(payment);
}

export async function createBillingWebhookEvent(
  input: CreateBillingWebhookEventInput,
): Promise<BillingWebhookEvent> {
  const event = await prisma.billingWebhookEvent.create({
    data: {
      provider: input.provider,
      providerEventId: input.providerEventId ?? null,
      eventType: input.eventType,
      status: input.status ?? "RECEIVED",
      payload: input.payload,
    },
  });

  return mapBillingWebhookEvent(event);
}

export async function updateBillingWebhookEvent(
  input: UpdateBillingWebhookEventInput,
): Promise<BillingWebhookEvent> {
  const event = await prisma.billingWebhookEvent.update({
    where: { id: input.id },
    data: {
      status: input.status,
      processedAt: input.processedAt ?? undefined,
      errorMessage: input.errorMessage ?? undefined,
    },
  });

  return mapBillingWebhookEvent(event);
}