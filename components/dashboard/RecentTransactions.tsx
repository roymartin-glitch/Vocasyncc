'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, Mic, ChevronRight } from 'lucide-react';
import { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="font-bold text-sm text-slate-800">Transaksi Hari Ini</h3>
          <p className="text-xs text-slate-400">Pencatatan suara dan manual terbaru</p>
        </div>
        <Link
          href="/riwayat"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 hover:underline"
        >
          Lihat Semua
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {transactions.slice(0, 4).map((tx) => {
          const isIncome = tx.type === 'income';
          const primaryItem = tx.items?.[0];

          return (
            <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {isIncome ? (
                    <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {primaryItem?.product_name || 'Transaksi'}
                    </p>
                    {tx.source === 'voice' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 gap-0.5">
                        <Mic className="w-2.5 h-2.5" /> Suara
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {primaryItem ? `${primaryItem.quantity} ${primaryItem.unit}` : ''} •{' '}
                    {new Date(tx.transaction_date).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p
                  className={`text-sm font-bold ${
                    isIncome ? 'text-emerald-700' : 'text-slate-900'
                  }`}
                >
                  {isIncome ? '+' : '-'}Rp{tx.total_amount?.toLocaleString('id-ID')}
                </p>
                <span
                  className={`inline-block text-[10px] font-medium uppercase tracking-wider ${
                    isIncome ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
