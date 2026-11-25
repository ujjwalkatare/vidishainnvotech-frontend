import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Eye, Pencil, Plus, Tags, Trash2, X } from "lucide-react";

import apiClient from "../../api/client";
import { useToast } from "../../components/Toast";

const getMessage = (err, fallback) => {
  const errors = err.response?.data?.errors;
  const first = errors ? Object.values(errors).flat()[0] : null;
  return first || err.response?.data?.message || fallback;
};

function AdminCategories() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);

  useEffect(() => {
    if (!viewingCategory) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setViewingCategory(null);
    };

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewingCategory]);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get("/admin/categories");
      const result = response.data?.data ?? response.data;
      setCategories(Array.isArray(result) ? result : result?.data ?? []);
    } catch (err) {
      toast.error(getMessage(err, "Unable to load categories."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await apiClient.post("/admin/categories", { name: name.trim() });
      setName("");
      setShowAddForm(false);
      toast.success("Category created successfully.");
      await loadCategories();
    } catch (err) {
      toast.error(getMessage(err, "Unable to create category."));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setConfirmingId(null);
    setEditingId(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (category) => {
    const trimmed = editName.trim();

    if (!trimmed) {
      toast.error("Category name is required.");
      return;
    }

    if (trimmed === category.name) {
      cancelEdit();
      return;
    }

    setBusyId(category.id);

    try {
      await apiClient.put(`/admin/categories/${category.id}`, { name: trimmed });
      toast.success("Category updated successfully.");
      cancelEdit();
      await loadCategories();
    } catch (err) {
      toast.error(getMessage(err, "Unable to update category."));
    } finally {
      setBusyId(null);
    }
  };

  const deleteCategory = async (category) => {
    setBusyId(category.id);

    try {
      await apiClient.delete(`/admin/categories/${category.id}`);
      toast.success("Category deleted successfully.");
      setConfirmingId(null);
      await loadCategories();
    } catch (err) {
      toast.error(getMessage(err, "Unable to delete category."));
      setConfirmingId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="student-page">
      <main className="container admin-page">
        <header className="admin-header">
          <div>
            <span className="student-dashboard__eyebrow">Admin</span>
            <h1>Categories</h1>
            <p className="admin-header__desc">Create, edit and manage software categories.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (showAddForm) setName("");
              setShowAddForm((current) => !current);
            }}
          >
            {showAddForm ? <X size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
            {showAddForm ? "Close form" : "Add category"}
          </button>
        </header>

        <section className="admin-summary-grid" aria-label="Summary">
          <article className="admin-summary-card">
            <div className="admin-summary-card__icon">
              <Tags size={20} aria-hidden="true" />
            </div>
            <div className="admin-summary-card__content">
              <span>Total categories</span>
              <strong>{categories.length}</strong>
            </div>
          </article>
        </section>

        {showAddForm && <section className="admin-panel" style={{ marginBottom: 22 }}>
          <h3>
            <Plus size={19} aria-hidden="true" />
            Add category
          </h3>

          <form onSubmit={handleSubmit} className="admin-category-form">
            <div className="admin-category-form__field">
              <label htmlFor="category-name">Category name</label>
              <input
                id="category-name"
                placeholder="e.g. Web Development"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={255}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Plus size={16} aria-hidden="true" />
              {saving ? "Saving..." : "Create category"}
            </button>
          </form>
        </section>}

        {loading && (
          <div aria-busy="true" style={{ display: "grid", gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 52 }} />
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="empty-state">
            <span className="empty-state__icon">
              <Tags size={24} aria-hidden="true" />
            </span>
            <h3>No categories yet</h3>
            <p>Create your first category above.</p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <>
            <div className="admin-result-count" role="status">
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table admin-users-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>No.</th>
                    <th>Category name</th>
                    <th style={{ width: 1 }}>
                      <span className="admin-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category, index) => {
                    const isEditing = editingId === category.id;
                    const isConfirming = confirmingId === category.id;
                    const isBusy = busyId === category.id;

                    return (
                      <tr key={category.id}>
                        <td data-label="No.">
                          <span className="group-chip">
                            <span className="group-chip__id">{index + 1}</span>
                          </span>
                        </td>

                        <td data-label="Category name" className="cell-name">
                          {isEditing ? (
                            <input
                              className="category-edit-input"
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveEdit(category);
                                if (event.key === "Escape") cancelEdit();
                              }}
                              maxLength={255}
                              autoFocus
                              aria-label="Category name"
                            />
                          ) : (
                            category.name
                          )}
                        </td>

                        <td className="admin-table__action">
                          <div className="row-actions">
                            {isEditing ? (
                              <>
                                <button type="button" className="icon-btn icon-btn--ok" onClick={() => saveEdit(category)} disabled={isBusy} title="Save">
                                  <Check size={16} />
                                </button>
                                <button type="button" className="icon-btn" onClick={cancelEdit} disabled={isBusy} title="Cancel">
                                  <X size={16} />
                                </button>
                              </>
                            ) : isConfirming ? (
                              <>
                                <span className="row-actions__ask">Delete?</span>
                                <button type="button" className="icon-btn icon-btn--danger-solid" onClick={() => deleteCategory(category)} disabled={isBusy} title="Confirm delete">
                                  <Check size={16} />
                                </button>
                                <button type="button" className="icon-btn" onClick={() => setConfirmingId(null)} disabled={isBusy} title="Cancel">
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => setViewingCategory(category)}
                                  title="View details"
                                  aria-label={`View ${category.name} details`}
                                >
                                  <Eye size={15} />
                                </button>
                                <button type="button" className="icon-btn" onClick={() => startEdit(category)} title="Edit">
                                  <Pencil size={15} />
                                </button>
                                <button type="button" className="icon-btn icon-btn--danger" onClick={() => setConfirmingId(category.id)} title="Delete">
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {viewingCategory && createPortal(
          <div
            className="admin-detail-backdrop ui-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setViewingCategory(null);
            }}
          >
            <section
              className="admin-detail-modal admin-detail-modal--compact ui-scroll-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-detail-title"
            >
              <header className="admin-detail-modal__header">
                <div>
                  <span className="admin-detail-modal__eyebrow">Category details</span>
                  <h2 id="category-detail-title">{viewingCategory.name}</h2>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setViewingCategory(null)}
                  aria-label="Close category details"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="admin-detail-modal__body ui-scroll-dialog__body">
                <div className="admin-detail-category-icon" aria-hidden="true">
                  <Tags size={24} />
                </div>
                <dl className="admin-detail-grid">
                  <div><dt>Category ID</dt><dd>#{viewingCategory.id}</dd></div>
                  <div><dt>Category name</dt><dd>{viewingCategory.name}</dd></div>
                  <div><dt>Slug</dt><dd>{viewingCategory.slug || "—"}</dd></div>
                  <div><dt>Software count</dt><dd>{viewingCategory.projects_count ?? viewingCategory.software_count ?? "—"}</dd></div>
                  <div><dt>Created</dt><dd>{viewingCategory.created_at ? new Date(viewingCategory.created_at).toLocaleString("en-IN") : "—"}</dd></div>
                  <div><dt>Last updated</dt><dd>{viewingCategory.updated_at ? new Date(viewingCategory.updated_at).toLocaleString("en-IN") : "—"}</dd></div>
                </dl>
              </div>

              <footer className="admin-detail-modal__footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewingCategory(null)}>
                  Close
                </button>
              </footer>
            </section>
          </div>,
          document.body,
        )}
      </main>
    </div>
  );
}

export default AdminCategories;
