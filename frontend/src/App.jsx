
import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  LogOut,
  BarChart3,
  RefreshCw,
  CircleAlert,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Search,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import "./styles.css";



const API = (
  import.meta.env.VITE_API_URL ||
  "https://expense-tracker-web-application-1-cura.onrender.com/api"
).replace(/\/$/, "");


const COLORS = [
  "#6558f5", "#16a673", "#f59e0b", "#ed5572",
  "#0ea5e9", "#8b5cf6", "#64748b", "#e879f9",
];

const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills",
  "Health", "Education", "Entertainment", "Other",
];

const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Business", "Investment", "Gift", "Other",
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("expense_user") || "null");
  } catch {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("expense_token") || ""
  );
  const [user, setUser] = useState(readStoredUser);
  const [transactions, setTransactions] = useState([]);
  const [mode, setMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [form, setForm] = useState({
    type: "expense",
    title: "",
    category: "Food",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const client = useMemo(
    () =>
      axios.create({
        baseURL: API,
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      }),
    [token]
  );

  const loadTransactions = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const { data } = await client.get("/transactions");

      setTransactions(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      const status = err.response?.status;

      setError(
        status === 401
          ? "Your session has expired. Please log in again."
          : err.response?.data?.message ||
              `Cannot load transactions. Check backend: ${API}`
      );

      if (status === 401) {
        localStorage.removeItem("expense_token");
        localStorage.removeItem("expense_user");
        setToken("");
        setUser(null);
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [client, token]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const balance = income - expenses;

  const categories = Object.values(
    transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const key = t.category || "Other";

        if (!acc[key]) {
          acc[key] = { name: key, value: 0 };
        }

        acc[key].value += Number(t.amount || 0);
        return acc;
      }, {})
  );

  const filteredTransactions = transactions.filter((t) => {
    const matchesType =
      typeFilter === "all" || t.type === typeFilter;

    const needle = search.trim().toLowerCase();

    const matchesSearch =
      !needle ||
      [t.title, t.category, t.note].some((value) =>
        String(value || "").toLowerCase().includes(needle)
      );

    return matchesType && matchesSearch;
  });

  async function submitAuth(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const endpoint =
        mode === "login" ? "/auth/login" : "/auth/register";

      const payload = {
        email: authForm.email.trim().toLowerCase(),
        password: authForm.password,
      };

      if (mode === "register") {
        payload.name = authForm.name.trim();
      }

      const { data } = await axios.post(
        `${API}${endpoint}`,
        payload
      );

      if (!data?.token) {
        throw new Error(
          "The API did not return a login token. Check your backend response."
        );
      }

      localStorage.setItem("expense_token", data.token);
      localStorage.setItem(
        "expense_user",
        JSON.stringify(data.user || null)
      );

      setToken(data.token);
      setUser(data.user || null);
      setSuccess("You are signed in.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          `Cannot connect to ${API}. Check your backend and MongoDB.`
      );
    } finally {
      setBusy(false);
    }
  }

  async function addTransaction(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.title.trim() ||
      !form.category ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError(
        "Enter a title, category, and amount greater than zero."
      );
      return;
    }

    try {
      await client.post("/transactions", {
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount),
      });

      setForm((prev) => ({
        ...prev,
        title: "",
        amount: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
      }));

      setSuccess("Transaction saved successfully.");
      await loadTransactions();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save transaction. Check your backend."
      );
    }
  }

  async function removeTransaction(id) {
    if (!window.confirm("Delete this transaction?")) return;

    setError("");
    setSuccess("");

    try {
      await client.delete(`/transactions/${id}`);
      setSuccess("Transaction deleted.");
      await loadTransactions();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete transaction."
      );
    }
  }

  function logout() {
    localStorage.removeItem("expense_token");
    localStorage.removeItem("expense_user");

    setToken("");
    setUser(null);
    setTransactions([]);
    setAuthForm({ name: "", email: "", password: "" });
    setError("");
    setSuccess("");
  }

  function dismissMessages() {
    setError("");
    setSuccess("");
  }

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">
              <Wallet size={25} />
            </span>

            <span className="brand-name">
              Expense Tracker
              <small>PERSONAL FINANCE</small>
            </span>
          </div>

          <p className="eyebrow">YOUR MONEY, MADE CLEAR</p>

          <h1>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p className="muted auth-intro">
            Track income, control expenses, and understand your money.
          </p>

          {error && (
            <div className="alert error-alert">
              <CircleAlert size={17} />
              <span>{error}</span>
              <button
                type="button"
                onClick={dismissMessages}
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <form onSubmit={submitAuth} className="stack-form">
            {mode === "register" && (
              <label>
                Full name
                <input
                  autoComplete="name"
                  required
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              Email address
              <input
                autoComplete="email"
                type="email"
                required
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    email: e.target.value,
                  })
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                type="password"
                minLength={8}
                required
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    password: e.target.value,
                  })
                }
                placeholder="At least 8 characters"
              />
            </label>

            <button
              type="submit"
              className="primary full"
              disabled={busy}
            >
              {busy
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>

          <p className="switch-auth">
            {mode === "login"
              ? "New here?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login" ? "register" : "login"
                );
                setError("");
                setSuccess("");
              }}
            >
              {mode === "login"
                ? "Create an account"
                : "Log in"}
            </button>
          </p>

          <p className="auth-footnote">
            Your personal finances, organized in one place.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Wallet size={22} />
          </span>

          <span className="brand-name">
            Expense Tracker
            <small>PERSONAL FINANCE</small>
          </span>
        </div>

        <div className="nav-active">
          <BarChart3 size={18} />
          Overview
        </div>

        <div className="sidebar-note">
          <span className="dot" />
          Your finances at a glance
        </div>

        <div className="sidebar-bottom">
          <div className="avatar">
            {(user?.name || user?.email || "U")
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div className="user-label">
            <strong>{user?.name || "User"}</strong>
            <small>{user?.email || ""}</small>
          </div>

          <button
            type="button"
            className="icon-btn"
            title="Log out"
            onClick={logout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1>Overview</h1>
            <p className="muted">
              Here’s what’s happening with your money.
            </p>
          </div>

          <span className="today">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </header>

        {error && (
          <div className="alert error-alert">
            <CircleAlert size={17} />
            <span>{error}</span>
            <button
              type="button"
              onClick={dismissMessages}
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {success && (
          <div className="alert success-alert">
            <span>{success}</span>
            <button
              type="button"
              onClick={dismissMessages}
              aria-label="Dismiss message"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="summary-grid">
          <article className="summary-card balance-card">
            <div className="card-top">
              <span>Total balance</span>
              <span className="metric-icon">
                <Wallet size={18} />
              </span>
            </div>
            <h2>{money(balance)}</h2>
            <p>Income minus expenses</p>
          </article>

          <article className="summary-card">
            <div className="card-top">
              <span>Total income</span>
              <span className="metric-icon green">
                <TrendingUp size={18} />
              </span>
            </div>
            <h2>{money(income)}</h2>
            <p className="positive">Money received</p>
          </article>

          <article className="summary-card">
            <div className="card-top">
              <span>Total expenses</span>
              <span className="metric-icon red">
                <TrendingDown size={18} />
              </span>
            </div>
            <h2>{money(expenses)}</h2>
            <p className="negative">Money spent</p>
          </article>
        </div>

        <div className="content-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Add transaction</h2>
                <p className="muted">
                  Record income or an expense
                </p>
              </div>
              <span className="panel-icon">
                <Plus size={19} />
              </span>
            </div>

            <form
              className="transaction-form"
              onSubmit={addTransaction}
            >
              <div className="type-switch">
                <button
                  type="button"
                  className={
                    form.type === "expense"
                      ? "selected expense"
                      : ""
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "expense",
                      category: "Food",
                    })
                  }
                >
                  Expense
                </button>

                <button
                  type="button"
                  className={
                    form.type === "income"
                      ? "selected income"
                      : ""
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      type: "income",
                      category: "Salary",
                    })
                  }
                >
                  Income
                </button>
              </div>

              <label>
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="e.g. Monthly salary"
                />
              </label>

              <div className="two-col">
                <label>
                  Amount (₹)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </label>

                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                  >
                    {(form.type === "expense"
                      ? EXPENSE_CATEGORIES
                      : INCOME_CATEGORIES
                    ).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Date
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
              </label>

              <label>
                Note (optional)
                <input
                  value={form.note}
                  onChange={(e) =>
                    setForm({ ...form, note: e.target.value })
                  }
                  placeholder="Add a short note"
                />
              </label>

              <button
                type="submit"
                className="primary full"
                disabled={loading}
              >
                <Plus size={17} />
                Save transaction
              </button>
            </form>
          </section>

          <section className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <h2>Spending by category</h2>
                <p className="muted">Expense distribution</p>
              </div>
              <span className="panel-icon">
                <TrendingDown size={18} />
              </span>
            </div>

            {categories.length ? (
              <>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {categories.map((category, index) => (
                          <Cell
                            key={category.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="legend">
                  {categories.map((category, index) => (
                    <div key={category.name}>
                      <span
                        style={{
                          background: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="legend-name">
                        {category.name}
                      </span>
                      <strong>{money(category.value)}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-chart">
                <BarChart3 size={32} />
                <strong>No expenses yet</strong>
                <span>
                  Add an expense to see your category breakdown.
                </span>
              </div>
            )}
          </section>
        </div>

        <section className="panel transactions-panel">
          <div className="panel-heading transaction-heading">
            <div>
              <h2>Recent transactions</h2>
              <p className="muted">
                {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </p>
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={loadTransactions}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? "spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="table-tools">
            <label className="search-box">
              <Search size={16} />
              <input
                aria-label="Search transactions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
              />
            </label>

            <select
              aria-label="Filter transaction type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              <option value="income">Income only</option>
              <option value="expense">Expenses only</option>
            </select>
          </div>

          {loading && !transactions.length ? (
            <div className="empty-state">
              <RefreshCw className="spin" size={24} />
              <span>Loading transactions...</span>
            </div>
          ) : filteredTransactions.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td>
                        <div className="transaction-title">
                          <span
                            className={`transaction-symbol ${transaction.type}`}
                          >
                            {transaction.type === "income" ? (
                              <ArrowUpRight size={17} />
                            ) : (
                              <ArrowDownRight size={17} />
                            )}
                          </span>

                          <div>
                            <strong>{transaction.title}</strong>
                            {transaction.note && (
                              <small>{transaction.note}</small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-pill">
                          {transaction.category}
                        </span>
                      </td>

                      <td>
                        {new Date(transaction.date).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>

                      <td
                        className={
                          transaction.type === "income"
                            ? "positive amount"
                            : "negative amount"
                        }
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {money(transaction.amount)}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="icon-btn delete-btn"
                          title="Delete transaction"
                          onClick={() =>
                            removeTransaction(transaction._id)
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Wallet size={25} />
              </div>

              <strong>
                {transactions.length
                  ? "No matching transactions"
                  : "Your transactions will appear here"}
              </strong>

              <span>
                {transactions.length
                  ? "Try a different search or filter."
                  : "Add your first income or expense using the form above."}
              </span>
            </div>
          )}
        </section>

        <footer>
          Built for Task 3 · Expense Tracker
          <span>Keep your money in focus.</span>
        </footer>
      </section>
    </main>
  );
}
