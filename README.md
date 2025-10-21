# Subscription Tracker API

A robust Node.js/Express.js API for managing user subscriptions with automated email reminders, built following industry best practices for backend development.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based secure authentication
- **Subscription Management** - CRUD operations for subscription tracking
- **Automated Email Reminders** - Smart workflow-based email notifications
- **Rate Limiting & Security** - Arcjet integration for bot protection and rate limiting
- **Data Validation** - Comprehensive Mongoose schema validation
- **Error Handling** - Centralized error management middleware
- **Database Hooks** - Pre-save hooks for automatic data processing

## 🏗️ Architecture & Best Practices

### 1. **MVC Architecture**

```
├── controllers/     # Business logic layer
├── models/         # Data models with validation
├── routes/         # API route definitions
├── middlewares/    # Custom middleware functions
├── config/         # Configuration files
├── utils/          # Utility functions
└── database/       # Database connection logic
```

### 2. **Mongoose Schema Validation & Hooks**

#### Advanced Schema Validation

```javascript
// User Model - Comprehensive validation
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minLength: [3, "Username must be at least 3 characters long"],
      maxLength: [20, "Username must be at most 20 characters long"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
  },
  { timestamps: true }
);
```

#### Pre-Save Hooks for Business Logic

```javascript
// Subscription Model - Automatic renewal date calculation
subscriptionSchema.pre("save", function (next) {
  if (!this.renewalDate) {
    const renewalPeriods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };
    this.renewalDate = new Date(this.startDate);
    this.renewalDate.setDate(
      this.renewalDate.getDate() + renewalPeriods[this.frequency]
    );
  }

  if (this.renewalDate < new Date()) {
    this.status = "expired";
  }

  next();
});
```

### 3. **Centralized Error Handling**

#### Custom Error Middleware

```javascript
const errorMiddleware = (err, req, res, next) => {
  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new Error(message.join(", "));
    error.statusCode = 400;
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const message = "Duplicate Field Value Entered";
    error = new Error(message);
    error.statusCode = 400;
  }

  // Cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    const message = "Resource Not Found";
    error = new Error(message);
    error.statusCode = 404;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Internal Server Error",
  });
};
```

### 4. **Security Implementation**

#### Arcjet Rate Limiting & Bot Protection

```javascript
const arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const error = new Error("Rate limit exceeded");
        error.statusCode = 429;
        throw error;
      } else if (decision.reason.isBot()) {
        const error = new Error("Bot detected");
        error.statusCode = 403;
        throw error;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
```

#### JWT Authentication Middleware

```javascript
const authorizeUser = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
```

#### Authorization Middleware Implementation

```javascript
// Route-level authorization protection
subscriptionRouter.post("/", authorize, createSubscription);
subscriptionRouter.get("/user/:id", authorize, getUserSubscriptions);
subscriptionRouter.get("/:id", authorize, getSubscription);
subscriptionRouter.put("/:id", authorize, updateSubscription);
subscriptionRouter.delete("/:id", authorize, deleteSubscription);
```

**Key Authorization Features:**

- **Token Extraction**: Automatically extracts JWT from `Authorization: Bearer <token>` header
- **User Validation**: Verifies token signature and checks user existence in database
- **Request Context**: Attaches authenticated user to `req.user` for downstream use
- **Error Handling**: Provides consistent 401 responses for authentication failures
- **Middleware Chain**: Seamlessly integrates with Express.js middleware pipeline

**Security Benefits:**

- Prevents unauthorized access to protected endpoints
- Ensures only authenticated users can manage subscriptions
- Provides user context for data isolation and ownership validation
- Centralizes authentication logic for maintainability

### 5. **Workflow-Based Email System**

#### Upstash Workflow Integration

```javascript
// Trigger workflow for email reminders
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
```

#### Professional Email Templates

- Responsive HTML email templates
- Multiple reminder intervals (7, 5, 2, 1 days before renewal)
- Dynamic content generation
- Professional branding and styling

## 🛠️ Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Arcjet (Rate limiting & Bot protection)
- **Workflows**: Upstash QStash
- **Email**: Nodemailer with Gmail SMTP
- **Environment**: dotenv for configuration management

## 📦 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd subscription-tracker-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

```bash
# Copy the example environment file
cp .env.example .env.development

# Edit the environment variables
nano .env.development
```

4. **Start the development server**

```bash
npm run dev
```

## 🔧 Environment Variables

Create a `.env.development` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
SERVER_URL=http://localhost:3000

# Database Configuration
DB_URI=mongodb://localhost:27017/subscription-tracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Arcjet Security Configuration
ARCJET_KEY=your-arcjet-api-key
ARCJET_ENV=development

# Upstash QStash Configuration
QSTASH_URL=https://qstash.upstash.io/v2
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# Email Configuration
EMAIL_PASS=your-gmail-app-password
```

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

### Subscriptions

- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions/user/:id` - Get user's subscriptions
- `GET /api/v1/subscriptions/:id` - Get specific subscription
- `PUT /api/v1/subscriptions/:id` - Update subscription
- `DELETE /api/v1/subscriptions/:id` - Delete subscription

### Workflows

- `POST /api/v1/workflows/send-reminders` - Trigger email reminders

## 📝 API Usage Examples

### Create Subscription

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Netflix Premium",
    "price": 15.99,
    "frequency": "monthly",
    "currency": "USD",
    "category": "Streaming",
    "paymentMethod": "Credit Card ending in 1234",
    "startDate": "2024-01-15T00:00:00.000Z",
    "renewalDate": "2024-02-15T00:00:00.000Z"
  }'
```

### Get User Subscriptions

```bash
curl -X GET http://localhost:3000/api/v1/subscriptions/user/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

1. **Rate Limiting** - Prevents API abuse with configurable limits
2. **Bot Protection** - Detects and blocks automated requests
3. **JWT Authentication** - Secure token-based authentication
4. **Input Validation** - Comprehensive data validation at schema level
5. **Error Handling** - Secure error responses without sensitive data exposure
6. **CORS Protection** - Configurable cross-origin resource sharing

## 🚀 Deployment Considerations

- Environment-specific configuration files
- Database connection pooling
- Error logging and monitoring
- Health check endpoints
- Graceful shutdown handling

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
