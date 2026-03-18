import { useState } from 'react';
import type { AnalysisInput } from '../types';

interface InputFormProps {
  onSubmit: (input: AnalysisInput) => void;
  loading: boolean;
}

const REGIONS = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'BR', 'IN', 'JP'] as const;

const US_STATES: { abbr: string; name: string }[] = [
  { abbr: '', name: '(any state)' },
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }, { abbr: 'DC', name: 'Washington DC' },
];

const PRESETS: { label: string; input: AnalysisInput }[] = [
  {
    label: 'Dental Implants',
    input: { keyword: 'dental implant', product: 'Permanent Dental Implants', audience: 'adults 35-65 missing teeth', benefit: 'permanent tooth replacement that looks and feels natural', region: 'US', state: 'FL', city: 'Miami' },
  },
  {
    label: 'Teeth Whitening',
    input: { keyword: 'teeth whitening near me', product: 'Professional Teeth Whitening', audience: 'adults 25-45 wanting a brighter smile', benefit: 'up to 8 shades whiter in one visit', region: 'US', state: 'CA', city: 'Los Angeles' },
  },
  {
    label: 'Invisalign',
    input: { keyword: 'invisalign clear aligners', product: 'Invisalign Treatment', audience: 'adults and teens with crooked teeth', benefit: 'straighter teeth without metal braces', region: 'US', state: 'NY', city: 'New York' },
  },
  {
    label: 'Emergency Dental',
    input: { keyword: 'emergency dentist near me', product: 'Same-Day Emergency Dental Care', audience: 'adults with sudden tooth pain or injury', benefit: 'immediate pain relief and same-day appointments', region: 'US', state: 'TX', city: 'Houston' },
  },
  {
    label: 'Veneers',
    input: { keyword: 'porcelain veneers', product: 'Porcelain Dental Veneers', audience: 'adults 25-55 wanting a smile makeover', benefit: 'a perfect Hollywood smile in just 2 visits', region: 'US', state: 'IL', city: 'Chicago' },
  },
];

const inputClass =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none';

const labelClass = 'text-sm font-medium text-gray-300 mb-1';

type FormFields = AnalysisInput;
type FormErrors = Partial<Record<keyof FormFields, string>>;

function InputForm({ onSubmit, loading }: InputFormProps): JSX.Element {
  const [form, setForm] = useState<FormFields>({
    keyword: '',
    product: '',
    audience: '',
    benefit: '',
    region: 'US',
    state: '',
    city: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.keyword.trim()) e.keyword = 'Keyword is required';
    else if (form.keyword.trim().length < 2) e.keyword = 'Keyword must be at least 2 characters';
    if (!form.product.trim()) e.product = 'Product is required';
    if (!form.audience.trim()) e.audience = 'Audience is required';
    if (!form.benefit.trim()) e.benefit = 'Benefit is required';
    return e;
  }

  function handleChange(field: keyof FormFields, value: string): void {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Clear state when switching away from US
      if (field === 'region' && value !== 'US') {
        next.state = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({
      keyword: form.keyword.trim(),
      product: form.product.trim(),
      audience: form.audience.trim(),
      benefit: form.benefit.trim(),
      region: form.region,
      state: form.state?.trim() || '',
      city: form.city?.trim() || '',
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white">Analysis Input</h2>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={loading}
            onClick={() => {
              setForm({ ...p.input });
              setErrors({});
            }}
            className="rounded-full border border-gray-700 bg-gray-800/60 px-3 py-1 text-xs text-gray-300 hover:border-blue-500 hover:text-white transition-colors disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Keyword</label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. dental implant"
          value={form.keyword}
          onChange={(e) => handleChange('keyword', e.target.value)}
        />
        {errors.keyword && <span className="text-xs text-red-400 mt-1">{errors.keyword}</span>}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Product</label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. Permanent Dental Implants"
          value={form.product}
          onChange={(e) => handleChange('product', e.target.value)}
        />
        {errors.product && <span className="text-xs text-red-400 mt-1">{errors.product}</span>}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Audience</label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. adults 35-65 missing teeth"
          value={form.audience}
          onChange={(e) => handleChange('audience', e.target.value)}
        />
        {errors.audience && <span className="text-xs text-red-400 mt-1">{errors.audience}</span>}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Benefit</label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. permanent tooth replacement"
          value={form.benefit}
          onChange={(e) => handleChange('benefit', e.target.value)}
        />
        {errors.benefit && <span className="text-xs text-red-400 mt-1">{errors.benefit}</span>}
      </div>

      {/* Geo targeting */}
      <div className="flex flex-col">
        <label className={labelClass}>Country</label>
        <select
          className={inputClass}
          value={form.region}
          onChange={(e) => handleChange('region', e.target.value)}
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {form.region === 'US' && (
        <div className="flex flex-col">
          <label className={labelClass}>State <span className="text-gray-500 font-normal">(optional)</span></label>
          <select
            className={inputClass}
            value={form.state ?? ''}
            onChange={(e) => handleChange('state', e.target.value)}
          >
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.abbr ? `${s.abbr} - ${s.name}` : s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col">
        <label className={labelClass}>City <span className="text-gray-500 font-normal">(optional)</span></label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. Miami"
          value={form.city ?? ''}
          onChange={(e) => handleChange('city', e.target.value)}
        />
        <span className="text-xs text-gray-500 mt-1">
          Localizes search suggestions to this city
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {loading ? 'Running...' : 'Run Analysis'}
      </button>
    </form>
  );
}

export default InputForm;
