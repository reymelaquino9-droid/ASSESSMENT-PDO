import mongoose from 'mongoose';

const EmailTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    html: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);

export default EmailTemplate;
