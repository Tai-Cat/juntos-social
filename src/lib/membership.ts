export const FREE_ALERT_LIMIT = 2;
export function canSaveAlert(plus: boolean, count: number) {
  return plus || count < FREE_ALERT_LIMIT;
}
export function canUseHostTools(plus: boolean, capacity: number, recurring: boolean, reliableOnly: boolean) {
  return plus || (capacity <= 8 && !recurring && !reliableOnly);
}