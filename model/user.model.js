const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  email: {
    type: String,
    required: true,
    unique: true, // 👈 unique constraint
    index: true, // 👈 creates index
  },
  name: { type: String, required: true },
  user_code: { type: String, required: true },
  seq: { type: Number, default: 0 },
  role: { type: mongoose.Schema.ObjectId, ref: "Role" },
  user_image: { type: String, default: null },
  public_id: { type: String, default: "" },
  createdAt: { type: Date, default: new Date() },
  password: { type: String, required: true },
});

userSchema.index({ company: 1, user_code: 1 }, { unique: true });
module.exports = mongoose.model("User", userSchema);
