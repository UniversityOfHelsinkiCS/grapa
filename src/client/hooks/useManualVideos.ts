import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BASE_PATH } from '../../config'

export interface ManualVideo {
  slug: string
  title: string
  // Missing in indexes recorded before settings were annotated
  settings?: string[]
  url: string
  durationMs?: number
}

const useManualVideos = () => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const { data: videos = [] } = useQuery({
    queryKey: ['manual-videos', language],
    // Videos are recorded on CI and may be missing, e.g. in local development
    queryFn: async (): Promise<ManualVideo[]> => {
      const response = await fetch(`${BASE_PATH}/manual/${language}/index.json`)
      if (!response.ok) return []
      const index: ManualVideo[] = await response.json()
      return index.map((video) => ({
        ...video,
        url: `${BASE_PATH}${video.url}`,
      }))
    },
    staleTime: Infinity,
    retry: false,
  })

  const videoFor = (setting?: string) =>
    videos.find((video) => setting && video.settings?.includes(setting))

  return { videoFor }
}

export default useManualVideos
