'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  Filter,
  Loader2,
  FileText,
} from 'lucide-react';
import { mockTransactions } from '@/lib/mock-data';
import { Transaction } from '@/types';

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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

  // Set date ranges helper
  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(formatDate(w));
      setEndDate(formatDate(now));
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchTransactions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      let url = '/api/transactions';
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        let list = [...data.data];
        if (typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            const localTxs = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
            const existingIds = new Set(list.map((t: any) => t.id));
            for (const l of localTxs) {
              if (l && l.id && !existingIds.has(l.id)) {
                list.unshift(l);
                existingIds.add(l.id);
              }
            }
          } catch (_) {}
        }
        setTransactions(list);
        // Cache default view (all transactions)
        if (filterType === 'all' && !searchQuery && !startDate && !endDate && typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('vokasync_tx_cache', JSON.stringify(list));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Transactions fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let hasCache = false;
    if (filterType === 'all' && !searchQuery && !startDate && !endDate && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('vokasync_tx_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions(parsed);
            setIsLoading(false);
            hasCache = true;
          }
        }
      } catch (_) {}
    }
    fetchTransactions(hasCache);
  }, [filterType, searchQuery, startDate, endDate]);

  // Client-side date filter fallback for offline/instant feel
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesProduct = tx.items?.some((it) =>
          it.product_name ? it.product_name.toLowerCase().includes(query) : false
        );
        const matchesVoice = tx.raw_voice_text?.toLowerCase().includes(query);
        if (!matchesProduct && !matchesVoice) return false;
      }
      if (startDate) {
        const txDate = tx.transaction_date.split('T')[0];
        if (txDate < startDate) return false;
      }
      if (endDate) {
        const txDate = tx.transaction_date.split('T')[0];
        if (txDate > endDate) return false;
      }
      return true;
    });
  }, [transactions, filterType, searchQuery, startDate, endDate]);

  // Calculate totals for filtered range
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const amt = tx.total_amount || 0;
      if (tx.type === 'income') income += amt;
      else expense += amt;
    });
    return {
      income,
      expense,
      profit: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

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
        showToast('Catatan transaksi berhasil diperbarui!');
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
        showToast('Catatan transaksi berhasil dihapus!');
        fetchTransactions();
      } else {
        alert(data.error || 'Gagal menghapus transaksi.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#00875A] stroke-[2.5]" />
            <span>Riwayat Transaksi</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Lihat, cari, dan telusuri seluruh catatan uang masuk dan uang keluar kios Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start">
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50/70 text-emerald-900 border-2 border-emerald-300 hover:border-emerald-500 font-bold text-sm px-4 py-3 rounded-2xl shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Buka Rekap Laporan Keuangan & Kas"
          >
            <FileText className="w-4 h-4 text-[#00875A] stroke-[2.5]" />
            <span>Lihat Laporan Keuangan</span>
          </Link>

          <Link
            href="/catat"
            className="inline-flex items-center gap-2 bg-[#00875A] hover:bg-[#059669] text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Catat Transaksi Baru</span>
          </Link>
        </div>
      </div>

      {/* Date Filter & Preset Controls */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-base font-black text-slate-900">
          <Calendar className="w-5 h-5 text-[#00875A] stroke-[2.5]" />
          <span>Pilih Waktu & Tanggal:</span>
        </div>

        {/* Date Presets Pills */}
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: 'all', label: 'Semua Waktu' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'week', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id as DatePreset)}
              className={`text-sm font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                datePreset === preset.id
                  ? 'bg-[#00875A] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Dari Tanggal:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setDatePreset('custom');
                setStartDate(e.target.value);
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-[#00875A] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Sampai Tanggal:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setDatePreset('custom');
                setEndDate(e.target.value);
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-[#00875A] outline-hidden"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Jenis Transaksi:
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:border-[#00875A] outline-hidden cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="income">Uang Masuk (Penjualan)</option>
              <option value="expense">Uang Keluar (Belanja)</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Cari Nama Barang:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: Bawang..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold text-slate-800 focus:border-[#00875A] outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards for Selected Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Uang Masuk */}
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Total Uang Masuk
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#00875A] mt-1.5 tracking-tight">
            Rp{summary.income.toLocaleString('id-ID')}
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1">
            Penjualan pada periode ini
          </div>
        </div>

        {/* Total Uang Keluar */}
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">
            Total Uang Keluar
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1.5 tracking-tight">
            Rp{summary.expense.toLocaleString('id-ID')}
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1">
            Belanja & biaya pada periode ini
          </div>
        </div>

        {/* Sisa Uang / Untung Bersih */}
        <div className="bg-[#A3E635] p-5 rounded-3xl border-2 border-[#84CC16] shadow-sm">
          <div className="text-xs font-black text-slate-950 uppercase tracking-wider">
            Sisa Uang (Untung Bersih)
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 mt-1.5 tracking-tight">
            Rp{summary.profit.toLocaleString('id-ID')}
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1">
            Dari {summary.count} catatan transaksi
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#00875A]" />
            <span>Memuat catatan transaksi...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="text-lg font-bold">Tidak ada catatan transaksi pada tanggal ini.</p>
            <p className="text-xs text-slate-400">Silakan ubah pilihan tanggal atau catat transaksi baru.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const item = tx.items?.[0];
              const dateStr = new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = new Date(tx.transaction_date).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={tx.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isIncome ? 'bg-emerald-100 text-[#00875A]' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-6 h-6 stroke-[2.8]" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 stroke-[2.8]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-black text-slate-900">
                          {item?.product_name || 'Catatan Dagang'}
                        </span>
                        {tx.source === 'voice' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#A3E635] text-slate-950">
                            <Mic className="w-3 h-3 stroke-[2.5]" /> Suara
                          </span>
                        )}
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isIncome ? 'Uang Masuk' : 'Uang Keluar'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-500">
                        {item ? `${item.quantity} ${item.unit} • ` : ''}
                        {dateStr}, Jam {timeStr}
                      </p>

                      {tx.raw_voice_text && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-200 inline-block">
                          &ldquo;{tx.raw_voice_text}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div
                        className={`text-xl sm:text-2xl font-black tracking-tight ${
                          isIncome ? 'text-[#00875A]' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}Rp{(tx.total_amount || 0).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(tx)}
                        className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-emerald-600 hover:text-[#00875A] text-slate-600 transition-all cursor-pointer"
                        title="Ubah"
                      >
                        <Edit2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(tx)}
                        className="p-2.5 rounded-xl border-2 border-slate-200 hover:border-rose-600 hover:text-rose-600 text-slate-600 transition-all cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Ubah Catatan</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Jumlah
                </label>
                <input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Total Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#00875A] hover:bg-[#059669] text-white font-black text-sm shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Hapus Catatan Ini?</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                Catatan {txToDelete.items?.[0]?.product_name || 'transaksi'} sebesar Rp
                {(txToDelete.total_amount || 0).toLocaleString('id-ID')} akan dihapus.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-sm"
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
