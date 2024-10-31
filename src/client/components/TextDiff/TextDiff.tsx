/** @jsxImportSource @emotion/react */
import type { FC } from 'react'
import { css } from '@emotion/react'
import { diffWords } from 'diff'

interface TextDiffProps {
  leftText: string
  rightText: string
}

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

const TextDiff: FC<TextDiffProps> = ({ leftText, rightText }) => {
  return <div>{getHighlightedText(leftText, rightText)}</div>
}

export default TextDiff
