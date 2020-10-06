import React from "react";
import { Widget } from "../models";
import LineChartPreview from "../components/LineChartPreview";
import ColumnChartPreview from "../components/ColumnChartPreview";
import BarChartPreview from "../components/BarChartPreview";
import PartWholeChartPreview from "../components/PartWholeChartPreview";
import TablePreview from "../components/TablePreview";
import TextWidget from "../components/TextWidget";

interface Props {
  widget: Widget;
}

function WidgetRender(props: Props) {
  const widget = props.widget;

  if (widget.widgetType === "Text") {
    return <TextWidget widget={widget} />;
  }

  const keys =
    widget &&
    widget.content &&
    widget.content.data &&
    widget.content.data.length
      ? (Object.keys(widget.content.data[0]) as Array<string>)
      : [];

  if (widget.widgetType === "Table") {
    return (
      <TablePreview
        title={widget.content.title}
        headers={keys}
        data={widget.content.data}
      />
    );
  }

  if (widget.widgetType === "Chart") {
    const { content } = widget;
    switch (content.chartType) {
      case "LineChart":
        return (
          <LineChartPreview
            title={widget.content.title}
            lines={keys}
            data={widget.content.data}
          />
        );

      case "ColumnChart":
        return (
          <ColumnChartPreview
            title={widget.content.title}
            columns={keys}
            data={widget.content.data}
          />
        );

      case "BarChart":
        return (
          <BarChartPreview
            title={widget.content.title}
            bars={keys}
            data={widget.content.data}
          />
        );

      case "PartWholeChart":
        return (
          <PartWholeChartPreview
            title={widget.content.title}
            parts={keys}
            data={widget.content.data}
          />
        );
    }
  }

  return null;
}

export default WidgetRender;