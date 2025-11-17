import React from 'react';
import './dashboard.css';

const TkDashboard: React.FC = () => {
  return (
    <div className="tk-dashboard">
      {/* Top banner */}
      <section className="tk-hero">
        <h2>Access granted — powered by Crowbar Membership</h2>
        <p>
          This preview shows how TalentKonnect will connect employers, candidates,
          and messages. All access comes from your Crowbar membership.
        </p>
      </section>

      <div className="tk-grid">
        {/* Post Job (placeholder) */}
        <div className="tk-card">
          <h3>Post a Job</h3>
          <p className="tk-card-sub">Employer-side view (placeholder only)</p>

          <div className="tk-form">
            <label>
              Job title
              <input
                type="text"
                placeholder="e.g. Junior Frontend Developer"
                disabled
              />
            </label>
            <label>
              Location
              <input type="text" placeholder="Remote / Bangalore" disabled />
            </label>
            <label>
              Salary / credits
              <input type="text" placeholder="₹ / credits" disabled />
            </label>
            <label>
              Short description
              <textarea
                rows={3}
                placeholder="Describe the role, stack and expectations…"
                disabled
              />
            </label>

            <button className="tk-btn tk-btn-disabled" disabled>
              Post Job (Crowbar-locked)
            </button>

            <p className="tk-help">
              This form is a UI preview. Actual posting will be enabled once
              TalentKonnect is wired to production Crowbar accounts.
            </p>
          </div>
        </div>

        {/* Apply to Job (placeholder) */}
        <div className="tk-card">
          <h3>Apply to a Job</h3>
          <p className="tk-card-sub">
            Candidate-side view with sample listings (Apply disabled)
          </p>

          <ul className="tk-job-list">
            <li className="tk-job">
              <div>
                <div className="tk-job-title">Junior Data Analyst</div>
                <div className="tk-job-meta">
                  Remote · Entry level · 40 credits
                </div>
              </div>
              <button className="tk-btn tk-btn-outline" disabled>
                Apply (demo)
              </button>
            </li>

            <li className="tk-job">
              <div>
                <div className="tk-job-title">Marketing Intern</div>
                <div className="tk-job-meta">
                  Hybrid · 3 months · 25 credits + stipend
                </div>
              </div>
              <button className="tk-btn tk-btn-outline" disabled>
                Apply (demo)
              </button>
            </li>

            <li className="tk-job">
              <div>
                <div className="tk-job-title">Customer Support Associate</div>
                <div className="tk-job-meta">
                  Night shift · 60 credits
                </div>
              </div>
              <button className="tk-btn tk-btn-outline" disabled>
                Apply (demo)
              </button>
            </li>
          </ul>

          <p className="tk-help">
            These are sample jobs only. On Day-1 we are just demonstrating how
            Crowbar membership will unlock real roles inside TalentKonnect.
          </p>
        </div>

        {/* Messaging (placeholder) */}
        <div className="tk-card tk-messages">
          <h3>Messaging</h3>
          <p className="tk-card-sub">
            Employer ↔ candidate chat (preview, input disabled)
          </p>

          <div className="tk-chat-window">
            <div className="tk-chat-bubble tk-chat-bubble-employer">
              Hi, thanks for applying! Can you share a quick summary of your
              experience with React & TypeScript?
            </div>
            <div className="tk-chat-bubble tk-chat-bubble-candidate">
              Sure — I&apos;ve built 3 small projects and I&apos;m comfortable
              with hooks, routing and basic state management.
            </div>
            <div className="tk-chat-bubble tk-chat-bubble-employer">
              Great. Our team will review your Crowbar profile and get back to
              you soon.
            </div>
          </div>

          <div className="tk-chat-input">
            <input
              type="text"
              placeholder="Messaging will be activated post-launch…"
              disabled
            />
            <button className="tk-btn tk-btn-disabled" disabled>
              Send
            </button>
          </div>

          <p className="tk-help">
            Messaging is a read-only mock. In production, conversations will be
            tied to verified Crowbar identities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TkDashboard;
