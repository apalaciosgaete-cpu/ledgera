import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidEmail = process.env.VAPID_EMAIL ?? "mailto:admin@ledgera.cl";

export async function sendPushToAdmin(title: string, body: string) {
  if (!vapidPublic || !vapidPrivate) return;

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  const subs = await prisma.chatPushSubscription.findMany();

  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body }),
      ).catch(async (err) => {
        if (err.statusCode === 410) {
          await prisma.chatPushSubscription.delete({ where: { endpoint: s.endpoint } });
        }
      })
    )
  );
}
