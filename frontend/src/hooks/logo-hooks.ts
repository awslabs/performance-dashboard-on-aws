import { useEffect, useState, useCallback } from "react";
import StorageService from "../services/StorageService";

type UseLogoHook = {
  loadingFile: boolean;
  logo: File | undefined;
};

export function useLogo(s3Key?: string): UseLogoHook {
  const [loading, setLoading] = useState<boolean>(false);
  const [logo, setFile] = useState<File>();

  const fetchData = useCallback(async () => {
    if (s3Key) {
      try {
        setLoading(true);
        const data = await StorageService.downloadLogo(s3Key, () => {});
        setFile(data);
        setLoading(false);
      } catch (err) {
        console.log("Can't retrieve logo from S3", err);
        setLoading(false);
      }
    }
  }, [s3Key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loadingFile: loading,
    logo,
  };
}
