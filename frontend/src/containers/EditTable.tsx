import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import {
  ColumnDataType,
  CurrencyDataType,
  Dataset,
  DatasetType,
  LocationState,
  NumberDataType,
} from "../models";
import BackendService from "../services/BackendService";
import StorageService from "../services/StorageService";
import DatasetParsingService from "../services/DatasetParsingService";
import Breadcrumbs from "../components/Breadcrumbs";
import { parse, ParseResult } from "papaparse";
import { useWidget, useDashboard, useFullPreview } from "../hooks";
import Spinner from "../components/Spinner";
import { useDatasets } from "../hooks";
import UtilsService from "../services/UtilsService";
import ColumnsMetadataService from "../services/ColumnsMetadataService";
import "./EditTable.css";
import ChooseData from "../components/ChooseData";
import CheckData from "../components/CheckData";
import Visualize from "../components/VisualizeTable";
import PrimaryActionBar from "../components/PrimaryActionBar";

interface FormValues {
  title: string;
  summary: string;
  showTitle: boolean;
  dynamicDatasets: string;
  staticDatasets: string;
  summaryBelow: boolean;
  datasetType: string;
  sortData: string;
  significantDigitLabels: boolean;
}

interface PathParams {
  dashboardId: string;
  widgetId: string;
}

function EditTable() {
  const history = useHistory<LocationState>();
  const { state } = history.location;
  const { dashboardId, widgetId } = useParams<PathParams>();
  const { dashboard, loading } = useDashboard(dashboardId);
  const { dynamicDatasets, staticDatasets, loadingDatasets } = useDatasets();
  const {
    register,
    errors,
    handleSubmit,
    watch,
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
  const [step, setStep] = useState<number>(state && state.json ? 1 : 2);
  const {
    widget,
    datasetType,
    currentJson,
    dynamicJson,
    staticJson,
    csvJson,
    setDynamicJson,
    setCsvJson,
  } = useWidget(dashboardId, widgetId);
  const { fullPreview, fullPreviewButton } = useFullPreview();

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
  const [dataTypes, setDataTypes] = useState<Map<string, ColumnDataType>>(
    new Map<string, ColumnDataType>()
  );
  const [numberTypes, setNumberTypes] = useState<Map<string, NumberDataType>>(
    new Map<string, NumberDataType>()
  );
  const [currencyTypes, setCurrencyTypes] = useState<
    Map<string, CurrencyDataType>
  >(new Map<string, CurrencyDataType>());

  const title = watch("title");
  const showTitle = watch("showTitle");
  const summary = watch("summary");
  const summaryBelow = watch("summaryBelow");
  const significantDigitLabels = watch("significantDigitLabels");

  const [filteredJson, setFilteredJson] = useState<any[]>([]);
  const [displayedJson, setDisplayedJson] = useState<Array<any>>([]);
  const [displayedDatasetType, setDisplayedDatasetType] = useState<
    DatasetType | undefined
  >();

  const initializeColumnsMetadata = () => {
    setSelectedHeaders(new Set<string>());
    setHiddenColumns(new Set<string>());
    setDataTypes(new Map<string, ColumnDataType>());
    setNumberTypes(new Map<string, NumberDataType>());
    setCurrencyTypes(new Map<string, CurrencyDataType>());
    setSortByColumn(undefined);
    setSortByDesc(false);
  };

  useMemo(() => {
    const newFilteredJson = DatasetParsingService.getFilteredJson(
      displayedJson,
      hiddenColumns
    );
    setFilteredJson(newFilteredJson);
  }, [displayedJson, hiddenColumns]);

  useEffect(() => {
    if (
      widget &&
      dynamicDatasets &&
      staticDatasets &&
      currentJson &&
      datasetType
    ) {
      const title = widget.content.title;
      const showTitle = widget.showTitle;
      const summary = widget.content.summary;
      const summaryBelow = widget.content.summaryBelow;
      const significantDigitLabels = widget.content.significantDigitLabels;

      reset({
        title,
        showTitle,
        datasetType: displayedDatasetType
          ? displayedDatasetType
          : state && state.json
          ? DatasetType.StaticDataset
          : datasetType,
        summary,
        summaryBelow,
        significantDigitLabels: significantDigitLabels,
        dynamicDatasets:
          widget.content.datasetType === DatasetType.DynamicDataset
            ? widget.content.s3Key.json
            : "",
        staticDatasets:
          widget.content.datasetType === DatasetType.StaticDataset
            ? widget.content.s3Key.json
            : "",
        sortData: widget.content.sortByColumn
          ? `${widget.content.sortByColumn}###${
              widget.content.sortByDesc ? "desc" : "asc"
            }`
          : "",
      });

      if (!displayedDatasetType) {
        setDisplayedDatasetType(
          state && state.json && state.staticDataset
            ? DatasetType.StaticDataset
            : datasetType
        );

        if (!displayedJson.length) {
          setDisplayedJson(state && state.json ? state.json : currentJson);
        }

        // Initialize fields related to columns metadata
        if (widget.content.columnsMetadata && (!state || !state.json)) {
          const columnsMetadata = widget.content.columnsMetadata;

          const {
            hiddenColumns,
            dataTypes,
            numberTypes,
            currencyTypes,
          } = ColumnsMetadataService.parseColumnsMetadata(columnsMetadata);

          setHiddenColumns(hiddenColumns);
          setDataTypes(dataTypes);
          setNumberTypes(numberTypes);
          setCurrencyTypes(currencyTypes);
          setSortByColumn(widget.content.sortByColumn);
          setSortByDesc(widget.content.sortByDesc || false);
        }
      }

      if (!dynamicDataset) {
        setDynamicDataset(
          dynamicDatasets.find(
            (d) => d.s3Key.json === widget.content.s3Key.json
          )
        );
      }
      if (!staticDataset) {
        setStaticDataset(
          state && state.staticDataset
            ? state.staticDataset
            : staticDatasets.find(
                (d) => d.s3Key.json === widget.content.s3Key.json
              )
        );
      }
    }
  }, [
    widget,
    dynamicDatasets,
    staticDatasets,
    reset,
    state,
    currentJson,
    displayedJson,
    datasetType,
  ]);

  const onFileProcessed = useCallback(
    async (data: File) => {
      if (!data) {
        return;
      }
      setDatasetLoading(true);
      parse(data, {
        header: false,
        dynamicTyping: true,
        skipEmptyLines: true,
        comments: "#",
        encoding: "ISO-8859-1",
        complete: function (results: ParseResult<object>) {
          initializeColumnsMetadata();
          if (results.errors.length) {
            setCsvErrors(results.errors);
            setCsvJson([]);
            setDisplayedJson([]);
          } else {
            setCsvErrors(undefined);
            const csvJson = DatasetParsingService.createHeaderRowJson(
              results.data
            );
            setCsvJson(csvJson);
            setDisplayedJson(csvJson);
          }
          setDatasetLoading(false);
        },
      });
      setCsvFile(data);
    },
    [setDisplayedJson, setCsvJson]
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
      JSON.stringify(displayedJson)
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
          datasetType: displayedDatasetType,
          significantDigitLabels: values.significantDigitLabels,
          datasetId: newDataset
            ? newDataset.id
            : displayedDatasetType === DatasetType.DynamicDataset
            ? dynamicDataset?.id
            : staticDataset?.id,
          s3Key: newDataset
            ? newDataset.s3Key
            : displayedDatasetType === DatasetType.DynamicDataset
            ? dynamicDataset?.s3Key
            : staticDataset?.s3Key,
          fileName: csvFile
            ? csvFile.name
            : displayedDatasetType === DatasetType.DynamicDataset
            ? dynamicDataset?.fileName
            : staticDataset?.fileName,
          sortByColumn,
          sortByDesc,
          columnsMetadata: ColumnsMetadataService.getColumnsMetadata(
            hiddenColumns,
            dataTypes,
            numberTypes,
            currencyTypes
          ),
        },
        widget.updatedAt
      );
      setEditingWidget(false);

      history.push(`/admin/dashboard/edit/${dashboardId}`, {
        alert: {
          type: "success",
          message: `"${values.title}" table has been successfully edited`,
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
      setDisplayedDatasetType(datasetType);
      await UtilsService.timeout(0);
      initializeColumnsMetadata();
      if (datasetType === DatasetType.DynamicDataset) {
        setDisplayedJson(dynamicJson);
      }
      if (datasetType === DatasetType.StaticDataset) {
        if (csvJson) {
          setDisplayedJson(csvJson);
        } else {
          setDisplayedJson(staticJson);
        }
      }
      setDatasetLoading(false);
    }
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
        redirectUrl: `/admin/dashboard/${dashboardId}/edit-table/${widgetId}`,
        crumbLabel: "Edit table",
      },
    });
  };

  const selectDynamicDataset = async (selectedDataset: Dataset) => {
    setDatasetLoading(true);

    if (
      selectedDataset &&
      selectedDataset.s3Key &&
      selectedDataset.s3Key.json
    ) {
      const jsonFile = selectedDataset.s3Key.json;

      initializeColumnsMetadata();
      const dataset = await StorageService.downloadJson(jsonFile);
      setDynamicDataset(dynamicDatasets.find((d) => d.s3Key.json === jsonFile));
      setDynamicJson(dataset);
      setDisplayedJson(dataset);
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

  if (!loading && widget) {
    crumbs.push({
      label: "Edit table",
      url: "",
    });
  }

  const configHeader = (
    <div>
      <h1 className="margin-top-0">Edit table</h1>
      <ul className="usa-button-group usa-button-group--segmented">
        <li className="usa-button-group__item">
          <button
            className={
              step !== 0 ? "usa-button usa-button--outline" : "usa-button"
            }
            type="button"
            onClick={() => setStep(0)}
          >
            Choose data
          </button>
        </li>
        <li className="usa-button-group__item">
          <button
            className={
              step !== 1 ? "usa-button usa-button--outline" : "usa-button"
            }
            type="button"
            onClick={() => setStep(1)}
            disabled={!displayedJson.length}
          >
            Check data
          </button>
        </li>
        <li className="usa-button-group__item">
          <button
            className={
              step !== 2 ? "usa-button usa-button--outline" : "usa-button"
            }
            type="button"
            onClick={() => setStep(2)}
            disabled={!displayedJson.length}
          >
            Visualize
          </button>
        </li>
      </ul>
    </div>
  );

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />

      {loading ||
      loadingDatasets ||
      !widget ||
      !displayedDatasetType ||
      !filteredJson ||
      fileLoading ||
      editingWidget ? (
        <Spinner className="text-center margin-top-9" label="Loading" />
      ) : (
        <>
          <div className="grid-row width-desktop">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div hidden={step !== 0}>
                <PrimaryActionBar>
                  {configHeader}
                  <ChooseData
                    selectDynamicDataset={selectDynamicDataset}
                    dynamicDatasets={dynamicDatasets}
                    datasetType={displayedDatasetType}
                    onFileProcessed={onFileProcessed}
                    handleChange={handleChange}
                    advanceStep={advanceStep}
                    fileLoading={fileLoading}
                    browseDatasets={browseDatasets}
                    continueButtonDisabled={!displayedJson.length}
                    csvErrors={csvErrors}
                    csvFile={csvFile}
                    onCancel={onCancel}
                    register={register}
                    widgetType="table"
                  />
                </PrimaryActionBar>
              </div>

              <div hidden={step !== 1}>
                <div className="grid-col-8">
                  <PrimaryActionBar>
                    {configHeader}
                    <CheckData
                      data={displayedJson}
                      advanceStep={advanceStep}
                      backStep={backStep}
                      selectedHeaders={selectedHeaders}
                      setSelectedHeaders={setSelectedHeaders}
                      hiddenColumns={hiddenColumns}
                      setHiddenColumns={setHiddenColumns}
                      onCancel={onCancel}
                      dataTypes={dataTypes}
                      setDataTypes={setDataTypes}
                      numberTypes={numberTypes}
                      setNumberTypes={setNumberTypes}
                      currencyTypes={currencyTypes}
                      setCurrencyTypes={setCurrencyTypes}
                      sortByColumn={sortByColumn}
                      sortByDesc={sortByDesc}
                      setSortByColumn={setSortByColumn}
                      setSortByDesc={setSortByDesc}
                      reset={reset}
                    />
                  </PrimaryActionBar>
                </div>
              </div>

              <div hidden={step !== 2}>
                <Visualize
                  errors={errors}
                  register={register}
                  json={filteredJson}
                  originalJson={displayedJson}
                  headers={
                    displayedJson.length
                      ? (Object.keys(displayedJson[0]) as Array<string>)
                      : []
                  }
                  csvJson={csvJson}
                  datasetLoading={datasetLoading}
                  datasetType={displayedDatasetType}
                  onCancel={onCancel}
                  backStep={backStep}
                  advanceStep={advanceStep}
                  fileLoading={fileLoading}
                  processingWidget={editingWidget}
                  fullPreviewButton={fullPreviewButton}
                  fullPreview={fullPreview}
                  submitButtonLabel="Save"
                  title={title}
                  summary={summary}
                  summaryBelow={summaryBelow}
                  showTitle={showTitle}
                  sortByColumn={sortByColumn}
                  sortByDesc={sortByDesc}
                  setSortByColumn={setSortByColumn}
                  setSortByDesc={setSortByDesc}
                  significantDigitLabels={significantDigitLabels}
                  columnsMetadata={ColumnsMetadataService.getColumnsMetadata(
                    hiddenColumns,
                    dataTypes,
                    numberTypes,
                    currencyTypes
                  )}
                  configHeader={configHeader}
                />
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}

export default EditTable;
