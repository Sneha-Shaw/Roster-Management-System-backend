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
    // const { date } = req.body

    try {

        // get all doctors
        const getDoctor = await userAccount.find({})

        // get doctor id
        const getDoctorId = getDoctor.map((doctor) => doctor._id)

        // get doctor names
        const getDoctorName = getDoctor.map((doctor) => doctor.name)
        // console.log(getDoctorName);
        // getBreaks
        const getBreaks = await breakModel.find({})

        // get breaks whose break status is true
        const getBreaksTrue = getBreaks.filter((breaks) => breaks.breakStatus === true)

        // get slot
        const getSlot = await SlotModel.find({})

        // get all doctors schedule
        const currentMonth = new Date().getMonth()

        // get calender of current month
        const getCalendar = await CalendarModel.findOne({
            calendarArray: {
                $elemMatch: {
                    dayMonth: currentMonth + 1
                }
            }
        })
        // get calendar array
        const getCalendarArray = getCalendar.calendarArray
        // get the total no days in the month
        const totalDays = getCalendarArray.length

        // Traverse through 1 to total days
        for (let i = 1; i <= 5; i++) {
            // Traverse through all slots
            for (let j = 0; j < 24; j++) {
                if (getSlot[j]?.Allotment[i - 1]?.isFulfilled != true) {
                    // Traverse through all doctors
                    for (let k = 0; k < getDoctorId.length; k++) {
                        // get current doctors schdule
                        const getDoctorSchedule = await availabilityScheduleModel.findOne({
                            user: getDoctorId[k]
                        })

                        // get current doctors schedule array day
                        const getDoctorScheduleArrayDay = getDoctorSchedule.schedule.map((day) => day.day)

                        // get current doctors schedule array start time
                        const getDoctorScheduleArrayStartTime = getDoctorSchedule.schedule.map((day) => day.start)

                        // get current doctors schedule array end time
                        const getDoctorScheduleArrayEndTime = getDoctorSchedule.schedule.map((day) => day.end)

                        // get dayName for the dayNumber i
                        const getDayName = getCalendarArray[i - 1].dayName

                        // check if current day is in doctors schedule
                        if (getDoctorScheduleArrayDay.includes(getDayName)) {
                            // get index of current day in doctors schedule array
                            const getDayIndex = getDoctorScheduleArrayDay.indexOf(getDayName)

                            // get start time of current day
                            const getStartTime = getDoctorScheduleArrayStartTime[getDayIndex]
                            // get hour
                            const getStartHour = getStartTime[0] + getStartTime[1]
                            // parseaint gethour
                            const IntgetStartHour = parseInt(getStartHour)
                            // get Am or Pm
                            const getStartAmPm = getStartTime[getStartTime.length - 2] + getStartTime[getStartTime.length - 1]
                            // get end time of current day
                            const getEndTime = getDoctorScheduleArrayEndTime[getDayIndex]
                            // get hour
                            const getEndHour = getEndTime[0] + getEndTime[1]
                            // parseaint gethour
                            const IntgetEndHour = parseInt(getEndHour)
                            // get end am or pm
                            const getEndAmPm = getEndTime[getEndTime.length - 2] + getEndTime[getEndTime.length - 1]


                            const splitSlot = getSlot[j].slotTime.split(' - ');
                            const slotStartTime = splitSlot[0];
                            // get Start hr
                            const getSlotStartHour = slotStartTime[0] + slotStartTime[1]
                            // parseaint gethour
                            const IntgetSlotStartHour = parseInt(getSlotStartHour)
                            // get Am or Pm
                            const getSlotStartAmPm = slotStartTime[slotStartTime.length - 2] + slotStartTime[slotStartTime.length - 1]

                            const slotEndTime = splitSlot[1];
                            // get end hr
                            const getSlotEndHour = slotEndTime[0] + slotEndTime[1]
                            // parseint gethour
                            const IntgetSlotEndHour = parseInt(getSlotEndHour)
                            // get end am or pm
                            const getSlotEndAmPm = slotEndTime[slotEndTime.length - 2] + slotEndTime[slotEndTime.length - 1]

                            if (getSlot[j].isNight === true) {
                                console.log('night');
                                // check if current doctor has opted for night duty
                                if (getDoctor[k].nightDuty === true) {

                                    // check if duty hours alloted is less than dutyHoursPerMonth
                                    if (getDoctor[k].dutyHoursAllotedPerMonth < getDoctor[k].dutyHoursPerMonth) {
                                        // check if duty hours alloted is less than dutyHoursPerday
                                        if (getDoctor[k].dutyHoursAllotedPerDay < getDoctor[k].dutyHoursPerDay) {

                                            const shiftStartDate = i + '/' + currentMonth + '/' + new Date().getFullYear()
                                            const shiftEndDate = i + '/' + currentMonth + '/' + new Date().getFullYear()

                                            const shiftStartTime = getSlotStartHour + ' ' + getSlotStartAmPm

                                            const shiftEndTime = getSlotEndHour + ' ' + getSlotEndAmPm

                                            // add 1 to getDoctor[k].dutyHoursAllotedPerMonth
                                            getDoctor[k].dutyHoursAllotedPerMonth = getDoctor[k].dutyHoursAllotedPerMonth + 1
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
                                            const checkIfDoctorInShift = await ShiftModel.findOne({
                                                doctors: getDoctorId[k],
                                                shiftStartDate: shiftStartDate,
                                                shiftEndDate: shiftEndDate,
                                                shiftStartTime: shiftStartTime,
                                                shiftEndTime: shiftEndTime
                                            })

                                            //    check if shift is already created
                                            const checkIfShiftCreated = await ShiftModel.findOne({
                                                shiftStartDate: shiftStartDate,
                                                shiftEndDate: shiftEndDate,
                                                shiftStartTime: shiftStartTime,
                                                shiftEndTime: shiftEndTime,
                                                slot: getSlot[j]._id
                                            })

                                            if (checkIfShiftCreated === null && checkIfDoctorInShift === null) {
                                                // create shift
                                                const newShift = new ShiftModel({
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
                                    if (getSlotStartAmPm === getStartAmPm && getSlotEndAmPm === getEndAmPm) {
                                        // check if duty hours alloted is less than dutyHoursPerMonth
                                        if (getDoctor[k].dutyHoursAllotedPerMonth < getDoctor[k].dutyHoursPerMonth) {

                                            // check if duty hours alloted is less than dutyHoursPerday
                                            if (getDoctor[k].dutyHoursAllotedPerDay < getDoctor[k].dutyHoursPerDay) {

                                                const shiftStartDate = i + '/' + currentMonth + '/' + new Date().getFullYear()
                                                const shiftEndDate = i + '/' + currentMonth + '/' + new Date().getFullYear()

                                                const shiftStartTime = getSlotStartHour + ' ' + getSlotStartAmPm

                                                const shiftEndTime = getSlotEndHour + ' ' + getSlotEndAmPm

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

                                                const checkIfDoctorInShift = await ShiftModel.findOne({
                                                    doctors: getDoctorId[k],
                                                    shiftStartDate: shiftStartDate,
                                                    shiftEndDate: shiftEndDate,
                                                    shiftStartTime: shiftStartTime,
                                                    shiftEndTime: shiftEndTime
                                                })

                                                //    check if shift is already created
                                                const checkIfShiftCreated = await ShiftModel.findOne({
                                                    shiftStartDate: shiftStartDate,
                                                    shiftEndDate: shiftEndDate,
                                                    shiftStartTime: shiftStartTime,
                                                    shiftEndTime: shiftEndTime,
                                                    slot: getSlot[j]._id
                                                })
                                                console.log('not night ', checkIfShiftCreated);
                                                if (checkIfShiftCreated === null && checkIfDoctorInShift === null) {
                                                    // create shift
                                                    const newShift = new ShiftModel({
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
                                    }
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

// @route: POST /shift/generate-calendar
// @purpose: : post routes to generate calendar of a month for current year and month
export const generateCalendar = async (req, res) => {
    const { currentMonth } = req.body
    try {
        const getCalendar = await CalendarModel.findOne({
            calendarArray: {
                $elemMatch: {
                    dayMonth: currentMonth + 1
                }
            }
        })
        if (!getCalendar) {
            // get current year
            const currentYear = new Date().getFullYear()
            // get total number of days in a month
            const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()
            // create array of days
            const daysArray = [...Array(totalDays).keys()].map((i) => i + 1)
            // create calendar array
            const calendarArray = daysArray.map((day) => {
                const date = new Date(currentYear, currentMonth, day)
                const getDay = date.getDay()
                const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][getDay]
                const dayNumber = day
                const dayMonth = currentMonth + 1
                const dayYear = currentYear
                return {
                    dayName,
                    dayNumber,
                    dayMonth,
                    dayYear
                }
            })
            const newCalendar = new CalendarModel({
                calendarArray: calendarArray
            })
            // save calendar array
            const saveCalendar = await newCalendar.save()
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
        const newSlot = new SlotModel({
            slotTime,
            isNight
        })
        // save slot
        const saveSlot = await newSlot.save()
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
        const getSlot = await SlotModel
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
                    const getSlotUpdate = await SlotModel
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
                                "Allotment.$.SeniorNeeded": Allotment[0].SeniorNeeded
                            }
                        }, {
                            new: true
                        })

                    // save
                    const saveSlot = await getSlotUpdate.save()
                    // send slot
                    res.status(200).json({
                        success: true,
                        message: "Slot updated successfully!",
                        saveSlot
                    })
                }
                else {
                    const getSlotUpdate = await SlotModel
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
                const saveSlot = await getSlot.save()
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