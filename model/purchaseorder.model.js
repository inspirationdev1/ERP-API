const mongoose = require("mongoose");

const purchaseorderSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  piCode: {
    type: String,
    required: true,
  },
  piNumber: { type: String, default: "" },
  seq: { type: Number, default: 0 },
  invoiceDate: { type: Date, required: true },
  invoiceTime: { type: Date, required: true },
  geolocation: {
    type: mongoose.Schema.ObjectId,
    ref: "Geolocation",
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  paymentStatus: { type: String, default: "pending" },
  status: { type: String, default: "valid" },
  supplier_name: { type: String, default: "" },
  purchasequotations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchasequotation",
    },
  ],
  remarks: { type: String, default: "" },
  month: { type: Number, default: new Date().getMonth() + 1 },
  monthname: { type: String, default: "" },
  year: { type: Number, default: new Date().getFullYear() },
  acctrans: [],
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
purchaseorderSchema.index({ company: 1, piCode: 1 }, { unique: true });
module.exports = mongoose.model("Purchaseorder", purchaseorderSchema);
