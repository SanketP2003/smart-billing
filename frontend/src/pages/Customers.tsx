import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Search, Edit2, Trash2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function getAuthHeaders(contentType = false) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (contentType) headers['Content-Type'] = 'application/json';
  return headers;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: ''
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Failed to fetch customers (${res.status})`);
      const data = await res.json();
      setCustomers(data);
    } catch (error: any) {
      console.error("Error fetching customers", error);
      showToast(error.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to ${editingId ? 'update' : 'create'} customer (${res.status})`);
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', address: '', gstNumber: '' });
      showToast(`Customer ${editingId ? 'updated' : 'created'} successfully!`, 'success');
      fetchCustomers();
    } catch (error: any) {
      console.error("Error saving customer", error);
      showToast(error.message || 'Failed to save customer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      gstNumber: customer.gstNumber
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to delete customer (${res.status})`);
      }
      showToast('Customer deleted successfully', 'success');
      fetchCustomers();
    } catch (error: any) {
      console.error("Error deleting customer", error);
      showToast(error.message || 'Failed to delete customer', 'error');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Client Relationships</p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <Button onClick={() => { setEditingId(null); setFormData({ name: '', email: '', phone: '', address: '', gstNumber: '' }); setIsModalOpen(true); }} className="font-bold">
            <Plus className="mr-2 h-3.5 w-3.5" /> Add Customer
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <Input
            type="text"
            className="pl-8 bg-slate-100 border-none shadow-inner"
            placeholder="Search customers by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Customer Directory</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3 text-center">GST Number</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-8 w-8 mb-2 text-slate-400" />
                      <p>No customers found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{customer.name}</td>
                    <td className="px-4 py-3">
                      <div>{customer.email}</div>
                      <div className="text-[10px] text-slate-500">{customer.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{customer.address || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {customer.gstNumber ? (
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[9px] font-bold text-slate-500">
                          {customer.gstNumber}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEdit(customer)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(customer.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Full Name / Company</Label>
                <Input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Email</Label>
                  <Input type="email" required value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Phone</Label>
                  <Input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Address</Label>
                <Input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">GST Number</Label>
                <Input value={formData.gstNumber || ''} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} className="bg-slate-50 font-mono text-xs" />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="font-bold" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : 'Save Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
