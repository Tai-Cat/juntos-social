import { supabase } from "@/integrations/supabase/client";
export const VAPID_PUBLIC_KEY = "BJgrBgVlUHbpuO77wagcQL3u2-9XzpBmKomsneyIOvkeKk4bqeBiXp8n2CHi5KmD4cdsgxHuO7rBxkjPDuuPefI";

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
/** iPhone only allows web push once Juntos is added to the home screen. */
export const isInstalled = () => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

function keyBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Asks for permission (only call from a tap) and stores this device's subscription. */
export async function enablePush(userId: string): Promise<"on" | "denied" | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const reg = await navigator.serviceWorker.register("/push-sw.js");
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }));
  const json = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert({ endpoint: sub.endpoint, user_id: userId, p256dh: json.keys?.["p256dh"] ?? "", auth: json.keys?.["auth"] ?? "" });
  if (error) throw error;
  return "on";
}

export async function pushIsOn() {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return !!(await reg?.pushManager.getSubscription());
}
