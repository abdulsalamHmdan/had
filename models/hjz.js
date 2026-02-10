const mongoose = require("mongoose");

const hjzSchema = new mongoose.Schema(
  {
    entityName: { type: String, required: true },
    entityType: {
      type: String,
      required: true,
      enum: ["خيري", "خاص", "حكومي"],
    },
    bookerName: { type: String, required: true },
    idNumber: { type: Number, required: true }, // ملاحظة: الـ length لا تعمل مع Number في mongoose، يفضل استخدام match مع String
    bookerPhone: { type: String, required: true },
    managerName: { type: String, required: true },
    managerPhone: { type: String, required: true },
    timePeriod: { 
      type: String, 
      required: true, 
      enum: ["مسائي", "صباحي", "كامل اليوم"] 
    },
    entryTime: { type: String, required: true },
    exitTime: { type: String, required: true },
    expectedCount: { type: String, required: true },
    notes: { type: String, required: true },
    type: { type: String, required: true },
    date: { type: String, required: true },
    accepted: { 
      type: String, 
      required: true, 
      default: "pending", 
      enum: ["pending", "yes", "no"] 
    },
  },
  { timestamps: true }
);

// 1. الفهرس المركب: يمنع تكرار (نفس الجهة + نفس التاريخ + نفس الفترة)
userSchema.index({ entityName: 1, date: 1, timePeriod: 1 }, { unique: true });

// 2. التحقق من تعارض "كامل اليوم" مع الفترات الجزئية
userSchema.pre("save", async function (next) {
  const self = this;

  // البحث عن أي حجز لنفس الجهة ونفس التاريخ
  const existingBookings = await mongoose.model("hjz").find({
    entityName: self.entityName,
    date: self.date,
    _id: { $ne: self._id } // استثناء السجل الحالي في حال التحديث
  });

  for (let booking of existingBookings) {
    // إذا كان الحجز الجديد "كامل اليوم" وهناك حجز سابق (أي فترة كانت)
    if (self.timePeriod === "كامل اليوم" && existingBookings.length > 0) {
      return next(new Error("لا يمكن حجز اليوم كاملاً لوجود حجز مسبق في هذا التاريخ لهذه الجهة."));
    }

    // إذا كان الحجز الجديد "صباحي" أو "مسائي" وهناك حجز سابق "كامل اليوم"
    if ((self.timePeriod === "صباحي" || self.timePeriod === "مسائي") && booking.timePeriod === "كامل اليوم") {
      return next(new Error("هذا التاريخ محجوز مسبقاً (كامل اليوم)."));
    }
  }

  next();
});

module.exports = mongoose.model("hjz", hjzSchema);