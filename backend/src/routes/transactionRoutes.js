const router = require("express").Router();
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
router.use(auth);

router.get("/", async (req, res) => {
  try { res.json(await Transaction.find({ user: req.userId }).sort({ date: -1, createdAt: -1 })); }
  catch { res.status(500).json({ message: "Could not load transactions" }); }
});

router.post("/", async (req, res) => {
  try {
    const { type, title, category, amount, date, note } = req.body;
    if (!["income", "expense"].includes(type) || !title?.trim() || !category?.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Enter a valid type, title, category, and positive amount" });
    }
    const transaction = await Transaction.create({
      user: req.userId, type, title: title.trim(), category: category.trim(),
      amount: Number(amount), date: date ? new Date(date) : new Date(), note: note || ""
    });
    res.status(201).json(transaction);
  } catch { res.status(500).json({ message: "Could not create transaction" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!deleted) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted" });
  } catch { res.status(400).json({ message: "Invalid transaction ID" }); }
});
module.exports = router;
