// src/middlewares/usageQuota.js
import { Conversation } from "../models/Conversation.js";

export const checkUserQuota = async (req, res, next) => {
  const user = req.user;
  
  // Free tier: 100 vision calls/month
  const monthStart = new Date();
  monthStart.setDate(1);
  
  const monthlyVision = await Conversation.aggregate([
    { $match: { user: user._id, updatedAt: { $gte: monthStart } } },
    { $group: { _id: null, totalVision: { $sum: '$visionCount' } } }
  ]);
  
  const totalVisionCalls = monthlyVision[0]?.totalVision || 0;
  
  if (totalVisionCalls > 100) {
    return res.status(403).json({
      message: "Monthly vision quota exceeded. Upgrade required.",
      quotaUsed: totalVisionCalls,
      quotaLimit: 100
    });
  }
  
  next();
};
