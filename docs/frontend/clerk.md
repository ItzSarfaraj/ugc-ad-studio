# Clerk Implementation — UGC Short Video Ads Generator

> This documentation explains how **Clerk is actually implemented in the UGC Short Video Ads Generator**. It focuses on project implementation rather than general authentication theory.

In this project, Clerk is used for two major purposes:

1. **User Authentication & Management**
2. **Billing & Pricing Plans**

The current frontend integration can be viewed as:

```text
UGC Short Video Ads Generator
│
├── Clerk Authentication
│   ├── Sign In
│   ├── Sign Up
│   ├── Social Login
│   ├── User Session
│   ├── User Information
│   └── User Account
│
└── Clerk Billing
    ├── Pricing Plans
    ├── PricingTable
    └── Subscription Flow
```

---

# 1. Installing Clerk

The project uses React + Vite + TypeScript.

Install the Clerk React package:

```bash
npm install @clerk/react
```

Clerk also provides a separate package containing themes for its prebuilt components:

```bash
npm install @clerk/themes
```

Therefore, the two packages used are:

| Package | Usage |
|---|---|
| `@clerk/react` | Clerk React components, hooks, provider, billing components |
| `@clerk/themes` | Prebuilt Clerk UI themes |

Example imports:

```tsx
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/themes";
```

---

# 2. Creating the Clerk Application

Before Clerk can be used inside React, an application must be created in the **Clerk Dashboard**.

The Clerk application represents our UGC application on Clerk's platform.

After creating the application, Clerk provides credentials that connect our frontend/backend to that Clerk application.

During frontend development, the most important credential is the:

```text
Publishable Key
```

A development publishable key generally starts with:

```text
pk_test_
```

For example:

```text
pk_test_xxxxxxxxxxxxxxxxx
```

We should not repeatedly hardcode this key inside React components.

Instead, it is stored inside an environment variable.

---

# 3. Adding the Clerk Publishable Key

Inside the frontend project, create or update:

```text
.env
```

Add:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key
```

Example project structure:

```text
client/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
│
├── .env
├── package.json
└── vite.config.ts
```

Because this project uses **Vite**, frontend environment variables are accessed through:

```tsx
import.meta.env
```

Therefore:

```tsx
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
```

---

# 4. Why `VITE_` Is Used

Vite only exposes client-side environment variables that use the appropriate `VITE_` prefix.

Therefore:

```env
CLERK_PUBLISHABLE_KEY=...
```

cannot normally be accessed from client-side Vite code as:

```tsx
import.meta.env.CLERK_PUBLISHABLE_KEY
```

Instead, we use:

```env
VITE_CLERK_PUBLISHABLE_KEY=...
```

and access it with:

```tsx
import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
```

---

# 5. Checking Whether the Key Exists

Our `main.tsx` contains:

```tsx
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing publishable key");
}
```

This check prevents the application from silently running with an invalid Clerk configuration.

Without this check:

```text
Missing Environment Variable
        ↓
Clerk receives undefined
        ↓
Authentication fails later
        ↓
Error may be harder to understand
```

With the check:

```text
Application starts
        ↓
Check PUBLISHABLE_KEY
        ↓
      Exists?
      /    \
    Yes     No
     │       │
 Continue   Throw Error
```

Therefore, configuration problems are detected immediately.

---

# 6. Publishable Key vs Secret Key

Clerk provides different keys for different environments.

The two important concepts are:

```text
Publishable Key
Secret Key
```

## Publishable Key

The publishable key is designed for client-side applications.

Example:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

It can be used inside the React frontend.

```tsx
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
```

It is then passed to:

```tsx
<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
```

The publishable key connects the frontend Clerk SDK with our Clerk application.

---

## Secret Key

The secret key is used for trusted server-side operations.

It must **never be placed inside the React frontend**.

For example, this would be dangerous:

```env
VITE_CLERK_SECRET_KEY=sk_...
```

Anything exposed through Vite client-side environment variables can become part of the frontend bundle.

The correct architecture is:

```text
Frontend
│
└── Publishable Key
    pk_...

Backend
│
└── Secret Key
    sk_...
```

When we implement the backend, server-side Clerk configuration will remain inside the backend environment.

---

# 7. Setting Up `ClerkProvider`

The most important Clerk configuration in our frontend is located inside:

```text
main.tsx
```

Our setup is similar to:

```tsx
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/themes";

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing publishable key");
}

createRoot(
  document.getElementById("root")! as HTMLElement
).render(
  <ClerkProvider
    appearance={{
      theme: dark,

      variables: {
        colorPrimary: "#4f39f6",
        colorBackground: "#111113",
      },

      elements: {
        formButtonPrimary: {
          color: "#ffffff",
        },
      },
    }}
    publishableKey={PUBLISHABLE_KEY}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
);
```

---

# 8. What is `ClerkProvider`?

`ClerkProvider` is placed near the root of the React application.

```tsx
<ClerkProvider>
    <App />
</ClerkProvider>
```

It makes Clerk functionality available to components inside it.

Our structure is:

```text
ClerkProvider
      │
      └── BrowserRouter
              │
              └── App
                   │
                   ├── Navbar
                   ├── Home
                   ├── Generate
                   ├── Community
                   ├── Result
                   └── Pricing
```

Because all these components exist underneath `ClerkProvider`, they can use Clerk functionality.

For example, child components can later use:

```tsx
useUser()
```

or:

```tsx
useAuth()
```

and Clerk components such as:

```tsx
<SignInButton />
<UserButton />
<SignedIn />
<SignedOut />
```

---

# 9. Why `ClerkProvider` Wraps the Application

Consider a component deep inside our application:

```text
main.tsx
   │
   └── ClerkProvider
          │
          └── App
               │
               └── Navbar
                     │
                     └── UserButton
```

The `UserButton` needs information about the current Clerk session and user.

Because `Navbar` exists inside `ClerkProvider`, Clerk can provide that information.

Conceptually:

```text
                    ClerkProvider
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      User Data      Session Data   Clerk APIs
          │              │              │
          └──────────────┼──────────────┘
                         │
                   React Components
```

Therefore, `ClerkProvider` acts as the top-level integration point between Clerk and our React component tree.

---

# 10. Passing the Publishable Key

The provider receives:

```tsx
publishableKey={PUBLISHABLE_KEY}
```

Full example:

```tsx
<ClerkProvider
  publishableKey={PUBLISHABLE_KEY}
>
  <App />
</ClerkProvider>
```

This tells the Clerk React SDK which Clerk application it should connect to.

The flow becomes:

```text
.env
 │
 │ VITE_CLERK_PUBLISHABLE_KEY
 ▼
import.meta.env
 │
 ▼
PUBLISHABLE_KEY
 │
 ▼
ClerkProvider
 │
 ▼
Clerk Application
```

---

# 11. Customizing Clerk's Appearance

One advantage of Clerk is that its prebuilt components can be customized to match the application's UI.

Our application uses a dark theme with violet as its primary accent.

We configure this through:

```tsx
appearance={{
  ...
}}
```

Example:

```tsx
<ClerkProvider
  appearance={{
    theme: dark,
    variables: {
      colorPrimary: "#4f39f6",
      colorBackground: "#111113",
    },
  }}
>
```

---

# 12. Using the Dark Theme

We import:

```tsx
import { dark } from "@clerk/themes";
```

Then:

```tsx
appearance={{
  theme: dark
}}
```

This applies Clerk's prebuilt dark styling to authentication components.

Instead of Clerk components looking disconnected from our dark UGC website, they follow a similar dark appearance.

---

# 13. Customizing Clerk Theme Variables

We currently customize:

```tsx
variables: {
  colorPrimary: "#4f39f6",
  colorBackground: "#111113",
}
```

### `colorPrimary`

```tsx
colorPrimary: "#4f39f6"
```

Defines the primary accent used by Clerk components.

Our application uses violet/indigo styling, so this helps Clerk match the rest of the website.

---

### `colorBackground`

```tsx
colorBackground: "#111113"
```

Controls the background of Clerk's UI.

Instead of pure black:

```text
#000000
```

we use slightly lighter dark gray:

```text
#111113
```

This matches the visual style of our UGC application better.

---

# 14. Customizing Individual Clerk Elements

Clerk also allows individual UI elements to be customized.

Example:

```tsx
elements: {
  formButtonPrimary: {
    color: "#ffffff",
  },
}
```

This targets Clerk's primary form button.

In our sign-in UI, the violet Continue button initially displayed dark text.

We changed its text to white using:

```tsx
formButtonPrimary: {
  color: "#ffffff",
}
```

Therefore:

```text
Before

┌──────────────────────────┐
│       Continue           │  Dark text
└──────────────────────────┘


After

┌──────────────────────────┐
│       Continue           │  White text
└──────────────────────────┘
```

This is useful when the default Clerk theme does not perfectly match our application design.

---

# 15. Clerk Appearance Customization Structure

It is useful to remember the basic structure:

```tsx
appearance={{
  theme: dark,

  variables: {
    // Global Clerk design variables
  },

  elements: {
    // Individual Clerk elements
  }
}}
```

Think of it as:

```text
appearance
│
├── theme
│     └── Base Clerk theme
│
├── variables
│     └── Global design tokens
│
└── elements
      └── Specific component customization
```

Example:

```tsx
appearance={{
  theme: dark,

  variables: {
    colorPrimary: "#4f39f6",
    colorBackground: "#111113",
  },

  elements: {
    formButtonPrimary: {
      color: "#ffffff",
    },
  },
}}
```

---

# 16. Clerk Development Keys

While running the application locally, Clerk may display a console message similar to:

```text
Clerk has been loaded with development keys.

Development instances have strict usage limits and
should not be used when deploying your application
to production.
```

This is not an application error.

It means our application currently uses Clerk's **development environment**.

Development keys generally look like:

```text
pk_test_...
```

The flow during development is:

```text
React Development App
        │
        ▼
Development Publishable Key
        │
        ▼
Clerk Development Instance
```

This is expected while building the project.

When the application is prepared for production, we configure Clerk's production environment and production credentials.

---

# 17. Clerk Authentication UI

Clerk provides prebuilt authentication interfaces.

Instead of manually creating:

```text
Email Input
Password Input
Forgot Password
Google Login
Email Verification
Account Management
```

we can use Clerk's components.

Important Clerk components include:

```tsx
SignInButton
SignUpButton
UserButton
SignedIn
SignedOut
SignIn
SignUp
```

These components are available from:

```tsx
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/react";
```

---

# 18. `SignInButton`

`SignInButton` allows us to trigger Clerk's sign-in flow.

Example:

```tsx
import { SignInButton } from "@clerk/react";

function Navbar() {
  return (
    <SignInButton>
      <button>
        Sign In
      </button>
    </SignInButton>
  );
}
```

Here:

```text
Our Button
    │
    ▼
SignInButton
    │
    ▼
Clerk Sign-In Flow
```

The visual button can still be designed by us while Clerk handles the authentication flow.

---

# 19. Opening Sign In as a Modal

Clerk can display authentication in different ways.

For a landing page, a modal is often convenient.

Example:

```tsx
<SignInButton mode="modal">
  <button className="btn-primary">
    Sign In
  </button>
</SignInButton>
```

When the user clicks:

```text
Sign In
   ↓
Clerk modal opens
   ↓
User enters email / chooses OAuth
   ↓
Clerk authenticates user
   ↓
Session created
   ↓
Modal closes
```

This means we don't necessarily need to build a separate `/sign-in` page.

---

# 20. `SignUpButton`

Registration can be triggered similarly:

```tsx
import { SignUpButton } from "@clerk/react";

<SignUpButton mode="modal">
  <button>
    Get Started
  </button>
</SignUpButton>
```

The flow is:

```text
Get Started
     ↓
Clerk Sign-Up Modal
     ↓
User creates account
     ↓
Verification if required
     ↓
Account created
     ↓
Session established
```

---

# 21. `SignedIn` and `SignedOut`

The UI often needs to change depending on whether the user is authenticated.

Clerk provides:

```tsx
<SignedIn>
```

and:

```tsx
<SignedOut>
```

Example:

```tsx
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/react";

function Navbar() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button>
            Sign In
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
```

The resulting behaviour is:

```text
Is User Signed In?
       │
       ├── NO
       │    └── Show Sign In
       │
       └── YES
            └── Show UserButton
```

This allows us to create authentication-aware interfaces without manually maintaining an `isLoggedIn` state.

---

# 22. `UserButton`

After authentication, Clerk provides:

```tsx
<UserButton />
```

Example:

```tsx
import { UserButton } from "@clerk/react";

<UserButton />
```

It displays the authenticated user's profile/avatar and provides access to account-related actions.

Conceptually:

```text
UserButton
│
├── User Avatar
├── Account Management
└── Sign Out
```

Therefore, we do not need to manually create a profile dropdown just to support basic Clerk account management.

---

# 23. Authentication-Aware Navbar Example

A common implementation for our UGC project is:

```tsx
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/react";

const Navbar = () => {
  return (
    <nav>

      <div>
        UGC.ai
      </div>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="btn-primary">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>

    </nav>
  );
};

export default Navbar;
```

The component does not need:

```tsx
const [isLoggedIn, setIsLoggedIn] = useState(false);
```

Clerk already knows the authentication state.

---

# 24. Accessing the Current User with `useUser()`

Sometimes we need more than conditional UI.

For example, we may need:

```text
User ID
Name
Email
Profile Image
```

Clerk provides the:

```tsx
useUser()
```

hook.

Import it:

```tsx
import { useUser } from "@clerk/react";
```

Use it:

```tsx
const { user, isLoaded, isSignedIn } = useUser();
```

Example:

```tsx
const Profile = () => {

  const {
    user,
    isLoaded,
    isSignedIn
  } = useUser();

  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  if (!isSignedIn) {
    return <p>Please sign in.</p>;
  }

  return (
    <div>
      <h1>{user.fullName}</h1>
      <img
        src={user.imageUrl}
        alt="profile"
      />
    </div>
  );
};
```

---

# 25. Understanding `useUser()`

The important values are:

```tsx
const {
  user,
  isLoaded,
  isSignedIn
} = useUser();
```

### `user`

Contains information about the authenticated Clerk user.

Example properties:

```tsx
user.id
user.fullName
user.firstName
user.lastName
user.imageUrl
user.primaryEmailAddress
```

---

### `isLoaded`

Clerk needs a small amount of time to determine the current authentication state when the application loads.

Therefore:

```tsx
isLoaded
```

tells us whether Clerk has finished loading.

Example:

```tsx
if (!isLoaded) {
  return <Loader />;
}
```

---

### `isSignedIn`

Indicates whether the current user is authenticated.

Example:

```tsx
if (!isSignedIn) {
  return <p>Please sign in</p>;
}
```

---

# 26. Example: Getting User Information

```tsx
import { useUser } from "@clerk/react";

const UserInfo = () => {

  const { user } = useUser();

  return (
    <div>

      <img
        src={user?.imageUrl}
        alt="profile"
      />

      <h2>
        {user?.fullName}
      </h2>

      <p>
        {user?.primaryEmailAddress?.emailAddress}
      </p>

    </div>
  );
};
```

The important fields for our application will likely include:

```text
user.id
user.fullName
user.imageUrl
user.primaryEmailAddress
```

---

# 27. Clerk User ID

Every Clerk user receives a unique ID.

For example:

```text
user_2xxxxxxxxxxxxxxxx
```

We can access it using:

```tsx
user.id
```

This ID becomes extremely important when we connect Clerk with our backend.

For example, a generated project might eventually contain:

```ts
{
  id: "project_123",

  userId: "user_abc123",

  productName: "Smart Watch",

  generatedVideo: "...",

  isPublished: false
}
```

This allows us to associate:

```text
Clerk User
     │
     │ user.id
     ▼
Database Project
```

---

# 28. `useAuth()`

Clerk also provides:

```tsx
useAuth()
```

Import:

```tsx
import { useAuth } from "@clerk/react";
```

Example:

```tsx
const {
  isLoaded,
  isSignedIn,
  userId
} = useAuth();
```

`useAuth()` is particularly useful when we care about authentication/session information rather than the complete user profile.

Example:

```tsx
const { userId, isSignedIn } = useAuth();

if (!isSignedIn) {
  return;
}

console.log(userId);
```

---

# 29. `useUser()` vs `useAuth()`

These hooks have related but different purposes.

```text
useUser()
   │
   └── User profile information

useAuth()
   │
   └── Authentication/session information
```

Example:

If we need:

```text
Name
Profile Image
Email
```

use:

```tsx
useUser()
```

If we primarily need:

```text
Is user authenticated?
User ID
Authentication/session functionality
```

use:

```tsx
useAuth()
```

Example:

```tsx
const { user } = useUser();

console.log(user?.fullName);
```

vs:

```tsx
const { userId } = useAuth();

console.log(userId);
```

---

# 30. Clerk Billing

Clerk is not used only for authentication in this project.

Our UGC application also uses **Clerk Billing** for pricing/subscription functionality.

The frontend uses Clerk's:

```tsx
<PricingTable />
```

component.

This allows pricing plans configured through Clerk to be presented directly inside our application.

Our architecture therefore becomes:

```text
                    CLERK
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
    Authentication            Billing
           │                     │
      Sign In              Pricing Plans
      Sign Up              PricingTable
      Sessions             Subscription
      User Data               Flow
```

---

# 31. Importing `PricingTable`

Our pricing component imports:

```tsx
import { PricingTable } from "@clerk/react";
```

Example:

```tsx
import Title from "./Title";
import { PricingTable } from "@clerk/react";
```

`PricingTable` is a prebuilt Clerk component used to display billing plans configured for the Clerk application.

---

# 32. Pricing Component in Our Project

Our current component is:

```tsx
import Title from "./Title";
import { PricingTable } from "@clerk/react";

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-20 bg-white/3 border-t border-white/6"
    >

      <div className="max-w-6xl mx-auto px-4">

        <Title
          title="Pricing"
          heading="Pricing Plans"
          description="Our Pricing plans are simple, transparent and flexible. Choose the plan that best suits your needs."
        />

        <div className="flex flex-wrap items-center justify-center max-w-5xl mx-auto">

          <PricingTable
            appearance={{
              variables: {
                colorBackground: "none",
              },

              elements: {
                pricingTableCardBody:
                  "bg-white/6",

                pricingTableCardHeader:
                  "bg-white/10",

                switchThumb:
                  "bg-white",
              },
            }}
          />

        </div>

      </div>

    </section>
  );
}
```

---

# 33. Understanding the Pricing Component

There are two different responsibilities here:

```text
Pricing Component
│
├── Our React/Tailwind UI
│   │
│   ├── Section
│   ├── Layout
│   ├── Title
│   └── Background
│
└── Clerk
    │
    └── PricingTable
```

We control the surrounding website design.

Clerk handles the billing-specific pricing interface.

---

# 34. `<PricingTable />`

The important Clerk component is:

```tsx
<PricingTable />
```

At a high level:

```text
Pricing Component
       │
       ▼
<PricingTable />
       │
       ▼
Clerk Billing Configuration
       │
       ▼
Available Plans
       │
       ▼
Rendered Pricing UI
```

This means pricing information does not need to be manually duplicated throughout the frontend.

The plans are configured through Clerk's billing configuration, while `PricingTable` renders them in the application.

---

# 35. Why Use a Prebuilt Pricing Table?

Without it, we might manually create something like:

```tsx
<div>
  <h2>Free</h2>
  <p>$0</p>
  <button>
    Get Started
  </button>
</div>

<div>
  <h2>Pro</h2>
  <p>$20/month</p>
  <button>
    Upgrade
  </button>
</div>
```

But displaying pricing cards is only the UI portion.

A real subscription system also needs to understand things such as:

```text
Which plan exists?
Which plan did the user select?
Is the user already subscribed?
What billing interval is selected?
What features/limits belong to the plan?
```

Using Clerk Billing allows more of this subscription infrastructure to stay connected to the same Clerk user/account system.

---

# 36. Styling `PricingTable`

Our application's design uses transparent/dark cards.

Therefore, we customize the Clerk pricing component through:

```tsx
appearance={{
  variables: {},
  elements: {}
}}
```

Our current customization is:

```tsx
appearance={{
  variables: {
    colorBackground: "none",
  },

  elements: {
    pricingTableCardBody:
      "bg-white/6",

    pricingTableCardHeader:
      "bg-white/10",

    switchThumb:
      "bg-white",
  },
}}
```

---

# 37. `colorBackground`

We use:

```tsx
variables: {
  colorBackground: "none"
}
```

This prevents the default Clerk background from visually conflicting with our pricing section.

Our section already has:

```tsx
className="
  py-20
  bg-white/3
  border-t
  border-white/6
"
```

Therefore, we want the Clerk pricing UI to blend with the existing page instead of appearing as a completely separate block.

---

# 38. Styling Pricing Card Body

We customize:

```tsx
pricingTableCardBody: "bg-white/6"
```

This gives the body of each pricing card a subtle translucent white background.

Conceptually:

```text
Pricing Card
│
├── Header
│
└── Body
     │
     └── bg-white/6
```

---

# 39. Styling Pricing Card Header

We use:

```tsx
pricingTableCardHeader: "bg-white/10"
```

This makes the header slightly more visible than the body.

Therefore:

```text
┌────────────────────────────┐
│ Pricing Card Header        │  bg-white/10
├────────────────────────────┤
│                            │
│ Pricing Card Body          │  bg-white/6
│                            │
└────────────────────────────┘
```

This produces a subtle visual hierarchy.

---

# 40. Styling the Billing Switch

We also customize:

```tsx
switchThumb: "bg-white"
```

The pricing table may contain a switch for billing interval selection depending on the configured plans/UI.

The switch thumb is styled white so it remains clearly visible on our dark interface.

---

# 41. Clerk Billing Flow

At a high level, the billing flow can be understood as:

```text
User
  │
  ▼
Pricing Section
  │
  ▼
Clerk PricingTable
  │
  ▼
User Selects Plan
  │
  ▼
Clerk Billing Flow
  │
  ▼
Subscription / Plan State
  │
  ▼
Application Uses Plan Information
```

Later, the backend can use the authenticated user's Clerk identity and billing/entitlement information when deciding whether the user can perform premium operations.

For example:

```text
User requests AI video generation
              │
              ▼
       Backend receives request
              │
              ▼
       Verify authenticated user
              │
              ▼
       Check applicable limits/
       plan or entitlement
              │
        ┌─────┴─────┐
        │           │
      Allowed    Not Allowed
        │           │
        ▼           ▼
    Generate     Reject /
     Video       Upgrade
```

The exact backend implementation will be documented once that part of the project is built.

---

# 42. Clerk's Overall Responsibility in Our Project

At this stage, Clerk's role in the UGC Short Video Ads Generator can be summarized as:

```text
                         Clerk
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      Authentication                   Billing
             │                           │
      ┌──────┼───────┐            ┌──────┼──────┐
      │      │       │            │      │      │
   Sign In Sign Up Session     Pricing  Plans Subscription
      │      │       │          Table
      └──────┼───────┘            │
             │                    │
             └─────────┬──────────┘
                       │
                       ▼
                  React App
                       │
                       ▼
               Express Backend
                    (Later)
                       │
                       ▼
                  Database
```

---

# 43. Current Clerk Frontend Flow

When the UGC application starts:

```text
Browser
   │
   ▼
main.tsx
   │
   ▼
Read
VITE_CLERK_PUBLISHABLE_KEY
   │
   ▼
Validate Key
   │
   ▼
ClerkProvider
   │
   ├── Initialize Clerk
   ├── Restore authentication state
   ├── Provide user/session information
   └── Apply Clerk appearance
   │
   ▼
BrowserRouter
   │
   ▼
App
   │
   ├── Authentication Components
   │
   ├── User Components
   │
   └── PricingTable
```

This is the foundation of Clerk's frontend integration in the project.

---

# 44. Important Clerk APIs Used / Relevant to This Project

The main Clerk APIs/components to remember are:

| Clerk API | Purpose |
|---|---|
| `ClerkProvider` | Initializes Clerk for the React application |
| `SignInButton` | Starts the sign-in flow |
| `SignUpButton` | Starts the sign-up flow |
| `SignedIn` | Renders content for authenticated users |
| `SignedOut` | Renders content for unauthenticated users |
| `UserButton` | User profile/account UI |
| `useUser()` | Access current Clerk user information |
| `useAuth()` | Access authentication/session information |
| `PricingTable` | Displays Clerk Billing pricing plans |
| `dark` | Prebuilt dark theme from `@clerk/themes` |

---

# 45. Files Involved in the Current Clerk Integration

The exact project may evolve, but conceptually Clerk currently appears in files such as:

```text
src/
│
├── main.tsx
│   │
│   └── ClerkProvider
│
├── components/
│   │
│   ├── Navbar.tsx
│   │   └── Authentication UI
│   │
│   └── Pricing.tsx
│       └── PricingTable
│
└── pages/
    │
    └── Authenticated pages
        / user-specific UI
```

And outside `src`:

```text
.env
│
└── VITE_CLERK_PUBLISHABLE_KEY
```

---

# 46. Current Implementation Summary

The complete frontend Clerk setup can be understood in five steps:

```text
STEP 1
Install Clerk
   │
   ▼
@clerk/react
@clerk/themes


STEP 2
Create Clerk Application
   │
   ▼
Obtain Publishable Key


STEP 3
Store Key
   │
   ▼
.env
   │
   ▼
VITE_CLERK_PUBLISHABLE_KEY


STEP 4
Initialize Clerk
   │
   ▼
ClerkProvider
   │
   ├── publishableKey
   └── appearance


STEP 5
Use Clerk Features
   │
   ├── Authentication UI
   ├── User Information
   ├── Session Information
   └── PricingTable / Billing
```

---

# 47. What Will Be Added During Backend Development?

The frontend currently establishes the Clerk client-side integration.

When we begin the backend, the Clerk implementation will become more important.

We will need to understand and document:

```text
React
  │
  │ Authenticated API Request
  ▼
Express
  │
  │ Clerk Authentication Verification
  ▼
Controller
  │
  ├── Identify User
  │
  ├── Validate Ownership
  │
  └── Check Access
  ▼
Database / AI Services
```

The next Clerk topics will therefore include:

- Clerk backend integration
- Protecting Express routes
- Getting the authenticated user on the server
- Connecting Clerk users with project records
- Clerk user IDs in the database
- Webhooks
- Synchronizing user information
- Billing plan / entitlement checks
- Protecting AI generation endpoints
- Development vs production configuration

These topics should be documented **after implementing the backend**, so the documentation reflects the actual project code instead of hypothetical implementation.

---

# 48. Quick Revision

### Install

```bash
npm install @clerk/react
npm install @clerk/themes
```

### Environment Variable

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Read Key

```tsx
const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
```

### Provider

```tsx
<ClerkProvider
  publishableKey={PUBLISHABLE_KEY}
>
  <App />
</ClerkProvider>
```

### Theme

```tsx
import { dark } from "@clerk/themes";
```

```tsx
appearance={{
  theme: dark,

  variables: {
    colorPrimary: "#4f39f6",
    colorBackground: "#111113",
  }
}}
```

### Sign In

```tsx
<SignInButton mode="modal">
  <button>Sign In</button>
</SignInButton>
```

### Conditional UI

```tsx
<SignedOut>
  <SignInButton />
</SignedOut>

<SignedIn>
  <UserButton />
</SignedIn>
```

### Current User

```tsx
const { user } = useUser();
```

### Authentication Information

```tsx
const { userId, isSignedIn } = useAuth();
```

### Billing

```tsx
<PricingTable />
```

### Styled Billing

```tsx
<PricingTable
  appearance={{
    variables: {
      colorBackground: "none",
    },

    elements: {
      pricingTableCardBody: "bg-white/6",
      pricingTableCardHeader: "bg-white/10",
      switchThumb: "bg-white",
    },
  }}
/>
```

---

## Final Project Understanding

Clerk is currently responsible for the **user/account layer and billing UI/infrastructure** of the UGC Short Video Ads Generator.

The frontend initializes Clerk globally through:

```tsx
ClerkProvider
```

The publishable key connects the React application with our Clerk application.

Authentication components such as:

```tsx
SignInButton
SignedIn
SignedOut
UserButton
```

allow the interface to react to the current authentication state.

Hooks such as:

```tsx
useUser()
useAuth()
```

allow our React code to access user and authentication information.

Finally:

```tsx
PricingTable
```

integrates Clerk Billing into the pricing section of the application.

The next major Clerk implementation will happen in the **backend**, where authenticated Clerk users will need to be securely connected to API requests, projects, AI generations, database records, and billing-based access rules.