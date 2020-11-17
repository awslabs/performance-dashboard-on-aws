import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FormattingCSV from "../FormattingCSV";

jest.mock("../../hooks");

beforeEach(() => {
  render(<FormattingCSV />, { wrapper: MemoryRouter });
});

test("renders the page title", async () => {
  const title = screen.getByRole("heading", { name: "Formatting CSV files" });
  expect(title).toBeInTheDocument();
});

test("renders a download link for line chart", async () => {
  expect(
    screen.getByRole("button", {
      name: "Download line chart example CSV",
    })
  ).toBeInTheDocument();
});

test("renders a download link for column chart", async () => {
  expect(
    screen.getByRole("button", {
      name: "Download column chart example CSV",
    })
  ).toBeInTheDocument();
});

test("renders a download link for part-to-whole", async () => {
  expect(
    screen.getByRole("button", {
      name: "Download part-to-whole chart example CSV",
    })
  ).toBeInTheDocument();
});

test("renders a download link for table", async () => {
  expect(
    screen.getByRole("button", {
      name: "Download table example CSV",
    })
  ).toBeInTheDocument();
});
