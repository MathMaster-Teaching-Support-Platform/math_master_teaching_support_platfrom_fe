import MathText from './MathText';

/**
 * Test component to verify MathText rendering
 * Use this to debug LaTeX rendering issues
 */
export default function MathTextTest() {
  const testCases = [
    {
      label: 'Simple inline math',
      text: 'The formula $x^2 + y^2 = z^2$ is Pythagorean theorem.',
    },
    {
      label: 'Multiple inline math',
      text: 'Solve $x^2 + 3x + 2 = 0$ where $x = ?$',
    },
    {
      label: 'Complex formula from backend',
      text: 'Trục đối xứng của đồ thị hàm số $y = 3.466930056207646x^2 - 6.13465245371871x + 5$ là đường thẳng có phương trình $x =$ ?',
    },
    {
      label: 'Fraction',
      text: 'The derivative is $\\frac{dy}{dx} = 2x$',
    },
    {
      label: 'Square root',
      text: 'The solution is $x = \\sqrt{25} = 5$',
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h2>MathText Component Test</h2>
      <p>Testing LaTeX rendering with react-katex</p>

      {testCases.map((test, index) => (
        <div
          key={index}
          style={{
            marginTop: 24,
            padding: 16,
            border: '1px solid #ddd',
            borderRadius: 8,
            backgroundColor: '#f9f9f9',
          }}
        >
          <h4 style={{ marginBottom: 8, color: '#666' }}>{test.label}</h4>
          <div style={{ marginBottom: 8, fontSize: '0.875rem', color: '#999' }}>
            <strong>Input:</strong> <code>{test.text}</code>
          </div>
          <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>
            <strong>Output:</strong> <MathText text={test.text} />
          </div>
        </div>
      ))}

      <div style={{ marginTop: 32, padding: 16, backgroundColor: '#e3f2fd', borderRadius: 8 }}>
        <h4>Debug Info</h4>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>react-katex version: 3.1.0</li>
          <li>katex version: 0.16.42</li>
          <li>CSS imported: katex/dist/katex.min.css</li>
        </ul>
      </div>
    </div>
  );
}
