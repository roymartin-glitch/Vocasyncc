'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Mic,
  Edit2,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { mockTransactions } from '@/lib/mock-data';
import { Transaction } from '@/types';

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Delete Dialog State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let url = '/api/transactions';
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.warn('Transactions fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType, searchQuery]);

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    const item = tx.items?.[0];
    setEditProductName(item?.product_name || '');
    setEditQuantity(item?.quantity?.toString() || '1');
    setEditAmount(tx.total_amount?.toString() || '0');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    try {
      const res = await fetch(`/api/transactions/${editingTx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: editProductName,
          quantity: editQuantity,
          totalAmount: editAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        showToast('Transaksi berhasil diedit di database!');
        fetchTransactions();
      } else {
        alert(data.error || 'Gagal mengubah transaksi.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openDelete = (tx: Transaction) => {
    setTxToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;

    try {
      const res = await fetch(`/api/transactions/${txToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        showToast('Transaksi berhasil dihapus dari database!');
        fetchTransactions();
      } else {
        alert(data.error || 'Gagal menghapus transaksi.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-emerald-700" />
            <span>Catatan Transaksi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau, audit, dan edit seluruh pencatatan transaksi dari database Supabase Anda.
          </p>
        </div>

        <Link
          href="/catat"
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi Baru</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'income'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'expense'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi berdasarkan nama produk..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:bg-white focus:outline-emerald-600 transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            <span>Memuat catatan transaksi dari database...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Waktu</th>
                    <th className="py-3.5 px-6">Produk / Barang</th>
                    <th className="py-3.5 px-6">Jenis</th>
                    <th className="py-3.5 px-6">Jumlah</th>
                    <th className="py-3.5 px-6">Total Nominal</th>
                    <th className="py-3.5 px-6">Metode</th>
                    <th className="py-3.5 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        Tidak ada transaksi yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const item = tx.items?.[0];

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-500 whitespace-nowrap">
                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900">{item?.product_name}</div>
                            {tx.raw_voice_text && (
                              <span className="text-[11px] text-slate-400 italic truncate max-w-xs block">
                                {tx.raw_voice_text}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isIncome
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                              )}
                              <span>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-700">
                            {item ? `${item.quantity} ${item.unit}` : '-'}
                          </td>
                          <td className="py-4 px-6 font-black text-slate-900 whitespace-nowrap">
                            <span className={isIncome ? 'text-emerald-700' : 'text-slate-900'}>
                              {isIncome ? '+' : '-'}Rp{tx.total_amount?.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {tx.source === 'voice' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold text-[10px]">
                                <Mic className="w-3 h-3" /> Suara
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                                Manual
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEdit(tx)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Edit Transaksi"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDelete(tx)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="block md:hidden divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada transaksi ditemukan.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const item = tx.items?.[0];

                  return (
                    <div key={tx.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{item?.product_name}</h4>
                          <p className="text-[11px] text-slate-400">
                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • {item ? `${item.quantity} ${item.unit}` : ''}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-sm font-black ${
                              isIncome ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {isIncome ? '+' : '-'}Rp{tx.total_amount?.toLocaleString('id-ID')}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs">
                        <div>
                          {tx.source === 'voice' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700">
                              <Mic className="w-3 h-3" /> Rekam Suara
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Ketik Manual</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(tx)}
                            className="text-xs text-slate-600 font-semibold hover:text-slate-900 cursor-pointer"
                          >
                            Edit
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => openDelete(tx)}
                            className="text-xs text-rose-600 font-semibold hover:text-rose-800 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Edit Transaksi</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Dagangan</label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jumlah</label>
                <input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Uang (Rp)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Hapus Catatan Transaksi?</h3>
              <p className="text-xs text-slate-500">
                Transaksi <strong>{txToDelete.items?.[0]?.product_name}</strong> sebesar{' '}
                <strong>Rp{txToDelete.total_amount?.toLocaleString('id-ID')}</strong> akan dihapus permanen dari Supabase.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
