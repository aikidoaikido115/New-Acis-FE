import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "bun:test";
import Example from "@/app/example/page";

describe("Example", () => {
  it("renders heading and description", () => {
    render(<Example />);
    expect(screen.getByText("Hello World!")).toBeInTheDocument();
    expect(screen.getByTestId("desc"))
      .toHaveTextContent("This is test example page");
  });
});
