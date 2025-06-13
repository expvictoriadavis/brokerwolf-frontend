import React from 'react';

export default function FilterPanel({ filters, setFilters }) {
  const handleChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <label>Status</label>
      <select multiple name="status" onChange={handleChange}>
        <option value="unassigned">Unassigned</option>
        <option value="assigned">Assigned</option>
        <option value="working">Working</option>
        <option value="resolved">Resolved</option>
      </select>

      <label>Keyword</label>
      <input name="keyword" onChange={handleChange} className="border p-1" />

      <label>Date Range</label>
      <input type="date" name="start_date" onChange={handleChange} />
      <input type="date" name="end_date" onChange={handleChange} />
    </div>
  );
}
