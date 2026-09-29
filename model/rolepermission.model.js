const mongoose = require("mongoose");

const rolepermissionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.ObjectId,
    ref: "Company",
  },

  role: {
    type: mongoose.Schema.ObjectId,
    ref: "Role",
    required: true,
  },

  role_name: {
    type: String,
    default: null,
  },

  screenId: {
    type: String,
    required: true,
  },

  screenName: {
    type: String,
    required: true,
  },

  viewflag: {
    type: Boolean,
    default: false,
  },

  addflag: {
    type: Boolean,
    default: false,
  },

  editflag: {
    type: Boolean,
    default: false,
  },

  deleteflag: {
    type: Boolean,
    default: false,
  },

  printflag: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: new Date(),
  },
});

// Company + Role + Screen must be unique
rolepermissionSchema.index(
  {
    company: 1,
    role: 1,
    screenId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Rolepermission", rolepermissionSchema);
