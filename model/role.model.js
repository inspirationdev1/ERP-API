const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  role_name: { type: String, required: true },
  role_code: { type: String, required: true },
  roleType: { type: String, default: "USER" },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
roleSchema.index({ company: 1, role_code: 1 }, { unique: true });
roleSchema.index({ company: 1, role_name: 1 }, { unique: true });
module.exports = mongoose.model("Role", roleSchema);
