/* eslint-disable react/no-unknown-property */
/** @jsxImportSource @emotion/react */
import React from 'react'
import { css } from '@emotion/react'
import { diffWords } from 'diff'

interface TextDiffProps {
  leftText: string
  rightText: string
}

const containerStyle = css`
  display: flex;
  justify-content: space-between;
`

const columnStyle = css`
  flex: 1;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
  white-space: pre-wrap;
`

const addedStyle = css`
  background-color: #d4fcbc;
`

const removedStyle = css`
  background-color: #fbb6c2;
`

const getHighlightedText = (leftText: string, rightText: string) => {
  const diff = diffWords(leftText, rightText)
  return diff.map((part, index) => {
    let style
    if (part.added) {
      style = addedStyle
    } else if (part.removed) {
      style = removedStyle
    }
    return (
      <span key={index} css={style}>
        {part.value}
      </span>
    )
  })
}

const TextDiff: React.FC<TextDiffProps> = ({ leftText, rightText }) => {
  return (
    <div css={containerStyle}>
      <div css={columnStyle}>
        <p>{getHighlightedText(leftText, rightText)}</p>
      </div>
    </div>
  )
}

export default TextDiff
