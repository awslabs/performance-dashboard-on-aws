import { Request, Response } from "express";
import SettingsFactory from "../factories/settings-factory";
import SettingsRepository from "../repositories/settings-repo";
import AuthService from "../services/auth";

async function getSettings(req: Request, res: Response) {
  const repo = SettingsRepository.getInstance();
  const settings = await repo.getSettings();

  return res.json(settings);
}

async function updateSettings(req: Request, res: Response) {
  const user = req.user;
  let { updatedAt } = req.body;

  const {
    publishingGuidance,
    dateTimeFormat,
    navbarTitle,
    topicAreaLabels,
  } = req.body;

  if (!updatedAt) {
    res.status(400);
    return res.send("Missing field `updatedAt` in body");
  }

  const repo = SettingsRepository.getInstance();

  if (publishingGuidance) {
    updatedAt = await repo.updateSetting(
      "publishingGuidance",
      publishingGuidance,
      updatedAt,
      user
    );
  }

  if (dateTimeFormat) {
    if (!dateTimeFormat.date || !dateTimeFormat.time) {
      res.status(400);
      return res.send("Missing fields `date` or `time` in dateTimeFormat");
    }

    updatedAt = await repo.updateSetting(
      "dateTimeFormat",
      dateTimeFormat,
      updatedAt,
      user
    );
  }

  if (navbarTitle) {
    updatedAt = await repo.updateSetting(
      "navbarTitle",
      navbarTitle,
      updatedAt,
      user
    );
  }

  if (topicAreaLabels) {
    if (!topicAreaLabels.singular || !topicAreaLabels.plural) {
      res.status(400);
      return res.send(
        "Missing fields `singular` or `plural` in topicAreaLabels"
      );
    }

    updatedAt = await repo.updateSetting(
      "topicAreaLabels",
      topicAreaLabels,
      updatedAt,
      user
    );
  }
  res.send();
}

async function getPublicSettings(req: Request, res: Response) {
  const repo = SettingsRepository.getInstance();
  let settings = await repo.getSettings();

  const publicSettings = SettingsFactory.toPublicSettings(settings);
  return res.json(publicSettings);
}

export default {
  getSettings,
  getPublicSettings,
  updateSettings,
};
