import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Product } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getApiUrl, getAuthHeaders } from '../lib/api';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customers: Customer[];
}

export function CreateInvoiceModal({ isOpen, onClose, onSave, customers }: CreateInvoiceModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [lineItems, setLineItems] = useState<Array<{ productId: string, quantity: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch(getApiUrl('/api/products'), {
        headers: getAuthHeaders()
      })
      .then(res => res.ok ? res.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);

      // Reset state
      setSelectedCustomerId(customers[0]?.id || '');
      setLineItems([{ productId: '', quantity: 1 }]);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split('T')[0]);
    }
  }, [isOpen, customers]);

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const { subtotal, taxTotal, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    lineItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const itemTotal = product.price * item.quantity;
        sub += itemTotal;
        tax += itemTotal * ((product.gstRate || 0) / 100);
      }
    });
    return {
      subtotal: sub,
      taxTotal: tax,
      total: sub + tax
    };
  }, [lineItems, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || lineItems.some(i => !i.productId || i.quantity <= 0)) {
      alert('Please fill out all fields correctly.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const invoiceData = {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        customerId: selectedCustomerId,
        date: new Date().toISOString().split('T')[0],
        dueDate,
        subtotal,
        taxTotal,
        total,
        status: 'PENDING',
        items: lineItems.map(item => {
          const product = products.find(p => p.id === item.productId)!;
          return {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: product.price * item.quantity
          };
        })
      };

      const response = await fetch(getApiUrl('/api/invoices'), {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) throw new Error('Failed to create invoice');
      
      onSave();
    } catch (error) {
      console.error(error);
      alert('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
                <p className="text-sm text-slate-500 mt-1">Generate a new bill for a customer</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="invoice-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <select
                      id="customer"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select a customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-900">Line Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="h-8">
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                  </div>
                  
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-4 items-end animate-in slide-in-from-top-2 fade-in">
                      <div className="flex-1 space-y-2">
                        <Label>Product / Service</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                          value={item.productId}
                          onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                          required
                        >
                          <option value="" disabled>Select a product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <Label>Line Total</Label>
                        <div className="h-10 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-700">
                          ${(
                            (products.find(p => p.id === item.productId)?.price || 0) * item.quantity
                          ).toFixed(2)}
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="h-10 w-10 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 flex-shrink-0"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-end space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Calculator className="w-4 h-4" /> Subtotal: <span className="text-slate-900 w-24 text-right">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    Tax Amount: <span className="text-slate-900 w-24 text-right">${taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="w-48 h-px bg-slate-200 my-1" />
                  <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    Total: <span className="text-primary-600 w-24 text-right">${total.toFixed(2)}</span>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="invoice-form" className="bg-primary-600 text-white hover:bg-primary-700" disabled={isSubmitting}>
                {isSubmitting ? 'Generating...' : 'Create Invoice'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
