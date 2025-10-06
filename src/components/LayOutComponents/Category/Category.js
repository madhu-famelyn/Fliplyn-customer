import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../LayOut/AdminLayout';
import './Category.css';
import { createCategory, fetchCategoriesByStall, updateCategory } from './Service';
import { FaEdit } from 'react-icons/fa';

export default function AddCategory() {
  const { stallId } = useParams();
  const location = useLocation();
  const { buildingId, adminId } = location.state || {};
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  // Update popup state
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [updateCategoryId, setUpdateCategoryId] = useState(null);
  const [updateName, setUpdateName] = useState('');
  const [updateFile, setUpdateFile] = useState(null);
  const updateFileRef = useRef(null);

  useEffect(() => {
    if (stallId) {
      fetchCategoriesByStall(stallId)
        .then(setCategories)
        .catch((err) => {
          console.error('Failed to fetch categories:', err);
          setCategories([]);
        });
    }
  }, [stallId]);

  const refreshCategories = async () => {
    const refreshed = await fetchCategoriesByStall(stallId);
    setCategories(refreshed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !file || !buildingId || !stallId || !adminId) {
      alert('Please fill in all required fields and upload an image');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('building_id', buildingId);
    formData.append('stall_id', stallId);
    formData.append('admin_id', adminId);
    formData.append('file', file);

    try {
      setLoading(true);
      await createCategory(formData);
      alert('Category created successfully!');
      setName('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshCategories();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (categoryId) => {
    const localAdminId = localStorage.getItem('admin_id');
    navigate('/item', {
      state: { buildingId, stallId, categoryId, adminId: localAdminId },
    });
  };

  // Handle update popup open
  const handleEditClick = (cat) => {
    setUpdateCategoryId(cat.id);
    setUpdateName(cat.name);
    setUpdateFile(null);
    if (updateFileRef.current) updateFileRef.current.value = '';
    setShowUpdatePopup(true);
  };

  // Handle update submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateName) {
      alert('Please enter category name');
      return;
    }

    const formData = new FormData();
    formData.append('name', updateName);
    formData.append('building_id', buildingId);
    formData.append('stall_id', stallId);
    formData.append('admin_id', adminId);
    if (updateFile) formData.append('file', updateFile);

    try {
      setLoading(true);
      await updateCategory(updateCategoryId, formData);
      alert('Category updated successfully!');
      setShowUpdatePopup(false);
      await refreshCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="category-form-container">
        <div className="category-header">
          <h1>Categories</h1>
          <button onClick={() => setShowForm(!showForm)} className="create-category-btn">
            {showForm ? 'Close Form' : 'Create Category'}
          </button>
        </div>

        {showForm && (
          <form className="category-form" onSubmit={handleSubmit}>
            <label>Category Name</label>
            <input
              type="text"
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label>Upload Image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        )}

        <div className="category-list">
          <h2>Categories in this Stall</h2>
          {categories.length > 0 ? (
            <div className="category-cards">
              {categories.map((cat) => (
                <div key={cat.id} className="category-card">
                  <div
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => handleCardClick(cat.id)}
                  >
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      style={{
                        width: '100%',
                        height: '140px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/fallback.png';
                      }}
                    />
                  </div>
                  <h4>{cat.name}</h4>
                  <FaEdit
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      color: '#e68a00',
                      background: '#f7f7f5',
                      borderRadius: '50%',
                      padding: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(cat);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No categories available for this stall.</p>
          )}
        </div>
      </div>

      {/* Update Popup Modal */}
      {showUpdatePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Update Category</h2>
            <form onSubmit={handleUpdateSubmit}>
              <label>Category Name</label>
              <input
                type="text"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                required
              />

              <label>Upload New Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                ref={updateFileRef}
                onChange={(e) => setUpdateFile(e.target.files[0])}
              />

              <div className="popup-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowUpdatePopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
