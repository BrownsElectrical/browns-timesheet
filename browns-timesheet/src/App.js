import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const HOUSE_TYPES = ['2-bed house','3-bed house','4-bed house','5-bed house','1-bed flat','2-bed flat','3-bed townhouse','4-bed townhouse']
const STAGES = ['1st Fix','2nd Fix','Heating','Final','Garage','EV Charger','Isolator']
const APP_PIN = process.env.REACT_APP_PIN || '1234'

const fmt = n => '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const initials = name => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
const currentMonth = () => new Date().toISOString().slice(0, 7)
const formatMonth = m => { if (!m) return ''; const [y, mo] = m.split('-'); return new Date(y, mo - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' }) }

const bedToType = (beds) => {
  const n = parseInt(beds)
  if (n === 1) return '1-bed flat'
  if (n === 2) return '2-bed house'
  if (n === 3) return '3-bed house'
  if (n === 4) return '4-bed house'
  if (n === 5) return '5-bed house'
  return '3-bed house'
}

const S = {
  header: { background: '#1a1a1a', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontSize: 16, fontWeight: 600 },
  logoGreen: { color: '#6dbf4a' },
  tabs: { display: 'flex', gap: 4, background: '#f0f0f0', padding: 4, borderRadius: 10, margin: '16px 16px 0', flexWrap: 'wrap' },
  tab: { flex: 1, padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: 7, fontSize: 13, color: '#666', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  tabActive: { background: '#fff', color: '#111', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  section: { padding: '16px' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: '16px', marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 },
  btn: { padding: '9px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, border: 'none' },
  btnGreen: { background: '#6dbf4a', color: '#fff' },
  btnOutline: { background: '#fff', border: '1px solid #ddd', color: '#333' },
  btnSm: { padding: '5px 10px', fontSize: 12 },
  btnDanger: { background: 'transparent', border: '1px solid #ddd', color: '#999', fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#fff' },
  label: { display: 'block', fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 500 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  metric: { background: '#f8f8f8', borderRadius: 10, padding: '12px 16px', textAlign: 'center' },
  metricVal: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  metricLabel: { fontSize: 11, color: '#888' },
  alert: { padding: '10px 14px', borderRadius: 8, fontSize: 13, position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  alertSuccess: { background: '#EAF3DE', color: '#27500A', border: '1px solid #9FE1CB' },
  alertError: { background: '#FCEBEB', color: '#791F1F', border: '1px solid #F7C1C1' },
  notice: { background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#633806', marginBottom: 12 },
}

function Alert({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return <div style={{ ...S.alert, ...(type === 'error' ? S.alertError : S.alertSuccess) }}>{msg}</div>
}

function PinScreen({ onAuth }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const submit = () => {
    if (pin === APP_PIN) { sessionStorage.setItem('browns_auth', '1'); onAuth() }
    else { setErr(true); setPin('') }
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 300, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>browns <span style={{ color: '#6dbf4a' }}>electrical</span></div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Timesheet — enter PIN</div>
        <input type="password" inputMode="numeric" maxLength={6} value={pin}
          onChange={e => { setPin(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ ...S.input, textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 12 }}
          placeholder="••••" autoFocus />
        {err && <div style={{ color: '#c0392b', fontSize: 12, marginBottom: 8 }}>Incorrect PIN</div>}
        <button style={{ ...S.btn, ...S.btnGreen, width: '100%' }} onClick={submit}>Enter</button>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('browns_auth'))
  const [user, setUser] = useState('admin')
  const [tab, setTab] = useState('tracker')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [sites, setSites] = useState([])
  const [plots, setPlots] = useState([])
  const [prices, setPrices] = useState([])
  const [claims, setClaims] = useState([])
  const [dayRates, setDayRates] = useState([])
  const [payrollMonth, setPayrollMonth] = useState(currentMonth())

  const notify = (msg, type = 'success') => setAlert({ msg, type })

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: emps }, { data: sts }, { data: pls }, { data: prs }, { data: cls }, { data: drs }] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('sites').select('*').order('name'),
      supabase.from('plots').select('*').order('plot_number'),
      supabase.from('site_prices').select('*'),
      supabase.from('stage_claims').select('*'),
      supabase.from('day_rate_entries').select('*').order('entry_date', { ascending: false }),
    ])
    setEmployees(emps || [])
    setSites(sts || [])
    setPlots(pls || [])
    setPrices(prs || [])
    setClaims(cls || [])
    setDayRates(drs || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (authed) loadAll() }, [authed, loadAll])

  const empName = () => {
    if (user === 'admin') return 'Admin'
    const e = employees.find(e => e.id === user)
    return e ? e.name : ''
  }

  const getPrice = (siteId, houseType, stage) => {
    const p = prices.find(p => p.site_id === siteId && p.house_type === houseType && p.stage === stage)
    return p ? p.price : 0
  }

  const getClaim = (plotId, stage) => claims.find(c => c.plot_id === plotId && c.stage === stage)

  if (!authed) return <PinScreen onAuth={() => setAuthed(true)} />

  const isAdmin = user === 'admin'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {alert && <Alert msg={alert.msg} type={alert.type} onDone={() => setAlert(null)} />}
      <div style={S.header}>
        <div style={S.logo}>browns <span style={S.logoGreen}>electrical</span></div>
        <select value={user} onChange={e => { setUser(e.target.value); setTab(e.target.value === 'admin' ? 'tracker' : 'mysheet') }}
          style={{ background: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="admin">Admin (Jack)</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div style={S.tabs}>
        {isAdmin
          ? ['tracker','payroll','setup'].map(t => (
            <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>
              {t === 'tracker' ? 'Site tracker' : t === 'payroll' ? 'Payroll' : 'Setup'}
            </button>
          ))
          : ['mysheet','myearnings'].map(t => (
            <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>
              {t === 'mysheet' ? 'My timesheet' : 'My earnings'}
            </button>
          ))
        }
      </div>

      <div style={S.section}>
        {loading
          ? <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
          : <>
            {tab === 'tracker' && <Tracker sites={sites} plots={plots} claims={claims} getPrice={getPrice} getClaim={getClaim}
              onLock={async id => { await supabase.from('stage_claims').update({ locked: true }).eq('id', id); notify('Locked ✓'); loadAll() }} />}
            {tab === 'payroll' && <Payroll sites={sites} plots={plots} claims={claims} dayRates={dayRates}
              employees={employees} getPrice={getPrice} month={payrollMonth} setMonth={setPayrollMonth} />}
            {tab === 'setup' && <Setup employees={employees} sites={sites} plots={plots} prices={prices}
              getPrice={getPrice} notify={notify} reload={loadAll} />}
            {tab === 'mysheet' && <MySheet empName={empName()} sites={sites} plots={plots} claims={claims}
              dayRates={dayRates} getPrice={getPrice} getClaim={getClaim} notify={notify} reload={loadAll} />}
            {tab === 'myearnings' && <MyEarnings empName={empName()} sites={sites} plots={plots}
              claims={claims} dayRates={dayRates} getPrice={getPrice} />}
          </>
        }
      </div>
    </div>
  )
}

function Tracker({ sites, plots, claims, getPrice, getClaim, onLock }) {
  if (sites.length === 0) return <div style={S.card}>No sites set up yet — go to Setup to add your first site.</div>
  return sites.map(site => {
    const sitePlots = plots.filter(p => p.site_id === site.id)
    const applicable = sitePlots.reduce((a, p) => a + STAGES.filter(s => getPrice(site.id, p.house_type, s) > 0).length, 0)
    const done = claims.filter(c => c.site_id === site.id && c.locked).length
    const pct = applicable > 0 ? Math.round(done / applicable * 100) : 0
    return (
      <div key={site.id} style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div><div style={{ fontWeight: 600, fontSize: 15 }}>{site.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{sitePlots.length} plots · extras £{site.extras_rate}/extra</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 20, fontWeight: 700 }}>{pct}%</div>
            <div style={{ fontSize: 11, color: '#888' }}>complete</div></div>
        </div>
        <div style={{ background: '#f0f0f0', borderRadius: 4, height: 5, marginBottom: 14 }}>
          <div style={{ background: '#6dbf4a', height: 5, borderRadius: 4, width: pct + '%', transition: 'width 0.3s' }} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888', borderBottom: '1px solid #f0f0f0' }}>Plot</th>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#888', borderBottom: '1px solid #f0f0f0' }}>Type</th>
              {STAGES.map(s => <th key={s} style={{ textAlign: 'center', padding: '4px 5px', color: '#888', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>{s}</th>)}
            </tr></thead>
            <tbody>{sitePlots.map(plot => (
              <tr key={plot.id}>
                <td style={{ padding: '5px 8px', fontWeight: 600, borderBottom: '1px solid #f8f8f8' }}>{plot.plot_number}</td>
                <td style={{ padding: '5px 8px', color: '#888', borderBottom: '1px solid #f8f8f8', whiteSpace: 'nowrap' }}>{plot.house_type}</td>
                {STAGES.map(stage => {
                  const price = getPrice(site.id, plot.house_type, stage)
                  const claim = getClaim(plot.id, stage)
                  return <td key={stage} style={{ textAlign: 'center', padding: '4px 3px', borderBottom: '1px solid #f8f8f8' }}>
                    {!price ? <span style={{ color: '#ccc' }}>—</span>
                      : !claim ? <span style={{ ...S.badge, ...S.badgeOpen }}>open</span>
                        : claim.locked ? <span style={{ ...S.badge, ...S.badgeLocked }}>✓ {claim.employee_name}</span>
                          : <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                            <span style={{ ...S.badge, ...S.badgeClaimed }}>{claim.employee_name}</span>
                            <button style={{ ...S.btn, ...S.btnGreen, fontSize: 10, padding: '2px 6px' }} onClick={() => onLock(claim.id)}>Green off</button>
                          </div>}
                  </td>
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    )
  })
}

function Payroll({ sites, plots, claims, dayRates, employees, getPrice, month, setMonth }) {
  const months = [...new Set([
    ...claims.filter(c => c.locked).map(c => c.month),
    ...dayRates.map(d => d.month),
    currentMonth()
  ])].sort().reverse()

  const empData = {}
  employees.forEach(e => { empData[e.name] = { lines: [], total: 0 } })

  claims.filter(c => c.locked && c.month === month).forEach(claim => {
    const plot = plots.find(p => p.id === claim.plot_id)
    const site = sites.find(s => s.id === claim.site_id)
    if (!plot || !site) return
    const price = getPrice(site.id, plot.house_type, claim.stage)
    const extrasAmt = (claim.extras_qty || 0) * site.extras_rate
    const total = price + extrasAmt
    if (!empData[claim.employee_name]) empData[claim.employee_name] = { lines: [], total: 0 }
    empData[claim.employee_name].lines.push({
      desc: `${plot.plot_number} – ${claim.stage}`,
      site: site.name.split('–')[0].trim(),
      extras: claim.extras_qty > 0 ? `${claim.extras_qty} × £${site.extras_rate}` : '',
      total
    })
    empData[claim.employee_name].total += total
  })

  dayRates.filter(d => d.month === month).forEach(d => {
    if (!empData[d.employee_name]) empData[d.employee_name] = { lines: [], total: 0 }
    empData[d.employee_name].lines.push({ desc: `Hourly – ${d.note}`, site: 'Hourly rate', extras: `${d.hours}hrs @ £${d.rate}`, total: d.total })
    empData[d.employee_name].total += d.total
  })

  const grandTotal = Object.values(empData).reduce((a, e) => a + e.total, 0)
  const activeEmps = Object.entries(empData).filter(([, e]) => e.lines.length > 0)

  return <>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
      <div><label style={S.label}>Month</label>
        <select value={month} onChange={e => setMonth(e.target.value)} style={{ ...S.input, width: 'auto' }}>
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
      </div>
      <div style={S.metric}><div style={S.metricVal}>{fmt(grandTotal)}</div>
        <div style={S.metricLabel}>Total payroll — {formatMonth(month)}</div></div>
    </div>
    {activeEmps.length === 0
      ? <div style={S.card}><div style={{ color: '#888', textAlign: 'center', padding: 24 }}>No locked entries for {formatMonth(month)} yet.</div></div>
      : activeEmps.map(([name, data]) => (
        <div key={name} style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8f8f8', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0C447C' }}>{initials(name)}</div>
              <div><div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{data.lines.length} line{data.lines.length !== 1 ? 's' : ''}</div></div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(data.total)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, padding: '6px 16px', fontSize: 11, color: '#888', borderBottom: '1px solid #f0f0f0' }}>
            <span>Description</span><span>Site</span><span>Extras / notes</span><span style={{ textAlign: 'right' }}>Amount</span>
          </div>
          {data.lines.map((line, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, padding: '8px 16px', fontSize: 13, borderBottom: '1px solid #f8f8f8' }}>
              <span style={{ fontWeight: 500 }}>{line.desc}</span>
              <span style={{ color: '#888' }}>{line.site}</span>
              <span style={{ color: '#888' }}>{line.extras || '—'}</span>
              <span style={{ textAlign: 'right', fontWeight: 500 }}>{fmt(line.total)}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, background: '#f8f8f8' }}>
            <span>Total</span><span /><span /><span style={{ textAlign: 'right' }}>{fmt(data.total)}</span>
          </div>
        </div>
      ))
    }
  </>
}

function Setup({ employees, sites, plots, prices, getPrice, notify, reload }) {
  const [newEmpName, setNewEmpName] = useState('')
  const [newEmpRole, setNewEmpRole] = useState('')
  const [newSiteName, setNewSiteName] = useState('')
  const [newExtrasRate, setNewExtrasRate] = useState(5)
  const [plotNums, setPlotNums] = useState({})
  const [plotTypes, setPlotTypes] = useState({})
  const [bulkPaste, setBulkPaste] = useState({})
  const [bulkPreview, setBulkPreview] = useState({})

  const addEmployee = async () => {
    if (!newEmpName.trim()) { notify('Enter a name', 'error'); return }
    await supabase.from('employees').insert({ name: newEmpName.trim(), role: newEmpRole.trim() || 'Electrician' })
    setNewEmpName(''); setNewEmpRole(''); notify(newEmpName + ' added'); reload()
  }

  const removeEmployee = async id => {
    await supabase.from('employees').delete().eq('id', id)
    notify('Removed'); reload()
  }

  const addSite = async () => {
    if (!newSiteName.trim()) { notify('Enter a site name', 'error'); return }
    const { data } = await supabase.from('sites').insert({ name: newSiteName.trim(), extras_rate: newExtrasRate }).select().single()
    if (data) {
      const priceRows = []
      HOUSE_TYPES.forEach(ht => STAGES.forEach(stage => priceRows.push({ site_id: data.id, house_type: ht, stage, price: 0 })))
      await supabase.from('site_prices').insert(priceRows)
    }
    setNewSiteName(''); notify('Site added — set prices before adding plots'); reload()
  }

  const addPlot = async siteId => {
    const num = (plotNums[siteId] || '').trim()
    const type = plotTypes[siteId] || HOUSE_TYPES[0]
    if (!num) { notify('Enter a plot number', 'error'); return }
    if (plots.find(p => p.site_id === siteId && p.plot_number === num)) { notify('Plot number exists', 'error'); return }
    await supabase.from('plots').insert({ site_id: siteId, plot_number: num, house_type: type })
    setPlotNums(prev => ({ ...prev, [siteId]: '' }))
    notify(num + ' added'); reload()
  }

  const deletePlot = async (plotId, plotNum) => {
    await supabase.from('stage_claims').delete().eq('plot_id', plotId)
    await supabase.from('plots').delete().eq('id', plotId)
    notify(plotNum + ' removed'); reload()
  }

  const parsePaste = (siteId, text) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    const parsed = []
    lines.forEach(line => {
      const parts = line.split('\t').map(p => p.trim())
      if (parts.length >= 2) {
        const plotNum = parts[0]
        const beds = parseInt(parts[1])
        if (plotNum && !isNaN(beds)) {
          parsed.push({ plotNum, type: bedToType(beds) })
        }
      }
    })
    setBulkPreview(prev => ({ ...prev, [siteId]: parsed }))
  }

  const commitBulk = async siteId => {
    const preview = bulkPreview[siteId] || []
    if (!preview.length) return
    const existing = plots.filter(p => p.site_id === siteId).map(p => p.plot_number)
    const toInsert = preview.filter(p => !existing.includes(p.plotNum))
    if (!toInsert.length) { notify('All plots already exist', 'error'); return }
    await supabase.from('plots').insert(toInsert.map(p => ({ site_id: siteId, plot_number: p.plotNum, house_type: p.type })))
    setBulkPaste(prev => ({ ...prev, [siteId]: '' }))
    setBulkPreview(prev => ({ ...prev, [siteId]: [] }))
    notify(`${toInsert.length} plots added`); reload()
  }

  const [localPrices, setLocalPrices] = useState({})
  const [savingPrices, setSavingPrices] = useState({})

  const setLocalPrice = (siteId, houseType, stage, val) => {
    setLocalPrices(prev => ({ ...prev, [`${siteId}|${houseType}|${stage}`]: val }))
  }

  const getLocalPrice = (siteId, houseType, stage) => {
    const key = `${siteId}|${houseType}|${stage}`
    return localPrices[key] !== undefined ? localPrices[key] : getPrice(siteId, houseType, stage)
  }

  const savePrices = async siteId => {
    setSavingPrices(prev => ({ ...prev, [siteId]: true }))
    await supabase.from('site_prices').delete().eq('site_id', siteId)
    const rows = []
    HOUSE_TYPES.forEach(ht => STAGES.forEach(stage => {
      rows.push({ site_id: siteId, house_type: ht, stage, price: parseFloat(getLocalPrice(siteId, ht, stage)) || 0 })
    }))
    await supabase.from('site_prices').insert(rows)
    setSavingPrices(prev => ({ ...prev, [siteId]: false }))
    notify('Prices saved ✓'); reload()
  }

  const hasPrices = siteId => prices.some(p => p.site_id === siteId && p.price > 0)

  return <>
    <div style={S.card}>
      <div style={S.cardTitle}>Employees</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8, marginBottom: 16 }}>
        {employees.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f8f8', border: '1px solid #eee', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0C447C', flexShrink: 0 }}>{initials(e.name)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div><div style={{ fontSize: 11, color: '#888' }}>{e.role}</div></div>
            <button style={S.btnDanger} onClick={() => removeEmployee(e.id)}>Remove</button>
          </div>
        ))}
      </div>
      <div style={S.grid3}>
        <div><label style={S.label}>Name</label><input style={S.input} placeholder="e.g. Dave" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} /></div>
        <div><label style={S.label}>Role</label><input style={S.input} placeholder="Electrician" value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} /></div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}><button style={{ ...S.btn, ...S.btnGreen }} onClick={addEmployee}>Add employee</button></div>
      </div>
    </div>

    <div style={S.card}>
      <div style={S.cardTitle}>Add new site</div>
      <div style={{ ...S.grid2, marginBottom: 12 }}>
        <div><label style={S.label}>Site name</label><input style={S.input} placeholder="e.g. Persimmon – Wantage" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} /></div>
        <div><label style={S.label}>Extras rate (£ per extra)</label><input style={S.input} type="number" value={newExtrasRate} onChange={e => setNewExtrasRate(e.target.value)} /></div>
      </div>
      <button style={{ ...S.btn, ...S.btnGreen }} onClick={addSite}>Add site</button>
    </div>

    {sites.map(site => {
      const sitePlots = plots.filter(p => p.site_id === site.id)
      const pricesSet = hasPrices(site.id)
      const preview = bulkPreview[site.id] || []
      return (
        <div key={site.id} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{site.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Extras: £{site.extras_rate}/extra</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Stage prices (£)</div>
            {!pricesSet && <div style={S.notice}>⚠ Set prices here before adding plots — stages won't show for employees until prices are saved.</div>}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ fontSize: 11, borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px 4px 0', color: '#888', whiteSpace: 'nowrap' }}>Type</th>
                  {STAGES.map(s => <th key={s} style={{ padding: '4px 4px', color: '#888', whiteSpace: 'nowrap', textAlign: 'center' }}>{s}</th>)}
                </tr></thead>
                <tbody>{HOUSE_TYPES.map(type => (
                  <tr key={type}>
                    <td style={{ padding: '3px 8px 3px 0', whiteSpace: 'nowrap', fontWeight: 500 }}>{type}</td>
                    {STAGES.map(stage => (
                      <td key={stage} style={{ padding: '3px 3px' }}>
                        <input type="number" value={getLocalPrice(site.id, type, stage)} min={0}
                          style={{ width: 62, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, textAlign: 'center' }}
                          onChange={e => setLocalPrice(site.id, type, stage, e.target.value)} />
                      </td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ fontSize: 11, color: '#888' }}>Enter 0 for stages that don't apply to that house type.</div>
              <button style={{ ...S.btn, ...S.btnGreen }} onClick={() => savePrices(site.id)} disabled={savingPrices[site.id]}>
                {savingPrices[site.id] ? 'Saving...' : 'Save prices'}
              </button>
            </div>
          </div>

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Plots ({sitePlots.length})</div>
          {sitePlots.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {sitePlots.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f0f0', borderRadius: 5, padding: '3px 8px', fontSize: 11 }}>
                  <span>{p.plot_number} · {p.house_type}</span>
                  <button onClick={() => deletePlot(p.id, p.plot_number)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13, lineHeight: 1, padding: '0 2px', fontFamily: 'inherit' }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 6 }}>Add single plot</div>
            <div style={S.grid3}>
              <div><label style={S.label}>Plot number</label>
                <input style={S.input} placeholder="e.g. Plot 6" value={plotNums[site.id] || ''} onChange={e => setPlotNums(prev => ({ ...prev, [site.id]: e.target.value }))} /></div>
              <div><label style={S.label}>House type</label>
                <select style={S.input} value={plotTypes[site.id] || HOUSE_TYPES[0]} onChange={e => setPlotTypes(prev => ({ ...prev, [site.id]: e.target.value }))}>
                  {HOUSE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select></div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}><button style={{ ...S.btn, ...S.btnOutline }} onClick={() => addPlot(site.id)}>Add plot</button></div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4 }}>Bulk add from Excel</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>In Excel, select two columns — plot number and bed count (e.g. 3). Copy and paste below.</div>
            <textarea
              style={{ ...S.input, minHeight: 80, fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }}
              placeholder={'Plot 1\t3\nPlot 2\t4\nPlot 3\t2'}
              value={bulkPaste[site.id] || ''}
              onChange={e => { setBulkPaste(prev => ({ ...prev, [site.id]: e.target.value })); parsePaste(site.id, e.target.value) }}
            />
            {preview.length > 0 && <>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Preview — {preview.length} plots:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {preview.map((p, i) => <span key={i} style={{ background: '#E6F1FB', color: '#0C447C', borderRadius: 5, padding: '3px 8px', fontSize: 11 }}>{p.plotNum} · {p.type}</span>)}
              </div>
              <button style={{ ...S.btn, ...S.btnGreen }} onClick={() => commitBulk(site.id)}>Add {preview.length} plots</button>
            </>}
          </div>
        </div>
      )
    })}
  </>
}

function MySheet({ empName, sites, plots, claims, dayRates, getPrice, getClaim, notify, reload }) {
  const [drDate, setDrDate] = useState(new Date().toISOString().split('T')[0])
  const [drHours, setDrHours] = useState(8)
  const [drRate, setDrRate] = useState(250)
  const [drNote, setDrNote] = useState('')

  const deleteClaim = async id => { await supabase.from('stage_claims').delete().eq('id', id); notify('Entry removed'); reload() }

  const claim = async (siteId, plotId, stage) => {
    if (getClaim(plotId, stage)) { notify('Already claimed', 'error'); return }
    await supabase.from('stage_claims').insert({ plot_id: plotId, site_id: siteId, employee_name: empName, stage, month: currentMonth(), extras_qty: 0 })
    notify('Logged — awaiting sign-off'); reload()
  }

  const updateExtras = async (claimId, qty) => { await supabase.from('stage_claims').update({ extras_qty: parseInt(qty) || 0 }).eq('id', claimId); reload() }

  const addHourlyRate = async () => {
    if (!drNote.trim()) { notify('Add a description', 'error'); return }
    await supabase.from('day_rate_entries').insert({ employee_name: empName, entry_date: drDate, hours: drHours, rate: drRate, total: drHours * drRate, note: drNote, month: drDate.slice(0, 7) })
    setDrNote(''); notify('Hourly rate logged'); reload()
  }

  const deleteHourlyRate = async id => { await supabase.from('day_rate_entries').delete().eq('id', id); notify('Entry deleted'); reload() }

  const myHourlyRates = dayRates.filter(d => d.employee_name === empName)

  return <>
    {sites.map(site => {
      const sitePlots = plots.filter(p => p.site_id === site.id)
      return (
        <div key={site.id} style={S.card}>
          <div style={S.cardTitle}>{site.name}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 8 }}>
            {sitePlots.map(plot => {
              const applicable = STAGES.filter(s => getPrice(site.id, plot.house_type, s) > 0)
              const allLocked = applicable.length > 0 && applicable.every(s => getClaim(plot.id, s)?.locked)
              const noPrices = applicable.length === 0
              return (
                <div key={plot.id} style={{ border: `1px solid ${allLocked ? '#9FE1CB' : '#eee'}`, borderRadius: 10, padding: '10px 12px', background: allLocked ? '#E1F5EE' : '#fafafa' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: allLocked ? '#085041' : '#111' }}>{plot.plot_number}</div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{plot.house_type}</div>
                  {noPrices
                    ? <div style={{ fontSize: 11, color: '#f59e0b' }}>No prices set — contact admin</div>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {STAGES.map(stage => {
                        const price = getPrice(site.id, plot.house_type, stage)
                        if (!price) return null
                        const c = getClaim(plot.id, stage)
                        if (c?.locked) return <span key={stage} style={{ padding: '3px 7px', fontSize: 11, borderRadius: 5, background: '#EAF3DE', color: '#27500A', border: '1px solid #9FE1CB' }}>✓ {stage}</span>
                        if (c?.employee_name === empName) return (
                          <div key={stage} style={{ width: '100%', marginTop: 6, paddingTop: 6, borderTop: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ fontSize: 11, color: '#888' }}>Extras – {stage}:</div>
                              <button style={S.btnDanger} onClick={() => deleteClaim(c.id)}>Remove</button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="number" min={0} defaultValue={c.extras_qty || 0} style={{ width: 60, ...S.input }} onBlur={e => updateExtras(c.id, e.target.value)} />
                              <span style={{ fontSize: 11, color: '#888' }}>× £{site.extras_rate} = {fmt((c.extras_qty || 0) * site.extras_rate)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>Pending sign-off</div>
                          </div>
                        )
                        if (c) return <span key={stage} style={{ padding: '3px 7px', fontSize: 11, borderRadius: 5, background: '#f0f0f0', color: '#bbb', border: '1px solid #eee' }}>{stage}</span>
                        return <button key={stage} onClick={() => claim(site.id, plot.id, stage)}
                          style={{ padding: '3px 7px', fontSize: 11, borderRadius: 5, background: '#E6F1FB', color: '#0C447C', border: '1px solid #B5D4F4', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {stage} {fmt(price)}
                        </button>
                      })}
                    </div>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )
    })}

    <div style={S.card}>
      <div style={S.cardTitle}>Hourly rate entries</div>
      {myHourlyRates.map(d => (
        <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f5f5f5', fontSize: 12 }}>
          <span style={{ color: '#888', minWidth: 80 }}>{d.entry_date}</span>
          <span style={{ flex: 1, padding: '0 12px' }}>{d.note}</span>
          <span style={{ fontWeight: 600, marginRight: 12 }}>{fmt(d.total)}</span>
          <button style={S.btnDanger} onClick={() => deleteHourlyRate(d.id)}>Delete</button>
        </div>
      ))}
      <div style={{ marginTop: 16 }}>
        <div style={{ ...S.grid3, marginBottom: 8 }}>
          <div><label style={S.label}>Date</label><input type="date" style={S.input} value={drDate} onChange={e => setDrDate(e.target.value)} /></div>
          <div><label style={S.label}>Hours</label><input type="number" style={S.input} value={drHours} onChange={e => setDrHours(e.target.value)} /></div>
          <div><label style={S.label}>Hourly rate (£)</label><input type="number" style={S.input} value={drRate} onChange={e => setDrRate(e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={S.label}>Description of work</label>
          <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' }} placeholder="e.g. Remedial – Plot 3 board fault" value={drNote} onChange={e => setDrNote(e.target.value)} />
        </div>
        <button style={{ ...S.btn, ...S.btnGreen }} onClick={addHourlyRate}>Log hourly rate</button>
      </div>
    </div>
  </>
}

function MyEarnings({ empName, sites, plots, claims, dayRates, getPrice }) {
  let total = 0, locked = 0, pending = 0
  claims.filter(c => c.employee_name === empName).forEach(c => {
    const plot = plots.find(p => p.id === c.plot_id)
    const site = sites.find(s => s.id === c.site_id)
    if (!plot || !site) return
    const amt = getPrice(site.id, plot.house_type, c.stage) + (c.extras_qty || 0) * site.extras_rate
    if (c.locked) locked += amt; else pending += amt
    total += amt
  })
  dayRates.filter(d => d.employee_name === empName).forEach(d => { total += d.total; locked += d.total })

  return (
    <div style={S.card}>
      <div style={{ ...S.grid3, marginBottom: 16 }}>
        <div style={S.metric}><div style={S.metricVal}>{fmt(total)}</div><div style={S.metricLabel}>Total earned</div></div>
        <div style={S.metric}><div style={{ ...S.metricVal, color: '#27500A' }}>{fmt(locked)}</div><div style={S.metricLabel}>Confirmed</div></div>
        <div style={S.metric}><div style={{ ...S.metricVal, color: '#92400e' }}>{fmt(pending)}</div><div style={S.metricLabel}>Awaiting sign-off</div></div>
      </div>
      <div style={{ fontSize: 12, color: '#888' }}>Green = confirmed by admin · Amber = submitted, awaiting sign-off</div>
    </div>
  )
}
