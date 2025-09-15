// src/pages/ItemBulkUpload.js
import React, { useState, useRef } from 'react';
import { uploadItemsExcel } from './Service';
import './Items.css';

const ItemBulkUpload = ({ buildingId, stallId, categoryId, adminId, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null); // ✅ ref for file input

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('❌ Please select an Excel file');
      return;
    }

    const formData = new FormData();
    formData.append('excel_file', file);
    formData.append('building_id', buildingId);
    formData.append('stall_id', stallId);
    formData.append('category_id', categoryId);
    formData.append('admin_id', adminId);
    formData.append('manager_id', ''); // empty if not needed

    try {
      const res = await uploadItemsExcel(formData);
      setMessage(`✅ ${res.items_created} items uploaded successfully!`);

      // ✅ Clear the state and reset the file input
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onSuccess) onSuccess(); // refresh the item list in parent
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to upload items');
    }
  };

  return (
    <div className="bulk-upload-container">
      <h3>Bulk Upload Items</h3>
      <form onSubmit={handleUpload}>
        <input
          ref={fileInputRef} // ✅ attach ref
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
        />
        <button type="submit" className="upload-btn">Upload Excel</button>
      </form>
      {message && <p className="upload-message">{message}</p>}
    </div>
  );
};

export default ItemBulkUpload;
