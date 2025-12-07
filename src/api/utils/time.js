// Convert time strings like "07:20" to minutes since midnight.
// Accepts: "HH:MM", numbers (already minutes), or null/empty -> returns null.
function timeToMinutes(value) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === 'string') {
    // Trim and match HH:MM or H:MM
    const trimmed = value.trim();
    const m = /^([0-9]{1,2}):([0-9]{2})$/.exec(trimmed);
    if (m) {
      const hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      if (!Number.isNaN(hh) && !Number.isNaN(mm)) return hh * 60 + mm;
    }
    // Try plain number string
    const asNum = parseInt(trimmed, 10);
    if (!Number.isNaN(asNum)) return asNum;
  }
  return null;
}

module.exports = { timeToMinutes };
