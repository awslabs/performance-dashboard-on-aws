import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { ChartType, LocationState } from "../models";
import { parse, ParseResult } from "papaparse";
import { Dataset, WidgetType, DatasetType, ColumnDataType } from "../models";
import { useDashboard, useDatasets, useFullPreview } from "../hooks";
import StorageService from "../services/StorageService";
import BackendService from "../services/BackendService";
import Breadcrumbs from "../components/Breadcrumbs";
import UtilsService from "../services/UtilsService";
import StepIndicator from "../components/StepIndicator";
import CheckData from "../components/CheckData";
import ChooseData from "../components/ChooseData";
import VisualizeChart from "../components/VisualizeChart";
import "./AddChart.css";
import ColumnsMetadataService from "../services/ColumnsMetadataService";
import DatasetParsingService from "../services/DatasetParsingService";

interface FormValues {
  title: string;
  summary: string;
  chartType: string;
  showTitle: boolean;
  summaryBelow: boolean;
  datasetType: string;
  horizontalScroll: boolean;
  significantDigitLabels: boolean;
  sortData: string;
}

interface PathParams {
  dashboardId: string;
}

function AddChart() {
  const history = useHistory<LocationState>();
  const { state } = history.location;

  const { dashboardId } = useParams<PathParams>();
  const { dashboard, loading } = useDashboard(dashboardId);
  const { dynamicDatasets } = useDatasets();
  const {
    register,
    errors,
    handleSubmit,
    reset,
    watch,
  } = useForm<FormValues>();
  const [currentJson, setCurrentJson] = useState<Array<any>>(
    state && state.json ? state.json : []
  );
  const [dynamicJson, setDynamicJson] = useState<Array<any>>([]);
  const [staticJson] = useState<Array<any>>(
    state && state.json ? state.json : []
  );
  const [csvJson, setCsvJson] = useState<Array<any>>([]);
  const [filteredJson, setFilteredJson] = useState<Array<any>>(currentJson);
  const [dynamicDataset, setDynamicDataset] = useState<Dataset | undefined>(
    undefined
  );
  const [staticDataset] = useState<Dataset | undefined>(
    state && state.staticDataset ? state.staticDataset : undefined
  );
  const [csvErrors, setCsvErrors] = useState<Array<object> | undefined>(
    undefined
  );
  const [csvFile, setCsvFile] = useState<File | undefined>(undefined);
  const [fileLoading, setFileLoading] = useState(false);
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [creatingWidget, setCreatingWidget] = useState(false);
  const [datasetType, setDatasetType] = useState<DatasetType | undefined>(
    state && state.json ? DatasetType.StaticDataset : undefined
  );
  const [step, setStep] = useState<number>(state && state.json ? 1 : 0);
  const [selectedHeaders, setSelectedHeaders] = useState<Set<string>>(
    new Set<string>()
  );
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    new Set<string>()
  );
  const [sortByColumn, setSortByColumn] = useState<string | undefined>(
    undefined
  );
  const [sortByDesc, setSortByDesc] = useState<boolean | undefined>(undefined);
  const { fullPreviewButton, fullPreview } = useFullPreview();
  const [dataTypes, setDataTypes] = useState<Map<string, ColumnDataType>>(
    new Map<string, ColumnDataType>()
  );

  const title = watch("title");
  const summary = watch("summary");
  const summaryBelow = watch("summaryBelow");
  const chartType = watch("chartType");
  const showTitle = watch("showTitle");
  const horizontalScroll = watch("horizontalScroll");
  const significantDigitLabels = watch("significantDigitLabels");

  useMemo(() => {
    const newFilteredJson = DatasetParsingService.getFilteredJson(
      currentJson,
      hiddenColumns
    );
    setFilteredJson(newFilteredJson);
  }, [currentJson, hiddenColumns]);

  const uploadDataset = async (): Promise<Dataset> => {
    if (!csvFile) {
      throw new Error("CSV file not specified");
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
    try {
      let newDataset;
      if (csvFile) {
        newDataset = await uploadDataset();
      }

      setCreatingWidget(true);
      await BackendService.createWidget(
        dashboardId,
        values.title,
        WidgetType.Chart,
        values.showTitle,
        {
          title: values.title,
          summary: values.summary,
          summaryBelow: values.summaryBelow,
          chartType: values.chartType,
          ...(values.chartType === ChartType.LineChart && {
            horizontalScroll: values.horizontalScroll,
          }),
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
          sortByColumn,
          sortByDesc,
          significantDigitLabels: values.significantDigitLabels,
          columnsMetadata: ColumnsMetadataService.getColumnsMetadata(
            hiddenColumns,
            dataTypes
          ),
        }
      );
      setCreatingWidget(false);

      history.push(`/admin/dashboard/edit/${dashboardId}`, {
        alert: {
          type: "success",
          message: `"${values.title}" ${UtilsService.getChartTypeLabel(
            values.chartType
          ).toLowerCase()} has been successfully added`,
        },
      });
    } catch (err) {
      console.log("Failed to save content item", err);
      setCreatingWidget(false);
    }
  };

  const onCancel = () => {
    history.push(`/admin/dashboard/edit/${dashboardId}`);
  };

  const advanceStep = () => {
    setStep(step + 1);
  };

  const backStep = () => {
    setStep(step - 1);
  };

  const browseDatasets = () => {
    history.push({
      pathname: `/admin/dashboard/${dashboardId}/choose-static-dataset`,
      state: {
        redirectUrl: `/admin/dashboard/${dashboardId}/add-chart/`,
        crumbLabel: "Add chart",
      },
    });
  };

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
        complete: async function (results: ParseResult<object>) {
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
        if (csvJson) {
          setCurrentJson(csvJson);
        } else {
          setCurrentJson(staticJson);
        }
      }
      setDatasetLoading(false);
    }
  };

  const selectDynamicDataset = async (selectedDataset: Dataset) => {
    setDatasetLoading(true);

    if (
      selectedDataset &&
      selectedDataset.s3Key &&
      selectedDataset.s3Key.json
    ) {
      const jsonFile = selectedDataset.s3Key.json;

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

  if (!loading) {
    crumbs.push({
      label: "Add chart",
      url: "",
    });
  }

  useEffect(() => {
    if (datasetType) {
      reset({
        datasetType,
      });
    }
  }, []);

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <h1 hidden={fullPreview}>Add chart</h1>

      <div className="grid-row width-desktop">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid-col-12">
            <div className="grid-col-6" hidden={fullPreview}>
              <StepIndicator
                current={step}
                segments={[
                  {
                    label: "Choose data",
                  },
                  {
                    label: "Check data",
                  },
                  {
                    label: "Visualize",
                  },
                ]}
                showStepChart={true}
                showStepText={false}
              />
            </div>
          </div>

          <div hidden={step !== 0}>
            <ChooseData
              selectDynamicDataset={selectDynamicDataset}
              dynamicDatasets={dynamicDatasets}
              datasetType={datasetType}
              onFileProcessed={onFileProcessed}
              handleChange={handleChange}
              advanceStep={advanceStep}
              fileLoading={fileLoading}
              browseDatasets={browseDatasets}
              continueButtonDisabled={!currentJson.length}
              csvErrors={csvErrors}
              csvFile={csvFile}
              onCancel={onCancel}
              register={register}
              widgetType="chart"
            />
          </div>

          <div hidden={step !== 1}>
            <CheckData
              data={currentJson}
              advanceStep={advanceStep}
              backStep={backStep}
              selectedHeaders={selectedHeaders}
              setSelectedHeaders={setSelectedHeaders}
              hiddenColumns={hiddenColumns}
              setHiddenColumns={setHiddenColumns}
              onCancel={onCancel}
              dataTypes={dataTypes}
              setDataTypes={setDataTypes}
              sortByColumn={sortByColumn}
              sortByDesc={sortByDesc}
              setSortByColumn={setSortByColumn}
              setSortByDesc={setSortByDesc}
              reset={reset}
            />
          </div>

          <div hidden={step !== 2}>
            <VisualizeChart
              errors={errors}
              register={register}
              json={filteredJson}
              headers={
                currentJson.length
                  ? (Object.keys(currentJson[0]) as Array<string>)
                  : []
              }
              originalJson={currentJson}
              csvJson={csvJson}
              datasetLoading={datasetLoading}
              datasetType={datasetType}
              onCancel={onCancel}
              backStep={backStep}
              advanceStep={advanceStep}
              fileLoading={fileLoading}
              processingWidget={creatingWidget}
              fullPreviewButton={fullPreviewButton}
              fullPreview={fullPreview}
              submitButtonLabel="Add Chart"
              sortByColumn={sortByColumn}
              sortByDesc={sortByDesc}
              setSortByColumn={setSortByColumn}
              setSortByDesc={setSortByDesc}
              title={title}
              summary={summary}
              summaryBelow={summaryBelow}
              showTitle={showTitle}
              chartType={chartType as ChartType}
              significantDigitLabels={significantDigitLabels}
              horizontalScroll={horizontalScroll}
            />
          </div>
        </form>
      </div>
    </>
  );
}

export default AddChart;
