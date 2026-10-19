const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, trim: true, default: "" }
}, { timestamps: true });
module.exports = mongoose.model("Transaction", transactionSchema);
