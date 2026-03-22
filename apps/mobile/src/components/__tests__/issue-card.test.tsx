import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { IssueCard } from "../issue-card"

describe("IssueCard", () => {
  it("renders title and description", () => {
    const { getByText } = render(
      <IssueCard
        title="Overlay Permission"
        description="Shept needs to draw over other apps"
        actionLabel="Grant"
        onAction={jest.fn()}
      />,
    )
    expect(getByText("Overlay Permission")).toBeTruthy()
    expect(getByText("Shept needs to draw over other apps")).toBeTruthy()
  })

  it("calls onAction when button pressed", () => {
    const onAction = jest.fn()
    const { getByText } = render(
      <IssueCard
        title="Test"
        description="Desc"
        actionLabel="Fix"
        onAction={onAction}
      />,
    )
    fireEvent.press(getByText("Fix"))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
