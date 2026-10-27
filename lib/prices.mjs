export const TIMEZONE = "Asia/Kolkata";
export function indiaDay(at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:TIMEZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(at);
  const get = type => parts.find(p => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function previousDay(day) {
  return new Date(Date.parse(`${day}T12:00:00Z`) - 86_400_000).toISOString().slice(0,10);
}
export function comparePrices(today, yesterday) {
  if (!Number.isSafeInteger(today) || today <= 0) return {direction:"missing",amount:null,percent:null};
  if (!Number.isSafeInteger(yesterday) || yesterday <= 0) return {direction:"new",amount:null,percent:null};
  const amount = yesterday - today;
  return {direction:amount>0?"down":amount<0?"up":"same",amount:Math.abs(amount),percent:Math.round(Math.abs(amount)/yesterday*1000)/10};
}
export function money(paise) {
  if (paise === null || paise === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:paise%100?2:0}).format(paise/100);
}
