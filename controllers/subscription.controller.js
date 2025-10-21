import Subscription from "../models/subscription.model.js";
import WorkflowClient from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";
export const createSubscription = async (req, res, next) => {
  try {
    const newSubscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    const { workflowRunId } = await WorkflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/send-reminders`,
      body: {
        subscriptionId: newSubscription._id,
      },
      retries: 0,
      headers: {
        "content-type": "application/json",
      },
    });

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: newSubscription,
      workflowRunId,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    if (!req.params.id) {
      const error = new Error("Subscription ID is required");
      error.statusCode = 400;
      throw error;
    }

    if (req.params.id !== req.user._id) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.user._id });
    res.status(200).json({
      success: true,
      message: "Subscriptions fetched successfully",
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    if (!req.params.id) {
      const error = new Error("Subscription ID is required");
      error.statusCode = 400;
      throw error;
    }
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      message: "Subscription fetched successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    if (!req.params.id) {
      const error = new Error("Subscription ID is required");
      error.statusCode = 400;
      throw error;
    }

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    if (!req.params.id) {
      const error = new Error("Subscription ID is required");
      error.statusCode = 400;
      throw error;
    }

    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) {
      const error = new Error("Subscription not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};
