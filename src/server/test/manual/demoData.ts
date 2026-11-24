// Made-up demo data, also imported by the scenarios, so no imports

export type Language = 'fi' | 'sv' | 'en'
export type Localized = Record<Language, string>

// The server's and browser's "now", a Wednesday mid autumn term
export const NOW = '2026-11-18T12:00:00+02:00'

export const DEPARTMENT = {
  id: 'manual-department',
  name: {
    fi: 'Kaupunkiympäristön laitos',
    sv: 'Institutionen för stadsmiljö',
    en: 'Department of Urban Environment',
  },
}

export const MASTER_PROGRAM = {
  id: 'MH99_001',
  name: {
    fi: 'Kaupunkiekologian maisteriohjelma',
    sv: 'Magisterprogrammet i stadsekologi',
    en: "Master's Programme in Urban Ecology",
  },
}

export const BACHELOR_PROGRAM = {
  id: 'KH99_001',
  name: {
    fi: 'Kaupunkiekologian kandiohjelma',
    sv: 'Kandidatprogrammet i stadsekologi',
    en: "Bachelor's Programme in Urban Ecology",
  },
}

export const STUDY_TRACKS = [
  {
    id: 'manual-track-nature',
    code: 'URB-NAT',
    name: {
      fi: 'Kaupunkiluonto',
      sv: 'Stadsnatur',
      en: 'Urban Nature',
    },
  },
  {
    id: 'manual-track-green',
    code: 'URB-GRN',
    name: {
      fi: 'Viherrakentaminen',
      sv: 'Grönbyggande',
      en: 'Green Infrastructure',
    },
  },
  {
    id: 'manual-track-water',
    code: 'URB-WAT',
    name: {
      fi: 'Kaupunkivesistöt',
      sv: 'Stadsvatten',
      en: 'Urban Waters',
    },
  },
  // Left over from an earlier curriculum, like many tracks in Sisu
  {
    id: 'manual-track-nature-old',
    code: 'URB-NAT-17',
    name: {
      fi: 'Kaupunkiluonto (2017–2020)',
      sv: 'Stadsnatur (2017–2020)',
      en: 'Urban Nature (2017–2020)',
    },
  },
]

// Without ä or ö, like real addresses
const toEmail = (firstName: string, lastName: string) =>
  `${firstName}.${lastName}@example.com`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export type DemoUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  isAdmin?: boolean
  // The permissions' user search only finds users with one
  employeeNumber?: string
  studentNumber?: string
  iamGroups: string[]
}

const staff = (
  key: string,
  firstName: string,
  lastName: string,
  employeeNumber: string
): DemoUser => ({
  id: `manual-${key}`,
  username: `manual${key}`,
  firstName,
  lastName,
  email: toEmail(firstName, lastName),
  employeeNumber,
  iamGroups: ['hy-employees'],
})

const student = (
  key: string,
  firstName: string,
  lastName: string,
  studentNumber: string
): DemoUser => ({
  id: `manual-${key}`,
  username: `manual${key}`,
  firstName,
  lastName,
  email: toEmail(firstName, lastName),
  studentNumber,
  iamGroups: ['hy-mltdk-students'],
})

// The narrator, a programme manager who can approve theses
export const MANAGER = staff('manager', 'Sanna', 'Lehtola', '9000001')
// Already a manager of the master's programme
export const CO_MANAGER = staff('comanager', 'Ville', 'Kaartinen', '9000002')
// Found in the user search and added as a manager in the videos
export const NEW_MANAGER = staff('newmanager', 'Tiina', 'Rautavaara', '9000003')
export const TRACK_MANAGER = staff(
  'trackmanager',
  'Oskari',
  'Hakala',
  '9000004'
)
export const SUPERVISORS = [
  staff('supervisor1', 'Minna', 'Salmela', '9000011'),
  staff('supervisor2', 'Jukka', 'Pelkonen', '9000012'),
  staff('supervisor3', 'Elina', 'Koistinen', '9000013'),
]
export const STUDENTS = [
  student('student1', 'Aino', 'Karjalainen', '019000001'),
  student('student2', 'Leo', 'Nyström', '019000002'),
  student('student3', 'Helmi', 'Turunen', '019000003'),
  student('student4', 'Eetu', 'Mäkinen', '019000004'),
  student('student5', 'Iida', 'Lindqvist', '019000005'),
  student('student6', 'Emil', 'Laaksonen', '019000006'),
  student('student7', 'Veera', 'Heikkinen', '019000008'),
]
// Has a study right but no thesis, starts one in the videos
export const NEW_STUDENT = student(
  'newstudent',
  'Oona',
  'Virtanen',
  '019000007'
)

export const USERS: DemoUser[] = [
  MANAGER,
  CO_MANAGER,
  NEW_MANAGER,
  TRACK_MANAGER,
  ...SUPERVISORS,
  ...STUDENTS,
  NEW_STUDENT,
]

// For students who start a thesis themselves
export const STUDY_RIGHTS: { user: DemoUser; studyTrack: number }[] = [
  { user: NEW_STUDENT, studyTrack: 0 },
]

export type ThesisStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED'

// In the master's programme unless said otherwise, some supervised by the narrator
export const THESES: {
  topic: Localized
  status: ThesisStatus
  inBachelorProgram?: boolean
  // None in the bachelor's programme, it has no study tracks
  studyTrack?: number
  // Months before NOW
  startedMonthsAgo: number
  supervisor: DemoUser
  // The supervisor is the first grader
  secondGrader?: DemoUser
  // The programme manager chosen on the form to handle the thesis
  approver?: DemoUser
  student: DemoUser
  // How many milestones are done
  milestone: number
  isIdle?: boolean
}[] = [
  {
    topic: {
      fi: 'Viherkattojen vaikutus hulevesien laatuun',
      sv: 'Gröna takens inverkan på dagvattnets kvalitet',
      en: 'The effect of green roofs on stormwater quality',
    },
    status: 'IN_PROGRESS',
    studyTrack: 2,
    startedMonthsAgo: 7,
    supervisor: MANAGER,
    secondGrader: SUPERVISORS[0],
    student: STUDENTS[0],
    milestone: 1,
  },
  {
    topic: {
      fi: 'Pölyttäjät kaupunkien joutomailla',
      sv: 'Pollinerare på urbana ödemarker',
      en: 'Pollinators on urban wastelands',
    },
    status: 'IN_PROGRESS',
    studyTrack: 0,
    startedMonthsAgo: 4,
    supervisor: SUPERVISORS[1],
    secondGrader: SUPERVISORS[0],
    student: STUDENTS[1],
    milestone: 0,
  },
  {
    topic: {
      fi: 'Katupuiden lajivalinta muuttuvassa ilmastossa',
      sv: 'Val av gatuträd i ett föränderligt klimat',
      en: 'Choosing street trees for a changing climate',
    },
    status: 'PLANNING',
    studyTrack: 1,
    startedMonthsAgo: 1,
    supervisor: SUPERVISORS[2],
    approver: MANAGER,
    student: STUDENTS[2],
    milestone: 0,
  },
  {
    topic: {
      fi: 'Asukkaiden kokemukset taskupuistoista',
      sv: 'Invånarnas upplevelser av fickparker',
      en: "Residents' experiences of pocket parks",
    },
    status: 'IN_PROGRESS',
    studyTrack: 1,
    startedMonthsAgo: 10,
    supervisor: MANAGER,
    secondGrader: SUPERVISORS[2],
    student: STUDENTS[3],
    milestone: 3,
  },
  {
    topic: {
      fi: 'Kaupunkipurojen taimenkannat',
      sv: 'Öringbestånden i stadsbäckar',
      en: 'Trout populations in urban streams',
    },
    status: 'COMPLETED',
    studyTrack: 2,
    startedMonthsAgo: 14,
    supervisor: SUPERVISORS[1],
    secondGrader: SUPERVISORS[0],
    student: STUDENTS[4],
    milestone: 3,
  },
  {
    topic: {
      fi: 'Kaupunkimetsien virkistyskäyttö',
      sv: 'Rekreationsbruket av stadsskogar',
      en: 'Recreational use of urban forests',
    },
    status: 'IN_PROGRESS',
    studyTrack: 0,
    startedMonthsAgo: 20,
    supervisor: MANAGER,
    secondGrader: SUPERVISORS[1],
    student: STUDENTS[5],
    milestone: 1,
    // Shown only with idle state tracking on
    isIdle: true,
  },
  {
    topic: {
      fi: 'Lintujen pesintä kaupunkipuistoissa',
      sv: 'Fåglarnas häckning i stadsparker',
      en: 'Bird nesting in urban parks',
    },
    status: 'IN_PROGRESS',
    inBachelorProgram: true,
    startedMonthsAgo: 3,
    supervisor: SUPERVISORS[1],
    student: STUDENTS[6],
    milestone: 0,
  },
]

// The programmes' milestones, also the examples of the instructions
export const MILESTONES: Localized[] = [
  {
    fi: 'Tutkimussuunnitelma lähetetty ohjaajalle',
    sv: 'Planen har skickats till handledaren',
    en: 'Plan sent to the supervisor',
  },
  {
    fi: 'Tutkielman välivaihe lähetetty ohjaajalle (noin 50 % valmis)',
    sv: 'Avhandlingens mellanfas har skickats till handledaren (cirka 50 % klar)',
    en: 'A mid-point version of the thesis sent to the supervisor (approximately 50 % ready)',
  },
  {
    fi: 'Lähes valmis tutkielma lähetetty ohjaajalle (noin 80 % valmis)',
    sv: 'Nästan färdig avhandling skickad till handledaren (cirka 80 % färdig)',
    en: 'Almost completed thesis sent to the supervisor (approximately 80 % ready)',
  },
]

export const TARGET_DATES = ['2027-05-31']
