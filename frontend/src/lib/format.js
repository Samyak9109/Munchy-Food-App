/**
 * Shared formatting helpers for currency, distances, durations, and counts
 */

export function formatPrice(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return `₹${Math.round(Number(amount)).toLocaleString('en-IN')}`;
}

export function formatDistance(meters) {
  if (meters == null || isNaN(meters)) return '';
  const num = Number(meters);
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} km`;
  }
  return `${Math.round(num)} m`;
}

export function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return '';
  const num = Math.round(Number(minutes));
  if (num >= 60) {
    const hours = Math.floor(num / 60);
    const mins = num % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${num} min`;
}

export function formatCount(count) {
  if (count == null || isNaN(count)) return '0';
  const num = Number(count);
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return String(num);
}
