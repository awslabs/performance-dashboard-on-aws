import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import BackendService from "../services/BackendService";
import Breadcrumbs from "../components/Breadcrumbs";
import TextField from "../components/TextField";
import Button from "../components/Button";
import MarkdownRender from "../components/MarkdownRender";
import { useWidget, useDashboard, useFullPreview } from "../hooks";
import Spinner from "../components/Spinner";
import Link from "../components/Link";
import PrimaryActionBar from "../components/PrimaryActionBar";
import { useTranslation } from "react-i18next";
import Alert from "../components/Alert";
import { ChangeBackgroundColor } from "../hooks/background-hooks";

interface FormValues {
  title: string;
  text: string;
  showTitle: boolean;
}

interface PathParams {
  dashboardId: string;
  widgetId: string;
}

function EditText() {
  const history = useHistory();
  const { dashboardId, widgetId } = useParams<PathParams>();
  const { dashboard, loading } = useDashboard(dashboardId);
  const { register, errors, handleSubmit, getValues } = useForm<FormValues>();
  const { t } = useTranslation();
  const [editingWidget, setEditingWidget] = useState(false);
  const { widget, setWidget } = useWidget(dashboardId, widgetId);
  const { fullPreview, fullPreviewButton } = useFullPreview();

  const onSubmit = async (values: FormValues) => {
    if (!widget) {
      return;
    }

    try {
      setEditingWidget(true);
      await BackendService.editWidget(
        dashboardId,
        widgetId,
        values.title,
        values.showTitle,
        {
          text: values.text,
        },
        widget.updatedAt
      );
      setEditingWidget(false);

      history.push(`/admin/dashboard/edit/${dashboardId}`, {
        alert: {
          type: "success",
          message: t("EditTextScreen.EditTextSuccess", { title: values.title }),
        },
      });
    } catch (err) {
      console.log(t("AddContentFailure"), err);
      setEditingWidget(false);
    }
  };

  const onCancel = () => {
    history.push(`/admin/dashboard/edit/${dashboardId}`);
  };

  const onFormChange = () => {
    const { title, text, showTitle } = getValues();
    setWidget({
      ...widget,
      name: title,
      showTitle: showTitle,
      content: {
        ...widget?.content,
        text,
      },
    });
  };

  const crumbs = [
    {
      label: t("Dashboards"),
      url: "/admin/dashboards",
    },
    {
      label: dashboard?.name,
      url: `/admin/dashboard/edit/${dashboardId}`,
    },
  ];

  ChangeBackgroundColor();

  if (!loading && widget) {
    crumbs.push({
      label: t("EditTextScreen.EditText"),
      url: "",
    });
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />

      {loading || !widget || editingWidget ? (
        <Spinner
          className="text-center margin-top-9"
          label={`${
            editingWidget
              ? t("EditTextScreen.EditingText")
              : t("LoadingSpinnerLabel")
          }`}
        />
      ) : (
        <>
          <div className="grid-row width-desktop grid-gap">
            <div className="grid-col-6" hidden={fullPreview}>
              <PrimaryActionBar>
                <h1 className="margin-top-0">{t("EditTextScreen.EditText")}</h1>
                <form
                  className="usa-form usa-form--large"
                  onChange={onFormChange}
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <fieldset className="usa-fieldset">
                    {errors.title || errors.text ? (
                      <Alert
                        type="error"
                        message={t("EditTextScreen.EditTextError")}
                        slim
                      ></Alert>
                    ) : (
                      ""
                    )}
                    <TextField
                      id="title"
                      name="title"
                      label={t("EditTextScreen.TextTitle")}
                      hint={t("EditTextScreen.TextTitleHint")}
                      error={errors.title && t("EditTextScreen.TextTitleError")}
                      defaultValue={widget.name}
                      required
                      register={register}
                    />

                    <div className="usa-checkbox">
                      <input
                        className="usa-checkbox__input"
                        id="display-title"
                        type="checkbox"
                        name="showTitle"
                        defaultChecked={widget.showTitle}
                        ref={register()}
                      />
                      <label
                        className="usa-checkbox__label"
                        htmlFor="display-title"
                      >
                        {t("EditTextScreen.ShowTitle")}
                      </label>
                    </div>

                    <TextField
                      id="text"
                      name="text"
                      label="Text"
                      hint={
                        <>
                          {t("EditTextScreen.TextHint")}{" "}
                          <Link target="_blank" to={"/admin/markdown"} external>
                            {t("EditTextScreen.ViewMarkdownSyntax")}
                          </Link>
                        </>
                      }
                      error={errors.text && t("EditTextScreen.TextError")}
                      required
                      register={register}
                      defaultValue={widget.content.text}
                      multiline
                      rows={10}
                    />
                  </fieldset>
                  <br />
                  <br />
                  <hr />
                  <Button disabled={editingWidget} type="submit">
                    {t("Save")}
                  </Button>
                  <Button
                    variant="unstyled"
                    className="text-base-dark hover:text-base-darker active:text-base-darkest"
                    type="button"
                    onClick={onCancel}
                  >
                    {t("Cancel")}
                  </Button>
                </form>
              </PrimaryActionBar>
            </div>
            <div className={fullPreview ? "grid-col-12" : "grid-col-6"}>
              {fullPreviewButton}
              {widget.showTitle ? (
                <h2 className="margin-top-3 margin-left-2px">{widget.name}</h2>
              ) : (
                ""
              )}
              {widget.content.text ? (
                <div className="padding-left-05">
                  <MarkdownRender
                    className="usa-prose"
                    source={widget.content.text}
                  />
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default EditText;
