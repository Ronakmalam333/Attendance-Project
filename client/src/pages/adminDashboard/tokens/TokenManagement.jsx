import React, { useState, useEffect, useMemo } from "react";
import axios from "../../../tokenManager";
import { useToast } from "../../../context/ToastContext";
import Icons from "../../../components/ui/Icons";
import Badge from "../../../components/ui/Badge";
import Skeleton, { TableSkeleton } from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import "./tokenManagement.css";

function TokenManagement() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, tokenId: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const [formData, setFormData] = useState({
    subject: "",
    token: "",
    faculty: "",
    validFrom: "",
    duration: "1",
    maxUsage: 100,
  });

  const [existingSubjects, setExistingSubjects] = useState([]);

  useEffect(() => {
    fetchTokens();
    axios.get("/subjects").then((res) => {
      setExistingSubjects(res.data || []);
    }).catch(() => {});
  }, []);

  const durationOptions = [
    { value: "0.25", label: "15 minutes" },
    { value: "0.5", label: "30 minutes" },
    { value: "1", label: "1 hour" },
    { value: "1.5", label: "1.5 hours" },
    { value: "2", label: "2 hours" },
    { value: "3", label: "3 hours" },
  ];

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/tokens");
      setTokens(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch session tokens from server.");
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 4; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, token }));
  };

  const openCreateModal = () => {
    // Current local datetime string for datetime-local input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultValidFrom = now.toISOString().slice(0, 16);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomToken = "";
    for (let i = 0; i < 4; i++) {
      randomToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setEditingToken(null);
    setFormData({
      subject: "Data Structures",
      token: randomToken,
      faculty: "Computer Science",
      validFrom: defaultValidFrom,
      duration: "1",
      maxUsage: 100,
    });
    setShowModal(true);
  };

  const handleEdit = (tokenItem) => {
    const validFromDate = new Date(tokenItem.validFrom);
    validFromDate.setMinutes(validFromDate.getMinutes() - validFromDate.getTimezoneOffset());
    const validFromStr = validFromDate.toISOString().slice(0, 16);

    const validFrom = new Date(tokenItem.validFrom);
    const validUntil = new Date(tokenItem.validUntil);
    const duration = ((validUntil - validFrom) / (1000 * 60 * 60)).toString();

    setEditingToken(tokenItem);
    setFormData({
      subject: tokenItem.subject || "",
      token: tokenItem.token || "",
      faculty: tokenItem.faculty || "Computer Science",
      validFrom: validFromStr,
      duration: duration || "1",
      maxUsage: tokenItem.maxUsage || 100,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.token || formData.token.length !== 4) {
      toast.warning("Token code must be exactly 4 characters.", "Invalid Token");
      return;
    }

    const validFrom = new Date(formData.validFrom);
    if (isNaN(validFrom.getTime())) {
      toast.warning("Please provide a valid start timestamp.", "Invalid Date");
      return;
    }

    const durationMs = parseFloat(formData.duration) * 60 * 60 * 1000;
    const validUntil = new Date(validFrom.getTime() + durationMs);

    const submitData = {
      ...formData,
      token: formData.token.toUpperCase().trim(),
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
    };

    setSubmitting(true);
    try {
      if (editingToken) {
        await axios.put(`/tokens/${editingToken._id}`, submitData);
        toast.success(`Token "${submitData.token}" updated successfully!`, "Session Updated");
      } else {
        await axios.post("/tokens", submitData);
        toast.success(`Token "${submitData.token}" created and broadcasted!`, "Session Created");
      }
      setShowModal(false);
      fetchTokens();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save token session";
      toast.error(message, "Save Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const promptDelete = (id) => {
    setDeleteModalState({ isOpen: true, tokenId: id });
  };

  const confirmDelete = async () => {
    const id = deleteModalState.tokenId;
    if (!id) return;
    try {
      await axios.delete(`/tokens/${id}`);
      toast.success("Attendance token removed successfully.", "Token Deleted");
      setDeleteModalState({ isOpen: false, tokenId: null });
      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting token.");
    }
  };

  const toggleActive = async (tokenItem) => {
    try {
      const newStatus = !tokenItem.isActive;
      await axios.put(`/tokens/${tokenItem._id}`, { isActive: newStatus });
      toast.info(`Token ${tokenItem.token} marked as ${newStatus ? "Active" : "Inactive"}.`);
      fetchTokens();
    } catch (error) {
      toast.error("Failed to update token status.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Token code "${text}" copied to clipboard!`, "Copied");
  };

  // Filtered Tokens List
  const filteredTokens = useMemo(() => {
    const now = new Date();
    return tokens.filter((t) => {
      // Status filter
      const isExpired = new Date(t.validUntil) < now;
      const isLive = t.isActive && !isExpired && t.currentUsage < t.maxUsage;

      if (statusFilter === "active" && !isLive) return false;
      if (statusFilter === "expired" && !isExpired) return false;
      if (statusFilter === "inactive" && t.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSub = (t.subject || "").toLowerCase().includes(q);
        const matchFac = (t.faculty || "").toLowerCase().includes(q);
        const matchCode = (t.token || "").toLowerCase().includes(q);
        if (!matchSub && !matchFac && !matchCode) return false;
      }

      return true;
    });
  }, [tokens, statusFilter, searchQuery]);

  return (
    <div className='erp-token-mgmt-page'>
      {/* Page Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Attendance Token Dispatcher</h1>
          <p className='erp-page-subtitle'>
            Generate time-bound 4-character codes for real-time classroom check-ins.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button type='button' className='erp-btn erp-btn-primary' onClick={openCreateModal}>
            <Icons.Plus size={16} />
            <span>Generate New Session</span>
          </button>
          <button
            type='button'
            className='erp-btn erp-btn-ghost'
            onClick={fetchTokens}
            title='Refresh tokens list'
          >
            <Icons.Refresh size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className='erp-filter-toolbar erp-card'>
        <div className='erp-search-field-container'>
          <Icons.Search size={16} className='erp-search-icon' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by subject, faculty department, or 4-digit code...'
            className='erp-search-input'
          />
        </div>

        <div className='erp-status-tabs'>
          {[
            { id: "all", label: "All Sessions" },
            { id: "active", label: "Active Now" },
            { id: "expired", label: "Expired" },
            { id: "inactive", label: "Deactivated" },
          ].map((tab) => (
            <button
              key={tab.id}
              type='button'
              className={`erp-tab-btn ${statusFilter === tab.id ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tokens Table Card */}
      <div className='erp-token-table-card erp-card'>
        <div className='erp-table-header-block'>
          <h2 className='erp-card-title'>Recorded Sessions ({filteredTokens.length})</h2>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : filteredTokens.length === 0 ? (
          <EmptyState
            icon={Icons.Key}
            title='No sessions found'
            description='No attendance tokens match the specified criteria. Click "Generate New Session" to create one.'
            action={
              <button type='button' className='erp-btn erp-btn-primary' onClick={openCreateModal}>
                <Icons.Plus size={15} />
                <span>Create First Token</span>
              </button>
            }
          />
        ) : (
          <div className='erp-table-container'>
            <table className='erp-table'>
              <thead>
                <tr>
                  <th>Token Code</th>
                  <th>Subject</th>
                  <th>Department / Faculty</th>
                  <th>Validity Window</th>
                  <th>Attendance Usage</th>
                  <th>Live Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((item) => {
                  const now = new Date();
                  const isExpired = new Date(item.validUntil) < now;
                  const isLive = item.isActive && !isExpired && item.currentUsage < item.maxUsage;

                  const usagePercent =
                    item.maxUsage > 0
                      ? Math.min(100, Math.round(((item.currentUsage || 0) / item.maxUsage) * 100))
                      : 0;

                  return (
                    <tr key={item._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className='erp-token-display-chip tabular-nums'>{item.token}</span>
                          <button
                            type='button'
                            className='erp-icon-btn'
                            onClick={() => copyToClipboard(item.token)}
                            title='Copy token to clipboard'
                          >
                            <Icons.Copy size={13} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "var(--text-primary)" }}>{item.subject}</strong>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{item.faculty}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span className='tabular-nums text-muted' style={{ fontSize: "0.75rem" }}>
                            From: {new Date(item.validFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className='tabular-nums text-muted' style={{ fontSize: "0.75rem" }}>
                            Until: {new Date(item.validUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "120px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }} className='tabular-nums'>
                            <span>{item.currentUsage || 0}</span>
                            <span className='text-muted'>max {item.maxUsage}</span>
                          </div>
                          <div className='erp-progress-track'>
                            <div
                              className='erp-progress-fill fill-good'
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {isLive ? (
                          <Badge variant='present' size='sm'>
                            Active
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant='neutral' size='sm'>
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant='absent' size='sm'>
                            Deactivated
                          </Badge>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type='button'
                            className='erp-btn erp-btn-secondary'
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={() => toggleActive(item)}
                            title={item.isActive ? "Deactivate token" : "Activate token"}
                          >
                            {item.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type='button'
                            className='erp-btn erp-btn-secondary'
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={() => handleEdit(item)}
                            title='Edit session parameters'
                          >
                            <Icons.Edit size={13} />
                          </button>
                          <button
                            type='button'
                            className='erp-btn erp-btn-ghost erp-btn-trash'
                            style={{ padding: "4px 8px" }}
                            onClick={() => promptDelete(item._id)}
                            title='Delete token'
                          >
                            <Icons.Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Token Modal Dialog */}
      {showModal && (
        <div className='modal-backdrop' onClick={() => setShowModal(false)}>
          <div className='modal-card erp-modal-dialog' onClick={(e) => e.stopPropagation()}>
            <div className='erp-modal-header'>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Key size={18} className='text-brand' />
                <h3 className='erp-modal-title'>
                  {editingToken ? "Configure Attendance Token" : "Generate New Attendance Token"}
                </h3>
              </div>
              <button
                type='button'
                className='toast-close-btn'
                onClick={() => setShowModal(false)}
                aria-label='Close modal'
              >
                <Icons.X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='erp-modal-form'>
              {/* Faculty Department */}
              <div className='erp-form-group'>
                <label className='erp-label'>Faculty / Department Name</label>
                <input
                  type='text'
                  value={formData.faculty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      faculty: e.target.value,
                    }))
                  }
                  placeholder='e.g., Computer Science or Prof. Adil Ahmad'
                  className='erp-input'
                  required
                />
              </div>

              {/* Subject */}
              <div className='erp-form-group'>
                <label className='erp-label'>Course / Subject Name</label>
                <input
                  type='text'
                  list='dynamic-subject-list'
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder='e.g., Web Development or Database Systems'
                  className='erp-input'
                  required
                />
                <datalist id='dynamic-subject-list'>
                  {existingSubjects.map((sub) => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </div>

              {/* Token Code & Generator */}
              <div className='erp-form-group'>
                <label className='erp-label'>4-Character Session Code</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type='text'
                    value={formData.token}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        token: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4),
                      }))
                    }
                    maxLength={4}
                    className='erp-input tabular-nums'
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      letterSpacing: "0.2em",
                      textAlign: "center",
                    }}
                    required
                  />
                  <button
                    type='button'
                    className='erp-btn erp-btn-secondary'
                    onClick={generateToken}
                  >
                    <Icons.Sparkles size={14} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Date & Duration Row */}
              <div className='erp-form-row-2col'>
                <div className='erp-form-group'>
                  <label className='erp-label'>Broadcast Start Time</label>
                  <input
                    type='datetime-local'
                    value={formData.validFrom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
                    className='erp-input'
                    required
                  />
                </div>

                <div className='erp-form-group'>
                  <label className='erp-label'>Window Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                    className='erp-select'
                    required
                  >
                    {durationOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capacity Limit */}
              <div className='erp-form-group'>
                <label className='erp-label'>Maximum Allowed Attendances (Cap)</label>
                <input
                  type='number'
                  min={1}
                  max={500}
                  value={formData.maxUsage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxUsage: parseInt(e.target.value, 10) || 1 }))
                  }
                  className='erp-input'
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className='erp-modal-footer'>
                <button
                  type='button'
                  className='erp-btn erp-btn-secondary'
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='erp-btn erp-btn-primary'
                  disabled={submitting || !formData.token || formData.token.length !== 4}
                >
                  {submitting ? "Processing..." : editingToken ? "Save Changes" : "Broadcast Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title='Revoke and Delete Token'
        message='Are you sure you want to delete this token session? Students will no longer be able to submit attendance using this code.'
        confirmLabel='Delete Token'
        cancelLabel='Cancel'
        variant='danger'
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, tokenId: null })}
      />
    </div>
  );
}

export default TokenManagement;
