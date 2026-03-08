import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const calculateEMI = (amount, annualRate, months) => {
    const P = Number(amount);
    const R = (Number(annualRate) || 12) / 12 / 100;
    const N = Number(months);
    if (!P || !R || !N) return 0;
    const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return Math.round(emi);
};

const LoanApplication = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        amount: '',
        purpose: '',
        interestRate: 12, // Default annual rate
        tenureMonths: 12, // Default tenure
        personalDetails: {
            fullName: '',
            address: '',
            phone: '',
            dob: ''
        },
        employmentDetails: {
            occupation: '',
            monthlyIncome: '',
            employerName: ''
        },
        bankDetails: {
            accountNumber: '',
            bankName: '',
            ifscCode: ''
        }
    });

    const [files, setFiles] = useState({
        idProof: null,
        bankStatement: null
    });
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
        setIsVerified(false); // Reset verification if files change
    };

    const handleVerify = async () => {
        if (!files.idProof || !files.bankStatement) {
            showToast('Please upload all required files first.', 'error');
            return;
        }

        setIsVerifying(true);
        const data = new FormData();
        data.append('idProof', files.idProof);
        data.append('bankStatement', files.bankStatement);

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5001/api/loans/verify-files', data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            showToast('Files successfully verified', 'success');
            setIsVerified(true);
        } catch (error) {
            console.error('Verification error details:', error.response?.data);
            const data = error.response?.data;
            let message = data?.message || 'Verification failed. Please check your files.';

            if (data?.errors && data.errors.length > 0) {
                message += ' ' + data.errors.join(' ');
            }

            showToast(message, 'error');
            setIsVerified(false);
        } finally {
            setIsVerifying(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation check
        const { personalDetails, employmentDetails, bankDetails, amount, purpose } = formData;
        if (!amount || !purpose ||
            !personalDetails.fullName || !personalDetails.address || !personalDetails.phone || !personalDetails.dob ||
            !employmentDetails.occupation || !employmentDetails.monthlyIncome || !employmentDetails.employerName ||
            !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
            showToast('Please fill in all required fields across all steps.', 'error');
            return;
        }

        const data = new FormData();
        data.append('amount', String(formData.amount));
        data.append('purpose', String(formData.purpose));
        data.append('interestRate', String(formData.interestRate));
        data.append('personalDetails', JSON.stringify(formData.personalDetails));
        data.append('employmentDetails', JSON.stringify(formData.employmentDetails));
        data.append('bankDetails', JSON.stringify(formData.bankDetails));
        data.append('tenureMonths', String(formData.tenureMonths));

        if (files.idProof) data.append('idProof', files.idProof);
        if (files.bankStatement) data.append('bankStatement', files.bankStatement);

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5001/api/loans', data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            alert('Loan application submitted successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit application: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="loan-application-container">
            <h1>Apply for a Loan</h1>
            <form onSubmit={handleSubmit} className="loan-form">
                {step === 1 && (
                    <div className="form-step">
                        <h2>Step 1: Personal Details</h2>
                        <input type="text" name="personalDetails.fullName" placeholder="Full Name" value={formData.personalDetails.fullName} onChange={handleChange} required />
                        <input type="text" name="personalDetails.address" placeholder="Address" value={formData.personalDetails.address} onChange={handleChange} required />
                        <input type="text" name="personalDetails.phone" placeholder="Phone Number" value={formData.personalDetails.phone} onChange={handleChange} required />
                        <label>Date of Birth</label>
                        <input type="date" name="personalDetails.dob" value={formData.personalDetails.dob} onChange={handleChange} required />
                        <button type="button" onClick={nextStep}>Next</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-step">
                        <h2>Step 2: Employment & Income</h2>
                        <input type="text" name="employmentDetails.occupation" placeholder="Occupation" value={formData.employmentDetails.occupation} onChange={handleChange} required />
                        <input type="number" name="employmentDetails.monthlyIncome" placeholder="Monthly Income" value={formData.employmentDetails.monthlyIncome} onChange={handleChange} required />
                        <input type="text" name="employmentDetails.employerName" placeholder="Employer Name" value={formData.employmentDetails.employerName} onChange={handleChange} required />
                        <div className="button-group">
                            <button type="button" onClick={prevStep}>Back</button>
                            <button type="button" onClick={nextStep}>Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="form-step">
                        <h2>Step 3: Loan & Bank Details</h2>
                        <input type="number" name="amount" placeholder="Loan Amount (₹)" value={formData.amount} onChange={handleChange} required />
                        <input type="text" name="purpose" placeholder="Loan Purpose" value={formData.purpose} onChange={handleChange} required />
                        <h3>Bank Details</h3>
                        <input type="text" name="bankDetails.bankName" placeholder="Bank Name" value={formData.bankDetails.bankName} onChange={handleChange} required />
                        <input type="text" name="bankDetails.accountNumber" placeholder="Account Number" value={formData.bankDetails.accountNumber} onChange={handleChange} required />
                        <input type="text" name="bankDetails.ifscCode" placeholder="IFSC Code" value={formData.bankDetails.ifscCode} onChange={handleChange} required />

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 600 }}>Interest Rate (% Annual)</label>
                            <input type="number" name="interestRate" placeholder="Interest Rate (%)" value={formData.interestRate} onChange={handleChange} required />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 600 }}>Tenure (Months)</label>
                            <select name="tenureMonths" value={formData.tenureMonths} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <option value={12}>12 Months</option>
                                <option value={24}>24 Months</option>
                                <option value={36}>36 Months</option>
                                <option value={48}>48 Months</option>
                                <option value={60}>60 Months</option>
                            </select>
                        </div>

                        {formData.amount && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    marginTop: '2rem',
                                    padding: '1.5rem',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    textAlign: 'center',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Estimated Monthly EMI</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8' }}>
                                    ₹{calculateEMI(formData.amount, formData.interestRate, formData.tenureMonths).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                    Formula: [P × R × (1+R)^N] / [(1+R)^N - 1]
                                </div>
                            </motion.div>
                        )}
                        <div className="button-group">
                            <button type="button" onClick={prevStep}>Back</button>
                            <button type="button" onClick={nextStep}>Next</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="form-step">
                        <h2>Step 4: Upload Documents</h2>
                        <div className="file-input">
                            <label>ID Proof (Aadhar/PAN)</label>
                            <input type="file" name="idProof" onChange={handleFileChange} required />
                        </div>
                        <div className="file-input">
                            <label>Bank Statement</label>
                            <input type="file" name="bankStatement" onChange={handleFileChange} required />
                        </div>
                        <div className="button-group">
                            <button type="button" onClick={prevStep}>Back</button>
                            {!isVerified ? (
                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={isVerifying}
                                    style={{ background: '#059669' }}
                                >
                                    {isVerifying ? 'Verifying...' : 'Verify Documents'}
                                </button>
                            ) : (
                                <button type="submit">Submit Application</button>
                            )}
                        </div>
                    </div>
                )}
            </form>
            <style jsx>{`
                .loan-application-container {
                    max-width: 650px;
                    margin: 4rem auto;
                    padding: 3rem;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    border: 1px solid rgba(255,255,255,0.3);
                }
                h1 { 
                    font-size: 2.2rem;
                    color: #1e293b; 
                    text-align: center; 
                    margin-bottom: 2rem;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                }
                h2 { 
                    font-size: 1.4rem;
                    color: #334155; 
                    margin-bottom: 1.5rem; 
                    text-align: left;
                    font-weight: 600;
                    border-left: 4px solid #2563eb;
                    padding-left: 12px;
                }
                h3 {
                    font-size: 1.1rem;
                    color: #475569;
                    margin: 1.5rem 0 1rem;
                    font-weight: 600;
                }
                .loan-form { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 1.25rem; 
                }
                .form-step {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                label {
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #475569;
                    margin-bottom: -0.5rem;
                }
                input { 
                    padding: 0.9rem 1.2rem; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 10px; 
                    width: 100%; 
                    box-sizing: border-box; 
                    font-size: 1rem;
                    transition: all 0.2s;
                    background: #fff;
                    color: #1e293b;
                }
                input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
                    transform: translateY(-1px);
                }
                .button-group { 
                    display: flex; 
                    gap: 1rem; 
                    justify-content: flex-end; 
                    margin-top: 2rem; 
                }
                button {
                    padding: 0.9rem 2rem;
                    border: none;
                    border-radius: 10px;
                    background: #2563eb;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                }
                button:hover { 
                    background: #1d4ed8; 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
                }
                button:active { transform: translateY(0); }
                button[type="button"]:first-child { 
                    background: #f1f5f9; 
                    color: #475569;
                    box-shadow: none;
                }
                button[type="button"]:first-child:hover {
                    background: #e2e8f0;
                }
                .file-input { 
                    background: #f8fafc;
                    padding: 1.25rem;
                    border-radius: 12px;
                    border: 2px dashed #e2e8f0;
                    transition: border-color 0.2s;
                }
                .file-input:hover {
                    border-color: #cbd5e1;
                }
                .file-input label { 
                    margin-bottom: 0.75rem; 
                    color: #334155;
                }
                .file-input input[type="file"] {
                    padding: 0.5rem 0;
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default LoanApplication;
