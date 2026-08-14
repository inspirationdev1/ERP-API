const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  name: { type: String, required: true },
  code: {
    type: String,
    required: true,
  },
  itemtype: { type: mongoose.Schema.ObjectId, ref: "Itemtype", required: true },
  taxrate: { type: mongoose.Schema.ObjectId, ref: "Taxrate" },
  tax_percent: {
    type: Number,
    default: 0,
  },
  taxtype: {
    type: String,
    default: "inclusive",
  },
  sales_price: { type: Number, default: 0 },
  purchase_price: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
itemSchema.index({ company: 1, code: 1 }, { unique: true });
itemSchema.index({ company: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("Item", itemSchema);
