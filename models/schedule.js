
const {
  Schema,
  model
} = require('mongoose')

const ScheduleStatus = Object.freeze({
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
  INPROGRESS: 'In Progress'
})

const ScheduleSchema = new Schema({
  scheduleId: { type: Schema.Types.Number, unique: true, dropDups: true },
  staffId: {
    type: Schema.Types.String, unique: true, required: true, dropDups: true
  },
  amount: { type: Schema.Types.Number },
  date: { type: Schema.Types.Date },
  enabled: { type: Schema.Types.String },
  status: {
    type: Schema.Types.String,
    enum: Object.values(ScheduleStatus),
    default: ScheduleStatus.PENDING,
    required: true
  },
  authorizedby: { type: Schema.Types.Array },
}, { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } })

const Schedule = model('Schedule', ScheduleSchema)

module.exports = Schedule
