import asyncHandler from "express-async-handler";
import crypto from "crypto";
import generateToken from "../utils/generateToken.js";
import User from "../models/userModel.js";
import Store from "../models/storeModel.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/emailService.js";

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Normalize email to lowercase for consistent comparison
  const normalizedEmail = email ? email.toLowerCase().trim() : "";

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("Login attempt:", {
      originalEmail: email,
      normalizedEmail,
      storeId: req.storeId,
      storeIdType: req.storeId ? typeof req.storeId : "null",
    });
  }

  let user = null;

  // SAAS: Find user by Email AND Store
  if (req.storeId) {
    // On store subdomain: Find user by email and store ID (case-insensitive email)
    // MongoDB should handle ObjectId comparison automatically, but we'll also try string comparison
    user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
      store: req.storeId,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Login attempt on store subdomain:", {
        email: normalizedEmail,
        storeId: req.storeId,
        storeIdType: typeof req.storeId,
        userFound: user ? "Yes" : "No",
      });
      if (user) {
        console.log("User found by email and store:", {
          userId: user._id,
          userStore: user.store?.toString(),
          requestStore: req.storeId.toString(),
          storeMatch: user.store?.toString() === req.storeId.toString(),
        });
      } else {
        console.log("No user found with email and store combination");
      }
    }

    // If user not found by email and store, try finding by email only and check store match
    // This handles edge cases where store field might not match exactly (ObjectId vs string)
    if (!user) {
      const userByEmail = await User.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
      });

      if (userByEmail) {
        if (process.env.NODE_ENV === "development") {
          console.log("User found by email only:", {
            userId: userByEmail._id,
            userStore: userByEmail.store?.toString(),
            requestStore: req.storeId.toString(),
            hasStore: !!userByEmail.store,
          });
        }

        // Check if the user's store matches the current store (handle ObjectId comparison)
        if (
          userByEmail.store &&
          userByEmail.store.toString() === req.storeId.toString()
        ) {
          user = userByEmail;
          if (process.env.NODE_ENV === "development") {
            console.log(
              "User found by email only, store matches - using this user"
            );
          }
        } else if (!userByEmail.store) {
          // User has no store field - might be a customer who registered before the fix
          // If they're trying to login on a store subdomain, we can link them to this store
          // But first verify password to ensure it's the right user
          if (process.env.NODE_ENV === "development") {
            console.log(
              "User found by email but has no store field - checking password to link to store"
            );
          }
          // We'll verify password later in the flow, but for now note this user
          // Don't set user yet, let password verification happen first
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log("User found by email but store does not match:", {
              userStore: userByEmail.store?.toString(),
              requestStore: req.storeId.toString(),
            });
          }
        }
      }
    }

    // If user still not found, check if user owns the store
    // This handles the case where user registered on main platform (store: null)
    // but then created a store (store.owner = user._id)
    if (!user) {
      // Find the store
      const store = await Store.findById(req.storeId);
      if (store && store.owner) {
        if (process.env.NODE_ENV === "development") {
          console.log("Checking store owner:", {
            storeOwner: store.owner,
            email,
          });
        }

        // Try to find user by email and owner ID (case-insensitive email)
        const potentialOwner = await User.findOne({
          email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
          _id: store.owner,
        });

        if (potentialOwner) {
          if (process.env.NODE_ENV === "development") {
            console.log("Potential owner found, verifying password...");
          }

          // Verify password before setting user
          if (await potentialOwner.matchPassword(password)) {
            user = potentialOwner;
            // Update user's store field to link them to the store and set as admin
            if (
              !user.store ||
              user.store.toString() !== req.storeId.toString()
            ) {
              user.store = req.storeId;
            }
            // Set user as admin since they own the store
            if (!user.isAdmin) {
              user.isAdmin = true;
            }
            await user.save();
            if (process.env.NODE_ENV === "development") {
              console.log("Updated user store field and set as admin");
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("Password mismatch for potential owner");
            }
          }
        } else {
          // Last resort: Find user by email only (case-insensitive) and check if they own any store
          if (process.env.NODE_ENV === "development") {
            console.log("Trying to find user by email only...");
          }
          const userByEmail = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, "i") },
          });

          if (userByEmail) {
            if (process.env.NODE_ENV === "development") {
              console.log("User found by email:", {
                userId: userByEmail._id,
                userStore: userByEmail.store,
                storeOwner: store.owner,
                isOwner: userByEmail._id.toString() === store.owner.toString(),
              });
            }

            // Check if this user owns the store
            if (userByEmail._id.toString() === store.owner.toString()) {
              // Verify password
              if (await userByEmail.matchPassword(password)) {
                user = userByEmail;
                // Update user's store field and set as admin
                if (
                  !user.store ||
                  user.store.toString() !== req.storeId.toString()
                ) {
                  user.store = req.storeId;
                }
                // Set user as admin since they own the store
                if (!user.isAdmin) {
                  user.isAdmin = true;
                }
                await user.save();
                if (process.env.NODE_ENV === "development") {
                  console.log(
                    "Updated user store field and set as admin (fallback)"
                  );
                }
              } else {
                if (process.env.NODE_ENV === "development") {
                  console.log("Password mismatch for store owner");
                }
              }
            }
          }
        }
      }
    }
  } else {
    // On main platform: Find user by email with store: null (case-insensitive email)
    user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
      store: null,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("User found on main platform:", user ? "Yes" : "No");
    }
  }

  // If user not found but we found one by email with no store, verify password and link to store
  if (!user && req.storeId) {
    const userByEmail = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
      store: null, // Only check users with no store (registered before fix)
    });

    if (userByEmail) {
      const isPasswordValid = await userByEmail.matchPassword(password);
      if (isPasswordValid) {
        // Password is correct - link this user to the current store
        user = userByEmail;
        user.store = req.storeId;
        await user.save();
        if (process.env.NODE_ENV === "development") {
          console.log("Linked user to store after password verification");
        }
      }
    }
  }

  // Verify password if user found
  if (user) {
    const isPasswordValid = await user.matchPassword(password);

    if (process.env.NODE_ENV === "development") {
      console.log(
        "Password verification:",
        isPasswordValid ? "Valid" : "Invalid"
      );
    }

    if (isPasswordValid) {
      // Ensure user's store field is set if logging in on store subdomain
      if (
        req.storeId &&
        (!user.store || user.store.toString() !== req.storeId.toString())
      ) {
        user.store = req.storeId;
        await user.save();
        if (process.env.NODE_ENV === "development") {
          console.log("Updated user store field during login");
        }
      }

      // Check if user owns a store and set isAdmin if they do
      if (user.store) {
        const Store = (await import("../models/storeModel.js")).default;
        const store = await Store.findById(user.store);
        if (
          store &&
          store.owner &&
          store.owner.toString() === user._id.toString()
        ) {
          // User owns the store, ensure they're marked as admin
          if (!user.isAdmin) {
            user.isAdmin = true;
            await user.save();
          }
        }
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        res.status(403);
        throw new Error(
          "Please verify your email address before logging in. Check your inbox for the verification link."
        );
      }

      res.json({
        token: generateToken(user._id),
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isEmailVerified: user.isEmailVerified,
      });
      return;
    }
  }

  // If we get here, login failed
  if (process.env.NODE_ENV === "development") {
    console.log("Login failed - Invalid email or password");
  }

  res.status(401);
  throw new Error("Invalid email or password");
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  const userExists = await User.findOne({ email, store: req.storeId });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpires = new Date();
  emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

  const user = await User.create({
    name,
    email,
    password,
    isAdmin: isAdmin ? isAdmin : false,
    store: req.storeId,
    emailVerificationToken,
    emailVerificationExpires,
    isEmailVerified: false,
  });

  let storeSubdomain = null;
  if (req.storeId) {
    const store = await Store.findById(req.storeId);
    if (store) {
      storeSubdomain = store.subdomain;
    }
  }

  try {
    await sendVerificationEmail(
      user.email,
      user.name,
      emailVerificationToken,
      storeSubdomain
    );
    console.log("Verification email sent to:", user.email);
  } catch (emailError) {
    console.error("Error sending verification email:", emailError.message);
    console.error(
      "   User can still register, but must use resend verification endpoint"
    );
  }

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isEmailVerified: user.isEmailVerified,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  // Accessing req.user which is set by authMiddleware
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  // SAAS: Get users for this store only
  const users = await User.find({ store: req.storeId });
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  // SAAS: Ensure we don't delete user from another store
  const user = await User.findOne({ _id: req.params.id, store: req.storeId });

  if (user) {
    await user.deleteOne();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    store: req.storeId,
  }).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, store: req.storeId });

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Verify user email
// @route   GET /api/users/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    res.status(400);
    throw new Error("Verification token is required");
  }

  // Find user with matching token and non-expired token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification token");
  }

  // Verify the email
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  res.json({
    message: "Email verified successfully. You can now log in.",
    isEmailVerified: true,
  });
});

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  // Find user by email and store
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    store: req.storeId,
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isEmailVerified) {
    res.status(400);
    throw new Error("Email is already verified");
  }

  // Generate new verification token
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpires = new Date();
  emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24); // 24 hours expiry

  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = emailVerificationExpires;
  await user.save();

  // Get store subdomain for email verification link
  let storeSubdomain = null;
  if (req.storeId) {
    const store = await Store.findById(req.storeId);
    if (store) {
      storeSubdomain = store.subdomain;
    }
  }

  // Send verification email
  try {
    await sendVerificationEmail(
      user.email,
      user.name,
      emailVerificationToken,
      storeSubdomain
    );
    res.json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (emailError) {
    console.error("Error sending verification email:", emailError);
    res.status(500);
    throw new Error(
      "Error sending verification email. Please try again later."
    );
  }
});

// @desc    Request password reset
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email and store (if on store subdomain)
  // If on main platform, find user with store: null
  let user = await User.findOne({
    email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    store: req.storeId,
  });

  // If not found on store subdomain, try main platform
  if (!user && !req.storeId) {
    user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
      store: null,
    });
  }

  // For security, always return success message even if user doesn't exist
  // This prevents email enumeration attacks
  if (!user) {
    // Still return success to prevent email enumeration
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
    return;
  }

  // Generate password reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date();
  resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;
  await user.save();

  // Get store subdomain for password reset link
  let storeSubdomain = null;
  if (req.storeId) {
    const store = await Store.findById(req.storeId);
    if (store) {
      storeSubdomain = store.subdomain;
    }
  }

  // Send password reset email
  try {
    await sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
      storeSubdomain
    );
    console.log("✅ Password reset email sent to:", user.email);
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (emailError) {
    console.error("❌ Error sending password reset email:", emailError.message);
    // Don't fail the request, but log the error
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }
});

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error("Token and password are required");
  }

  // Find user with matching token and non-expired token
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  // Update password
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({
    message:
      "Password reset successfully. You can now log in with your new password.",
  });
});

export {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
