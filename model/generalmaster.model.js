const mongoose = require("mongoose");

const generalmasterSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.ObjectId, ref: 'Company' },
    generalmaster_name: {
        type: String,
        required: true,
    },
    generalmaster_code: {
        type: String,
        required: true,
    },
     generalmaster_type: {
        type: String,
        required: true,
    },
   
    createdAt: { type: Date, default: new Date() }

})

// ✅ Compound unique index
generalmasterSchema.index({ company: 1, generalmaster_code: 1 }, { unique: true });
generalmasterSchema.index({ company: 1, generalmaster_name: 1,generalmaster_type:1 }, { unique: true });
module.exports = mongoose.model("Generalmaster", generalmasterSchema)