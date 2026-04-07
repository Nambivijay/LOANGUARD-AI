Loan Management System with Redeem Feature
Project Overview

Loan Management System is a web-based application that helps users track their loans, make repayments, and manage rewards points.
This system includes a Redeem feature, allowing users to redeem collected points for benefits like EMI reduction, gift cards, or cashback.

Features
User Features
View loan details and repayment schedule
Track points earned through timely repayments
Redeem points for rewards:
EMI Reduction
Gift Cards
Cashback
View redeem history with status updates
Receive notifications for redeem approvals
Admin Features
Manage users and their loans
Set redeem rules and reward points
Approve or reject redeem requests
View all users’ redeem activities
Redeem Feature Details
Point System: 1 point = ₹1 benefit
Rewards & Points Required:
EMI Reduction: 1 EMI = 500 points
₹100 Gift Card = 150 points
₹50 Cashback = 75 points
Rules:
Minimum 100 points required for redemption
One redemption per reward type per month
Status: Pending → Approved → Completed
Notifications: Users receive notifications for redeem approval or completion
APIs
User APIs
Get Current Points:
GET /api/user/:id/points
Response: { user_id, total_points }
Redeem Request:
POST /api/user/:id/redeem
Body: { reward_type, points_used }
Response: { status: "Pending", redeem_id }
Redeem History:
GET /api/user/:id/redeem-history
Response: [ { reward_type, points_used, status, date } ]
Admin APIs
Approve/Reject Redeem:
PATCH /api/admin/redeem/:redeem_id
Body: { status: "Approved" or "Rejected" }
Installation & Setup

Clone the repository:

git clone <repo_url>

Install dependencies:

npm install
Configure .env file for database credentials

Run server:

npm start
Access application at http://localhost:3000
Technologies Used
Frontend: HTML, CSS, Tailwind CSS, JavaScript
Backend: Node.js, Express.js
Database: MongoDB
Tools: VSCode, Postman
Benefits
Encourages timely repayment through rewards
Engages users with redeemable points system
Simple admin management for reward approvals
Transparent tracking of redeem history
