import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, MapPin, Building, Briefcase, IndianRupee, ClipboardList, Save, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Profile.css';

const Profile = ({ user, setUser }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.borrowerDetails?.address || '',
        businessName: user?.borrowerDetails?.businessName || '',
        businessType: user?.borrowerDetails?.businessType || '',
        annualIncome: user?.borrowerDetails?.annualIncome || '',
        utilizationPlan: user?.borrowerDetails?.utilizationPlan || '',
        preferredVendor: user?.borrowerDetails?.preferredVendor || ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: formData.name,
                phone: formData.phone,
                borrowerDetails: {
                    address: formData.address,
                    businessName: formData.businessName,
                    businessType: formData.businessType,
                    annualIncome: Number(formData.annualIncome),
                    utilizationPlan: formData.utilizationPlan,
                    preferredVendor: formData.preferredVendor
                }
            };

            const { data } = await axios.put('/api/auth/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Update profile error details:', error.response?.data || error.message);
            showToast(error.response?.data?.message || 'Failed to update profile. Please check your connection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1 className="gradient-text">My Profile</h1>
                <p className="subtitle">Manage your personal and business details for loan utilization tracking.</p>
            </div>

            <form onSubmit={handleSubmit} className="profile-form-wrapper">
                {/* Personal Information Section */}
                <div className="profile-section card glass">
                    <div className="section-title">
                        <User size={20} />
                        <h3>Personal Information</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label><User size={14} /> Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><Mail size={14} /> Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="disabled-input"
                            />
                        </div>
                        <div className="form-group">
                            <label><Phone size={14} /> Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                            />
                        </div>
                        <div className="form-group">
                            <label><MapPin size={14} /> Residential Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Street, City, Pincode"
                            />
                        </div>
                    </div>
                </div>

                {/* Business & Utilization Details Section */}
                <div className="profile-section card glass">
                    <div className="section-title">
                        <Building size={20} />
                        <h3>Borrower & Utilization Details</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label><Building size={14} /> Business Name</label>
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="Official Business/Entity Name"
                            />
                        </div>
                        <div className="form-group">
                            <label><Briefcase size={14} /> Business Type</label>
                            <input
                                type="text"
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleChange}
                                placeholder="e.g. Retail, Tech, Manufacturing"
                            />
                        </div>
                        <div className="form-group">
                            <label><IndianRupee size={14} /> Annual Income (₹)</label>
                            <input
                                type="number"
                                name="annualIncome"
                                value={formData.annualIncome}
                                onChange={handleChange}
                                placeholder="Enter annual income"
                            />
                        </div>
                        <div className="form-group">
                            <label><ClipboardList size={14} /> Preferred Vendor</label>
                            <input
                                type="text"
                                name="preferredVendor"
                                value={formData.preferredVendor}
                                onChange={handleChange}
                                placeholder="Name of vendor you usually work with"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label><ClipboardList size={14} /> Loan Utilization Plan</label>
                            <textarea
                                name="utilizationPlan"
                                value={formData.utilizationPlan}
                                onChange={handleChange}
                                placeholder="Briefly describe how you plan to utilize the loan funds..."
                                rows="4"
                            />
                        </div>
                    </div>
                </div>

                <div className="profile-actions">
                    <button type="submit" className="btn-primary save-btn" disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
