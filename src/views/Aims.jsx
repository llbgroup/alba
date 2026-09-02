import { useState } from 'react'
import {
  MAX_MONTH_AIMS,
  MAX_YEAR_AIMS,
  YEAR_PREVIEW,
  addAim,
  areaById,
  carryAim,
  dropAim,
  openAims,
  updateAim,
  useAlba,
} from '../store'
import {
  formatMonthKey,
  isoWeekKey,
  monthKeyFromISO,
  monthKeysInYear,
  monthShortName,
  previousMonthKey,
  todayISO,
  weekCellLabel,
  weeksOverlappingMonth,
  yearOf,
} from '../lib/dates'
import TrashBtn from '../components/Trash'
import TagBar from '../components/TagBar'

function AimRow({ aim, size = 'month' }) {
  const s = useAlba()
  const area = areaById(s, aim.areaId)
  const [tagOpen, setTagOpen] = useState(false)

  return (
    <div className={'aim-row size-' + size}>
      <textarea
        className="aim-line"
        rows={size === 'year' ? 2 : 1}
        placeholder="Ein Satz."
        value={aim.title}
        onChange={(e) => updateAim(aim.id, { title: e.target.value })}
      />
      <TrashBtn onClick={() => dropAim(aim.id)} />
      <textarea
        className="aim-note"
        rows={2}
        placeholder="Kurz warum — optional"
        value={aim.note || ''}
        onChange={(e) => updateAim(aim.id, { note: e.target.value })}
      />
      <button
        type="button"
        className={'aim-tag' + (tagOpen ? ' open' : '')}
        onClick={() => setTagOpen((v) => !v)}
      >
        {area ? (
          <span className={'pip ' + area.tone}>
            <i />
            {area.name}
          </span>
        ) : (
          <span className="quiet">Tag</span>
        )}
      </button>
      {tagOpen && (
        <TagBar
          embedded
          allowCreate={false}
          noneLabel="Ohne"
          value={aim.areaId || ''}
          onChange={(id) => {
            updateAim(aim.id, { areaId: id || null })
            setTagOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddAim({ horizon, year, monthKey, weekKey, areaId, placeholder }) {
  const [text, setText] = useState('')
  return (
    <form
      className="inline-add tight"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        const added = addAim({
          title: text.trim(),
          horizon,
          year: year || null,
          monthKey: monthKey || null,
          weekKey: weekKey || null,
          areaId: areaId || null,
        })
        if (added) setText('')
      }}
    >
      <span className="plus">+</span>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
    </form>
  )
}

export default function Aims() {
  const s = useAlba()
  const today = todayISO()
  const year = yearOf(today)
  const currentMonth = monthKeyFromISO(today)
  const currentWeek = isoWeekKey(today)
  const [focusMonth, setFocusMonth] = useState(currentMonth)
  const [focusWeek, setFocusWeek] = useState(null)
  const [filter, setFilter] = useState('')
  const [yearOpen, setYearOpen] = useState(false)

  const tagged = (list) => (filter ? list.filter((a) => a.areaId === filter) : list)
  const yearAll = openAims(s, { horizon: 'year', year })
  const monthAll = openAims(s, { horizon: 'month', monthKey: focusMonth })
  const yearAims = tagged(yearAll)
  const monthAims = tagged(monthAll)
  const weeks = weeksOverlappingMonth(focusMonth)
  const activeWeek =
    focusWeek && weeks.includes(focusWeek)
      ? focusWeek
      : weeks.includes(currentWeek)
        ? currentWeek
        : weeks[0]
  const weekAll = openAims(s, { horizon: 'week', weekKey: activeWeek })
  const weekOpen = tagged(weekAll)
  const prevMonth = previousMonthKey(focusMonth)
  const prevAims = openAims(s, { horizon: 'month', monthKey: prevMonth })
  const canCarry = focusMonth === currentMonth && monthAll.length < MAX_MONTH_AIMS && prevAims.length > 0

  const yearCollapsed = !yearOpen && yearAims.length > YEAR_PREVIEW
  const yearShown = yearCollapsed ? yearAims.slice(0, YEAR_PREVIEW) : yearAims

  function pickMonth(mk) {
    setFocusMonth(mk)
    const nextWeeks = weeksOverlappingMonth(mk)
    setFocusWeek(nextWeeks.includes(currentWeek) ? currentWeek : nextWeeks[0] || null)
  }

  return (
    <div className="aims">
      <div className="dateblock">
        <p className="dow">Richtung</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(40px, 6vw, 56px)' }}>
          Ziele
        </h1>
        <p className="month">Jahr, dann der Monat, dann die Wochen. Sätze, keine Ordner.</p>
      </div>

      <TagBar embedded value={filter} onChange={setFilter} />

      <section className="aims-year">
        <div className="section-head">
          <span className="section-label">{year}</span>
          <span className="quiet">{yearAll.length}</span>
        </div>
        <div className={'aim-stack' + (yearCollapsed ? ' faded' : '')}>
          {yearShown.map((a) => (
            <AimRow key={a.id} aim={a} size="year" />
          ))}
          {yearCollapsed && <div className="aim-fade" aria-hidden="true" />}
        </div>
        {yearAims.length > YEAR_PREVIEW && (
          <button type="button" className="lane-toggle" onClick={() => setYearOpen((v) => !v)}>
            {yearOpen ? 'Weniger' : `Weitere ${yearAims.length - YEAR_PREVIEW} anzeigen`}
          </button>
        )}
        {yearAll.length < MAX_YEAR_AIMS && (
          <AddAim horizon="year" year={year} areaId={filter} placeholder="Wohin das Jahr zeigt" />
        )}
      </section>

      <section className="aims-grid-wrap">
        <div className="section-head">
          <span className="section-label">Jahr im Blick</span>
          <span className="quiet">{formatMonthKey(focusMonth)}</span>
        </div>
        <div className="aim-year-grid">
          {monthKeysInYear(year).map((mk) => {
            const items = tagged(openAims(s, { horizon: 'month', monthKey: mk }))
            const past = mk < currentMonth
            return (
              <button
                key={mk}
                type="button"
                className={
                  'aim-cell' +
                  (mk === focusMonth ? ' on' : '') +
                  (mk === currentMonth ? ' now' : '') +
                  (past ? ' past' : '')
                }
                onClick={() => pickMonth(mk)}
              >
                <span className="aim-cell-month">{monthShortName(mk)}</span>
                <span className={'aim-cell-line' + (!items[0] ? ' empty' : '')}>
                  {items[0]?.title || 'offen'}
                </span>
                {items[1] ? <span className="aim-cell-line quiet">{items[1].title}</span> : null}
              </button>
            )
          })}
        </div>
      </section>

      <section className={'aims-now' + (focusMonth < currentMonth ? ' is-past' : '')}>
        <div className="section-head">
          <span className="section-label">
            {formatMonthKey(focusMonth)}
            {focusMonth === currentMonth
              ? ' · dieser Monat'
              : focusMonth < currentMonth
                ? ' · vorbei'
                : ''}
          </span>
          <span className="quiet">
            {monthAll.length}/{MAX_MONTH_AIMS}
          </span>
        </div>
        {monthAims.map((a) => (
          <AimRow key={a.id} aim={a} size="month" />
        ))}
        {monthAll.length < MAX_MONTH_AIMS && (
          <AddAim horizon="month" monthKey={focusMonth} areaId={filter} placeholder="Dieser Monat" />
        )}
        {canCarry && (
          <div className="aim-carry">
            <p className="quiet">Aus {formatMonthKey(prevMonth)} mitnehmen</p>
            {prevAims.map((a) => (
              <button
                key={a.id}
                type="button"
                className="chip"
                onClick={() => carryAim(a.id, focusMonth)}
              >
                {a.title || 'Ohne Titel'}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="aims-weeks">
        <div className="section-head">
          <span className="section-label">Wochen</span>
          <span className="quiet">{formatMonthKey(focusMonth)}</span>
        </div>
        <p className="quiet" style={{ marginTop: -6 }}>
          Ein Satz pro Woche. Die Karte ist der Plan.
        </p>
        <div className="aim-week-grid">
          {weeks.map((wk) => {
            const items = tagged(openAims(s, { horizon: 'week', weekKey: wk }))
            const past = wk < currentWeek
            return (
              <button
                key={wk}
                type="button"
                className={
                  'aim-cell' +
                  (wk === activeWeek ? ' on' : '') +
                  (wk === currentWeek ? ' now' : '') +
                  (past ? ' past' : '')
                }
                onClick={() => setFocusWeek(wk)}
              >
                <span className="aim-cell-month">{weekCellLabel(wk, today)}</span>
                <span className={'aim-cell-line' + (!items[0] ? ' empty' : '')}>
                  {items[0]?.title || 'offen'}
                </span>
              </button>
            )
          })}
        </div>
        {weekOpen.map((a) => (
          <AimRow key={a.id} aim={a} size="week" />
        ))}
        {!weekAll.length && (
          <AddAim
            horizon="week"
            weekKey={activeWeek}
            areaId={filter}
            placeholder="Worauf diese Woche zeigt"
          />
        )}
      </section>
    </div>
  )
}
