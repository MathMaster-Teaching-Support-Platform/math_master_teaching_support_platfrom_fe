/**
 * Utility to render template text with sample parameter values for live preview.
 */

export type ParameterInput = {
  name: string;
  type: string;
  min: string;
  max: string;
  constraint: string;
};

/**
 * Replaces {{param}} in text with sample values from parameters array.
 * Priority for sample value:
 * 1. If min is provided, use min.
 * 2. If max is provided, use max.
 * 3. Default to "X".
 */
export function renderTemplateWithSamples(
  templateText: string,
  parameters: ParameterInput[]
): string {
  if (!templateText) return '';
  
  let result = templateText;
  
  for (const param of parameters) {
    if (!param.name.trim()) continue;
    
    // Choose a sample value
    let sample = param.min || param.max || param.name;
    
    // Try to parse if it's a number to make it look nicer
    if (param.type === 'int' || param.type === 'float') {
      const val = param.min ? (param.type === 'int' ? parseInt(param.min, 10) : parseFloat(param.min)) : null;
      if (val !== null && !isNaN(val)) {
        sample = String(val);
      }
    }
    
    // Replace all occurrences of {{name}} with sample
    const regex = new RegExp(`{{\\s*${param.name.trim()}\\s*}}`, 'g');
    result = result.replace(regex, sample);
  }
  
  return result;
}
