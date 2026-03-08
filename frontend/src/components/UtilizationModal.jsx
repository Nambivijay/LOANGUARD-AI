import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, CheckCircle } from 'lucide-react';

const UtilizationModal = ({ isOpen, onClose, loanId, onRefresh }) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('');

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get('http://127.0.0.1:5001/api/auth/vendors', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVendors(data);
            } catch (error) {
                console.error('Error fetching vendors:', error);
            }
        };
        if (isOpen) fetchVendors();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('loanId', loanId);
            formData.append('amount', amount);
            formData.append('category', category);
            formData.append('description', description);
            if (selectedVendor) formData.append('vendorId', selectedVendor);
            if (file) formData.append('proofImage', file);

            await axios.post('http://127.0.0.1:5001/api/loans/utilization', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess(true);
            setTimeout(() => {
                onRefresh();
                onClose();
                setSuccess(false);
                setAmount('');
                setCategory('');
                setDescription('');
                setSelectedVendor('');
                setFile(null);
            }, 1500);
        } catch (error) {
            alert('Error uploading bill: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                {success ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <h2 className="gradient-text">Bill Uploaded!</h2>
                        <p style={{ color: 'var(--text-muted)' }}>The utilization record has been created.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Upload Bill / Invoice</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Amount (₹)</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ width: '100%' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} required>
                                    <option value="">Select Category</option>
                                    <option value="Raw Materials">Raw Materials</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Logistics">Logistics</option>
                                    <option value="Services">Services</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Select Vendor</label>
                                <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} required>
                                    <option value="">Choose a Vendor</option>
                                    {vendors.map(v => (
                                        <option key={v._id} value={v._id}>{v.name} ({v.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of the expense" style={{ width: '100%', minHeight: '80px', padding: '12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Upload Proof (Image/PDF)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                                        required
                                    />
                                    <div style={{ padding: '15px', border: '2px dashed #334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: file ? '#10b981' : 'var(--text-muted)' }}>
                                        <Upload size={18} />
                                        {file ? file.name : "Click to select file"}
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
                                {loading ? 'Uploading...' : 'Submit Utilization'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default UtilizationModal;
