import multer from 'multer'
import { inTest } from '../../config'

const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

const storage = () => {
  console.log('Storage starting')
  try {
    if (inTest) {
      return multer.memoryStorage()
    }
    return multer.diskStorage({
      destination: PATH_TO_FOLDER,
    })
  } catch (e) {
    console.log('storage failed. Error starting from next line')
    console.log(e)
    throw e
  }
}

const upload = multer({ storage: storage() }).fields([
  { name: 'data', maxCount: 1 },
  { name: 'researchPlan', maxCount: 1 },
  { name: 'waysOfWorking', maxCount: 1 },
])

export default upload
