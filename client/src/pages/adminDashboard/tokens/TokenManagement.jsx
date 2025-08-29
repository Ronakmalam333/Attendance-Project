import React, { useState, useEffect } from 'react';
import axios from '../../../tokenManager';
import './tokenManagement.css';

function TokenManagement() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    token: '',
    faculty: '',
    validFrom: '',
    duration: '1',
    maxUsage: 100
  });

  const subjects = {
    'Computer Science': ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering'],
    'Information Technology': ['Web Development', 'Mobile App Development', 'Cybersecurity', 'Cloud Computing', 'AI/ML', 'Data Analytics'],
    'Electronics': ['Digital Electronics', 'Microprocessors', 'VLSI Design', 'Signal Processing', 'Communication Systems', 'Control Systems'],
    'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing', 'CAD/CAM', 'Robotics'],
    'Civil': ['Structural Engineering', 'Geotechnical Engineering', 'Transportation', 'Environmental Engineering', 'Construction Management', 'Surveying']
  };

  const durationOptions = [
    { value: '0.5', label: '30 minutes' },
    { value: '1', label: '1 hour' },
    { value: '1.5', label: '1.5 hours' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' }
  ];

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await axios.get('/tokens');
      setTokens(response.data);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 4; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, token }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validFrom = new Date(formData.validFrom);
    const validUntil = new Date(validFrom.getTime() + (parseFloat(formData.duration) * 60 * 60 * 1000));
    
    const submitData = {
      ...formData,
      validUntil: validUntil.toISOString()
    };
    
    try {
      if (editingToken) {
        await axios.put(`/tokens/${editingToken._id}`, submitData);
        alert('Token updated successfully!');
      } else {
        await axios.post('/tokens', submitData);
        alert('Token created successfully!');
      }
      resetForm();
      fetchTokens();
    } catch (error) {
      const message = error.response?.data?.message || 'Error saving token';
      alert(message);
    }
  };

  const handleEdit = (token) => {
    const validFrom = new Date(token.validFrom);
    const validUntil = new Date(token.validUntil);
    const duration = ((validUntil - validFrom) / (1000 * 60 * 60)).toString();
    
    setEditingToken(token);
    setFormData({
      subject: token.subject,
      token: token.token,
      faculty: token.faculty,
      validFrom: validFrom.toLocaleDateString("en-GB"),
      duration: duration,
      maxUsage: token.maxUsage
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this token?')) {
      try {
        await axios.delete(`/tokens/${id}`);
        alert('Token deleted successfully!');
        fetchTokens();
      } catch (error) {
        alert('Error deleting token');
      }
    }
  };

  const toggleActive = async (token) => {
    try {
      await axios.put(`/tokens/${token._id}`, { isActive: !token.isActive });
      fetchTokens();
    } catch (error) {
      alert('Error updating token status');
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      token: '',
      faculty: '',
      validFrom: '',
      duration: '1',
      maxUsage: 100
    });
    setEditingToken(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Loading tokens...</div>;

  return (
    <div className="token-management">
      <div className="header">
        <h1>Token Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Token'}
        </button>
      </div>

      {showForm && (
        <form className="token-form" onSubmit={handleSubmit}>
          <h2>{editingToken ? 'Edit Token' : 'Create New Token'}</h2>
          
          <div className="form-group">
            <label>Faculty:</label>
            <select
              value={formData.faculty}
              onChange={(e) => setFormData(prev => ({ ...prev, faculty: e.target.value, subject: '' }))}
              required
            >
              <option value="">Select Faculty</option>
              {Object.keys(subjects).map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject:</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
              disabled={!formData.faculty}
            >
              <option value="">Select Subject</option>
              {formData.faculty && subjects[formData.faculty].map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Token:</label>
            <div className="token-input-group">
              <input
                type="text"
                value={formData.token}
                onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                maxLength="4"
                required
              />
              <button type="button" onClick={generateToken} className="btn-generate">
                Generate
              </button>
            </div>
          </div>



          <div className="form-row">
            <div className="form-group">
              <label>Valid From:</label>
              <input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration:</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                required
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Max Usage:</label>
            <input
              type="number"
              value={formData.maxUsage}
              onChange={(e) => setFormData(prev => ({ ...prev, maxUsage: parseInt(e.target.value) }))}
              min="1"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingToken ? 'Update' : 'Create'} Token
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="tokens-table">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Token</th>
              <th>Faculty</th>
              <th>Valid From</th>
              <th>Valid Until</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(token => (
              <tr key={token._id} className={!token.isActive ? 'inactive' : ''}>
                <td>{token.subject}</td>
                <td className="token-code">{token.token}</td>
                <td>{token.faculty}</td>
                <td>{new Date(token.validFrom).toLocaleString()}</td>
                <td>{new Date(token.validUntil).toLocaleString()}</td>
                <td>{token.currentUsage}/{token.maxUsage}</td>
                <td>
                  <span className={`status ${token.isActive ? 'active' : 'inactive'}`}>
                    {token.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button onClick={() => handleEdit(token)} className="btn-edit">
                    Edit
                  </button>
                  <button 
                    onClick={() => toggleActive(token)} 
                    className={`btn-toggle ${token.isActive ? 'deactivate' : 'activate'}`}
                  >
                    {token.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(token._id)} className="btn-delete">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {tokens.length === 0 && (
          <div className="no-tokens">No tokens found. Create your first token!</div>
        )}
      </div>
    </div>
  );
}

export default TokenManagement;