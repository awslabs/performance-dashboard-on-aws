import React from "react";
import { render, fireEvent } from "@testing-library/react";
import EmptyContentBox from "../EmptyContentBox";

describe("EmptyContentBox", () => {
  test("renders an empty box", async () => {
    const wrapper = render(<EmptyContentBox />);
    expect(wrapper.container).toMatchSnapshot();
  });

  test("calls the onClick callback when button is pressed", async () => {
    const onClick = jest.fn();
    const wrapper = render(<EmptyContentBox onClick={onClick} />);
    fireEvent.click(wrapper.getByRole("button"));
    expect(onClick).toBeCalled();
  });
});