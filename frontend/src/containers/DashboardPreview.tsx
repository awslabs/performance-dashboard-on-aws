import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { useDashboard } from "../hooks";
import { LocationState } from "../models";
import AdminLayout from "../layouts/Admin";
import ReactMarkdown from "react-markdown";
import Button from "../components/Button";
import BadgerService from "../services/BadgerService";
import Alert from "../components/Alert";
import WidgetRender from "../components/WidgetRender";
import "./DashboardPreview.css";

interface PathParams {
  dashboardId: string;
}

function DashboardPreview() {
  const history = useHistory<LocationState>();
  const { dashboardId } = useParams<PathParams>();
  const { dashboard } = useDashboard(dashboardId);

  const onPublish = async () => {
    if (
      window.confirm(
        "Are you sure you want to publish this dashboard? After publishing, the dashboard will be viewable on the external dashboard website."
      )
    ) {
      if (dashboard) {
        await BadgerService.publishDashboard(dashboard.id, dashboard.updatedAt);
        history.push("/admin/dashboards?tab=published", {
          alert: {
            type: "success",
            message: `${dashboard.name} dashboard was successfully published`,
          },
        });
      }
    }
  };

  const onCancel = () => {
    history.push(`/admin/dashboard/edit/${dashboard?.id}`);
  };

  return (
    <AdminLayout>
      <div className="position-sticky top-0 bg-white z-index-on-top">
        <Alert
          type="info"
          message="Below is a preview of what the published dashboard will look like.
              If everything looks right, you can publish the dashboard to be
              viewable on the external site."
        />
        <div className="grid-row margin-top-2">
          <div className="grid-col text-left">
            <span className="usa-tag text-middle">Preview</span>
          </div>
          <div className="grid-col text-right">
            <Button variant="base" onClick={onPublish}>
              Publish
            </Button>
            <Button variant="outline" type="button" onClick={onCancel}>
              Close Preview
            </Button>
          </div>
        </div>
        <div className="margin-top-2 gradient height-4" />
      </div>
      <div>
        <h1 className="margin-bottom-0 display-inline-block">
          {dashboard?.name}
        </h1>
      </div>
      <div className="text-base text-italic">{dashboard?.topicAreaName}</div>
      <div>
        {dashboard?.description ? (
          <ReactMarkdown source={dashboard.description} />
        ) : (
          <p>No description entered</p>
        )}
      </div>
      <hr />

      {dashboard?.widgets.map((widget, index) => {
        return (
          <div className="margin-top-5" key={index}>
            <WidgetRender widget={widget} />
          </div>
        );
      })}
    </AdminLayout>
  );
}

export default DashboardPreview;
