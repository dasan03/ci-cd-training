const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
taskSchema.methods.toggleComplete = function() {
  this.completed = !this.completed;
  return this.save();
};

taskSchema.methods.isOverdue = function() {
  return this.dueDate && this.dueDate < new Date() && !this.completed;
};

// Static methods
taskSchema.statics.findByPriority = function(priority) {
  return this.find({ priority });
};

taskSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    completed: false
  });
};

taskSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
        pending: { $sum: { $cond: ['$completed', 0, 1] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$dueDate', new Date()] },
                  { $eq: ['$completed', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || { total: 0, completed: 0, pending: 0, overdue: 0 };
};

module.exports = mongoose.model('Task', taskSchema);