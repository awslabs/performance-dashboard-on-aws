import React from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layouts/Admin";
import { useDashboards } from "../hooks";

function DashboardListing() {
  const { dashboards } = useDashboards();
  return (
    <AdminLayout>
      <h1>Dashboards</h1>
      <Link to="/admin/dashboard/create">Create new dashboard</Link>
      <ul className="ds-c-list">
        {dashboards.map(dashboard => (<li key={dashboard.id}>{dashboard.name}</li>))}
      </ul>
    </AdminLayout>
  );
}

export default DashboardListing;
