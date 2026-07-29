/** @jsxImportSource @emotion/react */
import { css, SerializedStyles } from '@emotion/react'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'
import TextDiff from '../TextDiff/TextDiff'
import { useTranslation } from 'react-i18next'

interface TabPanelProps {
  children?: React.ReactNode
  css?: SerializedStyles
  index: number
  value: number
}

const tabPanelStyle = css`
  flex: 1;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
  white-space: pre-wrap;
`

const CustomTabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`diff-tabpanel-${index}`}
      aria-labelledby={`diff-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const a11yProps = (index: number) => {
  return {
    id: `diff-tab-${index}`,
    'aria-controls': `diff-tabpanel-${index}`,
  }
}

interface Props {
  beforeText: string
  afterText: string
  hideDiff?: boolean
}
const BeforeDiffAfter = ({ beforeText, afterText, hideDiff }: Props) => {
  const { t } = useTranslation()
  const [value, setValue] = useState(hideDiff ? 2 : 1)

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab
            label={t('eventLog:diffView:before')}
            value={0}
            {...a11yProps(0)}
          />
          {!hideDiff && (
            <Tab
              label={t('eventLog:diffView:diff')}
              value={1}
              {...a11yProps(1)}
            />
          )}
          <Tab
            label={t('eventLog:diffView:after')}
            value={2}
            {...a11yProps(2)}
          />
        </Tabs>
      </Box>
      <CustomTabPanel css={tabPanelStyle} value={value} index={0}>
        {beforeText}
      </CustomTabPanel>
      {!hideDiff && (
        <CustomTabPanel css={tabPanelStyle} value={value} index={1}>
          <TextDiff leftText={beforeText} rightText={afterText} />
        </CustomTabPanel>
      )}
      <CustomTabPanel css={tabPanelStyle} value={value} index={2}>
        {afterText}
      </CustomTabPanel>
    </Box>
  )
}

export default BeforeDiffAfter
