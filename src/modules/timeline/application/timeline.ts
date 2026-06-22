import { listUserTimeline, getTimelineEventById, listTimeline } from "../infrastructure/timelineRepository";
import { isValidTimelineCategory, isValidTimelineSeverity } from "../domain/timeline";

// Conceptual implementation for Next.js / API Handlers

export async function handleGetTimeline(userId: string, query: any) {
  const { category, severity, from, to, limit, cursor } = query;

  return listUserTimeline(userId, {
    category: isValidTimelineCategory(category) ? category : undefined,
    severity: isValidTimelineSeverity(severity) ? severity : undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    cursor,
  });
}

export async function handleGetTimelineAdmin(query: any) {
  const { userId, category, severity, from, to, limit, cursor } = query;

  return listTimeline({
    userId,
    category: isValidTimelineCategory(category) ? category : undefined,
    severity: isValidTimelineSeverity(severity) ? severity : undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    cursor,
  });
}

export async function handleGetTimelineEntity(query: any) {
  const { entityType, entityId, limit, cursor } = query;

  if (!entityType || !entityId) {
    throw new Error("entityType and entityId are required");
  }

  return listTimeline({
    entityType,
    entityId,
    limit: limit ? parseInt(limit, 10) : undefined,
    cursor,
  });
}

export async function handleGetTimelineById(id: string) {
  return getTimelineEventById(id);
}