# Energy AI Monitoring Dashboard with n8n Integration

A comprehensive energy monitoring system that combines real-time dashboard visualization with AI-powered automated ticket generation and alerting through n8n workflows.

![Dashboard Status](https://img.shields.io/badge/status-active-success)
![n8n Integration](https://img.shields.io/badge/n8n-integrated-blue)
![AI Powered](https://img.shields.io/badge/AI-OpenAI-purple)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [n8n Workflow Setup](#n8n-workflow-setup)
- [Usage](#usage)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

This system monitors energy consumption from multiple equipment sources (MFM 1, MFM 2) and automatically:
- Detects threshold breaches (>17 kWh)
- Generates AI-powered tickets with detailed analysis
- Sends email notifications
- Displays real-time visualizations on a React dashboard
- Enhances manually raised tickets with AI suggestions

## ✨ Features

### Dashboard Features
- **Real-time Energy Monitoring**: Live consumption graphs and statistics
- **AI Ticket Feed**: Real-time display of automated and manual tickets
- **Interactive Charts**: Area charts with statistics overlay
- **Consumption Analysis**: Actual vs. Predicted comparison
- **Manual Ticket Raising**: User-friendly form for creating tickets
- **Socket.IO Integration**: Real-time updates without page refresh

### n8n Automation Features
- **Automated Threshold Detection**: Monitors consumption every 5 minutes
- **AI Ticket Generation**: OpenAI generates professional ticket descriptions
- **Email Notifications**: Automatic alerts sent to configured email
- **Manual Ticket Enhancement**: AI analyzes and improves user-submitted tickets
- **Dual Workflow System**: Separate flows for automated and manual tickets

## 🏗️ Architecture

```
┌─────────────────┐
│  React Dashboard│
│   (Port 5174)   │
└────────┬────────┘
         │
    ┌────▼────┐
    │Socket.IO│
    └────┬────┘
         │
┌────────▼────────┐      ┌──────────────┐
│  Express Server │◄────►│     n8n      │
│   (Port 3000)   │      │  (Port 5678) │
└────────┬────────┘      └──────┬───────┘
         │                      │
         │                 ┌────▼────┐
    ┌────▼────┐           │ OpenAI  │
    │  Excel  │           │   API   │
    │  Data   │           └─────────┘
    └─────────┘
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **n8n** (installed globally or locally)
- **OpenAI API Key** (for AI ticket generation)
- **SMTP Email Account** (for sending notifications)

### Required Accounts
1. OpenAI account with API access
2. Email account with SMTP credentials (Gmail, Outlook, etc.)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd "dashboard for n8n"
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### 4. Install n8n (if not already installed)

```bash
npm install -g n8n
```

## ⚙️ Configuration

### 1. Server Configuration

Edit `server/config.js`:

```javascript
module.exports = {
    n8n: {
        baseUrl: 'http://localhost:5678',  // Your n8n instance URL
        webhooks: {
            energyAlert: '/webhook/energy-alert',
            ticketSubmit: '/webhook/ticket-submit',
            dataSync: '/webhook/data-sync'
        }
    },
    server: {
        port: 3000,  // Dashboard backend port
        webhookCallbackUrl: 'http://localhost:3000/webhook'
    }
};
```

### 2. Environment Variables (Optional)

Create a `.env` file in the server directory:

```env
PORT=3000
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_URL=http://localhost:5678/webhook/energy-data
DASHBOARD_API_URL=http://localhost:3000/api/energy/hourly
```

### 3. n8n Credentials Setup

You'll need to configure these credentials in n8n:

#### OpenAI API Credentials
1. Go to n8n → Settings → Credentials
2. Add new credential → OpenAI
3. Enter your OpenAI API key
4. Name it "OpenAi account"

#### SMTP Email Credentials
1. Go to n8n → Settings → Credentials
2. Add new credential → SMTP
3. Configure with your email settings:
   - **Gmail Example**:
     - Host: `smtp.gmail.com`
     - Port: `587`
     - User: `your-email@gmail.com`
     - Password: Your app-specific password
   - Name it "SMTP account"

## 🎮 Running the Application

### Method 1: Run All Services

Open **3 separate terminal windows**:

#### Terminal 1: Start n8n
```bash
cd "dashboard for n8n"
npx n8n start --tunnel
```

#### Terminal 2: Start Server
```bash
cd "dashboard for n8n/server"
node index.js
```

#### Terminal 3: Start Client
```bash
cd "dashboard for n8n/client"
npm run dev
```

### Method 2: Start Automated Data Sender (Optional)

Open a **4th terminal**:

```bash
cd "dashboard for n8n/server"
node dummy-data-sender.js --auto
```

This sends energy data every 5 minutes to both the dashboard and n8n.

## 🔧 n8n Workflow Setup

### Import the Complete Workflow

1. **Open n8n**: Navigate to `http://localhost:5678`

2. **Create New Workflow**: Click "Create workflow"

3. **Import Workflow**:
   - Click the "..." menu (three dots, top right)
   - Select "Import from file..."
   - Browse to `C:\dashboard for n8n`
   - Select `n8n-complete-workflow.json`
   - Click "Open"

4. **Activate Workflow**:
   - Click the "Active" toggle (top right)
   - Ensure it turns green/ON

5. **Verify Webhooks**:
   After activation, you should have two active webhooks:
   - `/webhook/energy-data` - Automated energy monitoring
   - `/webhook/ticket-submit` - Manual ticket processing

### Workflow Components

The complete workflow includes:

#### Automated Energy Flow
```
Receive Energy Data → Check Threshold → AI Generate Ticket → Email + Dashboard
```

#### Manual Ticket Flow
```
Receive Manual Ticket → AI Enhance → Email + Dashboard
```

## 📱 Usage

### Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5174
```

### Dashboard Sections

1. **Overview Tab**:
   - Total Consumption metrics
   - Peak Demand statistics
   - Morning/Evening load breakdown
   - Consumption Profile chart
   - AI Ticket Feed (real-time)

2. **Tickets & AI Tab**:
   - Manual ticket raising form
   - Recent tickets list
   - AI-enhanced ticket details

### Raising a Manual Ticket

1. Go to "Tickets & AI" tab
2. Fill in the form:
   - **Subject**: Brief summary of the issue
   - **Priority**: Low/Medium/High
   - **Description**: Detailed description
3. Click "Submit Ticket"
4. AI will enhance your ticket and send notifications
5. Enhanced ticket appears in the list

### Viewing AI Tickets

- **Live Feed**: Scroll to bottom of Overview page
- **Ticket List**: Go to Tickets & AI tab
- Tickets show:
  - Equipment information
  - Consumption data
  - AI-generated analysis
  - Priority level
  - Timestamp

## 🧪 Testing

### Test Automated Threshold Detection

#### Force a Breach (Testing)
```bash
cd "dashboard for n8n/server"
node dummy-data-sender.js --breach
```

This sends high consumption data (>17 kWh) and triggers:
- ✅ AI ticket generation in n8n
- ✅ Email notification
- ✅ Ticket appears on dashboard

#### Expected Result
- Email received at configured address
- Ticket appears in "AI Ticket Feed"
- Ticket details show consumption >17 kWh

### Test Manual Ticket Processing

1. Open dashboard at `http://localhost:5174`
2. Navigate to "Tickets & AI" tab
3. Submit a test ticket:
   ```
   Subject: Test API Connection
   Priority: Medium
   Description: Testing the manual ticket enhancement feature
   ```
4. Check results:
   - ✅ Ticket enhanced with AI suggestions
   - ✅ Email notification sent
   - ✅ Ticket appears in list with "AI Enhanced" badge

### Test Data Sender

#### Send Single Data Packet
```bash
node dummy-data-sender.js
```

#### Start Continuous Sending (5-minute interval)
```bash
node dummy-data-sender.js --auto
```

#### Force Threshold Breach
```bash
node dummy-data-sender.js --breach
```

## 📁 Project Structure

```
dashboard for n8n/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── EnergyDashboard.jsx  # Main dashboard
│   │   │   ├── TicketSystem.jsx     # Ticket management
│   │   │   ├── TicketFeed.jsx       # Live AI tickets
│   │   │   ├── ConsumptionGraph.jsx # Area chart
│   │   │   └── ...
│   │   ├── api.js                   # API calls
│   │   └── App.jsx                  # Main app component
│   ├── tor_dashboard.css            # Tor.ai Shield theme
│   └── package.json
│
├── server/                          # Express backend
│   ├── index.js                     # Main server file
│   ├── config.js                    # Configuration
│   ├── dataService.js               # Data processing
│   ├── dummy-data-sender.js         # Test data generator
│   └── data/
│       └── *.xlsx                   # Historical data files
│
├── n8n-complete-workflow.json       # Complete n8n workflow
├── n8n-manual-ticket-workflow.json  # Manual ticket workflow (standalone)
├── n8n-user-workflow.json           # Energy monitoring workflow (standalone)
├── MANUAL_TICKET_INTEGRATION.md     # Manual ticket setup guide
└── README.md                        # This file
```

## 🔍 Troubleshooting

### Dashboard Not Loading

**Problem**: Blank screen when accessing `http://localhost:5174`

**Solution**:
```bash
cd "dashboard for n8n/client"
npm install
npm run dev
```

### n8n Workflow Not Triggering

**Problem**: No tickets generated despite data being sent

**Solution**:
1. Check n8n is running: `http://localhost:5678`
2. Verify workflow is "Active" (green toggle)
3. Check webhook URLs match in `server/config.js`
4. Test webhooks manually:
   ```bash
   curl -X POST http://localhost:5678/webhook/energy-data \
        -H "Content-Type: application/json" \
        -d '{"equipment":"Test","consumption":25,"timestamp":"2026-01-07T12:00:00Z"}'
   ```

### No Email Received

**Problem**: Tickets generated but no email

**Solution**:
1. Verify SMTP credentials in n8n
2. Check spam/junk folder
3. Test SMTP settings in n8n workflow
4. Check n8n execution logs for errors

### Server Port Already in Use

**Problem**: `EADDRINUSE` error when starting server

**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>

# Restart server
node index.js
```

### Chart Not Visible

**Problem**: Consumption Profile chart is blank

**Solution**:
1. Check server is sending data: `http://localhost:3000/api/energy/hourly`
2. Verify data format in browser console
3. Ensure `recharts` is installed:
   ```bash
   cd client
   npm install recharts
   ```

### OpenAI API Errors

**Problem**: AI ticket generation fails

**Solution**:
1. Verify OpenAI API key is valid
2. Check API quota/billing in OpenAI dashboard
3. View n8n execution logs for specific error
4. Ensure OpenAI credentials are correctly configured in n8n

## 🎯 Key Features Configuration

### Adjust Threshold Limits

Edit the threshold values in `n8n-complete-workflow.json`:
```javascript
const THRESHOLD_MIN = 10;  // Minimum kWh
const THRESHOLD_MAX = 17;  // Maximum kWh (breach triggers alert)
```

### Change Data Send Interval

Edit `server/dummy-data-sender.js`:
```javascript
const SEND_INTERVAL = 300000; // 5 minutes (in milliseconds)
```

### Configure Email Recipients

Edit the n8n workflow nodes:
- "Send Warning Email" node: Change `toEmail` field
- "Send Manual Ticket Email" node: Change `toEmail` field

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- n8n for the automation platform
- OpenAI for AI-powered ticket generation
- Recharts for data visualization
- Socket.IO for real-time updates

## 📞 Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review n8n execution logs
3. Check browser console for frontend errors
4. Review server logs for backend errors

---
