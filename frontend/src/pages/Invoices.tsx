import React, { useState, useEffect } from 'react';
import { Invoice, Customer } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { 'Authorization': token ? `Bearer ${token}` : '' };
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, custRes] = await Promise.all([
        fetch('/api/invoices', { headers: getAuthHeaders() }),
        fetch('/api/customers', { headers: getAuthHeaders() })
      ]);
      const [invData, custData] = await Promise.all([
        invRes.json(),
        custRes.json()
      ]);
      setInvoices(Array.isArray(invData) ? invData : []);
      setCustomers(Array.isArray(custData) ? custData : []);
    } catch (error) {
      console.error("Error fetching data", error);
      setInvoices([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchData();
    }
  };

  const getCustomerName = (id: string) => {
    return customers.find(c => c.id === id)?.name || 'Unknown Customer';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'OVERDUE': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch invoice details');
      
      const invoiceData = await response.json();
      const customer = invoiceData.customer || customers.find(c => c.id === invoiceData.customerId);
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('INVOICE', 14, 22);
      
      doc.setFontSize(10);
      doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 14, 32);
      doc.text(`Date: ${invoiceData.date}`, 14, 38);
      doc.text(`Due Date: ${invoiceData.dueDate || 'N/A'}`, 14, 44);
      doc.text(`Status: ${invoiceData.status}`, 14, 50);
      
      doc.text('Bill To:', 120, 32);
      doc.text(`Name: ${customer?.name || 'N/A'}`, 120, 38);
      doc.text(`Email: ${customer?.email || 'N/A'}`, 120, 44);
      doc.text(`Phone: ${customer?.phone || 'N/A'}`, 120, 50);
      doc.text(`Address: ${customer?.address || 'N/A'}`, 120, 56);
      
      const tableData = invoiceData.items.map((item: any) => [
        item.productName || item.productId,
        item.quantity.toString(),
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.totalPrice.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: 70,
        head: [['Item', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 70;
      doc.text(`Subtotal: $${Number(invoiceData.subtotal || 0).toFixed(2)}`, 140, finalY + 10);
      doc.text(`Tax: $${Number(invoiceData.taxTotal || invoiceData.totalTax || 0).toFixed(2)}`, 140, finalY + 16);
      doc.setFontSize(12);
      doc.text(`Total: $${Number(invoiceData.total || invoiceData.totalAmount || 0).toFixed(2)}`, 140, finalY + 24);
      
      doc.save(`${invoiceData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const custName = inv.customer?.name || getCustomerName(inv.customerId);
    return inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           custName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Billing & Payments</p>
        </div>

        {user?.role !== 'CUSTOMER' && (
          <Button onClick={() => setIsModalOpen(true)} className="font-bold">
            <Plus className="mr-2 h-3.5 w-3.5" /> Create Invoice
          </Button>
        )}
      </div>

      <CreateInvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        customers={customers} 
        onSave={() => {
          setIsModalOpen(false);
          fetchData();
        }} 
      />

      <div className="flex items-center space-x-2 max-w-md">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <Input
            type="text"
            className="pl-8 bg-slate-100 border-none shadow-inner"
            placeholder="Search by invoice number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 mb-2 text-slate-400" />
                    <p>No invoices found.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{invoice.customer?.name || getCustomerName(invoice.customerId)}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(invoice.date || invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-medium">${Number(invoice.total || invoice.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="View" onClick={() => handleDownloadPDF(invoice.id)}>
                        <FileText className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(invoice.id)}>
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
    </div>
  );
}
