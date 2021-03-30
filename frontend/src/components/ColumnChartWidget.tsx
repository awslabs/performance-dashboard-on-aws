import React, { useCallback, useEffect, useRef, useState } from "react";
// @ts-ignore
import { CategoricalChartWrapper } from "recharts";
import {
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useColors, useYAxisMetadata } from "../hooks";
import UtilsService from "../services/UtilsService";
import TickFormatter from "../services/TickFormatter";
import MarkdownRender from "./MarkdownRender";
import ColumnsMetadataService from "../services/ColumnsMetadataService";

type Props = {
  title: string;
  summary: string;
  columns: Array<string>;
  data?: Array<any>;
  summaryBelow: boolean;
  isPreview?: boolean;
  hideLegend?: boolean;
  horizontalScroll?: boolean;
  setWidthPercent?: (widthPercent: number) => void;
  significantDigitLabels: boolean;
  colors?: {
    primary: string | undefined;
    secondary: string | undefined;
  };
  columnsMetadata: Array<any>;
};

const ColumnChartWidget = (props: Props) => {
  const chartRef = useRef(null);
  const [columnsHover, setColumnsHover] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState<Array<string>>([]);
  const [chartLoaded, setChartLoaded] = useState(false);
  const { yAxisLargestValue, yAxisMargin } = useYAxisMetadata(
    chartRef,
    chartLoaded,
    props.significantDigitLabels
  );

  const colors = useColors(
    props.columns.length,
    props.colors?.primary,
    props.colors?.secondary
  );

  const pixelsByCharacter = 8;
  const previewWidth = 480;
  const fullWidth = 960;

  const getOpacity = useCallback(
    (dataKey) => {
      if (!columnsHover) {
        return 1;
      }
      return columnsHover === dataKey ? 1 : 0.2;
    },
    [columnsHover]
  );

  const { data, columns } = props;
  const xAxisType = useCallback(() => {
    return data && data.every((row) => typeof row[columns[0]] === "number")
      ? "number"
      : "category";
  }, [data, columns]);

  const toggleColumns = (e: any) => {
    if (hiddenColumns.includes(e.dataKey)) {
      const hidden = hiddenColumns.filter((column) => column !== e.dataKey);
      setHiddenColumns(hidden);
    } else {
      setHiddenColumns([...hiddenColumns, e.dataKey]);
    }
  };

  /**
   * Calculate the width percent out of the total width
   * depending on the container. Width: (largestHeader + 1) *
   * headersCount * pixelsByCharacter + marginLeft + marginRight
   */
  const widthPercent =
    (((UtilsService.getLargestHeader(columns, data) + 1) *
      (data ? data.length : 0) *
      pixelsByCharacter +
      50 +
      50) *
      100) /
    (props.isPreview ? previewWidth : fullWidth);

  useEffect(() => {
    if (props.setWidthPercent) {
      props.setWidthPercent(widthPercent);
    }
  }, [widthPercent]);

  return (
    <div
      className={`overflow-hidden${
        widthPercent > 100 && props.horizontalScroll ? " scroll-shadow" : ""
      }`}
    >
      <h2 className={`margin-bottom-${props.summaryBelow ? "4" : "1"}`}>
        {props.title}
      </h2>
      {!props.summaryBelow && (
        <MarkdownRender
          source={props.summary}
          className="usa-prose margin-top-0 margin-bottom-4 chartSummaryAbove"
        />
      )}
      {data && data.length && (
        <ResponsiveContainer
          width={
            props.horizontalScroll ? `${Math.max(widthPercent, 100)}%` : "100%"
          }
          height={300}
        >
          <BarChart
            className="column-chart"
            data={props.data}
            margin={{ right: 0, left: yAxisMargin }}
            ref={(el: CategoricalChartWrapper) => {
              chartRef.current = el;
              setChartLoaded(!!el);
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={props.columns.length ? props.columns[0] : ""}
              type={xAxisType()}
              padding={{ left: 50, right: 50 }}
              domain={["dataMin", "dataMax"]}
              interval={props.horizontalScroll ? 0 : "preserveStartEnd"}
              scale={xAxisType() === "number" ? "linear" : "auto"}
            />
            <YAxis
              type="number"
              tickFormatter={(tick: any) => {
                return TickFormatter.format(
                  Number(tick),
                  yAxisLargestValue,
                  props.significantDigitLabels
                );
              }}
            />
            <Tooltip
              cursor={{ fill: "#F0F0F0" }}
              isAnimationActive={false}
              formatter={(value: Number | String, name: string) => {
                return typeof value === "number"
                  ? ColumnsMetadataService.formatNumber(
                      value,
                      props.columnsMetadata.some((c) => c.columnName === name)
                        ? props.columnsMetadata.find(
                            (c) => c.columnName === name
                          ).numberType
                        : undefined,
                      props.columnsMetadata.some((c) => c.columnName === name)
                        ? props.columnsMetadata.find(
                            (c) => c.columnName === name
                          ).currencyType
                        : undefined
                    )
                  : value.toLocaleString();
              }}
            />
            {!props.hideLegend && (
              <Legend
                verticalAlign="top"
                onClick={toggleColumns}
                onMouseLeave={(e) => setColumnsHover(null)}
                onMouseEnter={(e) => setColumnsHover(e.dataKey)}
              />
            )}
            {props.columns.length &&
              props.columns.slice(1).map((column, index) => {
                return (
                  <Bar
                    dataKey={column}
                    fill={colors[index]}
                    key={index}
                    fillOpacity={getOpacity(column)}
                    hide={hiddenColumns.includes(column)}
                    isAnimationActive={false}
                  />
                );
              })}
          </BarChart>
        </ResponsiveContainer>
      )}
      {props.summaryBelow && (
        <MarkdownRender
          source={props.summary}
          className="usa-prose margin-top-1 margin-bottom-0 chartSummaryBelow"
        />
      )}
    </div>
  );
};

export default ColumnChartWidget;
