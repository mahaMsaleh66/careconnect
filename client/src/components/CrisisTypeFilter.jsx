import { useLanguage } from '../LanguageContext';

export const CRISIS_FILTERS = ['All', 'Flood', 'Earthquake', 'Pandemic', 'Fire', 'Hunger', 'Other'];

const NAMED_TYPES = ['Flood', 'Earthquake', 'Pandemic', 'Medical', 'Fire', 'Hunger', 'Other'];

export function matchesCrisisFilter(type, filter) {
  if (!filter || filter === 'All') return true;
  const value = String(type || '');
  if (filter === 'Pandemic') return value === 'Pandemic' || value === 'Medical';
  if (filter === 'Other') return value === 'Other' || !NAMED_TYPES.includes(value);
  return value === filter;
}

export default function CrisisTypeFilter({ value, onChange, counts }) {
  const { t } = useLanguage();
  return (
    <div className="filter-chips" role="tablist" aria-label={t('crises.filter', 'Filter by crisis type')}>
      {CRISIS_FILTERS.map((filter) => (
        <button
          type="button"
          key={filter}
          role="tab"
          aria-selected={value === filter}
          className={'filter-chip' + (value === filter ? ' active' : '')}
          onClick={() => onChange(filter)}
        >
          {t('filter.' + filter, filter)}
          {counts && counts[filter] != null ? <em>{counts[filter]}</em> : null}
        </button>
      ))}
    </div>
  );
}
