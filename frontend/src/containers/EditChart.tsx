import React, { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { parse, ParseResult } from "papaparse";
import { Dataset, ChartType, DatasetType } from "../models";
import StorageService from "../services/StorageService";
import BackendService from "../services/BackendService";
import Breadcrumbs from "../components/Breadcrumbs";
import TextField from "../components/TextField";
import FileInput from "../components/FileInput";
import Button from "../components/Button";
import RadioButtons from "../components/RadioButtons";
import LineChartPreview from "../components/LineChartPreview";
import ColumnChartWidget from "../components/ColumnChartWidget";
import BarChartPreview from "../components/BarChartPreview";
import PartWholeChartPreview from "../components/PartWholeChartPreview";
import { useWidget, useDashboard, useDateTimeFormatter } from "../hooks";
import Spinner from "../components/Spinner";
import UtilsService from "../services/UtilsService";
import Link from "../components/Link";
import ComboBox from "../components/Combobox";
import { useDatasets } from "../hooks/dataset-hooks";
import Alert from "../components/Alert";
import "./EditChart.css";

interface FormValues {
  title: string;
  summary: string;
  chartType: string;
  showTitle: boolean;
  dynamicDatasets: string;
  staticDatasets: string;
  summaryBelow: boolean;
}

interface PathParams {
  dashboardId: string;
  widgetId: string;
}

function EditChart() {
  const history = useHistory();
  const { dashboardId, widgetId } = useParams<PathParams>();
  const dateFormatter = useDateTimeFormatter();
  const { dashboard, loading } = useDashboard(dashboardId);
  const { dynamicDatasets, staticDatasets, loadingDatasets } = useDatasets();
  const {
    register,
    errors,
    handleSubmit,
    getValues,
    reset,
  } = useForm<FormValues>();
  const [dynamicDataset, setDynamicDataset] = useState<Dataset | undefined>(
    undefined
  );
  const [staticDataset, setStaticDataset] = useState<Dataset | undefined>(
    undefined
  );
  const [csvErrors, setCsvErrors] = useState<Array<object> | undefined>(
    undefined
  );
  const [csvFile, setCsvFile] = useState<File | undefined>(undefined);
  const [fileLoading, setFileLoading] = useState(false);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [editingWidget, setEditingWidget] = useState(false);
  const {
    widget,
    datasetType,
    setDatasetType,
    currentJson,
    dynamicJson,
    staticJson,
    csvJson,
    setCurrentJson,
    setDynamicJson,
    setStaticJson,
    setCsvJson,
  } = useWidget(dashboardId, widgetId);

  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryBelow, setSummaryBelow] = useState(false);
  const [chartType, setChartType] = useState("");

  useEffect(() => {
    if (widget && dynamicDatasets && staticDatasets) {
      const title = widget.content.title;
      const showTitle = widget.showTitle;
      const summary = widget.content.summary;
      const summaryBelow = widget.content.summaryBelow;
      const chartType = widget.content.chartType;

      reset({
        title,
        showTitle,
        summary,
        summaryBelow,
        chartType,
        dynamicDatasets:
          widget.content.datasetType === DatasetType.DynamicDataset
            ? widget.content.s3Key.json
            : "",
        staticDatasets:
          widget.content.datasetType === DatasetType.StaticDataset
            ? widget.content.s3Key.json
            : "",
      });

      setTitle(title);
      setShowTitle(showTitle);
      setSummary(summary);
      setSummaryBelow(summaryBelow);
      setChartType(chartType);
      setDynamicDataset(
        dynamicDatasets.find((d) => d.s3Key.json === widget.content.s3Key.json)
      );
      setStaticDataset(
        staticDatasets.find((d) => d.s3Key.json === widget.content.s3Key.json)
      );
    }
  }, [widget, dynamicDatasets, staticDatasets, reset]);

  const onFileProcessed = useCallback(
    async (data: File) => {
      if (!data) {
        return;
      }
      setDatasetLoading(true);
      parse(data, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        comments: "#",
        encoding: "ISO-8859-1",
        complete: function (results: ParseResult<object>) {
          if (results.errors.length) {
            setCsvErrors(results.errors);
            setCsvJson([]);
            setCurrentJson([]);
          } else {
            setCsvErrors(undefined);
            setCsvJson(results.data);
            setCurrentJson(results.data);
          }
          setDatasetLoading(false);
        },
      });
      setCsvFile(data);
    },
    [setCurrentJson, setCsvJson]
  );

  const uploadDataset = async (): Promise<Dataset | null> => {
    if (!csvFile) {
      // User did not select a new dataset.
      // No need to upload anything.
      return null;
    }

    if (!csvFile.lastModified) {
      return {
        id: widget?.content.datasetId,
        fileName: csvFile.name,
        s3Key: widget?.content.s3Key,
      };
    }

    setFileLoading(true);
    const uploadResponse = await StorageService.uploadDataset(
      csvFile,
      JSON.stringify(currentJson)
    );

    const newDataset = await BackendService.createDataset(csvFile.name, {
      raw: uploadResponse.s3Keys.raw,
      json: uploadResponse.s3Keys.json,
    });

    setFileLoading(false);
    return newDataset;
  };

  const onSubmit = async (values: FormValues) => {
    if (!widget) {
      return;
    }

    try {
      let newDataset;
      if (csvFile) {
        newDataset = await uploadDataset();
      }

      setEditingWidget(true);
      await BackendService.editWidget(
        dashboardId,
        widgetId,
        values.title,
        values.showTitle,
        {
          title: values.title,
          summary: values.summary,
          summaryBelow: values.summaryBelow,
          chartType: values.chartType,
          datasetType: datasetType,
          datasetId: newDataset
            ? newDataset.id
            : datasetType === DatasetType.DynamicDataset
            ? dynamicDataset?.id
            : staticDataset?.id,
          s3Key: newDataset
            ? newDataset.s3Key
            : datasetType === DatasetType.DynamicDataset
            ? dynamicDataset?.s3Key
            : staticDataset?.s3Key,
          fileName: csvFile
            ? csvFile.name
            : datasetType === DatasetType.DynamicDataset
            ? dynamicDataset?.fileName
            : staticDataset?.fileName,
        },
        widget.updatedAt
      );
      setEditingWidget(false);

      history.push(`/admin/dashboard/edit/${dashboardId}`, {
        alert: {
          type: "success",
          message: `"${values.title}" ${UtilsService.getChartTypeLabel(
            values.chartType
          ).toLowerCase()} has been successfully edited`,
        },
      });
    } catch (err) {
      console.log("Failed to edit content item", err);
      setEditingWidget(false);
    }
  };

  const onCancel = () => {
    history.push(`/admin/dashboard/edit/${dashboardId}`);
  };

  const handleChange = async (event: React.FormEvent<HTMLFieldSetElement>) => {
    const target = event.target as HTMLInputElement;
    if (target.name === "datasetType") {
      setDatasetLoading(true);
      const datasetType = target.value as DatasetType;
      setDatasetType(datasetType);
      await UtilsService.timeout(0);
      if (datasetType === DatasetType.DynamicDataset) {
        setCurrentJson(dynamicJson);
      }
      if (datasetType === DatasetType.StaticDataset) {
        setCurrentJson(staticJson);
      }
      if (datasetType === DatasetType.CsvFileUpload) {
        setCurrentJson(csvJson);
      }
      setDatasetLoading(false);
    }
  };

  const onSelectDynamicDataset = async (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    event.persist();
    setDatasetLoading(true);

    const jsonFile = (event.target as HTMLInputElement).value;
    if (jsonFile) {
      const dataset = await StorageService.downloadJson(jsonFile);
      setDynamicJson(dataset);
      setCurrentJson(dataset);
      setDynamicDataset(dynamicDatasets.find((d) => d.s3Key.json === jsonFile));
    } else {
      setDynamicJson([]);
      setCurrentJson([]);
      setDynamicDataset(undefined);
    }

    setDatasetLoading(false);
    event.stopPropagation();
  };

  const onSelectStaticDataset = async (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    event.persist();
    setDatasetLoading(true);

    const jsonFile = (event.target as HTMLInputElement).value;
    if (jsonFile) {
      const dataset = await StorageService.downloadJson(jsonFile);
      setStaticJson(dataset);
      setCurrentJson(dataset);
      setStaticDataset(staticDatasets.find((d) => d.s3Key.json === jsonFile));
    } else {
      setStaticJson([]);
      setCurrentJson([]);
      setStaticDataset(undefined);
    }

    setDatasetLoading(false);
    event.stopPropagation();
  };

  const onFormChange = () => {
    const { title, showTitle, summary, summaryBelow, chartType } = getValues();
    setTitle(title);
    setShowTitle(showTitle);
    setSummary(summary);
    setSummaryBelow(summaryBelow);
    setChartType(chartType);
  };

  const crumbs = [
    {
      label: "Dashboards",
      url: "/admin/dashboards",
    },
    {
      label: dashboard?.name,
      url: `/admin/dashboard/edit/${dashboardId}`,
    },
  ];

  if (!loading && widget) {
    crumbs.push({
      label: "Edit chart",
      url: "",
    });
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <h1>Edit chart</h1>

      {loading || loadingDatasets || !widget || !datasetType ? (
        <Spinner className="text-center margin-top-9" label="Loading" />
      ) : (
        <>
          <div className="grid-row width-desktop">
            <div className="grid-col-6">
              <form
                className="usa-form usa-form--large"
                onChange={onFormChange}
                onSubmit={handleSubmit(onSubmit)}
              >
                <fieldset className="usa-fieldset">
                  <TextField
                    id="title"
                    name="title"
                    label="Chart title"
                    hint="Give your chart a descriptive title."
                    error={errors.title && "Please specify a chart title"}
                    defaultValue={title}
                    required
                    register={register}
                  />

                  <div className="usa-checkbox">
                    <input
                      className="usa-checkbox__input"
                      id="display-title"
                      type="checkbox"
                      name="showTitle"
                      defaultChecked={showTitle}
                      ref={register()}
                    />
                    <label
                      className="usa-checkbox__label"
                      htmlFor="display-title"
                    >
                      Show title on dashboard
                    </label>
                  </div>

                  <label htmlFor="fieldset" className="usa-label text-bold">
                    Data
                  </label>
                  <div className="usa-hint">
                    Choose an existing dataset or create a new one to populate
                    this chart.{" "}
                    <Link to="/admin/apihelp" target="_blank" external>
                      How do I add datasets?
                    </Link>
                  </div>
                  {(datasetType === DatasetType.DynamicDataset &&
                    dynamicDataset &&
                    dynamicDataset.s3Key.json !== widget.content.s3Key.json) ||
                  (datasetType === DatasetType.StaticDataset &&
                    staticDataset &&
                    staticDataset.s3Key.json !== widget.content.s3Key.json) ||
                  (datasetType === DatasetType.CsvFileUpload &&
                    csvFile &&
                    csvFile.name) ? (
                    <Alert
                      type="info"
                      message={
                        <div>
                          <span className="margin-left-4">Dataset changed</span>
                          <div className="float-right">
                            <Button
                              variant="unstyled"
                              className="margin-0-important text-base-dark hover:text-base-darker active:text-base-darkest"
                              onClick={() => window.location.reload()}
                              type="button"
                              ariaLabel="Undo"
                            >
                              Undo
                            </Button>
                          </div>
                        </div>
                      }
                      slim
                    />
                  ) : (
                    ""
                  )}
                  <fieldset
                    id="fieldset"
                    className="usa-fieldset"
                    onChange={handleChange}
                  >
                    <legend className="usa-sr-only">Content item types</legend>
                    <div className="usa-radio">
                      <div className="grid-row">
                        <div className="grid-col flex-5">
                          <input
                            className="usa-radio__input"
                            id="dynamicDataset"
                            value="DynamicDataset"
                            type="radio"
                            name="datasetType"
                            defaultChecked={
                              datasetType === DatasetType.DynamicDataset
                            }
                            ref={register()}
                          />
                          <label
                            className="usa-radio__label"
                            htmlFor="dynamicDataset"
                          >
                            Select a dynamic dataset
                          </label>
                        </div>
                      </div>
                    </div>
                    <div
                      className="margin-left-4"
                      hidden={datasetType !== DatasetType.DynamicDataset}
                    >
                      <div className="usa-hint margin-top-1">
                        Choose from a list of available datasets.
                      </div>
                      <ComboBox
                        id="dynamicDatasets"
                        name="dynamicDatasets"
                        label=""
                        options={dynamicDatasets.map((d) => {
                          return {
                            value: d.s3Key.json,
                            content: `${d.fileName} (${
                              d.s3Key.json
                            }) Last update: ${dateFormatter(d.updatedAt)}`,
                          };
                        })}
                        defaultValue={dynamicDataset?.s3Key.json}
                        register={register}
                        onChange={onSelectDynamicDataset}
                      />
                    </div>
                    <div className="usa-radio">
                      <div className="grid-row">
                        <div className="grid-col flex-5">
                          <input
                            className="usa-radio__input"
                            id="staticDataset"
                            value="StaticDataset"
                            type="radio"
                            name="datasetType"
                            defaultChecked={
                              datasetType === DatasetType.StaticDataset
                            }
                            ref={register()}
                          />
                          <label
                            className="usa-radio__label"
                            htmlFor="staticDataset"
                          >
                            Select a static dataset
                          </label>
                        </div>
                      </div>
                    </div>
                    <div
                      className="margin-left-4"
                      hidden={datasetType !== DatasetType.StaticDataset}
                    >
                      <div className="usa-hint margin-top-1">
                        Choose from a list of available datasets.
                      </div>
                      <ComboBox
                        id="staticDatasets"
                        name="staticDatasets"
                        label=""
                        options={staticDatasets.map((d) => {
                          return {
                            value: d.s3Key.json,
                            content: `${d.fileName} (${d.s3Key.json})`,
                          };
                        })}
                        defaultValue={staticDataset?.s3Key.json}
                        register={register}
                        onChange={onSelectStaticDataset}
                      />
                    </div>
                    <div className="usa-radio">
                      <div className="grid-row">
                        <div className="grid-col flex-5">
                          <input
                            className="usa-radio__input"
                            id="csvFileUpload"
                            value="CsvFileUpload"
                            type="radio"
                            name="datasetType"
                            defaultChecked={
                              datasetType === DatasetType.CsvFileUpload
                            }
                            ref={register()}
                          />
                          <label
                            className="usa-radio__label"
                            htmlFor="csvFileUpload"
                          >
                            Create a new dataset from file
                          </label>
                        </div>
                      </div>
                    </div>
                    <div hidden={datasetType !== DatasetType.CsvFileUpload}>
                      <FileInput
                        id="dataset"
                        name="dataset"
                        label="File upload"
                        accept=".csv"
                        loading={fileLoading}
                        errors={csvErrors}
                        register={register}
                        fileName={`${
                          csvFile?.name ||
                          (!widget.content.datasetType ||
                          widget.content.datasetType ===
                            DatasetType.CsvFileUpload
                            ? widget.content.fileName ||
                              widget.content.title + ".csv"
                            : "")
                        }`}
                        hint={
                          <span>
                            Must be a CSV file.{" "}
                            <Link
                              to="/admin/formattingcsv"
                              target="_blank"
                              external
                            >
                              How do I format my CSV file?
                            </Link>
                          </span>
                        }
                        onFileProcessed={onFileProcessed}
                      />
                    </div>
                  </fieldset>

                  {widget ? (
                    <div hidden={!currentJson.length}>
                      <RadioButtons
                        id="chartType"
                        name="chartType"
                        label="Chart type"
                        hint="Choose a chart type."
                        register={register}
                        error={errors.chartType && "Please select a chart type"}
                        defaultValue={chartType}
                        required
                        options={[
                          {
                            value: ChartType.BarChart,
                            label: "Bar",
                          },
                          {
                            value: ChartType.ColumnChart,
                            label: "Column",
                          },
                          {
                            value: ChartType.LineChart,
                            label: "Line",
                          },
                          {
                            value: ChartType.PartWholeChart,
                            label: "Part-to-whole",
                          },
                        ]}
                      />

                      <TextField
                        id="summary"
                        name="summary"
                        label="Chart summary - optional"
                        hint={
                          <>
                            Give your chart a summary to explain it in more
                            depth. It can also be read by screen readers to
                            describe the chart for those with visual
                            impairments. This field supports markdown.{" "}
                            <Link
                              target="_blank"
                              to={"/admin/markdown"}
                              external
                            >
                              View Markdown Syntax
                            </Link>
                          </>
                        }
                        register={register}
                        defaultValue={summary}
                        multiline
                        rows={5}
                      />
                      <div className="usa-checkbox">
                        <input
                          className="usa-checkbox__input"
                          id="summary-below"
                          type="checkbox"
                          name="summaryBelow"
                          defaultChecked={summaryBelow}
                          ref={register()}
                        />
                        <label
                          className="usa-checkbox__label"
                          htmlFor="summary-below"
                        >
                          Show summary below chart
                        </label>
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                </fieldset>
                <br />
                <br />
                <hr />
                <Button
                  disabled={!currentJson.length || fileLoading || editingWidget}
                  type="submit"
                >
                  Save
                </Button>
                <Button
                  variant="unstyled"
                  className="text-base-dark hover:text-base-darker active:text-base-darkest"
                  type="button"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </form>
            </div>
            <div className="grid-col-6">
              <div hidden={!currentJson.length} className="margin-left-4">
                <h4>Preview</h4>
                {datasetLoading ? (
                  <Spinner
                    className="text-center margin-top-6"
                    label="Loading"
                  />
                ) : (
                  <>
                    {chartType === ChartType.LineChart && (
                      <LineChartPreview
                        title={showTitle ? title : ""}
                        summary={summary}
                        lines={
                          currentJson.length > 0
                            ? (Object.keys(currentJson[0]) as Array<string>)
                            : []
                        }
                        data={currentJson}
                        summaryBelow={summaryBelow}
                        isPreview={true}
                      />
                    )}
                    {chartType === ChartType.ColumnChart && (
                      <ColumnChartWidget
                        title={showTitle ? title : ""}
                        summary={summary}
                        columns={
                          currentJson.length > 0
                            ? (Object.keys(currentJson[0]) as Array<string>)
                            : []
                        }
                        data={currentJson}
                        summaryBelow={summaryBelow}
                        isPreview={true}
                      />
                    )}
                    {chartType === ChartType.BarChart && (
                      <BarChartPreview
                        title={showTitle ? title : ""}
                        summary={summary}
                        bars={
                          currentJson.length > 0
                            ? (Object.keys(currentJson[0]) as Array<string>)
                            : []
                        }
                        data={currentJson}
                        summaryBelow={summaryBelow}
                      />
                    )}
                    {chartType === ChartType.PartWholeChart && (
                      <PartWholeChartPreview
                        title={showTitle ? title : ""}
                        summary={summary}
                        parts={
                          currentJson.length > 0
                            ? (Object.keys(currentJson[0]) as Array<string>)
                            : []
                        }
                        data={currentJson}
                        summaryBelow={summaryBelow}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default EditChart;
