const mongoose = require("mongoose");

const taxrateSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  tax_code: {
    type: String,
    required: true,
  },
  tax_name: {
    type: String,
    required: true,
  },
  tax_percent: {
    type: Number,
    default: 0,
  },
  taxtype: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
taxrateSchema.index({ company: 1, tax_code: 1 }, { unique: true });
module.exports = mongoose.model("Taxrate", taxrateSchema);
