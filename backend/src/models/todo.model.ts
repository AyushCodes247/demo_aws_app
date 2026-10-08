import { Schema, model } from "mongoose";

export type StatusEnum = "Pending" | "Processing" | "Completed";

export interface ITodo {
  userPublicId: string;
  topicName: string;
  description: string;
  status: StatusEnum;
  dueAt: Date | null;
  reminderAt: Date | null;
  deletedAt: Date | null;
}

const TodoSchema = new Schema<ITodo>(
  {
    userPublicId: {
      type: String,
      required: true,
    },

    topicName: {
      type: String,
      required: true,
      trim: true,
      minLength: [3, "Min length should be at least 3 characters."],
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed"],
      default: "Pending",
      required: true,
    },

    dueAt: {
      type: Date,
      default: null,
    },

    reminderAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

TodoSchema.index({ userPublicId: 1, createdAt: -1 });

TodoSchema.index({
  userPublicId: 1,
  status: 1,
  createdAt: -1,
});

export const Todo = model<ITodo>("Todos", TodoSchema);
