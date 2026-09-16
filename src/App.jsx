import { useCallback, useEffect, useState } from 'react';
import { api, clearSession, hasSession, login, setSession } from './api';
import './styles.css';

const LOGO = '/raylandlogo.png';
const NAV = [['overview', 'Overview'], ['orders', 'Orders'], ['activity', 'EDI activity'], ['system', 'System']];

function formatDate(value, withTime = false) {
  if (!value) return '-';
  const date = /^\d{8}$/.test(String(value))
    ? new Date(`${String(value).slice(0, 4)}-${String(value).slice(4, 6)}-${String(value).slice(6, 8)}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function Status({ value }) {
  const normalized = String(value || 'unknown').toLowerCase();
  const tone = ['delivered', 'processed', 'ready', 'configured', 'ok'].includes(normalized)
    ? 'success'
    : ['failed', 'rejected', 'unavailable'].includes(normalized)
      ? 'danger'
      : ['queued', 'retrying', 'sending', 'manual', 'configuration_required'].includes(normalized)
        ? 'warning'
        : 'neutral';
  return <span className={`status status-${tone}`}>{normalized.replaceAll('_', ' ')}</span>;
}

function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await login(password);
      setSession(result.accessToken);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <section className="login-card">
        <img src={LOGO} alt="Ray Land" className="login-logo" />
        <div className="eyebrow">BUSINESSOS</div>
        <h1>EDI operations</h1>
        <p className="muted">A focused workspace for FEMA purchase orders and GEX transaction status.</p>
        <form onSubmit={submit}>
          <label htmlFor="password">Administrator password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required autoFocus />
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button" disabled={busy || !password}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="login-note">Authorized Ray Land personnel only.</p>
      </section>
    </main>
  );
}

function Metric({ label, value, note, tone = 'blue' }) {
  return <div className={`metric metric-${tone}`}><span>{label}</span><strong>{value ?? 0}</strong><small>{note}</small></div>;
}

function Empty({ title, detail }) {
  return <div className="empty-state"><div className="empty-mark">-</div><h3>{title}</h3><p>{detail}</p></div>;
}

function MessageTable({ messages, onRetry, compact = false }) {
  if (!messages?.length) return <Empty title="No EDI activity" detail="Transactions will appear here after a test or production message is received." />;
  return (
    <div className="table-scroll"><table><thead><tr><th>Time</th><th>Direction</th><th>Document</th><th>Order</th><th>Status</th>{!compact && <th>Attempts</th>}{!compact && <th aria-label="Actions" />}</tr></thead>
      <tbody>{messages.map(message => <tr key={message.id}>
        <td className="nowrap">{formatDate(message.created_at, true)}</td><td>{message.direction}</td><td className="document-type">X12 {message.message_type}</td><td>{message.do_number || '-'}</td><td><Status value={message.status} /></td>
        {!compact && <td>{message.attempts ?? 0}</td>}
        {!compact && <td className="action-cell">{message.direction === 'outbound' && ['failed', 'retrying'].includes(message.status) && <button className="text-button" onClick={() => onRetry(message.id)}>Retry</button>}</td>}
      </tr>)}</tbody>
    </table></div>
  );
}

function Overview({ dashboard, onNavigate, onRetry }) {
  const counts = dashboard?.counts || {};
  return <>
    <div className="page-heading"><div><div className="eyebrow">CURRENT OPERATIONS</div><h1>Overview</h1></div><button className="secondary-button" onClick={() => onNavigate('system')}>Connection details</button></div>
    <div className="metrics-grid"><Metric label="Orders" value={counts.total} note="Received and recorded" /><Metric label="New orders" value={counts.active} note="Current order type" tone="indigo" /><Metric label="850 received" value={counts.inbound_850} note="Inbound purchase orders" tone="slate" /><Metric label="997 pending" value={counts.pending} note="Awaiting delivery" tone={counts.pending ? 'amber' : 'green'} /></div>
    {counts.failed > 0 && <div className="alert alert-danger"><div><strong>{counts.failed} transaction{counts.failed === 1 ? '' : 's'} need attention.</strong><span>Review EDI activity and retry after resolving the connection issue.</span></div><button className="secondary-button" onClick={() => onNavigate('activity')}>Review</button></div>}
    <section className="panel"><div className="panel-heading"><div><h2>Recent EDI activity</h2><p>Latest inbound and outbound messages.</p></div><button className="text-button" onClick={() => onNavigate('activity')}>View all</button></div><MessageTable messages={dashboard?.recentMessages || []} onRetry={onRetry} compact /></section>
  </>;
}

function Orders({ orders, selected, onSelect, detail, loadingDetail }) {
  return <>
    <div className="page-heading"><div><div className="eyebrow">X12 850</div><h1>Orders</h1><p>Purchase orders received from FEMA through GEX.</p></div></div>
    <div className="split-layout">
      <section className="panel order-list-panel">{orders.length === 0 ? <Empty title="No orders received" detail="The first validated 850 will appear here." /> : <div className="order-list">{orders.map(order => <button key={order.do_number} className={`order-row ${selected === order.do_number ? 'selected' : ''}`} onClick={() => onSelect(order.do_number)}><div><strong>{order.do_number}</strong><span>{order.destination_facility || 'Destination not provided'}</span></div><div className="order-row-meta"><Status value={order.acknowledgment_status} /><span>{order.line_count} line{order.line_count === 1 ? '' : 's'}</span></div></button>)}</div>}</section>
      <section className="panel order-detail-panel">
        {!selected ? <Empty title="Select an order" detail="Choose a purchase order to review its details and acknowledgment state." /> : loadingDetail ? <div className="loading">Loading order...</div> : detail ? <div>
          <div className="detail-header"><div><div className="eyebrow">DISTRIBUTION ORDER</div><h2>{detail.order.do_number}</h2></div><Status value={detail.order.order_type} /></div>
          <dl className="details-grid"><div><dt>Origin</dt><dd>{detail.order.origin_facility || '-'}</dd></div><div><dt>Destination</dt><dd>{detail.order.destination_facility || '-'}</dd></div><div><dt>Requested delivery</dt><dd>{formatDate(detail.order.requested_delivery)}</dd></div><div><dt>RRF number</dt><dd>{detail.order.rrf_number || '-'}</dd></div><div><dt>Fund cite</dt><dd>{detail.order.fund_cite || '-'}</dd></div><div><dt>Received</dt><dd>{formatDate(detail.order.created_at, true)}</dd></div></dl>
          {detail.order.notes && <div className="notes"><span>Notes</span>{detail.order.notes}</div>}
          <h3 className="section-label">Line items</h3>{detail.lines.length ? <div className="line-items">{detail.lines.map(line => <div className="line-item" key={line.id}><div><strong>{line.sku || `Line ${line.line_number}`}</strong><span>{line.description || 'No description supplied'}</span></div><b>{line.quantity} {line.unit || 'UN'}</b></div>)}</div> : <p className="muted">No line items were parsed.</p>}
          <h3 className="section-label">Transaction history</h3><MessageTable messages={detail.messages} compact />
        </div> : <Empty title="Order unavailable" detail="The order could not be loaded." />}
      </section>
    </div>
  </>;
}

function Activity({ messages, onRetry }) {
  const [filter, setFilter] = useState('all');
  const visible = filter === 'all' ? messages : messages.filter(item => item.status === filter);
  return <><div className="page-heading"><div><div className="eyebrow">AUDIT TRAIL</div><h1>EDI activity</h1><p>Actual message state from receipt through delivery.</p></div></div><section className="panel"><div className="filter-row">{['all', 'queued', 'delivered', 'failed', 'rejected'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><MessageTable messages={visible} onRetry={onRetry} /></section></>;
}

function System({ health, dashboard }) {
  const connection = dashboard?.connection || {};
  return <>
    <div className="page-heading"><div><div className="eyebrow">READINESS</div><h1>System</h1><p>Connection configuration and service state.</p></div></div>
    <div className="system-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Gateway readiness</h2><p>Database, security, and outbound configuration.</p></div><Status value={health?.status || 'unavailable'} /></div><dl className="system-list"><div><dt>Database</dt><dd><Status value={health?.database || 'unknown'} /></dd></div><div><dt>Inbound HTTPS</dt><dd><Status value={connection.inbound || 'unknown'} /></dd></div><div><dt>Outbound 997 mode</dt><dd><Status value={connection.outboundMode || 'unknown'} /></dd></div><div><dt>Outbound connection</dt><dd><Status value={connection.outbound || 'unknown'} /></dd></div><div><dt>856 shipment notices</dt><dd><Status value={connection.edi856Enabled ? 'enabled' : 'not approved'} /></dd></div></dl></section>
      <section className="panel"><h2>Production scope</h2><div className="scope-list"><div className="scope-item enabled"><span>850</span><div><strong>Purchase order</strong><p>Receive, validate, store, and acknowledge.</p></div></div><div className="scope-item enabled"><span>997</span><div><strong>Functional acknowledgment</strong><p>Queue, deliver, retry, and audit.</p></div></div><div className="scope-item"><span>856</span><div><strong>Shipment notice</strong><p>Disabled until FEMA/GEX approves the document and mapping.</p></div></div></div></section>
    </div>
    {health?.issues?.length > 0 && <section className="panel configuration-panel"><h2>Configuration required</h2><p>Complete these items before requesting GEX testing.</p><ul>{health.issues.map(issue => <li key={issue}>{issue}</li>)}</ul></section>}
    <div className="alert alert-info"><div><strong>AS2 is not used for this GEX pathway.</strong><span>The project email states that GEX can push only through HTTPS on port 443.</span></div></div>
  </>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(hasSession());
  const [tab, setTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [health, setHealth] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    if (!hasSession()) return;
    setLoading(true); setError('');
    try {
      const [nextDashboard, nextOrders, nextMessages, nextHealth] = await Promise.all([
        api('/api/dashboard'), api('/api/orders'), api('/api/messages'), api('/edi/health', { auth: false, allowError: true }),
      ]);
      setDashboard(nextDashboard); setOrders(nextOrders.orders || []); setMessages(nextMessages.messages || []); setHealth(nextHealth); setLastUpdated(new Date());
    } catch (err) {
      if (err.status === 401) { clearSession(); setAuthenticated(false); } else setError(err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [authenticated, load]);

  async function selectOrder(doNumber) {
    setSelected(doNumber); setLoadingDetail(true);
    try { setDetail(await api(`/api/orders/${encodeURIComponent(doNumber)}`)); }
    catch (err) { setError(err.message); setDetail(null); }
    finally { setLoadingDetail(false); }
  }
  async function retry(id) { try { await api(`/api/messages/${id}/retry`, { method: 'POST' }); await load(); } catch (err) { setError(err.message); } }
  function logout() { clearSession(); setAuthenticated(false); }
  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><img src={LOGO} alt="Ray Land" /><span>EDI OPERATIONS</span></div><nav>{NAV.map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav><div className="sidebar-footer"><div><span>Gateway</span><Status value={health?.status || 'checking'} /></div><small>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}</small><button onClick={logout}>Sign out</button></div></aside>
    <main className="main-content"><header className="mobile-header"><img src={LOGO} alt="Ray Land" /><button onClick={logout}>Sign out</button></header><div className="mobile-nav">{NAV.map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</div>
      {error && <div className="alert alert-danger"><div><strong>Something needs attention.</strong><span>{error}</span></div><button className="text-button" onClick={() => setError('')}>Dismiss</button></div>}
      {loading && !dashboard ? <div className="loading page-loading">Loading EDI operations...</div> : <>{tab === 'overview' && <Overview dashboard={dashboard} onNavigate={setTab} onRetry={retry} />}{tab === 'orders' && <Orders orders={orders} selected={selected} onSelect={selectOrder} detail={detail} loadingDetail={loadingDetail} />}{tab === 'activity' && <Activity messages={messages} onRetry={retry} />}{tab === 'system' && <System health={health} dashboard={dashboard} />}</>}
    </main>
  </div>;
}
