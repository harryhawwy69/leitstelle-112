import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { SPEEDS, type HostSnapshot } from '@ls112/protocol';
import { formatClock, formatDate, formatDuration, formatTimeOfDay } from './format';
import { useSim, type SimEventEntry } from './sim-store';
import { useGlobalShortcuts } from './use-shortcuts';
import css from './App.module.css';

/** Notrufe sollen schnell angenommen werden; ab diesen Wartezeiten wird die Zeile auffällig. */
const CALL_WARN_MS = 10_000;
const CALL_ALARM_MS = 30_000;

const FMS_LEGEND = ['1', '2', '3', '4', '7', '8', '5', '0', '6', '9'] as const;

export function App() {
  useGlobalShortcuts();
  const state = useSim((s) => s.state);
  const status = useSim((s) => s.status);

  return (
    <div className={css.shell}>
      <Header state={state} status={status} />
      <main className={css.workspace}>
        <CallsPanel state={state} />
        <MapPanel />
        <VehiclesPanel />
        <EventLog />
      </main>
      <Footer state={state} />
    </div>
  );
}

function Header({ state, status }: { state: HostSnapshot | undefined; status: string }) {
  const { t } = useTranslation();
  const togglePause = useSim((s) => s.togglePause);
  const setSpeed = useSim((s) => s.setSpeed);
  const paused = state?.paused ?? false;

  return (
    <header className={css.header}>
      <div className={css.brand}>
        <span className={css.brandMark} aria-hidden="true">
          112
        </span>
        <span className={css.brandTitle}>{t('app.title')}</span>
        <span className={css.brandSub}>{t('app.center')}</span>
      </div>

      <div className={css.clock} data-testid="sim-clock">
        {state && (
          <>
            <span className={css.clockDate}>
              {formatDate(state.calendar, t(`clock.weekday.${state.calendar.weekday.toString()}`))}
            </span>
            <span className={css.clockTime} data-testid="sim-time">
              {formatClock(state.calendar)}
            </span>
            {paused && (
              <span className={css.pausedBadge} data-testid="paused-badge">
                {t('clock.paused')}
              </span>
            )}
          </>
        )}
      </div>

      <div className={css.controls} role="group" aria-label={t('shortcuts.speed')}>
        <button
          type="button"
          className={`${css.ctrl} ${paused ? css.ctrlActive : ''}`}
          onClick={togglePause}
          aria-pressed={paused}
          data-testid="btn-pause"
          title={`${paused ? t('clock.resume') : t('clock.pause')} (Leertaste)`}
        >
          {paused ? '▶' : '❚❚'}
        </button>
        {SPEEDS.map((speed, i) => (
          <button
            key={speed}
            type="button"
            className={`${css.ctrl} ${state?.speed === speed && !paused ? css.ctrlActive : ''}`}
            onClick={() => {
              setSpeed(speed);
            }}
            aria-pressed={state?.speed === speed}
            data-testid={`btn-speed-${speed.toString()}`}
            title={`${t('clock.speed', { speed })} (${(i + 1).toString()})`}
          >
            {speed}×
          </button>
        ))}
      </div>

      <div className={css.connection} role="status">
        <span
          className={`${css.dot} ${status === 'connected' ? css.dotOk : status === 'disconnected' ? css.dotBad : ''}`}
        />
        {t(`app.${status}`)}
      </div>
    </header>
  );
}

function CallsPanel({ state }: { state: HostSnapshot | undefined }) {
  const { t } = useTranslation();
  const send = useSim((s) => s.send);
  const calls = state?.waitingCalls ?? [];
  const now = state?.time ?? 0;
  const anyAlarm = calls.some((c) => now - c.receivedAt >= CALL_ALARM_MS);

  return (
    <section className={`${css.panel} ${css.calls}`} aria-label={t('panel.calls')}>
      <div className={css.panelHeader}>
        {t('panel.calls')}
        <span
          className={`${css.count} ${anyAlarm ? css.countAlarm : ''}`}
          data-testid="calls-count"
        >
          {calls.length}
        </span>
      </div>
      <div className={css.panelBody}>
        {calls.length === 0 && <div className={css.empty}>{t('calls.empty')}</div>}
        {calls.map((call, index) => {
          const waited = now - call.receivedAt;
          const level =
            waited >= CALL_ALARM_MS ? css.callAlarm : waited >= CALL_WARN_MS ? css.callWarn : '';
          return (
            <div key={call.id} className={`${css.callRow} ${level}`} data-testid="call-row">
              <span className={css.callStripe} aria-hidden="true" />
              <div>
                <div className={css.callTitle}>112 · {t('calls.line', { n: index + 1 })}</div>
                <div className={css.callMeta}>
                  {call.id} · {t('calls.waiting', { duration: formatDuration(waited) })}
                </div>
              </div>
              <button
                type="button"
                className={css.acceptBtn}
                onClick={() => {
                  send({ type: 'sim/command', command: { type: 'call/accept', callId: call.id } });
                }}
              >
                {t('calls.accept')}
                {index === 0 && <span className={css.kbd}>{t('calls.acceptHint')}</span>}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MapPanel() {
  const { t } = useTranslation();
  return (
    <section className={`${css.panel} ${css.map}`} aria-label={t('panel.map')}>
      <div className={css.panelHeader}>{t('panel.map')}</div>
      <div className={css.panelBody}>
        <div className={css.mapPlaceholder}>
          <div className={css.mapHint}>{t('map.placeholder')}</div>
        </div>
      </div>
    </section>
  );
}

function VehiclesPanel() {
  const { t } = useTranslation();
  return (
    <section className={`${css.panel} ${css.vehicles}`} aria-label={t('panel.vehicles')}>
      <div className={css.panelHeader}>{t('panel.vehicles')}</div>
      <div className={css.panelBody}>
        <div className={css.legendIntro}>{t('vehicles.placeholder')}</div>
        <ul className={css.legend}>
          {FMS_LEGEND.map((code) => (
            <li key={code} className={css.legendItem}>
              <span className={css.fms} style={{ background: `var(--fms-${code})` }}>
                {code}
              </span>
              {t(`fms.${code}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const LOG_CLASS: Record<SimEventEntry['type'], string | undefined> = {
  'call/incoming': css.logIncoming,
  'call/accepted': css.logAccepted,
  'call/abandoned': css.logAbandoned,
  'command/rejected': css.logRejected,
};

function EventLog() {
  const { t } = useTranslation();
  const events = useSim((s) => s.events);
  return (
    <section className={`${css.panel} ${css.log}`} aria-label={t('panel.log')}>
      <div className={css.panelHeader}>{t('panel.log')}</div>
      <div className={css.panelBody}>
        <ul className={css.logList} data-testid="event-log">
          {events.map((e) => (
            <li key={e.key} className={css.logRow}>
              <span className={css.logTime}>{formatTimeOfDay(e.at)}</span>
              <span className={LOG_CLASS[e.type]}>{describeEvent(e, t)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function describeEvent(e: SimEventEntry, t: TFunction): string {
  switch (e.type) {
    case 'call/incoming':
    case 'call/abandoned':
      return t(`events.${e.type}`, { callId: e.callId });
    case 'call/accepted':
      return t('events.call/accepted', { callId: e.callId, waited: formatDuration(e.waitedMs) });
    case 'command/rejected':
      return t('events.command/rejected', { reason: t(`events.reason.${e.reason}`) });
  }
}

function Footer({ state }: { state: HostSnapshot | undefined }) {
  const { t } = useTranslation();
  const stats = state?.stats;
  const avg = stats && stats.callsAccepted > 0 ? stats.totalWaitMs / stats.callsAccepted : 0;
  return (
    <footer className={css.footer}>
      <span className={css.stat}>
        {t('stats.received')}
        <strong data-testid="stat-received">{stats?.callsReceived ?? 0}</strong>
      </span>
      <span className={css.stat}>
        {t('stats.accepted')}
        <strong>{stats?.callsAccepted ?? 0}</strong>
      </span>
      <span className={css.stat}>
        {t('stats.abandoned')}
        <strong>{stats?.callsAbandoned ?? 0}</strong>
      </span>
      <span className={css.stat}>
        {t('stats.avgWait')}
        <strong>{formatDuration(avg)}</strong>
      </span>
      <span className={css.shortcuts} aria-label={t('shortcuts.title')}>
        <span>
          <span className={css.kbd}>Leertaste</span> {t('shortcuts.pause')}
        </span>
        <span>
          <span className={css.kbd}>1–4</span> {t('shortcuts.speed')}
        </span>
        <span>
          <span className={css.kbd}>F2</span> {t('shortcuts.accept')}
        </span>
      </span>
    </footer>
  );
}
