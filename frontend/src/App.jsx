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
    variety: "",
    location: "",
    objective: "",
    season: "",
    status: "Active",
    notes: "",
    ai_recommendation: "",
    ai_next_action: "",
  });

  const [aiForm, setAiForm] = useState({
    crop: "",
    location: "",
    notes: "",
  });

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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
    async function loadTrials() {
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

    loadTrials();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAiChange(event) {
    const { name, value } = event.target;
    setAiForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEdit(trial) {
    setEditingId(trial.id);
    setForm({
      crop: trial.crop || "",
      variety: trial.variety || "",
      location: trial.location || "",
      objective: trial.objective || "",
      season: trial.season || "",
      status: trial.status || "Active",
      notes: trial.notes || "",
      ai_recommendation: trial.ai_recommendation || "",
      ai_next_action: trial.ai_next_action || "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({
      crop: "",
      variety: "",
      location: "",
      objective: "",
      season: "",
      status: "Active",
      notes: "",
      ai_recommendation: "",
      ai_next_action: "",
    });
    setError("");
  }

  function applyAiRecommendation() {
    if (!aiResult) return;

    setEditingId(null);
    setForm((prev) => ({
      ...prev,
      crop: aiForm.crop,
      location: aiForm.location,
      status: aiResult.recommended_status,
      notes: aiForm.notes,
      ai_recommendation: `${aiResult.recommended_status} (${aiResult.confidence}%)`,
      ai_next_action: aiResult.next_action,
    }));
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
        variety: "",
        location: "",
        objective: "",
        season: "",
        status: "Active",
        notes: "",
        ai_recommendation: "",
        ai_next_action: "",
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

  async function handleAiSubmit(event) {
    event.preventDefault();

    try {
      setAiLoading(true);
      setAiError("");
      setAiResult(null);

      const response = await fetch(`${API_BASE}/ai/recommend-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail?.[0]?.msg || data.detail || "Failed to get AI recommendation"
        );
      }

      setAiResult(data);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
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
        trial.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trial.variety || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trial.season || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : trial.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortField] || "";
      let bValue = b[sortField] || "";

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

        <form onSubmit={handleSubmit} className="rd-form">
          <input type="text" name="crop" placeholder="Crop" value={form.crop} onChange={handleChange} />
          <input type="text" name="variety" placeholder="Variety" value={form.variety} onChange={handleChange} />
          <input type="text" name="location" placeholder="Location" value={form.location} onChange={handleChange} />
          <input type="text" name="objective" placeholder="Objective" value={form.objective} onChange={handleChange} />
          <input type="text" name="season" placeholder="Season" value={form.season} onChange={handleChange} />

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
          </select>

          <textarea
            name="notes"
            placeholder="Trial notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
          />

          <input
            type="text"
            name="ai_recommendation"
            placeholder="AI Recommendation"
            value={form.ai_recommendation}
            onChange={handleChange}
          />

          <textarea
            name="ai_next_action"
            placeholder="AI Suggested Next Action"
            value={form.ai_next_action}
            onChange={handleChange}
            rows="3"
          />

          <button type="submit">
            {editingId === null ? "Add Trial" : "Save Changes"}
          </button>

          {editingId !== null && (
            <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </form>
      </section>

      <section className="card">
        <h2>AI Recommendation Assistant</h2>

        <form onSubmit={handleAiSubmit} className="ai-form">
          <input
            type="text"
            name="crop"
            placeholder="Crop"
            value={aiForm.crop}
            onChange={handleAiChange}
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={aiForm.location}
            onChange={handleAiChange}
          />

          <textarea
            name="notes"
            placeholder="Enter trial notes, observations, or next-step comments..."
            value={aiForm.notes}
            onChange={handleAiChange}
            rows="4"
          />

          <button type="submit" disabled={aiLoading}>
            {aiLoading ? "Analyzing..." : "Get AI Recommendation"}
          </button>
        </form>

        {aiError && <p className="error">{aiError}</p>}

        {aiResult && (
          <div className="ai-result">
            <h3>Recommended Status: {aiResult.recommended_status}</h3>
            <p><strong>Confidence:</strong> {aiResult.confidence}%</p>
            <p><strong>Why:</strong> {aiResult.explanation}</p>
            <p><strong>Suggested Next Action:</strong> {aiResult.next_action}</p>

            <button className="apply-ai-btn" onClick={applyAiRecommendation}>
              Use Recommendation
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="trials-header">
          <h2>Trials</h2>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search by crop, location, variety, or season"
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
                <th onClick={() => handleSort("variety")} className="sortable">
                  Variety{getSortIndicator("variety")}
                </th>
                <th onClick={() => handleSort("location")} className="sortable">
                  Location{getSortIndicator("location")}
                </th>
                <th onClick={() => handleSort("season")} className="sortable">
                  Season{getSortIndicator("season")}
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
                  <td>{trial.variety || "-"}</td>
                  <td>{trial.location}</td>
                  <td>{trial.season || "-"}</td>
                  <td>{trial.status}</td>
                  <td className="actions-cell">
                    <button className="edit-btn" onClick={() => handleEdit(trial)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(trial.id)}>
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