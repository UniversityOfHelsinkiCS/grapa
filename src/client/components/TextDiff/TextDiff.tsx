/* eslint-disable react/no-unknown-property */
/** @jsxImportSource @emotion/react */
import React from 'react';
import { css } from '@emotion/react';
import { diffWords } from 'diff';

interface TextDiffProps {
  leftText: string;
  rightText: string;
}

const containerStyle = css`
  display: flex;
  justify-content: space-between;
  padding: 20px;
`;

const columnStyle = css`
  flex: 1;
  margin: 0 10px;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
`;

const addedStyle = css`
  background-color: #d4fcbc;
`;

const removedStyle = css`
  background-color: #fbb6c2;
`;

const getHighlightedText = (leftText: string, rightText: string) => {
  const diff = diffWords(leftText, rightText);
  return diff.map((part, index) => {
    let style;
    if (part.added) {
      style = addedStyle;
    } else if (part.removed) {
      style = removedStyle;
    }
    return (
      // eslint-disable-next-line react/no-array-index-key
      <span key={index} css={style}>
        {part.value}
      </span>
    );
  });
};

const TextDiff: React.FC<TextDiffProps> = ({ leftText, rightText }) => (
    <div css={containerStyle}>
      <div css={columnStyle}>
        <h3>Left Text</h3>
        <pre>{leftText}</pre>
      </div>
      <div css={columnStyle}>
        <h3>Right Text</h3>
        <pre>{getHighlightedText(leftText, rightText)}</pre>
      </div>
    </div>
  );

export default TextDiff;
