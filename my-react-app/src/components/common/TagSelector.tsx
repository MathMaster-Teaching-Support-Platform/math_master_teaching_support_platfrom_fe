import { X } from 'lucide-react';
import { QuestionTag, questionTagLabels } from '../../types/questionTemplate';

interface TagSelectorProps {
  selectedTags: QuestionTag[];
  onChange: (tags: QuestionTag[]) => void;
  maxTags?: number;
  required?: boolean;
}

export function TagSelector({
  selectedTags,
  onChange,
  maxTags = 5,
  required = false,
}: Readonly<TagSelectorProps>) {
  const addTag = (tag: QuestionTag) => {
    if (!selectedTags.includes(tag) && selectedTags.length < maxTags) {
      onChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: QuestionTag) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <label>
      <p className="muted" style={{ marginBottom: 6 }}>
        Tags {required && <span style={{ color: '#ef4444' }}>*</span>}
        <span style={{ fontSize: '0.8rem', marginLeft: 8, fontWeight: 400 }}>
          (Chọn 1-{maxTags} tags)
        </span>
      </p>

      {/* Selected Tags Display */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          minHeight: '40px',
          padding: '8px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: '#f9fafb',
          marginBottom: '8px',
        }}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              background: '#6366f1',
              color: 'white',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {questionTagLabels[tag]}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                opacity: 0.8,
              }}
              onClick={() => removeTag(tag)}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <X size={14} />
            </button>
          </span>
        ))}
        {selectedTags.length === 0 && (
          <span
            style={{
              color: '#9ca3af',
              fontSize: '14px',
              fontStyle: 'italic',
            }}
          >
            Chọn tags từ dropdown bên dưới
          </span>
        )}
      </div>

      {/* Dropdown to Add Tags */}
      <select
        className="select"
        value=""
        onChange={(e) => {
          const selectedTag = e.target.value as QuestionTag;
          if (selectedTag) {
            if (selectedTags.length >= maxTags) {
              alert(`Bạn chỉ có thể chọn tối đa ${maxTags} tags`);
            } else {
              addTag(selectedTag);
            }
          }
        }}
        disabled={selectedTags.length >= maxTags}
      >
        <option value="">
          {selectedTags.length >= maxTags ? `Đã chọn tối đa ${maxTags} tags` : 'Chọn tag để thêm...'}
        </option>

        <optgroup label="Đại số">
          {[
            QuestionTag.LINEAR_EQUATIONS,
            QuestionTag.QUADRATIC_EQUATIONS,
            QuestionTag.POLYNOMIALS,
            QuestionTag.SYSTEMS_OF_EQUATIONS,
            QuestionTag.INEQUALITIES,
            QuestionTag.FUNCTIONS,
            QuestionTag.SEQUENCES_SERIES,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Hình học">
          {[
            QuestionTag.TRIANGLES,
            QuestionTag.CIRCLES,
            QuestionTag.POLYGONS,
            QuestionTag.SOLID_GEOMETRY,
            QuestionTag.COORDINATE_GEOMETRY,
            QuestionTag.TRANSFORMATIONS,
            QuestionTag.VECTORS,
            QuestionTag.AREA_PERIMETER,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Giải tích">
          {[
            QuestionTag.LIMITS,
            QuestionTag.DERIVATIVES,
            QuestionTag.INTEGRALS,
            QuestionTag.DIFFERENTIAL_EQUATIONS,
            QuestionTag.SERIES_CONVERGENCE,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Thống kê & Xác suất">
          {[
            QuestionTag.DESCRIPTIVE_STATISTICS,
            QuestionTag.PROBABILITY,
            QuestionTag.DISTRIBUTIONS,
            QuestionTag.HYPOTHESIS_TESTING,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Lượng giác">
          {[
            QuestionTag.TRIGONOMETRIC_FUNCTIONS,
            QuestionTag.TRIGONOMETRIC_IDENTITIES,
            QuestionTag.INVERSE_TRIG,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Số học">
          {[
            QuestionTag.PRIME_NUMBERS,
            QuestionTag.DIVISIBILITY,
            QuestionTag.MODULAR_ARITHMETIC,
            QuestionTag.GCD_LCM,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Tổ hợp">
          {[
            QuestionTag.PERMUTATIONS,
            QuestionTag.COMBINATIONS,
            QuestionTag.COUNTING_PRINCIPLES,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Logic & Tập hợp">
          {[QuestionTag.SET_THEORY, QuestionTag.LOGIC, QuestionTag.PROOF_TECHNIQUES]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Toán ứng dụng">
          {[
            QuestionTag.OPTIMIZATION,
            QuestionTag.LINEAR_PROGRAMMING,
            QuestionTag.MATRICES,
            QuestionTag.GRAPH_THEORY,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>

        <optgroup label="Khác">
          {[
            QuestionTag.WORD_PROBLEMS,
            QuestionTag.PROBLEM_SOLVING,
            QuestionTag.MATHEMATICAL_REASONING,
          ]
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag}>
                {questionTagLabels[tag]}
              </option>
            ))}
        </optgroup>
      </select>
    </label>
  );
}
