import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { PiggyBank, TrendingDown, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react'

// ─── Styles ────────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  .budget-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 767px) {
    .budget-grid { grid-template-columns: 1fr; }
  }

  .susi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 32px;
  }
  @media (max-width: 767px) {
    .susi-grid { grid-template-columns: 1fr; }
  }

  .budget-input {
    width: 100%;
    height: 44px;
    padding: 0 14px;
    border: 1.5px solid rgba(30,58,95,0.18);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #1E3A5F;
    background: #FFFFFF;
    outline: none;
    transition: border-color 150ms;
    box-sizing: border-box;
  }
  .budget-input:focus { border-color: #1E3A5F; }

  .budget-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 400ms cubic-bezier(.4,0,.2,1);
  }

  .susi-option {
    border: 1.5px solid rgba(30,58,95,0.15);
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: border-color 150ms, background 150ms;
    background: #FFFFFF;
  }
  .susi-option.active {
    border-color: #1E3A5F;
    background: rgba(30,58,95,0.04);
  }
`

// ─── SUSI thresholds (2025/26 indicative figures — verify at susi.ie) ─────────

const SUSI_BANDS = [
  { label: 'Under €42,000',   max: 42000,  result: 'full',    grant: '€3,025 - €6,115 / year', colour: '#145A3E' },
  { label: '€42,000 - €58,000', max: 58000, result: 'partial', grant: '€250 - €2,775 / year',   colour: '#7C3500' },
  { label: '€58,000 - €100,000', max: 100000, result: 'low',  grant: '€250 - €500 / year',      colour: '#2D4B8E' },
  { label: 'Over €100,000',   max: Infinity, result: 'none',  grant: 'Likely not eligible',      colour: '#6B7280' },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, light }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: light ? 'rgba(245,240,232,0.5)' : '#6B7280',
    }}>
      {children}
    </p>
  )
}

function InputRow({ label, name, value, onChange, prefix = '€', placeholder = '0' }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{
        display: 'block',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px', color: '#1E3A5F', fontWeight: '500',
        marginBottom: '6px',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#9CA3AF',
          pointerEvents: 'none',
        }}>
          {prefix}
        </span>
        <input
          type="number"
          min="0"
          step="50"
          className="budget-input"
          style={{ paddingLeft: '28px' }}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(name, Math.max(0, Number(e.target.value)))}
        />
      </div>
    </div>
  )
}

function SpendBar({ label, value, total, colour }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280' }}>
          {label}
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#1E3A5F', fontWeight: '600' }}>
          €{value.toLocaleString()}
        </span>
      </div>
      <div style={{ height: '8px', background: 'rgba(30,58,95,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          className="budget-bar-fill"
          style={{ width: `${pct}%`, background: colour }}
        />
      </div>
    </div>
  )
}

// ─── Interactive Budget Calculator ─────────────────────────────────────────────

const INCOME_DEFAULTS = { susi: 0, work: 0, family: 0, other_income: 0 }
const EXPENSE_DEFAULTS = { rent: 0, food: 0, transport: 0, phone: 0, socialising: 0, other_expense: 0 }

function BudgetCalculator() {
  const [income, setIncome] = useState(INCOME_DEFAULTS)
  const [expenses, setExpenses] = useState(EXPENSE_DEFAULTS)

  const totalIncome = useMemo(() => Object.values(income).reduce((a, b) => a + b, 0), [income])
  const totalExpenses = useMemo(() => Object.values(expenses).reduce((a, b) => a + b, 0), [expenses])
  const remaining = totalIncome - totalExpenses
  const isPositive = remaining >= 0
  const savingsRate = totalIncome > 0 ? Math.round((remaining / totalIncome) * 100) : 0

  const updateIncome = (name, val) => setIncome(prev => ({ ...prev, [name]: val }))
  const updateExpense = (name, val) => setExpenses(prev => ({ ...prev, [name]: val }))

  const EXPENSE_COLOURS = {
    rent: '#1E3A5F', food: '#145A3E', transport: '#2D4B8E',
    phone: '#7C3500', socialising: '#4C1D95', other_expense: '#9CA3AF',
  }
  const EXPENSE_LABELS = {
    rent: 'Rent', food: 'Food', transport: 'Transport',
    phone: 'Phone', socialising: 'Going out', other_expense: 'Other',
  }

  return (
    <div>
      <div className="budget-grid">

        {/* Income column */}
        <div style={{
          background: '#FFFFFF', borderRadius: '16px',
          padding: '28px', boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={18} color="#145A3E" />
            </div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }}>
              Monthly Income
            </p>
          </div>

          <InputRow label="SUSI Grant (monthly)"    name="susi"         value={income.susi}         onChange={updateIncome} />
          <InputRow label="Part-time work"          name="work"         value={income.work}         onChange={updateIncome} />
          <InputRow label="Family support"          name="family"       value={income.family}       onChange={updateIncome} />
          <InputRow label="Other income"            name="other_income" value={income.other_income} onChange={updateIncome} />

          <div style={{
            borderTop: '1px solid rgba(30,58,95,0.08)', marginTop: '16px', paddingTop: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>Total income</span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#145A3E' }}>
              €{totalIncome.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Expenses column */}
        <div style={{
          background: '#FFFFFF', borderRadius: '16px',
          padding: '28px', boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingDown size={18} color="#7C3500" />
            </div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1E3A5F' }}>
              Monthly Expenses
            </p>
          </div>

          <InputRow label="Rent / accommodation" name="rent"          value={expenses.rent}          onChange={updateExpense} />
          <InputRow label="Food & groceries"     name="food"          value={expenses.food}          onChange={updateExpense} />
          <InputRow label="Transport"            name="transport"     value={expenses.transport}     onChange={updateExpense} />
          <InputRow label="Phone"                name="phone"         value={expenses.phone}         onChange={updateExpense} />
          <InputRow label="Going out / social"   name="socialising"   value={expenses.socialising}   onChange={updateExpense} />
          <InputRow label="Other expenses"       name="other_expense" value={expenses.other_expense} onChange={updateExpense} />

          <div style={{
            borderTop: '1px solid rgba(30,58,95,0.08)', marginTop: '16px', paddingTop: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6B7280' }}>Total expenses</span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#7C3500' }}>
              €{totalExpenses.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Result card */}
      {(totalIncome > 0 || totalExpenses > 0) && (
        <div style={{
          marginTop: '24px',
          background: isPositive ? '#F0FDF4' : '#FEF2F2',
          border: `1.5px solid ${isPositive ? 'rgba(20,90,62,0.2)' : 'rgba(220,38,38,0.2)'}`,
          borderRadius: '16px', padding: '28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {isPositive
              ? <CheckCircle size={22} color="#145A3E" style={{ flexShrink: 0 }} />
              : <AlertCircle size={22} color="#DC2626" style={{ flexShrink: 0 }} />
            }
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '22px',
                color: isPositive ? '#145A3E' : '#DC2626',
              }}>
                {isPositive
                  ? `€${remaining.toLocaleString()} / month remaining`
                  : `€${Math.abs(remaining).toLocaleString()} / month overspend`
                }
              </p>
              {totalIncome > 0 && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: isPositive ? '#145A3E' : '#DC2626',
                  opacity: 0.75, marginTop: '4px',
                }}>
                  {isPositive
                    ? `Saving ${savingsRate}% of your income`
                    : `Spending ${Math.abs(savingsRate)}% more than you earn`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Spend breakdown */}
          {totalExpenses > 0 && (
            <div style={{ marginTop: '24px' }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: '#6B7280', fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px',
              }}>
                Where your money goes
              </p>
              {Object.entries(expenses)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <SpendBar
                    key={k}
                    label={EXPENSE_LABELS[k]}
                    value={v}
                    total={totalExpenses}
                    colour={EXPENSE_COLOURS[k]}
                  />
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SUSI Eligibility Checker ──────────────────────────────────────────────────

function SusiChecker() {
  const [income, setIncome] = useState('')
  const [status, setStatus] = useState('dependent') // dependent | independent

  const band = useMemo(() => {
    const val = Number(income)
    if (!val) return null
    return SUSI_BANDS.find(b => val <= b.max)
  }, [income])

  return (
    <div>
      {/* Disclaimer */}
      <div style={{
        background: 'rgba(30,58,95,0.06)', borderRadius: '10px', padding: '14px 16px',
        display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '28px',
      }}>
        <Info size={16} color="#1E3A5F" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px', color: '#6B7280', lineHeight: 1.5,
        }}>
          This is an estimate only, based on indicative 2025/26 income thresholds. Always apply directly at{' '}
          <a
            href="https://susi.ie"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1E3A5F', fontWeight: '600', textDecoration: 'underline' }}
          >
            susi.ie
          </a>
          {' '}for an official assessment.
        </p>
      </div>

      {/* Student status */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#1E3A5F', fontWeight: '600', marginBottom: '10px',
      }}>
        Are you a dependent or independent student?
      </p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'dependent',   label: 'Dependent',   sub: 'Under 23, full-time, from your family home' },
          { key: 'independent', label: 'Independent', sub: 'Over 23, or self-supporting' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setStatus(opt.key)}
            className={`susi-option${status === opt.key ? ' active' : ''}`}
            style={{ flex: 1, minWidth: '180px', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
          >
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px', color: '#1E3A5F', fontWeight: '600',
            }}>{opt.label}</p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '12px', color: '#9CA3AF', marginTop: '4px',
            }}>{opt.sub}</p>
          </button>
        ))}
      </div>

      {/* Income input */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{
          display: 'block',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '14px', color: '#1E3A5F', fontWeight: '600', marginBottom: '8px',
        }}>
          {status === 'dependent' ? 'Household reckonable income (approximate)' : 'Your reckonable income (approximate)'}
        </label>
        <div style={{ position: 'relative', maxWidth: '340px' }}>
          <span style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#9CA3AF',
            pointerEvents: 'none',
          }}>€</span>
          <input
            type="number" min="0" step="1000"
            className="budget-input"
            style={{ paddingLeft: '28px' }}
            placeholder="e.g. 45000"
            value={income}
            onChange={e => setIncome(e.target.value)}
          />
        </div>
      </div>

      {/* Result */}
      {band && (
        <div style={{
          background: '#FFFFFF', borderRadius: '14px',
          border: `2px solid ${band.colour}22`,
          borderLeft: `4px solid ${band.colour}`,
          padding: '24px 24px',
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: band.colour, marginBottom: '8px',
          }}>
            {band.result === 'full' && 'Likely eligible: full grant'}
            {band.result === 'partial' && 'Likely eligible: partial grant'}
            {band.result === 'low' && 'May be eligible: low grant'}
            {band.result === 'none' && 'Unlikely to be eligible'}
          </p>
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '24px', color: '#1E3A5F',
          }}>
            {band.grant}
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px', color: '#9CA3AF',
            marginTop: '8px', lineHeight: 1.5,
          }}>
            Based on indicative income thresholds. Actual grant depends on your full application, course level, and proximity to college.
          </p>
          <a
            href="https://susi.ie"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '16px', height: '40px', padding: '0 20px',
              background: '#1E3A5F', color: '#F5F0E8',
              borderRadius: '8px', textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
            }}
          >
            Apply at susi.ie
          </a>
        </div>
      )}

      {/* Income bands table */}
      <div style={{ marginTop: '32px' }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#9CA3AF', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px',
        }}>
          Indicative income bands
        </p>
        <div className="susi-grid">
          {SUSI_BANDS.map(b => (
            <div key={b.label} style={{
              background: '#FFFFFF', borderRadius: '10px',
              padding: '16px', borderTop: `3px solid ${b.colour}`,
              boxShadow: '0 1px 8px rgba(30,58,95,0.06)',
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px', color: '#9CA3AF', fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {b.label}
              </p>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '15px', color: '#1E3A5F', marginTop: '6px',
              }}>
                {b.grant}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── BudgetingPage ─────────────────────────────────────────────────────────────

export default function BudgetingPage() {
  const [activeTab, setActiveTab] = useState('calculator') // calculator | susi

  return (
    <>
      <Helmet>
        <title>Budgeting Tool | UniBlueprint</title>
        <meta name="description" content="Track your monthly income and expenses, check your SUSI grant eligibility, and get smart money tips. Free for all UniBlueprint users." />
        <meta property="og:title" content="Budgeting Tool | UniBlueprint" />
        <meta property="og:description" content="Track your monthly income and expenses, check your SUSI grant eligibility, and get smart money tips." />
      </Helmet>

      <style>{PAGE_STYLES}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#1E3A5F', padding: '96px 24px 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.02) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.02) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel light>Budgeting Tool</SectionLabel>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 5vw, 52px)', color: '#F5F0E8',
            marginTop: '10px', lineHeight: 1.1,
          }}>
            Budget smarter. Live better.
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '17px', color: 'rgba(245,240,232,0.6)',
            marginTop: '16px', maxWidth: '440px',
            margin: '16px auto 0', lineHeight: 1.65,
          }}>
            Track your monthly money, check SUSI eligibility, and make the most of every euro. Free inside the app.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
            {['Budget tracker', 'SUSI checker', 'Spend breakdown', 'Money tips'].map(pill => (
              <span key={pill} style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', color: 'rgba(245,240,232,0.6)',
                border: '1px solid rgba(245,240,232,0.15)',
                borderRadius: '20px', padding: '5px 14px',
              }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TAB BAR ───────────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid rgba(30,58,95,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex', padding: '0 24px',
        }}>
          {[
            { key: 'calculator', label: 'Budget Calculator' },
            { key: 'susi',       label: 'SUSI Grant Checker' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px', fontWeight: '600',
                color: activeTab === tab.key ? '#1E3A5F' : '#9CA3AF',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '16px 20px',
                borderBottom: activeTab === tab.key ? '2px solid #1E3A5F' : '2px solid transparent',
                transition: 'color 150ms, border-color 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '56px 24px 96px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {activeTab === 'calculator' ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '32px', color: '#1E3A5F',
                }}>
                  Monthly Budget Calculator
                </h2>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px', color: '#6B7280',
                  marginTop: '8px', lineHeight: 1.6,
                }}>
                  Enter your monthly income and expenses to see where you stand.
                </p>
              </div>
              <BudgetCalculator />
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '32px', color: '#1E3A5F',
                }}>
                  SUSI Grant Checker
                </h2>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px', color: '#6B7280',
                  marginTop: '8px', lineHeight: 1.6,
                }}>
                  Check if you might be eligible for a SUSI maintenance grant.
                </p>
              </div>
              <div style={{
                background: '#FFFFFF', borderRadius: '16px',
                padding: '32px', boxShadow: '0 2px 12px rgba(30,58,95,0.07)',
              }}>
                <SusiChecker />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FULL TOOL IN APP ─────────────────────────────────────────────── */}
      <section style={{ background: '#1E3A5F', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'rgba(245,240,232,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            border: '1px solid rgba(245,240,232,0.15)',
          }}>
            <PiggyBank size={28} color="#F5F0E8" />
          </div>
          <SectionLabel light>Inside the app</SectionLabel>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '36px', color: '#F5F0E8', marginTop: '10px',
          }}>
            The full Budgeting Tool
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px', color: 'rgba(245,240,232,0.6)',
            marginTop: '12px', lineHeight: 1.65,
          }}>
            The app version saves your budget month-to-month, sends spending alerts, tracks SUSI deadlines, and gives you personalised money tips based on your situation.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '12px', marginTop: '32px', textAlign: 'left',
          }}>
            {[
              { title: 'Saved budgets', body: 'Track month by month, not just once.' },
              { title: 'Spending alerts', body: 'Set a limit and get notified when you approach it.' },
              { title: 'SUSI reminders', body: 'Never miss a grant deadline again.' },
              { title: 'Money tips', body: 'Personalised to your income and course type.' },
            ].map(f => (
              <div key={f.title} style={{
                background: 'rgba(245,240,232,0.06)',
                border: '1px solid rgba(245,240,232,0.1)',
                borderRadius: '10px', padding: '16px',
              }}>
                <p style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '15px', color: '#F5F0E8',
                }}>{f.title}</p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px', color: 'rgba(245,240,232,0.5)',
                  marginTop: '4px', lineHeight: 1.5,
                }}>{f.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '36px' }}>
            <Link
              to="/download"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: '52px', padding: '0 32px',
                background: '#F5F0E8', color: '#1E3A5F',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Get the app
            </Link>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px', color: 'rgba(245,240,232,0.3)',
            marginTop: '12px',
          }}>
            Free on iOS and Android. Launching September 2026.
          </p>
        </div>
      </section>
    </>
  )
}
