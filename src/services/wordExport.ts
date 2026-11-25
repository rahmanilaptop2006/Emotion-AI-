import type { UserAccount } from '../types';

export function exportResearchReportToWord(account: UserAccount): void {
  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>EMOTION AI Pharmacognosy &amp; Digital Phenotyping Dossier</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; color: #1B251A; line-height: 1.5; padding: 24px; }
    h1 { color: #2E432C; border-bottom: 2px solid #789575; padding-bottom: 6px; }
    h2 { color: #3D563B; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #B5C4B1; padding: 8px 10px; text-align: left; font-size: 11pt; }
    th { background-color: #E5E8CE; color: #1B251A; }
  </style>
</head>
<body>
  <h1>EMOTION AI: Zero-Hardware Digital Phenotyping &amp; Herbal Tonic Dossier</h1>
  <p><strong>Researcher / Patient Profile:</strong> ${account.name} (${account.role}) — ${account.institution}</p>
  <p><strong>Current Wellness Index:</strong> ${account.wellnessScore}/100 | <strong>Baseline:</strong> ${account.baselineScore}/100 | <strong>Streak:</strong> ${account.streakDays} days</p>

  <h2>1. Passive Digital Phenotyping Telemetry</h2>
  <table>
    <tr><th>Biomarker</th><th>Measured Value</th><th>Clinical Interpretation</th></tr>
    <tr><td>Sleep Duration &amp; Latency</td><td>${account.factors.sleepHours} hrs (${account.factors.sleepLatencyMin} min latency)</td><td>Circadian recovery baseline</td></tr>
    <tr><td>Keystroke Cadence</td><td>${account.factors.typingWpm} WPM (${account.factors.typingVarianceMs} ms variance)</td><td>Psychomotor fluency &amp; fatigue proxy</td></tr>
    <tr><td>Vocal Stress Index</td><td>${account.factors.voiceStress}</td><td>Pitch variance &amp; pause hesitation</td></tr>
    <tr><td>Late-Night Screen Drift</td><td>${account.factors.lateNightMinutes} min post-11PM</td><td>Pre-sleep cortical arousal proxy</td></tr>
  </table>

  <h2>2. Non-Sedating, Hormone-Neutral Herbal Tonic Formulation</h2>
  <table>
    <tr><th>Botanical</th><th>Standardized Active</th><th>Pharmacological Role</th></tr>
    <tr><td>Ashwagandha (Withania somnifera)</td><td>Withanolides (5%)</td><td>HPA-axis cortisol modulation without sedation</td></tr>
    <tr><td>Brahmi (Bacopa monnieri)</td><td>Bacosides A &amp; B</td><td>Cholinergic memory retention &amp; neuroprotection</td></tr>
    <tr><td>Shankhpushpi (Convolvulus pluricaulis)</td><td>Scopoletin &amp; Alkaloids</td><td>Non-tranquilizing anxiolytic clarity</td></tr>
    <tr><td>Jatamansi (Nardostachys jatamansi)</td><td>Jatamansone</td><td>GABAergic evening calm with zero morning grogginess</td></tr>
    <tr><td>Tulsi (Ocimum sanctum)</td><td>Eugenol &amp; Ursolic Acid</td><td>Cellular adaptogenic stress resilience</td></tr>
  </table>

  <h2>3. Transdermal Reservoir PK Telemetry</h2>
  <p>Active Infusion Rate: ${account.patch.infusionRateMcgHr} mcg/hr | Reservoir Remaining: ${account.patch.reservoirPercent}% | Wear Time: ${account.patch.wearHours} hrs</p>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EMOTION_AI_Research_Dossier_${account.id}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
