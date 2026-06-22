// src/modules/adaptive-profile/application/buildAdaptiveProfile.ts

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createAuditEvent } from "@/modules/audit/infrastructure/auditRepository";
import type {
  AdaptiveProfile,
  AdaptiveProfileSnapshot,
  AdaptiveProfileType,
  ComplianceBehavior,
  DocumentBehavior,
  RecommendationBehavior,
  RiskBehavior,
  TaskBehavior,
} from "@/modules/adaptive-profile/domain/adaptiveProfile";
import {
  resolveAdaptiveProfileType,
  resolveComplianceBehavior,
  resolveDocumentBehavior,
  resolveRecommendationBehavior,
  resolveRiskBehavior,
  resolveTaskBehavior,
} from "@/modules/adaptive-profile/domain/adaptiveProfile";

export type BuildAdaptiveProfileResult =
  | { ok: true; profile: AdaptiveProfileSnapshot }
  | { ok: false; message: string };

export type ListAdaptiveProfilesResult =
  | { ok: true; profiles: AdaptiveProfileSnapshot[] }
  | { ok: false; message: string };

export async function buildAdaptiveProfile(
  userId: string,
  options?: { skipAudit?: boolean },
): Promise<BuildAdaptiveProfileResult> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [user, latestScore, riskScore, openAlerts, criticalAlerts, tasks, recommendations, documents] =
      await prisma.$transaction([
        prisma.users.findUnique({
          where: { id: userId },
          select: { id: true, email: true, full_name: true },
        }),
        prisma.smartTaxScore.findFirst({
          where: { userId },
          orderBy: { evaluatedAt: "desc" },
        }),
        prisma.taxRiskScore.findFirst({
          where: { userId },
          orderBy: { evaluatedAt: "desc" },
        }),
        prisma.alert.count({ where: { userId, status: "OPEN" } }),
        prisma.alert.count({ where: { userId, status: "OPEN", severity: "CRITICAL" } }),
        prisma.task.findMany({ where: { userId } }),
        prisma.recommendation.findMany({ where: { userId } }),
        prisma.document.findMany({ where: { userId, status: { not: "DELETED" } } }),
      ]);

    if (!user) {
      return { ok: false, message: "Usuario no encontrado." };
    }

    // ── Compliance score ──
    const scoreValue = latestScore?.score ?? 0;
    const complianceScore = scoreValue;

    // ── Compliance behavior ──
    const complianceBehavior: ComplianceBehavior = resolveComplianceBehavior(complianceScore);

    // ── Recommendation behavior ──
    const acceptedRecs = recommendations.filter((r) => r.status === "COMPLETED").length;
    const ignoredRecs = recommendations.filter((r) => r.status === "ACTIVE" || r.status === "DISMISSED").length;
    const totalRecs = recommendations.length;
    const recommendationBehavior: RecommendationBehavior = resolveRecommendationBehavior(
      acceptedRecs,
      ignoredRecs,
      totalRecs,
    );

    // ── Task behavior ──
    const completedOnTime = tasks.filter(
      (t) => t.status === "COMPLETED" && t.completedAt && t.dueDate && t.completedAt <= t.dueDate,
    ).length;
    const completedLate = tasks.filter(
      (t) => t.status === "COMPLETED" && t.completedAt && t.dueDate && t.completedAt > t.dueDate,
    ).length;
    const pendingCount = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
    ).length;
    const taskBehavior: TaskBehavior = resolveTaskBehavior(completedOnTime, completedLate, pendingCount);

    // ── Document behavior ──
    const documentCategories = documents.reduce(
      (acc, d) => {
        const cat = d.category;
        const status = d.status;
        if (status === "ACTIVE") acc.organized++;
        else if (status === "ARCHIVED") acc.incomplete++;
        else acc.critical++;
        return acc;
      },
      { organized: 0, incomplete: 0, critical: 0 },
    );
    const documentBehavior: DocumentBehavior = resolveDocumentBehavior(
      documentCategories.organized,
      documentCategories.incomplete,
      documentCategories.critical,
    );

    // ── Risk behavior ──
    const riskBehavior: RiskBehavior = resolveRiskBehavior(riskScore?.level ?? null);

    // ── Profile type ──
    const hasOverdueTasks = tasks.some(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.dueDate && t.dueDate < now,
    );
    const profileType: AdaptiveProfileType = resolveAdaptiveProfileType(
      complianceScore,
      criticalAlerts,
      pendingCount,
      hasOverdueTasks,
      openAlerts,
    );

    // ── Confidence ──
    // Base confidence starts at 50% and increases with more data
    let confidence = 50;
    if (totalRecs > 0) confidence += 10;
    if (tasks.length > 0) confidence += 10;
    if (documents.length > 0) confidence += 10;
    if (latestScore) confidence += 10;
    if (riskScore) confidence += 10;
    confidence = Math.min(confidence, 100);

    // ── Metadata ──
    const metadata: Record<string, unknown> = {
      score: complianceScore,
      riskLevel: riskScore?.level ?? null,
      totalAlerts: openAlerts,
      criticalAlerts,
      totalTasks: tasks.length,
      pendingTasks: pendingCount,
      totalRecommendations: totalRecs,
      acceptedRecommendations: acceptedRecs,
      totalDocuments: documents.length,
      evaluatedAt: now.toISOString(),
    };

    // ── Upsert profile ──
    const profile = await prisma.adaptiveTaxProfile.upsert({
      where: { userId },
      create: {
        userId,
        complianceScore,
        complianceBehavior,
        recommendationBehavior,
        taskBehavior,
        documentBehavior,
        riskBehavior,
        profileType,
        confidence,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
      update: {
        complianceScore,
        complianceBehavior,
        recommendationBehavior,
        taskBehavior,
        documentBehavior,
        riskBehavior,
        profileType,
        confidence,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    });

    // ── Audit event ──
    if (!options?.skipAudit) {
      await createAuditEvent({
        userId,
        category: "AI",
        severity: "INFO",
        event: "adaptive_profile_generated",
        description: `Perfil adaptativo generado: ${profileType} (score: ${complianceScore})`,
        result: "SUCCESS",
        entityType: "AdaptiveTaxProfile",
        entityId: profile.id,
        metadata: { profileType, complianceScore, confidence },
      }).catch((err) => console.error("[adaptive-profile] audit error:", err));
    }

    const snapshot: AdaptiveProfileSnapshot = {
      id: profile.id,
      userId: profile.userId,
      userEmail: user.email,
      userName: user.full_name,
      complianceScore: profile.complianceScore,
      complianceBehavior: profile.complianceBehavior as ComplianceBehavior,
      recommendationBehavior: profile.recommendationBehavior as RecommendationBehavior,
      taskBehavior: profile.taskBehavior as TaskBehavior,
      documentBehavior: profile.documentBehavior as DocumentBehavior,
      riskBehavior: profile.riskBehavior as RiskBehavior,
      profileType: profile.profileType as AdaptiveProfileType,
      confidence: profile.confidence,
      metadata: profile.metadata as Record<string, unknown> | null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };

    return { ok: true, profile: snapshot };
  } catch (error) {
    console.error("[adaptive-profile/buildAdaptiveProfile]", error);
    return { ok: false, message: "Error al generar perfil adaptativo." };
  }
}

export async function getAdaptiveProfile(
  userId: string,
): Promise<BuildAdaptiveProfileResult> {
  try {
    const profile = await prisma.adaptiveTaxProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // If no profile exists, build one
      return buildAdaptiveProfile(userId);
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, full_name: true },
    });

    if (!user) {
      return { ok: false, message: "Usuario no encontrado." };
    }

    const snapshot: AdaptiveProfileSnapshot = {
      id: profile.id,
      userId: profile.userId,
      userEmail: user.email,
      userName: user.full_name,
      complianceScore: profile.complianceScore,
      complianceBehavior: profile.complianceBehavior as ComplianceBehavior,
      recommendationBehavior: profile.recommendationBehavior as RecommendationBehavior,
      taskBehavior: profile.taskBehavior as TaskBehavior,
      documentBehavior: profile.documentBehavior as DocumentBehavior,
      riskBehavior: profile.riskBehavior as RiskBehavior,
      profileType: profile.profileType as AdaptiveProfileType,
      confidence: profile.confidence,
      metadata: profile.metadata as Record<string, unknown> | null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };

    return { ok: true, profile: snapshot };
  } catch (error) {
    console.error("[adaptive-profile/getAdaptiveProfile]", error);
    return { ok: false, message: "Error al obtener perfil adaptativo." };
  }
}

export async function listAdaptiveProfiles(
  options?: { limit?: number; profileType?: AdaptiveProfileType },
): Promise<ListAdaptiveProfilesResult> {
  try {
    const where: Record<string, unknown> = {};
    if (options?.profileType) {
      where.profileType = options.profileType;
    }

    const profiles = await prisma.adaptiveTaxProfile.findMany({
      where: where as any,
      orderBy: { updatedAt: "desc" },
      take: options?.limit ?? 50,
    });

    const userIds = profiles.map((p) => p.userId);
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, full_name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const snapshots: AdaptiveProfileSnapshot[] = profiles.map((p) => {
      const u = userMap.get(p.userId);
      return {
        id: p.id,
        userId: p.userId,
        userEmail: u?.email ?? "",
        userName: u?.full_name ?? "",
        complianceScore: p.complianceScore,
        complianceBehavior: p.complianceBehavior as ComplianceBehavior,
        recommendationBehavior: p.recommendationBehavior as RecommendationBehavior,
        taskBehavior: p.taskBehavior as TaskBehavior,
        documentBehavior: p.documentBehavior as DocumentBehavior,
        riskBehavior: p.riskBehavior as RiskBehavior,
        profileType: p.profileType as AdaptiveProfileType,
        confidence: p.confidence,
        metadata: p.metadata as Record<string, unknown> | null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return { ok: true, profiles: snapshots };
  } catch (error) {
    console.error("[adaptive-profile/listAdaptiveProfiles]", error);
    return { ok: false, message: "Error al listar perfiles adaptativos." };
  }
}

export async function getAdaptiveProfileByUserId(
  targetUserId: string,
): Promise<BuildAdaptiveProfileResult> {
  return getAdaptiveProfile(targetUserId);
}
