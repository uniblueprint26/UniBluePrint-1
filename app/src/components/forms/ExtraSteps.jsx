import { FormTextArea, FormTextInput, ChoiceGrid } from './FormControls'

// Extra, detailed questions for the Foundation builders (founder, round three:
// "make sure everything is detailed with what we need to make the best possible
// output per person"). Each builder lists its extra questions as plain
// definitions. They become optional steps just before delivery, and their
// answers travel as one object (`extra_detail`, keyed by the question label) so
// the generator can read them with a single field.
//
// def: { key, label, title, subtitle?, kind: 'text' | 'line' | 'choice',
//        placeholder?, options? }

export function extraDefaults(defs) {
  const out = {}
  defs.forEach(d => { out[d.key] = d.kind === 'choice' ? null : '' })
  return out
}

export function extraSteps(defs) {
  return defs.map(d => ({
    key: d.key,
    title: d.title,
    subtitle: d.subtitle,
    optional: true,
    reviewLabel: d.label,
    render: (value, onChange) => {
      if (d.kind === 'choice') return <ChoiceGrid options={d.options} value={value} onChange={onChange} />
      if (d.kind === 'line') return <FormTextInput value={value} onChangeText={onChange} placeholder={d.placeholder || ''} maxLength={300} />
      return <FormTextArea value={value} onChangeText={onChange} placeholder={d.placeholder || 'Optional'} minHeight={d.minHeight || 130} maxLength={2000} />
    },
  }))
}

// One object, only the questions that were answered.
export function extraDetail(values, defs) {
  const out = {}
  defs.forEach(d => {
    const v = values[d.key]
    if (v === null || v === undefined) return
    const t = typeof v === 'string' ? v.trim() : v
    if (t === '') return
    if (d.kind === 'choice') {
      const opt = (d.options || []).find(o => (typeof o === 'string' ? o : o.value) === t)
      out[d.label] = opt ? (typeof opt === 'string' ? opt : opt.label) : String(t)
    } else {
      out[d.label] = t
    }
  })
  return Object.keys(out).length ? out : null
}
