import mongoose from 'mongoose';

const EmailVerificationSchema = new mongoose.Schema(
  {
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    codeExpiresAt: {
      type: Date,
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    verificationExpiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const EmailVerification = mongoose.model('EmailVerification', EmailVerificationSchema);

export default EmailVerification;
