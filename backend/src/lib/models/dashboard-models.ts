export type Dashboard = {
    id: string,
    name: string,
    topicAreaId: string,
    topicAreaName: string,
    description: string,
    overview?: string,
    createdBy: string,
};

export type DashboardList = Array<Dashboard>;

export interface DashboardItem {
    pk: string,
    sk: string,
    type: string,
    dashboardName: string,
    topicAreaName: string,
    description: string,
    overview?: string,
    createdBy: string,
};