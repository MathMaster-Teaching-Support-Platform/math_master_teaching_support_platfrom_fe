import React, { useState, useEffect } from 'react';
import { SchoolService } from '../../services/api/school.service';
import type { School, CreateSchoolRequest } from '../../types';
import './SchoolManagement.css';

const SchoolManagement: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateSchoolRequest>({
    name: '',
    address: '',
    city: '',
    district: '',
    phoneNumber: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await SchoolService.getAllSchools();
      setSchools(response.result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schools';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      loadSchools();
      return;
    }

    setLoading(true);
    try {
      const response = await SchoolService.searchSchools(searchTerm);
      setSchools(response.result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingSchool(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      district: '',
      phoneNumber: '',
      email: '',
      website: '',
    });
    setShowModal(true);
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address,
      city: school.city,
      district: school.district,
      phoneNumber: school.phoneNumber,
      email: school.email,
      website: school.website,
    });
    setShowModal(true);
  };

  const handleDelete = async (school: School) => {
    if (!confirm(`Are you sure you want to delete ${school.name}?`)) {
      return;
    }

    try {
      await SchoolService.deleteSchool(school.id);
      await loadSchools();
      alert('School deleted successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete school';
      alert(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingSchool) {
        await SchoolService.updateSchool(editingSchool.id, formData);
        alert('School updated successfully');
      } else {
        await SchoolService.createSchool(formData);
        alert('School created successfully');
      }
      await loadSchools();
      setShowModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="school-management-page">
      <div className="page-header">
        <h1>School Management</h1>
        <p>Manage schools in the system</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="page-actions">
        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
        <button className="btn-add" onClick={handleAddNew}>
          + Add School
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading schools...</div>
      ) : schools.length === 0 ? (
        <div className="empty-state">No schools found</div>
      ) : (
        <div className="schools-grid">
          {schools.map((school) => (
            <div key={school.id} className="school-card">
              <h3>{school.name}</h3>
              <div className="school-info">
                <div className="school-info-item">
                  <span className="icon">📍</span>
                  <span>
                    {school.address}, {school.district}, {school.city}
                  </span>
                </div>
                <div className="school-info-item">
                  <span className="icon">📞</span>
                  <span>{school.phoneNumber}</span>
                </div>
                <div className="school-info-item">
                  <span className="icon">📧</span>
                  <span>{school.email}</span>
                </div>
                {school.website && (
                  <div className="school-info-item">
                    <span className="icon">🌐</span>
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      {school.website}
                    </a>
                  </div>
                )}
              </div>
              <div className="school-card-actions">
                <button className="btn-edit" onClick={() => handleEdit(school)}>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(school)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* School Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSchool ? 'Edit School' : 'Add New School'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="school-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">
                    School Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    Address <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">
                      City <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="district">
                      District <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phoneNumber">
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="website">
                    Website <span className="required">*</span>
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editingSchool ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolManagement;
