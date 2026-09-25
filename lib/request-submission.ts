// The shared team's existing FormSubmit delivery destination (also used by IDC).
// Customer details stay in the POST body, never navigation or query parameters.
export async function submitInspectionRequest(data: Record<string, string>) {
  const response = await fetch('https://formsubmit.co/ajax/Douglas@PrecisionSewerInspections.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      ...data,
      _subject: 'PSI inspection request',
      _template: 'table',
      _replyto: data.email,
      'Appointment status': 'Request only. No appointment, payment, additional work or dispatch approved.',
    }),
  });
  const result = await response.json();
  if (!response.ok || (result.success !== true && result.success !== 'true')) {
    throw new Error('Request delivery was not confirmed');
  }
}
