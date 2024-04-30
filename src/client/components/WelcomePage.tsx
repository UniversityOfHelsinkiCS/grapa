import dayjs from 'dayjs'
import Box from '@mui/material/Box'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { ThesisData as Thesis } from '@backend/types'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'

const programs = [
  {
    key: 'KH50_001',
    name: {
      fi: 'Matemaattisten tieteiden kandiohjelma',
      en: "Bachelor's Programme in Mathematical Sciences",
      sv: 'Kandidatsprogrammet i matematiska vetenskaper',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'KH50_002',
    name: {
      fi: 'Fysikaalisten tieteiden kandiohjelma',
      en: "Bachelor's Programme in Physical Sciences",
      sv: 'Kandidatprogrammet i fysikaliska vetenskaper',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'KH50_003',
    name: {
      fi: 'Kemian kandiohjelma',
      en: "Bachelor's Programme in Chemistry",
      sv: 'Kandidatprogrammet i kemi',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'KH50_004',
    name: {
      fi: 'Matematiikan, fysiikan ja kemian opettajan kandiohjelma',
      en: "Bachelor's Programme for Teachers of Mathematics, Physics and Chemistry",
      sv: 'Kandidatprogrammet för ämneslärare i matematik, fysik och kemi',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'KH50_005',
    name: {
      fi: 'Tietojenkäsittelytieteen kandiohjelma',
      en: "Bachelor's Programme in Computer Science",
      sv: 'Kandidatprogrammet i datavetenskap',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'KH50_007',
    name: {
      fi: 'Maantieteen kandiohjelma',
      en: "Bachelor's Programme in Geography",
      sv: 'Kandidatprogrammet i geografi',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'KH50_008',
    name: {
      en: 'Bachelor’s Programme in Science',
      fi: 'Luonnontieteiden kandiohjelma',
      sv: 'Kandidatprogrammet i naturvetenskaper',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'KH50_006',
    name: {
      fi: 'Geotieteiden kandiohjelma',
      en: "Bachelor's Programme in Geosciences",
      sv: 'Kandidatsprogrammet i geovetenskap',
    },
    level: 'bachelor',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'MH50_001',
    name: {
      fi: 'Matematiikan ja tilastotieteen maisteriohjelma',
      en: "Master's Programme in Mathematics and Statistics",
      sv: 'Magisterprogrammet i matematik och statistik',
    },
    level: 'master',
    companionFaculties: ['valtiotieteellinen'],
    international: true,
  },
  {
    key: 'MH50_002',
    name: {
      fi: 'Life Science Informatics -maisteriohjelma',
      en: "Master's Programme in Life Science Informatics",
      sv: 'Magisterprogrammet i Life Science Informatics',
    },
    level: 'master',
    companionFaculties: ['bio- ja ympäristötieteellinen'],
    international: true,
  },
  {
    key: 'MH50_003',
    name: {
      fi: 'Teoreettisten ja laskennallisten menetelmien maisteriohjelma',
      en: "Master's Programme in Theoretical and Computational Methods",
      sv: 'Magisterprogrammet i teoretiska och beräkningsmetoder',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_004',
    name: {
      fi: 'Alkeishiukkasfysiikan ja astrofysikaalisten tieteiden maisteriohjelma',
      en: "Master's Programme in Particle Physics and Astrophysical Sciences",
      sv: 'Magisterprogrammet i elementarpartikelfysik och astrofysikaliska vetenskaper',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_005',
    name: {
      fi: 'Materiaalitutkimuksen maisteriohjelma',
      en: "Master's Programme in Materials Research",
      sv: 'Magisterprogrammet i materialforskning',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_006',
    name: {
      fi: 'Ilmakehätieteiden maisteriohjelma',
      en: "Master's Programme in Atmospheric Sciences",
      sv: 'Magisterprogrammet i atmosfärsvetenskaper',
    },
    level: 'master',
    companionFaculties: ['maatalous-metsätieteellinen'],
    international: true,
  },
  {
    key: 'MH50_007',
    name: {
      fi: 'Kemian ja molekyylitieteiden maisteriohjelma',
      en: "Master's Programme in Chemistry and Molecular Sciences",
      sv: 'Magisterprogrammet i kemi och molekylära vetenskaper',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_008',
    name: {
      fi: 'Matematiikan, fysiikan ja kemian opettajan maisteriohjelma',
      en: "Master's Programme for Teachers of Mathematics, Physics and Chemistry",
      sv: 'Magisterprogrammet för ämneslärare i matematik, fysik och kemi',
    },
    level: 'master',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'MH50_009',
    name: {
      fi: 'Tietojenkäsittelytieteen maisteriohjelma',
      en: "Master's Programme in Computer Science",
      sv: 'Magisterprogrammet i datavetenskap',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_010',
    name: {
      fi: 'Datatieteen maisteriohjelma',
      en: "Master's Programme in Data Science",
      sv: 'Magisterprogrammet i data science',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_011',
    name: {
      fi: 'Geologian ja geofysiikan maisteriohjelma',
      en: "Master's Programme in Geology and Geophysics",
      sv: 'Magisterprogrammet i geologi och geofysik',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_012',
    name: {
      fi: 'Maantieteen maisteriohjelma',
      en: "Master's Programme in Geography",
      sv: 'Magisterprogrammet i geografi',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'MH50_013',
    name: {
      fi: 'Kaupunkitutkimuksen ja suunnittelun maisteriohjelma',
      en: "Master's Programme in Urban Studies and Planning",
      sv: 'Magisterprogrammet i urbana studier och planering',
    },
    level: 'master',
    companionFaculties: [
      'bio- ja ympäristötieteellinen',
      'valtiotieteellinen',
      'humanistinen',
    ],
    international: true,
  },
  {
    key: 'MH50_014',
    name: {
      fi: 'Nordic Master Programme in Environmental Changes at Higher Latitudes',
      en: 'Nordic Master Programme in Environmental Changes at Higher Latitudes',
      sv: 'Nordic Master Programme in Environmental Changes at Higher Latitudes',
    },
    level: 'master',
    companionFaculties: [],
    international: true,
  },
  {
    key: 'T923102',
    name: {
      fi: 'Geotieteiden tohtoriohjelma',
      en: 'Doctoral Programme in Geosciences',
      sv: 'Doktorandprogrammet i geovetenskap',
    },
    level: 'doctoral',
    companionFaculties: ['humanistinen'],
    international: false,
  },
  {
    key: 'T923103',
    name: {
      fi: 'Ilmakehätieteiden tohtoriohjelma',
      en: 'Doctoral Programme in Atmospheric Sciences',
      sv: 'Doktorandprogrammet i atmosfärvetenskap',
    },
    level: 'doctoral',
    companionFaculties: ['maatalous-metsätieteellinen'],
    international: false,
  },
  {
    key: 'T923104',
    name: {
      fi: 'Kemian ja molekyylitutkimuksen tohtoriohjelma',
      en: 'Doctoral Programme in Chemistry and Molecular Research',
      sv: 'Doktorandprogrammet i kemi och molekylära vetenskaper',
    },
    level: 'doctoral',
    companionFaculties: ['farmasia'],
    international: false,
  },
  {
    key: 'T923105',
    name: {
      fi: 'Matematiikan ja tilastotieteen tohtoriohjelma',
      en: 'Doctoral Programme in Mathematics and Statistics',
      sv: 'Doktorandprogrammet i matematik och statistik',
    },
    level: 'doctoral',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'T923106',
    name: {
      fi: 'Materiaalitutkimuksen ja nanotieteiden tohtoriohjelma',
      en: 'Doctoral Programme in Materials Research and Nanoscience',
      sv: 'Doktorandprogrammet i materialforskning och nanovetenskap',
    },
    level: 'doctoral',
    companionFaculties: ['farmasia'],
    international: false,
  },
  {
    key: 'T923107',
    name: {
      fi: 'Tietojenkäsittelytieteen tohtoriohjelma',
      en: 'Doctoral Programme in Computer Science',
      sv: 'Doktorandprogrammet i datavetenskap',
    },
    level: 'doctoral',
    companionFaculties: [],
    international: false,
  },
  {
    key: 'T923101',
    name: {
      fi: 'Alkeishiukkasfysiikan ja maailmankaikkeuden tutkimuksen tohtoriohjelma',
      en: 'Doctoral Programme in Particle Physics and Universe Sciences',
      sv: 'Doktorandprogrammet i elementarpartikelfysik och kosmologi',
    },
    level: 'doctoral',
    companionFaculties: [],
    international: false,
  },
]

const HelloWorld = () => {
  const [theses, setTheses] = useState<Thesis[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editedTesis, setEditedThesis] = useState<Thesis | null>(null)
  const [deletedThesis, setDeletedThesis] = useState<Thesis | null>(null)

  // TODO: use react-query for data fetching
  useEffect(() => {
    fetch('/api/theses')
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
        setTheses(data)
      })
  }, [])

  const columns: GridColDef<Thesis>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'programId',
      headerName: 'Program',
      width: 350,
      valueGetter: (value, row) =>
        programs.find((program) => program.key === row.programId)?.name.en,
      // editable: true,
    },
    {
      field: 'topic',
      headerName: 'Topic',
      width: 350,
      // editable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 310,
      // editable: true,number
    },
    {
      field: 'startDate',
      headerName: 'Start date',
      sortable: false,
      width: 360,
      valueGetter: (value, row) => dayjs(row.startDate).format('YYYY-MM-DD'),
      // valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
    },
    {
      field: 'targetDate',
      headerName: 'Target date',
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 360,
      valueGetter: (value, row) => dayjs(row.targetDate).format('YYYY-MM-DD'),
      // valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
    },
    {
      field: 'actions',
      type: 'actions',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          onClick={() => {
            setEditDialogOpen(true)
            setEditedThesis(params.row as Thesis)
          }}
          label="Edit"
          key="edit"
          showInMenu
          icon={<EditIcon />}
          closeMenuOnClick
        />,
        <GridActionsCellItem
          onClick={() => {
            setDeleteDialogOpen(true)
            setDeletedThesis(params.row as Thesis)
          }}
          label="Delete"
          key="delete"
          showInMenu
          icon={<DeleteIcon />}
          closeMenuOnClick
        />,
      ],
    },
  ]

  return (
    <>
      <Box sx={{ width: '80%' }}>
        <DataGrid
          rows={theses}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 100,
              },
            },
          }}
          pageSizeOptions={[100]}
          disableRowSelectionOnClick
        />
      </Box>
      {editedTesis && (
        <Dialog
          fullWidth
          maxWidth="lg"
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false)
            setEditedThesis(null)
          }}
          PaperProps={{
            component: 'form',
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              const formJson = Object.fromEntries((formData as any).entries())

              // TODO: use react-query for data fetching
              fetch(`/api/theses/${editedTesis.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(formJson),
              })
                .then((res) => res.json())
                .then((data) => {
                  console.log(data)
                })

              setEditDialogOpen(false)
              setEditedThesis(null)
            },
          }}
        >
          <DialogTitle>Subscribe</DialogTitle>
          <DialogContent>
            <Stack spacing={6}>
              <TextField
                autoFocus
                required
                margin="dense"
                id="topic"
                name="topic"
                // TODO: use react-i18next for all strings
                label="Topic"
                type="email"
                value={editedTesis.topic}
                onChange={(event) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    topic: event.target.value,
                  }))
                }}
                fullWidth
                variant="standard"
              />
              <FormControl fullWidth>
                <InputLabel id="program-select-label">Program</InputLabel>
                <Select
                  value={editedTesis.programId}
                  label="Program"
                  name="programId"
                  onChange={(event) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      programId: event.target.value as Thesis['programId'],
                    }))
                  }}
                >
                  {programs.map((program) => (
                    <MenuItem key={program.key} value={program.key}>
                      {program.name.en}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  value={editedTesis.status}
                  label="Age"
                  name="status"
                  onChange={(event) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      status: event.target.value as Thesis['status'],
                    }))
                  }}
                >
                  <MenuItem value="PLANNING">Planning</MenuItem>
                  <MenuItem value="STARTED">Started</MenuItem>
                  <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start date"
                  name="startDate"
                  value={dayjs(editedTesis.startDate)}
                  onChange={(date) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      startDate: date.format('YYYY-MM-DD'),
                    }))
                  }}
                />
                <DatePicker
                  label="Target date"
                  name="targetDate"
                  value={dayjs(editedTesis.targetDate)}
                  onChange={(date) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      targetDate: date.format('YYYY-MM-DD'),
                    }))
                  }}
                />
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditDialogOpen(false)
                setEditedThesis(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </DialogActions>
        </Dialog>
      )}
      {deletedThesis && (
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedThesis(null)
          }}
        >
          <DialogTitle>Delete thesis</DialogTitle>
          <DialogContent>
            Are you sure you want to delete the thesis with ID{' '}
            {deletedThesis.id}?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                fetch(`/api/theses/${deletedThesis.id}`, {
                  method: 'DELETE',
                }).then((data) => {
                  console.log(data)
                  setDeleteDialogOpen(false)
                  setDeletedThesis(null)
                })
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}

export default HelloWorld
