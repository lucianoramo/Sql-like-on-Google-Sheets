const _MS_PER_DAY = 1000 * 60 * 60 * 24;
function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function timePerPhase() {
  // referenciando as planilhas a serem trabalhadas
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const wsToDone = ss.getSheetByName("to_done")
  const wsWork = ss.getSheetByName("worklog")

  // capturando os dados da planilhas
  const toDoneData = wsToDone.getRange(2, 1, wsToDone.getLastRow() - 1, 6).getValues()
  const workLogData = wsWork.getRange(2, 2, wsWork.getLastRow() - 1, 3).getValues()
  const tarefas = workLogData

  /*[
    ["SMS-305", "Duplicar a página de Contato do Mundo SENAI Site (Django)"],
    ["SA-93", "[SENAI AUTONOMIA]Front-end :: Aba de Cursos: Exibição das informações."],
    ["SMS-45", "Projeto de Interface (UI)"],
    ["PTRT-17", "Projeto de Interface (UI)"]
  ]*/

  let cardCollection = []

  cardsObj = tarefas.map((item) => {
    let obj = {}
    const dataFiltered = toDoneData.filter((card) => card[1] === item[0])
    //console.log(`length: ${dataFiltered.length}`)

    const dataInicial = new Date(dataFiltered[0][3])
    const dataFinal = new Date(dataFiltered[dataFiltered.length - 1][3])

    obj.key = dataFiltered[0][1]
    obj.project = item[1]
    obj.description = item[2]
    obj.numPhases = dataFiltered.length
    obj.dataInicial = dataInicial.toLocaleDateString("pt-BR")
    obj.dataFinal = dataFinal.toLocaleDateString("pt-BR")
    obj.daysToFinish = dateDiffInDays(dataFinal, dataInicial)
    obj.phases = []


    for (var i = dataFiltered.length - 1; i >= 0; i--) {
      if (i < dataFiltered.length - 1) {
        const d1 = new Date(dataFiltered[i][3])
        const d2 = new Date(dataFiltered[i + 1][3])
        const objPhase = {
          phase: `${dataFiltered[i][4]} - ${dataFiltered[i][5]}`,
          days: dateDiffInDays(d2, d1)
        }
        obj.phases.push(objPhase)
        // console.log(`[${dataFiltered[i][1]}]: ${dataFiltered[i][4]} | ${dataFiltered[i][5]} | ${dateDiffInDays(d2, d1)} days`)
      }
    }
    //console.log(`[${dataFiltered[0][1]}]: Total days: ${dateDiffInDays(dataFinal, dataInicial)} days`)
    //console.log(obj)
    cardCollection.push(obj)


  })

  //console.log(`Total cards: ${JSON.stringify(cardsObj)}`)
  /*const topN = (arr, n) => {
    if (n > arr.length) {
      return false;
    }
    return arr
      .slice()
      .sort((a, b) => {
        return b.daysToFinish - a.daysToFinish
      })
      .slice(0, n);
  };*/
  console.log(`Maior: ${topN(cardCollection, 2)[0].daysToFinish}`)
  console.log(`Segundo Maior: ${topN(cardCollection, 2)[1].daysToFinish}`)

  function topNPhases(arr, phaseToSearch) {

    //phaseToSearch = 'QA'
    let result = []
    //const dataFiltered = arr.filter((item) => item.key[1] === item[0])

    arr.forEach((item) => {

      let obj = {}

      const phases = item.phases

      const arrResultPhases = phases.forEach((r) => {

        if (r.phase.indexOf(phaseToSearch) > 0) {
          obj.key = item.key
          obj.actualPhase = r.phase
          obj.daysToFinish = r.days
          result.push(obj)
        }



      })



    })


    console.log(`Result Phases: ${result[0].key} | ${result[0].actualPhase} | ${result[0].daysToFinish}`)

    return topN(result, 20)
  }

  top20 = topNPhases(cardCollection, "HOMOLOGAÇÃO")

  console.log(`Resultados: ${JSON.stringify(top20)}`)



  //return cardsObj
  return topN(cardCollection, 20)
}

function topN(arr, n) {
  if (n > arr.length) {
    return false;
  }
  return arr
    .slice()
    .sort((a, b) => {
      return b.daysToFinish - a.daysToFinish
    })
    .slice(0, n);
};



function joinTables() {
  //endereçando os sheets de trabalho
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const wsWork = ss.getSheetByName("worklog")
  const wsProj = ss.getSheetByName("projetos")
  const wsJoin = ss.getSheetByName("join")
  const wsConfig = ss.getSheetByName("config")
  const wsToDone = ss.getSheetByName("to_done")
  const wsLoggedHours = ss.getSheetByName("horas_detalhes")
  

  //Recupera a ultima linha processada 
  const lastProcessedRow = parseInt(wsConfig.getRange("B1").getValue())

  // Ultima linha atual da planilha
  const actualLastRow = wsWork.getRange(wsWork.getLastRow(), 1).getRow()

  //Se existem linhas não processadas 
  if (actualLastRow <= lastProcessedRow) {
    console.log(`Nada a processar`)
  } else {

    //Recupera os dados
    const linesToWrite = actualLastRow - lastProcessedRow
    const worklogData = wsWork.getRange(lastProcessedRow + 1, 1, linesToWrite, 17).getValues()
    const projectsData = wsProj.getRange(2, 1, wsProj.getLastRow() - 1, 16).getValues()
    const toDoneData = wsToDone.getRange(2, 1, wsToDone.getLastRow() - 1, 6).getValues()
    const loggedHoursData = wsLoggedHours.getRange(2, 1, wsLoggedHours.getLastRow() - 1, 11).getValues()


    console.log(`Linha ${lastProcessedRow + 1}: ${worklogData[0]}`)
    console.log(`WORKLOG - Quantidade de Linhas : ${worklogData.length}`)
    console.log(`TODONE - Quantidade de Linhas : ${toDoneData.length}`)
    console.log(`LOGGED HOURS - Quantidade de Linhas : ${loggedHoursData.length}`)

    //inicia o o array que vai receber os dados apos o Join
    let joinedData = []

    worklogData.map(function (item, index) {

      //Dados complementares que estão linkados ao projeto
      const dadosComplementares = projectsData.find((card) => {
        return card[0] === item[2]
      })
      if (dadosComplementares) {
        item.push(dadosComplementares[7], dadosComplementares[8], dadosComplementares[9], dadosComplementares[10], dadosComplementares[11], dadosComplementares[12], dadosComplementares[13], dadosComplementares[14])
      } else {
        item.push("", "", "", "", "", "", "", "")
      }
      //console.log(`Exemplo de linha capturada: ${item} `)

      //dados complementares da transição para DONE
      const dataDone = toDoneData.find((data) => {
        return data[1] === item[1] && data[5].toString().toLowerCase() === 'done'
      })


      // Acrescenta coluna da data ao array
      if (dataDone) {
        item.push(dataDone[3])
      } else {
        item.push(["", "", "", "", "", ""])
      }

      //Acrescenta coluna de Last Logged Hours
      const lastLoggedHour = [...loggedHoursData].reverse().find((data) => {
        return data[0] === item[1]
      })
      if (lastLoggedHour) {
        item.push(lastLoggedHour[10])
      } else {
        item.push("")
      }
      console.log(`lastLoggedHour : ${lastLoggedHour[10]}`)

      //console.log(`DataDone : ${dataDone}`)

      //Adiciona a linha completa ao array
      joinedData.push(item)

    }) //END worklogData.map

    const rangeToWrite = wsJoin.getRange(lastProcessedRow + 1, 1, joinedData.length, joinedData[0].length).setValues(joinedData)

    const newProcessedRow = lastProcessedRow + linesToWrite

    wsConfig.getRange("B1").setValue(newProcessedRow)

    //console.log(`Exemplo de linha capturada: ${ worklogData[0]} `)
    //console.log(`Linhas Capturadas: ${joinedData[0].length} `)
  }
}
