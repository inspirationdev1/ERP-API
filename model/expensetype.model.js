const mongoose = require("mongoose");

const expensetypeSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  expensetype_name: {
    type: String,
    required: true,
  },
  expensetype_code: {
    type: String,
    required: true,
  },
  taxrate: { type: mongoose.Schema.ObjectId, ref: "Taxrate" },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
expensetypeSchema.index({ company: 1, expensetype_code: 1 }, { unique: true });
expensetypeSchema.index({ company: 1, expensetype_name: 1 }, { unique: true });
module.exports = mongoose.model("Expensetype", expensetypeSchema);
