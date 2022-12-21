import ShiftModel from "../model/ShiftSchema.js";
import SlotModel from '../model/slotSchema.js'
import CalendarModel from "../model/calendarSchema.js";
import userAccount from '../model/userAccountSchema.js'
import breakModel from '../model/breakSchema.js'
import availabilityScheduleModel from '../model/AvailabilityScheduleSchema.js'
import isEmpty from '../utils/isEmpty.js'

import env from 'dotenv'

env.config()

//@route: POST /auth/generate-shift
//@purpose: : post routes to generate shift of a month with respective days by checking in doctors schedule and available slot time
export const generateShift = async (req, res) => {
    // var { date } = req.body

    try {

        // get all doctors
        var getDoctor = await userAccount.find({})

        // get doctor id
        var getDoctorId = getDoctor.map((doctor) => doctor._id)

        // get doctor names
        var getDoctorName = getDoctor.map((doctor) => doctor.name)
        // console.log(getDoctorName);
        // getBreaks
        var getBreaks = await breakModel.find({})

        // get breaks whose break status is true
        var getBreaksTrue = getBreaks.filter((breaks) => breaks.breakStatus === true)

        // get slot
        var getSlot = await SlotModel.find({})

        // get all doctors schedule
        var currentMonth = new Date().getMonth()

        // get calender of current month
        var getCalendar = await CalendarModel.findOne({
            calendarArray: {
                $elemMatch: {
                    dayMonth: currentMonth + 1
                }
            }
        })
        // get calendar array
        var getCalendarArray = getCalendar.calendarArray
        // get the total no days in the month
        var totalDays = getCalendarArray.length

        // Traverse through 1 to total days
        for (let i = 1; i <= 5; i++) {
            // Traverse through all slots
            var dutyHoursAllotedPerDay = 0
            for (let j = 0; j < 24; j++) {
                if (getSlot[j]?.Allotment[i - 1]?.isFulfilled != true) {
                    // Traverse through all doctors
                    for (let k = 0; k < getDoctorId.length; k++) {
                        // get current doctors schdule
                        var getDoctorSchedule = await availabilityScheduleModel.findOne({
                            user: getDoctorId[k]
                        })

                        // get current doctors schedule array day
                        var getDoctorScheduleArrayDay = getDoctorSchedule.schedule.map((day) => day.day)

                        // get current doctors schedule array start time
                        var getDoctorScheduleArrayStartTime = getDoctorSchedule.schedule.map((day) => day.start)

                        // get current doctors schedule array end time
                        var getDoctorScheduleArrayEndTime = getDoctorSchedule.schedule.map((day) => day.end)

                        // get dayName for the dayNumber i
                        var getDayName = getCalendarArray[i - 1].dayName

                        // check if current day is in doctors schedule
                        if (getDoctorScheduleArrayDay.includes(getDayName)) {
                            // get index of current day in doctors schedule array
                            var getDayIndex = getDoctorScheduleArrayDay.indexOf(getDayName)

                            // get start time of current day
                            var getStartTime = getDoctorScheduleArrayStartTime[getDayIndex]
                            // get hour
                            var getStartHour = getStartTime[0] + getStartTime[1]
                            // parseaint gethour
                            var IntgetStartHour = parseInt(getStartHour)
                            // get Am or Pm
                            var getStartAmPm = getStartTime[getStartTime.length - 2] + getStartTime[getStartTime.length - 1]
                            // get end time of current day
                            var getEndTime = getDoctorScheduleArrayEndTime[getDayIndex]
                            // get hour
                            var getEndHour = getEndTime[0] + getEndTime[1]
                            // parseaint gethour
                            var IntgetEndHour = parseInt(getEndHour)
                            // get end am or pm
                            var getEndAmPm = getEndTime[getEndTime.length - 2] + getEndTime[getEndTime.length - 1]


                            var splitSlot = getSlot[j].slotTime.split(' - ');
                            var slotStartTime = splitSlot[0];
                            // get Start hr
                            var getSlotStartHour = slotStartTime[0] + slotStartTime[1]
                            // parseaint gethour
                            var IntgetSlotStartHour = parseInt(getSlotStartHour)
                            // get Am or Pm
                            var getSlotStartAmPm = slotStartTime[slotStartTime.length - 2] + slotStartTime[slotStartTime.length - 1]

                            var slotEndTime = splitSlot[1];
                            // get end hr
                            var getSlotEndHour = slotEndTime[0] + slotEndTime[1]
                            // parseint gethour
                            var IntgetSlotEndHour = parseInt(getSlotEndHour)
                            // get end am or pm
                            var getSlotEndAmPm = slotEndTime[slotEndTime.length - 2] + slotEndTime[slotEndTime.length - 1]

                            if (getSlot[j].isNight === true) {
                                console.log('night');
                                // check if current doctor has opted for night duty
                                if (getDoctor[k].nightDuty === true) {

                                    // check if duty hours alloted is less than dutyHoursPerMonth
                                    if (getDoctor[k].dutyHoursAllotedPerMonth < getDoctor[k].dutyHoursPerMonth) {
                                        // check if duty hours alloted is less than dutyHoursPerday
                                        if (dutyHoursAllotedPerDay < getDoctor[k].dutyHoursPerDay) {

                                            var shiftStartDate = i + '/' + (currentMonth + 1) + '/' + new Date().getFullYear()
                                            var shiftEndDate = i + '/' + (currentMonth + 1) + '/' + new Date().getFullYear()

                                            var shiftStartTime = getSlotStartHour + ' ' + getSlotStartAmPm

                                            var shiftEndTime = getSlotEndHour + ' ' + getSlotEndAmPm

                                            // add 1 to getDoctor[k].dutyHoursAllotedPerMonth
                                            getDoctor[k].dutyHoursAllotedPerMonth = getDoctor[k].dutyHoursAllotedPerMonth + 1
                                            // add 1 to dutyHoursAllotedPerDay
                                            dutyHoursAllotedPerDay = dutyHoursAllotedPerDay + 1
                                            // add 1 to getSlot[j]?.DoctorsAlloted
                                            getSlot[j].Allotment[i - 1].DoctorsAlloted = getSlot[j].Allotment[i - 1]?.DoctorsAlloted + 1

                                            // check if doctorAlloted == doctorneeded
                                            // console.log(getSlot[j].Allotment[i - 1]?.DoctorsAlloted);
                                            if (getSlot[j].Allotment[i - 1]?.DoctorsAlloted === getSlot[j].Allotment[i - 1].DoctorsNeeded) {
                                                // set isFulfilled to true
                                                getSlot[j].Allotment[i - 1].isFulfilled = true
                                            }
                                            // save doctor
                                            await getDoctor[k].save()
                                            // save slot
                                            await getSlot[j].save()
                                            // check if doctor is already in shift
                                            var checkIfDoctorInShift = await ShiftModel.findOne({
                                                doctors: getDoctorId[k],
                                                shiftStartDate: shiftStartDate,
                                                shiftEndDate: shiftEndDate,
                                                shiftStartTime: shiftStartTime,
                                                shiftEndTime: shiftEndTime
                                            })

                                            //    check if shift is already created
                                            var checkIfShiftCreated = await ShiftModel.findOne({
                                                shiftStartDate: shiftStartDate,
                                                shiftEndDate: shiftEndDate,
                                                shiftStartTime: shiftStartTime,
                                                shiftEndTime: shiftEndTime,
                                                slot: getSlot[j]._id
                                            })

                                            if (checkIfShiftCreated === null && checkIfDoctorInShift === null) {
                                                // create shift
                                                var newShift = new ShiftModel({
                                                    doctors: getDoctorId[k],
                                                    shiftStartDate: shiftStartDate,
                                                    shiftEndDate: shiftEndDate,
                                                    shiftStartTime: shiftStartTime,
                                                    shiftEndTime: shiftEndTime,
                                                    slot: getSlot[j]._id
                                                })
                                                await newShift.save()
                                            }
                                            else {
                                                // add doctor to shift
                                                checkIfShiftCreated.doctors.push(getDoctorId[k])
                                                await checkIfShiftCreated.save()
                                            }

                                        }
                                    }
                                }
                            }
                            else if (getSlot[j].isNight === false) {
                                console.log('not night');
                                // check if slot start hour is greater than or equal to doctor start hour
                                if (IntgetSlotStartHour >= IntgetStartHour && IntgetSlotEndHour <= IntgetEndHour) {
                                    // check if Am/Pm matches
                                    // if (getSlotStartAmPm === getStartAmPm && getSlotEndAmPm === getEndAmPm) {
                                        // check if duty hours alloted is less than dutyHoursPerMonth
                                        if (getDoctor[k].dutyHoursAllotedPerMonth < getDoctor[k].dutyHoursPerMonth) {

                                            // check if duty hours alloted is less than dutyHoursPerday
                                            if (getDoctor[k].dutyHoursAllotedPerDay < getDoctor[k].dutyHoursPerDay) {

                                                var shiftStartDate = i + '/' + (currentMonth + 1) + '/' + new Date().getFullYear()
                                                var shiftEndDate = i + '/' + (currentMonth + 1) + '/' + new Date().getFullYear()

                                                var shiftStartTime = getSlotStartHour + ' ' + getSlotStartAmPm

                                                var shiftEndTime = getSlotEndHour + ' ' + getSlotEndAmPm

                                                // add 1 to getDoctor[k].dutyHoursAllotedPerMonth
                                                getDoctor[k].dutyHoursAllotedPerMonth = getDoctor[k].dutyHoursAllotedPerMonth + 1
                                                // add 1 to getSlot[j]?.DoctorsAlloted
                                                getSlot[j].Allotment[i - 1].DoctorsAlloted = getSlot[j].Allotment[i - 1]?.DoctorsAlloted + 1

                                                if (getSlot[j].Allotment[i - 1]?.DoctorsAlloted === getSlot[j].Allotment[i - 1].DoctorsNeeded) {
                                                    // set isFulfilled to true
                                                    getSlot[j].Allotment[i - 1].isFulfilled = true
                                                }
                                                // save doctor
                                                await getDoctor[k].save()
                                                // save slot
                                                await getSlot[j].save()

                                                var checkIfDoctorInShift = await ShiftModel.findOne({
                                                    doctors: getDoctorId[k],
                                                    shiftStartDate: shiftStartDate,
                                                    shiftEndDate: shiftEndDate,
                                                    shiftStartTime: shiftStartTime,
                                                    shiftEndTime: shiftEndTime
                                                })

                                                //    check if shift is already created
                                                var checkIfShiftCreated = await ShiftModel.findOne({
                                                    shiftStartDate: shiftStartDate,
                                                    shiftEndDate: shiftEndDate,
                                                    shiftStartTime: shiftStartTime,
                                                    shiftEndTime: shiftEndTime,
                                                    slot: getSlot[j]._id
                                                })
                                                console.log('not night ', checkIfShiftCreated);
                                                if (checkIfShiftCreated === null && checkIfDoctorInShift === null) {
                                                    // create shift
                                                    var newShift = new ShiftModel({
                                                        doctors: getDoctorId[k],
                                                        shiftStartDate: shiftStartDate,
                                                        shiftEndDate: shiftEndDate,
                                                        shiftStartTime: shiftStartTime,
                                                        shiftEndTime: shiftEndTime,
                                                        slot: getSlot[j]._id
                                                    })
                                                    console.log('not night ', newShift);
                                                    await newShift.save()
                                                }
                                                else {
                                                    // add doctor to shift
                                                    checkIfShiftCreated.doctors.push(getDoctorId[k])
                                                    await checkIfShiftCreated.save()
                                                }

                                            }
                                        }
                                    // }
                                }
                            }
                        }

                    }
                }
            }
        }

    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: POST /shift/create-shift
// @purpose: : post routes to create shift
export const createShift = async (req, res) => {
    const { doctors, shiftStartDate, shiftEndDate, shiftStartTime, shiftEndTime, slot } = req.body
    try {
        var newShift = new ShiftModel({
            doctors,
            shiftStartDate,
            shiftEndDate,
            shiftStartTime,
            shiftEndTime,
            slot
        })
        await newShift.save()
        res.status(200).json({ message: 'Shift created' })
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: GET /shift/get-shifts
// @purpose: : get routes to get all shifts
export const getShifts = async (req, res) => {
    try {
        var getShifts = await ShiftModel.find({})
        res.status(200).json({ message: 'All shifts', data: getShifts })
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: GET /shift/get-shifts-by-date
// @purpose: : get routes to get all shifts by date
export const getShiftsByDate = async (req, res) => {
    const { shiftStartDate, shiftEndDate } = req.body
    try {
        var getShifts = await ShiftModel.find({
            shiftStartDate: shiftStartDate,
            shiftEndDate: shiftEndDate
        })
        res.status(200).json({ message: 'All shifts', data: getShifts })
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: GET /shift/get-shifts-by-doctor
// @purpose: : get routes to get all shifts by doctor
export const getShiftsByDoctor = async (req, res) => {
    const { doctors } = req.body
    try {
        var getShifts = await ShiftModel.find({
            doctors: doctors
        })
        res.status(200).json({ message: 'All shifts', data: getShifts })
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: PUT /shift/update-shift
// @purpose: : put routes to update shift
export const updateShift = async (req, res) => {
    const { doctors, shiftStartDate, shiftEndDate, shiftStartTime, shiftEndTime, slot } = req.body
    try {
        var getShift = await ShiftModel.findOne({
            shiftStartDate: shiftStartDate,
            shiftEndDate: shiftEndDate,
            shiftStartTime: shiftStartTime,
            shiftEndTime: shiftEndTime,
            slot: slot
        })
        if (getShift === null) {
            res.status(400).json({ message: 'Shift not found' })
        }
        else {
            getShift.doctors = doctors
            await getShift.save()
            res.status(200).json({ message: 'Shift updated' })
        }
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: PUT /shift/approve-or-decline
// @purpose: : put routes to approve or decline shift
export const approveOrDecline = async (req, res) => {
    const { shiftStartDate, shiftEndDate, shiftStartTime, shiftEndTime, slot, status } = req.body
    try {
        var getShift = await ShiftModel.findOne({
            shiftStartDate: shiftStartDate,
            shiftEndDate: shiftEndDate,
            shiftStartTime: shiftStartTime,
            shiftEndTime: shiftEndTime,
            slot: slot
        })
        if (getShift === null) {
            res.status(400).json({ message: 'Shift not found' })
        }
        else {
            getShift.status = status
            await getShift.save()
            res.status(200).json({ message: 'Shift updated' })
        }
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: DELETE /shift/delete-shift-by-time
// @purpose: : delete routes to delete shift by date
export const deleteShiftByDate = async (req, res) => {
    const { shiftStartDate, shiftEndDate,shiftStartTime,shiftEndTime } = req.body
    try {
        var getShift = await ShiftModel.findOne({
            shiftStartDate: shiftStartDate,
            shiftEndDate: shiftEndDate,
            shiftStartTime: shiftStartTime,
            shiftEndTime: shiftEndTime
        })
        if (getShift === null) {
            res.status(400).json({ message: 'Shift not found' })
        }
        else {
            await getShift.remove()
            res.status(200).json({ message: 'Shift deleted' })
        }
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: DELETE /shift/delete-all
// @purpose: : delete all shifts
export const deleteAllShifts = async (req, res) => {
    try {
        await ShiftModel.deleteMany({})
        res.status(200).json({ message: 'All shifts deleted' })
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: POST /shift/generate-calendar
// @purpose: : post routes to generate calendar of a month for current year and month
export const generateCalendar = async (req, res) => {
    const { currentMonth } = req.body
    try {
        var getCalendar = await CalendarModel.findOne({
            calendarArray: {
                $elemMatch: {
                    dayMonth: currentMonth + 1
                }
            }
        })
        if (!getCalendar) {
            // get current year
            var currentYear = new Date().getFullYear()
            // get total number of days in a month
            var totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()
            // create array of days
            var daysArray = [...Array(totalDays).keys()].map((i) => i + 1)
            // create calendar array
            var calendarArray = daysArray.map((day) => {
                var date = new Date(currentYear, currentMonth, day)
                var getDay = date.getDay()
                var dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][getDay]
                var dayNumber = day
                var dayMonth = currentMonth + 1
                var dayYear = currentYear
                return {
                    dayName,
                    dayNumber,
                    dayMonth,
                    dayYear
                }
            })
            var newCalendar = new CalendarModel({
                calendarArray: calendarArray
            })
            // save calendar array
            var saveCalendar = await newCalendar.save()
            // console.log(saveCalendar);
            // send calendar array
            res.status(200).json({
                success: true,
                message: "Calendar generated successfully!",
                saveCalendar
            })
        }
        else {
            res.status(200).json({
                success: true,
                message: "Calendar already generated!"
            })
        }
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}



// @route: POST /shift/add-slot
// @purpose: : post routes to add slot
export const addSlot = async (req, res) => {
    const { slotTime, isNight } = req.body
    try {
        var newSlot = new SlotModel({
            slotTime,
            isNight
        })
        // save slot
        var saveSlot = await newSlot.save()
        // send slot
        res.status(200).json({
            success: true,
            message: "Slot added successfully!",
            saveSlot
        })
    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}

// @route: PUT /shift/update-slot
// @purpose: : put routes to update slot
export const updateSlot = async (req, res) => {
    const {
        Allotment,
        slotTime
    } = req.body
    try {
        var getSlot = await SlotModel
            .findOne({
                slotTime
            })
        if (!getSlot) {
            res.status(400).json({
                success: false,
                message: "Slot not found!"
            })
        }
        else {
            // if date is already present then edit the data eeelse create new
            if (!isEmpty(getSlot.Allotment)) {
                // check if current date is already in allotment
                var Present = false
                for (let i = 0; i < getSlot.Allotment.length; i++) {
                    if (getSlot.Allotment[i].date === Allotment[0].date) {
                        Present = true
                        break
                    }
                }
                if (Present) {
                    // find by date and update doctorNeeded
                    var getSlotUpdate = await SlotModel
                        .findOneAndUpdate({
                            slotTime,
                            Allotment: {
                                $elemMatch: {
                                    date: Allotment[0].date
                                }
                            },
                        }, {
                            $set: {
                                "Allotment.$.DoctorsNeeded": Allotment[0].DoctorsNeeded,
                                "Allotment.$.SeniorNeeded": Allotment[0].SeniorNeeded,
                                "Allotment.$.DoctorsAlloted": Allotment[0].DoctorsAlloted,
                                "Allotment.$.SeniorAlloted": Allotment[0].SeniorAlloted,
                                "Allotment.$.isFulfilled": Allotment[0].isFulfilled
                            }
                        }, {
                            new: true
                        })

                    // save
                    var saveSlot = await getSlotUpdate.save()
                    // send slot
                    res.status(200).json({
                        success: true,
                        message: "Slot updated successfully!",
                        saveSlot
                    })
                }
                else {
                    var getSlotUpdate = await SlotModel
                        .findOneAndUpdate({
                            slotTime
                        }, {
                            $push: {
                                Allotment
                            }
                        }, {
                            new: true
                        })
                    // save
                    await getSlotUpdate.save()
                    // send slot
                    res.status(200).json({
                        success: true,
                        message: "Slot updated successfully!",
                        getSlotUpdate
                    })
                }
            }
            else {
                // add data in allotment
                getSlot.Allotment = Allotment
                var saveSlot = await getSlot.save()
                // send slot
                res.status(200).json({
                    success: true,
                    message: "Slot updated successfully!",
                    saveSlot
                })
            }
            // save slot

        }

    }
    catch (err) {
        res.status(400).json({ message: err.message })
    }
}