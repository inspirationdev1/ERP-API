const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: true,
    unique: true, // ✅ makes it unique
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // ✅ makes it unique
    trim: true,
  },
  owner_name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipcode: { type: String, required: true },
  country: { type: String, required: true },
  company_image: { type: String, required: true },
  public_id: { type: String, default: "" },
  createdAt: { type: Date, default: new Date() },
  password: { type: String, required: true },
});

module.exports = mongoose.model("Company", companySchema);
