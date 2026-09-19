import { FormEvent, useEffect, useMemo, useState } from 'react';

type Role = 'STUDENT' | 'STAFF' | 'ADMIN';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  faculty?: string;
  programme?: string;
  yearGroup?: string;
};

type Announcement = {
  id: string;
  title: string;
  description: string;
  category: string;
  audience: string;
  faculty?: string | null;
  programme?: string | null;
  yearGroup?: string | null;
  date?: string;
  location?: string;
  status?: string;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  interestCount: number;
  interests: string[];
};

type SocietyItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  activities: string[];
  interestCount: number;
  interests: string[];
};

type RoomType = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  bookings?: Array<{ roomId: string; date: string; startTime: string; endTime: string; status: string }>;
};

type SearchResult = {
  type: string;
  title?: string;
  name?: string;
  question?: string;
  description?: string;
  category?: string;
};

const API = 'http://localhost:3001/api';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ucl-token'));
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<'dashboard' | 'events' | 'societies' | 'rooms' | 'lost-found' | 'support' | 'faq' | 'ai'>('dashboard');
  const [loginEmail, setLoginEmail] = useState('nimali@student.ucl.ac.lk');
  const [loginPassword, setLoginPassword] = useState('student123');
  const [loginError, setLoginError] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [lostFound, setLostFound] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [support, setSupport] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuestion, setAiQuestion] = useState('Are there any events this week?');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isBusy, setIsBusy] = useState(false);

  const isLoggedIn = Boolean(token);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => setToken(null));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/events`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/societies`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/rooms?date=2026-09-25`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/lost-found`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/faqs`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/support`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
    ]).then(([dashboardData, eventsData, societiesData, roomsData, lostFoundData, faqData, supportData]) => {
      setDashboard(dashboardData);
      setEvents(eventsData.events || []);
      setSocieties(societiesData.societies || []);
      setRooms(roomsData.rooms || []);
      setLostFound(lostFoundData.items || []);
      setFaqs(faqData.faqs || []);
      setSupport(supportData);
    }).catch(() => setLoginError('Unable to load campus data.'));
  }, [token]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setLoginError('');
    try {
      const response = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('ucl-token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setLoginError((error as Error).message || 'Login failed');
    } finally {
      setIsBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ucl-token');
    setToken(null);
    setUser(null);
    setDashboard(null);
    setEvents([]);
    setSocieties([]);
    setLostFound([]);
    setFaqs([]);
    setSupport(null);
    setAiResponse(null);
  };

  const handleInterestEvent = async (eventId: string) => {
    if (!token) return;
    const response = await fetch(`${API}/events/${eventId}/interest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message || 'Unable to register interest');
      return;
    }
    const fresh = await fetch(`${API}/events`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    setEvents(fresh.events || []);
    alert('Interest registered successfully.');
  };

  const handleInterestSociety = async (societyId: string) => {
    if (!token) return;
    const response = await fetch(`${API}/societies/${societyId}/interest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message || 'Unable to join society');
      return;
    }
    const fresh = await fetch(`${API}/societies`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    setSocieties(fresh.societies || []);
    alert('Society interest recorded.');
  };

  const handleRoomRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const payload = {
      roomId: form.get('roomId'),
      date: form.get('date'),
      startTime: form.get('startTime'),
      endTime: form.get('endTime'),
      reason: form.get('reason')
    };
    const response = await fetch(`${API}/rooms/request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message || 'Unable to submit room request');
      return;
    }
    alert('Room request created.');
    const roomsResponse = await fetch(`${API}/rooms?date=${payload.date}`, { headers: { Authorization: `Bearer ${token}` } });
    const roomsData = await roomsResponse.json();
    setRooms(roomsData.rooms || []);
  };

  const handleSearch = async () => {
    if (!token) return;
    const response = await fetch(`${API}/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setSearchResults(data.results || []);
  };

  const handleAiQuestion = async () => {
    if (!token) return;
    const response = await fetch(`${API}/ai`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: aiQuestion })
    });
    const data = await response.json();
    setAiResponse(data);
  };

  const statCards = useMemo(() => [
    { label: 'Targeted announcements', value: dashboard?.targetCount ?? 0 },
    { label: 'Open events', value: events.length },
    { label: 'Societies', value: societies.length },
    { label: 'Urgent notices', value: dashboard?.emergency?.length ?? 0 }
  ], [dashboard, events.length, societies.length]);

  if (!isLoggedIn) {
    return (
      <div className="app-shell login-shell">
        <div className="login-card">
          <div className="brand-block">
            <div className="brand-badge">UCL</div>
            <div>
              <h1>UCL ONE</h1>
              <p>Trusted campus hub</p>
            </div>
          </div>
          <form onSubmit={handleLogin}>
            <label>Email</label>
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <label>Password</label>
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            {loginError && <p className="error-text">{loginError}</p>}
            <button type="submit" disabled={isBusy}>{isBusy ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <div className="demo-credentials">
            <strong>Demo users</strong>
            <p>Student: nimali@student.ucl.ac.lk / student123</p>
            <p>Staff: staff@ucl.ac.lk / staff123</p>
            <p>Admin: admin@ucl.ac.lk / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">UCL</div>
          <div>
            <h2>UCL ONE</h2>
            <small>{user?.role}</small>
          </div>
        </div>
        <nav>
          <button onClick={() => setPage('dashboard')}>Dashboard</button>
          <button onClick={() => setPage('events')}>Events</button>
          <button onClick={() => setPage('societies')}>Societies</button>
          <button onClick={() => setPage('rooms')}>Classrooms</button>
          <button onClick={() => setPage('lost-found')}>Lost & Found</button>
          <button onClick={() => setPage('support')}>Support</button>
          <button onClick={() => setPage('faq')}>FAQ</button>
          <button onClick={() => setPage('ai')}>AI Assistant</button>
        </nav>
        <button className="logout" onClick={logout}>Log out</button>
      </aside>

      <main className="main-content">
        {page === 'dashboard' && dashboard && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">Welcome back</p>
                <h1>{user?.name}</h1>
              </div>
              <div className="pill">Faculty: {user?.faculty || 'Campus'}</div>
            </header>

            <section className="stats-grid">
              {statCards.map((card) => (
                <div key={card.label} className="stat-card">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </section>

            <section className="content-grid">
              <div className="panel">
                <h3>Targeted announcements</h3>
                {dashboard.announcements?.length ? dashboard.announcements.map((item: Announcement) => (
                  <div key={item.id} className="list-item">
                    <div className="tag">{item.category}</div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <small>{item.date} • {item.location}</small>
                  </div>
                )) : <p>No announcements for your profile yet.</p>}
              </div>

              <div className="panel">
                <h3>Emergency notices</h3>
                {dashboard.emergency?.map((item: any) => (
                  <div key={item.id} className="alert-box">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="content-grid lower-grid">
              <div className="panel">
                <h3>Upcoming events</h3>
                {dashboard.upcomingEvents?.map((item: EventItem) => (
                  <div key={item.id} className="list-item">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <small>{item.date} • {item.location}</small>
                  </div>
                ))}
              </div>

              <div className="panel">
                <h3>Quick services</h3>
                <div className="quick-links">
                  <button onClick={() => setPage('events')}>Events</button>
                  <button onClick={() => setPage('rooms')}>Room booking</button>
                  <button onClick={() => setPage('lost-found')}>Lost & found</button>
                  <button onClick={() => setPage('ai')}>AI assistant</button>
                </div>
              </div>
            </section>
          </>
        )}

        {page === 'events' && (
          <div className="panel page-panel">
            <h2>Events</h2>
            {events.map((event) => (
              <div key={event.id} className="card-box">
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <small>{event.date} • {event.location}</small>
                <div className="card-actions">
                  <span>{event.interestCount} interested</span>
                  <button onClick={() => handleInterestEvent(event.id)}>Register interest</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {page === 'societies' && (
          <div className="panel page-panel">
            <h2>Societies</h2>
            {societies.map((society) => (
              <div key={society.id} className="card-box">
                <h3>{society.name}</h3>
                <p>{society.description}</p>
                <ul>{society.activities.map((item) => <li key={item}>{item}</li>)}</ul>
                <div className="card-actions">
                  <span>{society.interestCount} interested</span>
                  <button onClick={() => handleInterestSociety(society.id)}>Express interest</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {page === 'rooms' && (
          <div className="panel page-panel">
            <h2>Classroom booking</h2>
            <form onSubmit={handleRoomRequest} className="booking-form">
              <select name="roomId" defaultValue={rooms[0]?.id || ''}>
                {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} — {room.location}</option>)}
              </select>
              <input type="date" name="date" defaultValue="2026-09-25" />
              <input type="time" name="startTime" defaultValue="13:00" />
              <input type="time" name="endTime" defaultValue="15:00" />
              <input type="text" name="reason" placeholder="Reason" defaultValue="Group study" />
              <button type="submit">Request room</button>
            </form>
            {rooms.map((room) => (
              <div key={room.id} className="card-box">
                <h3>{room.name}</h3>
                <p>{room.location}</p>
                <small>Capacity: {room.capacity}</small>
                {room.bookings?.length ? <ul>{room.bookings.map((booking) => <li key={`${room.id}-${booking.startTime}`}>{booking.date} {booking.startTime}-{booking.endTime} [{booking.status}]</li>)}</ul> : <p>No bookings yet.</p>}
              </div>
            ))}
          </div>
        )}

        {page === 'lost-found' && (
          <div className="panel page-panel">
            <h2>Lost & Found</h2>
            {lostFound.map((item) => (
              <div key={item.id} className="card-box">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <small>{item.type} • {item.location} • {item.status}</small>
              </div>
            ))}
          </div>
        )}

        {page === 'support' && support && (
          <div className="panel page-panel">
            <h2>Academic and support resources</h2>
            {support.resources?.map((item: any) => (
              <div key={item.id} className="card-box">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <small>{item.contact}</small>
              </div>
            ))}
            {support.jobs?.map((item: any) => (
              <div key={item.id} className="card-box">
                <h3>{item.title}</h3>
                <p>{item.employer} • {item.location} • {item.type}</p>
              </div>
            ))}
          </div>
        )}

        {page === 'faq' && (
          <div className="panel page-panel">
            <h2>Frequently asked questions</h2>
            {faqs.map((item) => (
              <div key={item.id} className="card-box">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        )}

        {page === 'ai' && (
          <div className="panel page-panel">
            <h2>AI campus assistant</h2>
            <div className="ai-row">
              <input value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} />
              <button onClick={handleAiQuestion}>Ask</button>
            </div>
            {aiResponse && (
              <div className="ai-box">
                <p><strong>Answer:</strong> {aiResponse.answer}</p>
                <p><strong>Suggestions:</strong> {aiResponse.suggestions?.join(', ')}</p>
                <p><strong>Grounded sources:</strong> {aiResponse.sources?.join(', ') || 'None'}</p>
              </div>
            )}
          </div>
        )}

        <div className="panel search-panel">
          <h3>Unified search</h3>
          <div className="ai-row">
            <input placeholder="Search campus info" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button onClick={handleSearch}>Search</button>
          </div>
          {searchResults.length ? (
            <div className="search-results">
              {searchResults.map((result, index) => (
                <div key={`${result.type}-${index}`} className="search-item">
                  <strong>{result.title || result.name || result.question || result.type}</strong>
                  <p>{result.description || 'Campus result'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No matching campus content found.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
