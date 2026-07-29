import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { TrendingUp, Users, DollarSign, Package, CreditCard, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

const revenueData = [
  { name: 'Jan', current: 4000, previous: 2400 },
  { name: 'Feb', current: 3000, previous: 1398 },
  { name: 'Mar', current: 2000, previous: 9800 },
  { name: 'Apr', current: 2780, previous: 3908 },
  { name: 'May', current: 1890, previous: 4800 },
  { name: 'Jun', current: 2390, previous: 3800 },
  { name: 'Jul', current: 3490, previous: 4300 },
];

const stats = [
  { label: 'Total Revenue', value: '$45,231.89', change: '+20.1%', icon: DollarSign, trend: 'up' },
  { label: 'Active Customers', value: '2,350', change: '+15.2%', icon: Users, trend: 'up' },
  { label: 'Pending Invoices', value: '43', change: '-4.1%', icon: CreditCard, trend: 'down' },
  { label: 'Low Stock Items', value: '12', change: '+2.4%', icon: Package, trend: 'up' },
];

export default function Dashboard() {
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setDbStats(data))
      .catch(console.error);
  }, []);

  const displayStats = [
    { label: 'Total Revenue', value: '$45,231.89', change: '+20.1%', trend: 'up' },
    { label: 'Active Customers', value: dbStats?.customers?.toString() || '0', change: '+15.2%', trend: 'up' },
    { label: 'Total Products', value: dbStats?.products?.toString() || '0', change: '+4.1%', trend: 'up' },
    { label: 'Low Stock Items', value: dbStats?.lowStockCount?.toString() || '0', change: '-2.4%', trend: 'down' },
  ];

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          context: 'dashboard',
          data: { revenueData, stats: displayStats }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAiInsights(data.result);
    } catch (error) {
      console.error(error);
      setAiInsights('Failed to generate insights. Ensure API key is configured.');
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    // Optionally fetch insights on load
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Enterprise Dashboard</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Business Performance Overview</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="hidden sm:flex text-xs font-bold shadow-none border-slate-200" onClick={() => {
            const csv = `Metric,Value\nTotal Revenue,${displayStats[0].value}\nActive Customers,${displayStats[1].value}\nTotal Products,${displayStats[2].value}\nLow Stock Items,${displayStats[3].value}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}>Download Report</Button>
          <Button onClick={fetchInsights} disabled={loadingInsights} className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-none font-bold text-xs">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {loadingInsights ? 'Analyzing...' : 'Generate AI Insights'}
          </Button>
        </div>
      </div>

      {/* Header handled above */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayStats.map((stat, index) => {
          return (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase">{stat.label}</p>
              <div className="flex items-end gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{stat.value}</h2>
                <span className={`text-[10px] font-bold pb-1 text-xs ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                </span>
              </div>
              <div className="mt-3 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${stat.trend === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: stat.trend === 'up' ? '72%' : '42%' }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[460px]">
        {/* Main Charts */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Revenue Overview</h3>
              <p className="text-[10px] text-slate-500 font-medium">Current vs previous year</p>
            </div>
            <div className="p-4 h-[300px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="current" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="previous" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Customer Growth</h3>
            </div>
            <div className="p-4 h-[250px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="current" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Alerts */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Insights Block */}
          <div className="bg-indigo-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden min-h-[200px]">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold tracking-tight">AI PREDICTIVE INSIGHTS</h3>
              </div>

              {loadingInsights ? (
                <div className="animate-pulse space-y-2 mt-4">
                  <div className="h-2 bg-indigo-700 rounded w-3/4"></div>
                  <div className="h-2 bg-indigo-700 rounded w-1/2"></div>
                  <div className="h-2 bg-indigo-700 rounded w-5/6"></div>
                </div>
              ) : aiInsights ? (
                <div className="text-xs text-indigo-100 leading-relaxed mb-4 whitespace-pre-wrap">
                  {aiInsights}
                </div>
              ) : (
                <p className="text-xs text-indigo-100 leading-relaxed mb-4">
                  Click 'Generate AI Insights' above to run analysis on current billing and inventory data.
                </p>
              )}
            </div>
          </div>

          {/* Operational Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Operational Alerts</h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Low Stock Warning</p>
                  <p className="text-[10px] text-slate-500">3 products are currently below safety thresholds.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Payment Due Tomorrow</p>
                  <p className="text-[10px] text-slate-500">$8,200.00 in pending invoices maturing.</p>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400">AUDIT SYNC</span>
                    <span className="text-[10px] text-emerald-500 font-bold italic">100% Secure</span>
                  </div>
                  <div className="w-full h-1 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-emerald-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
