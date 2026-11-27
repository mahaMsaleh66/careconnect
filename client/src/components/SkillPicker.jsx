import { useState } from 'react';
import { X } from 'lucide-react';

export const SKILL_GROUPS = [
  {
    group: 'Medical & Care',
    skills: ['Nurse', 'First Aid & CPR', 'Doctor / Paramedic', 'Counseling & Psychosocial Support'],
  },
  {
    group: 'Teaching & Youth',
    skills: ['Teacher / Tutoring', 'Child Care'],
  },
  {
    group: 'Ground & Technical Work',
    skills: [
      'Logistics & Supply Distribution',
      'Driving & Transport',
      'General Hands-on Work',
      'IT & Data Coordination',
    ],
  },
  {
    group: 'Communication & Languages',
    skills: [
      'Strong Communication',
      'Urdu & English',
      'Sindhi',
      'Pashto',
      'Punjabi',
      'Saraiki / Balochi',
    ],
  },
];

export function parseSkills(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinSkills(list) {
  const skills = parseSkills(list);
  const kept = [];
  for (const skill of skills) {
    const next = kept.length ? kept.join(', ') + ', ' + skill : skill;
    if (next.length > 255) break;
    kept.push(skill);
  }
  return kept.join(', ');
}

export default function SkillPicker({ value, onChange }) {
  const selected = parseSkills(value);
  const [custom, setCustom] = useState('');

  const add = (skill) => {
    const next = skill.trim();
    if (!next) return;
    if (selected.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    onChange([...selected, next]);
  };

  const remove = (skill) => {
    onChange(selected.filter((item) => item !== skill));
  };

  const addCustom = () => {
    add(custom);
    setCustom('');
  };

  return (
    <div className="skill-picker">
      <label className="skill-label">Skills (select as many as apply)</label>
      <select
        className="skill-select"
        value=""
        onChange={(e) => {
          if (e.target.value) add(e.target.value);
        }}
      >
        <option value="">Add a suggested skill…</option>
        {SKILL_GROUPS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.skills.map((skill) => (
              <option
                key={skill}
                value={skill}
                disabled={selected.some((item) => item.toLowerCase() === skill.toLowerCase())}
              >
                {skill}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {selected.length > 0 && (
        <div className="skill-chips">
          {selected.map((skill) => (
            <span className="skill-chip" key={skill}>
              {skill}
              <button type="button" aria-label={'Remove ' + skill} onClick={() => remove(skill)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="skill-custom">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Other skill (optional)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className="btn small" onClick={addCustom} disabled={!custom.trim()}>
          Add
        </button>
      </div>
      <p className="skill-hint">
        Pick several skills or add your own. They are saved as a comma-separated list so AI volunteer matching still works.
      </p>
    </div>
  );
}
