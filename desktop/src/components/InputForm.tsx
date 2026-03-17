import { useState } from 'react';
import type { AnalysisInput } from '../types';

interface InputFormProps {
  onSubmit: (input: AnalysisInput) => void;
  loading: boolean;
}

const REGIONS = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'BR', 'IN', 'JP'] as const;

const PRESETS: { label: string; input: AnalysisInput }[] = [
  {
    label: 'Yoga Mat',
    input: { keyword: 'eco friendly yoga mat', product: 'EarthMat Pro', audience: 'eco-conscious yogis 25-40', benefit: 'biodegradable non-slip grip', region: 'US' },
  },
  {
    label: 'Protein Powder',
    input: { keyword: 'protein powder', product: 'Whey Isolate Pro', audience: 'gym-goers aged 25-40', benefit: 'builds lean muscle fast', region: 'US' },
  },
  {
    label: 'Skincare',
    input: { keyword: 'anti aging skincare', product: 'GlowSerum', audience: 'women 30-50', benefit: 'visible wrinkle reduction in 2 weeks', region: 'US' },
  },
  {
    label: 'Online Course',
    input: { keyword: 'learn web development', product: 'CodeCamp Pro', audience: 'career changers 25-45', benefit: 'job-ready skills in 12 weeks', region: 'US' },
  },
];

const inputClass =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none';

const labelClass = 'text-sm font-medium text-gray-300 mb-1';

type FormErrors = Partial<Record<keyof AnalysisInput, string>>;

function InputForm({ onSubmit, loading }: InputFormProps): JSX.Element {
  const [form, setForm] = useState<AnalysisInput>({
    keyword: '',
    product: '',
    audience: '',
    benefit: '',
    region: 'US',
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

  function handleChange(field: keyof AnalysisInput, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
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
              setForm(p.input);
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
          placeholder="e.g. protein powder"
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
          placeholder="e.g. Whey protein isolate"
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
          placeholder="e.g. Gym-goers aged 25-40"
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
          placeholder="e.g. Builds lean muscle fast"
          value={form.benefit}
          onChange={(e) => handleChange('benefit', e.target.value)}
        />
        {errors.benefit && <span className="text-xs text-red-400 mt-1">{errors.benefit}</span>}
      </div>

      <div className="flex flex-col">
        <label className={labelClass}>Region</label>
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
