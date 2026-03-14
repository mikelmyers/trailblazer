'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  status: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

const ROLES = ['ADMIN', 'SHIPPER', 'DRIVER', 'SUPPORT'] as const;
const PAGE_SIZE = 20;

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-violet-50 text-violet-700 border-violet-200',
  SHIPPER: 'bg-blue-50 text-blue-700 border-blue-200',
  DRIVER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUPPORT: 'bg-amber-50 text-amber-700 border-amber-200',
};

const statusBadgeColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-background-2 text-text-muted border-border',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse>({ users: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      setData(await res.json());
      setError(null);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleChangeRole(userId: string, newRole: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'changeRole', role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to change role');
      await fetchUsers();
    } catch {
      alert('Failed to change user role.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeactivate(userId: string) {
    if (!confirm('Deactivate this user?')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' }),
      });
      if (!res.ok) throw new Error('Failed to deactivate');
      await fetchUsers();
    } catch {
      alert('Failed to deactivate user.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPassword(userId: string) {
    if (!confirm('Send a password reset email to this user?')) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset password');
      alert('Password reset email sent.');
    } catch {
      alert('Failed to send password reset.');
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label">User Management</div>
          <h2 className="text-h3 text-text-primary">All Users</h2>
        </div>
        <div className="text-[11px] font-mono text-text-muted">
          {data.total.toLocaleString()} total users
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 rounded-md border border-border bg-white px-4 py-3">
        <svg className="h-4 w-4 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-[11px] text-text-secondary hover:text-text-primary transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-background-2">
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Name</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Email</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Role</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Created</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide-label text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 rounded bg-background-3 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[12px] text-text-muted">
                    {debouncedSearch ? 'No users found matching your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-background-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-background-3 flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[12px] font-medium text-text-primary">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label ${roleBadgeColors[user.role] ?? 'bg-background-2 text-text-secondary border-border'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide-label ${statusBadgeColors[user.status] ?? 'bg-background-2 text-text-secondary border-border'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleChangeRole(user.id, e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                          disabled={actionLoading === user.id}
                          className="rounded border border-border bg-white px-1.5 py-1 text-[10px] text-text-secondary focus:outline-none disabled:opacity-50"
                        >
                          <option value="" disabled>Role</option>
                          {ROLES.filter((r) => r !== user.role).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          disabled={actionLoading === user.id || user.status === 'INACTIVE'}
                          className="rounded px-2 py-1 text-[10px] font-medium text-danger border border-danger/20 hover:bg-danger/5 transition disabled:opacity-40 disabled:pointer-events-none"
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          disabled={actionLoading === user.id}
                          className="rounded px-2 py-1 text-[10px] font-medium text-text-secondary border border-border hover:bg-background-2 transition disabled:opacity-50"
                        >
                          Reset PW
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-[11px] text-text-muted">
              Page <span className="font-mono font-medium text-text-secondary">{page}</span> of{' '}
              <span className="font-mono font-medium text-text-secondary">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-border px-3 py-1 text-[11px] font-medium text-text-secondary transition hover:bg-background-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded px-2.5 py-1 text-[11px] font-mono font-medium transition ${
                      pageNum === page ? 'bg-surface-dark text-white' : 'text-text-secondary hover:bg-background-2'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-border px-3 py-1 text-[11px] font-medium text-text-secondary transition hover:bg-background-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
