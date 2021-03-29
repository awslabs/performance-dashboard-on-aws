import React, { useState, MutableRefObject } from "react";
// @ts-ignore
import { CategoricalChartWrapper } from "recharts";
import UtilsService from "../services/UtilsService";

type UseYAxisMetadataHook = {
  yAxisLargestValue: number;
  yAxisMargin: number;
};

export function useYAxisMetadata(
  chartRef: MutableRefObject<null>,
  chartLoaded: boolean,
  significantDigitLabels: boolean
): UseYAxisMetadataHook {
  const [yAxisLargestValue, setYAxisLargestValue] = useState(0);
  const [yAxisMargin, setYAxisMargin] = useState(0);

  React.useEffect(() => {
    if (chartRef && chartRef.current) {
      const currentRef = chartRef.current as CategoricalChartWrapper;
      const yAxisMap = currentRef.state.yAxisMap;
      if (yAxisMap && yAxisMap[0]) {
        const largestTick = Math.max(...yAxisMap[0].niceTicks);
        const margin = UtilsService.calculateYAxisMargin(
          largestTick,
          significantDigitLabels
        );

        setYAxisLargestValue(largestTick);
        setYAxisMargin(margin);
      }
    }
  }, [chartRef, chartRef.current, chartLoaded, significantDigitLabels]);

  return {
    yAxisLargestValue,
    yAxisMargin,
  };
}

type UseXAxisMetadataHook = {
  xAxisLargestValue: number;
};

export function useXAxisMetadata(
  chartRef: MutableRefObject<null>,
  chartLoaded: boolean,
  significantDigitLabels: boolean
): UseXAxisMetadataHook {
  const [xAxisLargestValue, setXAxisLargestValue] = useState(0);

  React.useEffect(() => {
    if (chartRef && chartRef.current) {
      const currentRef = chartRef.current as CategoricalChartWrapper;
      const xAxisMap = currentRef.state.xAxisMap;
      if (xAxisMap && xAxisMap[0]) {
        const largestTick = Math.max(...xAxisMap[0].niceTicks);
        setXAxisLargestValue(largestTick);
      }
    }
  }, [chartRef, chartRef.current, chartLoaded, significantDigitLabels]);

  return {
    xAxisLargestValue,
  };
}