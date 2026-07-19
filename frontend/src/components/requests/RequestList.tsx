<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Reimbursement System - My Travel Requests</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>

    <div class="dashboard-container">
        
        <!-- SIDEBAR -->
        <aside class="sidebar">
            <div class="logo-area">
               <div class="logo-box">
    
    <img src="Screenshot (21).png" alt="EGAS Logo" class="sidebar-logo-img">
</div>
                <div>
                    <h3>Travel Reimbursement</h3>
                    <p>System</p>
                </div>
            </div>

            <nav class="nav-menu">
                <a href="#" class="nav-item"><i class="fa-solid fa-grip"></i> Dashboard</a>
                <a href="#" class="nav-item"><i class="fa-regular fa-paper-plane"></i> New Travel Request</a>
                <a href="#" class="nav-item active"><i class="fa-regular fa-file-lines"></i> My Requests</a>
                <a href="#" class="nav-item active"><i class="fa-regular fa-clock"></i> My Current Requests</a>
    <a href="#" class="nav-item"><i class="fa-regular fa-circle-check"></i> My Completed Requests</a>
    <a href="#" class="nav-item"><i class="fa-regular fa-circle-xmark"></i> My Cancelled Requests</a>
                <a href="#" class="nav-item"><i class="fa-solid fa-wallet"></i> Salary Preview</a>
                <a href="#" class="nav-item"><i class="fa-regular fa-user"></i> Profile</a>

                <nav class="nav-menu">
   
    <div class="admin-section">
        <div class="nav-section-title">DEPARTMENT WORKSPACE</div>
        <a href="#" class="nav-item"><i class="fa-solid fa-layer-group"></i> Requests Awaiting My Department</a>
        <a href="#" class="nav-item"><i class="fa-solid fa-screwdriver-wrench"></i> Department-Specific Actions</a>
        <a href="#" class="nav-item"><i class="fa-solid fa-clock-rotate-left"></i> Previously Processed Requests</a>
    </div>



                <div class="nav-section-title">HELP & SUPPORT</div>
                <a href="#" class="nav-item"><i class="fa-regular fa-circle-question"></i> User Guide</a>
                <a href="#" class="nav-item"><i class="fa-regular fa-comment-dots"></i> Contact Support</a>
            </nav>

            <!-- Purple Promo Card -->
            <div class="promo-card">
                <h4>Plan your trip seamlessly</h4>
                <p>Submit your travel request and get reimbursed easily.</p>
                <button class="btn-promo-new"><i class="fa-solid fa-plus"></i> New Travel Request</button>
            </div>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="main-content">
            <!-- Header -->
            <header class="main-header">
                <div class="header-title">
                    <div class="menu-toggle"><i class="fa-solid fa-bars"></i></div>
                    <div>
                        <h1>My Travel Requests</h1>
                        <p>Track and manage all your travel requests</p>
                    </div>
                </div>
                <div class="user-profile">
                    <div class="notifications">
                        <i class="fa-regular fa-bell"></i>
                        <span class="badge">3</span>
                    </div>
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" alt="Shahd" class="avatar">
                    <div class="user-info">
                        <span class="user-name">Shahd</span>
                        <span class="user-role">Employee</span>
                    </div>
                    <i class="fa-solid fa-chevron-down dropdown-arrow"></i>
                </div>
            </header>

            <!-- Status Tabs -->
            <div class="tabs-container">
                <button class="tab-btn active" data-filter="all">All Requests</button>
                <button class="tab-btn" data-filter="Draft">Drafts</button>
                <button class="tab-btn" data-filter="In Progress">In Progress</button>
                <button class="tab-btn" data-filter="Approved">Completed</button>
                <button class="tab-btn" data-filter="Rejected">Rejected</button>
            </div>

            <!-- Workspace View -->
            <div class="workspace">
                
                <!-- Table View -->
                <div class="table-section">
                    <div class="toolbar">
                        <div class="search-box">
                            <i class="fa-solid fa-search"></i>
                            <input type="text" id="tableSearch" placeholder="Search by Request ID or Destination...">
                        </div>
                        <select id="statusSelect" class="filter-dropdown">
                            <option value="all">All Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Draft">Draft</option>
                        </select>
                        <div class="date-picker-mock">
                            <i class="fa-regular fa-calendar"></i>
                            <span>Select Date Range</span>
                        </div>
                        <button class="btn-filter"><i class="fa-solid fa-sliders"></i> Filter</button>
                    </div>

                    <div class="table-responsive">
                        <table class="requests-table">
                            <thead>
                                <tr>
                                    <th>Request ID</th>
                                    <th>Destination</th>
                                    <th>Travel Dates</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="requestsTableBody">
                                <!-- Loaded via JS -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Footer Pagination -->
                    <div class="pagination-container">
                        <span id="showingText" class="showing-text">Showing 1 to 6 of 18 requests</span>
                        <div class="pagination">
                            <button class="page-nav"><i class="fa-solid fa-chevron-left"></i></button>
                            <button class="page-num active">1</button>
                            <button class="page-num">2</button>
                            <button class="page-num">3</button>
                            <button class="page-nav"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                        <div class="rows-per-page">
                            <span>Rows per page:</span>
                            <select id="rowsSelect">
                                <option value="6">6</option>
                                <option value="10">10</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- RIGHT DETAILS DRAWER -->
                <aside class="detail-panel" id="detailPanel">
                    <!-- Loaded dynamically via JS -->
                </aside>

            </div>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>






                const mockRequests = [
    {
        id: "TR-2024-0012",
        submittedDate: "10 May 2024",
        destination: "Cairo",
        country: "Egypt",
        duration: "3 Days (2 Nights)",
        travelDates: "15 May 2024 - 18 May 2024",
        status: "In Progress",
        statusSubtext: "Current Stage: PR Department",
        amount: "1,260.00 EGP",
        jobLevel: "Level 1",
        accommodation: "Accommodation Only",
        transportation: "Company Vehicle",
        timeline: [
            { title: "Employee Submission", date: "10 May 2024", status: "done" },
            { title: "Manager Review", date: "10 May 2024", status: "done" },
            { title: "PR Department", date: "Pending", status: "current" },
            { title: "Transportation Review", date: "Pending", status: "pending" },
            { title: "Timing Verification", date: "Pending", status: "pending" },
            { title: "Salary Finalization", date: "Pending", status: "pending" }
        ]
    },
    {
        id: "TR-2024-0011",
        submittedDate: "05 May 2024",
        destination: "Alexandria",
        country: "Egypt",
        duration: "2 Days (2 Nights)",
        travelDates: "10 May 2024 - 12 May 2024",
        status: "Approved",
        statusSubtext: "Completed on 12 May 2024",
        amount: "840.00 EGP",
        jobLevel: "Level 1",
        accommodation: "Hotel Included",
        transportation: "Company Vehicle",
        timeline: [{ title: "Completed", date: "12 May 2024", status: "done" }]
    },
    {
        id: "TR-2024-0010",
        submittedDate: "01 May 2024",
        destination: "Mansoura",
        country: "Egypt",
        duration: "1 Day (No Overnight)",
        travelDates: "05 May 2024 - 05 May 2024",
        status: "Approved",
        statusSubtext: "Completed on 06 May 2024",
        amount: "280.00 EGP",
        jobLevel: "Level 1",
        accommodation: "None",
        transportation: "Public Bus",
        timeline: [{ title: "Completed", date: "06 May 2024", status: "done" }]
    },
    {
        id: "TR-2024-0009",
        submittedDate: "28 Apr 2024",
        destination: "Aswan",
        country: "Egypt",
        duration: "3 Days (2 Nights)",
        travelDates: "28 Apr 2024 - 30 Apr 2024",
        status: "Rejected",
        statusSubtext: "Rejected on 29 Apr 2024",
        amount: "0.00 EGP",
        jobLevel: "Level 1",
        accommodation: "Hotel",
        transportation: "Train",
        timeline: [{ title: "Rejected", date: "29 Apr 2024", status: "pending" }]
    },
    {
        id: "TR-2024-0008",
        submittedDate: "20 Apr 2024",
        destination: "Cairo",
        country: "Egypt",
        duration: "2 Days (2 Nights)",
        travelDates: "20 Apr 2024 - 22 Apr 2024",
        status: "Approved",
        statusSubtext: "Completed on 22 Apr 2024",
        amount: "840.00 EGP",
        jobLevel: "Level 1",
        accommodation: "Hotel",
        transportation: "Company Vehicle",
        timeline: [{ title: "Completed", date: "22 Apr 2024", status: "done" }]
    },
    {
        id: "TR-2024-0007",
        submittedDate: "18 Apr 2024",
        destination: "Luxor",
        country: "Egypt",
        duration: "3 Days (3 Nights)",
        travelDates: "18 Apr 2024 - 21 Apr 2024",
        status: "Draft",
        statusSubtext: "Not Submitted",
        amount: "0.00 EGP",
        jobLevel: "Level 1",
        accommodation: "None",
        transportation: "None",
        timeline: [{ title: "Draft", date: "Not Submitted", status: "current" }]
    }
];

let filterStatus = 'all';
let searchKeyword = '';

document.addEventListener("DOMContentLoaded", () => {
    buildTable(mockRequests);
    // 
    loadDetails(mockRequests[0]);
    initEvents();
});

function buildTable(data) {
    const tbody = document.getElementById("requestsTableBody");
    tbody.innerHTML = "";

    const filtered = data.filter(item => {
        const matchesTab = filterStatus === 'all' || item.status === filterStatus;
        const matchesSearch = item.id.toLowerCase().includes(searchKeyword.toLowerCase()) || 
                              item.destination.toLowerCase().includes(searchKeyword.toLowerCase());
        return matchesTab && matchesSearch;
    });

    document.getElementById("showingText").innerText = `Showing 1 to ${filtered.length} of ${data.length} requests`;

    filtered.forEach((row, index) => {
        const tr = document.createElement("tr");
        if(index === 0 && filterStatus === 'all' && searchKeyword === '') tr.classList.add("selected");
        
        let badgeClass = row.status.toLowerCase().replace(" ", "-");
        let displayAmount = row.amount;
        if (row.status.toLowerCase() === 'in progress' || row.status.toLowerCase() === 'in-progress') {
            displayAmount = "—"; // 
        }
        
        // 
        const dateParts = row.travelDates.split(" - ");

        tr.innerHTML = `
            <td>
                <div class="req-id">${row.id}</div>
                <div class="req-sub-date">Submitted on ${row.submittedDate}</div>
                <div class="req-sub-date" style="color:#64748b; font-weight:500;">${row.duration}</div>
            </td>
            <td>
                <div class="cell-bold"><i class="fa-solid fa-location-dot" style="color:#94a3b8; margin-right:4px;"></i> ${row.destination}</div>
                <div class="cell-subtext">${row.country}</div>
            </td>
            <td>
                <div class="cell-bold"><i class="fa-regular fa-calendar" style="color:#94a3b8; margin-right:4px;"></i> ${dateParts[0]}</div>
                <div class="cell-subtext" style="padding-left:20px;">- ${dateParts[1]}</div>
            </td>
            <td>
                <div class="status-block">
                    <span class="badge-status ${badgeClass}">${row.status}</span>
                    <span class="cell-subtext" style="margin:0; font-size:10.5px;">${row.statusSubtext}</span>
                </div>
            </td>
            <td>${displayAmount}</td>
            <td style="text-align:right;">
                ${row.status === 'Draft' ? '<i class="fa-solid fa-ellipsis-vertical row-arrow"></i>' : '<i class="fa-solid fa-chevron-right row-arrow"></i>'}
            </td>
        `;
        
        tr.addEventListener("click", () => {
            document.querySelectorAll("#requestsTableBody tr").forEach(r => r.classList.remove("selected"));
            tr.classList.add("selected");
            loadDetails(row);
        });

        tbody.appendChild(tr);
    });
}

function loadDetails(item) {
    const panel = document.getElementById("detailPanel");
    if (!item) {
        panel.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding-top:40px;">Select a request view.</p>`;
        return;
    }

    let badgeClass = item.status.toLowerCase().replace(" ", "-");

    let stepsHTML = "";
    item.timeline.forEach(step => {
        let markerIcon = step.status === 'done' ? '<i class="fa-solid fa-circle-check"></i>' : '';
        stepsHTML += `
            <div class="timeline-item ${step.status}">
                <div class="timeline-marker"></div>
                <div class="timeline-info">
                    <h4>${step.title}</h4>
                </div>
                <div class="timeline-date">${step.date} ${markerIcon}</div>
            </div>
        `;
    });

    panel.innerHTML = `
    
        <div class="detail-header">
            <div class="detail-header-left">
                <h2>${item.id}</h2>
                <span class="badge-status ${badgeClass}">${item.status}</span>
            </div>
            <div class="close-panel"><i class="fa-solid fa-xmark"></i></div>
        </div>

        <div class="timeline">
            ${stepsHTML}
        </div>

        <div class="meta-list">
            <div class="meta-item">
                <span class="meta-label"><i class="fa-solid fa-location-dot"></i> Destination</span>
                <span class="meta-value">${item.destination}, ${item.country}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label"><i class="fa-regular fa-calendar"></i> Travel Dates</span>
                <span class="meta-value">${item.travelDates}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label"><i class="fa-regular fa-clock"></i> Duration</span>
                <span class="meta-value">${item.duration}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label"><i class="fa-regular fa-user"></i> Job Level</span>
                <span class="meta-value">${item.jobLevel}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label"><i class="fa-regular fa-building"></i> Accommodation</span>
                <span class="meta-value">${item.accommodation}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label"><i class="fa-solid fa-car"></i> Transportation</span>
                <span class="meta-value">${item.transportation}</span>
            </div>
            <div class="meta-item" style="margin-top:12px; border-top:1px dashed #e2e8f0; padding-top:12px;">
                <span class="meta-label" style="color:#0f172a; font-weight:600;">Estimated Total</span>
                <span class="meta-value total-price">${item.amount}</span>
            </div>
        </div>

        <div class="panel-actions">
            <button class="btn-view-details">View Details</button>
            <button class="btn-download"><i class="fa-solid fa-download"></i> Download Documents</button>
            <button class="btn-cancel">Cancel Request</button>
        </div>
    `;
}

function initEvents() {
    document.querySelectorAll(".tab-btn").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            filterStatus = e.target.getAttribute("data-filter");
            buildTable(mockRequests);
        });
    });

    document.getElementById("statusSelect").addEventListener("change", (e) => {
        filterStatus = e.target.value;
        document.querySelectorAll(".tab-btn").forEach(t => {
            if(t.getAttribute("data-filter") === filterStatus) t.classList.add("active");
            else t.classList.remove("active");
        });
        buildTable(mockRequests);
    });

    document.getElementById("tableSearch").addEventListener("input", (e) => {
        searchKeyword = e.target.value;
        buildTable(mockRequests);
    });
}

// 
const observer = new MutationObserver(() => {
    const panel = document.getElementById("detailPanel");
    if (!panel) return;

    // 
    const isInProgress = Array.from(panel.querySelectorAll(".badge-status"))
        .some(badge => badge.innerText.trim().toLowerCase() === "in progress");

    if (isInProgress) {
        // 
        const divs = panel.querySelectorAll("div");
        divs.forEach(div => {
            if (div.innerText.includes("Amount") || div.innerText.includes("Total") || div.innerText.includes("Estimated")) {
                div.style.setProperty("display", "none", "important");
            }
        });
    }
});

// 
document.addEventListener("DOMContentLoaded", () => {
    const panel = document.getElementById("detailPanel");
    if (panel) {
        observer.observe(panel, { childList: true, subtree: true });
    }
});



:root {
    --bg-main: #f8fafc;
    --sidebar-bg: #ffffff;
    --primary-blue: #3b82f6;
    --primary-dark-blue: #1d4ed8;
    --primary-light: #eff6ff;
    --text-dark: #1e293b;
    --text-muted: #64748b;
    --border-color: #f1f5f9;
    
    --status-progress-bg: #fff7ed;
    --status-progress-text: #ea580c;
    --status-approved-bg: #f0fdf4;
    --status-approved-text: #16a34a;
    --status-rejected-bg: #fef2f2;
    --status-rejected-text: #dc2626;
    --status-draft-bg: #f8fafc;
    --status-draft-text: #64748b;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
    background-color: #f4f6fa;
    color: var(--text-dark);
}

.dashboard-container {
    display: flex;
    min-height: 100vh;
}

/* SIDEBAR */
.sidebar {
    width: 250px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid #eef2f6;
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    flex-shrink: 0;
}

.logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
}
.logo-box {
    background-color: #e0e7ff;
    color: #4f46e5;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}
.logo-area h3 { font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.2;}
.logo-area p { font-size: 12px; color: var(--text-muted); }

.nav-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.nav-section-title {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    margin: 24px 0 8px 12px;
    letter-spacing: 0.5px;
}
.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s;
}
.nav-item i { width: 18px; font-size: 15px; }
.nav-item:hover, .nav-item.active {
    background-color: #f0f4ff;
    color: #4f46e5;
    font-weight: 600;
}

/* Promo Banner Card */
.promo-card {
    background: linear-gradient(135deg, #e0e7ff 0%, #e8edff 100%);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
    margin-top: auto;
    position: relative;
    overflow: hidden;
}
.promo-card h4 { font-size: 13.5px; font-weight: 700; color: #1e1b4b; margin-bottom: 6px; }
.promo-card p { font-size: 11px; color: #4338ca; margin-bottom: 12px; line-height: 1.4; }
.btn-promo-new {
    width: 100%;
    padding: 9px;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
}

/* MAIN CONTENT */
.main-content {
    flex-grow: 1;
    padding: 30px;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}

.main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}
.header-title h1 { font-size: 22px; font-weight: 700; color: #0f172a; }
.header-title p { color: var(--text-muted); font-size: 13px; margin-top: 2px; }

.user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
}
.notifications { position: relative; font-size: 18px; color: var(--text-muted); cursor: pointer; margin-right: 8px;}
.notifications .badge {
    position: absolute; top: -3px; right: -4px;
    background-color: #ef4444; color: white;
    font-size: 9px; padding: 1px 4px; border-radius: 10px; font-weight: bold;
}
.avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 13px; font-weight: 600; color: #0f172a; }
.user-role { font-size: 11px; color: var(--text-muted); }
.dropdown-arrow { font-size: 11px; color: var(--text-muted); }

/* TABS */
.tabs-container {
    display: flex;
    gap: 6px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 20px;
}
.tab-btn {
    padding: 10px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}
.tab-btn.active {
    color: #4f46e5;
    border-bottom-color: #4f46e5;
    font-weight: 600;
}

/* WORKSPACE GRID */
.workspace {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 20px;
    align-items: start;
}

.table-section {
    background: white;
    border-radius: 12px;
    border: 1px solid #edf2f7;
    padding: 20px;
}

.toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}
.search-box {
    position: relative;
    flex-grow: 1;
}
.search-box i {
    position: absolute; left: 12px; top: 50%;
    transform: translateY(-50%); color: #94a3b8; font-size: 13px;
}
.search-box input {
    width: 100%; padding: 9px 12px 9px 36px;
    border: 1px solid #e2e8f0; border-radius: 8px; outline: none; font-size: 13px;
}
.filter-dropdown, .date-picker-mock, .btn-filter {
    padding: 9px 14px; border: 1px solid #e2e8f0;
    border-radius: 8px; background: white; color: #475569;
    font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer;
}

/* TABLE STYLING */
.table-responsive { overflow-x: auto; }
.requests-table {
    width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;
}
.requests-table th {
    padding: 12px 16px; color: #94a3b8;
    font-weight: 600; border-bottom: 1px solid #f1f5f9;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
}
.requests-table tbody tr {
    border-bottom: 1px solid #f8fafc;
    cursor: pointer; transition: background 0.2s;
}
.requests-table tbody tr:hover, .requests-table tbody tr.selected {
    background-color: #f8fafc;
}
.requests-table td { padding: 16px; vertical-align: middle; }

.req-id { font-weight: 600; color: #0f172a; }
.req-sub-date { font-size: 11px; color: #94a3b8; margin-top: 3px; }
.cell-bold { font-weight: 500; color: #334155; }
.cell-subtext { font-size: 11px; color: #94a3b8; margin-top: 3px; }

/* Status Labels & Badges */
.status-block { display: flex; flex-direction: column; gap: 4px; }
.badge-status {
    padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; width: max-content;
}
.badge-status.in-progress { background: var(--status-progress-bg); color: var(--status-progress-text); }
.badge-status.approved { background: var(--status-approved-bg); color: var(--status-approved-text); }
.badge-status.rejected { background: var(--status-rejected-bg); color: var(--status-rejected-text); }
.badge-status.draft { background: var(--status-draft-bg); color: var(--status-draft-text); }

.amount-text { font-weight: 700; color: #1e293b; }
.row-arrow { color: #cbd5e1; font-size: 14px; }

/* PAGINATION */
.pagination-container {
    display: flex; justify-content: space-between; align-items: center; margin-top: 20px;
    font-size: 12px; color: var(--text-muted); padding-top: 10px;
}
.pagination { display: flex; gap: 4px; }
.page-num, .page-nav {
    border: 1px solid #e2e8f0; background: white; width: 28px; height: 28px;
    border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.page-num.active { background: #4f46e5; color: white; border-color: #4f46e5; }
.rows-per-page select { padding: 4px 6px; border: 1px solid #e2e8f0; border-radius: 6px; margin-left: 6px; outline: none;}

/* DETAILS PANEL RIGHT side */
.detail-panel {
    background: white; border: 1px solid #edf2f7;
    border-radius: 12px; padding: 20px;
}
.detail-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
}
.detail-header-left { display: flex; align-items: center; gap: 8px; }
.detail-header h2 { font-size: 15px; font-weight: 700; color: #0f172a; }
.close-panel { font-size: 16px; color: #94a3b8; cursor: pointer; }

/* Timeline UI Stepper */
.timeline { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; position: relative; padding-left: 20px;}
.timeline::before {
    content: ''; position: absolute; left: 4px; top: 8px; bottom: 8px; width: 2px; background: #e2e8f0;
}
.timeline-item { position: relative; display: flex; justify-content: space-between; font-size: 12.5px; }
.timeline-marker {
    position: absolute; left: -20px; top: 3px; width: 10px; height: 10px;
    border-radius: 50%; background: white; border: 2px solid #cbd5e1;
}
.timeline-item.done .timeline-marker { border-color: var(--status-approved-text); background: var(--status-approved-text); }
.timeline-item.current .timeline-marker { border-color: #ea580c; background: white; box-shadow: 0 0 0 3px #ffedd5; }

.timeline-info h4 { font-size: 12.5px; font-weight: 600; color: #334155; }
.timeline-date { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
.timeline-date i { color: var(--status-approved-text); }


.meta-list { display: flex; flex-direction: column; gap: 14px; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 20px;}
.meta-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.meta-label { color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
.meta-label i { width: 14px; text-align: center; color: #94a3b8; }
.meta-value { font-weight: 500; color: #1e293b; }
.meta-value.total-price { font-size: 16px; font-weight: 700; color: #4f46e5; }

.panel-actions { display: flex; flex-direction: column; gap: 8px; }
.btn-view-details {
    background-color: #4f46e5; color: white; border: none;
    padding: 11px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; width: 100%;
}
.btn-download {
    background-color: white; border: 1px solid #e2e8f0; color: #334155;
    padding: 10px; border-radius: 8px; font-weight: 500; font-size: 13px; cursor: pointer; width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-cancel {
    background-color: white; border: 1px solid #fca5a5; color: #ef4444;
    padding: 10px; border-radius: 8px; font-weight: 500; font-size: 13px; cursor: pointer; width: 100%; margin-top: 6px;
}

@media (max-width: 1100px) {
    .workspace { grid-template-columns: 1fr; }
}




#detailPanel div[style*="display: flex; justify-content: space-between; font-size: 13px;"] {
    
}

#detailPanel .meta-list > div:nth-of-type(4), 
#detailPanel div[style*="justify-content: space-between"]:nth-of-type(4) {
    display: none !important;
}



/* */
.logo-box {
    background: transparent !important; /* ا */
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sidebar-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain; /**/
}




.nav-section-title {
    margin-top: 20px;
    margin-bottom: 8px;
    padding-left: 12px;
    font-size: 11px;
    letter-spacing: 0.5px;
    font-weight: 600;
    color: #94a3b8;
}



.tabs-container .tab-btn.active {
    color: #16a34a !important;
    border-bottom: 2px solid #16a34a !important;
}


.btn-promo-new, 
#detailPanel button[style*="background: #4f46e5"],
#detailPanel button:first-of-type {
    background-color: #16a34a !important;
    color: white !important;
}


.btn-promo-new:hover, 
#detailPanel button:first-of-type:hover {
    background-color: #15803d !important;
}


.btn-filter,
tbody button[style*="color: #4f46e5"] {
    border-color: #16a34a !important;
    color: #16a34a !important;
}

tbody button[style*="color: #4f46e5"]:hover {
    background-color: #f0fdf4 !important;
}



.pagination .page-num.active {
    background-color: #16a34a !important;
    border-color: #16a34a !important;
    color: white !important;
}

.pagination .page-num:hover,
.pagination .page-nav:hover {
    border-color: #16a34a !important;
    color: #16a34a !important;
    background-color: #f0fdf4 !important;
}

/* 2. */
.nav-menu .nav-item:hover,
.nav-menu .nav-item.active {
    color: #16a34a !important;
    background-color: #f0fdf4 !important; /**/
}

/*  */
.nav-menu .nav-item:hover i,
.nav-menu .nav-item.active i {
    color: #16a34a !important;
}

/* 3.*/
.filter-dropdown:hover,
.date-picker-mock:hover,
.btn-filter:hover {
    border-color: #16a34a !important;
    color: #16a34a !important;
}

.search-box:focus-within {
    border-color: #16a34a !important;
}

/* 4.*/
.tabs-container .tab-btn:hover {
    color: #16a34a !important;
}
                  
