import React, { useMemo, useState } from "react";
import { useJsonDataset } from "../hooks";
import { ChartWidget, ChartType } from "../models";
import LineChartWidget from "./LineChartWidget";
import ColumnChartWidget from "./ColumnChartWidget";
import BarChartWidget from "./BarChartWidget";
import PartWholeChartWidget from "./PartWholeChartWidget";
import DatasetParsingService from "../services/DatasetParsingService";
import PieChartWidget from "./PieChartWidget";
import DonutChartWidget from "./DonutChartWidget";

interface Props {
  widget: ChartWidget;
}

function ChartWidgetComponent(props: Props) {
  const { content } = props.widget;
  const { json } = useJsonDataset(content.s3Key.json);
  const [filteredJson, setFilteredJson] = useState<Array<any>>([]);

  useMemo(() => {
    let headers = json.length ? (Object.keys(json[0]) as Array<string>) : [];
    headers = headers.filter((h) => {
      const metadata = content.columnsMetadata
        ? content.columnsMetadata.find((c) => c.columnName === h)
        : undefined;
      return !metadata || !metadata.hidden;
    });

    const newFilteredJson = new Array<any>();
    for (const row of json) {
      const filteredRow = headers.reduce((obj: any, key: any) => {
        obj[key] = row[key];
        return obj;
      }, {});
      if (filteredRow !== {}) {
        newFilteredJson.push(filteredRow);
      }
    }

    DatasetParsingService.sortFilteredJson(
      newFilteredJson,
      props.widget.content.sortByColumn,
      props.widget.content.sortByDesc
    );
    setFilteredJson(newFilteredJson);
  }, [json, props.widget, content.columnsMetadata]);

  if (!filteredJson || filteredJson.length === 0) {
    return null;
  }

  const keys = Object.keys(filteredJson[0] as Array<string>);
  switch (content.chartType) {
    case ChartType.LineChart:
      return (
        <LineChartWidget
          title={props.widget.showTitle ? content.title : ""}
          summary={content.summary}
          summaryBelow={content.summaryBelow}
          lines={keys}
          data={filteredJson}
          horizontalScroll={content.horizontalScroll}
          significantDigitLabels={content.significantDigitLabels}
          columnsMetadata={content.columnsMetadata}
        />
      );

    case ChartType.ColumnChart:
      return (
        <ColumnChartWidget
          title={props.widget.showTitle ? content.title : ""}
          summary={content.summary}
          summaryBelow={content.summaryBelow}
          columns={keys}
          data={filteredJson}
          horizontalScroll={content.horizontalScroll}
          significantDigitLabels={content.significantDigitLabels}
          columnsMetadata={content.columnsMetadata}
          hideDataLabels={!content.dataLabels}
        />
      );

    case ChartType.BarChart:
      return (
        <BarChartWidget
          title={props.widget.showTitle ? content.title : ""}
          summary={content.summary}
          summaryBelow={content.summaryBelow}
          bars={keys}
          data={filteredJson}
          significantDigitLabels={content.significantDigitLabels}
          columnsMetadata={content.columnsMetadata}
          hideDataLabels={!content.dataLabels}
        />
      );

    case ChartType.PartWholeChart:
      return (
        <PartWholeChartWidget
          title={props.widget.showTitle ? content.title : ""}
          summary={content.summary}
          summaryBelow={content.summaryBelow}
          parts={keys}
          data={filteredJson}
          significantDigitLabels={content.significantDigitLabels}
        />
      );

    case ChartType.PieChart:
      return (
        <PieChartWidget
          title={props.widget.showTitle ? content.title : ""}
          summary={content.summary}
          summaryBelow={content.summaryBelow}
          parts={keys}
          data={filteredJson}
          significantDigitLabels={content.significantDigitLabels}
          hideDataLabels={!content.dataLabels}
          columnsMetadata={content.columnsMetadata}
        />
      );

    case ChartType.DonutChart:
      return (
        <DonutChartWidget
          title={props.widget.showTitle ? content.title : ""}
          summary={content.summary}
          summaryBelow={content.summaryBelow}
          parts={keys}
          data={filteredJson}
          significantDigitLabels={content.significantDigitLabels}
          hideDataLabels={!content.dataLabels}
          columnsMetadata={content.columnsMetadata}
          showTotal={content.showTotal}
        />
      );

    default:
      return null;
  }
}

export default ChartWidgetComponent;
