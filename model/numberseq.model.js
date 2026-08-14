const mongoose = require("mongoose");

const numberseqSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  numberseq_name: { type: String, required: true },
  screen: { type: String, required: true },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  seq: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
numberseqSchema.index({ company: 1, screen: 1 }, { unique: true });
module.exports = mongoose.model("Numberseq", numberseqSchema);
