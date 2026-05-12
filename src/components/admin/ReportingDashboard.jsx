import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { Filter, Calendar, TrendingUp, DollarSign, Package } from 'lucide-react';
import { fetchReportingData } from '../../services/orderService';
import { fetchCategories } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ReportingDashboard = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [timeframe, setTimeframe] = useState('daily'); // daily, weekly, monthly

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [reportingData, cats] = await Promise.all([
          fetchReportingData(),
          fetchCategories()
        ]);
        setData(reportingData);
        setCategories(['All', ...cats]);
      } catch (err) {
        setError('Failed to load reporting data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return selectedCategory === 'All' 
      ? data 
      : data.filter(item => item.category === selectedCategory);
  }, [data, selectedCategory]);

  const chartData = useMemo(() => {
    const groups = {};
    
    filteredData.forEach(item => {
      if (!item.timestamp) return;
      const date = new Date(item.timestamp);
      let key;
      
      if (timeframe === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (timeframe === 'weekly') {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        key = `Week ${weekNo}, ${d.getFullYear()}`;
      } else {
        key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      
      if (!groups[key]) groups[key] = { name: key, revenue: 0, orders: 0 };
      groups[key].revenue += (item.price * item.quantity);
      groups[key].orders += item.quantity;
    });

    return Object.values(groups).sort((a, b) => {
      if (timeframe === 'daily') return new Date(a.name) - new Date(b.name);
      return 0; // Simple sort for others
    });
  }, [filteredData, timeframe]);

  const categoryDistribution = useMemo(() => {
    const dist = {};
    data.forEach(item => {
      if (!dist[item.category]) dist[item.category] = 0;
      dist[item.category] += (item.price * item.quantity);
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  const totalRevenue = useMemo(() => 
    filteredData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  [filteredData]);

  const totalSales = useMemo(() => 
    filteredData.reduce((sum, item) => sum + item.quantity, 0),
  [filteredData]);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status" />
      <p className="mt-3 text-muted">Analyzing sales data...</p>
    </div>
  );

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="animate-fade-in">
      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-3">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="opacity-75 small fw-medium">Total Revenue</div>
                <div className="fs-3 fw-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-10 p-3 rounded-3">
                <Package size={24} />
              </div>
              <div>
                <div className="opacity-75 small fw-medium">Total Items Sold</div>
                <div className="fs-3 fw-bold">{totalSales.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-success text-white">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-3">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="opacity-75 small fw-medium">Average Order Value</div>
                <div className="fs-3 fw-bold">${(totalRevenue / (filteredData.length || 1)).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <Filter size={18} className="text-muted" />
              <select 
                className="form-select border-0 bg-light rounded-3" 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Calendar size={18} className="text-muted" />
              <div className="btn-group rounded-3 overflow-hidden border">
                {['daily', 'weekly', 'monthly'].map(t => (
                  <button 
                    key={t}
                    className={`btn btn-sm px-3 ${timeframe === t ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setTimeframe(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="text-muted small fw-medium">
            Showing trends for <span className="text-primary">{selectedCategory}</span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Chart */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white border-0 p-4 pb-0">
              <h5 className="fw-bold m-0">Revenue Trends</h5>
            </div>
            <div className="card-body p-4" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white border-0 p-4 pb-0">
              <h5 className="fw-bold m-0">Revenue by Category</h5>
            </div>
            <div className="card-body p-4" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportingDashboard;
