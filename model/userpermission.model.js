const mongoose = require("mongoose");

const userpermissionSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  user: { type: mongoose.Schema.ObjectId, ref: "User" },
  user_name: { type: String, default: null },
  role: { type: mongoose.Schema.ObjectId, ref: "Role" },
  role_name: { type: String, default: null },
  screenId: { type: String, required: true },
  screenName: { type: String, required: true },
  viewflag: { type: Boolean, default: false },
  addflag: { type: Boolean, default: false },
  editflag: { type: Boolean, default: false },
  deleteflag: { type: Boolean, default: false },
  printflag: { type: Boolean, default: false },

  createdAt: { type: Date, default: new Date() },
});

//  Compound unique index
userpermissionSchema.index(
  { company: 1, user: 1, screenId: 1 },
  { unique: true },
);

module.exports = mongoose.model("Userpermission", userpermissionSchema);
