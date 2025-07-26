# 🎟️ Event Ticketing Platform

## 📖 Overview

The **Event Ticketing Platform** is a web application that enables users to **create**, **manage**, and **purchase tickets** for events. It offers:

- **Seamless onboarding** for sellers to set up payment accounts via **Paystack**.
- **Secure authentication** with **Clerk**.
- **Robust data management** using **Convex**.
- **Automatic refunds** for cancelled events to ensure customer satisfaction.

Built with **Next.js**, the platform delivers a **modern**, **scalable**, and **user-friendly experience** for both event organizers and attendees.

---

## ✨ Features

- **User Authentication**  
    Secure login and registration powered by **Clerk**.

- **Seller Onboarding**  
    Form for sellers to create **Paystack subaccounts** for payment processing.

- **Event Management**  
    Create, update, and manage events through a dedicated dashboard.

- **Ticket Purchasing**  
    Secure ticket purchasing with **Paystack integration**.

- **Automatic Refunds for Cancelled Events**  
    Automatically process refunds to ticket buyers when an event is cancelled, ensuring smooth financial handling.

- **Responsive UI**  
    Built with **Tailwind CSS** and **shadcn/ui** for a modern, accessible interface.

- **Real-time Data**  
    Backend data management using **Convex** for fast and reliable storage.

---

## 🛠️ Tech Stack

| Layer                | Technology                        |
| -------------------- | --------------------------------- |
| **Frontend**         | Next.js, Tailwind CSS, shadcn/ui  |
| **Backend**          | Next.js API Routes, Convex        |
| **Authentication**   | Clerk                             |
| **Payment**          | Paystack                          |
| **Form Management**  | react-hook-form                   |
| **HTTP Client**      | Axios                             |
| **Type System**      | TypeScript                        |
| **Deployment**       | Vercel _(recommended)_            |

---

## ⚙️ Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **Yarn**
- **Git**
- Accounts for:

  - **Clerk** (authentication)
  - **Paystack** (payment)
  - **Convex** (data management)

---

## 🚀 Installation

### 1️⃣ Clone the Repository

```
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2️⃣ Install Dependencies

```
npm install
# or
yarn install
```

### 3️⃣ Set Up Environment Variables

Create a `.env.local` file in the project root and add:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

✅ Replace:

- `your_clerk_publishable_key` and `your_clerk_secret_key` with your **Clerk API keys**.
- `your_paystack_secret_key` with your **Paystack secret key**.
- `your_convex_url` with your **Convex project URL**.

### 4️⃣ Initialize Convex

```
npx convex dev
```

Follow the prompts to set up your **Convex backend**.

### 5️⃣ Run the Development Server

```
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 Usage

### ✅ Seller Onboarding

1. Navigate to the onboarding form via the **"Create Seller Account"** button.
2. Fill in:

   - **Business Name**
   - **Bank Name**
   - **Account Number**
   - **Business Description**

3. Submit the form to create a **Paystack subaccount**.
4. Upon success, you'll see a **confirmation message**, and the form will reset.

---

### ✅ Event Creation

- Create events with details such as **date**, **location**, and **ticket price**.
- Manage events through a **dedicated dashboard**.

---

### ✅ Ticket Purchasing

- Browse events and **purchase tickets** using Paystack’s **secure payment gateway**.
- Receive confirmation and ticket details upon successful purchase.

---

### ✅ Automatic Refunds for Cancelled Events

- When an event is cancelled by the organizer, all purchased tickets are automatically refunded through Paystack.
- Users receive notification emails confirming their refunds.
- Refund status and history are tracked in the user dashboard for transparency.

---

## 🗂️ Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/             # API routes (server actions) including refund endpoints
│   ├── components/      # React components (e.g., onboarding form, event management, ticket purchasing)
│   └── page.tsx         # Main page
├── lib/                 # Utility functions (e.g., Paystack init, refund processing)
├── convex/              # Convex backend schema, queries, and mutations
├── public/              # Static assets
├── styles/              # Tailwind CSS
├── .env.local           # Environment variables
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

---

## 🖥️ Available Scripts

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `npm run dev`    | Start the development server  |
| `npm run build`  | Build the app for production  |
| `npm run start`  | Start the production server   |
| `npm run lint`   | Run ESLint for code linting   |

---

## 🚀 Deployment

**Recommended: [Vercel](https://vercel.com/)**

1. Push your code to a **GitHub repository**.
2. Connect the repo to Vercel via the **Vercel Dashboard**.
3. Add environment variables in **Vercel’s project settings**.
4. Deploy the app.

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. **Fork** the repository.

2. Create a new branch:

   `
   git checkout -b feature/your-feature
   `

3. Make your changes and commit:

   `
   git commit -m "Add your feature"
   `

4. Push to the branch:

   `
   git push origin feature/your-feature
   `

5. Open a **pull request**.

---

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.

---

## 📬 Contact

For questions or support, contact [franklinolisaemeka3@gmail.com](mailto:franklinolisaemeka3@gmail.com) or open an issue on the **GitHub repository**.

---

## 🙌 Acknowledgments

- **Next.js** — React framework
- **Clerk** — Authentication
- **Paystack** — Payment processing
- **Convex** — Backend data management
- **shadcn/ui** — UI components
- **react-hook-form** — Form management

---
