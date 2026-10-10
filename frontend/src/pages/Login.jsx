import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Snowflake, ArrowRight, Thermometer, Zap, Shield, Globe } from 'lucide-react';
import { Compass, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const DEMO_EMAIL = 'admin@polaris.gov';
  const DEMO_PASSWORD = 'password123';

  const handleFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  const handleInstantDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    setError(null);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D8E7F0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1E3448',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', overflow: 'hidden',
      backgroundColor: '#F6FAFD',
    }}>
      {/* Left panel */}
      <div style={{
        display: 'none',
        width: '55%', flexShrink: 0,
        padding: '60px 80px',
        borderRight: '1px solid #D8E7F0',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
      }}
        className="login-left-panel"
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0891B2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(6, 182, 212, 0.35)',
          }}>
            <Activity style={{ width: '32px', height: '32px', color: '#FFFFFF' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#12304A', letterSpacing: '0.08em', margin: 0 }}>
              SENTRA
            </h1>
            <p style={{ fontSize: '12px', color: '#0284C7', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              Trust the Signal. Detect the Fault.
            </p>
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '20px',
          backgroundColor: '#E0F2FE', border: '1px solid #BAE6FD',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Code Apex · Track 4: Technology for Social Cause
          </span>
        </div>

        <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#12304A', lineHeight: 1.3, marginBottom: '14px' }}>
          AI-Based Sensor Trust, Drift &amp;<br />
          <span style={{ color: '#0284C7' }}>False-Alarm Detection</span> Platform.
        </h2>
        <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.6, marginBottom: '36px', maxWidth: '440px' }}>
          Detect gradual sensor drift, classify hardware faults vs. genuine environmental events, estimate continuous sensor trustworthiness, and protect critical connected infrastructure from false alarms.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[
            { icon: Thermometer, label: 'Monitored Sensors', value: '24+ Channels' },
            { icon: Zap, label: 'Fault Classes', value: '7 Scenarios' },
            { icon: Shield, label: 'Trust Metric', value: '0–100 Verified' },
            { icon: Globe, label: 'Inference Latency', value: '< 15ms' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 18px',
              backgroundColor: '#F6FAFD', border: '1px solid #D8E7F0', borderRadius: '10px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon style={{ width: '20px', height: '20px', color: '#0284C7' }} />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#12304A', lineHeight: 1, marginBottom: '3px' }}>{value}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0891B2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
            }}>
              <Activity style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#12304A', letterSpacing: '0.08em' }}>SENTRA</div>
              <div style={{ fontSize: '11px', color: '#0284C7', fontWeight: 700 }}>Trust the Signal</div>
            </div>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#12304A', margin: '0 0 8px' }}>
            Mission Operations Login
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 20px' }}>
            Authenticate to access sensor trust intelligence
          </p>

          {/* Judge / Demo Credentials Card */}
          <div style={{
            padding: '14px 16px',
            marginBottom: '22px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#1E3A8A',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1D4ED8' }}>
                Judge / Demo Access Credentials
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 600, backgroundColor: '#DBEAFE',
                color: '#1E40AF', padding: '2px 8px', borderRadius: '999px'
              }}>
                ADMIN ROLE
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
              <div><strong style={{ fontFamily: 'Inter, sans-serif', color: '#475569' }}>Email:</strong> {DEMO_EMAIL}</div>
              <div><strong style={{ fontFamily: 'Inter, sans-serif', color: '#475569' }}>Password:</strong> {DEMO_PASSWORD}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleFillDemo}
                style={{
                  flex: 1, padding: '8px 12px',
                  backgroundColor: '#FFFFFF', color: '#1D4ED8',
                  border: '1px solid #93C5FD', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Auto-Fill Form
              </button>
              <button
                type="button"
                onClick={handleInstantDemoLogin}
                disabled={loading}
                style={{
                  flex: 1, padding: '8px 12px',
                  backgroundColor: '#2563EB', color: '#FFFFFF',
                  border: 'none', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                1-Click Judge Login
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '14px 18px', marginBottom: '24px',
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '8px', fontSize: '14px', color: '#DC2626', fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#64748B', marginBottom: '8px',
              }}>Email</label>
              <input
                type="email"
                placeholder="admin@polaris.gov"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#64748B', marginBottom: '8px',
              }}>Password</label>
              <input
                type="password"
                placeholder="•••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '14px 20px',
                backgroundColor: loading ? '#93C5FD' : '#2563EB',
                color: '#FFFFFF',
                border: 'none', borderRadius: '10px',
                fontSize: '16px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                marginTop: '8px',
              }}
            >
              {loading ? 'Authenticating…' : (
                <>
                  Authenticate
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </>
              )}
            </button>
          </form>

          <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginTop: '28px' }}>
            SENTRA · Trust the Signal. Detect the Fault. · Track 4 Social Cause
          </p>
        </div>
      </div>
    </div>
  );
}
