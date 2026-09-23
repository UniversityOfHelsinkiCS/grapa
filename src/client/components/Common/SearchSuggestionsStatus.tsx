import { useTranslation } from 'react-i18next'

import { VisuallyHidden } from './HiddenLabel'

interface SearchSuggestionsStatusProps {
  open: boolean
  loading: boolean
  count: number
  loadingText: string
  noOptionsText: string
}

const SearchSuggestionsStatus = ({
  open,
  loading,
  count,
  loadingText,
  noOptionsText,
}: SearchSuggestionsStatusProps) => {
  const { t } = useTranslation()

  const message = () => {
    if (!open) return ''
    if (loading) return loadingText
    if (count === 0) return noOptionsText

    return t('common:userSearchSuggestions', { count })
  }

  return (
    <VisuallyHidden role="status" aria-live="polite">
      {message()}
    </VisuallyHidden>
  )
}

export default SearchSuggestionsStatus
