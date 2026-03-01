
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home as HomeIcon, BookOpen, User, Building, LayoutDashboard, Menu, X, Sparkles, Compass, Shield, Phone } from 'lucide-react';
import { initStorage, getCurrentUser, logout } from './utils/storage';
import { initFirebase } from './utils/firebaseService';

// Pages
import Home from './pages/Home';
import HostelDetail from './pages/HostelDetail';
import RoomDetail from './pages/RoomDetail';
import Payment from './pages/Payment';
import Success from './pages/Success';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
    setIsOpen(false);
  };

  const isHome = location.pathname === '/';
  const navBackground = scrolled ? 'rgba(255, 255, 255, 0.85)' : (isHome ? 'transparent' : 'white');
  const textColor = scrolled || !isHome ? 'var(--text-main)' : 'white';
  const logoColor = scrolled || !isHome ? 'var(--text-main)' : 'white';

  return (
    <nav style={{
      backgroundColor: navBackground,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      height: scrolled ? '74px' : '96px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
      boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.03)' : 'none'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.3s' }} className="nav-logo">
          <div style={{ background: 'white', padding: '5px', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <img src="/logo.png" alt="HostelHive" style={{ height: scrolled ? '34px' : '42px', width: 'auto', transition: 'height 0.4s' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: scrolled ? '22px' : '26px', letterSpacing: '-0.03em', color: logoColor, transition: 'all 0.4s' }}>HostelHive</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-only" style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <Link to="/" style={{ textDecoration: 'none', color: textColor, fontWeight: 700, fontSize: '15px' }}>Explore</Link>
            {user && (user.role === 'admin' || user.role === 'owner' ? (
              <Link to="/admin" style={{ textDecoration: 'none', color: textColor, fontWeight: 700, fontSize: '15px' }}>Dashboard</Link>
            ) : (
              <Link to="/my-bookings" style={{ textDecoration: 'none', color: textColor, fontWeight: 700, fontSize: '15px' }}>My Bookings</Link>
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', background: scrolled || !isHome ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }}></div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: scrolled || !isHome ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)', padding: '6px 16px 6px 6px', borderRadius: '100px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}>
                  {user.name.charAt(0)}
                </div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: textColor }}>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="glass"
                style={{ width: '40px', height: '40px', borderRadius: '12px', padding: 0, color: textColor, border: '1px solid rgba(0,0,0,0.1)' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none', color: textColor, fontWeight: 700, fontSize: '15px', padding: '10px 20px' }}>Sign In</Link>
              <Link to="/signup" className="btn-primary" style={{ textDecoration: 'none', borderRadius: '14px', padding: '12px 28px', fontSize: '15px' }}>Get Started</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-only"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#111827',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {isOpen ? (
            <span style={{ color: 'white', fontSize: '22px', fontWeight: '700', lineHeight: 1, userSelect: 'none' }}>✕</span>
          ) : (
            <>
              <span style={{ display: 'block', width: '22px', height: '2.5px', background: 'white', borderRadius: '2px' }} />
              <span style={{ display: 'block', width: '22px', height: '2.5px', background: 'white', borderRadius: '2px' }} />
              <span style={{ display: 'block', width: '22px', height: '2.5px', background: 'white', borderRadius: '2px' }} />
            </>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="mobile-only animate-fade" style={{
          position: 'absolute',
          top: '100%',
          left: '20px',
          right: '20px',
          background: 'white',
          padding: '32px',
          borderRadius: '28px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          marginTop: '12px'
        }}>
          <Link to="/" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Compass size={20} color="var(--primary)" /> Explore Hostels
          </Link>
          {user ? (
            <>
              {user.role === 'admin' || user.role === 'owner' ? (
                <Link to="/admin" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LayoutDashboard size={20} color="var(--primary)" /> Admin Dashboard
                </Link>
              ) : (
                <Link to="/my-bookings" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '18px', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BookOpen size={20} color="var(--primary)" /> My Bookings
                </Link>
              )}
              <div style={{ height: '1px', background: 'var(--border-light)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '16px' }}>{user.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-primary" style={{ width: '100%', borderRadius: '16px' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '18px', fontWeight: '750' }}>Sign In</Link>
              <Link to="/signup" onClick={() => setIsOpen(false)} className="btn-primary" style={{ textDecoration: 'none', borderRadius: '16px', textAlign: 'center' }}>Create Account</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

function App() {
  const [user, setUser] = useState(() => {
    initStorage();
    return getCurrentUser();
  });

  useEffect(() => {
    initFirebase();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <Router>
      <div className="app" style={{ paddingTop: '0' }}>
        <Navbar user={user} onLogout={handleLogout} />
        <main style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hostel/:id" element={<HostelDetail user={user} />} />
            <Route path="/room/:id" element={<RoomDetail user={user} />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/success" element={<Success />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student-login" element={<StudentLogin onLogin={handleLogin} />} />
            <Route path="/admin-login" element={<AdminLogin onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        {/* Premium Footer */}
        <footer style={{ background: '#0a0f1d', color: 'white', padding: '100px 0 50px', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative shapes */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '30%', height: '40%', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(100px)', opacity: 0.1 }}></div>

          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '80px', marginBottom: '80px' }}>
              <div style={{ maxWidth: '350px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ background: 'white', padding: '6px', borderRadius: '12px', display: 'flex', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    <img src="/logo.png" alt="HostelHive" style={{ height: '36px', width: 'auto' }} />
                  </div>
                  <span style={{ fontWeight: 900, fontSize: '24px', letterSpacing: '-0.02em' }}>HostelHive</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: '1.8', marginBottom: '32px' }}>
                  Seamless student accommodation booking. Verified spaces, transparent pricing, and instant moves. Find your second home today.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['Twitter', 'Instagram', 'LinkedIn'].map(social => (
                    <div key={social} title={social} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }}></div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '18px', marginBottom: '32px', fontWeight: '800', borderLeft: '3px solid var(--primary)', paddingLeft: '16px' }}>Platform</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Compass size={16} /> Browse Hostels
                  </Link>
                  <Link to="/login" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={16} /> Student Sign In
                  </Link>
                  <Link to="/admin-login" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={16} /> Property Owners
                  </Link>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '18px', marginBottom: '32px', fontWeight: '800', borderLeft: '3px solid var(--secondary)', paddingLeft: '16px' }}>Support</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ color: 'var(--primary)' }}><X size={20} /></div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>EMAILS US</div>
                      <div style={{ fontSize: '16px' }}>hello@hostelhive.com</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ color: 'var(--secondary)' }}><Phone size={20} /></div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>CALL US</div>
                      <div style={{ fontSize: '16px' }}>+91 99887 76655</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>&copy; 2026 HostelHive. Crafted with excellence for students.</p>
              <div style={{ display: 'flex', gap: '32px' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer' }}>Privacy Policy</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer' }}>Terms of Service</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
