import { mocked } from "ts-jest/utils";
import { User } from "../../models/user-models";
import DashboardRepository from "../dashboard-repo";
import DashboardFactory from "../../models/dashboard-factory";

jest.mock("../../services/dynamodb");
import DynamoDBService from "../../services/dynamodb";

let user: User;
let tableName: string;
let repo: DashboardRepository;
let dynamodb = mocked(DynamoDBService.prototype);

beforeAll(() => {
  user = { userId: "test" };
  tableName = "BadgerTable";
  process.env.BADGER_TABLE = tableName;

  DynamoDBService.getInstance = jest.fn().mockReturnValue(dynamodb);
  repo = DashboardRepository.getInstance();
});

describe("DashboardRepository", () => {
  it("should be a singleton", () => {
    const repo2 = DashboardRepository.getInstance();
    expect(repo).toBe(repo2);
  });
});

describe("DashboardRepository.create", () => {
  it("should call putItem on dynamodb", async () => {
    const dashboard = DashboardFactory.createNew('Dashboard1', '123', 'Topic1', user);
    const item = DashboardFactory.toItem(dashboard);

    await repo.putDashboard(dashboard);

    expect(dynamodb.put).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: tableName,
        Item: item,
      })
    );
  });
});

describe("DashboardRepository.updateOverview", () => {
    it("should call updateItem with the correct keys", async () => {
      await repo.updateOverview("123", "Test", user);
      expect(dynamodb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: tableName,
          Key: {
            pk: DashboardFactory.itemId("123"),
            sk: DashboardFactory.itemId("123"),
          },
        })
      );
    });
  
    it("should set overview and updatedBy fields", async () => {
      await repo.updateOverview("123", "Test", user);
      expect(dynamodb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          UpdateExpression: "set #overview = :overview, #updatedBy = :userId",
          ExpressionAttributeValues: {
            ":overview": "Test",
            ":userId": user.userId,
          },
        })
      );
    });
  });

describe("DashboardRepository.delete", () => {
  it("should call delete with the correct key", async () => {
    await repo.delete("123");
    expect(dynamodb.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: tableName,
        Key: {
          pk: DashboardFactory.itemId("123"),
          sk: DashboardFactory.itemId("123"),
        },
      })
    );
  });
});

describe("DashboardRepository.listDashboards", () => {
  it("should query using the correct GSI", async () => {
    // Mock query response
    dynamodb.query = jest.fn().mockReturnValue({});

    await repo.listDashboards();

    expect(dynamodb.query).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: tableName,
        IndexName: "byType",
      })
    );
  });

  it("returns a list of dashboards", async () => {
    // Mock query response
    dynamodb.query = jest.fn().mockReturnValue({
      Items: [{
        pk: 'Dashboard#123',
        sk: 'Dashboard#123',
        topicAreaId: 'TopicArea#456',
        topicAreaName: 'Topic 1',
        dashboardName: 'Test name',
        description: 'description test',
        createdBy: 'test',
      }],
    });

    const list = await repo.listDashboards();
    expect(list.length).toEqual(1);
    expect(list[0]).toEqual({
      id: '123',
      name: 'Test name',
      topicAreaId: '456',
      topicAreaName: 'Topic 1',
      description: 'description test',
      createdBy: 'test',
    });
  });

  it("returns a dashboard by id", async () => {
    // Mock query response
    dynamodb.get = jest.fn().mockReturnValue({
      Item: {
        pk: 'Dashboard#123',
        sk: 'Dashboard#123',
        topicAreaId: 'TopicArea#456',
        topicAreaName: 'Topic 1',
        dashboardName: 'Test name',
        description: 'description test',
        createdBy: 'test',
      },
    });

    const item = await repo.getDashboardById('123');
    expect(item).toEqual({
      id: '123',
      name: 'Test name',
      topicAreaId: '456',
      topicAreaName: 'Topic 1',
      description: 'description test',
      createdBy: 'test',
    });
  });

  it("returns a list of dashboards within a topic area", async () => {
    // Mock query response
    dynamodb.query = jest.fn().mockReturnValue({});

    const topicAreaId = '456';

    await repo.listDashboardsWithinTopicArea(topicAreaId);

    expect(dynamodb.query).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: tableName,
        KeyConditionExpression: "pk = :topicAreaId AND begin_with (sk, :dashboard)",
        ExpressionAttributeValues: {
          ":topicAreaId": topicAreaId,
          ":dashboard": "Dashboard",
        }
      })
    );

    // Mock query response
    dynamodb.query = jest.fn().mockReturnValue({
      Items: [{
        pk: 'Dashboard#123',
        sk: 'Dashboard#123',
        topicAreaId: `TopicArea#${topicAreaId}`,
        topicAreaName: 'Topic 1',
        dashboardName: 'Test name',
        description: 'description test',
        createdBy: 'test',
      }],
    });

    const list = await repo.listDashboardsWithinTopicArea(topicAreaId);
    expect(list.length).toEqual(1);
    expect(list[0]).toEqual({
      id: '123',
      name: 'Test name',
      topicAreaId: topicAreaId,
      topicAreaName: 'Topic 1',
      description: 'description test',
      createdBy: 'test',
    });
  });

});
