import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSocket } from '../SocketContext';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

export default function NotificationBell() {
  const { notifications, unread, markAllRead, clearAll } = useSocket();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell"
        aria-label="Notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-drop">
          <div className="notif-drop-head">
            <strong>Live alerts</strong>
            <div className="notif-drop-actions">
              <button type="button" onClick={markAllRead}>Mark all read</button>
              <button type="button" onClick={clearAll}>Clear</button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="notif-empty">No live alerts yet.</p>
          ) : (
            <ul>
              {notifications.map((item) => (
                <li key={item.id} className={item.read ? '' : 'unread'}>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                  <small>{timeAgo(item.createdAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
