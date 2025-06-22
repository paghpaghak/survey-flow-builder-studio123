import type { UserRole } from '@survey-platform/shared-types';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'expert', 'viewer'],
    default: 'viewer',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Обновляем updatedAt перед каждым сохранением
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model('User', userSchema); 