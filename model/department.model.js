const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company", required: true },
  department_name: {
    type: String,
    required: true,
  },
  department_code: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
departmentSchema.index({ company: 1, department_code: 1 }, { unique: true });
departmentSchema.index({ company: 1, department_name: 1 }, { unique: true });
module.exports = mongoose.model("Department", departmentSchema);
