const mongoose = require("mongoose");

const goodsreceivedSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  piCode: {
    type: String,
    required: true,
  },

  piNumber: {
    type: String,
    default: "",
  },

  seq: {
    type: Number,
    default: 0,
  },

  invoiceDate: {
    type: Date,
    required: true,
  },

  invoiceTime: {
    type: Date,
    required: true,
  },

  geolocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Geolocation",
    required: true,
  },

  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },

  purchaseorders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchaseorder",
    },
  ],

  paymentStatus: {
    type: String,
    default: "pending",
  },

  status: {
    type: String,
    default: "valid",
  },

  supplier_name: {
    type: String,
    default: "",
  },

  remarks: {
    type: String,
    default: "",
  },

  month: {
    type: Number,
    default: () => new Date().getMonth() + 1,
  },

  monthname: {
    type: String,
    default: "",
  },

  year: {
    type: Number,
    default: () => new Date().getFullYear(),
  },

  acctrans: {
    type: Array,
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

goodsreceivedSchema.index({ company: 1, piCode: 1 }, { unique: true });

module.exports = mongoose.model("Goodsreceived", goodsreceivedSchema);
