import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare, faMinusSquare } from "@fortawesome/free-solid-svg-icons";
import Button from "../components/Button";
import { useTranslation } from "react-i18next";

export function useFullPreview() {
  const [fullPreview, setFullPreview] = useState(false);
  const { t } = useTranslation();

  const fullPreviewToggle = () => {
    setFullPreview(!fullPreview);
  };

  const fullPreviewButton = fullPreview ? (
    <Button
      onClick={fullPreviewToggle}
      variant="outline"
      type="button"
      className="margin-top-1"
    >
      <FontAwesomeIcon icon={faMinusSquare} className={"margin-right-1"} />
      {t("ClosePreview")}
    </Button>
  ) : (
    <Button onClick={fullPreviewToggle} variant="outline" type="button">
      <FontAwesomeIcon icon={faPlusSquare} className={"margin-right-1"} />
      {t("ExpandPreview")}
    </Button>
  );

  return { fullPreviewToggle, fullPreviewButton, fullPreview };
}
