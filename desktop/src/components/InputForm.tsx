import { useState } from 'react';
import type { AnalysisInput } from '../types';
import ApiKeySettings from './ApiKeySettings';

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

const US_CITIES: Record<string, string[]> = {
  AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Chandler', 'Tempe'],
  AR: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno', 'Oakland', 'Irvine', 'Anaheim', 'Santa Monica', 'Beverly Hills', 'Long Beach', 'Pasadena'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Boulder', 'Fort Collins'],
  CT: ['Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury'],
  DE: ['Wilmington', 'Dover', 'Newark'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg', 'Naples', 'Sarasota', 'West Palm Beach'],
  GA: ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'],
  HI: ['Honolulu', 'Maui', 'Hilo', 'Kailua'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Rockford', 'Springfield', 'Evanston'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Iowa City'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Covington'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
  ME: ['Portland', 'Lewiston', 'Bangor'],
  MD: ['Baltimore', 'Bethesda', 'Rockville', 'Frederick', 'Annapolis'],
  MA: ['Boston', 'Cambridge', 'Worcester', 'Springfield', 'Quincy'],
  MI: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing', 'Troy'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Bloomington', 'Duluth'],
  MS: ['Jackson', 'Gulfport', 'Hattiesburg', 'Biloxi'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'],
  NE: ['Omaha', 'Lincoln', 'Bellevue'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
  NH: ['Manchester', 'Nashua', 'Concord'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Trenton', 'Princeton', 'Edison'],
  NM: ['Albuquerque', 'Santa Fe', 'Las Cruces', 'Rio Rancho'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers', 'White Plains'],
  NC: ['Charlotte', 'Raleigh', 'Durham', 'Greensboro', 'Winston-Salem', 'Asheville'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
  OR: ['Portland', 'Salem', 'Eugene', 'Bend', 'Medford'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Harrisburg'],
  RI: ['Providence', 'Warwick', 'Cranston', 'Newport'],
  SC: ['Charleston', 'Columbia', 'Greenville', 'Myrtle Beach'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Murfreesboro'],
  TX: ['Houston', 'Dallas', 'San Antonio', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Plano', 'Frisco'],
  UT: ['Salt Lake City', 'Provo', 'West Valley City', 'Ogden', 'St. George'],
  VT: ['Burlington', 'Montpelier', 'Rutland'],
  VA: ['Virginia Beach', 'Richmond', 'Norfolk', 'Arlington', 'Alexandria', 'Chesapeake'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Bellevue', 'Vancouver', 'Olympia'],
  WV: ['Charleston', 'Huntington', 'Morgantown'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
  WY: ['Cheyenne', 'Casper', 'Laramie', 'Jackson'],
  DC: ['Washington'],
};

const PRESETS: { label: string; input: AnalysisInput }[] = [
  // --- Original 5 ---
  { label: 'Dental Implants', input: { keyword: 'dental implant', product: 'Permanent Dental Implants', audience: 'adults 35-65 missing teeth', benefit: 'permanent tooth replacement that looks and feels natural', region: 'US', state: 'FL', city: 'Miami' } },
  { label: 'Teeth Whitening', input: { keyword: 'teeth whitening near me', product: 'Professional Teeth Whitening', audience: 'adults 25-45 wanting a brighter smile', benefit: 'up to 8 shades whiter in one visit', region: 'US', state: 'CA', city: 'Los Angeles' } },
  { label: 'Invisalign', input: { keyword: 'invisalign clear aligners', product: 'Invisalign Treatment', audience: 'adults and teens with crooked teeth', benefit: 'straighter teeth without metal braces', region: 'US', state: 'NY', city: 'New York' } },
  { label: 'Emergency Dental', input: { keyword: 'emergency dentist near me', product: 'Same-Day Emergency Dental Care', audience: 'adults with sudden tooth pain or injury', benefit: 'immediate pain relief and same-day appointments', region: 'US', state: 'TX', city: 'Houston' } },
  { label: 'Veneers', input: { keyword: 'porcelain veneers', product: 'Porcelain Dental Veneers', audience: 'adults 25-55 wanting a smile makeover', benefit: 'a perfect Hollywood smile in just 2 visits', region: 'US', state: 'IL', city: 'Chicago' } },
  // --- 15 more dental templates ---
  { label: 'Root Canal', input: { keyword: 'root canal treatment', product: 'Painless Root Canal Therapy', audience: 'adults 25-60 with severe tooth pain', benefit: 'save your natural tooth with pain-free treatment', region: 'US', state: 'AZ', city: 'Phoenix' } },
  { label: 'Dental Crowns', input: { keyword: 'dental crown near me', product: 'Same-Day Dental Crowns', audience: 'adults with damaged or weakened teeth', benefit: 'custom porcelain crown fitted in a single visit', region: 'US', state: 'GA', city: 'Atlanta' } },
  { label: 'Dentures', input: { keyword: 'affordable dentures', product: 'Custom-Fit Dentures', audience: 'seniors 55+ needing full or partial dentures', benefit: 'natural-looking dentures that fit comfortably from day one', region: 'US', state: 'PA', city: 'Philadelphia' } },
  { label: 'Dental Bridges', input: { keyword: 'dental bridge cost', product: 'Fixed Dental Bridges', audience: 'adults 40-70 with one or more missing teeth', benefit: 'fill the gap permanently without surgery', region: 'US', state: 'OH', city: 'Columbus' } },
  { label: 'Pediatric Dentist', input: { keyword: 'kids dentist near me', product: 'Pediatric Dental Care', audience: 'parents of children ages 2-12', benefit: 'gentle, fun dental visits your kids will actually enjoy', region: 'US', state: 'CO', city: 'Denver' } },
  { label: 'Teeth Cleaning', input: { keyword: 'dental cleaning near me', product: 'Professional Teeth Cleaning', audience: 'adults due for a routine dental checkup', benefit: 'deep clean that prevents cavities and gum disease', region: 'US', state: 'WA', city: 'Seattle' } },
  { label: 'Wisdom Teeth', input: { keyword: 'wisdom teeth removal', product: 'Wisdom Tooth Extraction', audience: 'teens and young adults 16-25', benefit: 'quick recovery with sedation options available', region: 'US', state: 'MA', city: 'Boston' } },
  { label: 'Cosmetic Dentistry', input: { keyword: 'cosmetic dentist near me', product: 'Complete Smile Makeover', audience: 'adults 25-55 unhappy with their smile', benefit: 'transform your smile with a personalized treatment plan', region: 'US', state: 'NV', city: 'Las Vegas' } },
  { label: 'Dental Bonding', input: { keyword: 'tooth bonding', product: 'Dental Bonding Treatment', audience: 'adults with chipped cracked or discolored teeth', benefit: 'fix imperfections in one affordable visit', region: 'US', state: 'NC', city: 'Charlotte' } },
  { label: 'Gum Disease', input: { keyword: 'gum disease treatment', product: 'Periodontal Treatment', audience: 'adults 30-65 with bleeding or receding gums', benefit: 'stop gum disease before it leads to tooth loss', region: 'US', state: 'MI', city: 'Detroit' } },
  { label: 'Sedation Dentistry', input: { keyword: 'sedation dentistry near me', product: 'Sedation Dentistry', audience: 'adults with dental anxiety or phobia', benefit: 'relaxed pain-free dental care while you sleep', region: 'US', state: 'TN', city: 'Nashville' } },
  { label: 'All-on-4 Implants', input: { keyword: 'all on 4 dental implants', product: 'All-on-4 Full Arch Implants', audience: 'adults 50+ needing full mouth restoration', benefit: 'a full set of new teeth in just one day', region: 'US', state: 'FL', city: 'Tampa' } },
  { label: 'Teeth Grinding', input: { keyword: 'teeth grinding treatment', product: 'Custom Night Guard', audience: 'adults who grind or clench teeth at night', benefit: 'protect your teeth and wake up pain-free', region: 'US', state: 'MN', city: 'Minneapolis' } },
  { label: 'Dental Insurance', input: { keyword: 'dentist that accepts medicaid', product: 'Affordable Dental Plans', audience: 'uninsured or underinsured adults and families', benefit: 'quality dental care you can afford with flexible payment', region: 'US', state: 'VA', city: 'Virginia Beach' } },
  { label: 'Smile Design', input: { keyword: 'digital smile design', product: 'Digital Smile Design', audience: 'adults 25-50 wanting a perfect smile', benefit: 'preview your new smile before treatment starts', region: 'US', state: 'OR', city: 'Portland' } },
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
      // Clear state + city when switching away from US
      if (field === 'region' && value !== 'US') {
        next.state = '';
        next.city = '';
      }
      // Clear city when state changes (unless preset is filling both)
      if (field === 'state') {
        next.city = '';
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

      <div className="flex flex-col">
        <label className={labelClass}>Template</label>
        <select
          className={inputClass}
          value=""
          disabled={loading}
          onChange={(e) => {
            const preset = PRESETS.find((p) => p.label === e.target.value);
            if (preset) {
              setForm({ ...preset.input });
              setErrors({});
            }
          }}
        >
          <option value="" disabled>Select a dental template...</option>
          {PRESETS.map((p) => (
            <option key={p.label} value={p.label}>{p.label}</option>
          ))}
        </select>
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

      {form.region === 'US' && form.state && US_CITIES[form.state] && (
        <div className="flex flex-col">
          <label className={labelClass}>City <span className="text-gray-500 font-normal">(optional)</span></label>
          <select
            className={inputClass}
            value={form.city ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
          >
            <option value="">(any city)</option>
            {US_CITIES[form.state].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 mt-1">
            Localizes search suggestions to this city
          </span>
        </div>
      )}

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

      <ApiKeySettings />
    </form>
  );
}

export default InputForm;
