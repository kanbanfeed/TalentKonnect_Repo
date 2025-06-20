// src/components/OnboardingForm.jsx
import React, { useState } from 'react';
import '../App.css';
import { createUser, grantCredit } from '../utils/api';

const OnboardingForm = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    category: '',
    tip: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.category || !form.tip) {
      alert('All fields are required!');
      return;
    }
    setLoading(true);
    await createUser(form);
    await grantCredit();
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="form-container">
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <h1>Share Your Tip</h1>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
          <input name="phone" placeholder="WhatsApp / Phone" value={form.phone} onChange={handleChange} />
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">Select Category</option>
            <option>Cooking Hack</option>
            <option>Study Tip</option>
            <option>Repair Trick</option>
          </select>
          <input name="tip" placeholder="Your Tip" value={form.tip} onChange={handleChange} />
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Tip'}
          </button>
        </form>
      ) : (
        <div className="confirmation">
          <div className="credit-popup">+1 Credit!</div>
          <button onClick={() => alert('Redirect to Dashboard')}>Go to Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default OnboardingForm;
