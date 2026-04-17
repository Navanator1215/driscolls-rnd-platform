import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [trials, setTrials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  const [form, setForm] = useState({
    crop: "",
    location: "",
    status: "Active",
  });

  async function fetchTrials() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/trials`);
      if (!response.ok) {
        throw new Error("Failed to fetch trials");
      }

      const data = await response.json();
      setTrials(data.trials);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrials();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEdit(trial) {
    setEditingId(trial.id);
    setForm({
      crop: trial.crop,
      location: trial.location,
      status: trial.status,
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({
      crop: "",
      location: "",
      status: "Active",
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");

      const url =
        editingId === null
          ? `${API_BASE}/trials`
          : `${API_BASE}/trials/${editingId}`;

      const method = editingId === null ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail?.[0]?.msg || errorData.detail || "Request failed"
        );
      }

      setForm({
        crop: "",
        location: "",
        status: "Active",
      });
      setEditingId(null);

      await fetchTrials();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      setError("");

      const response = await fetch(`${API_BASE}/trials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete trial");
      }

      if (editingId === id) {
        handleCancelEdit();
      }

      await fetchTrials();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function getSortIndicator(field) {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  const filteredTrials = useMemo(() => {
    const filtered = trials.filter((trial) => {
      const matchesSearch =
        trial.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trial.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : trial.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [trials, searchTerm, statusFilter, sortField, sortDirection]);

  const summary = useMemo(() => {
    return {
      total: trials.length,
      active: trials.filter((trial) => trial.status === "Active").length,
      planned: trials.filter((trial) => trial.status === "Planned").length,
      completed: trials.filter((trial) => trial.status === "Completed").length,
    };
  }, [trials]);

  return (
    <div className="app">
      <h1>Driscoll&apos;s R&amp;D Platform</h1>
      <p className="subtitle">Trial management dashboard</p>

      <section className="summary-grid">
        <div className="summary-card">
          <h3>Total Trials</h3>
          <p>{summary.total}</p>
        </div>
        <div className="summary-card">
          <h3>Active</h3>
          <p>{summary.active}</p>
        </div>
        <div className="summary-card">
          <h3>Planned</h3>
          <p>{summary.planned}</p>
        </div>
        <div className="summary-card">
          <h3>Completed</h3>
          <p>{summary.completed}</p>
        </div>
      </section>

      <section className="card">
        <h2>{editingId === null ? "Create Trial" : `Edit Trial #${editingId}`}</h2>

        <form onSubmit={handleSubmit} className="trial-form">
          <input
            type="text"
            name="crop"
            placeholder="Crop"
            value={form.crop}
            onChange={handleChange}
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
          />

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
          </select>

          <button type="submit">
            {editingId === null ? "Add Trial" : "Save Changes"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section className="card">
        <div className="trials-header">
          <h2>Trials</h2>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search by crop or location"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {loading && <p>Loading trials...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && filteredTrials.length === 0 && (
          <p>No trials match your current filters.</p>
        )}

        {!loading && filteredTrials.length > 0 && (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} className="sortable">
                  ID{getSortIndicator("id")}
                </th>
                <th onClick={() => handleSort("crop")} className="sortable">
                  Crop{getSortIndicator("crop")}
                </th>
                <th onClick={() => handleSort("location")} className="sortable">
                  Location{getSortIndicator("location")}
                </th>
                <th onClick={() => handleSort("status")} className="sortable">
                  Status{getSortIndicator("status")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrials.map((trial) => (
                <tr key={trial.id}>
                  <td>{trial.id}</td>
                  <td>{trial.crop}</td>
                  <td>{trial.location}</td>
                  <td>{trial.status}</td>
                  <td className="actions-cell">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(trial)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(trial.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;