import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import API from '../api/axiosConfig';

const data = [
  { name: 'Mon', uv: 40 }, { name: 'Tue', uv: 60 }, { name: 'Wed', uv: 30 },
  { name: 'Thu', uv: 80 }, { name: 'Fri', uv: 50 }, { name: 'Sat', uv: 70 }, { name: 'Sun', uv: 20 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-gray-800 p-2 border border-gray-700 rounded text-xs text-gray-300">
        <p>{`${label}: ${payload[0].value}ms`}</p>
      </div>
    );
  }
  return null;
};

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { email, password });
      // Save the JWT token to local storage
      localStorage.setItem('token', response.data.access_token);
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      alert("Login failed. Please check your credentials.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-white font-sans">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div>
<h1 className="text-3xl font-bold tracking-tight">FinTrack <span className="text-blue-500">Finance</span></h1>          <p className="text-gray-500 text-sm mt-1">System Version 2.4.0</p>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Precision finance for the <br/><span className="text-blue-400">modern analyst.</span></h2>
          <p className="text-gray-400 max-w-md">Leverage real-time data visualization and automated expense tracking to manage your digital assets securely.</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-medium">NODE_LATENCY 0.024ms</span>
            <span>API UPTIME 99.998%</span>
          </div>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}><Tooltip content={<CustomTooltip />} cursor={false} /><Bar dataKey="uv" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 bg-[#12121a] flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight">Sign In</h2>
            <p className="text-gray-500 text-sm mt-2">Enter your credentials to access your account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="finance.lead@agency.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors">
              {loading ? 'Signing In...' : 'Continue to Dashboard'}
            </button>
          </form>
          
          <div className="pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 text-center lg:text-left">Security Protocols</p>
            <div className="flex justify-center lg:justify-start space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                <div className="w-8 h-4 bg-gray-700 rounded-full relative"><div className="absolute left-1 top-1 w-2 h-2 bg-blue-500 rounded-full"></div></div>
                <span>Corporate SSO</span>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
                <div className="w-8 h-4 bg-gray-700 rounded-full relative"><div className="absolute left-1 top-1 w-2 h-2 bg-blue-500 rounded-full"></div></div>
                <span>API Access</span>
              </div>
            </div>
          </div>
          
          {/* FIXED NAVIGATION HERE */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">Create a new account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}