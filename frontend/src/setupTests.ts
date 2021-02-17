// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";
import "mutationobserver-shim";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ReactModal from "react-modal";
import i18n from "./i18n";

jest.mock("./hooks");

dayjs.extend(relativeTime);
ReactModal.setAppElement(document.createElement("div"));
i18n();
