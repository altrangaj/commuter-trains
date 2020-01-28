document.body.onload = () => {
  document.body.style.opacity = 1
}
$("#animatible").hide()

let yPos = window.innerHeight/3
document.getElementById("juttu").style.transform = `translate(0px,${yPos}px)`
document.getElementById("parallax").style.backgroundPositionY=`${0.5*yPos}px`

const addMouseWheelEventListener = scrollHandler => {
  if (window.addEventListener) {
    window.addEventListener("mousewheel", scrollHandler, false);
    window.addEventListener("DOMMouseScroll", scrollHandler, false);
  } 
  else {
    console.log('IE 6/7/8')
    window.attachEvent("onmousewheel", scrollHandler);
  }
}

const parallax = event => {                                                       // Animation step for parallax effect
  const e = window.event || event 
  var delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail))                                                     
  let x = document.getElementById("juttu")
  let x2 = document.getElementById("parallax")
  let dy = delta*70
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
  xhttp.onreadystatechange = () => {
    if (xhttp.readyState === 4 && xhttp.status == 200) {
      cfunc(JSON.parse(xhttp.responseText))
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
            
  let count = 0
  for (let i = 0; i < commuterTrains.length; i++){
    for(j = 0; j < commuterTrains[i].timeTableRows.length; j++)
      if(!commuterStations.find(obj => (obj.stationShortCode === commuterTrains[i].timeTableRows[j].stationShortCode))){
        commuterStations.push({stationShortCode:commuterTrains[i].timeTableRows[j].stationShortCode})
        count++
      }
        
  }
  console.log('commuter stations: ' + count)
  loadDoc(url,getStations)
}

$("#st").on("mouseover", function() {                                             // UI animation (doesn't work with Firefox)
    $("#animatible").show();
    if($("#animatible").css('width') !== '100%') {
    $( "#animatible" ).animate({
        "width": "100%"
    }, {
      duration: 1000,
    complete:function(){
        $( "#animatible" ).css({'max-width':'100%'})
    }
  })}
})

loadDoc(url3, findCommuterStations)

const getStations = arr => {                                                       // datalist-items
  let out = ''
  for(let i = 0; i < arr.length; i++) {
    if(commuterStations.find(obj => (obj.stationShortCode == arr[i].stationShortCode)))
      out += `<option id='${arr[i].stationShortCode}' value='${arr[i].stationName}' style='width:fit-content;'></option>`
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
  var stationDataArr = []
  for(var i = 0; i < array.length; i++){
    if(array[i].trainCategory === 'Commuter'){ 
        
      var object = array[i].timeTableRows.find(obj => (obj.stationShortCode === statId && obj.type === 'DEPARTURE' && !obj.actualTime))
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
  var dat = stringToDate(dateString)
  var d = new Date(dat.getTime()-dat.getTimezoneOffset()*60*1000)
  return d.toTimeString().slice(0,8)
}

const stringToDate = s => {
  var year = s.slice(0,4)
  var month = s.slice(5,7)
  var day = s.slice(8,10)
  var hour = s.slice(11,13)
  var min = s.slice(14,16)
  var sec =s.slice(17,19)
  return new Date(year,month,day,hour,min,sec,0)
}

const compare = (a,b) => {
  var aDate = (a.liveEstimateTime ? a.liveEstimateTime : a.scheduledTime)
  var bDate = (b.liveEstimateTime ? b.liveEstimateTime : b.scheduledTime)
  if (aDate < bDate)
    return -1
  if (aDate > bDate)
    return 1
  return 0
}

var timer = 0

const getStationData = stationShortCode => {
  var url2 = 'https://rata.digitraffic.fi/api/v1/live-trains/station/' + stationShortCode +
    '?minutes_before_departure=60&minutes_after_departure=0&minutes_before_arrival=0&minutes_after_arrival=0&include_nonstopping=false'
  loadDoc(url2,showTrains)
  timer=setTimeout(getStationData.bind(null,stationShortCode), 20000)                                                                   //updates 3 times in minute
}

const listSelectionHandler = () => {
  
  var test = $('#stations option[value="' + $('#selectstation').val() + '"]').attr('id')
  if(test != undefined){
    clearTimeout(timer)
    statId = test
    getStationData(statId)
    $('#header,#timeperiod').fadeOut('slow', function(){
      $('#header').html($('#selectstation').val())
      $('#header,#timeperiod').fadeIn('slow')
    })	
  }
}

$('input[name=station]').mouseover(e => {
  $('input[name=station]').val('')
})
$('#selectstation').click(e => {
  $('input[name=station]').val('')
})

'select change'.split(' ').forEach(function(e){
  window.addEventListener(e,listSelectionHandler,false)
})


        
