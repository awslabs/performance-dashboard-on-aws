import { User } from "../models/user-models";
import DynamoDBService from "../services/dynamodb";
import DashboardFactory from "../models/dashboard-factory";
import {
  Dashboard,
  DashboardList,
  DashboardItem,
} from "../models/dashboard-models";

class DashboardRepository {
  private dynamodb: DynamoDBService;
  private tableName: string;
  private static instance: DashboardRepository;

  /**
   * Repo is a Singleton, hence private constructor
   * to prevent direct constructions calls with new operator.
   */
  private constructor() {
    if (!process.env.BADGER_TABLE) {
      throw new Error("Environment variable BADGER_TABLE not found");
    }

    this.dynamodb = DynamoDBService.getInstance();
    this.tableName = process.env.BADGER_TABLE;
  }

  /**
   * Controls access to the singleton instance.
   */
  static getInstance(): DashboardRepository {
    if (!DashboardRepository.instance) {
        DashboardRepository.instance = new DashboardRepository();
    }

    return DashboardRepository.instance;
  }

  /**
   * Get a dashboard specifiying the dashboard id
   * and the topicArea id.
   */
  public async getDashboardById(dashboardId: string) {
    const result = await this.dynamodb.get({
      TableName: this.tableName,
      Key: {
        pk: DashboardFactory.itemId(dashboardId),
        sk: DashboardFactory.itemId(dashboardId),
      },
    });
    return DashboardFactory.fromItem(result.Item as DashboardItem);
  }

  /**
   * Performs a putItem request to DynamoDB to create
   * a new dashboard item or replace an old one.
   *
   * @param dashboard Dashboard
   */
  public async putDashboard(dashboard: Dashboard) {
    await this.dynamodb.put({
      TableName: this.tableName,
      Item: DashboardFactory.toItem(dashboard),
    });
  }

  /**
   * Returns all Dashboards by performing a query
   * operation against the `byType` Global Secondary Index
   * on the DynamoDB table.
   *
   * TODO: Implement pagination
   */
  public async listDashboards(): Promise<DashboardList> {
    const result = await this.dynamodb.query({
      TableName: this.tableName,
      IndexName: "byType",
      KeyConditionExpression: "#type = :type",
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":type": "Dashboard",
      },
    });

    if (!result.Items) {
      return [];
    }

    return result.Items.map((item) =>
      DashboardFactory.fromItem(item as DashboardItem)
    );
  }

  /**
   * Returns the list of Dashboards within
   * an specified topic area.
   */
  public async listDashboardsWithinTopicArea(topicAreaId: string): Promise<DashboardList> {
    const result = await this.dynamodb.query({
      TableName: this.tableName,
      KeyConditionExpression: "pk = :topicAreaId AND begin_with (sk, :dashboard)",
      ExpressionAttributeValues: {
        ":topicAreaId": topicAreaId,
        ":dashboard": "Dashboard",
      },
    });

    if (!result.Items) {
      return [];
    }

    return result.Items.map((item) =>
      DashboardFactory.fromItem(item as DashboardItem)
    );
  }

  /**
   * Updates the overview of an existing Dashboard identified
   * by the params `dashboardId` and `topicAreaId`. Sets the 
   * `updatedBy` field to the userId doing the update action.
   */
  public async updateOverview(dashboardId: string, overview: string, user: User) {
    await this.dynamodb.update({
      TableName: this.tableName,
      Key: {
        pk: DashboardFactory.itemId(dashboardId),
        sk: DashboardFactory.itemId(dashboardId),
      },
      UpdateExpression: "set #overview = :overview, #updatedBy = :userId",
      ExpressionAttributeValues: {
        ":overview": overview,
        ":userId": user.userId,
      },
      ExpressionAttributeNames: {
        "#overview": "overview",
        "#updatedBy": "updatedBy",
      },
    });
  }

  /**
   * Deletes the Dashboard identified by the params
   * `dashboardId` and `topicAreaId`.
   */
  public async delete(dashboardId: string) {
    await this.dynamodb.delete({
      TableName: this.tableName,
      Key: {
        pk: DashboardFactory.itemId(dashboardId),
        sk: DashboardFactory.itemId(dashboardId),
      },
    });
  }
}

export default DashboardRepository;
