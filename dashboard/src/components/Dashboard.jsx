import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, LogOut, Clock, Link as LinkIcon, User } from 'lucide-react';

const Dashboard = ({ token, setToken }) => {
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [logsRes, alertsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/logs', config),
          axios.get('http://localhost:5000/api/alerts', config)
        ]);
        setLogs(logsRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
            handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8 glass p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Activity Monitor</h1>
            <p className="text-textSecondary text-sm">Real-time browser activity tracking</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface/80 border border-white/10 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <div className="flex gap-4 mb-6">
        <button 
            className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'logs' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface text-textSecondary hover:bg-surface/80 border border-white/5'}`}
            onClick={() => setActiveTab('logs')}
        >
            All Activity Logs ({logs.length})
        </button>
        <button 
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface text-textSecondary hover:bg-surface/80 border border-white/5'}`}
            onClick={() => setActiveTab('alerts')}
        >
            <AlertTriangle className="w-4 h-4" /> Security Alerts ({alerts.length})
        </button>
      </div>

      <main className="glass rounded-2xl p-6 overflow-hidden">
        {activeTab === 'logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-textSecondary text-sm">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">User Email</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">URL Path</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 text-sm text-textSecondary flex items-center gap-2">
                        <Clock className="w-4 h-4 opacity-50" />
                        {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 font-medium flex items-center gap-2">
                         <User className="w-4 h-4 opacity-50" />
                         {log.userId?.email || 'Unknown User'}
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 bg-surface border border-white/10 rounded-md text-xs font-medium tracking-wider">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-4 max-w-sm truncate text-textSecondary flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                        <a href={log.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate block">{log.url}</a>
                    </td>
                    <td className="py-4">
                      {log.flagged ? (
                        <span className="px-2.5 py-1 bg-accent/20 text-accent border border-accent/20 rounded-md text-xs font-medium inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-xs font-medium">
                          Clear
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                    <tr>
                        <td colSpan="5" className="py-10 text-center text-textSecondary">No activity recorded yet in the database.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
               {alerts.length === 0 ? (
                   <div className="py-10 text-center text-textSecondary">No security alerts detected. System is secure.</div>
               ) : (
                 alerts.map(alert => (
                   <div key={alert._id} className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-4 transition-all hover:bg-accent/20">
                     <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                       <AlertTriangle className="w-6 h-6 text-accent" />
                     </div>
                     <div>
                       <h3 className="text-accent font-semibold text-lg">{alert.message}</h3>
                       <p className="text-textSecondary mt-1 flex items-center gap-4 text-sm">
                         <span className="flex items-center gap-1"><User className="w-4 h-4"/> {alert.userId?.email || 'Unknown User'}</span>
                         <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {new Date(alert.timestamp).toLocaleString()}</span>
                       </p>
                     </div>
                   </div>
                 ))
               )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
