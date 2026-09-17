import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Box, Link } from '@mui/material'
import { NewTabHint } from './HiddenLabel'

interface MarkdownProps {
  children: string
}

const Markdown = ({ children }: MarkdownProps) => {
  if (!children) return null

  return (
    <Box
      sx={{
        whiteSpace: 'normal',
        '& p': {
          mt: 0,
          mb: 2,
        },
        '& p:last-of-type': {
          mb: 0,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node: _node, children, ...props }) => (
            <Link
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {children}
              <NewTabHint />
            </Link>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </Box>
  )
}

export default Markdown
