const mongoose = require("mongoose");

const salesinvoiceSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  siCode: {
    type: String,
    required: true,
  },
  siNumber: { type: String, default: "" },
  seq: { type: Number, default: 0 },
  invoiceDate: { type: Date, required: true },
  invoiceTime: { type: Date, required: true },
  geolocation: {
    type: mongoose.Schema.ObjectId,
    ref: "Geolocation",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  paymentStatus: { type: String, default: "pending" },
  status: { type: String, default: "valid" },
  customer_name: { type: String, default: "" },
  remarks: { type: String, default: "" },
  month: { type: Number, default: new Date().getMonth() + 1 },
  monthname: { type: String, default: "" },
  year: { type: Number, default: new Date().getFullYear() },
  acctrans: [],
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
salesinvoiceSchema.index({ company: 1, siCode: 1 }, { unique: true });
module.exports = mongoose.model("Salesinvoice", salesinvoiceSchema);
