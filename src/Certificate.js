import React, { useState } from 'react'
import {
  TextField,
  Button,
  Select,
  MenuItem,
  TextareaAutosize,
  Grid,
} from '@material-ui/core'
import { PDFDocument, rgb } from 'pdf-lib'
import * as fontkit from 'fontkit'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  process.env.PUBLIC_URL + '/pdf.worker.js'

const Descricao =
  'A Direção do Colégio Estadual Cívico-Militar Gregório Szeremeta \n' +
  'confere ao estudante o certificado de Menção Honrosa por ter alcançado \n' +
  'o primeiro lugar do ano turma na Prova Paraná - 1ª edição de 2023.'

function Certificate() {
  const [names, setNames] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [additionalText, setAdditionalText] = useState(Descricao)
  const [additionalTextFont, setAdditionalTextFont] = useState('DejaVuSans')
  const [fontSize, setFontSize] = useState('48')
  const [font, setFont] = useState('DejaVuSans')

  let savedPDFBytes = null

  const generatePDFForStudent = async (studentName) => {
    const formatDateToBrazilian = (date) => {
      const [year, month, day] = date.split('-')
      return `${day}/${month}/${year}`
    }
    const formattedDate = formatDateToBrazilian(date)

    const pdfBytes = await fetch('template.pdf').then((res) =>
      res.arrayBuffer()
    )
    const pdfDoc = await PDFDocument.load(pdfBytes)
    pdfDoc.registerFontkit(fontkit)

    // FONTE DIFERENTE PARA NOME DO ALUNO
    let embeddedFont
    switch (font) {
      case 'DejaVuSans':
        const dejaVuBytes = await fetch('DejaVuSans.ttf').then((res) =>
          res.arrayBuffer()
        )
        embeddedFont = await pdfDoc.embedFont(dejaVuBytes)
        break
      case 'ScriptMTBold':
        const scriptMTBoldBytes = await fetch('script-mt-bold.ttf').then(
          (res) => res.arrayBuffer()
        )
        embeddedFont = await pdfDoc.embedFont(scriptMTBoldBytes)
        break
      case 'TomNR':
        const tomNR = await fetch('tomnr.ttf').then((res) => res.arrayBuffer())
        embeddedFont = await pdfDoc.embedFont(tomNR)
        break
      case 'AlefRegular':
        const alefRegular = await fetch('Alef-Regular.ttf').then((res) =>
          res.arrayBuffer()
        )
        embeddedFont = await pdfDoc.embedFont(alefRegular)
        break
      case 'BodoniFLF':
        const bodoniFLF = await fetch('BodoniFLF.ttf').then((res) =>
          res.arrayBuffer()
        )
        embeddedFont = await pdfDoc.embedFont(bodoniFLF)
        break
      default:
        const defaultFontBytes = await fetch('DejaVuSans.ttf').then((res) =>
          res.arrayBuffer()
        )
        embeddedFont = await pdfDoc.embedFont(defaultFontBytes)
        break
    }

    // FONTE DIFERENTE PARA O TEXTO ADICIONAL
    const getEmbeddedFontForAdditionalText = async () => {
      switch (additionalTextFont) {
        case 'DejaVuSans':
          const dejaVuBytes = await fetch('DejaVuSans.ttf').then((res) =>
            res.arrayBuffer()
          )
          return await pdfDoc.embedFont(dejaVuBytes)
        case 'ScriptMTBold':
          const scriptMTBoldBytes = await fetch('script-mt-bold.ttf').then(
            (res) => res.arrayBuffer()
          )
          return await pdfDoc.embedFont(scriptMTBoldBytes)
        case 'TomNR':
          const tomNR = await fetch('tomnr.ttf').then((res) =>
            res.arrayBuffer()
          )
          return await pdfDoc.embedFont(tomNR)
        case 'AlefRegular':
          const alefRegular = await fetch('Alef-Regular.ttf').then((res) =>
            res.arrayBuffer()
          )
          return await pdfDoc.embedFont(alefRegular)
        case 'BodoniFLF':
          const bodoniFLF = await fetch('BodoniFLF.ttf').then((res) =>
            res.arrayBuffer()
          )
          return await pdfDoc.embedFont(bodoniFLF)
        default:
          const defaultFontBytes = await fetch('DejaVuSans.ttf').then((res) =>
            res.arrayBuffer()
          )
          return await pdfDoc.embedFont(defaultFontBytes)
      }
    }

    const additionalTextEmbeddedFont = await getEmbeddedFontForAdditionalText()

    const page = pdfDoc.getPages()[0]

    const adjustFontSizeForName = (studentName, font, initialSize) => {
      let adjustedSize = initialSize
      const maxWidth = 400 // Ajuste conforme necessário
      let textWidth = font.widthOfTextAtSize(studentName, adjustedSize)

      while (textWidth > maxWidth && adjustedSize > 10) {
        // 10 é o tamanho mínimo da fonte
        adjustedSize -= 1 // Reduz o tamanho da fonte em 1
        textWidth = font.widthOfTextAtSize(studentName, adjustedSize)
      }

      return adjustedSize
    }

    const fontSizeForName = adjustFontSizeForName(
      studentName,
      embeddedFont,
      parseInt(fontSize)
    )

    page.drawText(studentName, {
      x: 99,
      y: 180,
      font: embeddedFont,
      size: fontSizeForName,
      color: rgb(0, 0, 0),
    })

    page.drawText(formattedDate, {
      x: 99,
      y: 82,
      size: 21,
      color: rgb(0, 0, 0),
    })

    page.drawText(additionalText, {
      x: 99,
      y: 340,
      size: 16,
      font: additionalTextEmbeddedFont,
      color: rgb(0, 0, 0),
    })

    return await pdfDoc.save()
  }

  const handleSubmit = async () => {
    const firstStudent = names.split(',')[0]
    if (firstStudent) {
      savedPDFBytes = await generatePDFForStudent(firstStudent)
      renderPDFPreview(savedPDFBytes)
    }
  }

  const downloadPDF = async () => {
    const students = names.split(',')
    for (let student of students) {
      savedPDFBytes = await generatePDFForStudent(student)

      const blob = new Blob([savedPDFBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `certificado_${student}.pdf`

      document.body.appendChild(link)
      link.click()

      // Espera um pouco entre cada download para evitar problemas
      await new Promise((resolve) => setTimeout(resolve, 1000))

      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  const renderPDFPreview = (pdfBytes) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })

    const pdfjsViewer = pdfjsLib.getDocument(URL.createObjectURL(blob))
    pdfjsViewer.promise.then((pdf) => {
      pdf.getPage(1).then((page) => {
        const scale = 1.5
        const viewport = page.getViewport({ scale })

        const canvas = document.getElementById('pdf-preview')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }
        page.render(renderContext)
      })
    })
  }

  return (
    <div style={{ padding: '140px' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label='Nomes (separados por vírgula e sem espaço entre eles)'
            fullWidth
            value={names}
            onChange={(e) => setNames(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label='Data'
            type='date'
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosize
            minRows={6}
            placeholder={Descricao}
            style={{ width: '100%' }}
            value={additionalText}
            onChange={(e) => setAdditionalText(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Select
            value={additionalTextFont}
            onChange={(e) => setAdditionalTextFont(e.target.value)}
          >
            <MenuItem value='DejaVuSans'>DejaVuSans</MenuItem>
            <MenuItem value='ScriptMTBold'>ScriptMTBold</MenuItem>
            <MenuItem value='AlefRegular'>AlefRegular</MenuItem>
            <MenuItem value='TomNR'>TomNR</MenuItem>
            <MenuItem value='BodoniFLF'>BodoniFLF</MenuItem>
          </Select>
        </Grid>

        <Grid item xs={12}>
          <TextField
            label='Tamanho da Fonte'
            fullWidth
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Select value={font} onChange={(e) => setFont(e.target.value)}>
            <MenuItem value='DejaVuSans'>DejaVuSans</MenuItem>
            <MenuItem value='ScriptMTBold'>ScriptMTBold</MenuItem>
            <MenuItem value='AlefRegular'>AlefRegular</MenuItem>
            <MenuItem value='TomNR'>TomNR</MenuItem>
            <MenuItem value='BodoniFLF'>BodoniFLF</MenuItem>
          </Select>
        </Grid>
        <Grid container item spacing={2} xs={12}>
          <Grid item>
            <Button
              onClick={() => downloadPDF(savedPDFBytes)}
              variant='contained'
              color='secondary'
            >
              Baixar Certificado
            </Button>
          </Grid>
          <Grid item>
            <Button onClick={handleSubmit} variant='contained' color='primary'>
              Visualizar Certificados
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          {/* PREVIEW PDF */}
          <canvas id='pdf-preview'></canvas>
        </Grid>
      </Grid>
    </div>
  )
}

export { Certificate }
