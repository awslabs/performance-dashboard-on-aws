import Storage from "@aws-amplify/storage";
import { v4 as uuidv4 } from "uuid";
import EnvConfig from "../services/EnvConfig";

type UploadDatasetResult = {
  s3Keys: {
    raw: string;
    json: string;
  };
};

type ValidFileTypes = {
  [key: string]: string;
};

/**
 * Access Level `public` does not mean the S3 bucket is publicly accessible.
 * It just means that all valid and authenticated users will have
 * access to the uploaded datasets regardless of who uploaded it originally.
 *
 * Docs: https://docs.amplify.aws/lib/storage/configureaccess/q/platform/js
 */
const accessLevel = "public";
const serverSideEncryption = "aws:kms";
const rawFileTypes: ValidFileTypes = {
  "text/csv": ".csv",
  "application/vnd.ms-excel": ".csv",
};
const imageFileTypes: ValidFileTypes = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/svg": ".svg",
  "image/svg+xml": ".svg",
};

async function downloadFile(
  path: string,
  t: Function,
  alternativeBucket?: string
): Promise<File> {
  const data: any = alternativeBucket
    ? await Storage.get(path, {
        bucket: alternativeBucket,
        download: true,
        level: accessLevel,
        serverSideEncryption,
      })
    : await Storage.get(path, {
        download: true,
        level: accessLevel,
        serverSideEncryption,
      });
  if (!data || !data.Body) {
    throw new Error(t("DownloadFileError"));
  }
  return data.Body as File;
}

async function downloadLogo(s3Key: string, t: Function) {
  const path = "logo/".concat(s3Key);
  return await downloadFile(path, t, EnvConfig.contentBucket);
}

async function downloadJson(s3Key: string): Promise<Array<any>> {
  const data: any = await Storage.get(s3Key, {
    download: true,
    level: accessLevel,
    serverSideEncryption,
  });

  if (!data || !data.Body) {
    // Default to empty array rather than throwing exception
    // and making the entire dashboard crash because of a single
    // malformed dataset.
    return [];
  }

  try {
    const body: Blob = data.Body;
    const content = await new Response(body).text();
    return JSON.parse(content);
  } catch (err) {
    // Same, defaulting to empty array.
    return [];
  }
}

async function uploadFile(
  rawFile: File,
  fileS3Key: string,
  alternativeBucket?: string
) {
  alternativeBucket
    ? await Storage.put(fileS3Key, rawFile, {
        bucket: alternativeBucket,
        level: accessLevel,
        contentDisposition: `attachment; filename="${rawFile.name}"`,
        contentType: rawFile.type,
        serverSideEncryption,
      })
    : await Storage.put(fileS3Key, rawFile, {
        level: accessLevel,
        contentDisposition: `attachment; filename="${rawFile.name}"`,
        contentType: rawFile.type,
        serverSideEncryption,
      });
}

async function uploadJson(jsonFile: string, jsonS3Key: string) {
  await Storage.put(jsonS3Key, jsonFile, {
    level: accessLevel,
    contentType: "application/json",
    serverSideEncryption,
  });
}

async function uploadDataset(
  rawFile: File,
  jsonFile: string,
  t: Function
): Promise<UploadDatasetResult> {
  const mimeType = rawFile.type;
  const extension = rawFileTypes[mimeType as keyof ValidFileTypes];
  if (!extension) {
    throw new Error(t("UploadDatasetError"));
  }

  const s3Key = uuidv4();
  const rawS3Key = s3Key.concat(extension);
  const jsonS3Key = s3Key.concat(".json");

  await uploadFile(rawFile, rawS3Key);
  await uploadJson(jsonFile, jsonS3Key);

  return {
    s3Keys: {
      raw: rawS3Key,
      json: jsonS3Key,
    },
  };
}

async function uploadMetric(jsonFile: string): Promise<UploadDatasetResult> {
  const s3Key = uuidv4();
  const jsonS3Key = s3Key.concat(".json");

  await uploadJson(jsonFile, jsonS3Key);

  return {
    s3Keys: {
      raw: jsonS3Key,
      json: jsonS3Key,
    },
  };
}

async function uploadImage(
  rawFile: File,
  directory?: string,
  alternativeBucket?: string
): Promise<string> {
  const mimeType = rawFile.type;
  const extension = imageFileTypes[mimeType as keyof ValidFileTypes];

  if (!extension) {
    throw new Error("File type is not supported");
  }

  const fileS3Key = uuidv4().concat(extension);
  const dir = directory ? directory + "/" : "";

  await uploadFile(rawFile, dir.concat(fileS3Key), alternativeBucket);

  return fileS3Key;
}

async function uploadLogo(rawFile: File): Promise<string> {
  const mimeType = rawFile.type;
  const extension = imageFileTypes[mimeType as keyof ValidFileTypes];

  if (!extension) {
    throw new Error("File type is not supported");
  }

  const fileS3Key = "uploadedLogo".concat(extension);
  const dir = "logo/";

  await uploadFile(rawFile, dir.concat(fileS3Key), EnvConfig.contentBucket);

  return fileS3Key;
}

const StorageService = {
  downloadFile,
  downloadJson,
  uploadDataset,
  uploadMetric,
  uploadImage,
  uploadLogo,
  downloadLogo,
  imageFileTypes,
};

export default StorageService;
