export function safeReturn(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/auth") && !/[\\\r\n]/.test(value) ? value : "/feed";
}