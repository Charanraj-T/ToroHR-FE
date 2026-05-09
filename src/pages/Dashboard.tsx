import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h3>Overview</h3>
        <p>Welcome to ToroHR. Select an option from the sidebar to get started.</p>
      </div>
      
      <div className="dashboard-cards">
        <div className="card dark">
          <div className="card-title">TOTAL STRENGTH</div>
          <div className="card-value">248</div>
        </div>
        <div className="card green">
          <div className="card-title">PRESENT TODAY</div>
          <div className="card-value">212</div>
        </div>
        <div className="card blue">
          <div className="card-title">PENDING APPROVALS</div>
          <div className="card-value">14</div>
        </div>
      </div>
      
      <div className="dashboard-empty-state">
        <div className="empty-icon">📊</div>
        <h4>No recent activity</h4>
        <p>Your workspace is ready. Navigate through the menu to manage employees, attendance, and more.</p>
      </div>
    </div>
  );
};

export default Dashboard;
