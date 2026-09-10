const mongoose = require("mongoose");

const userpermissionSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  user: { type: mongoose.Schema.ObjectId, ref: "User" },
  user_name: { type: String, default: null },
  role: { type: mongoose.Schema.ObjectId, ref: "Role" },
  role_name: { type: String, default: null },
  createdAt: { type: Date, default: new Date() },
});

//  Compound unique index
userpermissionSchema.index({ company: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Userpermission", userpermissionSchema);
