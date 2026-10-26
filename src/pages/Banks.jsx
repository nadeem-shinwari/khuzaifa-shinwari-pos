import { useEffect, useState } from 'react'

import { Alert, EmptyState, LoadingState } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { apiGet, apiPost, apiRequest } from '../services/api'
import { formatCurrency, formatDateTime } from '../utils/format'

const accountDefaults = { code: '', name: '', account_type: 'bank', bank_name: '', account_number: '', currency: 'PKR', balance: '0', is_active: true, notes: '' }
const txDefaults = { bank_account_id: '', transaction_date: new Date().toISOString().slice(0, 10), transaction_type: 'deposit', description: '', amount: '', currency: 'PKR', reference: '', counterparty: '', notes: '' }

export function Banks() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [ledgerAccountId, setLedgerAccountId] = useState('')
  const [ledgerRows, setLedgerRows] = useState([])
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingTx, setSavingTx] = useState(false)
  const [error, setError] = useState('')
  const [accountForm, setAccountForm] = useState(accountDefaults)
  const [txForm, setTxForm] = useState(txDefaults)
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  async function loadAccounts() {
    try {
      const payload = await apiGet('bank-accounts', { page: 1, per_page: 200 })
      setAccounts(payload?.data ?? [])
    } catch (caught) { setError(caught.message || 'Unable to load bank accounts.') }
  }
  async function loadTransactions(nextPage = page) {
    setLoading(true); setError('')
    try {
      const payload = await apiGet('bank-transactions', { page: nextPage, per_page: perPage })
      setTransactions(payload?.data ?? [])
      setTotalPages(Math.max(1, payload?.pagination?.pages ?? 1))
    } catch (caught) { setError(caught.message || 'Unable to load transactions.') }
    finally { setLoading(false) }
  }
  async function loadLedger(accountId = ledgerAccountId) {
    if (!accountId) {
      setLedgerRows([])
      return
    }
    setLedgerLoading(true)
    try {
      const payload = await apiGet('bank-transactions', { bank_account_id: accountId, page: 1, per_page: 500 })
      const rows = (payload?.data ?? []).slice().sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date))
      const account = accounts.find((item) => String(item.id) === String(accountId))
      let balance = Number(account?.balance ?? 0)
      const computed = rows.map((row) => {
        const amount = Number(row.amount || 0)
        const type = String(row.transaction_type || '').toLowerCase()
        const isCredit = type.includes('deposit') || type.includes('credit') || type.includes('transfer in')
        const isDebit = type.includes('withdraw') || type.includes('debit') || type.includes('transfer out')
        if (isCredit) balance += amount
        else if (isDebit) balance -= amount
        else balance += amount
        return { ...row, runningBalance: balance }
      })
      setLedgerRows(computed)
    } catch (caught) {
      setError(caught.message || 'Unable to load bank ledger.')
    } finally {
      setLedgerLoading(false)
    }
  }
  useEffect(() => { loadAccounts(); loadTransactions(page) }, [page]) // eslint-disable-line

  async function submitAccount(event) {
    event.preventDefault()
    setSavingAccount(true); setError('')
    try {
      const payload = {
        code: accountForm.code.trim(), name: accountForm.name.trim(), account_type: accountForm.account_type,
        bank_name: accountForm.bank_name.trim(), account_number: accountForm.account_number.trim(),
        currency: accountForm.currency.trim() || 'PKR', balance: Number(accountForm.balance || 0),
        is_active: accountForm.is_active, notes: accountForm.notes.trim(),
      }
      if (editingAccountId) await apiRequest(`bank-accounts/${editingAccountId}`, { method: 'PATCH', body: payload })
      else await apiPost('bank-accounts', payload)
      setEditingAccountId(null); setAccountForm(accountDefaults); await loadAccounts()
    } catch (caught) { setError(caught.message || 'Unable to save bank account.') }
    finally { setSavingAccount(false) }
  }
  function startEditAccount(row) {
    setEditingAccountId(row.id)
    setAccountForm({ code: row.code || '', name: row.name || '', account_type: row.account_type || 'bank', bank_name: row.bank_name || '', account_number: row.account_number || '', currency: row.currency || 'PKR', balance: row.balance ?? '0', is_active: Boolean(row.is_active), notes: row.notes || '' })
  }
  async function removeAccount(id) {
    if (!window.confirm('Deactivate this account?')) return
    try { await apiRequest(`bank-accounts/${id}`, { method: 'DELETE' }); await loadAccounts() }
    catch (caught) { setError(caught.message || 'Unable to deactivate account.') }
  }

  async function submitTx(event) {
    event.preventDefault()
    setSavingTx(true); setError('')
    try {
      const payload = {
        bank_account_id: Number(txForm.bank_account_id), transaction_date: txForm.transaction_date,
        transaction_type: txForm.transaction_type, description: txForm.description.trim(),
        amount: Number(txForm.amount || 0), currency: txForm.currency.trim() || 'PKR',
        reference: txForm.reference.trim(), counterparty: txForm.counterparty.trim(), notes: txForm.notes.trim(),
      }
      await apiPost('bank-transactions', payload)
      setTxForm(txDefaults); await loadTransactions(page)
    } catch (caught) { setError(caught.message || 'Unable to save transaction.') }
    finally { setSavingTx(false) }
  }
  async function removeTx(id) {
    if (!window.confirm('Delete this transaction?')) return
    try { await apiRequest(`bank-transactions/${id}`, { method: 'DELETE' }); await loadTransactions(page) }
    catch (caught) { setError(caught.message || 'Unable to delete transaction.') }
  }

  return (
    <div className="space-y-6">
      <Card title="Bank account form" description="Manage bank and cash accounts.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitAccount}>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Code</span><input value={accountForm.code} onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Name</span><input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Type</span><select value={accountForm.account_type} onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2"><option value="bank">Bank</option><option value="cash">Cash</option><option value="credit_card">Credit card</option></select></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Bank name</span><input value={accountForm.bank_name} onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Account number</span><input value={accountForm.account_number} onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Currency</span><input value={accountForm.currency} onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Opening balance</span><input type="number" step="0.01" value={accountForm.balance} onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
          <label className="block text-sm md:col-span-2"><span className="mb-1 block font-medium text-ink-700">Notes</span><textarea value={accountForm.notes} onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" rows={2} /></label>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit" disabled={savingAccount}>{savingAccount ? 'Saving?' : editingAccountId ? 'Update account' : 'Add account'}</Button>
            {editingAccountId && <Button type="button" variant="secondary" onClick={() => { setEditingAccountId(null); setAccountForm(accountDefaults) }}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card title="Bank accounts" description="Accounts and balances.">
        {error && <Alert variant="error" title="Bank error">{error}</Alert>}
        {accounts.length === 0 ? <EmptyState title="No accounts yet" description="Add a bank account." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600"><tr>
                <th className="px-3 py-2 font-medium">Code</th><th className="px-3 py-2 font-medium">Name</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Balance</th><th className="px-3 py-2 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {accounts.map((row) => (
                  <tr key={row.id} className="border-t border-ink-100">
                    <td className="px-3 py-3 font-medium text-ink-900">{row.code}</td>
                    <td className="px-3 py-3 text-ink-600">{row.name}</td>
                    <td className="px-3 py-3 text-ink-600">{row.account_type}</td>
                    <td className="px-3 py-3 text-ink-600">{formatCurrency(row.balance)}</td>
                    <td className="px-3 py-3"><div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => startEditAccount(row)}>Edit</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAccount(row.id)}>Deactivate</Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Transaction form" description="Record deposits, withdrawals and payments.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitTx}>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Account</span><select value={txForm.bank_account_id} onChange={(e) => setTxForm({ ...txForm, bank_account_id: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required><option value="">Select account</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Date</span><input type="date" value={txForm.transaction_date} onChange={(e) => setTxForm({ ...txForm, transaction_date: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Type</span><select value={txForm.transaction_type} onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2"><option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="transfer">Transfer</option><option value="payment">Payment</option><option value="receipt">Receipt</option></select></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Amount</span><input type="number" step="0.01" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm md:col-span-2"><span className="mb-1 block font-medium text-ink-700">Description</span><input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" required /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Currency</span><input value={txForm.currency} onChange={(e) => setTxForm({ ...txForm, currency: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Reference</span><input value={txForm.reference} onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
          <label className="block text-sm"><span className="mb-1 block font-medium text-ink-700">Counterparty</span><input value={txForm.counterparty} onChange={(e) => setTxForm({ ...txForm, counterparty: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" /></label>
          <label className="block text-sm md:col-span-2"><span className="mb-1 block font-medium text-ink-700">Notes</span><textarea value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} className="w-full rounded-lg border border-ink-200 px-3 py-2" rows={2} /></label>
          <div className="md:col-span-2 flex gap-2"><Button type="submit" disabled={savingTx}>{savingTx ? 'Saving?' : 'Add transaction'}</Button></div>
        </form>
      </Card>

      <Card title="Transactions" description="Bank transactions.">
        {loading ? <LoadingState label="Loading transactions?" /> : transactions.length === 0 ? <EmptyState title="No transactions yet" description="Add a transaction." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600"><tr>
                <th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Description</th><th className="px-3 py-2 font-medium">Amount</th><th className="px-3 py-2 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {transactions.map((row) => (
                  <tr key={row.id} className="border-t border-ink-100">
                    <td className="px-3 py-3 text-ink-600">{formatDateTime(row.transaction_date)}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{row.transaction_type}</td>
                    <td className="px-3 py-3 text-ink-600">{row.description}</td>
                    <td className="px-3 py-3 text-ink-600">{formatCurrency(row.amount)}</td>
                    <td className="px-3 py-3"><Button type="button" variant="ghost" size="sm" onClick={() => removeTx(row.id)}>Delete</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-ink-600">Page {page} / {totalPages}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPage((c) => Math.min(totalPages, c + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        )}
      </Card>

      <Card title="Bank ledger" description="Running balance by account.">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink-700">Account</span>
            <select value={ledgerAccountId} onChange={(event) => { setLedgerAccountId(event.target.value); loadLedger(event.target.value) }} className="rounded-lg border border-ink-200 px-3 py-2">
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {ledgerLoading ? (
          <LoadingState label="Loading ledger..." />
        ) : !ledgerAccountId ? (
          <EmptyState title="No account selected" description="Select a bank account to view its ledger." />
        ) : ledgerRows.length === 0 ? (
          <EmptyState title="No transactions" description="No transactions found for this account." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-ink-50 text-ink-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Debit</th>
                  <th className="px-3 py-2 font-medium">Credit</th>
                  <th className="px-3 py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row) => {
                  const amount = Number(row.amount || 0)
                  const type = String(row.transaction_type || '').toLowerCase()
                  const isCredit = type.includes('deposit') || type.includes('credit') || type.includes('transfer in')
                  return (
                    <tr key={row.id} className="border-t border-ink-100">
                      <td className="px-3 py-3 text-ink-600">{formatDateTime(row.transaction_date)}</td>
                      <td className="px-3 py-3 font-medium text-ink-900">{row.transaction_type}</td>
                      <td className="px-3 py-3 text-ink-600">{row.description}</td>
                      <td className="px-3 py-3 text-ink-600">{isCredit ? '-' : formatCurrency(amount)}</td>
                      <td className="px-3 py-3 text-ink-600">{isCredit ? formatCurrency(amount) : '-'}</td>
                      <td className="px-3 py-3 font-medium text-ink-900">{formatCurrency(row.runningBalance)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Banks
