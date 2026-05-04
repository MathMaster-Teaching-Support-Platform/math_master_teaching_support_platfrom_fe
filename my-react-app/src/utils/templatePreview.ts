/**
 * Utility to render template text with sample parameter values for live preview.
 *
 * Aligned with the unified Blueprint shape used by ParametersEditor:
 *   { name, constraintText, sampleValue }
 *
 * Legacy {type,min,max,constraint} rows from older templates are accepted via
 * an optional intersection so callers passing old-shape arrays still compile
 * (the code prefers `sampleValue`, falls back to `min`).
 */

export type ParameterInput = {
  name: string;
  /** Plain-text constraint, e.g. "integer, 1 ≤ a ≤ 9, a is even". */
  constraintText: string;
  /** Concrete example value used to seed previews and the AI selector. */
  sampleValue: string;

  // ── legacy fields tolerated for back-compat with old in-flight templates ──
  type?: string;
  min?: string;
  max?: string;
  constraint?: string;
};

/**
 * Replaces {{param}} placeholders with the parameter's sample value (or a
 * sensible fallback) so the preview shows readable math instead of {{a}}.
 */
export function renderTemplateWithSamples(
  templateText: string,
  parameters: ParameterInput[]
): string {
  if (!templateText) return '';

  let result = templateText;
  for (const param of parameters) {
    const name = param.name.trim();
    if (!name) continue;

    // Priority: explicit sampleValue → legacy min → legacy max → name.
    const sample =
      (param.sampleValue && String(param.sampleValue).trim()) ||
      (param.min && String(param.min).trim()) ||
      (param.max && String(param.max).trim()) ||
      name;

    const regex = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
    result = result.replace(regex, sample);
  }
  return result;
}
