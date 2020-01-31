document.body.onload = () => {
  document.body.style.opacity = 1
  $('#header').change()
}

$("#animatible").hide()
let yPos = window.innerHeight/3

document.getElementById('juttu').style.transform = `translate(0px,${yPos}px)`
document.getElementById('parallax').style.backgroundPositionY=`${0.5*yPos}px`
let touchstartY = 0
let touchendY = 0

window.addEventListener('touchstart', (event) => {
  touchstartY = event.changedTouches[0].screenY;
}, false)

window.onmousedown = (event) => {
  touchstartY = event.clientY
}

window.onmouseup = (event) => {
  touchendY = event.clientY
  if(event.target.id !== 'selectstation' && event.target.id !== 'st' ) handleSwipe(event)
}

window.addEventListener('touchend', (event) => {
  touchendY = event.changedTouches[0].screenY;
    handleSwipe(event)
}, false)

const handleSwipe = event => {
   event.myDelta = -9*(touchstartY-touchendY)/window.innerHeight
   parallax(event)
}

const addMouseWheelEventListener = scrollHandler => {
  if (window.addEventListener) {
    window.addEventListener('mousewheel', scrollHandler, false)
    window.addEventListener('DOMMouseScroll', scrollHandler, false)
  } 
  else window.attachEvent("onmousewheel", scrollHandler)
}

const parallax = event => {                                                      // Animation step for parallax effect
  const e = window.event || event 
  const delta = event.myDelta ? event.myDelta : Math.max(-1, Math.min(1, e.wheelDelta || -e.detail))                                              
  const x = document.getElementById('juttu')
  const x2 = document.getElementById("parallax")
  const dy = delta*90
  if( -Math.abs(dy)-x.offsetHeight < (yPos+dy) && (yPos + dy) < window.innerHeight){
    yPos += dy
    x.style.transform =`translate(0px,${yPos}px)`
    x2.style.backgroundPositionY=`${0.5*yPos}px`
  }
}

addMouseWheelEventListener(parallax)

const loadDoc = (url, cfunc) => {                                                  // wrapper function for Ajax call function
  let xhttp
  xhttp=new XMLHttpRequest()
  xhttp.onreadystatechange = async () => {
    if (xhttp.readyState === 4 && xhttp.status == 200) {
      await cfunc(JSON.parse(xhttp.responseText))
    }
  }
  xhttp.open('GET', url, true)
  xhttp.send()
}

const url3 = 'https://rata.digitraffic.fi/api/v1/live-trains/station/HKI?arrived_trains=0&arriving_trains=250&departed_trains=0&departing_trains=250&include_nonstopping=false'
const url = 'https://rata.digitraffic.fi/api/v1/metadata/stations'

const commuterStations = []

const findCommuterStations = stations => {                                          // makes commuter station list
  const commuterTrains = []
  for(let i = 0; i < stations.length; i++)
    if(stations[i].trainCategory === 'Commuter')
      if(!commuterTrains.find(obj => (obj.commuterLineID === stations[i].commuterLineID)))
        commuterTrains.push(stations[i])
  for (let i = 0; i < commuterTrains.length; i++)
    for(j = 0; j < commuterTrains[i].timeTableRows.length; j++)
      if(!commuterStations.find(obj => (obj.stationShortCode === commuterTrains[i].timeTableRows[j].stationShortCode)))
        commuterStations.push({stationShortCode:commuterTrains[i].timeTableRows[j].stationShortCode})
  loadDoc(url,getStations)
}

$("#st").on("mouseover", () => {
    $("#animatible").show()
    if($("#animatible").css('width') !== '100%') 
      $( "#animatible" ).animate({
          "width": "100%"
      }, {
        duration: 1000,
        complete: () => {
            $( "#animatible" ).css({'max-width':'100%'})
        }
    })
})

loadDoc(url3, findCommuterStations)
let st

const getStations = arr => {        
  st = new Map()                                               // datalist-items
  let out = ''
  for(let i = 0; i < arr.length; i++) 
    if(commuterStations.find(obj => (obj.stationShortCode == arr[i].stationShortCode))){
      out += `<option id='${arr[i].stationShortCode}' value='${arr[i].stationName}' style='width:fit-content;'></option>`
      st.set(arr[i].stationShortCode,arr[i].stationName)
    }
  $('#stations').html(out)
}

const showTrains = arr => {
  dispayTrains(getStationDataArray(arr))
}

const createRow = (i,arr) => {                                                        // time table row
  let row = `<tr id='${i}'><td class='starting' style='text-align:center;'>` + 
        `${arr[i].commuterLineID}</td><td class='timeCell' style='padding-left:1em;padding-right:1em;text-align:left;'>`
  if(arr[i].liveEstimateTime) {
    row += `<span style='color:#99ffe6;'>${printLocalTime(arr[i].liveEstimateTime)}` + 
            `</span></td><td style='padding-right:1em;' class='timeCell'>${arr[i].destination}</td>`
    if(arr[i].differenceInMinutes !== 0) 
      row += ` </span><td class='timeCell' style='padding-right:1em;'><span style='color:#ff9933;'> &nbsp;&#916;t:`+
                `${arr[i].differenceInMinutes}min</td>`                                                                     
    else row += `<td class='timeCell'></td>`
  } else if(arr[i].cancelled)
    row += `${printLocalTime(arr[i].scheduledTime)}</td><td style='padding-right:1em;' class='timeCell'>` + 
            `${arr[i].destination}</td><td class='timeCell'><span style='color:#ff9933;'>CANCELLED</span></td>`
  else 
    row += `${printLocalTime(arr[i].scheduledTime)}</td><td style='padding-right:1em;' class='timeCell'>`+ 
            `${arr[i].destination}</td><td class='timeCell'></td>`	                                                 
  row += `<td class='ending' style='text-align:center;'>${arr[i].commercialTrack}</td></tr>`
  return row
}

let statId
let temp2 = null

const dispayTrains = arr => { 
  $('#timeTable').html('')
  let row = ''
  if(statId == temp2){ 
    for(i = 0; i < arr.length; i++) { 
      row += createRow(i,arr)
    }
    $('#timeTable').html(row)
  } else { 
    for(i = 0; i < arr.length; i++) {
      row = createRow(i,arr)
      $(row).appendTo($('#timeTable'))
      showTr($(`#${i}`))
    }
  }
  $('#timeTable').css({'margin-bottom':'0.5em','margin-top':'0.5em'})
  temp2 = statId
  let time = new Date()
  $('#timeperiod').html((time.toTimeString().slice(0,5) + ' - ' + 
  (new Date(time.getTime() + 3600000)).toTimeString().slice(0,5)))
}

const showTr = tr => {
  tr.show()
  tr.find('td').wrapInner('<div style="display: none;" />').parent().find('td > div').slideToggle(800, function(){
    let $set = jQuery(this)
    $set.replaceWith($set.contents())
    $('#bottom-left').slideDown(300)
  })                                                                                                                               
}

const trainI = ['HKI', 'PSL', 'KÄP', 'OLK', 'PMK', 'ML', 'TNA', 'PLA', 'TKL', 'HKH', 'HVK', 'ASO', 'LNÄ', 'LEN', 'VMS', 'AVP', 'RSM', 'KTÖ', 'VEH', 'VKS', 
  'LAV', 'MRL', 'LOH', 'MYR', 'MLO', 'KAN', 'POH', 'HPL', 'KHK', 'ILA', 'PSL', 'HKI']  // for special cases (train I and P, P = reverse(I) ).

const getStationDataArray = array => {
  const stationDataArr = []
  for(i = 0; i < array.length; i++){
    if(array[i].trainCategory === 'Commuter'){ 
        
      let object = array[i].timeTableRows.find(obj => (obj.stationShortCode === statId && obj.type === 'DEPARTURE' && !obj.actualTime))
      object.commuterLineID = array[i].commuterLineID
      object.destination = array[i].timeTableRows[array[i].timeTableRows.length-1].stationShortCode
            
      if((object.commuterLineID == 'I' || object.commuterLineID == 'P') && statId =='PSL'){
        if(!array[i].timeTableRows[2].actualTime){ 
          object = array[i].timeTableRows[2]  
          object.destination = 'LEN'
        } else {
          object = array[i].timeTableRows[60]
          object.destination = 'HKI'
        }
        object.commuterLineID = array[i].commuterLineID
        stationDataArr.push(object)
        continue
      } else if(statId =='LEN'){
        object.destination = 'HKI'
      } else if(object.commuterLineID == 'I' && statId != 'PSL'){
        if(trainI.indexOf(statId) < 13) object.destination = 'LEN'
        else object.destination = 'HKI'
      } else if(object.commuterLineID == 'P' && statId != 'PSL'){
        if(trainI.indexOf(statId) > 13 ) object.destination = 'LEN'
        else object.destination = 'HKI'
      }
      stationDataArr.push(object)
    }
  }
  stationDataArr.sort(compare)
  return stationDataArr
}

const printLocalTime = dateString => {
  const dat = stringToDate(dateString)
  const d = new Date(dat.getTime()-dat.getTimezoneOffset()*60*1000)
  return d.toTimeString().slice(0,8)
}

const stringToDate = s => new Date(
  s.slice(0,4),
  s.slice(5,7),
  s.slice(8,10),
  s.slice(11,13),
  s.slice(14,16),
  s.slice(17,19),0)

const compare = (a,b) => {
  const aDate = (a.liveEstimateTime ? a.liveEstimateTime : a.scheduledTime)
  const bDate = (b.liveEstimateTime ? b.liveEstimateTime : b.scheduledTime)
  if (aDate < bDate)
    return -1
  if (aDate > bDate)
    return 1
  return 0
}

let timer = 0

const getStationData = stationShortCode => {
  const url2 = 'https://rata.digitraffic.fi/api/v1/live-trains/station/' + stationShortCode +
    '?minutes_before_departure=60&minutes_after_departure=0&minutes_before_arrival=0&minutes_after_arrival=0&include_nonstopping=false'
  loadDoc(url2,showTrains)
  timer=setTimeout(getStationData.bind(null,stationShortCode), 20000)                                                                   //updates 3 times in minute
}

const listSelectionHandler = () => {
  const test = $(`#stations option[value='${$('#selectstation').val()}']`).attr('id')
  if(test && test != statId){
    clearTimeout(timer)
    statId = test
    getStationData(statId)
    $('#header,#timeperiod').fadeOut('slow', () => {
      $('#header').html(st.get(statId))
      $('#header,#timeperiod').fadeIn('slow')
      $('#header').change()
    })	
  }
}

const setHeaderFontSize = () => {
  $('#header').css({'font-size':`${Math.round(2*$('#headerSpace').width()/$('#header').text().length)}px`})
  let i = 1
  do {
    $('#header').css({'font-size':`${Math.round(2*$('#headerSpace').width()/$('#header').text().length)-i++}px`})
  } while ($('#header').width() >= $('#headerSpace').width())
}

window.addEventListener('resize', setHeaderFontSize)

$('#header').change(setHeaderFontSize)

$('input[name=station]').mouseover(e => {
  $('input[name=station]').val('')
})
$('#selectstation').click(e => {
  $('input[name=station]').val('')
})

'select change'.split(' ').forEach(e => {
  window.addEventListener(e,listSelectionHandler,false)
})


        
