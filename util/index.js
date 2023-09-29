const moment = require('moment');
module.exports = {

  capitalizeFirst: (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  initCap: (string) => {
    string = string.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
    return string;
  },
  generatePromo: () => {
    let char = 'CARS';
    let no = Math.floor(100 + Math.random() * 900);;
    return char.concat(no);
  },
  generateOtp: () => {
    return Math.floor(1000 + Math.random() * 9000);
  },
  generateReferalCode: () => {
    return Math.floor(1000 + Math.random() * 9000);
  },
  generateOrderId: () => {
    // return Math.floor(1000000 + Math.random() * 9000);
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ9876543210';
    let length = 7;
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  },
  generatePassword: () => {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let length = 9;
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  },
  generateProductId: (string) => {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let length = 7;
    var result = string
    for (var i = length; i > 0; --i) result += (chars[Math.round(Math.random() * (chars.length - 1))]).toUpperCase();
    return result;
  },
  generateHHmm: (fromTime) => {
    let start = moment(fromTime, "HH:mm");
    return start;
  },
  generateChatRoom: () => {
    let pwdStr = '' + Math.random().toString(36).substr(2, 9);;
    return Date.now() + pwdStr;
  },
  generateSlots: (fromTime = "09:00", toTime = "18:00", slotTime = 1, breakTime = 0) => {
    let userFee = 0;
    let dealerPortion = 0;
    let start = moment(fromTime, "HH:mm");
    let end = moment(toTime, "HH:mm");
    // differenciate between two dates
    // let minutes = end.diff(start, 'minutes');
    // let interval = moment().hour(0).minute(minutes);
    // let res = interval.format("HH:mm");
    let slotsData = [];
    while (start.isBefore(end)) {
      userFee = userFee + 10
      dealerPortion = dealerPortion + 5;
      let slotObj = {
        fromTime: (start).format('HH:mm'),
        toTime: (start.add(slotTime, 'hours')).format('HH:mm'),
        fees: {
          fee: userFee,
          dealerPortion: dealerPortion,
          cancellation: 5,
          gst: 0.00,
          cgst: 0.00,
          igst: 0.00
        }
      }
      slotsData = [...slotsData, slotObj]
      start.add(breakTime, 'minutes');
    }
    return slotsData;
  },

  // generateSlotsByFromAndToTime: (weekData) => {
  //   // fromTime, toTime, status
  //   let lenFromDate = [];
  //   let slots = [];
  //   // if (Array.isArray(fromTime)) {
  //   //   lenFromDate = (fromTime);
  //   // }
  //   // else {
  //   //   lenFromDate = [...lenFromDate, (fromTime)];
  //   // }
  //   ///

  //   for (let ck = 0; ck < weekData.length; ck++) {

  //     let statusData = weekData[ck].status;
  //     let fromTimeData = weekData[ck].fromTime;
  //     let toTimeData = weekData[ck].toTime;

  //     // let statusData = Array.isArray(status) ? status[ck] : status;
  //     // let fromTimeData = Array.isArray(fromTime) ? fromTime[ck] : fromTime;
  //     // let toTimeData = Array.isArray(toTime) ? toTime[ck] : toTime;
  //     if (fromTimeData && toTimeData) {
  //       let insData = {
  //         fromTime: moment(fromTimeData, "HH:mm").format('HH:mm'),
  //         toTime: moment(toTimeData, "HH:mm").format('HH:mm'),
  //         status: statusData
  //       }
  //       slots = [...slots, insData];
  //     }
  //   } //// end of loop
  //   return slots;
  // },

  // getDayByDate: (inpDate) => {
  //   var weekDayName = moment(inpDate).format('dddd');
  //   return weekDayName.toLowerCase();
  // }
}